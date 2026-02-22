# Weather Dashboard

A production-ready full-stack weather application with a modern SaaS-style frontend, InsForge serverless backend (or local mock), and OpenWeatherMap integration.

## Features

- **Current weather**: Temperature, description, humidity, wind speed, weather icon
- **5-day forecast**: Grid-based forecast cards
- **Geolocation**: Detect and use current location
- **Search history**: Stored in backend, with delete and export
- **AI suggestions**: Context-aware tips (e.g., "Stay hydrated" when hot, "Carry umbrella" when rainy)
- **Responsive design**: Mobile-first with Flexbox + Grid
- **Glassmorphism UI**: Modern blur effects and animations (Framer Motion, Lucide icons)

## Project Structure

```
weather-app/
├── frontend/          # React + Vite
│   └── src/
│       ├── components/
│       ├── App.jsx
│       └── api.js
├── insforge/          # InsForge serverless functions (production)
│   ├── functions/
│   └── db/
├── backend-mock/     # Local mock server (development)
└── README.md
```

## Quick Start (Local Development)

### 1. Get OpenWeatherMap API Key

1. Sign up at [OpenWeatherMap](https://openweathermap.org/api)
2. Copy your API key

### 2. Backend (Mock Server)

```bash
cd weather-app/backend-mock
echo "WEATHER_API_KEY=your_key" > .env
node server.js
```

Server runs at `http://localhost:5000`.

### 3. Frontend

```bash
cd weather-app/frontend
npm install
npm run dev
```

Open `http://localhost:3000`.

## Production (InsForge)

### 1. Create InsForge Project

- Sign up at [insforge.dev](https://insforge.dev)
- Create a new project
- Note your base URL and anon key

### 2. Create Weather Table

Using the InsForge dashboard or API, create a table with the schema in `insforge/db/schema.json`:

- **tableName**: `Weather`
- **columns**: location (string), temperature (float), description (string), humidity (float), wind_speed (float), icon (string), createdAt (datetime)

### 3. Deploy Functions

Create and deploy these functions in InsForge (one per file in `insforge/functions/`):

- `createWeather` – POST – Create + store weather
- `getWeather` – GET – List all records
- `updateWeather` – PUT – Update by ID
- `deleteWeather` – DELETE – Delete by ID
- `exportWeather` – GET – Export JSON

### 4. Environment Variables (InsForge)

Add secrets in InsForge:

- `WEATHER_API_KEY` – OpenWeatherMap API key
- `INSFORGE_BASE_URL` – Your InsForge project URL
- `ANON_KEY` – InsForge anon key

### 5. Frontend

```bash
cd frontend
echo "VITE_BACKEND_URL=https://your-app.insforge.app" > .env
npm run build
```

## API Endpoints (Mock / InsForge)

| Method | Endpoint                    | Description                    |
|--------|-----------------------------|--------------------------------|
| POST   | /functions/createWeather   | Create weather (body: `{ city }` or `{ lat, lon }`) |
| GET    | /functions/getWeather      | List all stored records        |
| PUT    | /functions/updateWeather   | Update by ID (body: `{ id, city }`) |
| DELETE | /functions/deleteWeather   | Delete by ID (?id=xxx)         |
| GET    | /functions/exportWeather   | Download JSON export           |

## Tech Stack

- **Frontend**: React 18, Vite, Axios, Framer Motion, Lucide React, CSS (Flexbox + Grid)
- **Backend**: InsForge serverless functions (or Node.js http mock)
- **API**: OpenWeatherMap (current + 5-day forecast)

## License

MIT
