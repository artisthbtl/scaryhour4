# Scary Hour 4

**A Project by artisthbtl**

Scary Hour 4 is a web-based cybersecurity learning platform designed to provide users with hands-on experience. Users can select different learning materials (e.g., SQL Injection, Linux basics) and instantly launch an isolated Kali Linux terminal connected to a pre-configured hackable machine. This allows for practicing real-world commands and techniques directly in the browser without any complex setup.

## Features (Current & Planned)

* User registration and authentication.
* Browse and select cybersecurity learning materials.
* Dynamic modal display for material details.
* **Core Feature (In Development):** Interactive, isolated Kali Linux terminals (using xterm.js and Docker) for hands-on labs.
* **Core Feature (In Development):** Automatic networking of Kali terminals with dedicated hackable machine Docker containers.
* Backend built with Django and Django REST Framework.
* Frontend built with React.
* (Future) Interactive guide "Dexter" to assist users.

## Prerequisites

Before you begin, ensure you have the following installed:

* **Linux Environment:** Highly recommended for the full functionality, especially for Docker and pseudo-terminal (pty) operations.
* **Git:** For cloning the repository.
* **Python:** Version 3.8+ recommended.
* **Pip:** Python package installer (usually comes with Python).
* **Node.js and npm:** For managing frontend dependencies and running the React app. (Node.js LTS version recommended).
* **Docker:** Essential for running the isolated lab environments (Kali Linux and hackable machines).

## Installation

Follow these steps to set up your development environment:

1.  **Clone the Repository:**
    Open your terminal in your preferred directory (preferably within a Linux environment) and run:
    ```bash
    git clone [https://github.com/artisthbtl/scaryhour4](https://github.com/artisthbtl/scaryhour4)
    cd scaryhour4
    ```

2.  **Backend Setup (Django):**
    * Navigate to the backend directory:
        ```bash
        cd backend
        ```
    * Create a Python virtual environment. This keeps your project dependencies isolated:
        ```bash
        python3 -m venv venv
        ```
    * Activate the virtual environment:
        * On Linux/macOS:
            ```bash
            source venv/bin/activate
            ```
        * On Windows (Git Bash or WSL recommended if not on a full Linux VM):
            ```bash
            # .\venv\Scripts\activate 
            # Note: Running the full project, especially Docker parts, is best on Linux.
            ```
    * Install the required Python packages:
        ```bash
        pip install -r requirements.txt
        ```

3.  **Frontend Setup (React):**
    * Navigate to the frontend directory from the project root (`scaryhour4`):
        ```bash
        cd ../frontend 
        # If you are already in the 'backend' directory, use 'cd ../frontend'
        # If you are in the 'scaryhour4' root, use 'cd frontend'
        ```
    * Install the Node.js dependencies:
        ```bash
        npm install
        ```

## Running the Application

**(Detailed instructions should be confirmed based on your project specifics)**

Typically, you would run the backend and frontend servers in separate terminals.

**1. Backend Server (Django):**
* Ensure your virtual environment is activated in the `backend` directory.
    ```bash
    cd path/to/scaryhour4/backend
    source venv/bin/activate 
    ```
* Apply database migrations:
    ```bash
    python manage.py makemigrations
    python manage.py migrate
    ```
* Start the Django development server (it will also handle WebSocket connections):
    ```bash
    daphne -p 8000 backend.asgi:application
    ```
    By default, this usually runs on `http://127.0.0.1:8000/`.

**2. Frontend Server (React):**
* Navigate to the `frontend` directory.
    ```bash
    cd path/to/scaryhour4/frontend
    ```
* Start the React development server:
    ```bash
    npm start
    ```
    This usually opens the application in your browser, often on `http://localhost:3000/`.

**3. Docker:**
* Ensure your Docker daemon is running before attempting to use features that spawn containers.

## Important Note on Environment

For the core functionality involving Dockerized terminals and inter-container networking, developing and running this project in a **Linux environment** (or a Linux VM / WSL 2 on Windows) is strongly advised. Pseudo-terminal (`pty`) behavior and Docker networking are most reliably handled in Linux.

## Project Structure (Simplified)