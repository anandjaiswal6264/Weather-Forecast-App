
import { useEffect, useState } from "react";
import {
  CloudSun, Sun, Cloud, CloudRain, CloudDrizzle, CloudSnow,
  CloudLightning, Search, MapPin, Navigation, RefreshCw,
  Droplets, Wind, Thermometer, Sunrise, Sunset, Gauge,
  Eye, Leaf, Moon, CalendarDays, Activity
} from "lucide-react";
import "./App.css";

const API = "https://weather-forecast-app-ey48.onrender.com";

function weatherInfo(code) {
  if (code === 0) return { label: "Clear Sky", Icon: Sun, type: "sunny" };
  if ([1, 2].includes(code)) return { label: "Partly Cloudy", Icon: CloudSun, type: "cloudy" };
  if (code === 3 || [45, 48].includes(code)) return { label: code === 3 ? "Cloudy" : "Fog", Icon: Cloud, type: "cloudy" };
  if ([51, 53, 55, 56, 57].includes(code)) return { label: "Drizzle", Icon: CloudDrizzle, type: "rainy" };
  if ([61, 63, 65, 66, 67, 80, 81, 82].includes(code)) return { label: "Rain", Icon: CloudRain, type: "rainy" };
  if ([71, 73, 75, 77, 85, 86].includes(code)) return { label: "Snow", Icon: CloudSnow, type: "snowy" };
  if ([95, 96, 99].includes(code)) return { label: "Thunderstorm", Icon: CloudLightning, type: "stormy" };
  return { label: "Weather", Icon: CloudSun, type: "cloudy" };
}

function dayName(date) {
  return new Date(date + "T12:00:00").toLocaleDateString("en-IN", {
    weekday: "short", day: "numeric", month: "short"
  });
}

function moonName(phase) {
  if (phase == null) return "Not available";
  if (phase < 0.03 || phase > 0.97) return "New Moon";
  if (phase < 0.22) return "Waxing Crescent";
  if (phase < 0.28) return "First Quarter";
  if (phase < 0.47) return "Waxing Gibbous";
  if (phase < 0.53) return "Full Moon";
  if (phase < 0.72) return "Waning Gibbous";
  if (phase < 0.78) return "Last Quarter";
  return "Waning Crescent";
}

function aqiLabel(aqi) {
  if (aqi == null) return "Not available";
  if (aqi <= 50) return "Good";
  if (aqi <= 100) return "Moderate";
  if (aqi <= 150) return "Unhealthy for sensitive groups";
  if (aqi <= 200) return "Unhealthy";
  if (aqi <= 300) return "Very Unhealthy";
  return "Hazardous";
}

function valueOrDash(value, unit = "") {
  return value == null ? "—" : `${Math.round(value * 10) / 10}${unit}`;
}

function AnimatedWeatherBackground({ type = "cloudy", isNight = false }) {
  const theme = isNight ? "night" : type;

  return (
    <div className={`weather-animation ${theme}`} aria-hidden="true">
      {theme === "sunny" && (
        <>
          <div className="animated-sun">
            <div className="sun-core" />
            <div className="sun-rays" />
          </div>
          <div className="sun-glow" />
        </>
      )}

      {(theme === "cloudy" || theme === "rainy" || theme === "stormy") && (
        <div className="cloud-scene">
          <div className="animated-cloud cloud-one" />
          <div className="animated-cloud cloud-two" />
          <div className="animated-cloud cloud-three" />
        </div>
      )}

      {(theme === "rainy" || theme === "stormy") && (
        <div className="rain-layer">
          {Array.from({ length: 36 }, (_, i) => (
            <span key={i} style={{
              left: `${(i * 37) % 100}%`,
              animationDelay: `${(i % 9) * -0.35}s`,
              animationDuration: `${0.8 + (i % 5) * 0.15}s`
            }} />
          ))}
        </div>
      )}

      {theme === "stormy" && <div className="lightning-flash" />}

      {theme === "snowy" && (
        <div className="snow-layer">
          {Array.from({ length: 35 }, (_, i) => (
            <span key={i} style={{
              left: `${(i * 29) % 100}%`,
              animationDelay: `${(i % 10) * -0.7}s`,
              animationDuration: `${4 + (i % 5)}s`
            }}>❄</span>
          ))}
        </div>
      )}

      {theme === "night" && (
        <>
          <div className="night-moon" />
          <div className="stars-layer">
            {Array.from({ length: 45 }, (_, i) => (
              <span key={i} style={{
                left: `${(i * 31) % 100}%`,
                top: `${(i * 17) % 85}%`,
                animationDelay: `${(i % 7) * 0.4}s`
              }} />
            ))}
          </div>
          <div className="night-cloud cloud-one" />
          <div className="night-cloud cloud-two" />
        </>
      )}
    </div>
  );
}

export default function App() {
  const [city, setCity] = useState("");
  const [weather, setWeather] = useState(null);
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [gpsLoading, setGpsLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [accuracy, setAccuracy] = useState(null);

  async function requestWeather(url) {
    const response = await fetch(url);
    const data = await response.json();
    if (!response.ok) throw new Error(data.detail || "Unable to get weather data.");
    setWeather(data);
    return data;
  }

  async function getLiveLocation() {
    setGpsLoading(true);
    setError("");
    setMessage("Detecting your location...");
    setAccuracy(null);

    if (!navigator.geolocation) {
      setError("Geolocation is not supported by this browser.");
      setGpsLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude, accuracy: gpsAccuracy } = position.coords;
        setAccuracy(gpsAccuracy);
        try {
          const url = `${API}/api/weather/location?latitude=${latitude}&longitude=${longitude}&accuracy=${gpsAccuracy}`;
          const data = await requestWeather(url);
          setCity(data.city || "Current Location");
          setMessage(`Live weather updated. GPS accuracy: ±${Math.round(gpsAccuracy)} m`);
        } catch (err) {
          setError(err.message);
          setMessage("");
        } finally {
          setGpsLoading(false);
        }
      },
      (err) => {
        const messages = {
          1: "Location permission denied. Allow location in browser settings.",
          2: "Device location unavailable. Check Windows Location Services.",
          3: "Location request timed out. Please try again."
        };
        setError(messages[err.code] || "Unable to detect location.");
        setMessage("");
        setGpsLoading(false);
      },
      { enableHighAccuracy: true, timeout: 60000, maximumAge: 0 }
    );
  }

  async function searchCity(event) {
    event.preventDefault();
    if (!city.trim()) {
      setError("Enter a village, town or city name.");
      return;
    }

    setLoading(true);
    setError("");
    setMessage("");
    setSearchResults([]);

    try {
      const response = await fetch(`${API}/api/weather/search/${encodeURIComponent(city.trim())}`);
      const data = await response.json();
      if (!response.ok) throw new Error(data.detail || "Location not found.");
      setSearchResults(data.results || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function chooseLocation(place) {
    setLoading(true);
    setError("");
    setSearchResults([]);
    setMessage(`Loading weather for ${place.name}...`);

    try {
      const url = `${API}/api/weather/location?latitude=${place.latitude}&longitude=${place.longitude}`;
      await requestWeather(url);
      setCity(place.name);
      setMessage(`Weather for ${place.name}, ${place.state || place.country}`);
    } catch (err) {
      setError(err.message);
      setMessage("");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    getLiveLocation();
  }, []);

  const current = weather?.current_weather;
  const air = weather?.air_quality;
  const currentInfo = current ? weatherInfo(current.weather_code) : null;
  const MainIcon = currentInfo?.Icon;
  const isNight = current?.is_day === 0;

  return (
    <div className={`app ${isNight ? "app-night" : ""}`}>
      <AnimatedWeatherBackground
        type={currentInfo?.type || "cloudy"}
        isNight={isNight}
      />

      <header className="topbar">
        <div className="brand">
          <div className="brand-icon"><CloudSun size={30} /></div>
          <div><h1>Weather Aplication</h1><p>Weather Forecast</p></div>
        </div>
        <span className="live-badge"><span /> LIVE WEATHER</span>
      </header>

      <main className="container">
        <section className="intro">
          <span className="eyebrow">YOUR WEATHER DASHBOARD</span>
          <h2>Weather around you</h2>
          <p>Live weather, air quality and forecast.</p>
        </section>

        <section className="search-area">
          <form className="search-form" onSubmit={searchCity}>
            <Search size={20} />
            <input value={city} onChange={(e) => setCity(e.target.value)}
              placeholder="Search village, town or city..." />
            <button disabled={loading}>{loading ? "Searching..." : "Search"}</button>
          </form>

          <button className="gps-button" onClick={getLiveLocation} disabled={gpsLoading}>
            {gpsLoading ? <RefreshCw className="spin" size={18} /> : <Navigation size={18} />}
            {gpsLoading ? "Detecting..." : "Live Location"}
          </button>
        </section>

        {searchResults.length > 0 && (
          <section className="search-results">
            <h3>Select location</h3>
            {searchResults.map((place, index) => (
              <button className="result-row" key={`${place.name}-${index}`}
                onClick={() => chooseLocation(place)}>
                <MapPin size={18} />
                <span>
                  <strong>{place.name}</strong>
                  <small>{[place.state, place.country].filter(Boolean).join(", ")}</small>
                </span>
              </button>
            ))}
          </section>
        )}

        {message && <div className="message"><MapPin size={16} />{message}</div>}
        {accuracy != null && (
          <div className="accuracy">
            GPS accuracy: ±{Math.round(accuracy)} metres
            {accuracy > 1000 ? " (approximate location)" : ""}
          </div>
        )}
        {error && <div className="error">{error}</div>}

        {weather && current && (
          <>
            <section className="hero-card">
              <div className="hero-top">
                <div>
                  <span className="card-label"><MapPin size={14} /> CURRENT WEATHER</span>
                  <h2>{weather.location_name || weather.city}</h2>
                  <p>{weather.timezone}</p>
                </div>
                {MainIcon && <MainIcon className="hero-icon" size={78} />}
              </div>

              <div className="hero-temp">
                <strong>{Math.round(current.temperature)}°</strong>
                <div>
                  <h3>{currentInfo.label}</h3>
                  <p>Feels like {valueOrDash(current.feels_like, "°C")}</p>
                </div>
              </div>

              <div className="hero-details">
                <Metric icon={<Droplets />} label="Humidity" value={valueOrDash(current.humidity, "%")} />
                <Metric icon={<Wind />} label="Wind" value={valueOrDash(current.wind_speed, " km/h")} />
                <Metric icon={<Gauge />} label="Pressure" value={valueOrDash(current.pressure, " hPa")} />
                <Metric icon={<Eye />} label="Visibility" value={valueOrDash(current.visibility / 1000, " km")} />
              </div>

              <div className="coords">
                <span>Lat: {Number(weather.latitude).toFixed(4)}</span>
                <span>Lon: {Number(weather.longitude).toFixed(4)}</span>
                {accuracy != null && <span>GPS: ±{Math.round(accuracy)} m</span>}
              </div>
            </section>

            <section className="section">
              <div className="section-heading">
                <span className="eyebrow">DAILY WEATHER</span>
                <h2>7-Day Forecast</h2>
              </div>
              <div className="forecast-grid">
                {weather.forecast?.map((day) => {
                  const info = weatherInfo(day.weather_code);
                  const DayIcon = info.Icon;
                  return (
                    <article className="forecast-card" key={day.date}>
                      <h3>{dayName(day.date)}</h3>
                      <DayIcon size={34} className="forecast-icon" />
                      <p>{info.label}</p>
                      <div className="forecast-temp">
                        <strong>{Math.round(day.max_temp)}°</strong>
                        <span>{Math.round(day.min_temp)}°</span>
                      </div>
                      <div className="forecast-small"><CloudRain size={14} /> {day.rain_probability ?? "—"}% rain</div>
                      <div className="forecast-small"><Sun size={14} /> UV {valueOrDash(day.uv_max)}</div>
                      <div className="forecast-small"><Wind size={14} /> {valueOrDash(day.wind_max, " km/h")}</div>
                    </article>
                  );
                })}
              </div>
            </section>

            <section className="section">
              <div className="section-heading">
                <span className="eyebrow">AIR QUALITY</span>
                <h2>Air Quality Index</h2>
              </div>
              <div className="air-card">
                <div className="aqi-main">
                  <Leaf size={32} />
                  <div>
                    <span>US AQI</span>
                    <strong>{air?.us_aqi ?? "—"}</strong>
                    <p>{aqiLabel(air?.us_aqi)}</p>
                  </div>
                </div>
                <div className="pollutants">
                  <Metric icon={<Activity />} label="PM2.5" value={valueOrDash(air?.pm2_5, " µg/m³")} />
                  <Metric icon={<Activity />} label="PM10" value={valueOrDash(air?.pm10, " µg/m³")} />
                  <Metric icon={<Activity />} label="Ozone" value={valueOrDash(air?.ozone, " µg/m³")} />
                  <Metric icon={<Activity />} label="EU AQI" value={air?.european_aqi ?? "—"} />
                </div>
              </div>
            </section>

            <section className="section">
              <div className="section-heading">
                <span className="eyebrow">SUN & MOON</span>
                <h2>Sunrise, Sunset & Moon</h2>
              </div>
              <div className="sun-moon-grid">
                <InfoCard icon={<Sunrise />} label="Sunrise" value={weather.forecast?.[0]?.sunrise?.slice(11, 16) || "—"} />
                <InfoCard icon={<Sunset />} label="Sunset" value={weather.forecast?.[0]?.sunset?.slice(11, 16) || "—"} />
                <InfoCard icon={<Moon />} label="Today's Moon" value={moonName(weather.forecast?.[0]?.moon_phase)} />
                <InfoCard icon={<CalendarDays />} label="Full Moon" value={weather.full_moon?.date || "Not in forecast"} />
              </div>
            </section>

            <section className="section">
              <div className="section-heading">
                <span className="eyebrow">MORE DETAILS</span>
                <h2>Weather Conditions</h2>
              </div>
              <div className="metrics-grid">
                <Metric icon={<Sun />} label="Current UV" value={valueOrDash(current.uv_index)} />
                <Metric icon={<Thermometer />} label="Feels Like" value={valueOrDash(current.feels_like, "°C")} />
                <Metric icon={<Droplets />} label="Humidity" value={valueOrDash(current.humidity, "%")} />
                <Metric icon={<Wind />} label="Wind Gusts" value={valueOrDash(current.wind_gusts, " km/h")} />
                <Metric icon={<Gauge />} label="Air Pressure" value={valueOrDash(current.pressure, " hPa")} />
                <Metric icon={<Eye />} label="Visibility" value={valueOrDash(current.visibility / 1000, " km")} />
              </div>
            </section>
          </>
        )}
      </main>

      <footer>Weather data by Open-Meteo · Air quality forecast by CAMS</footer>
    </div>
  );
}

function Metric({ icon, label, value }) {
  return (
    <div className="metric">
      <div className="metric-icon">{icon}</div>
      <div><span>{label}</span><strong>{value}</strong></div>
    </div>
  );
}

function InfoCard({ icon, label, value }) {
  return (
    <div className="info-card">
      <div className="info-icon">{icon}</div>
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}
