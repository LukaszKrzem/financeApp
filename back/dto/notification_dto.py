from datetime import datetime
import pydantic

class NotificationOut(pydantic.BaseModel):
    id_notification: int
    message: str
    date: datetime
    is_read: str
    User_id_user: int

    class Config:
        from_attributes = True