from fastapi import FastAPI, Depends, HTTPException
from sqlalchemy.orm import Session
import models, database  # ПРИБРАНО КРАПКИ ТУТ
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

# Створюємо таблиці в БД автоматично при старті
models.Base.metadata.create_all(bind=database.engine)

app = FastAPI()

# Налаштування CORS, щоб React міг достукатися до Python
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class UserCreate(BaseModel):
    first_name: str
    last_name: str
    email: str
    password: str

@app.post("/register")
def register(user: UserCreate, db: Session = Depends(database.get_db)):
    # Перевірка на дублікат email
    db_user = db.query(models.User).filter(models.User.email == user.email).first()
    if db_user:
        raise HTTPException(status_code=400, detail="Email вже зареєстровано")
    
    # Створення запису
    new_user = models.User(
        first_name=user.first_name,
        last_name=user.last_name,
        email=user.email,
        password=user.password
    )
    
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return {"status": "success", "message": f"Користувач {user.first_name} створений!"}

# Додано блок для зручного запуску
if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)