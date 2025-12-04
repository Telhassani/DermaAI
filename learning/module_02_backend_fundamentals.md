# DermaAI Learning Roadmap - Module 2: Backend Fundamentals

**Goal**: Understand how FastAPI handles requests, validates data, and talks to the database.

---

## 1. Concept: The Anatomy of an API Endpoint

In FastAPI, an endpoint is just a Python function that runs when a specific URL is visited. It has three main parts:
1.  **The Decorator**: Tells FastAPI *when* to run the function (HTTP method + URL path).
2.  **The Signature**: Tells FastAPI *what* data the function needs (Body, Query params, Database connection).
3.  **The Logic**: Your actual code that does the work.

### 🗺️ Mapping to DermaAI

Open `backend/app/api/v1/patients.py` and look at the `create_patient` function (around line 250).

```python
@router.post("", response_model=PatientResponse, status_code=status.HTTP_201_CREATED)
async def create_patient(
    patient_data: PatientCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_doctor),
):
```

Let's dissect this:

*   `@router.post("")`: This function handles **POST** requests to `/api/v1/patients` (the prefix is defined in `main.py`).
*   `response_model=PatientResponse`: FastAPI will automatically filter the return data to match this Pydantic schema (hiding passwords, internal fields, etc.).
*   `patient_data: PatientCreate`: This is the magic. FastAPI reads the JSON body of the request, validates it against the `PatientCreate` class, and gives you a nice Python object. If the data is wrong (e.g., missing name), FastAPI sends an error back automatically.
*   `db: Session = Depends(get_db)`: **Dependency Injection**. You don't create a database connection; you ask for one. FastAPI creates it, gives it to you, and closes it when you're done.

---

## 2. Concept: Pydantic & Data Validation

You'll see `schemas` imported often. These are **Pydantic Models**. They define the "shape" of your data.

*   **Request Schemas** (e.g., `PatientCreate`): What you accept from the user.
*   **Response Schemas** (e.g., `PatientResponse`): What you send back to the user.

### 💡 The "Why"

1.  **Safety**: You never work with "raw" dictionaries. You know exactly what fields exist.
2.  **Documentation**: FastAPI uses these models to generate the interactive documentation at `/docs`.
3.  **Filtering**: If your database model has a `hashed_password` field, but your `UserResponse` schema doesn't, FastAPI will automatically remove it from the response.

---

## 3. Hands-on Exercise: The "Quick Note" Endpoint

We are going to add a simple endpoint to `patients.py` that allows a doctor to quickly append a note to a patient's record (simulated for now).

### Step 1: Define the Schema
We need to know what a "Note" looks like.
Open `backend/app/schemas/patient.py` (you might need to create this if it's missing, or check `backend/app/schemas/patient.py` if it exists).
*Actually, let's keep it simple and just use a standard dict for this exercise to see the difference, or define a small class inline.*

### Step 2: Create the Endpoint
Open `backend/app/api/v1/patients.py`.
Add this code at the bottom of the file:

```python
from pydantic import BaseModel

class QuickNote(BaseModel):
    note: str
    priority: str = "normal"

@router.post("/{patient_id}/quick-note")
async def add_quick_note(
    patient_id: int,
    note_data: QuickNote,
    current_user: User = Depends(get_current_doctor),
):
    """
    Simulate adding a quick note to a patient.
    """
    # In a real app, we would save this to the database.
    # For now, we just echo it back with a timestamp.
    from datetime import datetime
    
    return {
        "status": "success",
        "patient_id": patient_id,
        "doctor": current_user.full_name,
        "note": note_data.note,
        "priority": note_data.priority,
        "timestamp": datetime.now()
    }
```

### Step 3: Test It
1.  Save the file.
2.  Go to your browser: `http://localhost:8000/docs`.
3.  Find your new endpoint: **POST /api/v1/patients/{patient_id}/quick-note**.
4.  Click "Try it out".
5.  Enter a `patient_id` (e.g., 1).
6.  Edit the Request body:
    ```json
    {
      "note": "Patient complains of dry skin.",
      "priority": "high"
    }
    ```
7.  Click "Execute".

**Observation**: You didn't write any code to parse JSON, check if `priority` is a string, or format the response. FastAPI did it all.

---

## 4. Knowledge Check

1.  What happens if you send `{"priority": 123}` (a number) instead of a string in the exercise above?
2.  What is the purpose of `response_model` in the `@router` decorator?
3.  Why do we use `Depends(get_db)` instead of just calling `get_db()` directly inside the function?

### Responses
<!-- Write your answers here -->


---

## 5. Bridge to Next Module

We've built an endpoint, but we just returned fake data. Real apps need to store things.

**Next Module: Data Modeling & Databases**
We will learn how to define **SQLAlchemy Models** (the database tables) and how to use **Alembic** to create those tables in PostgreSQL. We'll turn that "Quick Note" into a real feature that saves to the DB.
