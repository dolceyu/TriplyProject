import json
from fastapi import FastAPI, Depends, HTTPException, File, UploadFile, Response, Form
from sqlalchemy.orm import Session
from sqlalchemy import or_, and_, not_
import models, database 
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from passlib.context import CryptContext 
from typing import Optional, Dict, List

# 🔴 ПІДКЛЮЧАЄМО РОУТЕР
from routers import itinerary

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

models.Base.metadata.create_all(bind=database.engine)

app = FastAPI(title="Triply API")

# 🔴 АКТИВУЄМО РОУТЕР
app.include_router(itinerary.router)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

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

class JoinTripRequest(BaseModel):
    email: str
    trip_code: str    


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


@app.get("/get-profile/{email}")
def get_profile(email: str, db: Session = Depends(database.get_db)):
    user = db.query(models.User).filter(models.User.email == email).first()
    if not user:
        raise HTTPException(status_code=404, detail="Профіль не знайдено")
    
    default_prefs = {
        "mountains": False, "sea": False, "museums": False, "nature": False, 
        "foodie": False, "nightlife": False, "shopping": False, "active": False, 
        "relax": False, "roadtrips": False
    }

    return {
        "first_name": user.first_name,
        "dob": user.birth_date,
        "preferences": user.preferences or default_prefs
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

@app.get("/recommend-friends/{email}")
def recommend_friends(email: str, db: Session = Depends(database.get_db)):
    user = db.query(models.User).filter(models.User.email == email).first()
    
    if not user or not user.preferences:
        return []

    existing_relations = db.query(models.Friendship).filter(
        or_(models.Friendship.user_id == user.id, models.Friendship.friend_id == user.id)
    ).all()
    
    excluded_ids = {user.id}
    for rel in existing_relations:
        excluded_ids.add(rel.user_id)
        excluded_ids.add(rel.friend_id)
        
    potential_friends = db.query(models.User).filter(~models.User.id.in_(excluded_ids)).all()
    
    recommendations = []
    my_prefs = user.preferences
    
    for pf in potential_friends:
        if not pf.preferences:
            continue 
            
        score = 0
        shared_traits = []
        
        for key, val in my_prefs.items():
            if val is True and pf.preferences.get(key) is True:
                score += 1
                shared_traits.append(key) 
                
        if score > 0:
            recommendations.append({
                "id": pf.id,
                "first_name": pf.first_name,
                "email": pf.email,
                "score": score,
                "shared_traits": shared_traits
            })
            
    recommendations.sort(key=lambda x: x["score"], reverse=True)
    return recommendations[:4]

# --- НОВІ ЕНДПОЇНТИ ДЛЯ ПОДОРОЖЕЙ ---

@app.post("/create-trip")
async def create_trip(
    trip_data: str = Form(...), 
    file: UploadFile = File(None), 
    db: Session = Depends(database.get_db)
):
    data = json.loads(trip_data)
    creator = db.query(models.User).filter(models.User.email == data['creator_email']).first()
    
    if not creator:
        raise HTTPException(status_code=404, detail="Творця не знайдено")

    new_trip = models.Trip(
        title=data['title'],
        destination=data['destination'],
        start_date=data['start_date'] or None, 
        end_date=data['end_date'] or None,
        trip_code=data['trip_code'],
        creator_id=creator.id
    )

    if file and file.content_type in ["image/jpeg", "image/png"]:
        new_trip.image_blob = await file.read()

    participants_emails = data.get('participants', []) + [data['creator_email']]
    unique_emails = list(set(participants_emails)) 
    
    for email in unique_emails:
        user = db.query(models.User).filter(models.User.email == email).first()
        if user:
            new_trip.participants.append(user)

    db.add(new_trip)
    db.commit()
    
    return {"status": "success", "trip_id": new_trip.id}

@app.put("/update-trip/{trip_id}")
async def update_trip(
    trip_id: int,
    trip_data: str = Form(...), 
    file: UploadFile = File(None), 
    db: Session = Depends(database.get_db)
):
    trip = db.query(models.Trip).filter(models.Trip.id == trip_id).first()
    if not trip:
        raise HTTPException(status_code=404, detail="Подорож не знайдено")
        
    data = json.loads(trip_data)
    
    trip.title = data['title']
    trip.destination = data['destination']
    trip.start_date = data['start_date'] or None
    trip.end_date = data['end_date'] or None

    if file and file.content_type in ["image/jpeg", "image/png"]:
        trip.image_blob = await file.read()

    trip.participants.clear()
    participants_emails = data.get('participants', []) + [data['creator_email']]
    unique_emails = list(set(participants_emails)) 
    
    for email in unique_emails:
        user = db.query(models.User).filter(models.User.email == email).first()
        if user:
            trip.participants.append(user)

    db.commit()
    return {"status": "success"}

@app.delete("/delete-trip/{trip_id}")
def delete_trip(trip_id: int, db: Session = Depends(database.get_db)):
    trip = db.query(models.Trip).filter(models.Trip.id == trip_id).first()
    if not trip:
        raise HTTPException(status_code=404, detail="Подорож не знайдено")
    
    trip.participants.clear()
    db.commit()
    
    db.delete(trip)
    db.commit()
    return {"status": "success"}

@app.get("/get-trips/{email}")
def get_trips(email: str, db: Session = Depends(database.get_db)):
    user = db.query(models.User).filter(models.User.email == email).first()
    if not user:
        raise HTTPException(status_code=404, detail="Користувача не знайдено")
    
    owned = user.owned_trips
    participating = user.trips
    all_trips = list(set(owned + participating))
    
    result = []
    for trip in all_trips:
        result.append({
            "id": trip.id,
            "title": trip.title,
            "destination": trip.destination,
            "start_date": trip.start_date.isoformat() if trip.start_date else None,
            "end_date": trip.end_date.isoformat() if trip.end_date else None,
            "trip_code": trip.trip_code,
            "has_image": trip.image_blob is not None,
            "creator_id": trip.creator_id,
            "creator_email": trip.creator.email, 
            "participants": [{"email": p.email, "name": p.first_name} for p in trip.participants] 
        })
    
    result.sort(key=lambda x: x["id"], reverse=True)
    return result

@app.get("/get-trip-image/{trip_id}")
def get_trip_image(trip_id: int, db: Session = Depends(database.get_db)):
    trip = db.query(models.Trip).filter(models.Trip.id == trip_id).first()
    if not trip or not trip.image_blob:
        raise HTTPException(status_code=404, detail="Фото не знайдено")
    return Response(content=trip.image_blob, media_type="image/jpeg")

@app.post("/join-trip")
def join_trip(data: JoinTripRequest, db: Session = Depends(database.get_db)):
    user = db.query(models.User).filter(models.User.email == data.email).first()
    if not user:
        raise HTTPException(status_code=404, detail="Користувача не знайдено")
    
    trip = db.query(models.Trip).filter(models.Trip.trip_code == data.trip_code.upper()).first()
    if not trip:
        raise HTTPException(status_code=404, detail="Подорож з таким кодом не знайдено 😔")
    
    if trip.creator_id == user.id:
        raise HTTPException(status_code=400, detail="Ви вже є організатором цієї подорожі 😎")
        
    if user in trip.participants:
        raise HTTPException(status_code=400, detail="Ви вже є учасником цієї подорожі 😉")
        
    trip.participants.append(user)
    db.commit()
    
    return {"status": "success", "message": f"Ви успішно приєдналися до: {trip.title}!"}


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