from back.database import get_db
from back.dependencies import get_current_user
from back.dto.help_dto import FeedbackCreateDTO
from back.service import help_service
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

router = APIRouter(prefix="/help", tags=["Help"])


@router.get("/presigned-url")
def get_presigned_url(
    file_type: str = Query(..., description="MIME type of the file, e.g. image/png"),
    current_user=Depends(get_current_user),
):
    return help_service.generate_presigned_url(file_type)


@router.post("/feedback")
def submit_feedback(
    dto: FeedbackCreateDTO,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    return help_service.process_feedback(
        db=db,
        message=dto.message,
        screenshot=dto.screenshot,
        user_id=current_user.id_user,
    )
