# Tarun-Mayank
Major Project (Tarun & Mayank)

## Project Overview

This is a full-stack job hunting platform with:
- **Frontend**: Static HTML/CSS/JS job search interface
- **Backend**: FastAPI server with job listings, user authentication, and admin panel
- **Bot**: Streamlit AI-powered resume and interview assistant

## Features

- Job search and filtering
- User registration and login
- Job posting (authenticated users)
- Admin panel for managing jobs and users
- AI-powered career assistance bot
- PDF resume analysis

## Tech Stack

- **Frontend**: HTML5, CSS3, JavaScript
- **Backend**: Python FastAPI, SQLAlchemy, SQLite
- **Bot**: Python Streamlit, LangChain, Groq AI
- **Deployment**: Vercel (frontend), Render (backend & bot)

## Local Development

### Prerequisites
- Python 3.8+
- Node.js (optional, for frontend validation)

### Setup

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd Tarun-Mayank
   ```

2. **Backend Setup**
   ```bash
   cd backend
   pip install -r requirements.txt
   # Create .env file with your API keys
   cp .env.example .env  # Add your keys
   uvicorn main:app --reload
   ```
   Backend runs on http://127.0.0.1:8000

3. **Bot Setup**
   ```bash
   cd ../Bot
   pip install -r requirements.txt
   streamlit run app.py
   ```
   Bot runs on http://localhost:8501

4. **Frontend**
   - Open `frontend/index.html` in browser
   - Or use a local server: `cd frontend && python -m http.server 3000`

## Deployment Guide

### 1. Frontend Deployment (Vercel)

**Steps:**
1. Sign up at [vercel.com](https://vercel.com) and connect your GitHub account
2. Import your repository
3. Select the `frontend` folder for deployment
4. Vercel will automatically detect it as a static site
5. Deploy - your frontend will be live at a Vercel URL

**Configuration:**
- Update `scripts.js` API_BASE to point to your deployed backend URL
- The `vercel.json` ensures proper routing for the single-page app

### 2. Backend Deployment (Render)

**Steps:**
1. Sign up at [render.com](https://render.com) and connect your GitHub repo
2. Create a new **Web Service**:
   - Repository: Your GitHub repo
   - Root Directory: `backend`
   - Runtime: Python 3
   - Build Command: `pip install -r requirements.txt`
   - Start Command: `uvicorn main:app --host 0.0.0.0 --port $PORT`
3. Add Environment Variables:
   - `GROQ_API_KEY`: Your Groq API key
   - `SECRET_KEY`: A secure random string (generate with `openssl rand -hex 32`)
   - `ADZUNA_APP_ID`: Your Adzuna API ID (if used)
   - `ADZUNA_APP_KEY`: Your Adzuna API key (if used)
4. Deploy

**Database Notes:**
- Currently uses SQLite (file-based)
- Data won't persist across deploys on Render
- For production, upgrade to Render's PostgreSQL and update code accordingly

### 3. Bot Deployment (Render)

**Steps:**
1. In Render, create another **Web Service**:
   - Repository: Your GitHub repo
   - Root Directory: `Bot`
   - Runtime: Python 3
   - Build Command: `pip install -r requirements.txt`
   - Start Command: `streamlit run app.py --server.port $PORT --server.headless true`
2. Add Environment Variables:
   - `GROQ_API_KEY`: Your Groq API key
3. Deploy

### Environment Variables Setup

Create `.env` files in `backend/` and `Bot/` directories:

**backend/.env:**
```
GROQ_API_KEY=your_groq_api_key_here
SECRET_KEY=your_secure_random_string_here
ADZUNA_APP_ID=your_adzuna_app_id
ADZUNA_APP_KEY=your_adzuna_app_key
```

**Bot/.env:**
```
GROQ_API_KEY=your_groq_api_key_here
```

**Important:** Never commit `.env` files to Git. Add them to `.gitignore`.

### Post-Deployment Configuration

1. **Update Frontend API URLs:**
   - In `frontend/scripts.js`, change `API_BASE` from `http://127.0.0.1:8000` to your Render backend URL

2. **CORS Settings:**
   - In `backend/main.py`, update `allow_origins` to include your Vercel frontend URL

3. **Testing:**
   - Test all endpoints after deployment
   - Verify authentication works
   - Check bot functionality

### Custom Domains (Optional)

Both Vercel and Render support custom domains:
- Vercel: Add domain in project settings
- Render: Add domain in service settings

### Troubleshooting

**Common Issues:**
- **CORS errors**: Update backend CORS origins
- **API key errors**: Verify environment variables are set correctly
- **Database issues**: Check if using persistent database for production
- **Bot not loading**: Ensure Streamlit config is correct

**Logs:**
- Check Render dashboard for deployment logs
- Vercel provides build and runtime logs

## API Documentation

### Backend Endpoints

**Authentication:**
- `POST /register` - User registration
- `POST /login` - User login
- `GET /api/users/me` - Get current user info

**Jobs:**
- `GET /api/jobs` - Get all jobs
- `GET /api/jobs/search` - Search jobs with filters
- `POST /api/jobs` - Post new job (authenticated)
- `DELETE /api/jobs/{job_id}` - Delete job (authenticated)

**Admin:**
- `GET /admin` - Admin panel (HTML)
- `POST /admin/add-job` - Add job via admin
- `POST /admin/register` - Register user via admin

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test locally
5. Submit a pull request

## License

This project is licensed under the MIT License.
