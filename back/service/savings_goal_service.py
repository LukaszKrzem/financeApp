import sqlalchemy.orm
from fastapi import HTTPException

import back.dto.savings_goal_dto as savings_goal_dto
import back.structure as structure


def get_user_savings_goals(
    db: sqlalchemy.orm.Session, user_id: int
) -> list[structure.SavingsGoal]:
    return (
        db.query(structure.SavingsGoal)
        .options(sqlalchemy.orm.joinedload(structure.SavingsGoal.currency))
        .filter(structure.SavingsGoal.user_id == user_id)
        .order_by(structure.SavingsGoal.id_saving_goal.desc())
        .all()
    )


def create_savings_goal(
    db: sqlalchemy.orm.Session, data: savings_goal_dto.SavingsGoalCreate, user_id: int
) -> structure.SavingsGoal:
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

    return (
        db.query(structure.SavingsGoal)
        .options(sqlalchemy.orm.joinedload(structure.SavingsGoal.currency))
        .filter(structure.SavingsGoal.id_saving_goal == new_goal.id_saving_goal)
        .first()
    )


def update_savings_goal(
    db: sqlalchemy.orm.Session,
    goal_id: int,
    data: savings_goal_dto.SavingsGoalUpdate,
    user_id: int,
) -> structure.SavingsGoal:
    goal = (
        db.query(structure.SavingsGoal)
        .options(sqlalchemy.orm.joinedload(structure.SavingsGoal.currency))
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

    return goal


def add_to_savings_goal(
    db: sqlalchemy.orm.Session,
    goal_id: int,
    data: savings_goal_dto.SavingsGoalContribution,
    user_id: int,
) -> structure.SavingsGoal:
    goal = (
        db.query(structure.SavingsGoal)
        .options(sqlalchemy.orm.joinedload(structure.SavingsGoal.currency))
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

    return goal


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
