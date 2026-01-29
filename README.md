# Galaxy Ideas

A futuristic, space-themed idea creation and visualization platform where every user's ideas appear as glowing stars inside their own interactive personal galaxy.

## Features

- **Interactive Galaxy Canvas** - Ideas rendered as glowing stars with pan, zoom, and drag
- **Constellation Links** - Connect related ideas with pulsing lines
- **Idea Evolution** - Track ideas from spark to completion with visual brightness
- **Public Sharing** - Share your galaxy with a unique URL
- **Cinematic Design** - Dark cosmic theme with orange accents

## Tech Stack

**Frontend:** React 18, Vite, Tailwind CSS, HTML5 Canvas
**Backend:** FastAPI, MongoDB, JWT Authentication

## Getting Started

### Prerequisites

- Node.js 18+
- Python 3.9+
- MongoDB running locally

### Installation

1. Clone the repository
```bash
git clone https://github.com/alfredang/idea-galaxy.git
cd idea-galaxy
```

2. Install backend dependencies
```bash
cd backend
pip install -r requirements.txt
```

3. Install frontend dependencies
```bash
cd ../frontend
npm install
```

### Running the Application

**Terminal 1 - Backend:**
```bash
cd backend
uvicorn server:app --reload --port 8000
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
```

Open http://localhost:5173

## Environment Variables

Create `backend/.env`:
```
MONGO_URL="mongodb://localhost:27017"
DB_NAME="galaxy_ideas"
CORS_ORIGINS="http://localhost:5173"
SECRET_KEY="your-secret-key"
```

## License

MIT
