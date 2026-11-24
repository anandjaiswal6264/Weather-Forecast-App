
from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
import httpx

app = FastAPI(
    title="SkyCast Weather API",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"]
)

WEATHER_URL = "https://api.open-meteo.com/v1/forecast"
AIR_URL = "https://air-quality-api.open-meteo.com/v1/air-quality"
GEOCODING_URL = "https://geocoding-api.open-meteo.com/v1/search"
REVERSE_URL = "https://nominatim.openstreetmap.org/reverse"


async def get_json(url, params, headers=None):
    async with httpx.AsyncClient(timeout=25) as client:
        response = await client.get(url, params=params, headers=headers)
        response.raise_for_status()
        return response.json()


async def get_location_name(latitude, longitude):
    try:
        data = await get_json(
            REVERSE_URL,
            {
                "format": "jsonv2",
                "lat": latitude,
                "lon": longitude,
                "zoom": 18,
                "addressdetails": 1
            },
            headers={"User-Agent": "SkyCastWeatherApp/5.0"}
        )

        address = data.get("address", {})

        village = (
            address.get("village")
            or address.get("hamlet")
            or address.get("isolated_dwelling")
        )

        place = (
            village
            or address.get("town")
            or address.get("suburb")
            or address.get("locality")
            or address.get("municipality")
            or address.get("city")
            or address.get("county")
            or "Your Location"
        )

        district = address.get("county") or address.get("state_district")
        state = address.get("state", "")
        country = address.get("country", "")

        return {
            "city": place,
            "village": village,
            "district": district,
            "state": state,
            "country": country,
            "location_name": ", ".join(
                part for part in [place, district, state, country] if part
            )
        }

    except Exception as error:
        print("Reverse geocoding error:", error)
        return {
            "city": "Your Location",
            "village": None,
            "district": None,
            "state": "",
            "country": "",
            "location_name": "Your Current Location"
        }


async def get_weather(latitude, longitude):
    weather_params = {
        "latitude": latitude,
        "longitude": longitude,
        "current": (
            "temperature_2m,relative_humidity_2m,apparent_temperature,"
            "is_day,precipitation,weather_code,wind_speed_10m,"
            "wind_direction_10m,wind_gusts_10m,pressure_msl,surface_pressure"
        ),
        "hourly": (
            "temperature_2m,relative_humidity_2m,apparent_temperature,"
            "pressure_msl,surface_pressure,visibility,uv_index,"
            "wind_speed_10m,wind_direction_10m,wind_gusts_10m"
        ),
        "daily": (
            "weather_code,temperature_2m_max,temperature_2m_min,"
            "apparent_temperature_max,apparent_temperature_min,"
            "precipitation_probability_max,precipitation_sum,"
            "uv_index_max,wind_speed_10m_max,wind_gusts_10m_max,"
            "sunrise,sunset,moon_phase"
        ),
        "timezone": "auto",
        "forecast_days": 16
    }

    air_params = {
        "latitude": latitude,
        "longitude": longitude,
        "current": (
            "us_aqi,european_aqi,pm10,pm2_5,carbon_monoxide,"
            "nitrogen_dioxide,sulphur_dioxide,ozone"
        ),
        "hourly": (
            "us_aqi,european_aqi,pm10,pm2_5,ozone,"
            "nitrogen_dioxide,sulphur_dioxide"
        ),
        "timezone": "auto",
        "forecast_days": 7
    }

    try:
        weather_data = await get_json(WEATHER_URL, weather_params)
    except Exception as error:
        raise HTTPException(
            status_code=502,
            detail=f"Weather API error: {str(error)}"
        )

    try:
        air_data = await get_json(AIR_URL, air_params)
    except Exception as error:
        print("Air quality API error:", error)
        air_data = {}

    current = weather_data.get("current", {})
    hourly = weather_data.get("hourly", {})
    daily = weather_data.get("daily", {})
    air_current = air_data.get("current", {})
    air_hourly = air_data.get("hourly", {})

    current_time = current.get("time", "")
    hourly_times = hourly.get("time", [])
    air_times = air_hourly.get("time", [])

    hour_index = 0
    for i, time_value in enumerate(hourly_times):
        if time_value == current_time:
            hour_index = i
            break

    air_index = 0
    for i, time_value in enumerate(air_times):
        if time_value == current_time:
            air_index = i
            break

    def hourly_value(key):
        values = hourly.get(key, [])
        if hour_index < len(values):
            return values[hour_index]
        return None

    def air_hourly_value(key):
        values = air_hourly.get(key, [])
        if air_index < len(values):
            return values[air_index]
        return None

    forecast = []
    dates = daily.get("time", [])

    for i, date in enumerate(dates):
        forecast.append({
            "date": date,
            "weather_code": daily["weather_code"][i],
            "max_temp": daily["temperature_2m_max"][i],
            "min_temp": daily["temperature_2m_min"][i],
            "feels_like_max": daily["apparent_temperature_max"][i],
            "feels_like_min": daily["apparent_temperature_min"][i],
            "rain_probability": daily["precipitation_probability_max"][i],
            "precipitation": daily["precipitation_sum"][i],
            "uv_max": daily["uv_index_max"][i],
            "wind_max": daily["wind_speed_10m_max"][i],
            "wind_gust_max": daily["wind_gusts_10m_max"][i],
            "sunrise": daily["sunrise"][i],
            "sunset": daily["sunset"][i],
            "moon_phase": daily["moon_phase"][i]
        })

    # Estimate next full moon from the daily moon-phase forecast.
    # Moon phase: 0 = new moon, 0.5 = full moon.
    full_moon = None
    for day in forecast:
        phase = day.get("moon_phase")
        if phase is not None and abs(phase - 0.5) <= 0.08:
            full_moon = {
                "date": day["date"],
                "phase": phase,
                "label": "Approximate full moon"
            }
            break

    return {
        "latitude": weather_data.get("latitude"),
        "longitude": weather_data.get("longitude"),
        "timezone": weather_data.get("timezone"),
        "current_weather": {
            "temperature": current.get("temperature_2m"),
            "feels_like": current.get("apparent_temperature"),
            "humidity": current.get("relative_humidity_2m"),
            "wind_speed": current.get("wind_speed_10m"),
            "wind_direction": current.get("wind_direction_10m"),
            "wind_gusts": current.get("wind_gusts_10m"),
            "pressure": current.get("pressure_msl"),
            "surface_pressure": current.get("surface_pressure"),
            "visibility": hourly_value("visibility"),
            "uv_index": hourly_value("uv_index"),
            "precipitation": current.get("precipitation"),
            "weather_code": current.get("weather_code"),
            "is_day": current.get("is_day"),
            "time": current_time
        },
        "air_quality": {
            "us_aqi": air_current.get("us_aqi"),
            "european_aqi": air_current.get("european_aqi"),
            "pm10": air_current.get("pm10"),
            "pm2_5": air_current.get("pm2_5"),
            "ozone": air_current.get("ozone"),
            "carbon_monoxide": air_current.get("carbon_monoxide"),
            "nitrogen_dioxide": air_current.get("nitrogen_dioxide"),
            "sulphur_dioxide": air_current.get("sulphur_dioxide"),
            "hourly_us_aqi": air_hourly_value("us_aqi")
        },
        "forecast": forecast[:7],
        "full_moon": full_moon
    }


@app.get("/")
async def home():
    return {
        "message": "SkyCast Weather API is running",
        "version": "5.0.0"
    }


@app.get("/api/weather/location")
async def live_weather(
    latitude: float = Query(..., ge=-90, le=90),
    longitude: float = Query(..., ge=-180, le=180),
    accuracy: float | None = Query(None, gt=0)
):
    data = await get_weather(latitude, longitude)
    location = await get_location_name(latitude, longitude)

    data.update(location)
    data["location_accuracy"] = accuracy
    data["location_source"] = "GPS"

    return data


@app.get("/api/weather/search/{city}")
async def search_city(city: str):
    try:
        data = await get_json(
            GEOCODING_URL,
            {
                "name": city,
                "count": 5,
                "language": "en",
                "format": "json"
            }
        )
    except Exception as error:
        raise HTTPException(
            status_code=502,
            detail=f"Location search error: {str(error)}"
        )

    results = data.get("results", [])

    if not results:
        raise HTTPException(
            status_code=404,
            detail="Location not found. Try another spelling or nearby town."
        )

    return {
        "results": [
            {
                "name": item.get("name"),
                "state": item.get("admin1", ""),
                "country": item.get("country", ""),
                "latitude": item.get("latitude"),
                "longitude": item.get("longitude")
            }
            for item in results
        ]
    }


@app.get("/api/weather/{city}")
async def city_weather(city: str):
    try:
        data = await get_json(
            GEOCODING_URL,
            {
                "name": city,
                "count": 1,
                "language": "en",
                "format": "json"
            }
        )
    except Exception as error:
        raise HTTPException(
            status_code=502,
            detail=f"City search error: {str(error)}"
        )

    results = data.get("results", [])

    if not results:
        raise HTTPException(status_code=404, detail="City not found")

    place = results[0]
    weather = await get_weather(place["latitude"], place["longitude"])

    weather.update({
        "city": place.get("name", city),
        "village": None,
        "district": place.get("admin2", ""),
        "state": place.get("admin1", ""),
        "country": place.get("country", ""),
        "location_name": ", ".join(
            part for part in [
                place.get("name"),
                place.get("admin1"),
                place.get("country")
            ] if part
        ),
        "location_accuracy": None,
        "location_source": "City search"
    })

    return weather
