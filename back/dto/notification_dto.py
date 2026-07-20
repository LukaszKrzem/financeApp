from datetime import datetime

import pydantic
from pydantic import ConfigDict


class NotificationOut(pydantic.BaseModel):
    id_notification: int
    message: str
    date: datetime
    is_read: str
    User_id_user: int

    model_config = ConfigDict(from_attributes=True)
