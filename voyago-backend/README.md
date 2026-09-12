# Voyago Backend

Spring Boot 3.2.4 (Java 17) REST API backend for the Voyago travel planning platform.

## Features & Modules
- Authentication & JWT token security (stateless Bearer token)
- User Registration & Login
- Trip Management (CRUD, date validation, ownership isolation)
- Itinerary Management (chronological activities)
- Weather Forecasts (Open-Meteo integration)
- Places & Attractions (Wikipedia MediaWiki API integration)
- Interactive Maps & OSRM Routing
- Budget & Expense Tracking with BigDecimal precision
- Packing List Management with optimistic toggles
- Cryptographically secure Trip Sharing & Public Read-Only Views
- Production Security Hardening (X-Frame-Options: DENY, X-Content-Type-Options: nosniff, CORS origin validation)

## Requirements
- Java 17+
- Maven 3.8+
- MySQL 8.0+

## Local Development
1. Ensure MySQL is running and `voyago_db` exists.
2. Run `./mvnw spring-boot:run` or `mvn spring-boot:run`.

## Production Build & Packaging
```bash
mvn clean package -DskipTests
```
The executable JAR is generated at `target/voyago-backend-0.0.1-SNAPSHOT.jar`.

## Configuration
See `.env.example` and `../DEPLOYMENT.md` for environment variables configuration (`DB_URL`, `DB_USERNAME`, `DB_PASSWORD`, `JWT_SECRET`, `FRONTEND_URL`).
