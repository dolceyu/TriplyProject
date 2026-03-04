from pydantic import BaseModel
from typing import Optional

class LocationBase(BaseModel):
    name: str
    lat: float
    lng: float
    type: Optional[str] = "Локація"

class LocationCreate(LocationBase):
    pass

class LocationResponse(LocationBase):
    id: int
    trip_id: int
    votes_for: int
    votes_against: int
    status: str

    class Config:
        from_attributes = True # Або orm_mode = True, якщо старіша версія Pydantic