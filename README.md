<div align="center">
  <img src="https://raw.githubusercontent.com/tandpfun/skill-icons/65dea6c4eaca7da319e552c09f4fc5a9/icons/React-Dark.svg" width="80" height="80" alt="Latent Logo" />
  <h1 align="center">Latent</h1>
  <p align="center">
    <strong>The Next-Generation Campus Social Network</strong>
  </p>
  <p align="center">
    <a href="https://react.dev/"><img src="https://img.shields.io/badge/React-19-61DAFB?style=flat-square&logo=react&logoColor=black" alt="React" /></a>
    <a href="https://nodejs.org/"><img src="https://img.shields.io/badge/Node.js-18+-339933?style=flat-square&logo=nodedotjs&logoColor=white" alt="Node" /></a>
    <a href="https://expressjs.com/"><img src="https://img.shields.io/badge/Express.js-4.18-000000?style=flat-square&logo=express&logoColor=white" alt="Express" /></a>
    <a href="https://www.postgresql.org/"><img src="https://img.shields.io/badge/PostgreSQL-15-4169E1?style=flat-square&logo=postgresql&logoColor=white" alt="Postgres" /></a>
    <a href="https://tailwindcss.com/"><img src="https://img.shields.io/badge/Tailwind_CSS-3.4-38B2AC?style=flat-square&logo=tailwind-css&logoColor=white" alt="Tailwind" /></a>
  </p>
</div>

---

## 📖 Overview

**Latent** is a high-performance, full-stack digital environment designed exclusively for university students. It bridges the gap between academics, social interaction, and campus utility by providing a unified platform where students can seamlessly connect, collaborate, and navigate campus life.

Engineered with a stunning **glassmorphic aesthetic (Lumina Campus Theme)**, Latent doesn't just work well—it feels incredible to use.

---

## ✨ Key Features

| Module | Description |
| :--- | :--- |
| 📰 **Campus Feed** | A highly engaging, real-time feed for university-wide discussions, announcements, and polls. |
| 👥 **People Directory** | Smart student directory filtering by batch, branch, and interests. |
| 📅 **Event Hub** | Discover, RSVP, and manage campus events (fests, tech-talks, club meetings). |
| 📚 **Study Groups** | Dynamic, real-time active group matching for collaborative learning and exam prep. |
| 🛒 **Marketplace** | Peer-to-peer campus marketplace to buy, sell, or rent textbooks and equipment. |
| 🔍 **Lost & Found** | An immutable ledger to report and recover misplaced items securely. |
| 🍽️ **Mess Management** | Live dining hall menus, real-time updates, and Razorpay integrated ticket booking. |
| 🎭 **Clubs & Orgs** | Dedicated profiles and member management for extracurricular organizations. |

---

## 🏗️ System Architecture

The application is structured into a strictly partitioned, loosely-coupled client-server architecture to ensure high throughput, concurrency, and security.

### 🎨 Client (Frontend)
- **Core Engine:** React 19 driven by Vite for blazing-fast HMR and optimized production builds.
- **State Architecture:** Global UI state handled via `Zustand`; asynchronous server state and caching managed by `React Query` (TanStack).
- **Aesthetics & Motion:** UI constructed with `Tailwind CSS` adhering to the custom Lumina design system, heavily featuring backdrop filters, fluid typography (Outfit font), and `Framer Motion` micro-animations.

### ⚙️ Service (Backend)
- **Runtime:** Built on `Node.js` leveraging `Express` (v4.18) for routing and middleware orchestration.
- **Data Persistence:** Relational data mapped securely to `PostgreSQL`, utilizing robust connection pooling (`pg`) for high-concurrency environments.
- **Security Posture:** Stateless JWT-based authentication, bcrypt credential hashing, aggressive rate-limiting, and sanitized multipart/form-data ingestion.

---

## 🚀 Getting Started

### 1️⃣ Database Setup
Ensure PostgreSQL is running locally on port `5432` with a database named `latent_db`.
```bash
# In the latent-backend directory
npm run db:schema
npm run db:seed
```

### 2️⃣ Backend Initialization
```bash
cd latent-backend
npm install
```
Create a `.env` file in `latent-backend/`:
```env
PORT=5000
NODE_ENV=development
DATABASE_URL=postgresql://<user>:<password>@localhost:5432/latent_db
JWT_SECRET=your_super_secret_jwt_key
FRONTEND_URL=http://localhost:5173
```
Start the API:
```bash
npm run dev
```

### 3️⃣ Frontend Initialization
```bash
cd latent-frontend
npm install
```
Create a `.env` file in `latent-frontend/`:
```env
VITE_API_URL=http://localhost:5000
```
Start the Development Server:
```bash
npm run dev
```

---

## 🛡️ Engineering Standards

- **Idempotency:** REST API conforms strictly to HTTP semantics.
- **State Isolation:** Cache keys in React Query are rigorously scoped (e.g., `['market', category]`) to prevent state collisions.
- **Design Consistency:** All UI components strictly adhere to the predefined Tailwind configurations to maintain the premium glassmorphic UI.

---
<div align="center">
  <i>Developed with ❤️ for the Campus Community</i>
</div>
