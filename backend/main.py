from urllib.parse import quote_plus ## Convert the Raw Text into URL form
from typing import Dict, List, Optional ## Type Hints
import os 
import datetime ## To get Current Data and Time
from dotenv import load_dotenv

try:
    from langchain_groq import ChatGroq  ## Call API
    from langchain_core.messages import HumanMessage, SystemMessage ## A structured Message
except ImportError:
    ChatGroq = None

from fastapi import Depends, FastAPI, Form, HTTPException, Query, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware ##   Security Purpose
from pypdf import PdfReader
import io
from fastapi.responses import HTMLResponse, RedirectResponse
import bcrypt ## Handles Password Hashing
from sqlalchemy import Column, Integer, String, create_engine, DateTime, or_  ## Create_engine is used to connect with the data base 
from sqlalchemy.exc import IntegrityError ## Handles the Database Constraint error
from sqlalchemy.ext.declarative import declarative_base ## Base Class for all Models
from sqlalchemy.orm import Session, sessionmaker ## Session is used to create a session with the data base

load_dotenv()
GROQ_API_KEY = os.getenv("GROQ_API_KEY")

DATABASE_URL = "sqlite:///./jobs_app.db" ## what type of database and where it is stored

engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False}) ## connects app with database
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()  ## Template for creating tables


import jwt
from fastapi.security import OAuth2PasswordBearer
from datetime import timedelta

SECRET_KEY = os.getenv("SECRET_KEY", "supersecretkey123")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24 * 7 # 1 week

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="login")

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.datetime.utcnow() + expires_delta
    else:
        expire = datetime.datetime.utcnow() + timedelta(minutes=15)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt



app = FastAPI()

app.add_middleware(   ## Controls Communication   
    CORSMiddleware,
    allow_origins=["*"],   ## allow all websites
    allow_credentials=True,
    allow_methods=["*"],  ## Allow all methods
    allow_headers=["*"],  ## Allow all headers
)


class Job(Base):  ## Creates a Job table
    __tablename__ = "jobs"

    id = Column(Integer, primary_key=True, index=True)
    job_id = Column(String, unique=True, index=True, nullable=False)
    title = Column(String, nullable=False)
    company = Column(String, nullable=False)
    link = Column(String, nullable=False)
    location = Column(String, default="Not specified")
    salary = Column(String, default="Not specified")
    experience = Column(String, default="Not specified")
    description = Column(String, default="No description provided")
    jobType = Column(String, default="Full-time")
    postedDate = Column(String, default="Recently")
    category = Column(String, default="General")
    source = Column(String, default="Manual")
    createdAt = Column(DateTime, default=datetime.datetime.utcnow)


class User(Base):   ## User Table
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)


def create_database():
    Base.metadata.create_all(bind=engine)  ## Create all tables in  database


def get_db(): ## session with database
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    credentials_exception = HTTPException(
        status_code=401,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email: str = payload.get("sub")
        if email is None:
            raise credentials_exception
    except jwt.PyJWTError:
        raise credentials_exception
    user = db.query(User).filter(User.email == email).first()
    if user is None:
        raise credentials_exception
    return user


def get_password_hash(password: str) -> str:
    salt = bcrypt.gensalt()
    hashed = bcrypt.hashpw(password.encode('utf-8'), salt)
    return hashed.decode('utf-8')


def verify_password(plain_password: str, hashed_password: str) -> bool:
    try:
        return bcrypt.checkpw(plain_password.encode('utf-8'), hashed_password.encode('utf-8'))
    except Exception:
        return False


def create_default_jobs(db: Session):   ## Create default jobs
    if db.query(Job).count() == 0:
        default_jobs = [
            Job(job_id="JOB001", title="Associate Analyst", company="Novartis", link="https://www.novartis.com/careers/career-search", jobType="Full Time", postedDate="1 Day Ago", category="Engineering"),
            Job(job_id="JOB002", title="Backend Developer", company="Amazon", link="https://amazon.jobs", location="Seattle, WA", salary="$120K-180K", experience="3-5 years", description="Develop scalable backend systems.", jobType="Full-time", postedDate="2 days ago", category="Engineering"),
            Job(job_id="JOB003", title="Data Analyst", company="Microsoft", link="https://careers.microsoft.com", location="Redmond, WA", salary="$100K-140K", experience="2-4 years", description="Analyze data and provide insights.", jobType="Full-time", postedDate="3 days ago", category="Product"),
            Job(job_id="JOB004", title="Frontend Developer", company="Meta", link="https://metacareers.com", location="Menlo Park, CA", salary="$130K-170K", experience="2-4 years", description="Build user interfaces with React.", jobType="Full-time", postedDate="1 day ago", category="Engineering"),
        ]
        db.add_all(default_jobs)
        db.commit()


def clean_text(value: Optional[str]) -> str:  ## Clean the text
    return value.strip() if value else ""



create_database()
with SessionLocal() as session:
    create_default_jobs(session)


@app.get("/")
def home():
    return {"message": "Backend Running 🚀"}


from pydantic import BaseModel
import uuid

@app.get("/api/jobs")
def api_get_jobs(db: Session = Depends(get_db)):
    db_jobs = db.query(Job).order_by(Job.createdAt.desc()).all()
    jobs = [{"id": j.job_id, "title": j.title, "company": j.company, "location": j.location, "salary": j.salary, "description": j.description, "category": j.category, "link": j.link, "source": j.source, "postedDate": j.postedDate, "jobType": j.jobType} for j in db_jobs]
    return {"success": True, "count": len(jobs), "jobs": jobs}

@app.get("/api/jobs/search")
def api_search_jobs(
    keyword: str = "",
    location: str = "",
    category: str = "All Categories",
    fullTime: str = "false",
    remote: str = "false",
    internship: str = "false",
    db: Session = Depends(get_db)
):
    query = db.query(Job)
    if keyword:
        query = query.filter(or_(Job.title.ilike(f"%{keyword}%"), Job.company.ilike(f"%{keyword}%"), Job.description.ilike(f"%{keyword}%")))
    if location:
        query = query.filter(Job.location.ilike(f"%{location}%"))
    if category and category != "All Categories":
        query = query.filter(Job.category.ilike(f"%{category}%"))
    if fullTime.lower() == 'true':
        query = query.filter(Job.jobType.ilike("%full%"))
    if remote.lower() == 'true':
        query = query.filter(Job.location.ilike("%remote%"))
    if internship.lower() == 'true':
        query = query.filter(or_(Job.jobType.ilike("%intern%"), Job.title.ilike("%intern%")))
        
    db_jobs = query.order_by(Job.createdAt.desc()).all()
    jobs = [{"id": j.job_id, "title": j.title, "company": j.company, "location": j.location, "salary": j.salary, "description": j.description, "category": j.category, "link": j.link, "source": j.source, "postedDate": j.postedDate, "jobType": j.jobType} for j in db_jobs]
    return {"success": True, "count": len(jobs), "jobs": jobs}

class JobCreate(BaseModel):
    title: str
    company: str
    location: str = "Not specified"
    salary: str = "Not specified"
    category: str = "General"
    description: str = "No description provided"
    link: str

@app.post("/api/jobs")
def api_post_job(job_data: JobCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    new_job = Job(
        job_id=str(uuid.uuid4()),
        title=job_data.title.strip(),
        company=job_data.company.strip(),
        location=job_data.location.strip(),
        salary=job_data.salary.strip(),
        category=job_data.category.strip(),
        description=job_data.description.strip(),
        link=job_data.link.strip(),
        source="Manual Post",
        jobType="Full-time",
        postedDate="Just now"
    )
    db.add(new_job)
    db.commit()
    db.refresh(new_job)
    return {"success": True, "message": "Job posted successfully", "job_id": new_job.job_id}

from fastapi import HTTPException

@app.delete("/api/jobs/{job_id}")
def api_delete_job(job_id: str, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    job_to_delete = db.query(Job).filter(Job.job_id == job_id).first()
    if not job_to_delete:
        raise HTTPException(status_code=404, detail="Job not found")
    
    db.delete(job_to_delete)
    db.commit()
    return {"success": True, "message": f"Job {job_id} deleted successfully"}

# ... existing code ...

class UserLogin(BaseModel):
    email: str
    password: str

class UserRegister(BaseModel):
    email: str
    password: str

# ... 

@app.post("/register")
def register(user: UserRegister, db: Session = Depends(get_db)):
    if db.query(User).filter(User.email == user.email).first():
        raise HTTPException(status_code=400, detail="Email already registered")
    
    hashed_password = get_password_hash(user.password)
    new_user = User(email=user.email, hashed_password=hashed_password)
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": new_user.email}, expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer", "message": "User registered successfully", "user_id": new_user.id}


@app.post("/login")
def login(user: UserLogin, db: Session = Depends(get_db)):
    db_user = db.query(User).filter(User.email == user.email).first()
    if not db_user:
        raise HTTPException(status_code=400, detail="Invalid email or password")
    
    if not verify_password(user.password, db_user.hashed_password):
        raise HTTPException(status_code=400, detail="Invalid email or password")
    
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": db_user.email}, expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer", "message": "Login successful", "user_id": db_user.id}

@app.get("/api/users/me")
def read_users_me(current_user: User = Depends(get_current_user)):
    return {"email": current_user.email, "id": current_user.id}


@app.get("/admin", response_class=HTMLResponse)
def admin_page(msg: str = "", db: Session = Depends(get_db)):
    jobs = db.query(Job).order_by(Job.id.asc()).all()
    users = db.query(User).order_by(User.id.asc()).all()

    jobs_html = "".join(
        f"<li><strong>{job.job_id}</strong> — {job.title} at {job.company} (<a href='{job.link}' target='_blank'>open</a>)</li>"
        for job in jobs
    )
    users_html = "".join(f"<li>{user.email}</li>" for user in users)

    # ✅ FIXED PART
    msg_html = ""
    if msg:
        msg_html = f'<div style="padding: 14px; background: #164e63; border-radius: 14px; margin-bottom: 20px;">{msg}</div>'

    return f"""
    <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Backend Admin</title>
        <style>
          body {{ font-family: Arial; padding: 24px; background: #101428; color: white; }}
          .card {{ padding: 20px; background: #1e293b; border-radius: 10px; margin-bottom: 20px; }}
          input {{ display: block; margin: 10px 0; padding: 10px; width: 100%; }}
          button {{ padding: 10px 15px; background: #6366f1; color: white; border: none; }}
        </style>
      </head>
      <body>
        <h1>Admin Panel</h1>

        {msg_html}

        <div class="card">
          <h2>Add Job</h2>
          <form method="post" action="/admin/add-job">
            <input name="job_id" placeholder="JOB005" required>
            <input name="title" placeholder="Title" required>
            <input name="company" placeholder="Company" required>
            <input name="link" placeholder="Link" required>
            <button>Add Job</button>
          </form>
        </div>

        <div class="card">
          <h2>Register User</h2>
          <form method="post" action="/admin/register">
            <input name="email" placeholder="Email" required>
            <input name="password" type="password" placeholder="Password" required>
            <button>Register</button>
          </form>
        </div>

        <div class="card">
          <h2>Jobs</h2>
          <ul>{jobs_html}</ul>
        </div>

        <div class="card">
          <h2>Users</h2>
          <ul>{users_html}</ul>
        </div>
      </body>
    </html>
    """


@app.post("/admin/add-job")
def admin_add_job(
    job_id: str = Form(...),
    title: str = Form(...),
    company: str = Form(...),
    link: str = Form(...),
    db: Session = Depends(get_db),
):
    if db.query(Job).filter(Job.job_id == job_id.strip()).first():
        msg = quote_plus("Job ID already exists")
        return RedirectResponse(url=f"/admin?msg={msg}", status_code=303)

    new_job = Job(
        job_id=job_id.strip(),
        title=title.strip(),
        company=company.strip(),
        link=link.strip(),
    )
    db.add(new_job)
    db.commit()
    msg = quote_plus("Job added successfully")
    return RedirectResponse(url=f"/admin?msg={msg}", status_code=303)


@app.post("/admin/register")
def admin_register(
    email: str = Form(...),
    password: str = Form(...),
    db: Session = Depends(get_db),
):
    if db.query(User).filter(User.email == email.strip().lower()).first():
        msg = quote_plus("Email already registered")
        return RedirectResponse(url=f"/admin?msg={msg}", status_code=303)

    hashed_password = get_password_hash(password)
    new_user = User(email=email.strip().lower(), hashed_password=hashed_password)
    db.add(new_user)
    db.commit()
    msg = quote_plus("User registered successfully")
    return RedirectResponse(url=f"/admin?msg={msg}", status_code=303)


class ChatMessage(BaseModel):
    role: str
    content: str

class ChatRequest(BaseModel):
    message: str
    history: Optional[List[ChatMessage]] = []
    resume_context: Optional[str] = ""

@app.post("/api/upload_resume")
async def api_upload_resume(file: UploadFile = File(...)):
    if not file.filename.endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF files are allowed.")
    
    try:
        content = await file.read()
        pdf = PdfReader(io.BytesIO(content))
        text = ""
        for page in pdf.pages:
            extracted = page.extract_text()
            if extracted:
                text += extracted + "\n"
        return {"success": True, "text": text}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/chat")
def chat_endpoint(req: ChatRequest, db: Session = Depends(get_db)):
    if not ChatGroq:
        raise HTTPException(status_code=500, detail="langchain_groq not installed or imported.")
    if not GROQ_API_KEY:
        raise HTTPException(status_code=500, detail="GROQ_API_KEY not found in environment.")

    llm = ChatGroq(
        groq_api_key=GROQ_API_KEY,
        model_name="llama-3.1-8b-instant"
    )

    jobs = db.query(Job).limit(20).all()
    available_jobs_text = "No local jobs available."
    if jobs:
        available_jobs_text = "Here are some current job postings on our website:\n"
        for job in jobs:
            available_jobs_text += f"- {job.title} at {job.company} (Link: {job.link}, Location: {job.location}, Experience: {job.experience})\n"

    system_prompt = f"""
    You are a highly adaptable AI Interview Preparation Assistant.
    Your objective is to prepare the user for ANY type of interview (e.g., Software Engineering, Data Science, Product Management, Marketing, Finance, HR, etc.).
    Your tasks:
    - Give VERY CONCISE and interactive answers. Do not output large walls of text unless absolutely necessary.
    - If the user asks for job recommendations, FIRST recommend jobs from our local database listed below. Then suggest other external websites (like LinkedIn, Indeed) for further exploration.
    - Always provide direct actionable links if the user wants resources or roadmaps.
    - If resume context is provided below, act as a resume analyzer, point out missing skills, and tailor your interview prep to their resume.
    - Conduct mock interviews with role-specific questions and provide constructive feedback on their skills and answers.
    - Give clear, structured answers using markdown.

    --- LOCAL DATABASE JOBS ---
    {available_jobs_text}
    """
    
    if req.resume_context:
        system_prompt += f"\n\n--- RESUME CONTEXT ---\n{req.resume_context}\n----------------------"

    messages = [SystemMessage(content=system_prompt)]
    for msg in req.history:
        # Avoid passing system messages from history if any exist, although UI shouldn't send them
        if msg.role == "user":
            messages.append(HumanMessage(content=msg.content))
        elif msg.role == "assistant":
            # For simplicity, we can pass assistant messages back as HumanMessage or SystemMessage depending on strictness, 
            # Langchain can use AIMessage
            from langchain_core.messages import AIMessage
            messages.append(AIMessage(content=msg.content))
            
    messages.append(HumanMessage(content=req.message))

    try:
        response = llm.invoke(messages)
        return {"success": True, "reply": response.content}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))