from fastapi import APIRouter, Depends, UploadFile, File, Form, HTTPException, BackgroundTasks
from sqlalchemy.orm import Session
from typing import List, Optional
import shutil
import os
import models
import schemas
from database import get_db
import re 

from ws_manager import manager 

router = APIRouter(
    tags=["Сейф документів"]
)

UPLOAD_DIR = "uploads"
if not os.path.exists(UPLOAD_DIR):
    os.makedirs(UPLOAD_DIR)

def get_secure_filename(filename: str) -> str:
    name, ext = os.path.splitext(filename)
    clean_name = re.sub(r'[^a-zA-Z0-9_-]', '_', name)
    return f"{clean_name}{ext}"

@router.post("/trips/{trip_id}/documents", response_model=schemas.TripDocumentResponse)
def create_document( 
    trip_id: int,
    background_tasks: BackgroundTasks, 
    category: str = Form(...),
    title: str = Form(...),
    item_type: str = Form(...),
    author_name: str = Form(...),
    content: Optional[str] = Form(None),
    file: Optional[UploadFile] = File(None),
    db: Session = Depends(get_db)
):
    final_content = content
    
    if file:
        safe_name = get_secure_filename(file.filename)
        file_path = os.path.join(UPLOAD_DIR, safe_name)
        
        try:
            with open(file_path, "wb") as buffer:
                shutil.copyfileobj(file.file, buffer)
            final_content = safe_name 
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Помилка збереження: {str(e)}")

    db_doc = models.TripDocument(
        trip_id=trip_id,
        category=category,
        title=title,
        item_type=item_type,
        content=final_content,
        author_name=author_name
    )
    
    db.add(db_doc)
    db.commit()
    db.refresh(db_doc)
    
    background_tasks.add_task(manager.broadcast, {"action": "refresh_documents"}, trip_id)
    
    return db_doc

@router.get("/trips/{trip_id}/documents/{category}", response_model=List[schemas.TripDocumentResponse])
def get_documents(trip_id: int, category: str, db: Session = Depends(get_db)):
    return db.query(models.TripDocument).filter(
        models.TripDocument.trip_id == trip_id, 
        models.TripDocument.category == category
    ).all()
    
@router.delete("/documents/{doc_id}")
def delete_document(doc_id: int, user_name: str, background_tasks: BackgroundTasks, db: Session = Depends(get_db)):
    doc = db.query(models.TripDocument).filter(models.TripDocument.id == doc_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Документ не знайдено")
    
    trip = db.query(models.Trip).filter(models.Trip.id == doc.trip_id).first()
    if doc.author_name != user_name and trip.guide_name != user_name:
        raise HTTPException(status_code=403, detail="Ви не маєте прав для видалення цього документа")
    
    trip_id = doc.trip_id 
    
    if doc.item_type == 'file' and doc.content:
        file_path = os.path.join(UPLOAD_DIR, doc.content)
        if os.path.exists(file_path):
            try:
                os.remove(file_path)
            except:
                pass 

    db.delete(doc)
    db.commit()
   
    background_tasks.add_task(manager.broadcast, {"action": "refresh_documents"}, trip_id)
    
    return {"status": "success", "message": "Документ видалено"}

@router.patch("/documents/{doc_id}", response_model=schemas.TripDocumentResponse)
def update_document( 
    doc_id: int, 
    doc_update: schemas.TripDocumentCreate, 
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db)
):
    db_doc = db.query(models.TripDocument).filter(models.TripDocument.id == doc_id).first()
    if not db_doc:
        raise HTTPException(status_code=404, detail="Документ не знайдено")
    
    db_doc.title = doc_update.title
    db_doc.content = doc_update.content
    
    db.commit()
    db.refresh(db_doc)
    
    background_tasks.add_task(manager.broadcast, {"action": "refresh_documents"}, db_doc.trip_id)
    
    return db_doc

@router.get("/trips/{trip_id}")
def get_trip_by_id(trip_id: int, db: Session = Depends(get_db)):
    trip = db.query(models.Trip).filter(models.Trip.id == trip_id).first()
    if not trip:
        raise HTTPException(status_code=404, detail="Подорож не знайдено")
    return trip