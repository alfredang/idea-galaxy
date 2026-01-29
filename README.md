# Galaxy Ideas

A space-themed idea visualization platform where your ideas appear as glowing stars in your personal galaxy. Create, connect, and evolve ideas with interactive constellations. Features AI-powered discovery to find similar ideas across users.

## Features

- **Interactive Galaxy Canvas** - Ideas appear as glowing stars with different colors and sizes based on their status
- **Idea Management** - Create, edit, and delete ideas with status tracking (spark, developing, refined, completed, archived)
- **Constellation Links** - Connect related ideas with glowing constellation lines
- **AI-Powered Discovery** - Find similar ideas from other users based on keyword matching
- **Public Galaxy Sharing** - Share your galaxy with others via a public link
- **Responsive Design** - Works on desktop and mobile devices

## Tech Stack

### Frontend
- React 18 with Vite
- Tailwind CSS
- HTML5 Canvas for galaxy visualization
- React Router v6
- Lucide React icons

### Backend
- FastAPI (Python)
- MongoDB with Motor (async driver)
- JWT authentication
- Pydantic for validation

### Database
- MongoDB Atlas (cloud)

## Project Structure

```
idea-galaxy/
├── frontend/           # React frontend
│   ├── src/
│   │   ├── components/ # UI components
│   │   ├── contexts/   # React contexts (Auth)
│   │   ├── hooks/      # Custom hooks (useApi, useGalaxy)
│   │   └── pages/      # Page components
│   └── package.json
├── backend/            # FastAPI backend
│   ├── server.py       # Main API server
│   └── requirements.txt
└── README.md
```

## Local Development

### Prerequisites
- Node.js 18+
- Python 3.11+
- MongoDB Atlas account (or local MongoDB)

### Backend Setup

```bash
cd backend

# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Create .env file
cat > .env << EOF
MONGO_URL="your-mongodb-connection-string"
DB_NAME="galaxy_ideas"
CORS_ORIGINS="http://localhost:5173"
SECRET_KEY="your-secret-key"
EOF

# Run server
uvicorn server:app --reload
```

### Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Run dev server
npm run dev
```

Visit `http://localhost:5173` to see the app.

## Deployment

### Backend (Render)

1. Create a new Web Service on [render.com](https://render.com)
2. Connect your GitHub repository
3. Configure:
   - **Root Directory:** `backend`
   - **Build Command:** `pip install -r requirements.txt`
   - **Start Command:** `uvicorn server:app --host 0.0.0.0 --port $PORT`
4. Add environment variables:
   - `MONGO_URL` - MongoDB Atlas connection string
   - `DB_NAME` - Database name (e.g., `galaxy_ideas`)
   - `SECRET_KEY` - Random secret for JWT signing
   - `CORS_ORIGINS` - Your Netlify frontend URL

### Frontend (Netlify)

1. Create a new site on [netlify.com](https://netlify.com)
2. Connect your GitHub repository
3. Configure:
   - **Base directory:** `frontend`
   - **Build command:** `npm run build`
   - **Publish directory:** `frontend/dist`
4. Add environment variable:
   - `VITE_API_URL` - Your Render backend URL + `/api` (e.g., `https://your-app.onrender.com/api`)

## Live Demo

- Frontend: https://idea-galaxy.netlify.app
- Backend API: https://galaxy-ideas-api.onrender.com/docs

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/auth/signup | Create account |
| POST | /api/auth/login | Login |
| GET | /api/auth/me | Get current user |
| GET | /api/ideas | List user's ideas |
| POST | /api/ideas | Create idea |
| PUT | /api/ideas/:id | Update idea |
| DELETE | /api/ideas/:id | Delete idea |
| GET | /api/ideas/:id/related | Get AI-matched related ideas |
| GET | /api/constellations | List constellation links |
| POST | /api/constellations | Create link between ideas |
| DELETE | /api/constellations/:id | Remove link |
| GET | /api/discover | AI-powered idea discovery |
| GET | /api/public/profile/:userId | Public galaxy view |

## License

MIT
