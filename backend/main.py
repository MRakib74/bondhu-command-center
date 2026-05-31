from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from config import settings as app_settings
from routers import products, orders, content, video, leads, broadcast, analytics, images, settings, bondhumart, db_live
from database import engine
from models import crm

# Command Center-এর নিজস্ব ডাটাবেস টেবিলগুলো তৈরি করা হচ্ছে
crm.Base.metadata.create_all(bind=engine)

app = FastAPI(
    title=app_settings.PROJECT_NAME,
    version=app_settings.VERSION,
    description="Backend for Bondhumart AI Command Center (Multi-Agent System)"
)

# CORS সেটআপ (যাতে ড্যাশবোর্ড থেকে এপিআই কল করা যায়)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # প্রোডাকশনে এটা ঠিক করে দিবো
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Master AI Routing (এজেন্টদের কাজ ভাগ করে দেওয়া)
app.include_router(products.router, prefix=f"{app_settings.API_V1_STR}/products", tags=["📦 Product Base"])
app.include_router(orders.router, prefix=f"{app_settings.API_V1_STR}/orders", tags=["🛍️ Order Automation"])
app.include_router(content.router, prefix=f"{app_settings.API_V1_STR}/content", tags=["📝 Content AI"])
app.include_router(images.router, prefix=f"{app_settings.API_V1_STR}/images", tags=["🎨 Image AI"])
app.include_router(video.router, prefix=f"{app_settings.API_V1_STR}/video", tags=["🎬 Video AI"])
app.include_router(leads.router, prefix=f"{app_settings.API_V1_STR}/leads", tags=["👥 Lead Generation"])
app.include_router(broadcast.router, prefix=f"{app_settings.API_V1_STR}/broadcast", tags=["📡 Broadcast & Checker"])
app.include_router(analytics.router, prefix=f"{app_settings.API_V1_STR}/analytics", tags=["📊 Analytics"])
app.include_router(settings.router, prefix=f"{app_settings.API_V1_STR}/settings", tags=["⚙️ System Settings"])
app.include_router(bondhumart.router, prefix=f"{app_settings.API_V1_STR}/bondhumart", tags=["🔗 Bondhumart Integration"])
app.include_router(db_live.router, prefix=f"{app_settings.API_V1_STR}/live", tags=["📊 BondhuMart Live DB"])

@app.get("/", tags=["Health Check"])
async def root():
    return {"message": f"Welcome to {settings.PROJECT_NAME} API. System is running!"}

# এই কমান্ড দিয়ে সার্ভার রান করবেন:
# uvicorn main:app --reload --port 8000
