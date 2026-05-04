from fastapi import FastAPI
from routers import user_router

app = FastAPI(title="Finance App API",version="0.1")
app.include_router(user_router.router)

@app.get("/")
def read_root():
    return {"status": "online", "message": "test"}