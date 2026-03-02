from sqlalchemy import Column, Integer, String, JSON, LargeBinary
from database import Base
from sqlalchemy import Column, Integer, String, ForeignKey, Table
from sqlalchemy.orm import relationship

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

class Friendship(Base):
    __tablename__ = "friendships"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id")) # Хто відправив
    friend_id = Column(Integer, ForeignKey("users.id")) # Кому прийшло
    status = Column(String, default="pending") # 'pending' або 'accepted'    