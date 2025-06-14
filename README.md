# Tire Request Management System

This project is a full-stack application for managing tire requests within an organization. It includes a Spring Boot backend, a React frontend, and uses MongoDB for data storage. The system supports role-based access control, a multi-step approval workflow, real-time notifications via WebSockets, PDF generation for requests, and is containerized using Docker.

## Table of Contents

- [Project Structure](#project-structure)
- [Tech Stack](#tech-stack)
- [Features](#features)
- [Prerequisites](#prerequisites)
- [Setup and Running the Application](#setup-and-running-the-application)
  - [Using Docker Compose (Recommended)](#using-docker-compose-recommended)
  - [Local Development Setup](#local-development-setup)
    - [Backend Setup](#backend-setup)
    - [Frontend Setup](#frontend-setup)
- [Default User Credentials](#default-user-credentials)
- [API Overview](#api-overview)
  - [Authentication Endpoints](#authentication-endpoints)
  - [Tire Request Endpoints](#tire-request-endpoints)
  - [File Endpoints](#file-endpoints)
  - [WebSocket Endpoints](#websocket-endpoints)
- [Frontend Route Overview](#frontend-route-overview)
- [Environment Variables](#environment-variables)
  - [Backend](#backend)
  - [Frontend](#frontend)
- [Future Enhancements](#future-enhancements)

## Project Structure

```
.
├── README.md
├── docker-compose.yml
├── tire-request-system-backend/
│   ├── Dockerfile
│   ├── pom.xml
│   └── src/
└── tire-request-system-frontend/
    ├── Dockerfile
    ├── nginx.conf
    ├── package.json
    └── src/
```

## Tech Stack

**Backend:**
- Java 17
- Spring Boot 3.x
- Spring Security (JWT Authentication)
- Spring Data MongoDB
- Spring Web
- Spring WebSocket (STOMP over SockJS)
- Apache PDFBox (for PDF generation)
- Maven (Build Tool)

**Frontend:**
- React 18.x / 19.x
- React Router DOM
- Axios (HTTP Client)
- Material-UI (MUI)
- Formik & Yup (Form Handling & Validation)
- React Toastify (Notifications)
- `@stomp/stompjs` & `sockjs-client` (WebSocket Communication)
- Node.js & npm (Build Tool)

**Database:**
- MongoDB

**Containerization:**
- Docker
- Docker Compose

## Features

- Role-based authentication (User, Manager, Transport Officer, Admin).
- Secure JWT (JSON Web Token) for API communication.
- Tire Request Management:
    - Users can create, view, edit (if pending), and delete (if pending/rejected) their requests.
    - Image uploads associated with requests.
- Multi-step approval workflow:
    - Manager approval/rejection.
    - Transport Officer final approval/rejection.
- Real-time notifications via WebSockets for:
    - New requests (to Managers).
    - Status updates (to request submitter, and next approver role).
- PDF generation for individual tire request details.
- Dockerized environment for easy setup and deployment.
- Responsive UI for various screen sizes.

## Prerequisites

- Docker and Docker Compose (for containerized setup)
- Java JDK 17 or later (for local backend development)
- Maven 3.6+ (for local backend development)
- Node.js LTS (e.g., v18.x or v20.x) and npm (for local frontend development)
- MongoDB (if running backend locally without Docker)

## Setup and Running the Application

### Using Docker Compose (Recommended)

This is the easiest way to get the entire application running, including MongoDB.

1.  **Clone the repository:**
    ```bash
    git clone <repository-url>
    cd <repository-name>
    ```

2.  **Environment Variables (Optional but Recommended for Secrets):**
    Create a `.env` file in the project root (alongside `docker-compose.yml`) to override default JWT secrets or other sensitive configurations:
    ```env
    APP_JWTSECRET=my_very_strong_and_long_random_jwt_secret_for_production
    APP_JWTEXPIRATIONMS=86400000 # 24 hours in ms
    # Add other backend environment variables if needed (e.g., email credentials)
    ```
    The `docker-compose.yml` is set up to use these if provided.

3.  **Build and Run with Docker Compose:**
    From the project root directory:
    ```bash
    docker-compose up --build -d
    ```
    The `-d` flag runs the containers in detached mode.
    - Backend will be accessible at `http://localhost:8080`
    - Frontend will be accessible at `http://localhost:3000`
    - MongoDB will be accessible at `mongodb://localhost:27017` (primarily for backend service)

4.  **Accessing the Application:**
    - Open your browser and go to `http://localhost:3000` for the frontend.

5.  **Stopping the Application:**
    ```bash
    docker-compose down
    ```
    To remove volumes (MongoDB data, uploads) as well:
    ```bash
    docker-compose down -v
    ```

### Local Development Setup

#### Backend Setup

1.  **Navigate to backend directory:**
    ```bash
    cd tire-request-system-backend
    ```
2.  **Configure `application.properties`:**
    Ensure `src/main/resources/application.properties` has correct settings, especially for:
    - `spring.data.mongodb.uri` (e.g., `mongodb://localhost:27017/tire_request_db` if running MongoDB locally)
    - Email server details (if testing email functionality)
    - `app.jwtSecret` and `app.jwtExpirationMs`
3.  **Run MongoDB:** Ensure a MongoDB instance is running and accessible.
4.  **Build and Run:**
    ```bash
    mvn spring-boot:run
    ```
    The backend will start on `http://localhost:8080`.

#### Frontend Setup

1.  **Navigate to frontend directory:**
    ```bash
    cd tire-request-system-frontend
    ```
2.  **Install dependencies:**
    ```bash
    npm install
    ```
3.  **Configure `.env` file:**
    The `src/.env` file (or `.env.development.local`) should have:
    ```env
    REACT_APP_API_AUTH_URL=http://localhost:8080/api/auth/
    REACT_APP_API_BASE_URL=http://localhost:8080/api
    REACT_APP_API_REQUESTS_URL=http://localhost:8080/api/requests
    REACT_APP_API_WS_URL=http://localhost:8080/ws-tire-request
    ```
    These point to the locally running backend.
4.  **Run the development server:**
    ```bash
    npm start
    ```
    The frontend will start on `http://localhost:3000`.

## Default User Credentials

The backend application includes a `CommandLineRunner` that creates the following default users if they do not already exist in the database upon startup:

| Username         | Password    | Email                | Roles                                                          |
|------------------|-------------|----------------------|----------------------------------------------------------------|
| `admin`          | `adminpass` | `admin@example.com`  | ROLE_ADMIN, ROLE_USER, ROLE_MANAGER, ROLE_TRANSPORT_OFFICER    |
| `manager`        | `managerpass`| `manager@example.com`| ROLE_MANAGER, ROLE_USER                                        |
| `transportofficer`| `topass`    | `to@example.com`     | ROLE_TRANSPORT_OFFICER, ROLE_USER                              |
| `user`           | `userpass`  | `user@example.com`   | ROLE_USER                                                      |

**Note:** These are for development and testing purposes. Change them for production environments.

## API Overview

Base URL: `/api`

### Authentication Endpoints
- `POST /auth/login`: Authenticate user and receive JWT.
- `POST /auth/register`: Register a new user.

### Tire Request Endpoints
- `POST /requests`: Create a new tire request (expects multipart/form-data with `tireRequest` JSON part and optional `images` file part).
- `GET /requests`: Get all tire requests (Admin/Manager/TO).
- `GET /requests/{id}`: Get a single tire request by ID.
- `PUT /requests/{id}`: Update a tire request (expects multipart/form-data).
- `DELETE /requests/{id}`: Delete a tire request.
- `PUT /requests/{id}/manager-approve`: Manager approval (Manager only).
- `PUT /requests/{id}/manager-reject`: Manager rejection (Manager only).
- `PUT /requests/{id}/transport-approve`: Transport Officer final approval (TO only).
- `PUT /requests/{id}/transport-reject`: Transport Officer rejection (TO only).
- `GET /requests/pending`: Get requests pending for Manager/TO roles.
- `GET /requests/user/{userId}`: Get all requests for a specific user.
- `GET /requests/{id}/pdf`: Download a PDF summary of the tire request.

### File Endpoints
- `GET /images/{fileName:.+}`: Serve uploaded images.

### WebSocket Endpoints
- Connection: `/ws-tire-request` (STOMP over SockJS)
- **Server to Client Topics:**
    - `/topic/managerNotifications`: For new requests needing manager attention.
    - `/topic/transportOfficerNotifications`: For requests approved by managers, needing TO attention.
    - `/topic/user.{userId}.requestUpdates`: For status updates on a user's own requests.

## Frontend Route Overview

- `/`: Home page / Redirects to appropriate dashboard if logged in, else to login.
- `/login`: Login page.
- `/register`: Registration page.
- `/dashboard`: Generic authenticated path, redirects to role-specific dashboard.
- `/user/dashboard`: User's dashboard (view requests, create new).
- `/manager/dashboard`: Manager's dashboard (view pending, all requests, approve/reject).
- `/to/dashboard`: Transport Officer's dashboard (view pending final approval, all requests, approve/reject).
- `/admin/dashboard`: Admin's dashboard (placeholder).
- `/requests/new`: Page to create a new tire request.
- Other routes are protected and may require specific roles.

## Environment Variables

### Backend (`application.properties` or OS Environment)
- `SPRING_DATA_MONGODB_URI`: MongoDB connection string.
- `SPRING_MAIL_HOST`, `SPRING_MAIL_PORT`, `SPRING_MAIL_USERNAME`, `SPRING_MAIL_PASSWORD`: Email server configuration.
- `APP_JWTSECRET`: Secret key for JWT signing. **CRITICAL for security.**
- `APP_JWTEXPIRATIONMS`: JWT expiration time in milliseconds.
- `FILE_UPLOAD_DIR`: Directory for storing uploaded files.
- `APP_BASE_URL`: Base URL of the backend application (e.g., `http://localhost:8080`).
- `FRONTEND_BASE_URL`: Base URL of the frontend application (e.g., `http://localhost:3000`).

### Frontend (`.env` file in frontend root)
- `REACT_APP_API_AUTH_URL`: Full URL to the backend authentication API (e.g., `http://localhost:8080/api/auth/`).
- `REACT_APP_API_BASE_URL`: Base URL for general backend API calls (e.g., `http://localhost:8080/api`).
- `REACT_APP_API_REQUESTS_URL`: Full URL to the backend tire requests API (e.g., `http://localhost:8080/api/requests`).
- `REACT_APP_API_WS_URL`: Full URL for the WebSocket connection (e.g., `http://localhost:8080/ws-tire-request`).

## Future Enhancements
- Detailed user profile management.
- Password reset functionality.
- Advanced filtering and reporting for requests.
- More granular WebSocket topics and notification preferences.
- Full Admin UI for user management and system configuration.
- Unit and integration tests for backend and frontend.
- Production hardening (HTTPS, robust error handling, logging, monitoring).
- Internationalization (i18n).

---
This README provides a comprehensive overview for developers and users to understand, set up, and run the Tire Request Management System.
