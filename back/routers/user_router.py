import back.dto.user_dto as user_dto
from back.dependencies import get_current_user
from fastapi import APIRouter, Depends

router = APIRouter(tags=["Users"])


@router.get("/me", response_model=user_dto.UserOut)
def read_users_me(current_user=Depends(get_current_user)):
    return current_user
