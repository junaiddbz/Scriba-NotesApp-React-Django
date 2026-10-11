# Scriba Frontend Client 🎨

> **A high-performance, accessible, and reactive Single Page Application (SPA) designed for thoughtful writing and workspace organization.**

[![Live Web Application](https://img.shields.io/badge/Live%20App-scriba--notes.duckdns.org-orange?style=for-the-badge&logo=google-chrome&logoColor=white)](https://scriba-notes.duckdns.org)
[![React](https://img.shields.io/badge/React-18.2-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.2-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![Zustand](https://img.shields.io/badge/State-Zustand-443E38?style=for-the-badge&logo=react&logoColor=white)](https://github.com/pmndrs/zustand)
[![Axios](https://img.shields.io/badge/HTTP-Axios-5A29E4?style=for-the-badge&logo=axios&logoColor=white)](https://axios-http.com/)
[![dnd-kit](https://img.shields.io/badge/DnD-@dnd--kit-FF5722?style=for-the-badge)](https://dndkit.com/)

---

## 🏛️ Architecture & Component Design

The Scriba user interface is developed as a modern **React 18 Single Page Application**, designed from the ground up for instantaneous responsiveness, distraction-free writing, and seamless collaborative interactions. The client leverages a unidirectional reactive data flow, atomic component modularity, and an optimized bundle delivery pipeline.

```mermaid
graph TD
    User([User Interaction]) --> Router[React Router v6 Navigation Engine]
    
    subgraph Routing & Guards
        Router --> PublicRoutes[Public Views / Login & Signup]
        Router --> AuthGuard{AuthGuard / ProtectedRoute}
        AuthGuard -->|Authenticated| AppShell[Application Shell & Header]
        AuthGuard -->|Unauthenticated| Redirect[Redirect to /login]
    end

    subgraph State Management [Zustand Reactive Stores]
        AppShell --> AuthStore[useAuthStore / JWT & Profile]
        AppShell --> NotesStore[useNotesStore / Active Note, Search]
        AppShell --> WorkspaceStore[useWorkspaceStore / Workspaces, DND]
    end

    subgraph UI & Experience Layer
        AppShell --> NoteEditor[Markdown & Quill Editor]
        AppShell --> DnDList[dnd-kit Drag & Drop Workspaces]
        AppShell --> SearchModal[Global Millisecond Search]
        AppShell --> ToastSystem[React Toastify Notifications]
    end

    subgraph Networking & Persistence
        AuthStore --> AxiosInstance[Axios Interceptors Instance]
        NotesStore --> AxiosInstance
        WorkspaceStore --> AxiosInstance
        AxiosInstance -->|Bearer Token & Auto-Refresh| REST[Django REST API /api/v1/]
    end
```

---

## 🎓 Academic Perspective: HCI & Frontend Engineering Principles

From a Human-Computer Interaction (HCI) and Computer Science perspective:

1. **Cognitive Load Minimization (Calm Design):**
   - Implements Hick’s Law and Fitts’s Law in navigation layouts. High-frequency actions (creating notes, searching, workspace switching) require minimal click depth, utilizing subtle micro-animations and dark-mode glassmorphic contrast to reduce visual fatigue during prolonged writing sessions.
2. **Reactive State vs. Prop Drilling:**
   - Instead of monolithic Context providers or high-overhead Redux reducers, state is decomposed into decoupled **Zustand stores** (`authStore`, `notesStore`, `workspaceStore`). Zustand’s selector-based subscription model prevents unnecessary virtual DOM re-renders, guaranteeing smooth $60\text{ fps}$ interactions.
3. **Optimistic UI & Non-Blocking Updates:**
   - Notes, pin statuses, and workspace sorting reflect state changes optimistically in the UI before network completion, falling back gracefully and rolling back state upon asynchronous network error notification.
4. **Accessible Drag-and-Drop Algorithms:**
   - Integrated with `@dnd-kit` utilizing collision detection algorithms (`closestCenter`) and keyboard accessibility modifiers to allow reordering of notes and workspaces across varied input modalities.

---

## 💼 Employer Perspective: Production Viability & Engineering Quality

From a technical hiring viewpoint, this application demonstrates practical engineering standards:

- **Automated JWT Interceptor Lifecycle:**
  - `axios` instance configured with response interceptors that listen for `401 Unauthorized` errors. When detected, the interceptor halts failed requests, requests a fresh access token using the refresh token, and seamlessly replays the original requests without disrupting the user session.
- **Production Bundle Optimization:**
  - Automated Webpack tree-shaking and asset minification via Create React App build pipeline, resulting in lean gzipped bundles (~$130\text{ KB}$ JS, ~$10\text{ KB}$ CSS) for sub-second Initial Server Response (TTFB) and Largest Contentful Paint (LCP).
- **Comprehensive Responsive Design:**
  - Tailored with mobile-first Tailwind CSS utility tokens, supporting full responsiveness from mobile viewports ($375\text{px}$) up to ultra-wide displays ($1440\text{px}+$).
- **Custom Design System:**
  - High-end dark theme aesthetics featuring custom radial backdrop glows, tailored amber/orange accent palettes, and accessible contrast ratios conforming to WCAG AA guidelines.

---

## 📁 Source Directory Structure

```
frontend/
├── public/                # Static public assets, manifest, and icons
│   ├── favicon.ico        # Multi-resolution brand icon (16x16 to 64x64)
│   ├── favicon-32x32.png  # High-DPI browser favicon
│   ├── logo192.png        # Mobile WebApp / PWA icon
│   ├── logo512.png        # High-res PWA splash icon
│   ├── index.html         # SPA HTML template
│   └── manifest.json      # Web app manifest metadata
├── src/
│   ├── assets/            # Brand SVGs, images, and brand logos
│   │   └── logo.png       # Master vector/high-res Scriba logo
│   ├── components/        # Reusable presentation and interaction components
│   │   ├── Header.js           # Top navigation, workspace switcher & profile
│   │   ├── SearchModal.js      # Global quick-search dialog
│   │   ├── ShareModal.js       # Granular viewer/editor link generator
│   │   ├── ConfirmationModal.js# Accessible confirmation modal dialogs
│   │   ├── ListItem.js         # Sortable note preview card
│   │   └── ErrorBoundary.js    # React Error Boundary crash protection
│   ├── pages/             # Route-level container components
│   │   ├── LoginPage.js        # Authentication & credentials view
│   │   ├── SignupPage.js       # New account onboarding
│   │   ├── NotePage.js         # Dedicated distraction-free markdown editor
│   │   ├── NotesListPage.js    # Workspace notes gallery and filtering
│   │   ├── WorkspacesPage.js   # Multi-workspace manager with drag-and-drop
│   │   ├── SharedNotesPage.js  # Collaboration hub for incoming notes
│   │   ├── TrashPage.js        # Soft-deleted notes recovery center
│   │   └── SettingsPage.js     # User preferences & profile settings
│   ├── services/          # HTTP communication and API clients
│   │   └── api.js              # Axios client with automatic token refreshing
│   ├── stores/            # Zustand reactive state stores
│   │   ├── authStore.js        # Authentication state, login/logout, tokens
│   │   └── notesStore.js       # Active notes, filtering, search query state
│   ├── App.css            # Custom CSS animations & Tailwind layer extensions
│   ├── App.js             # Root route definitions and ToastContainer
│   └── index.js           # React 18 DOM mount point
├── package.json           # Dependencies and build scripts
└── tailwind.config.js     # Bespoke color palette, tokens, and plugins
```

---

## 🛠️ Local Development & Setup

### 1. Prerequisites
- Node.js 16.x or 18.x
- npm or yarn

### 2. Installation
```bash
# Navigate to the frontend directory
cd frontend

# Install dependencies
npm install
```

### 3. Environment Configuration
Create a `.env` file in the `frontend/` directory (or use `.env.development`):
```env
# Points to local Django backend during development
REACT_APP_API_URL=http://localhost:8000/api
```

### 4. Running the Development Server
```bash
npm start
```
The React development server will start at `http://localhost:3000` with hot-module reloading enabled.

---

## 🚀 Production Build

To compile the production-ready, minified bundle:

```bash
npm run build
```
This generates an optimized `build/` directory ready for deployment to any static host, CDN, or Nginx web server.
