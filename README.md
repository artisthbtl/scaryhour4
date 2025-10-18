# Scary Hour 4

**A Project by artisthbtl**

This project was inspired by the common hurdles many beginners face when starting in cybersecurity. The initial, complex setup of virtual machines and VPNs required by platforms like HackTheBox can be a significant barrier, not to mention the challenge of knowing where to even begin.

We introduce Scary Hour 4, a cybersecurity learning platform that lets beginners to get hands-on hacking experience without having to do all the complex setups, and also, helps them get through the initial learning curve we all been through when starting our penetration testing journey. Scary Hour 4 provides an integrated hacking lab that consists of 2 things:
1. An in-browser Kali Linux terminal that has been pre-configured to the desired hackable machine, isolated for each user.
2. An interactive guide that helps users get through every materials on the platform, it teaches them the fundamentals of Linux, CTF, and Penetration Testing.

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

* [Docker](https://www.docker.com/products/docker-desktop/) and [Docker Compose](https://docs.docker.com/compose/install/): Essential for building and running the entire application stack.

## How to Run This Project

This project is fully containerized. Follow these steps to get the entire platform running in minutes.

1.  **Clone the Repository:**
    ```bash
    git clone [https://github.com/artisthbtl/scaryhour4](https://github.com/artisthbtl/scaryhour4)
    cd scaryhour4/
    ```

2.  **Run the Application:**
    Navigate to the project's root directory (the one containing `docker-compose.yml`) and run:

    ```bash
    docker-compose up --build
    ```

    The application will be running at [http://localhost](http://localhost).

3.  **Create an Admin Account:**
    To add lab materials, you must first create a superuser.

    * Open a **new separate terminal**
    * Still in the root directory, run:
        ```bash
        docker-compose exec backend python manage.py createsuperuser
        ```
    * Follow the prompts to create your username and password.

4.  **Add Learning Content:**
    * Go to the admin panel: [http://localhost/admin](http://localhost/admin)
    * Log in with the superuser credentials you just created.
    * Add your `Topics`, `Materials`, and `GuideSteps` to populate the platform.

If you've done creating a material, then that's it. Navigate to that material, then run 'ping target' to check if the terminal and the target machine is connected.