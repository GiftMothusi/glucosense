from fastapi import APIRouter
from app.api.routes import auth, users, glucose, meals, insulin, activities, analytics, care

from app.api.routes import food
from app.api.routes import labs, appointments


api_router = APIRouter(prefix="/api/v1")

api_router.include_router(auth.router)
api_router.include_router(users.router)
api_router.include_router(glucose.router)
api_router.include_router(meals.router)
api_router.include_router(insulin.router)
api_router.include_router(activities.router)
api_router.include_router(analytics.router)
api_router.include_router(care.router)
api_router.include_router(food.router)
api_router.include_router(labs.router)
api_router.include_router(appointments.router)

