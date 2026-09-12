# Voyago Frontend

React 19 + Vite single-page application for the Voyago travel planning platform.

## Features
- Authentication & Session State (`AuthContext`)
- Interactive Travel Dashboard with Search, Filter (All/Upcoming/Ongoing/Past), and Multi-criteria Sorting
- Rich Trip Detail views (Itinerary, Weather, Places, Maps, Budget, Analytics, Packing, Sharing)
- Interactive Maps with Leaflet and OSRM Route visualization
- Trip Sharing & Public Read-Only Trip View
- Print-friendly dedicated trip itinerary export view

## Requirements
- Node.js 18+ (Node 20+ LTS recommended)
- npm 9+

## Local Development
```bash
npm install
npm run dev
```

## Production Build
```bash
npm run build
```
Production assets are output to `dist/`.

## Environment Variables
- `VITE_API_BASE_URL`: Base URL of the Voyago backend API (defaults to `http://localhost:8080/api`).
See `.env.example` and `../DEPLOYMENT.md`.
