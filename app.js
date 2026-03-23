let unlocked = {};

const SHEET_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vSRkspHvEda3a8NY7xf5XLCMzLZ3tYAY2koiYIe230qrb99z0aAO2VNyOiRdW7rytWHW07NWj3qZ6Ej/pub?output=csv";

const app = document.getElementById("app");

let activeFilter = null;

// Convert CSV → JSON
function parseCSV(text) {
  const rows = text.split("\n").map(r => r.trim()).filter(r => r);
  const headers = rows[0].split(",");

  return rows.slice(1).map(row => {
    const values = [];
    let current = "";
    let insideQuotes = false;

    for (let char of row) {
      if (char === '"') {
        insideQuotes = !insideQuotes;
      } else if (char === "," && !insideQuotes) {
        values.push(current);
        current = "";
      } else {
        current += char;
      }
    }
    values.push(current);

    let obj = {};
    headers.forEach((h, i) => {
      obj[h.trim()] = values[i]?.trim().replace(/^"|"$/g, "") || "";
    });

    return obj;
  });
}
// Distance formula
function getDistance(lat1, lon1, lat2, lon2) {
  const R = 3958.8;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) *
    Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) ** 2;

  return R * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
}

function getLocation() {
  navigator.geolocation.getCurrentPosition(pos => {
    fetch(SHEET_URL)
      .then(res => res.text())
      .then(csv => {
        const data = parseCSV(csv);
        console.log(data[0]);
        const results = data.map(t => ({
          ...t,
          distance: getDistance(
            pos.coords.latitude,
            pos.coords.longitude,
            parseFloat(t.latitude || t.Latitude),
            parseFloat(t.longitude || t.Longitude)
          )
        }))
        .filter(t => {
          if (isNaN(t.distance)) return false;
          if (!activeFilter) return true;
          return (t.services || t.Services || "").includes(activeFilter);
        })
        .sort((a, b) => a.distance - b.distance)
        .slice(0, 5);

        showResults(results, "You");
      });
  });
}

  function showResults(data, label = "You") {
  app.innerHTML = `<h2 style="padding:10px;">5 RV Techs Near ${label}</h2>`;

  data.forEach((t, i) => {
    const featured = i === 0;
    const services = t.services || t.Services || "";

    app.innerHTML += `
      <div style="
        background:#fff;
        padding:16px;
        margin:12px;
        border-radius:16px;
        box-shadow:0 4px 12px rgba(0,0,0,0.1);
        ${featured ? "border:2px solid #007bff;" : ""}
      ">
        <h3 style="margin:0 0 8px 0;">
          ${featured ? "⭐ Best Option" : "Mobile RV Technician"}
        </h3>

        <p>${t.city || t.City}, ${t.state || t.State}</p>
        <p><strong>${Number(t.distance).toFixed(1)} miles away</strong></p>

        <div style="margin:8px 0;">
          ${services.includes("Mobile") ? '<span style="background:#e3f2fd;padding:4px 8px;border-radius:8px;margin-right:6px;">Mobile</span>' : ""}
          ${services.includes("Shop") ? '<span style="background:#e8f5e9;padding:4px 8px;border-radius:8px;margin-right:6px;">Shop</span>' : ""}
          ${services.includes("Emergency") ? '<span style="background:#ffebee;padding:4px 8px;border-radius:8px;margin-right:6px;">Emergency</span>' : ""}
        </div>

        <p style="font-size:14px;">${t.description}</p>

        <p style="color:gray;">🔒 Unlock to view business name & contact</p>

        <button 
          style="
            width:100%;
            padding:14px;
            font-size:16px;
            border:none;
            border-radius:10px;
            background:${featured ? "#007bff" : "#333"};
            color:white;
            margin-top:10px;
          "
          onclick="${
            unlocked[t.business_name]
              ? `window.location.href='tel:${t.phone}'`
              : `unlock('${t.business_name}', '${t.phone}', '${t.business_name}')`
          }"
        >
          ${
            unlocked[t.business_name]
              ? "Call Now"
              : (featured ? "View Best Option" : "View Contact")
          }
        </button>
      </div>
    `;
  });
}

function unlock(name, phone, id) {
  window.tempContact = { name, phone, id };

  app.innerHTML = `
    <div style="padding:20px;text-align:center;">
      <h2>Unlock RV Technician</h2>

      <p>Get instant access to contact details.</p>

      <button 
        style="width:90%;padding:16px;font-size:18px;border-radius:12px;background:#007bff;color:white;"
        onclick="completeUnlock()"
      >
        Unlock for $4.99
      </button>
    </div>
  `;
}
function setFilter(filter) {
  activeFilter = filter;
  alert(filter ? `Filter: ${filter}` : "Showing all");
}

function goBack() {
  location.reload();
}

function completeUnlock() {
  const { name, phone, id } = window.tempContact;

  unlocked[id] = true;

  app.innerHTML = `
    <div style="padding:20px;text-align:center;">
      <h2>Contact Unlocked</h2>

      <p><strong>${name}</strong></p>
      <p>${phone}</p>

      <a href="tel:${phone}">
        <button style="width:90%;padding:16px;background:#28a745;color:white;border-radius:12px;">
          Call Now
        </button>
      </a>

      <button onclick="goBack()">Back to Results</button>
    </div>
  `;
}
function searchLocation() {
  const query = document.getElementById("searchInput").value.trim().toLowerCase();

  fetch(SHEET_URL)
    .then(res => res.text())
    .then(csv => {
      const data = parseCSV(csv);

      // STEP 1: find a matching city/zip to get coordinates
      const match = data.find(t => {
        const city = (t.city || "").toLowerCase().trim();
        const zip = (t.zip || "").toLowerCase().trim();
        return city.includes(query) || zip.includes(query);
      });

      if (!match) {
        app.innerHTML = `<h2 style="padding:20px;">No results found</h2>`;
        return;
      }

      const searchLat = parseFloat(match.latitude);
      const searchLon = parseFloat(match.longitude);

      // STEP 2: calculate distance from that location
      const results = data.map(t => ({
        ...t,
        distance: getDistance(
          searchLat,
          searchLon,
          parseFloat(t.latitude),
          parseFloat(t.longitude)
        )
      }))
      .filter(t => !isNaN(t.distance))
      .sort((a, b) => a.distance - b.distance)
      .slice(0, 5);

      const label = query.charAt(0).toUpperCase() + query.slice(1);
        showResults(results, label);
    });
}
app.innerHTML = `
  <h1 style="text-align:center;">RV Repair Finder</h1>

  <div style="padding:10px;text-align:center;">
    <input 
      id="searchInput"
      placeholder="Enter city or zip"
      style="width:80%;padding:12px;border-radius:10px;margin-bottom:10px;"
    />

    <br/>

    <button onclick="searchLocation()">Search</button>
  </div>

  <div style="padding:10px;text-align:center;">
    <button onclick="setFilter('Mobile')">Mobile</button>
    <button onclick="setFilter('Shop')">Shop</button>
    <button onclick="setFilter('Emergency')">Emergency</button>
    <button onclick="setFilter(null)">All</button>
  </div>

  <button 
    style="width:90%;margin:20px auto;display:block;padding:16px;font-size:18px;border-radius:12px;"
    onclick="getLocation()"
  >
    Find Help Near Me
  </button>
`;
