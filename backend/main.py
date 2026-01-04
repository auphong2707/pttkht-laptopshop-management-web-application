from fastapi import FastAPI, Depends

from dotenv import load_dotenv
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

from db.models import *
from db.session import *
from schemas.laptops import *
from schemas.orders import *
from schemas.refund_tickets import *
from schemas.reviews import *

from fastapi.staticfiles import StaticFiles

from routes.laptops import laptops_router
from routes.reviews import reviews_router
from routes.cart import cart_router
from routes.orders import orders_router
from routes.accounts import accounts_router
from routes.refund_tickets import refund_tickets_router
from routes.analytics import analytics_router
from routes.payments import payments_router

app = FastAPI()
app.include_router(laptops_router, tags=["laptops"])
app.include_router(reviews_router, tags=["reviews"])
app.include_router(cart_router, tags=["cart"])
app.include_router(orders_router, tags=["orders"])
app.include_router(accounts_router, tags=["accounts"])
app.include_router(refund_tickets_router, tags=["refund_tickets"])
app.include_router(analytics_router, tags=["analytics"])
app.include_router(payments_router, tags=["payments"])
security = HTTPBearer()


load_dotenv()

origins = [
    "http://localhost:3000",
    "http://localhost:5173",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.mount("/static", StaticFiles(directory="static"), name="static")


@app.get("/secure")
def secure_endpoint(credentials: HTTPAuthorizationCredentials = Depends(security)):
    token = credentials.credentials
    return {"token": token}


@app.get("/")
def read_root():
    return {"message": "Welcome to Laptop Management API!"}
