from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
import models, database, schemas 

router = APIRouter(
    prefix="/trips",
    tags=["itinerary"]
)

@router.post("/{trip_id}/locations", response_model=schemas.LocationResponse)
def add_location(trip_id: int, location: schemas.LocationCreate, db: Session = Depends(database.get_db)):
    db_trip = db.query(models.Trip).filter(models.Trip.id == trip_id).first()
    if not db_trip:
        raise HTTPException(status_code=404, detail="Подорож не знайдена")
    
    new_location = models.Location(
        trip_id=trip_id,
        name=location.name,
        lat=location.lat,
        lng=location.lng,
        type=location.type,
        author_name=location.author_name, 
        votes_for=0,
        votes_against=0,
        status="pending" 
    )
    db.add(new_location)
    db.commit()
    db.refresh(new_location)
    return new_location

@router.get("/{trip_id}/locations", response_model=List[schemas.LocationResponse])
def get_trip_locations(trip_id: int, db: Session = Depends(database.get_db)):
    return db.query(models.Location).filter(models.Location.trip_id == trip_id).all()

@router.delete("/locations/{location_id}")
def delete_location(location_id: int, db: Session = Depends(database.get_db)):
    db_loc = db.query(models.Location).filter(models.Location.id == location_id).first()
    if not db_loc:
        raise HTTPException(status_code=404, detail="Локацію не знайдено")
    
    db.delete(db_loc)
    db.commit()
    return {"status": "success", "message": "Локацію назавжди видалено з бази!"}

@router.put("/locations/{location_id}/vote", response_model=schemas.LocationResponse)
def vote_location(location_id: int, type: str, email: str, db: Session = Depends(database.get_db)):
    db_user = db.query(models.User).filter(models.User.email == email).first()
    if not db_user:
        raise HTTPException(status_code=404, detail="Користувача не знайдено")

    db_loc = db.query(models.Location).filter(models.Location.id == location_id).first()
    if not db_loc:
        raise HTTPException(status_code=404, detail="Локацію не знайдено")

    if type not in ['up', 'down']:
        raise HTTPException(status_code=400, detail="Невірний тип голосу")

    existing_vote = db.query(models.LocationVote).filter(
        models.LocationVote.location_id == location_id,
        models.LocationVote.user_id == db_user.id
    ).first()

    if existing_vote:
        if existing_vote.vote_type == type:
            return db_loc
        
        if existing_vote.vote_type == 'up':
            db_loc.votes_for -= 1
        elif existing_vote.vote_type == 'down':
            db_loc.votes_against -= 1
        
        if type == 'up':
            db_loc.votes_for += 1
        elif type == 'down':
            db_loc.votes_against += 1
        
        existing_vote.vote_type = type

    else:
        new_vote = models.LocationVote(
            user_id=db_user.id,
            location_id=location_id,
            vote_type=type
        )
        db.add(new_vote)
        
        if type == 'up':
            db_loc.votes_for += 1
        else:
            db_loc.votes_against += 1

    if db_loc.votes_for == 0 and db_loc.votes_against == 0:
        db_loc.status = "pending"
    elif db_loc.votes_for > db_loc.votes_against:
        db_loc.status = "approved"
    elif db_loc.votes_against > db_loc.votes_for:
        db_loc.status = "rejected"
    else:
        db_loc.status = "pending"

    db.commit()
    db.refresh(db_loc)
    
    return db_loc