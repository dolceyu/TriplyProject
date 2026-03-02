from fastapi import FastAPI, Depends, HTTPException, File, UploadFile, Response
from sqlalchemy.orm import Session
from sqlalchemy import or_, and_
import models, database 
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from passlib.context import CryptContext 
from typing import Optional, Dict, List

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

# --- СХЕМИ ДАНИХ (Pydantic) ---

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
    first_name: Optional[str] = None
    dob: Optional[str] = None
    preferences: Optional[Dict[str, bool]] = None

class PasswordChange(BaseModel):
    email: str
    old_password: str
    new_password: str

class DeleteAccount(BaseModel):
    email: str
    password: str

# --- ЕНДПОІНТИ АВТОРИЗАЦІЇ ---

@app.post("/register")
def register(user: UserCreate, db: Session = Depends(database.get_db)):
    db_user = db.query(models.User).filter(models.User.email == user.email).first()
    if db_user:
        raise HTTPException(status_code=400, detail="Цей email вже зареєстровано")
    
    new_user = models.User(
        first_name=user.first_name,
        last_name=user.last_name,
        email=user.email,
        password=pwd_context.hash(user.password) 
    )
    db.add(new_user)
    db.commit()
    return {"status": "success", "message": "Реєстрація успішна"}

@app.post("/login")
def login(user: UserLogin, db: Session = Depends(database.get_db)):
    db_user = db.query(models.User).filter(models.User.email == user.email).first()
    if not db_user or not pwd_context.verify(user.password, db_user.password):
        raise HTTPException(status_code=400, detail="Невірний email або пароль")
    
    return {
        "status": "success", 
        "user_name": db_user.first_name,
        "email": db_user.email  
    }

# --- ЕНДПОІНТИ ПРОФІЛЮ ТА АВАТАРОК ---

@app.get("/get-profile/{email}")
def get_profile(email: str, db: Session = Depends(database.get_db)):
    user = db.query(models.User).filter(models.User.email == email).first()
    if not user:
        raise HTTPException(status_code=404, detail="Профіль не знайдено")
    return {
        "first_name": user.first_name,
        "dob": user.birth_date,
        "preferences": user.preferences or {"mountains": False, "sea": False, "museums": False, "active": True, "coffee": True}
    }

@app.put("/update-profile")
def update_profile(data: ProfileUpdate, db: Session = Depends(database.get_db)):
    user = db.query(models.User).filter(models.User.email == data.email).first()
    if not user:
        raise HTTPException(status_code=404, detail="Користувача не знайдено")
    
    if data.first_name is not None: user.first_name = data.first_name
    if data.dob is not None: user.birth_date = data.dob
    if data.preferences is not None: user.preferences = data.preferences
    
    db.commit()
    return {"status": "success"}

@app.get("/get-avatar/{email}")
def get_avatar(email: str, db: Session = Depends(database.get_db)):
    user = db.query(models.User).filter(models.User.email == email).first()
    if not user or not user.avatar_blob:
        raise HTTPException(status_code=404, detail="Аватарку не знайдено")
    return Response(content=user.avatar_blob, media_type="image/jpeg")

@app.post("/upload-avatar/{email}")
async def upload_avatar(email: str, file: UploadFile = File(...), db: Session = Depends(database.get_db)):
    user = db.query(models.User).filter(models.User.email == email).first()
    if file.content_type not in ["image/jpeg", "image/png"]:
        raise HTTPException(status_code=400, detail="Формат файлу не підтримується")
    
    user.avatar_blob = await file.read()
    db.commit()
    return {"status": "success"}

@app.delete("/delete-avatar/{email}")
def delete_avatar(email: str, db: Session = Depends(database.get_db)):
    user = db.query(models.User).filter(models.User.email == email).first()
    user.avatar_blob = None 
    db.commit()
    return {"status": "success"}

# --- СИСТЕМА ДРУЗІВ ---

@app.get("/search-user/{email}")
def search_user(email: str, db: Session = Depends(database.get_db)):
    user = db.query(models.User).filter(models.User.email == email).first()
    if not user:
        raise HTTPException(status_code=404, detail="Користувача не знайдено")
    return {"id": user.id, "first_name": user.first_name, "email": user.email}

@app.post("/send-request")
def send_request(sender_email: str, receiver_email: str, db: Session = Depends(database.get_db)):
    me = db.query(models.User).filter(models.User.email == sender_email).first()
    friend = db.query(models.User).filter(models.User.email == receiver_email).first()
    
    # Перевірка, чи не відправляємо запит самі собі або чи вже є такий запит
    if me.id == friend.id:
        raise HTTPException(status_code=400, detail="Не можна додати самого себе")
    
    existing = db.query(models.Friendship).filter(
        ((models.Friendship.user_id == me.id) & (models.Friendship.friend_id == friend.id)) |
        ((models.Friendship.user_id == friend.id) & (models.Friendship.friend_id == me.id))
    ).first()
    
    if existing:
        raise HTTPException(status_code=400, detail="Запит уже існує або ви вже друзі")

    new_friendship = models.Friendship(user_id=me.id, friend_id=friend.id, status="pending")
    db.add(new_friendship)
    db.commit()
    return {"status": "success"}

@app.get("/friend-requests/{email}")
def get_requests(email: str, db: Session = Depends(database.get_db)):
    user = db.query(models.User).filter(models.User.email == email).first()
    requests = db.query(models.Friendship).filter(models.Friendship.friend_id == user.id, models.Friendship.status == "pending").all()
    
    result = []
    for r in requests:
        sender = db.query(models.User).filter(models.User.id == r.user_id).first()
        result.append({"id": r.id, "name": sender.first_name, "email": sender.email})
    return result

@app.put("/accept-friend-request/{request_id}")
def accept_request(request_id: int, db: Session = Depends(database.get_db)):
    request = db.query(models.Friendship).filter(models.Friendship.id == request_id).first()
    if not request:
        raise HTTPException(status_code=404, detail="Запит не знайдено")
    request.status = "accepted"
    db.commit()
    return {"status": "success"}

@app.get("/get-friends/{email}")
def get_friends(email: str, db: Session = Depends(database.get_db)):
    user = db.query(models.User).filter(models.User.email == email).first()
    friends_ships = db.query(models.Friendship).filter(
        and_(
            or_(models.Friendship.user_id == user.id, models.Friendship.friend_id == user.id),
            models.Friendship.status == "accepted"
        )
    ).all()
    
    result = []
    for f in friends_ships:
        friend_id = f.friend_id if f.user_id == user.id else f.user_id
        friend_data = db.query(models.User).filter(models.User.id == friend_id).first()
        result.append({"id": f.id, "name": friend_data.first_name, "email": friend_data.email})
    return result

@app.delete("/delete-friend")
def delete_friend(my_email: str, friend_email: str, db: Session = Depends(database.get_db)):
    me = db.query(models.User).filter(models.User.email == my_email).first()
    friend = db.query(models.User).filter(models.User.email == friend_email).first()
    
    friendship = db.query(models.Friendship).filter(
        ((models.Friendship.user_id == me.id) & (models.Friendship.friend_id == friend.id)) |
        ((models.Friendship.user_id == friend.id) & (models.Friendship.friend_id == me.id))
    ).first()
    
    if friendship:
        db.delete(friendship)
        db.commit()
        return {"status": "success"}
    raise HTTPException(status_code=404, detail="Дружбу не знайдено")

# --- БЕЗПЕКА ТА НАЛАШТУВАННЯ ---

@app.put("/change-password")
def change_password(data: PasswordChange, db: Session = Depends(database.get_db)):
    user = db.query(models.User).filter(models.User.email == data.email).first()
    if not user or not pwd_context.verify(data.old_password, user.password):
        raise HTTPException(status_code=400, detail="Старий пароль невірний")
    
    user.password = pwd_context.hash(data.new_password)
    db.commit()
    return {"status": "success"}

@app.delete("/delete-account")
def delete_account(data: DeleteAccount, db: Session = Depends(database.get_db)):
    user = db.query(models.User).filter(models.User.email == data.email).first()
    if not user or not pwd_context.verify(data.password, user.password):
        raise HTTPException(status_code=400, detail="Пароль невірний")
    
    db.delete(user)
    db.commit()
    return {"status": "success"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)