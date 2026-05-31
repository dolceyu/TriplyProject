import json
import os
import traceback
import requests
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from database import get_db
import models
from dotenv import load_dotenv

# Завантажуємо всі змінні з файлу .env у пам'ять
load_dotenv()

router = APIRouter(tags=["AI Recommendations"])

API_KEY = os.getenv("GEMINI_API_KEY")

@router.get("/trips/{trip_id}/ai-recommendations")
def get_ai_recommendations(
    trip_id: int, 
    category: str = Query(None, description="Категорія локацій"),
    current: str = Query(None, description="Локації, які вже є на екрані"), 
    db: Session = Depends(get_db)
):
    try:
        trip = db.query(models.Trip).filter(models.Trip.id == trip_id).first()
        if not trip:
            raise HTTPException(status_code=404, detail="Подорож не знайдена")

        existing_items = db.query(models.ItineraryItem).filter(models.ItineraryItem.trip_id == trip_id).all()
        avoid_list = [item.title for item in existing_items]
        
        if current:
            avoid_list.extend(current.split("||"))
            
        avoid_str = ", ".join(avoid_list) if avoid_list else "поки нічого не додано"
        
        category_context = f"Користувач хоче локації саме в такій тематиці: {category}." if category else "Запропонуй цікаві локації різних типів (мікс)."
        
        prompt = f"""
        Ти професійний тревел-гід. Користувач планує подорож сюди: {trip.destination}.
        {category_context}
        У його маршруті АБО на екрані вже є такі місця (ЇХ НЕ ПРОПОНУЙ): {avoid_str}.
        
        Запропонуй 4 нових, цікавих локацій, яких ЩЕ НЕМАЄ у списку вище.
        
        Відповідь має бути ТІЛЬКИ у форматі JSON-масиву. Ніякого зайвого тексту, ніяких markdown блоків типу ```json.
        Формат:
        [
          {{"title": "Назва локації", "description": "Цікавий опис на 1-2 речення", "category": "музей/парк/кафе/розваги"}}
        ]
        """

        base_url = "https://generativelanguage.googleapis.com"
        api_path = "/v1beta/models/gemini-2.5-flash:generateContent"
        url = f"{base_url}{api_path}?key={API_KEY}"
        payload = {
            "contents": [{"parts": [{"text": prompt}]}]
        }
        
        response = requests.post(url, json=payload, headers={'Content-Type': 'application/json'})
        
        if response.status_code != 200:
            raise Exception(f"Google API Error: {response.text}")
        
        data = response.json()
        raw_text = data['candidates'][0]['content']['parts'][0]['text'].strip()
        
        if raw_text.startswith("```json"):
            raw_text = raw_text[7:-3]
        elif raw_text.startswith("```"):
             raw_text = raw_text[3:-3]
             
        parsed_json = json.loads(raw_text.strip())
        return parsed_json
        
    except Exception as e:
        print(traceback.format_exc()) 
        raise HTTPException(status_code=500, detail="ШІ тимчасово недоступний")