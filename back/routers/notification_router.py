from typing import List

import back.dto.notification_dto as notification_dto
import sqlalchemy.orm
from back.database import get_db
from back.dependencies import get_current_user
from back.service import notification_service
from fastapi import APIRouter, Depends

router = APIRouter(prefix="/notifications", tags=["Notifications"])


@router.get("/", response_model=List[notification_dto.NotificationOut])
def get_notifications(
    db: sqlalchemy.orm.Session = Depends(get_db), current_user=Depends(get_current_user)
):
    return notification_service.get_unread_notifications(db, current_user.id_user)


@router.patch("/{notification_id}/read")
def mark_as_read(
    notification_id: int,
    db: sqlalchemy.orm.Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    return notification_service.mark_notification_as_read(
        db, notification_id, current_user.id_user
    )
