let unlocked = JSON.parse(localStorage.getItem("unlocked") || "{}");
let lastResults = [];
let lastLabel = "You";
let activeFilter = null;

const SHEET_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vSRkspHvEda3a8NY7xf5XLCMzLZ3tYAY2koiYIe230qrb99z0aAO2VNyOiRdW7rytWHW07NWj3qZ6Ej/pub?output=csv";

const app = document.getElementById("app");

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
          if (t.distance > 200) return false; // limit to 200 miles
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
  lastResults = data;
  lastLabel = label;

  app.innerHTML = `
    <div class="header">RV Repair Finder</div>

    <div class="container">
      <div class="results-header">
        ${data.length} RV Techs Near ${label}
      </div>
    </div>
  `;

  data.forEach((t, i) => {
    const featured = i === 0;
    const services = Array.isArray(t.services)
      ? t.services.map(s => s.toLowerCase())
      : (t.services || "").toLowerCase();
    console.log("SERVICES:", t.services, "→", services)
    app.innerHTML += `
  <div class="card result-card ${featured ? 'featured' : ''}">
    
    <div class="card-header">
      <div class="card-title">${t.business_name}</div>
    </div>

    <div class="card-sub">
      📍 ${t.city}, ${t.state} 
        <span class="distance-pill">${Math.round(t.distance)} miles</span>
    </div>

    <div class="card-desc">
      ${t.description || 'Trusted RV repair service.'}
    </div>

    <div class="card-tags">
      ${services.includes('mobile') ? '<span class="badge mobile">Mobile</span>' : ''}
      ${services.includes('shop') ? '<span class="badge shop">Shop</span>' : ''}
      ${services.includes('emergency') ? '<span class="badge emergency">Emergency</span>' : ''}
    </div>

    <button 
      class="button primary"
      onclick="${
        unlocked[t.business_name]
          ? `window.location.href='tel:${t.phone}'`
          : `unlock('${t.business_name}', '${t.phone}', '${t.business_name}')`
      }"
    >
      ${
        unlocked[t.business_name]
          ? "📞 Call Now"
          : (featured ? "⭐ View Best Option" : "View Contact")
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

  const chips = document.querySelectorAll('.chip');

  chips.forEach(btn => {
    btn.classList.remove('active');
  });

  chips.forEach(btn => {
    const text = btn.textContent.trim();

    if (
      (filter === null && text === "All") ||
      text === filter
    ) {
      btn.classList.add('active');
    }
  });

  // If results exist → re-run search
  if (lastResults && lastResults.length > 0) {
    if (document.getElementById("searchInput")?.value) {
      searchLocation();
    }
  }
}
function goBack() {
  showResults(lastResults, lastLabel);
}

function completeUnlock() {
  const { name, phone, id } = window.tempContact;

  unlocked[id] = true;
  localStorage.setItem("unlocked", JSON.stringify(unlocked));

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

function handleTyping() {
  const query = document.getElementById("searchInput").value.toLowerCase();

  if (query.length < 2) {
    document.getElementById("suggestions").innerHTML = "";
    return;
  }

  fetch(SHEET_URL)
    .then(res => res.text())
    .then(csv => {
      const data = parseCSV(csv);

      const matches = [];

      data.forEach(t => {
        const city = t.city || "";
        const state = t.state || "";

        const label = `${city}, ${state}`;

        if (
          label.toLowerCase().includes(query) &&
          !matches.includes(label)
        ) {
          matches.push(label);
        }
      });

      const topMatches = matches.slice(0, 5);

      document.getElementById("suggestions").innerHTML =
        topMatches.map(m => `
          <div 
            style="padding:10px;border-bottom:1px solid #eee;cursor:pointer;"
            onclick="selectSuggestion('${m}')"
          >
            ${m}
          </div>
        `).join("");
    });
}

function selectSuggestion(value) {
  document.getElementById("searchInput").value = value;
  document.getElementById("suggestions").innerHTML = "";
}

function searchLocation() {
  const raw = document.getElementById("searchInput").value.trim();

  // STEP 1: geocode the location (Dallas, GA, etc.)
  fetch(`https://rv-repair-backend-production.up.railway.app/api/geocode?q=${encodeURIComponent(raw)}`)
    .then(res => res.json())
    .then(geo => {
      if (!geo || geo.length === 0) {
        app.innerHTML = `<h2 style="padding:20px;">Location not found</h2>`;
        return;
      }

      const searchLat = parseFloat(geo[0].lat);
      const searchLon = parseFloat(geo[0].lon);
      console.log("SEARCH LOCATION:", geo[0]);
      
      // STEP 2: now use your sheet
      fetch(SHEET_URL)
        .then(res => res.text())
        .then(csv => {
          const data = parseCSV(csv);

          const results = data.map(t => ({
            ...t,
            distance: getDistance(
              searchLat,
              searchLon,
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

          const label = raw.charAt(0).toUpperCase() + raw.slice(1);

          showResults(results, label);
        });
    });
}
function renderHome() {
  app.innerHTML = `
    <div class="header">RV Repair Finder</div>

    <div class="container">

      <div class="card">

        <div class="search-bar">
  <div class="input-wrapper">
  <span class="input-icon">📍</span>
  <input 
    id="searchInput"
    class="search-input"
    placeholder="City or Zip (e.g. Dallas, 75001)"
    oninput="handleTyping()"
  />
</div>

  <button class="search-btn" onclick="searchLocation()">
    🔍 Search
  </button>
</div>

<div id="suggestions"></div>
        <div class="filters">
          <button class="chip mobile ${activeFilter === 'Mobile' ? 'active' : ''}" onclick="setFilter('Mobile')">Mobile</button>
          <button class="chip shop ${activeFilter === 'Shop' ? 'active' : ''}" onclick="setFilter('Shop')">Shop</button>
          <button class="chip emergency ${activeFilter === 'Emergency' ? 'active' : ''}" onclick="setFilter('Emergency')">Emergency</button>
          <button class="chip all ${activeFilter === null ? 'active' : ''}" onclick="setFilter(null)">All</button>
        </div>

      </div>

      <button id="findNearbyBtn" onclick="getLocation()">
        📍 Find Help Near Me
      </button>

    </div>
  `;
}
renderHome();
