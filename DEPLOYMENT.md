# Voyago — Production Deployment & Configuration Guide

This guide details the deployment architecture, configuration parameters, build procedures, and production readiness guidelines for the Voyago travel planning platform.

---

## 1. Architecture Overview

- **Backend:** Spring Boot 3.2.4 (Java 17) REST API running as an executable JAR.
- **Frontend:** React 19 + Vite single-page application built into static web assets (`dist/`).
- **Database:** MySQL 8.0+ relational database (`voyago_db`).
- **Authentication:** Stateless JSON Web Token (JWT) with HMAC-SHA256 signature verification.
- **External Services:** Open-Meteo (Geocoding & Weather), Wikipedia MediaWiki API (Attractions), Project-OSRM (Routing).

---

## 2. Backend Deployment (Spring Boot on Railway)

### Prerequisites
- OpenJDK 17 or higher
- Apache Maven 3.8+ (or Maven Wrapper)
- Network connectivity to Railway MySQL database and external APIs

### Service Configuration in Railway
1. **Source Repository:** Connect your GitHub repository to Railway.
2. **Root Directory:** Set the Root Directory to `/voyago-backend` (or `voyago-backend`) so Railway only builds and deploys the backend service.
3. **Build Command:**
   ```bash
   mvn clean package -DskipTests
   ```
4. **Runtime / Start Command:**
   ```bash
   java -jar target/voyago-backend-0.0.1-SNAPSHOT.jar
   ```
5. **Artifact Generated:** `target/voyago-backend-0.0.1-SNAPSHOT.jar`

### Port Configuration
The backend is configured to dynamically bind to Railway's assigned port via:
```properties
server.port=${PORT:8080}
```
In local development, it defaults to port `8080`. In Railway production, Railway injects the `$PORT` environment variable automatically.

### Required Environment Variables for Railway Backend Service

| Variable | Railway Reference / Description | Production Value / Template |
| :--- | :--- | :--- |
| `PORT` | Provided automatically by Railway | Automatic (e.g. `8080` or assigned) |
| `DB_URL` | JDBC URL pointing to Railway MySQL over private network | `jdbc:mysql://${MYSQLHOST}:${MYSQLPORT}/${MYSQLDATABASE}?useSSL=true&serverTimezone=UTC` |
| `DB_USERNAME` | Railway MySQL User reference | `${{MySQL.MYSQLUSER}}` (or `${MYSQLUSER}`) |
| `DB_PASSWORD` | Railway MySQL Password reference | `${{MySQL.MYSQLPASSWORD}}` (or `${MYSQLPASSWORD}`) |
| `JWT_SECRET` | Strong 256-bit random Base64 secret generated for production | `${JWT_SECRET}` (Set via Railway Variables UI) |
| `JWT_EXPIRATION`| Token validity in ms | `86400000` (24 hours) |
| `FRONTEND_URL` | Allowed origin for CORS (update after frontend deploy) | `https://voyago.yourdomain.com` (or temporary localhost during initial backend rollout) |

### External Service Overrides (Optional)

| Variable | Default Value | Description |
| :--- | :--- | :--- |
| `WEATHER_GEOCODING_URL` | `https://geocoding-api.open-meteo.com/v1/search` | Open-Meteo geocoding search |
| `WEATHER_FORECAST_URL` | `https://api.open-meteo.com/v1/forecast` | Open-Meteo weather forecast |
| `PLACES_WIKIPEDIA_API_URL`| `https://en.wikipedia.org/w/api.php` | MediaWiki API for places |
| `MAPS_GEOCODING_URL` | `https://geocoding-api.open-meteo.com/v1/search` | Geocoding service for maps |
| `MAPS_ROUTING_URL` | `https://router.project-osrm.org/route/v1/driving` | OSRM routing endpoint |

### Backend Smoke Test Procedure (Post-Deployment)
Once deployed to Railway, perform the following verification suite against the assigned HTTPS URL (`https://<backend-service>.up.railway.app`):

1. **Authentication - Register:**
   ```bash
   curl -X POST https://<backend-service>.up.railway.app/api/auth/register \
     -H "Content-Type: application/json" \
     -d '{"name":"Smoke Tester","email":"smoketest@example.com","password":"TestPassword123!"}'
   ```
2. **Authentication - Login:**
   ```bash
   curl -X POST https://<backend-service>.up.railway.app/api/auth/login \
     -H "Content-Type: application/json" \
     -d '{"email":"smoketest@example.com","password":"TestPassword123!"}'
   ```
3. **Protected Endpoint (Trip Creation & Listing):**
   ```bash
   # Create Trip
   curl -X POST https://<backend-service>.up.railway.app/api/trips \
     -H "Content-Type: application/json" \
     -H "Authorization: Bearer <TOKEN>" \
     -d '{"title":"Bengaluru Launch","destination":"Bengaluru","startDate":"2026-10-01","endDate":"2026-10-05"}'

   # List Trips
   curl -X GET https://<backend-service>.up.railway.app/api/trips \
     -H "Authorization: Bearer <TOKEN>"
   ```
4. **External API Endpoints:**
   ```bash
   curl -X GET "https://<backend-service>.up.railway.app/api/weather?destination=Bengaluru" -H "Authorization: Bearer <TOKEN>"
   curl -X GET "https://<backend-service>.up.railway.app/api/places?destination=Bengaluru" -H "Authorization: Bearer <TOKEN>"
   curl -X GET "https://<backend-service>.up.railway.app/api/maps?destination=Bengaluru" -H "Authorization: Bearer <TOKEN>"
   ```
5. **Persistence Verification:**
   Restart or redeploy the service in Railway and verify that `GET /api/trips` still returns the created trip.

## 3. Frontend Deployment (React / Vite)

### Prerequisites
- Node.js 18+ (Node 20+ LTS recommended)
- npm 9+

### Build Command
```bash
cd voyago-frontend
npm install
npm run build
```
*Output directory:* `voyago-frontend/dist/`

### Environment Configuration
The frontend communicates with the backend REST API. Set the API base URL at build time:

```bash
VITE_API_BASE_URL=https://api.voyago.yourdomain.com/api
```

> **Security Note:** Vite environment variables prefixed with `VITE_` are bundled directly into the static JavaScript payload. Never put API secrets, private keys, or passwords in frontend environment variables.

### Static Hosting Setup
Deploy the static contents of the `dist/` directory to any modern static host or CDN (e.g. Nginx, AWS S3/CloudFront, Cloudflare Pages, Vercel, Netlify).

Ensure single-page application (SPA) fallback routing is configured so that all non-file route requests (such as `/dashboard`, `/login`, `/shared/:token`, `/trips/:id/print`) return `index.html`.

---

## 4. Database Setup & Production Database Preparation (Railway MySQL)

### Production Platform: Railway MySQL
- **Database Engine:** MySQL 8.0+
- **Managed Platform:** Railway (Official MySQL Database Template)
- **Networking Strategy:** Private internal networking between Railway Backend service and Railway MySQL service.

### Networking & Security Architecture
```text
Frontend (Vercel / Netlify / Static CDN)
    │
    ▼ HTTPS (Public Internet)
Backend (Railway Spring Boot Service)
    │
    ▼ Railway Private Internal Network (Encrypted TCP)
MySQL (Railway MySQL 8 Service)
```
- **Public Exposure:** Disabled by default. Do not generate a public TCP domain/proxy for MySQL unless external administrative access is explicitly required.
- **Private Hostname:** Use Railway's internal service discovery (e.g., `mysql.railway.internal` or `${MYSQLHOST}`).

### Railway Provisioning Workflow (Manual)
1. **Create/Open Project:** Log in to [Railway](https://railway.com/) and navigate to your project dashboard.
2. **Add MySQL Database:** Click **+ New** -> **Database** -> **Add MySQL**.
3. **Verify Configuration:**
   - Image: `mysql:8`
   - Volume: Ensure a persistent volume is attached (default mount path: `/var/lib/mysql`).
4. **Inspect Connection Variables:**
   Under the MySQL service **Variables** tab, Railway automatically generates:
   - `MYSQLHOST` (Private internal hostname)
   - `MYSQLPORT` (Internal port, default `3306`)
   - `MYSQLUSER` (Platform-generated non-root or root user)
   - `MYSQLPASSWORD` (Platform-generated strong secret)
   - `MYSQLDATABASE` (Default database name, e.g., `railway` or custom)
   - `MYSQL_URL` (Full connection URI)

### Environment Variable Mapping for Spring Boot
When connecting the Spring Boot backend service to the Railway MySQL service in the same project:

| Spring Boot Variable | Railway Variable Reference / Mapping Pattern | Example Placeholder |
| :--- | :--- | :--- |
| `DB_URL` | `jdbc:mysql://${MYSQLHOST}:${MYSQLPORT}/${MYSQLDATABASE}?useSSL=true` | `jdbc:mysql://mysql.railway.internal:3306/railway?useSSL=true` |
| `DB_USERNAME` | `${MYSQLUSER}` | `${{MySQL.MYSQLUSER}}` |
| `DB_PASSWORD` | `${MYSQLPASSWORD}` | `${{MySQL.MYSQLPASSWORD}}` |

> **Security Note:** Never commit actual database passwords or connection URLs containing credentials to Git. Use Railway service variable references (`${{MySQL.VARIABLE}}`) or platform environment secret injection.

### Persistence & Storage Guarantee
- Railway MySQL provisions a dedicated persistent disk volume to ensure all table structures, indexes, and records survive service restarts, crashes, and redeployments.
- Verify volume mount is active under **Settings** -> **Volumes**.

### Backup & Disaster Recovery
- **Railway Volume Snapshots:** Available based on Railway project plan (Automated / Manual snapshots).
- **Manual Backups:** For point-in-time disaster recovery, configure scheduled logical database dumps via `mysqldump` to secure off-site cloud storage (e.g. S3 / Cloudflare R2).

### Schema Strategy & Production Migration Considerations
- **Phase 2A Initial State:** Production database is treated as a clean database.
- **DDL Auto:** The backend currently uses `spring.jpa.hibernate.ddl-auto=update`.
- **Hardening Step (Post-Launch):** For production hardening, transition `spring.jpa.hibernate.ddl-auto` to `validate` and manage future incremental schema changes using Flyway or Liquibase versioned migration scripts.

---

## 5. Health Checks & Monitoring

- **Current Status:** Basic endpoints respond to health requests (`GET /api/shared/trips/...`, `POST /api/auth/login`).
- **Future Enhancement:** Recommend adding `spring-boot-starter-actuator` in an operational monitoring phase to expose standardized `/actuator/health` and `/actuator/metrics` endpoints behind secured internal ports.

