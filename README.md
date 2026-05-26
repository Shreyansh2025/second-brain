<div align="center">
  <h1>🧠 Second Brain</h1>
  <p><strong>AI-Powered Personal Knowledge Management System</strong></p>
  <p>
    <a href="https://second-brain-ten-phi.vercel.app">Live Demo</a> •
    <a href="#features">Features</a> •
    <a href="#tech-stack">Tech Stack</a> •
    <a href="#getting-started">Getting Started</a>
  </p>
  <img src="https://img.shields.io/badge/React-18-blue?style=flat-square&logo=react" />
  <img src="https://img.shields.io/badge/Node.js-Express-green?style=flat-square&logo=node.js" />
  <img src="https://img.shields.io/badge/MongoDB-Atlas-green?style=flat-square&logo=mongodb" />
  <img src="https://img.shields.io/badge/Deployed-Vercel%20%2B%20Render-black?style=flat-square" />
</div>

---

## What is Second Brain?

Second Brain is a full-stack web application that acts as your personal digital knowledge vault. Instead of losing valuable content across browser bookmarks, WhatsApp saved messages, and scattered notes — everything lives in one place.

Save YouTube videos, articles, links, and notes. Let AI handle the tagging, title extraction, and organization.

**Live:** https://second-brain-ten-phi.vercel.app

---

## Features

### Core
- 📎 **Save anything** — YouTube videos, links, articles, notes
- 🏷️ **AI auto-tagging** — Groq LLM automatically categorizes every resource
- 🔍 **Smart search** — searches across titles, tags, extracted text, and notes
- ⭐ **Favorites** — star important resources for quick access
- 📅 **Weekly digest** — see everything you saved this week grouped by day

### AI Pipeline
- 📸 **Screenshot OCR** — upload a screenshot of a YouTube video, Tesseract.js extracts the text, Groq identifies the video title, YouTube API finds the exact video
- 🎬 **Reel parser** — paste an Instagram reel caption listing multiple videos, Groq extracts all titles, YouTube API finds each one, bulk save with one click
- 🔗 **Auto video fetch** — paste a YouTube URL, app automatically fetches title, channel, and thumbnail

### Security
- 🔐 **JWT authentication** with bcrypt password hashing
- 👤 **User-scoped data** — strict userId filtering ensures users only see their own resources
- 🚦 **Rate limiting** on all AI endpoints

---

## Tech Stack

### Frontend
| Technology | Purpose |
|---|---|
| React 18 + Vite | UI framework |
| Tailwind CSS | Styling |
| Axios | HTTP client |
| Context API | Global state management |

### Backend
| Technology | Purpose |
|---|---|
| Node.js + Express | Server framework |
| MongoDB + Mongoose | Database |
| JWT + bcryptjs | Authentication |
| Multer + Cloudinary | Image uploads |
| Tesseract.js | OCR text extraction |
| Groq (Llama 3) | AI title extraction + auto-tagging |
| YouTube Data API v3 | Video search and metadata |

### Infrastructure
| Service | Purpose |
|---|---|
| MongoDB Atlas | Cloud database |
| Cloudinary | Image storage CDN |
| Render | Backend deployment |
| Vercel | Frontend deployment |

---

## Getting Started

### Prerequisites
- Node.js v18+
- MongoDB Atlas account
- Cloudinary account
- YouTube Data API key
- Groq API key

### Installation

**1. Clone the repository**
```bash
git clone https://github.com/shreyansh2025/second-brain.git
cd second-brain
```

**2. Setup the backend**
```bash
cd server
npm install
```

Create `server/.env`:
```env
PORT=5000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
CLIENT_URL=http://localhost:5173
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
YOUTUBE_API_KEY=your_youtube_key
GROQ_API_KEY=your_groq_key
```

```bash
npm run dev
```

**3. Setup the frontend**
```bash
cd ../client
npm install
```

Create `client/.env`:
```env
VITE_API_URL=http://localhost:5000/api
```

```bash
npm run dev
```

**4. Open** `http://localhost:5173`

---

## Project Structure

```
second-brain/
├── client/                  # React frontend
│   └── src/
│       ├── components/      # Reusable UI components
│       ├── pages/           # Dashboard, Settings, Digest
│       ├── context/         # Auth + Resource context
│       └── services/        # API service functions
│
└── server/                  # Node.js backend
    ├── controllers/         # Business logic
    ├── models/              # Mongoose schemas
    ├── routes/              # API endpoints
    ├── middleware/          # Auth + error handling
    ├── config/              # DB + Cloudinary setup
    └── utils/               # Shared utilities
```

---

## API Endpoints

### Auth
```
POST /api/auth/register   Create account
POST /api/auth/login      Sign in
GET  /api/auth/me         Get current user
```

### Resources
```
GET    /api/resources              Get all resources (with filters)
POST   /api/resources              Create resource
PUT    /api/resources/:id          Update resource
DELETE /api/resources/:id          Delete resource
GET    /api/resources/digest       Weekly digest
GET    /api/resources/tags         All unique tags
POST   /api/resources/upload       Upload image to Cloudinary
POST   /api/resources/process-screenshot   OCR + YouTube search pipeline
POST   /api/resources/process-reel         Reel caption parser
POST   /api/resources/save-reel-videos     Bulk save videos
POST   /api/resources/youtube-details      Fetch video metadata by URL
POST   /api/resources/auto-tag             AI tag suggestion
```

---

## Deployment

- **Backend** → [Render](https://render.com) — set all environment variables in Render dashboard
- **Frontend** → [Vercel](https://vercel.com) — set `VITE_API_URL` to your Render backend URL

---

## Author

**Shreyansh Surana**
- GitHub: [@shreyansh2025](https://github.com/shreyansh2025)
- LinkedIn: [Shreyansh Surana](https://linkedin.com/in/shreyansh-surana-009206322/)

---

<div align="center">
  <p>Built from scratch — no boilerplate, no templates.</p>
</div>
