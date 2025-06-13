# Scary Hour 4

**A Project by artisthbtl**

This project was inspired by the common hurdles many beginners face when starting in cybersecurity. The initial, complex setup of virtual machines and VPNs required by platforms like HackTheBox can be a significant barrier, not to mention the challenge of knowing where to even begin.

Scary Hour 4 is a web-based cybersecurity learning platform built to eliminate those barriers. It provides an integrated environment where users get an in-browser Kali Linux terminal, pre-connected to a private, hackable machine. This allows beginners to get hands-on experience with real-world tools and techniques immediately, without any complex setup. To ensure no one gets lost, the platform also includes "Dexter," an interactive guide that walks users through the fundamentals of penetration testing, CTFs, and cybersecurity concepts.

## Features

* **User Authentication:** Secure user registration and login system using JWT.
* **Dynamic Learning Materials:** Browse and select different cybersecurity topics and materials from the database.
* **Isolated Lab Environments:** On-demand creation of isolated lab environments using Docker, featuring a user-specific Kali Linux container.
* **Networked Targets:** Automatic creation of a private network and a "hackable machine" container for relevant learning materials.
* **Interactive Web Terminal:** A full-featured, browser-based terminal (using xterm.js) connected to the Kali container via WebSockets.
* **Interactive Guide:** A step-by-step guide that appears at the start of a lab and can be triggered by in-terminal user commands to provide hints and congratulations.
* **Backend:** Built with Django, Django REST Framework, and Django Channels.
* **Frontend:** Built with React.

## Prerequisites

Before you begin, ensure you have the following installed:

* **Linux Environment:** Highly recommended for the full functionality, especially for Docker and pseudo-terminal (`pty`) operations.
* **Git:** For cloning the repository.
* **Python:** Version 3.8+ recommended.
* **Node.js and npm:** For managing frontend dependencies (LTS version recommended).
* **Docker:** Essential for running the isolated lab environments.

## Installation

Follow these steps to set up your development environment.

1.  **Clone the Repository:**
    ```bash
    git clone [https://github.com/artisthbtl/scaryhour4](https://github.com/artisthbtl/scaryhour4)
    cd scaryhour4
    ```

2.  **Backend Dependencies (Python):**
    * Navigate to the backend directory:
        ```bash
        cd backend
        ```
    * Create and activate a Python virtual environment:
        ```bash
        python3 -m venv env
        source .env/bin/activate
        ```
    * Install Python packages:
        ```bash
        pip install -r requirements.txt
        ```

3.  **Frontend Dependencies (Node.js):**
    * From the project root (`scaryhour4`), navigate to the frontend directory:
        ```bash
        cd ../frontend 
        # Or `cd frontend` if you are in the root
        ```
    * Install Node.js packages:
        ```bash
        npm install
        ```

4.  **Build Docker Images:**
    This is a critical step. You must build the custom Docker images for the Kali terminal and the hackable machine.
    * Build the Kali image (from the `scaryhour4/backend` directory):
        ```bash
        # Ensure you are in the 'backend' directory
        docker build -t scaryhour-kali .
        ```
    * Build the hackable machine image:
        ```bash
        # Navigate to the specific machine's directory
        cd docker/hackable_machine/
        docker build -t hackable-machine-v1 .
        ```

## Setup & Running the Application

1.  **Prepare the Backend Database:**
    * From the `backend` directory with your virtual environment activated, run the database migrations:
        ```bash
        python manage.py makemigrations
        python manage.py migrate
        ```
    * Create a superuser account to access the Django Admin panel:
        ```bash
        python manage.py createsuperuser
        ```
    * Follow the prompts to create your admin user.

2.  **Add Learning Content:**
    * Start the backend server for now (`daphne -p 8000 backend.asgi:application`).
    * Go to `http://127.0.0.1:8000/admin/` and log in.
    * Use the admin panel to create a `Topic`, a `Material`, and `GuideStep` objects for that material.

3.  **Run the Servers:**
    You will need three terminals running simultaneously.
    * **Terminal 1: Start Docker:** Ensure your Docker daemon is running.
    * **Terminal 2: Start Backend Server:** From the `backend` directory (with venv activated), run Daphne:
        ```bash
        daphne -p 8000 backend.asgi:application
        ```
    * **Terminal 3: Start Frontend Server:** From the `frontend` directory, run:
        ```bash
        npm start
        ```
    * Now you can access the application, likely at `http://localhost:3000`.

---
A Project by **artisthbtl**