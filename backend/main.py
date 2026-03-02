from fastapi import FastAPI, Depends, HTTPException
from sqlalchemy.orm import Session
import models, database 
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from passlib.context import CryptContext 
from typing import Optional, Dict

# Налаштування хешування паролів
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# Створення таблиць у PostgreSQL
models.Base.metadata.create_all(bind=database.engine)

app = FastAPI(title="Triply API")

# Налаштування CORS для React
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- СХЕМИ ДАННИХ (Pydantic) ---

class UserCreate(BaseModel):
    first_name: str
    last_name: str
    email: str
    password: str

class UserLogin(BaseModel):
    email: str
    password: str

class ProfileUpdate(BaseModel):
    email: str  
    dob: Optional[str] = None
    preferences: Optional[Dict[str, bool]] = None

# --- ЕНДПОІНТИ АВТОРИЗАЦІЇ ---

@app.post("/register")
def register(user: UserCreate, db: Session = Depends(database.get_db)):
    db_user = db.query(models.User).filter(models.User.email == user.email).first()
    if db_user:
        raise HTTPException(status_code=400, detail="Цей email вже зареєстровано")
    
    hashed_password = pwd_context.hash(user.password)
    
    new_user = models.User(
        first_name=user.first_name,
        last_name=user.last_name,
        email=user.email,
        password=hashed_password 
    )
    
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return {"status": "success", "message": f"Користувача {user.first_name} успішно створено"}

@app.post("/login")
def login(user: UserLogin, db: Session = Depends(database.get_db)):
    db_user = db.query(models.User).filter(models.User.email == user.email).first()
    
    if not db_user:
        raise HTTPException(status_code=404, detail="Користувача з таким email не знайдено")
    
    if not pwd_context.verify(user.password, db_user.password):
        raise HTTPException(status_code=400, detail="Невірний пароль")
    
    return {
        "status": "success", 
        "message": "Ви успішно увійшли", 
        "user_name": db_user.first_name,
        "email": db_user.email  
    }

# --- ЕНДПОІНТИ ПРОФІЛЮ ---

@app.get("/get-profile/{email}")
def get_profile(email: str, db: Session = Depends(database.get_db)):
    db_user = db.query(models.User).filter(models.User.email == email).first()
    if not db_user:
        raise HTTPException(status_code=404, detail="Профіль не знайдено")
    
    return {
        "first_name": db_user.first_name,
        "dob": db_user.birth_date,
        "preferences": db_user.preferences or {
            "mountains": False, "sea": False, "museums": False, "active": True, "coffee": True
        }
    }

@app.put("/update-profile")
def update_profile(data: ProfileUpdate, db: Session = Depends(database.get_db)):
    db_user = db.query(models.User).filter(models.User.email == data.email).first()
    
    if not db_user:
        raise HTTPException(status_code=404, detail="Користувача не знайдено")

    if data.dob is not None:
        db_user.birth_date = data.dob
    
    if data.preferences is not None:
        db_user.preferences = data.preferences
    
    db.commit()
    return {"status": "success", "message": "Профіль оновлено в PostgreSQL"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)