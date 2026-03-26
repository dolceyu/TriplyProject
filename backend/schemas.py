from pydantic import BaseModel
from typing import Optional

class TripBase(BaseModel):
    title: str
    destination: str

class TripCreate(TripBase):
    pass

class TripResponse(TripBase):
    id: int
    guide_name: Optional[str] = None 

    class Config:
        from_attributes = True 


class LocationBase(BaseModel):
    name: str
    lat: float
    lng: float
    type: Optional[str] = "Локація"
    author_name: Optional[str] = "Гість"  

class LocationCreate(LocationBase):
    pass

class LocationResponse(LocationBase):
    id: int
    trip_id: int
    votes_for: int
    votes_against: int
    status: str

    class Config:
        from_attributes = True 



class ItineraryItemBase(BaseModel):
    title: str
    category: str
    time: str
    day_number: int = 1

class ItineraryItemCreate(ItineraryItemBase):
    pass

class ItineraryItemResponse(ItineraryItemBase):
    id: int
    trip_id: int

    class Config:
        from_attributes = True


class GuideUpdate(BaseModel):
    guide_name: Optional[str] = None