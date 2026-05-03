import json
from random import random
from fastapi import FastAPI, Depends, HTTPException, File, UploadFile, Response, Form, status, BackgroundTasks
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles
from sqlalchemy.orm import Session
from sqlalchemy import or_, and_, not_
import models, database 
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from passlib.context import CryptContext 
from typing import Optional, Dict, List
import schemas
from database import get_db
from clustering import compact_clustering, build_distance_matrix
from routers import itinerary
from routers import documents
import ai_routes
from fastapi import WebSocket, WebSocketDisconnect
from ws_manager import manager
from sqlalchemy.orm.attributes import flag_modified
from fastapi import HTTPException

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

models.Base.metadata.create_all(bind=database.engine)

app = FastAPI(title="Triply API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

app.include_router(documents.router)
app.include_router(itinerary.router)
app.include_router(ai_routes.router)

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
            "guide_name": trip.guide_name,
            "participants": [{"email": p.email, "name": p.first_name, "date_of_birth": p.birth_date} for p in trip.participants] 
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

@app.get("/trips/{trip_id}/itinerary", response_model=list[schemas.ItineraryItemResponse])
def get_itinerary(trip_id: int, db: Session = Depends(get_db)):
    """Отримати весь розклад для конкретної подорожі"""
    items = db.query(models.ItineraryItem).filter(models.ItineraryItem.trip_id == trip_id).all()
    return items

@app.post("/trips/{trip_id}/itinerary", response_model=schemas.ItineraryItemResponse)
def create_itinerary_item(trip_id: int, item: schemas.ItineraryItemCreate, background_tasks: BackgroundTasks, db: Session = Depends(get_db)):
    """Додати нову точку в розклад (з часом і днем)"""
    db_trip = db.query(models.Trip).filter(models.Trip.id == trip_id).first()
    if not db_trip:
        raise HTTPException(status_code=404, detail="Подорож не знайдена")
        
    db_item = models.ItineraryItem(**item.model_dump(), trip_id=trip_id) 
    db.add(db_item)
    db.commit()
    db.refresh(db_item)
    
    background_tasks.add_task(manager.broadcast, {"action": "refresh_locations"}, trip_id)
    background_tasks.add_task(manager.broadcast, {"action": "refresh_itinerary"}, trip_id)
    
    return db_item

@app.delete("/trips/itinerary/{item_id}")
def delete_itinerary_item(item_id: int, background_tasks: BackgroundTasks, db: Session = Depends(get_db)):
    """Видалити точку з розкладу"""
    db_item = db.query(models.ItineraryItem).filter(models.ItineraryItem.id == item_id).first()
    if not db_item:
        raise HTTPException(status_code=404, detail="Елемент розкладу не знайдено")
    
    trip_id = db_item.trip_id
    db.delete(db_item)
    db.commit()
   
    background_tasks.add_task(manager.broadcast, {"action": "refresh_locations"}, trip_id)
    background_tasks.add_task(manager.broadcast, {"action": "refresh_itinerary"}, trip_id)
    
    return {"message": "Успішно видалено"}

@app.patch("/trips/{trip_id}/guide")
async def update_trip_guide(trip_id: int, guide_data: schemas.GuideUpdate, db: Session = Depends(get_db)):
    trip = db.query(models.Trip).filter(models.Trip.id == trip_id).first()
    
    if not trip:
        raise HTTPException(status_code=404, detail="Подорож не знайдено")

    if guide_data.guide_name:
        if trip.guide_name and trip.guide_name != guide_data.guide_name:
            return JSONResponse(
                status_code=status.HTTP_409_CONFLICT,
                content={
                    "message": "Ой, хтось інший вже став гідом!", 
                    "current_guide": trip.guide_name
                }
            )
        trip.guide_name = guide_data.guide_name
    else:
        trip.guide_name = None

    db.commit()
    db.refresh(trip)
    
    return {"message": "Роль успішно оновлено", "guide_name": trip.guide_name}

@app.post("/trips/{trip_id}/smart-itinerary")
def generate_smart_itinerary(trip_id: int, background_tasks: BackgroundTasks, db: Session = Depends(get_db)):
    trip = db.query(models.Trip).filter(models.Trip.id == trip_id).first()
    if not trip:
        raise HTTPException(status_code=404, detail="Подорож не знайдено")

    if trip.start_date and trip.end_date:
        delta = trip.end_date - trip.start_date
        total_days_allowed = delta.days + 1
    else:
        total_days_allowed = 3

    approved_locations = db.query(models.Location).filter(
        models.Location.trip_id == trip_id,
        models.Location.status == "approved" 
    ).all()

    n_locs = len(approved_locations)
    if n_locs < 2:
        raise HTTPException(status_code=400, detail="Потрібно хоча б 2 затверджені локації")

    raw_clusters = compact_clustering(approved_locations, r_preference=2.0)
    dist_matrix = build_distance_matrix(approved_locations)

    if n_locs <= total_days_allowed:
        balanced_clusters = [[i] for i in range(n_locs)]
    else:
        anchors = [0] 
        while len(anchors) < total_days_allowed:
            furthest_idx = -1
            max_dist = -1
            for i in range(n_locs):
                if i in anchors: continue
                min_dist_to_anchors = min([dist_matrix[i][a] for a in anchors])
                if min_dist_to_anchors > max_dist:
                    max_dist = min_dist_to_anchors
                    furthest_idx = i
            anchors.append(furthest_idx)

        balanced_clusters = [[] for _ in range(total_days_allowed)]
        for i in range(n_locs):
            closest_day = 0
            min_d = float('inf')
            for day_idx, anchor_idx in enumerate(anchors):
                d = dist_matrix[i][anchor_idx]
                if d < min_d:
                    min_d = d
                    closest_day = day_idx
            balanced_clusters[closest_day].append(i)

    final_daily_routes = []
    for cluster in balanced_clusters:
        if not cluster:
            final_daily_routes.append([])
            continue
            
        unvisited = set(cluster)
        current = unvisited.pop()
        route = [current]
        
        while unvisited:
            next_point = min(unvisited, key=lambda x: dist_matrix[current][x])
            route.append(next_point)
            unvisited.remove(next_point)
            current = next_point
            
        final_daily_routes.append(route)

    db.query(models.ItineraryItem).filter(
        models.ItineraryItem.trip_id == trip_id,
        models.ItineraryItem.location_id.isnot(None)
    ).delete(synchronize_session=False)

    for day_index, route_indices in enumerate(final_daily_routes):
        day_number = day_index + 1 
        for loc_idx in route_indices:
            loc = approved_locations[loc_idx]
            new_item = models.ItineraryItem(
                trip_id=trip_id,
                location_id=loc.id,
                title=loc.name,
                category=loc.type or "place",
                day_number=day_number,
                time=None
            )
            db.add(new_item)

    db.commit()
   
    background_tasks.add_task(manager.broadcast, {"action": "refresh_locations"}, trip_id)
    background_tasks.add_task(manager.broadcast, {"action": "refresh_itinerary"}, trip_id)
    
    return {"message": "Створено ідеально збалансований маршрут!"}

@app.websocket("/ws/{trip_id}")
async def websocket_trip_endpoint(websocket: WebSocket, trip_id: int):
    await manager.connect(websocket, trip_id)
    try:
        while True:
            data = await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(websocket, trip_id)

@app.get("/trips/{trip_id}/smart-match")
def get_smart_matches(trip_id: int, db: Session = Depends(database.get_db)):
    trip = db.query(models.Trip).filter(models.Trip.id == trip_id).first()
    if not trip:
        raise HTTPException(status_code=404, detail="Подорож не знайдено")

    participants = trip.participants
    if not participants:
        return {"core_concept": [], "matches": []}

    first_user_prefs = participants[0].preferences or {}
    common_prefs = set(k for k, v in first_user_prefs.items() if v)

    for p in participants[1:]:
        user_prefs = set(k for k, v in (p.preferences or {}).items() if v)
        common_prefs = common_prefs.intersection(user_prefs)

    if not common_prefs:
        pref_counts = {}
        for p in participants:
            for k, v in (p.preferences or {}).items():
                if v: 
                    pref_counts[k] = pref_counts.get(k, 0) + 1
        
        threshold = len(participants) / 2
        common_prefs = set(k for k, count in pref_counts.items() if count > threshold)

    if not common_prefs:
        return {"core_concept": [], "matches": [], "message": "Група не має спільних інтересів для аналізу."}

    participant_ids = [p.id for p in participants]
    
    all_other_users = db.query(models.User).filter(~models.User.id.in_(participant_ids)).all()
    
    matched_users = []
    for u in all_other_users:
        if not u.preferences:
            continue
            
        user_true_prefs = set(k for k, v in u.preferences.items() if v)
        
        if common_prefs.issubset(user_true_prefs):
            
            existing_invite = db.query(models.TripInvitation).filter(
                models.TripInvitation.trip_id == trip_id,
                models.TripInvitation.invitee_email == u.email
            ).first()

            invite_status = existing_invite.status.value if existing_invite else None

            matched_users.append({
                "id": u.id,
                "first_name": u.first_name,
                "email": u.email,
                "invite_status": invite_status 
            })

    labels_map = {
        "mountains": "⛰️ Гори", "sea": "🌊 Море", "museums": "🏛️ Музеї", 
        "nature": "🌲 Природа", "foodie": "🍕 Гастрономія", "nightlife": "🪩 Нічне життя", 
        "shopping": "🛍️ Шопінг", "active": "🏃 Активний відпочинок", 
        "relax": "🧘 Релакс", "roadtrips": "🚗 Дорожні подорожі"
    }

    core_concept_labels = [labels_map.get(tag, tag) for tag in common_prefs]

    return {
        "core_concept": core_concept_labels,
        "matches": matched_users[:5] 
    }

class InviteSchema(BaseModel):
    email: str

@app.post("/trips/{trip_id}/invite")
def send_trip_invitation(
    trip_id: int, 
    request: InviteSchema, 
    db: Session = Depends(database.get_db) 
):
    
    trip = db.query(models.Trip).filter(models.Trip.id == trip_id).first()
    if not trip:
        raise HTTPException(status_code=404, detail="Подорож не знайдено")

    existing_invite = db.query(models.TripInvitation).filter(
        models.TripInvitation.trip_id == trip_id,
        models.TripInvitation.invitee_email == request.email
    ).first()

    if existing_invite:
        raise HTTPException(status_code=400, detail="Запрошення цій людині вже надіслано!")

    inviter_id = trip.creator_id 

    new_invitation = models.TripInvitation(
        trip_id=trip_id,
        inviter_id=inviter_id, 
        invitee_email=request.email,
        status=models.InvitationStatus.PENDING
    )
    
    db.add(new_invitation)
    db.commit()
    
    return {"message": f"Запрошення для {request.email} надіслано!"}

from pydantic import BaseModel

class InvitationResponse(BaseModel):
    action: str  

@app.get("/users/{email}/invitations")
def get_my_invitations(email: str, db: Session = Depends(database.get_db)):
    print(f"ШУКАЮ ІНВАЙТИ ДЛЯ: {email}") 
    
    invitations = db.query(models.TripInvitation).filter(
        models.TripInvitation.invitee_email == email
    ).all()

    result = []
    for inv in invitations:
        status_str = inv.status.value if hasattr(inv.status, 'value') else str(inv.status)
        
        if "PENDING" not in status_str.upper():
            continue

        trip = db.query(models.Trip).filter(models.Trip.id == inv.trip_id).first()
        inviter = db.query(models.User).filter(models.User.id == inv.inviter_id).first()
        
        result.append({
            "id": inv.id,
            "trip_id": inv.trip_id,
            "trip_title": trip.title if trip else "Секретна подорож",
            "trip_destination": trip.destination if trip else "Невідомо де",
            "inviter_name": f"{inviter.first_name}" if inviter else "Хтось"
        })
        
    print(f"ЗНАЙДЕНО ТА ВІДПРАВЛЕНО НА ФРОНТ: {result}")
    return result

@app.post("/invitations/{invitation_id}/respond")
def respond_to_invitation(
    invitation_id: int, 
    response: InvitationResponse,
    db: Session = Depends(database.get_db)
):
    invitation = db.query(models.TripInvitation).filter(
        models.TripInvitation.id == invitation_id
    ).first()

    if not invitation:
        raise HTTPException(status_code=404, detail="Запрошення не знайдено")

    if response.action == 'accept':
        invitation.status = models.InvitationStatus.ACCEPTED
        
        trip = db.query(models.Trip).filter(models.Trip.id == invitation.trip_id).first()
        invited_user = db.query(models.User).filter(models.User.email == invitation.invitee_email).first()
        
        if trip and invited_user and invited_user not in trip.participants:
            trip.participants.append(invited_user)
            
    elif response.action == 'reject':
        invitation.status = models.InvitationStatus.REJECTED
    else:
        raise HTTPException(status_code=400, detail="Дія має бути 'accept' або 'reject'")

    db.commit()
    return {"message": f"Запрошення успішно оновлено: {response.action}"}

class LeaveTripRequest(BaseModel):
    email: str
    trip_id: int

@app.post("/leave-trip")
def leave_trip(req: LeaveTripRequest, db: Session = Depends(database.get_db)):
    trip = db.query(models.Trip).filter(models.Trip.id == req.trip_id).first()
    if not trip:
        raise HTTPException(status_code=404, detail="Подорож не знайдено")

    user_to_remove = None
    for p in trip.participants:
        if p.email == req.email: 
            user_to_remove = p
            break
    
    if not user_to_remove:
        return {"message": "Вас і так немає в цій подорожі"}
    user_name = user_to_remove.first_name

    trip.participants.remove(user_to_remove)

    if trip.guide_name == user_name:
        trip.guide_name = None

    if trip.creator and trip.creator.email == req.email:
        if len(trip.participants) == 0:
            db.delete(trip)
            db.commit()
            return {"message": "Ви були останнім учасником. Подорож видалено."}
        else:
            new_owner = None
            
            if trip.guide_name:
                new_owner = next((p for p in trip.participants if p.first_name == trip.guide_name), None)
            
            if not new_owner:
                new_owner = random.choice(trip.participants)
            
            trip.creator_id = new_owner.id

    db.commit()
    return {"message": "Успішно вийшли з подорожі"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)