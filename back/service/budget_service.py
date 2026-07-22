from decimal import Decimal

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

    analytics = (
        db.query(structure.BudgetAnalytics)
        .filter(structure.BudgetAnalytics.id_budget == new_budget.id_budget)
        .first()
    )
    if not analytics:
        return {
            "id_budget": new_budget.id_budget,
            "limit": new_budget.limit,
            "start_date": new_budget.start_date,
            "end": new_budget.end,
            "category_id": new_budget.category_id,
            "category_name": category.name,
            "currency_id": new_budget.currency_id,
            "currency_code": currency.code,
            "current_spent": Decimal("0.00"),
            "percent_used": 0.0,
        }
    return analytics


# USE THIS TO DISPLAY BUDGETS ON FRONTEND IT HAS ALL IMPORTANT DATA
def get_calculated_budgets(db: sqlalchemy.orm.Session, user_id: int) -> list:
    results = (
        db.query(structure.BudgetAnalytics)
        .filter(structure.BudgetAnalytics.user_id == user_id)
        .all()
    )
    if results:
        return results

    raw_budgets = (
        db.query(structure.Budget, structure.Category, structure.Currency)
        .join(
            structure.Category,
            structure.Budget.category_id == structure.Category.id_category,
        )
        .join(
            structure.Currency,
            structure.Budget.currency_id == structure.Currency.id_currency,
        )
        .filter(structure.Budget.user_id == user_id)
        .all()
    )

    return [
        {
            "id_budget": b.id_budget,
            "limit": b.limit,
            "start_date": b.start_date,
            "end": b.end,
            "category_id": b.category_id,
            "category_name": cat.name,
            "currency_id": b.currency_id,
            "currency_code": curr.code,
            "current_spent": Decimal("0.00"),
            "percent_used": 0.0,
        }
        for b, cat, curr in raw_budgets
    ]


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

    analytics = (
        db.query(structure.BudgetAnalytics)
        .filter(structure.BudgetAnalytics.id_budget == budget_id)
        .first()
    )
    if not analytics:
        category = (
            db.query(structure.Category)
            .filter(structure.Category.id_category == budget.category_id)
            .first()
        )
        currency = (
            db.query(structure.Currency)
            .filter(structure.Currency.id_currency == budget.currency_id)
            .first()
        )
        return {
            "id_budget": budget.id_budget,
            "limit": budget.limit,
            "start_date": budget.start_date,
            "end": budget.end,
            "category_id": budget.category_id,
            "category_name": category.name if category else "",
            "currency_id": budget.currency_id,
            "currency_code": currency.code if currency else "",
            "current_spent": Decimal("0.00"),
            "percent_used": 0.0,
        }
    return analytics


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
