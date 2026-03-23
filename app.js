const SHEET_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vSRkspHvEda3a8NY7xf5XLCMzLZ3tYAY2koiYIe230qrb99z0aAO2VNyOiRdW7rytWHW07NWj3qZ6Ej/pub?output=csv";

const app = document.getElementById("app");

// Convert CSV → JSON
function parseCSV(text) {
  const rows = text.split("\n").map(r => r.split(","));
  const headers = rows[0];

  return rows.slice(1).map(row => {
    let obj = {};
    headers.forEach((h, i) => {
      obj[h.trim()] = row[i];
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

        const results = data.map(t => ({
          ...t,
          distance: getDistance(
            pos.coords.latitude,
            pos.coords.longitude,
            parseFloat(t.latitude),
            parseFloat(t.longitude)
          )
        }))
        .filter(t => !isNaN(t.distance))
        .sort((a, b) => a.distance - b.distance)
        .slice(0, 5);

        showResults(results);
      });
  });
}

const SHEET_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vSRkspHvEda3a8NY7xf5XLCMzLZ3tYAY2koiYIe230qrb99z0aAO2VNyOiRdW7rytWHW07NWj3qZ6Ej/pub?output=csv";

const app = document.getElementById("app");

// Convert CSV → JSON
function parseCSV(text) {
  const rows = text.split("\n").map(r => r.split(","));
  const headers = rows[0];

  return rows.slice(1).map(row => {
    let obj = {};
    headers.forEach((h, i) => {
      obj[h.trim()] = row[i];
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

        const results = data.map(t => ({
          ...t,
          distance: getDistance(
            pos.coords.latitude,
            pos.coords.longitude,
            parseFloat(t.latitude),
            parseFloat(t.longitude)
          )
        }))
        .filter(t => !isNaN(t.distance))
        .sort((a, b) => a.distance - b.distance)
        .slice(0, 5);

        showResults(results);
      });
  });
}

function showResults(data) {
  app.innerHTML = `<h2>5 RV Techs Near You</h2>`;

  data.forEach((t, i) => {
    app.innerHTML += `
      <div style="background:#fff;padding:16px;margin:10px;border-radius:12px;">
        <h3>Mobile RV Technician</h3>
        <p>${t.city}, ${t.state}</p>
        <p>${Number(t.distance).toFixed(1)} miles away</p>
        <p>${t.description}</p>

        <p style="color:gray;">🔒 Unlock to view business name & contact</p>

        <button onclick="unlock('${t.business_name}', '${t.phone}')">
          View Contact
        </button>
      </div>
    `;
  });
}

function unlock(name, phone) {
  alert(`Unlocked!\n${name}\n${phone}`);
}

app.innerHTML = `
  <h1>RV Repair Finder</h1>
  <button onclick="getLocation()">Find Help Near Me</button>
`;
function unlock(name, phone) {
  alert(`Unlocked!\n${name}\n${phone}`);
}

app.innerHTML = `
  <h1>RV Repair Finder</h1>
  <button onclick="getLocation()">Find Help Near Me</button>
`;
