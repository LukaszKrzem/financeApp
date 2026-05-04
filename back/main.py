from fastapi import FastAPI
from routers import user_router

# ! Important !
# If final app we need to add to app docs_url=None, redoc_url=None, openapi_url=None
# For now please leave it as is coz useful for testing
# Don't remove this comment until final version or docs are disabled
# Don't disable too early tho super good for testing
# ! Important !

# To create app. title and version kinda pointelss but you can see in docs
app = FastAPI(title="Finance App API",version="0.1")
app.include_router(user_router.router)

# For testing if app is alive, can be removed later
@app.get("/")
def read_root():
    return {"status": "online", "message": "test"}