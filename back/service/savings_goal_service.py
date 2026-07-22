import sqlalchemy.orm
from fastapi import HTTPException

import back.dto.savings_goal_dto as savings_goal_dto
import back.structure as structure


def _goal_to_response(goal: structure.SavingsGoal, currency_code: str):
    target = float(goal.target)
    current_amount = float(goal.current_amount)

    return {
        "id_saving_goal": goal.id_saving_goal,
        "name": goal.name,
        "target": goal.target,
        "current_amount": goal.current_amount,
        "start_date": goal.start_date,
        "time_limit": goal.time_limit,
        "user_id": goal.user_id,
        "currency_id": goal.currency_id,
        "currency_code": currency_code,
        "percent_complete": round((current_amount / target) * 100, 2)
        if target > 0
        else 0,
    }


def get_user_savings_goals(db: sqlalchemy.orm.Session, user_id: int):
    results = (
        db.query(structure.SavingsGoal, structure.Currency)
        .join(
            structure.Currency,
            structure.SavingsGoal.currency_id == structure.Currency.id_currency,
        )
        .filter(structure.SavingsGoal.user_id == user_id)
        .order_by(structure.SavingsGoal.id_saving_goal.desc())
        .all()
    )

    return [_goal_to_response(goal, currency.code) for goal, currency in results]


def create_savings_goal(
    db: sqlalchemy.orm.Session, data: savings_goal_dto.SavingsGoalCreate, user_id: int
):
    currency = (
        db.query(structure.Currency)
        .filter(structure.Currency.id_currency == data.currency_id)
        .first()
    )
    if not currency:
        raise HTTPException(status_code=404, detail="Selected currency not found.")

    new_goal = structure.SavingsGoal(
        name=data.name,
        target=data.target,
        current_amount=data.current_amount,
        time_limit=data.time_limit,
        user_id=user_id,
        currency_id=data.currency_id,
    )

    db.add(new_goal)
    db.commit()
    db.refresh(new_goal)

    return _goal_to_response(new_goal, currency.code)


def update_savings_goal(
    db: sqlalchemy.orm.Session,
    goal_id: int,
    data: savings_goal_dto.SavingsGoalUpdate,
    user_id: int,
):
    goal = (
        db.query(structure.SavingsGoal)
        .filter(
            structure.SavingsGoal.id_saving_goal == goal_id,
            structure.SavingsGoal.user_id == user_id,
        )
        .first()
    )
    if not goal:
        raise HTTPException(status_code=404, detail="Savings goal not found.")

    if data.currency_id is not None:
        currency = (
            db.query(structure.Currency)
            .filter(structure.Currency.id_currency == data.currency_id)
            .first()
        )
        if not currency:
            raise HTTPException(status_code=404, detail="Selected currency not found.")
        goal.currency_id = data.currency_id

    if data.name is not None:
        goal.name = data.name
    if data.target is not None:
        goal.target = data.target
    if data.current_amount is not None:
        goal.current_amount = data.current_amount
    if data.time_limit is not None:
        goal.time_limit = data.time_limit

    db.commit()
    db.refresh(goal)

    currency = (
        db.query(structure.Currency)
        .filter(structure.Currency.id_currency == goal.currency_id)
        .first()
    )

    return _goal_to_response(goal, currency.code)


def add_to_savings_goal(
    db: sqlalchemy.orm.Session,
    goal_id: int,
    data: savings_goal_dto.SavingsGoalContribution,
    user_id: int,
):
    goal = (
        db.query(structure.SavingsGoal)
        .filter(
            structure.SavingsGoal.id_saving_goal == goal_id,
            structure.SavingsGoal.user_id == user_id,
        )
        .first()
    )
    if not goal:
        raise HTTPException(status_code=404, detail="Savings goal not found.")

    goal.current_amount += data.amount

    db.commit()
    db.refresh(goal)

    currency = (
        db.query(structure.Currency)
        .filter(structure.Currency.id_currency == goal.currency_id)
        .first()
    )

    return _goal_to_response(goal, currency.code)


def delete_savings_goal(db: sqlalchemy.orm.Session, goal_id: int, user_id: int):
    goal = (
        db.query(structure.SavingsGoal)
        .filter(
            structure.SavingsGoal.id_saving_goal == goal_id,
            structure.SavingsGoal.user_id == user_id,
        )
        .first()
    )
    if not goal:
        raise HTTPException(status_code=404, detail="Savings goal not found.")

    db.delete(goal)
    db.commit()
    return None
