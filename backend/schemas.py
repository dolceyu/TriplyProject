from pydantic import BaseModel, ConfigDict
from typing import Optional, List
from datetime import datetime

class TripBase(BaseModel):
    title: str
    destination: str

class TripCreate(TripBase):
    pass

class TripResponse(TripBase):
    id: int
    guide_name: Optional[str] = None 

    model_config = ConfigDict(from_attributes=True)

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

    model_config = ConfigDict(from_attributes=True)

class ItineraryItemBase(BaseModel):
    title: str
    category: str
    time: Optional[str] = None 
    day_number: int = 1
    location_id: Optional[int] = None

class ItineraryItemCreate(ItineraryItemBase):
    pass

class ItineraryItemResponse(ItineraryItemBase):
    id: int
    trip_id: int

    model_config = ConfigDict(from_attributes=True)

class TripDocumentBase(BaseModel):
    category: str
    title: str
    item_type: str
    content: Optional[str] = None 

class TripDocumentCreate(TripDocumentBase):
    pass

class TripDocumentResponse(TripDocumentBase):
    id: int
    trip_id: int
    created_at: datetime
    
    model_config = ConfigDict(from_attributes=True)


class GuideUpdate(BaseModel):
    guide_name: Optional[str] = None