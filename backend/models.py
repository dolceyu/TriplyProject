import enum
from sqlalchemy import Column, Integer, String, JSON, LargeBinary, ForeignKey, Table, Date, Float, UniqueConstraint, DateTime, Enum
from datetime import datetime
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from database import Base

# --- ДОДАНО: Енам для статусів запрошення ---
class InvitationStatus(enum.Enum):
    PENDING = "pending"
    ACCEPTED = "accepted"
    REJECTED = "rejected"

trip_participants = Table(
    "trip_participants",
    Base.metadata,
    Column("trip_id", Integer, ForeignKey("trips.id"), primary_key=True),
    Column("user_id", Integer, ForeignKey("users.id"), primary_key=True)
)

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    first_name = Column(String)
    last_name = Column(String)
    email = Column(String, unique=True, index=True)
    password = Column(String) 
    birth_date = Column(String, nullable=True) 
    preferences = Column(JSON, nullable=True)
    avatar_blob = Column(LargeBinary, nullable=True)

    trips = relationship("Trip", secondary=trip_participants, back_populates="participants")
    owned_trips = relationship("Trip", back_populates="creator")
    location_votes = relationship("LocationVote", back_populates="user", cascade="all, delete-orphan")

class Friendship(Base):
    __tablename__ = "friendships"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    friend_id = Column(Integer, ForeignKey("users.id"))
    status = Column(String, default="pending")

class Trip(Base):
    __tablename__ = "trips"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False)
    destination = Column(String, nullable=False)
    start_date = Column(Date, nullable=True)
    end_date = Column(Date, nullable=True)
    image_blob = Column(LargeBinary, nullable=True)
    trip_code = Column(String, unique=True, index=True) 
    creator_id = Column(Integer, ForeignKey("users.id"))
    guide_name = Column(String, nullable=True)
    
    creator = relationship("User", back_populates="owned_trips")
    participants = relationship("User", secondary=trip_participants, back_populates="trips")
    itinerary = relationship("ItineraryItem", back_populates="trip", cascade="all, delete-orphan")
    locations = relationship("Location", back_populates="trip", cascade="all, delete-orphan")
    # ДОДАНО: Зв'язок із запрошеннями
    invitations = relationship("TripInvitation", back_populates="trip", cascade="all, delete-orphan")

class ItineraryItem(Base):
    __tablename__ = "itinerary_items"

    id = Column(Integer, primary_key=True, index=True)
    trip_id = Column(Integer, ForeignKey("trips.id"))
    location_id = Column(Integer, ForeignKey("locations.id"), nullable=True) 
    
    title = Column(String)
    description = Column(String, nullable=True)
    time = Column(String, nullable=True) 
    category = Column(String, default="place") 
    day_number = Column(Integer, default=1)
    
    trip = relationship("Trip", back_populates="itinerary")
    location = relationship("Location")

class Location(Base):
    __tablename__ = "locations"

    id = Column(Integer, primary_key=True, index=True)
    trip_id = Column(Integer, ForeignKey("trips.id"))
    name = Column(String, nullable=False)
    lat = Column(Float, nullable=False)
    lng = Column(Float, nullable=False)
    type = Column(String, default="Локація")
    votes_for = Column(Integer, default=0)
    votes_against = Column(Integer, default=0)
    status = Column(String, default="pending")

    trip = relationship("Trip", back_populates="locations")
    votes = relationship("LocationVote", back_populates="location", cascade="all, delete-orphan")
    author_name = Column(String, default="Гість")

class LocationVote(Base):
    __tablename__ = "location_votes"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    location_id = Column(Integer, ForeignKey("locations.id"), nullable=False)
    vote_type = Column(String, nullable=False) 

    __table_args__ = (UniqueConstraint('user_id', 'location_id', name='_user_location_uc'),)

    user = relationship("User", back_populates="location_votes")
    location = relationship("Location", back_populates="votes")

class TripDocument(Base):
    __tablename__ = "trip_documents"
    
    id = Column(Integer, primary_key=True, index=True)
    trip_id = Column(Integer, ForeignKey("trips.id"))
    category = Column(String) # 'housing', 'transport', 'docs'
    title = Column(String)
    item_type = Column(String) # 'link', 'text', 'file'
    content = Column(String)
    created_at = Column(DateTime, default=datetime.utcnow)    

# --- ДОДАНО: Таблиця для збереження інвайтів ФКА ---
class TripInvitation(Base):
    __tablename__ = "trip_invitations"

    id = Column(Integer, primary_key=True, index=True)
    trip_id = Column(Integer, ForeignKey("trips.id"))
    inviter_id = Column(Integer, ForeignKey("users.id")) # Хто надіслав
    invitee_email = Column(String) # Кому надіслали (кандидат)
    status = Column(Enum(InvitationStatus), default=InvitationStatus.PENDING)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    trip = relationship("Trip", back_populates="invitations")