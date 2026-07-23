from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from back.routers import (
    account_router,
    auth_router,
    budget_router,
    category_router,
    currency_router,
    enable_banking_router,
    notification_router,
    savings_goal_router,
    scheduled_transaction_router,
    transaction_router,
    user_router,
    webauthn_router,
)

# ! Important !
# If final app we need to add to app docs_url=None, redoc_url=None, openapi_url=None
# For now please leave it as is coz useful for testing
# Don't remove this comment until final version or docs are disabled
# Don't disable too early tho super good for testing
# ! Important !


@asynccontextmanager
async def lifespan(app: FastAPI):
    # since we use neon following line has to be commented
    # if you wanna use local db uncomment it
    # back.database.Base.metadata.create_all(bind=back.database.engine)
    yield


app = FastAPI(title="Finance App API", version="0.1", lifespan=lifespan)


origins = [
    "http://localhost:5173",
    "http://localhost:5174",
    "http://127.0.0.1:3000",
    "https://finance-app-lukaszkrzem.vercel.app",
]


app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.include_router(user_router.router)
app.include_router(account_router.router)
app.include_router(transaction_router.router)
app.include_router(category_router.router)
app.include_router(scheduled_transaction_router.router)
app.include_router(budget_router.router)
app.include_router(notification_router.router)
app.include_router(savings_goal_router.router)
app.include_router(currency_router.router)
app.include_router(enable_banking_router.router)
app.include_router(auth_router.router)
app.include_router(webauthn_router.router)


# For testing if app is alive, can be removed later
@app.get("/")
def read_root():
    return {"status": "online", "message": "test"}
