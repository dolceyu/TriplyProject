from sqlalchemy import Column, Integer, String, JSON, LargeBinary
from database import Base

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