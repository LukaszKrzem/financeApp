from typing import List

from fastapi import APIRouter, Depends, status
import sqlalchemy.orm

import back.dto.savings_goal_dto as savings_goal_dto
from back.database import get_db
from back.dependencies import get_current_user
from back.service import savings_goal_service

router = APIRouter(prefix="/savings-goals", tags=["Savings Goals"])


@router.get("/", response_model=List[savings_goal_dto.SavingsGoalOut])
def get_savings_goals(
    db: sqlalchemy.orm.Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    return savings_goal_service.get_user_savings_goals(db, current_user.id_user)


@router.post("/", response_model=savings_goal_dto.SavingsGoalOut)
def create_savings_goal(
    data: savings_goal_dto.SavingsGoalCreate,
    db: sqlalchemy.orm.Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    return savings_goal_service.create_savings_goal(db, data, current_user.id_user)


@router.patch("/{goal_id}", response_model=savings_goal_dto.SavingsGoalOut)
def update_savings_goal(
    goal_id: int,
    data: savings_goal_dto.SavingsGoalUpdate,
    db: sqlalchemy.orm.Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    return savings_goal_service.update_savings_goal(
        db, goal_id, data, current_user.id_user
    )


@router.patch("/{goal_id}/add", response_model=savings_goal_dto.SavingsGoalOut)
def add_to_savings_goal(
    goal_id: int,
    data: savings_goal_dto.SavingsGoalContribution,
    db: sqlalchemy.orm.Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    return savings_goal_service.add_to_savings_goal(
        db, goal_id, data, current_user.id_user
    )


@router.delete("/{goal_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_savings_goal(
    goal_id: int,
    db: sqlalchemy.orm.Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    return savings_goal_service.delete_savings_goal(db, goal_id, current_user.id_user)
