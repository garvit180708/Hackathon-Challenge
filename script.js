// --- API Keys ---
const WEATHER_API_KEY   = 'YOUR_OPENWEATHERMAP_API_KEY';
const UNSPLASH_ACCESS_KEY = 'YOUR_UNSPLASH_API_KEY';

// --- Loading Overlay Controls ---
function toggleLoading(show) {
  const ov = document.getElementById('loadingOverlay');
  if (show) ov.classList.remove('hidden');
  else     ov.classList.add('hidden');
}

// --- Carousel Setup (unchanged) ---
let slideIndex = 0;
fetch('https://restcountries.com/v3.1/all')
  .then(r => r.json())
  .then(data => {
    const dl = document.getElementById('suggestions');
    data.forEach(c => {
      const o = document.createElement('option');
      o.value = c.name.common;
      dl.appendChild(o);
    });
  });
function slide(dir) {
  slideIndex = (slideIndex + dir + 3) % 3;
  document.querySelector('.slides')
          .style.transform = `translateX(-${slideIndex * 100}%)`;
}

// --- Main Search Function ---
async function searchCountry() {
  const country = document.getElementById('countryInput').value.trim();
  if (!country) return alert("Enter a country name!");

  toggleLoading(true);
  try {
    // 1) Country Data
    const res = await fetch(`https://restcountries.com/v3.1/name/${country}`);
    const [countryData] = await res.json();

    // Extended Info...
    const currencies = Object.values(countryData.currencies || {})
                             .map(c=>c.name+' ('+c.symbol+')').join(', ');
    const timezones  = countryData.timezones.join(', ');
    const borders    = countryData.borders?.join(', ') || 'None';
    document.getElementById('countryDetails').innerHTML = `
      <h2>${countryData.name.common} (${countryData.cca2})</h2>
      <img src="${countryData.flags.png}" alt="Flag" width="100"/>
      <p><strong>Capital:</strong> ${countryData.capital?.[0]||'N/A'}</p>
      <p><strong>Population:</strong> ${countryData.population.toLocaleString()}</p>
      <p><strong>Area:</strong> ${countryData.area.toLocaleString()} km²</p>
      <p><strong>Region:</strong> ${countryData.region} / ${countryData.subregion}</p>
      <p><strong>Languages:</strong> ${Object.values(countryData.languages||{}).join(', ')}</p>
      <p><strong>Currencies:</strong> ${currencies}</p>
      <p><strong>Timezones:</strong> ${timezones}</p>
      <p><strong>Borders:</strong> ${borders}</p>
    `;
    document.getElementById('countryDetails').classList.remove('hidden');

    // 2) Weather Data
    const capital = countryData.capital?.[0];
    if (capital) {
      const wRes = await fetch(
        `https://api.openweathermap.org/data/2.5/weather?q=${capital}&appid=${WEATHER_API_KEY}&units=metric`
      );
      const w = await wRes.json();
      document.getElementById('weatherDetails').innerHTML = `
        <h3>Weather in ${capital}</h3>
        <p><strong>Temp:</strong> ${w.main.temp}°C</p>
        <p><strong>Cond:</strong> ${w.weather[0].description}</p>
        <p><strong>Humidity:</strong> ${w.main.humidity}%</p>
        <p><strong>Wind:</strong> ${w.wind.speed} m/s</p>
      `;
      document.getElementById('weatherDetails').classList.remove('hidden');
    }

    // 3) Unsplash Images
    const iRes = await fetch(
      `https://api.unsplash.com/search/photos?query=${country}&client_id=${UNSPLASH_ACCESS_KEY}`
    );
    const imgs = (await iRes.json()).results.slice(0, 6);
    document.getElementById('imageGallery').innerHTML = imgs
      .map(i=>`<img src="${i.urls.small}" alt="${country}">`).join('');
    document.getElementById('imageGallery').classList.remove('hidden');

    // 4) Leaflet Map
    const [lat, lng] = countryData.capitalInfo?.latlng || [];
    if (lat && lng) {
      const mapEl = document.getElementById('map');
      mapEl.classList.remove('hidden');
      if (window.map) window.map.remove();
      window.map = L.map('map').setView([lat, lng], 6);
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors'
      }).addTo(window.map);
      L.marker([lat, lng]).addTo(window.map)
        .bindPopup(`<b>${capital}</b><br>${countryData.name.common}`)
        .openPopup();
    }

  } catch (err) {
    alert('Error loading data—check country name & API keys.');
    console.error(err);
  } finally {
    toggleLoading(false);
  }
}
