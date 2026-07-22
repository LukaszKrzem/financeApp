from typing import List

import sqlalchemy.orm
from fastapi import HTTPException

import back.structure as structure


def get_unread_notifications(
    db: sqlalchemy.orm.Session, user_id: int
) -> List[structure.Notification]:
    return (
        db.query(structure.Notification)
        .filter(
            structure.Notification.user_id == user_id,
            not structure.Notification.is_read,
        )
        .order_by(structure.Notification.date.desc())
        .all()
    )


def mark_notification_as_read(
    db: sqlalchemy.orm.Session, notification_id: int, user_id: int
):
    notification = (
        db.query(structure.Notification)
        .filter(
            structure.Notification.id_notification == notification_id,
            structure.Notification.user_id == user_id,
        )
        .first()
    )
    if not notification:
        raise HTTPException(status_code=404, detail="Notification not found")
    notification.is_read = True
    db.commit()
    return {"status": "success", "message": "Notification marked as read"}


def mark_all_notifications_as_read(db: sqlalchemy.orm.Session, user_id: int):
    db.query(structure.Notification).filter(
        structure.Notification.user_id == user_id,
        not structure.Notification.is_read,
    ).update({"is_read": True})

    db.commit()
    return {"status": "success", "message": "All notifications marked as read"}
