const API = "https://rv-repair-backend-production.up.railway.app";

const app = document.getElementById("app");

function getLocation() {
  navigator.geolocation.getCurrentPosition(pos => {
    fetch(`${API}/api/techs?lat=${pos.coords.latitude}&lon=${pos.coords.longitude}`)
      .then(res => res.json())
      .then(showResults);
  });
}

function showResults(data) {
  app.innerHTML = `<h2>5 RV Techs Near You</h2>`;

  data.forEach((t, i) => {
    app.innerHTML += `
      <div style="background:#fff;padding:16px;margin:10px;border-radius:12px;">
        <h3>Mobile RV Technician</h3>
        <p>${t.city}, ${t.state}</p>
        <p>${t.distance.toFixed(1)} miles away</p>
        <p>${t.description}</p>
        <button onclick="unlock('${t.name}', '${t.phone}')">
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
