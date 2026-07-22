from typing import List

import sqlalchemy.orm
from fastapi import HTTPException

import back.dto.budget_dto as budget_dto
import back.structure as structure


def create_user_budget(
    db: sqlalchemy.orm.Session, data: budget_dto.BudgetCreate, user_id: int
):
    category = (
        db.query(structure.Category)
        .filter(structure.Category.id_category == data.category_id)
        .first()
    )
    if not category:
        raise HTTPException(status_code=404, detail="Not found category for budget.")

    currency = (
        db.query(structure.Currency)
        .filter(structure.Currency.id_currency == data.currency_id)
        .first()
    )
    if not currency:
        raise HTTPException(status_code=404, detail="Not found currency for budget.")

    new_budget = structure.Budget(
        limit=data.limit,
        start_date=data.start_date,
        end=data.end,
        user_id=user_id,
        category_id=data.category_id,
        currency_id=data.currency_id,
    )
    db.add(new_budget)
    db.commit()

    return (
        db.query(structure.BudgetAnalytics)
        .filter(structure.BudgetAnalytics.id_budget == new_budget.id_budget)
        .first()
    )


# USE THIS TO DISPLAY BUDGETS ON FRONTEND IT HAS ALL IMPORTANT DATA
def get_calculated_budgets(
    db: sqlalchemy.orm.Session, user_id: int
) -> List[structure.BudgetAnalytics]:
    # To get all useful data from budget
    return (
        db.query(structure.BudgetAnalytics)
        .filter(structure.BudgetAnalytics.user_id == user_id)
        .all()
    )


def update_user_budget(
    db: sqlalchemy.orm.Session,
    budget_id: int,
    user_id: int,
    data: budget_dto.BudgetUpdate,
):
    budget = (
        db.query(structure.Budget)
        .filter(
            structure.Budget.id_budget == budget_id,
            structure.Budget.user_id == user_id,
        )
        .first()
    )
    if not budget:
        raise HTTPException(status_code=404, detail="Budget not found")

    if data.limit is not None:
        budget.limit = data.limit
    if data.start_date is not None:
        budget.start_date = data.start_date
    if data.end is not None:
        budget.end = data.end
    if data.category_id is not None:
        budget.category_id = data.category_id
    if data.currency_id is not None:
        budget.currency_id = data.currency_id

    db.commit()

    return (
        db.query(structure.BudgetAnalytics)
        .filter(structure.BudgetAnalytics.id_budget == budget_id)
        .first()
    )


def delete_user_budget(db: sqlalchemy.orm.Session, budget_id: int, user_id: int):
    budget = (
        db.query(structure.Budget)
        .filter(
            structure.Budget.id_budget == budget_id,
            structure.Budget.user_id == user_id,
        )
        .first()
    )
    if not budget:
        raise HTTPException(status_code=404, detail="No budget found")
    db.delete(budget)
    db.commit()
    return None

