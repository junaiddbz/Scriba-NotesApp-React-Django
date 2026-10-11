<div align="center">
  <img src="frontend/src/assets/logo.png" alt="Scriba Logo" width="110" />
  <h1>Scriba</h1>
  <p><strong>Your thoughts, organized beautifully. Productivity for thinkers.</strong></p>

  <p>
    <a href="https://scriba-notes.duckdns.org">
      <img src="https://img.shields.io/badge/Live%20Website-https%3A%2F%2Fscriba--notes.duckdns.org-orange?style=for-the-badge&logo=google-chrome&logoColor=white" alt="Live Website" />
    </a>
  </p>

  <p>
    <a href="https://github.com/junaiddbz/Scriba-NotesApp-React-Django"><img src="https://img.shields.io/github/stars/junaiddbz/Scriba-NotesApp-React-Django?style=flat-square" alt="Stars" /></a>
    <a href="https://github.com/junaiddbz/Scriba-NotesApp-React-Django/issues"><img src="https://img.shields.io/github/issues/junaiddbz/Scriba-NotesApp-React-Django?style=flat-square" alt="Issues" /></a>
    <a href="https://github.com/junaiddbz/Scriba-NotesApp-React-Django/blob/main/LICENSE"><img src="https://img.shields.io/github/license/junaiddbz/Scriba-NotesApp-React-Django?style=flat-square" alt="License" /></a>
  </p>
</div>

<br />

> **🌐 Live Production Deployment:** Access the live application securely with SSL encryption at **[https://scriba-notes.duckdns.org](https://scriba-notes.duckdns.org)**.

---

## 📖 Deep-Dive Subsystem Documentation

Scriba is designed with enterprise-level modular separation. For complete architectural explanations, system theory, and technical specifications, explore the individual module documentation:

- ⚙️ **[Backend Engineering Documentation (Django, Celery, Redis)](backend/README.md)**  
  *Relational schema design, asynchronous queuing, JWT security theory, rate limiting, and RESTful API endpoints.*
- 🎨 **[Frontend Engineering Documentation (React 18, Tailwind, Zustand)](frontend/README.md)**  
  *HCI design principles, reactive state management, drag-and-drop mechanics, and token lifecycle interceptors.*

---

## ✨ Features at a Glance

- **Distraction-Free Markdown Editor:** Clean, zero-latency note editing supporting rich formatting and markdown shortcuts.
- **Hierarchical Workspaces:** Organize notes into distinct workspaces with fluid drag-and-drop reordering.
- **Real-Time Collaboration & Sharing:** Granular sharing permissions allowing view-only or editing privileges per note or workspace.
- **Lightning-Fast Search:** Real-time query matching across notes, titles, and workspace content in milliseconds.
- **Temporal Trash & Recovery:** Non-destructive soft-delete with 30-day automatic retention countdown and instant restoration.
- **Zero-Trust Security:** JWT-based authentication cycle with automated token rotation and blacklisting.
- **Fully Automated SSL & Reverse Proxy:** Hardened Nginx configuration with Let's Encrypt automated TLS renewal.

---

## 🛠️ Technology Stack

```
+-----------------------------------------------------------------------------------+
|                                 SCRIBA PLATFORM                                   |
+-----------------------------------------------------------------------------------+
|  FRONTEND                |  BACKEND                   |  INFRASTRUCTURE & DEVOPS  |
|  - React 18 (SPA)        |  - Django 4.2 LTS          |  - Oracle Cloud VM        |
|  - Zustand Store         |  - Django REST Framework   |  - Docker & Compose       |
|  - Tailwind CSS 3        |  - Celery 5.3 Task Queue   |  - Nginx Reverse Proxy    |
|  - @dnd-kit Drag & Drop  |  - Redis 7.0 Cache/Broker  |  - Let's Encrypt SSL/TLS  |
|  - Axios Interceptors    |  - SimpleJWT Auth          |  - Gunicorn WSGI Server   |
+-----------------------------------------------------------------------------------+
```

---

## 🚀 Quick Start (Local Development)

### 1. Clone the Repository
```bash
git clone https://github.com/junaiddbz/Scriba-NotesApp-React-Django.git
cd Scriba-NotesApp-React-Django
```

### 2. Local Docker Setup (All-in-One)
The easiest way to run the entire stack locally is using Docker Compose:
```bash
docker-compose up -d --build
```
The app will be available at:
- **Frontend UI:** `http://localhost:3000`
- **Backend API:** `http://localhost:8000/api/`
- **API Documentation:** `http://localhost:8000/api/docs/`

### 3. Manual Local Setup

#### Backend Setup
```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env
python manage.py migrate
python manage.py runserver
```

#### Frontend Setup
```bash
cd frontend
npm install
npm start
```

---

## 🚢 Production Deployment

Scriba is pre-configured for production container orchestration using `docker-compose.prod.yml` and a production-grade `nginx.conf`:

```bash
# Launch production stack on VM
docker compose -f docker-compose.prod.yml up -d --build
```

The production topology mounts:
- **Nginx Reverse Proxy:** Serves optimized static assets, terminates SSL/TLS (HTTPS on port 443 with automated HTTP redirect), and proxies API traffic.
- **Gunicorn WSGI Workers:** High-throughput Python execution with thread pools.
- **Redis Cache & Celery Workers:** Asynchronous background maintenance tasks and distributed session caching.

---

## 📄 License

This project is licensed under the [MIT License](LICENSE).

<div align="center">
  <sub>Developed by <a href="https://github.com/junaiddbz">junaiddbz</a></sub>
</div>
