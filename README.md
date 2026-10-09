<div align="center">
  <img src="frontend/src/assets/logo.png" alt="Scriba Logo" width="100" />
  <h1>Scriba</h1>
  <p>Your thoughts, organized beautifully. Productivity for thinkers.</p>

  <p>
    <a href="https://github.com/junaiddbz/Notes-App/issues"><img src="https://img.shields.io/github/issues/junaiddbz/Notes-App" alt="Issues" /></a>
    <a href="https://github.com/junaiddbz/Notes-App/pulls"><img src="https://img.shields.io/github/issues-pr/junaiddbz/Notes-App" alt="Pull Requests" /></a>
    <a href="https://github.com/junaiddbz/Notes-App/blob/main/LICENSE"><img src="https://img.shields.io/github/license/junaiddbz/Notes-App" alt="License" /></a>
  </p>
</div>

<br />

Scriba is a modern, collaborative note-taking application designed to keep your thoughts organized in a calm workspace. It features a rich markdown-friendly editor, real-time collaboration, granular sharing permissions, and lightning-fast search capabilities across workspaces.

---

## Features

- **Rich Markdown Editor:** Focus on writing with a beautiful, zero-latency editor that supports quick markdown formatting.
- **Workspaces & Organization:** Organize your notes into logical workspaces and folders. Drag, drop, and structure your thoughts intuitively.
- **Real-time Collaboration:** Edit notes simultaneously with your team. Active presence indicators show who is currently viewing or editing.
- **Granular Sharing & Permissions:** Share individual notes or entire workspaces with Colleagues, Viewers, or Editors. Control access at every level.
- **Powerful Search:** Find any note across all your workspaces in milliseconds.
- **History & Trash:** Never lose a thought. Access note versions, and recover accidentally deleted notes from the Trash.
- **Secure Authentication:** JWT-based authentication with support for OAuth (Google & GitHub).

## Technology Stack

**Frontend:**
- React 18
- Tailwind CSS (with bespoke glassmorphism & dark-mode aesthetics)
- Axios & Zustand (State Management)
- React Router DOM

**Backend:**
- Django & Django REST Framework (DRF)
- PostgreSQL / SQLite
- Celery & Redis (Asynchronous task processing, Emails, etc.)
- SimpleJWT (Authentication)

---

## Getting Started

### Prerequisites

- Node.js (v16+)
- Python (3.10+)
- Redis (for background tasks)

### Backend Setup

1. **Navigate to the backend directory:**
   ```bash
   cd backend
   ```

2. **Create and activate a virtual environment:**
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. **Install dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

4. **Environment Variables:**
   Create a `.env` file based on `.env.example`:
   ```bash
   cp .env.example .env
   ```
   *Make sure to configure your database, Redis URL, and JWT secret keys.*

5. **Run Migrations:**
   ```bash
   python manage.py migrate
   ```

6. **Start the development server:**
   ```bash
   python manage.py runserver
   ```

7. **Start the Celery worker (in a separate terminal):**
   ```bash
   celery -A config worker -l info --pool=solo
   ```

### Frontend Setup

1. **Navigate to the frontend directory:**
   ```bash
   cd frontend
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Environment Variables:**
   Create a `.env` file in the frontend root:
   ```env
   REACT_APP_API_URL=http://localhost:8000/api
   ```

4. **Start the React app:**
   ```bash
   npm start
   ```

Your app should now be running on [http://localhost:3000](http://localhost:3000).

---

## Docker / Production Deployment

Scriba comes with a fully configured `docker-compose.yml` and `nginx.conf` for seamless production deployment. 

To spin up the entire stack (Backend, Frontend, DB, Redis, Celery) via Docker:
```bash
docker-compose up -d --build
```

---

## Contributing

Contributions, issues, and feature requests are welcome! 
Feel free to check the [issues page](https://github.com/junaiddbz/Notes-App/issues).

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## License

This project is open-source and available under the [MIT License](LICENSE).

<div align="center">
  <sub>Developed with ❤️ by <a href="https://github.com/junaiddbz">junaiddbz</a></sub>
</div>
