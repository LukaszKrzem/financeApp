from typing import List

import back.dto.budget_dto as budget_dto
import sqlalchemy.orm
from back.database import get_db
from back.dependencies import get_current_user
from back.service import budget_service
from fastapi import APIRouter, Depends, status

router = APIRouter(prefix="/budgets", tags=["Budgets"])


@router.post("/", response_model=budget_dto.BudgetOut)
def create_budget(
    data: budget_dto.BudgetCreate,
    db: sqlalchemy.orm.Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    return budget_service.create_user_budget(db, data, current_user.id_user)


@router.get("/", response_model=List[budget_dto.BudgetOut])
def get_budgets(
    db: sqlalchemy.orm.Session = Depends(get_db), current_user=Depends(get_current_user)
):
    return budget_service.get_calculated_budgets(db, current_user.id_user)


@router.patch("/{budget_id}", response_model=budget_dto.BudgetOut)
def update_budget(
    budget_id: int,
    data: budget_dto.BudgetUpdate,
    db: sqlalchemy.orm.Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    return budget_service.update_user_budget(
        db, budget_id, current_user.id_user, data
    )


@router.delete("/{budget_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_budget(
    budget_id: int,
    db: sqlalchemy.orm.Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    return budget_service.delete_user_budget(db, budget_id, current_user.id_user)

