# 🌤️ SkyCast – Weather Forecast App

A modern Weather Forecast Application built using **React.js, FastAPI and Python**. It provides real-time weather information, air quality details and location-based weather updates.

## 🚀 Features

- Search weather by city name
- Current weather information
- Live location-based weather
- Temperature and weather conditions
- Humidity and wind speed
- Air quality information
- Sunrise and sunset details
- Weather forecast information
- Responsive user interface

## 🛠️ Technologies Used

### Frontend
- React.js
- JavaScript
- Vite
- CSS
- Lucide React

### Backend
- Python
- FastAPI
- HTTPX

### APIs
- Open-Meteo Weather API
- Open-Meteo Air Quality API
- Open-Meteo Geocoding API
- OpenStreetMap Nominatim

## 📁 Project Structure

```text
Weather_Forecast_App/
│
├── backend/
│   ├── main.py
│   └── requirements.txt
│
├── frontend/
│   ├── public/
│   ├── src/
│   ├── package.json
│   └── vite.config.js
│
├── .gitignore
└── README.md
```

## ⚙️ Installation and Setup

### 1. Clone Repository

```bash
git clone https://github.com/anandjaiswal6264/Weather-Forecast-App.git
cd Weather-Forecast-App
```

### 2. Backend Setup

```bash
cd backend
python -m venv .venv
```

Activate virtual environment on Windows:

```powershell
.venv\Scripts\activate
```

Install dependencies:

```bash
pip install -r requirements.txt
```

Start FastAPI server:

```bash
uvicorn main:app --reload
```

Backend API:

http://127.0.0.1:8000

API Documentation:

http://127.0.0.1:8000/docs

### 3. Frontend Setup

Open another terminal:

```bash
cd frontend
npm install
npm run dev
```

Open the local URL shown by Vite, usually:

http://localhost:5173

## 🌐 GitHub Repository

https://github.com/anandjaiswal6264/Weather-Forecast-App

## 👨‍💻 Developer

**Anand Jaiswal**

GitHub: https://github.com/anandjaiswal6264

---

⭐ If you like this project, feel free to star the repository!