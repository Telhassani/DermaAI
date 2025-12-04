# DermaAI Learning Roadmap - Module 1: Foundation

**Goal**: Understand how the pieces of DermaAI fit together and how they communicate.

---

## 1. Concept: The Client-Server Model & HTTP

At its core, web development is about **request** and **response**.

*   **Client (Frontend)**: The user interface (browser). It asks for data.
*   **Server (Backend)**: The logic and data keeper. It processes requests and sends back answers.
*   **Protocol (HTTP)**: The language they speak (GET, POST, PUT, DELETE).

### 🗺️ Mapping to DermaAI

In your project, this separation is explicit:

*   **Client**: Your **Next.js** application (`frontend/`). It runs in the user's browser (mostly) and renders the UI.
*   **Server**: Your **FastAPI** application (`backend/`). It listens on port `8000`.

**The Flow:**
1.  User clicks "Login" on the frontend.
2.  Frontend sends a `POST` request to `http://localhost:8000/api/v1/auth/login`.
3.  Backend receives it, checks the database, and returns a JSON response (e.g., `{ "access_token": "..." }`).
4.  Frontend receives the JSON and updates the UI.

---

## 2. Concept: Containerization (Docker)

Imagine trying to run DermaAI on a friend's computer. You'd need to install Python, Node.js, PostgreSQL, Redis, configure versions, set environment variables... it's a mess.

**Docker** solves this by packaging everything an application needs (code, runtime, libraries) into a **Container**.

### 🗺️ Mapping to DermaAI

Look at your `docker-compose.yml`. It defines your "virtual data center":

| Service | Container Name | Internal Port | External Port | Role |
| :--- | :--- | :--- | :--- | :--- |
| `postgres` | `dermai-postgres` | 5432 | 5432 | **Database**: Stores permanent data (users, patients). |
| `redis` | `dermai-redis` | 6379 | 6379 | **Cache**: Stores temporary data (sessions, task queues). |
| `backend` | `dermai-backend` | 8000 | 8000 | **API**: The brain. Runs Python/FastAPI. |
| `frontend` | `dermai-frontend` | 3000 | 3000 | **UI**: The face. Runs Node.js/Next.js. |
| `celery-worker`| `dermai-celery-worker` | N/A | N/A | **Worker**: Does heavy lifting in the background. |

### 💡 The "Why"

*   **Isolation**: The `postgres` container uses Alpine Linux. Your Mac uses macOS. Docker makes them play nice.
*   **Networking**: Docker creates a private network (`dermai-network`).
    *   The **Backend** can talk to **Postgres** by using the hostname `postgres` (defined in `docker-compose.yml`).
    *   *Example*: In `backend/app/core/config.py` (implied), your DB URL is likely `postgresql://user:pass@postgres:5432/db`.

---

## 3. Hands-on Exercise: Tracing the Connections

Let's prove that these connections exist and understand how to debug them.

### Step 1: Verify the Network
We will inspect the Docker network to see all your running services connected together.

1.  Open your terminal.
2.  Run: `docker network inspect dermai-network`
3.  **Observation**: Look at the `Containers` section. You should see all your services (backend, frontend, postgres, etc.) listed with their IP addresses within that virtual network.

### Step 2: The "Health" Check
We will trace a request from your machine to the backend container.

1.  Ensure your app is running (`docker compose up -d`).
2.  Open `backend/app/main.py` and find the `/health` endpoint (lines 92-95).
3.  In your terminal, run:
    ```bash
    curl -v http://localhost:8000/health
    ```
4.  **Observation**:
    *   `> GET /health HTTP/1.1`: You sent a GET request.
    *   `< HTTP/1.1 200 OK`: The backend replied "OK".
    *   `< content-type: application/json`: The data is JSON.

### Step 3: Modify and Observe
Let's make a change to prove you control the backend.

1.  Open `backend/app/main.py`.
2.  Locate the `health_check` function:
    ```python
    @app.get("/health", tags=["Health"])
    async def health_check():
        """Health check endpoint for load balancers"""
        return {"status": "healthy"}
    ```
3.  Change it to:
    ```python
    @app.get("/health", tags=["Health"])
    async def health_check():
        """Health check endpoint for load balancers"""
        return {"status": "healthy", "learner": "Tariq"}
    ```
4.  Save the file.
5.  Watch the logs: `docker compose logs -f backend`
    *   You should see `WARNING:  WatchFiles detected changes...` and the server reloading. This is **Hot Reloading** in action, enabled by the `reload=True` in your `uvicorn` command.
6.  Run the `curl` command again. You should see your name in the response!

---

## 4. Knowledge Check

1.  Why does the Frontend need to know the URL of the Backend, but the Database doesn't need to know the URL of the Frontend?
2.  In `docker-compose.yml`, the backend depends on `postgres`. What happens if `postgres` fails to start?
3.  If you wanted to add a new service (e.g., a separate Email Service), what two files would you definitely need to touch?

### Responses

1.  **Frontend -> Backend**: The Frontend runs in the user's browser and needs to know where to send API requests (the Backend's URL). The Database is a passive store; it doesn't initiate connections to the Frontend, and for security, it shouldn't be directly accessible from the browser anyway.
2.  **Postgres Failure**: Because of the `depends_on: condition: service_healthy` directive, the `backend` container will not start until `postgres` is healthy. If `postgres` fails, the `backend` will remain in a waiting state or fail to start.
3.  **New Service**: You would definitely need to modify:
    *   `docker-compose.yml` (to add the new service definition).
    *   `backend/app/core/config.py` (to add the environment variables/connection strings needed to talk to the new service).


---

## 5. Bridge to Next Module

Now that we know **where** the code lives and **how** the services talk, we need to understand **what** they are saying.

**Next Module: Backend Fundamentals**
We will dive into `FastAPI`. We'll look at how that `/health` endpoint actually works, how to accept data from the user (Pydantic), and how to structure your API for a real application.
