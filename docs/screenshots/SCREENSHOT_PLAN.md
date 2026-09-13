# Voyago — Academic Project Report Screenshot Collection Plan

This document defines the official screenshot evidence plan for the academic project report of the **Voyago Travel Planning System**. It establishes a curated set of **13 mandatory high-impact screenshots** (plus optional supplementary views) that provide visual evidence for the implemented frontend interfaces, user workflows, security boundaries, and cloud deployment state.

---

## 1. Screenshot Collection Principles

1. **Academic Neutrality**: Visual evidence demonstrates the user-facing interface, user interaction flows, and layout design. Screenshots do not claim to prove backend or database internal logic independently.
2. **Production Environment Priority**: All user-facing screenshots should be captured directly from the live deployed production environment on Railway:
   - **Frontend**: `https://beautiful-perfection-production-09e2.up.railway.app`
   - **Backend REST API**: `https://voyago-production-a8e6.up.railway.app`
3. **Data Privacy & Security Hygiene**:
   - Never expose administrative credentials, database passwords (`DB_PASSWORD`), JWT secrets (`JWT_SECRET`), raw bearer tokens, or sensitive environment variable values.
   - Use clean, realistic academic demonstration data (e.g., `"Paris Vacation"`, `"Tokyo Exploration"`, `"Bengaluru Heritage Tour"`).
4. **Display & Capture Standard**:
   - Standard Desktop Viewport: 1920 × 1080 (Full HD) at 100% zoom.
   - Clean browser window without developer tool panels, temporary error dialogs, or unrelated browser extensions.

---

## 2. Master Screenshot Evidence Matrix (13 Mandatory Figures)

| Figure # | Suggested Filename | Feature Demonstrated | Recommended Application URL / Route | Report Chapter Mapping | Environment |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Figure S1** | `01_user_authentication.png` | User Login Interface | `/login` | Chapter 4, Chapter 6 | Production |
| **Figure S2** | `02_user_dashboard_trip_management.png` | Dashboard & Trip Management | `/dashboard` | Chapter 4, Chapter 9 | Production |
| **Figure S3** | `03_trip_creation_modal.png` | Trip Creation Modal & Constraints | `/dashboard` *(Create Modal)* | Chapter 4 | Production |
| **Figure S4** | `04_trip_itinerary_timeline.png` | Chronological Itinerary Timeline | `/dashboard` *(Trip View)* | Chapter 4 | Production |
| **Figure S5** | `05_destination_weather_forecast.png` | Current Weather & 7-Day Forecast | `/dashboard` *(Trip View)* | Chapter 4, Chapter 9 | Production |
| **Figure S6** | `06_destination_places_attractions.png` | Destination Attractions & Media Cards | `/dashboard` *(Trip View)* | Chapter 4, Chapter 9 | Production |
| **Figure S7** | `07_interactive_map_route_planning.png` | Interactive Map & Driving Route Engine | `/dashboard` *(Trip View)* | Chapter 4, Chapter 9 | Production |
| **Figure S8** | `08_budget_and_expense_tracking.png` | Budget Summary & Categorized Expenses | `/dashboard` *(Trip View)* | Chapter 4, Chapter 9 | Production |
| **Figure S9** | `09_trip_analytics_dashboard.png` | Trip Analytics & Financial Metrics | `/dashboard` *(Trip View)* | Chapter 4, Chapter 9 | Production |
| **Figure S10** | `10_inapp_notifications_panel.png` | In-App Notification Center | `/dashboard` *(Notification Dropdown)* | Chapter 4 | Production |
| **Figure S11** | `11_trip_sharing_and_public_view.png` | Public Read-Only Shared Trip View | `/share/:shareToken` | Chapter 4, Chapter 6, Chapter 9 | Production |
| **Figure S12** | `12_print_friendly_trip_export.png` | Print-Friendly Trip Document | `/trips/:tripId/print` | Chapter 4, Chapter 9 | Production |
| **Figure S13** | `13_production_deployment_overview.png` | Production Services Deployed on Railway | Railway Project Dashboard | Chapter 8 | Production |

> **Note on Packing List**: The Packing Checklist feature (`/dashboard` Trip View) is maintained as an optional supplementary figure (`Figure S-Supp1: 14_trip_packing_checklist.png`) if supplementary appendix material is desired, but is excluded from the mandatory presentation set.

---

## 3. Detailed Screenshot Specifications

### Figure S1: User Authentication Interface
- **Filename**: `01_user_authentication.png`
- **Academic Caption**: *"Figure S1: Voyago user login interface."*
- **Feature Demonstrated**: User login interface and client-side form validation.
- **Visible Elements**: Email/password inputs, validation feedback, "Sign In" button, registration link, branding banner.
- **Target URL**: `https://beautiful-perfection-production-09e2.up.railway.app/login`
- **Report Section**: Chapter 4 (System Implementation — Authentication), Chapter 6 (Security Architecture).

---

### Figure S2: Dashboard & Trip Management
- **Filename**: `02_user_dashboard_trip_management.png`
- **Academic Caption**: *"Figure S2: Voyago dashboard displaying saved trips and filtering controls."*
- **Feature Demonstrated**: Trip catalog, search filtering, temporal status pills, and sorting.
- **Visible Elements**: Top navigation bar with user profile, search input, status filter pills (`All`, `Upcoming`, `Ongoing`, `Past`), sort dropdown (`Departure Date`, `Date Created`, `Title`), trip cards with destination badge and dates, "Plan New Trip" button.
- **Target URL**: `https://beautiful-perfection-production-09e2.up.railway.app/dashboard`
- **Report Section**: Chapter 4 (Trip Management Module), Chapter 9 (Results & Evaluation).

---

### Figure S3: Trip Creation Modal
- **Filename**: `03_trip_creation_modal.png`
- **Academic Caption**: *"Figure S3: Interactive trip creation modal with destination selection and date constraints."*
- **Feature Demonstrated**: Modal-based trip creation workflow and form constraints.
- **Visible Elements**: Modal overlay, title input, destination selector dropdown, start and end date pickers, optional notes, "Create Trip" submission button.
- **Target URL**: `https://beautiful-perfection-production-09e2.up.railway.app/dashboard` *(Create Modal)*
- **Report Section**: Chapter 4 (System Implementation).

---

### Figure S4: Chronological Itinerary Timeline
- **Filename**: `04_trip_itinerary_timeline.png`
- **Academic Caption**: *"Figure S4: Day-by-day chronological itinerary timeline displaying scheduled activities."*
- **Feature Demonstrated**: Activity scheduling and chronological grouping.
- **Visible Elements**: Trip header banner, day-wise grouped timeline cards, time tags (e.g., `09:00 AM`), activity title, location icon, detailed descriptions, edit/delete controls, "Add Activity" button.
- **Target URL**: `https://beautiful-perfection-production-09e2.up.railway.app/dashboard` *(Active Trip Detail)*
- **Report Section**: Chapter 4 (Itinerary Management Module).

---

### Figure S5: Current Weather & 7-Day Forecast
- **Filename**: `05_destination_weather_forecast.png`
- **Academic Caption**: *"Figure S5: Current destination weather and 7-day forecast."*
- **Feature Demonstrated**: Destination weather reporting interface.
- **Visible Elements**: Destination name, current temperature, condition text/icon, feels-like temperature, humidity, wind speed, precipitation probability, and horizontal 7-day forecast cards.
- **Target URL**: `https://beautiful-perfection-production-09e2.up.railway.app/dashboard` *(Active Trip Detail — Weather Section)*
- **Report Section**: Chapter 4 (External Service Integrations), Chapter 9 (Results & Evaluation).

---

### Figure S6: Destination Attractions & Media Cards
- **Filename**: `06_destination_places_attractions.png`
- **Academic Caption**: *"Figure S6: Destination attractions catalog displaying landmark details and media cards."*
- **Feature Demonstrated**: Destination place cards, descriptions, and media display.
- **Visible Elements**: Grid of attraction/place cards, category tag, descriptive summary, address/location, available place photo, and "Photo Unavailable" fallback where applicable.
- **Target URL**: `https://beautiful-perfection-production-09e2.up.railway.app/dashboard` *(Active Trip Detail — Places Section)*
- **Report Section**: Chapter 4 (Places & Attractions Integration), Chapter 9 (Results & Evaluation).

---

### Figure S7: Interactive Destination Map & Driving Route
- **Filename**: `07_interactive_map_route_planning.png`
- **Academic Caption**: *"Figure S7: Interactive destination map with place markers and driving route."*
- **Feature Demonstrated**: Interactive spatial mapping and route visualization.
- **Visible Elements**: Leaflet map canvas with OpenStreetMap tiles, destination centroid marker, attraction POI markers with custom popups, driving route polyline overlay, route metrics banner displaying calculated driving distance (km) and estimated travel duration.
- **Target URL**: `https://beautiful-perfection-production-09e2.up.railway.app/dashboard` *(Active Trip Detail — Map Section)*
- **Report Section**: Chapter 4 (Mapping & Routing Module), Chapter 9 (Results & Evaluation).

---

### Figure S8: Budget Management & Expense Tracking
- **Filename**: `08_budget_and_expense_tracking.png`
- **Academic Caption**: *"Figure S8: Trip budget management showing spending progress, categorized expenses, and over-budget state."*
- **Feature Demonstrated**: Financial management, progress visualization, categorized tracking, and threshold alert state.
- **Visible Elements**: Total budget, total spent, remaining balance, color-coded spending progress bar, categorized expense entries matching application categories (`FLIGHT`, `HOTEL`, `FOOD`, `TRANSPORT`, `ACTIVITY`, `SHOPPING`, `OTHER`), "Add Expense" button, and warning banner when expenses exceed budget.
- **Target URL**: `https://beautiful-perfection-production-09e2.up.railway.app/dashboard` *(Active Trip Detail — Budget Section)*
- **Report Section**: Chapter 4 (Budget & Expense Module), Chapter 9 (Results & Evaluation).

---

### Figure S9: Trip Analytics & Financial Metrics
- **Filename**: `09_trip_analytics_dashboard.png`
- **Academic Caption**: *"Figure S9: Trip analytics overview presenting financial metrics, itinerary snapshot, and travel highlights."*
- **Feature Demonstrated**: Consolidated trip analytics and financial breakdown.
- **Visible Elements**: Trip summary, duration and progress, financial metrics (budget, spent, remaining), category breakdown with color-coded breakdown chart, recent expenses list, itinerary snapshot, places highlights, and weather snapshot.
- **Target URL**: `https://beautiful-perfection-production-09e2.up.railway.app/dashboard` *(Active Trip Detail — Analytics Tab)*
- **Report Section**: Chapter 4 (Analytics Module), Chapter 9 (Results & Evaluation).

---

### Figure S10: In-App Notification Center
- **Filename**: `10_inapp_notifications_panel.png`
- **Academic Caption**: *"Figure S10: In-app notification center showing alert notifications and trip navigation actions."*
- **Feature Demonstrated**: Contextual notification list and in-app alerts.
- **Visible Elements**: Notification bell with unread badge counter, open notification drawer, notification items (departure and over-budget alerts), title/message, timestamp, "View Trip" action link, mark as read, and delete actions.
- **Target URL**: `https://beautiful-perfection-production-09e2.up.railway.app/dashboard` *(Notification Dropdown)*
- **Report Section**: Chapter 4 (Notification Module).

---

### Figure S11: Public Read-Only Shared Trip View
- **Filename**: `11_trip_sharing_and_public_view.png`
- **Academic Caption**: *"Figure S11: Public read-only shared trip view accessed via unique share token."*
- **Feature Demonstrated**: Public shared trip viewer with read-only presentation.
- **Visible Elements**: Shared trip header banner, destination and dates, full itinerary schedule, budget breakdown and expense list, packing list summary, and clean read-only interface without administrative or edit buttons.
- **Target URL**: `https://beautiful-perfection-production-09e2.up.railway.app/share/:shareToken`
- **Report Section**: Chapter 4 (Trip Sharing Module), Chapter 6 (Security Architecture & Public Access), Chapter 9 (Results & Evaluation).

---

### Figure S12: Print-Friendly Trip Document
- **Filename**: `12_print_friendly_trip_export.png`
- **Academic Caption**: *"Figure S12: Print-friendly trip document."*
- **Feature Demonstrated**: Printable multi-section trip document for browser printing and PDF export.
- **Visible Elements**: High-contrast printable document layout, comprehensive itinerary schedule, budget breakdown table, packing checklist, and "Print / Save as PDF" browser print trigger button.
- **Target URL**: `https://beautiful-perfection-production-09e2.up.railway.app/trips/:tripId/print`
- **Report Section**: Chapter 4 (System Implementation — Export Module), Chapter 9 (Results & Evaluation).

---

### Figure S13: Production Deployment on Railway
- **Filename**: `13_production_deployment_overview.png`
- **Academic Caption**: *"Figure S13: Voyago production services deployed on Railway."*
- **Feature Demonstrated**: Cloud deployment topology and service health.
- **Visible Elements**: Railway project overview showing active Frontend service, Backend REST API service, and MySQL database service with healthy deployment status indicators. Zero private secrets, environment variable values, or database credentials exposed.
- **Target URL**: Railway Project Dashboard
- **Report Section**: Chapter 8 (Production Deployment & Cloud Hosting).

---

## 4. Academic Chapter Mapping Summary

| Report Chapter | Title | Mapped Figures | Primary Focus |
| :--- | :--- | :--- | :--- |
| **Chapter 4** | System Implementation | **Figures S1 – S12** | Core UI modules, controllers, workflows, and service integrations |
| **Chapter 5** | Database Design and Data Modeling | *(None)* | Dedicated to schema diagrams and ER models; no UI screenshots assigned as primary evidence |
| **Chapter 6** | Security Architecture | **Figures S1, S11** | User authentication entry point and read-only public access guard |
| **Chapter 7** | Verification, Testing and QA | *(Supplementary illustration)* | May illustrate verified UI workflows; not claimed as standalone automated test proof |
| **Chapter 8** | Production Deployment | **Figure S13** | Multi-service cloud deployment on Railway |
| **Chapter 9** | Results, Limitations and Future Work | **Figures S2, S5, S6, S7, S8, S9, S11, S12** | Empirical project evaluation, user interface results, and feature summaries |

---

## 5. Execution & Capture Checklist

- [ ] Ensure the production database contains clean, realistic demonstration data (e.g., a trip with 4+ activities across 2+ days, expenses across standard categories, and an active share token).
- [ ] Set browser viewport to 1920 × 1080 (100% zoom).
- [ ] Capture PNG screenshots in full RGB color at native resolution.
- [ ] Save captured files directly into `docs/screenshots/` matching the filenames in the master matrix.
- [ ] Verify that zero sensitive credentials, database passwords, or JWT secrets appear in any image.
