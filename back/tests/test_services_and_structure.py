import datetime
from decimal import Decimal

import pytest

import back.dto.account_dto as account_dto
import back.dto.savings_goal_dto as savings_goal_dto
import back.dto.scheduled_transaction_dto as scheduled_dto
import back.dto.transaction_dto as transaction_dto
import back.dto.user_dto as user_dto
import back.service.account_service as account_service
import back.service.notification_service as notification_service
import back.service.savings_goal_service as savings_goal_service
import back.service.scheduled_transaction_service as scheduled_service
import back.service.transaction_service as transaction_service
import back.service.user_service as user_service
import back.structure as structure


@pytest.fixture
def test_user_and_setup(db_session):
    # Setup initial currency and category
    currency = structure.Currency(
        id_currency=1, code="PLN", name="Złoty", exchange_rate=Decimal("1.0")
    )
    category = structure.Category(
        id_category=1, name="Jedzenie", type=structure.TransactionType.EXPENSE
    )
    db_session.add(currency)
    db_session.add(category)
    db_session.commit()

    user_dto_obj = user_dto.UserCreate(
        email="test@example.com", password="password123", name="Test User"
    )
    user = user_service.create_user(user_dto_obj, "hashed_pwd")
    user_service.add_user(db_session, user)

    # Create account
    acc_dto = account_dto.AccountCreate(
        name="Main Bank Account", current_balance=Decimal("1000.00"), currency_id=1
    )
    acc = account_service.create_user_account(db_session, acc_dto, user.id_user)

    return user, acc, currency, category


def test_transaction_crud(db_session, test_user_and_setup):
    user, acc, currency, category = test_user_and_setup

    # Create Transaction
    tx_create = transaction_dto.TransactionCreate(
        amount=Decimal("150.00"),
        date=datetime.date.today(),
        description="Zakupy spożywcze",
        type=structure.TransactionType.EXPENSE,
        account_id=acc["id_account"],
        category_id=category.id_category,
        currency_id=currency.id_currency,
    )

    tx_res = transaction_service.create_user_transaction(
        db_session, tx_create, user.id_user
    )
    assert tx_res["amount"] == Decimal("150.00")
    assert tx_res["type"] == structure.TransactionType.EXPENSE
    assert tx_res["category_name"] == "Jedzenie"
    assert tx_res["currency_code"] == "PLN"
    assert tx_res["exchange_rate_snapshot"] == Decimal("1.0")

    # Verify Account Balance decreased
    acc_obj = (
        db_session.query(structure.Account)
        .filter_by(id_account=acc["id_account"])
        .first()
    )
    assert acc_obj.current_balance == Decimal("850.00")

    # Get Transactions
    tx_list = transaction_service.get_user_transactions(db_session, user.id_user)
    assert len(tx_list) == 1
    assert tx_list[0]["id_transaction"] == tx_res["id_transaction"]


def test_scheduled_transaction_crud(db_session, test_user_and_setup):
    user, acc, currency, category = test_user_and_setup

    st_create = scheduled_dto.ScheduledTransactionCreate(
        frequency=structure.ScheduleFrequency.MONTHLY,
        date=datetime.date.today(),
        amount=Decimal("200.00"),
        type=structure.TransactionType.EXPENSE,
        description="Subskrypcja",
        account_id=acc["id_account"],
        category_id=category.id_category,
        currency_id=currency.id_currency,
    )

    st_res = scheduled_service.create_scheduled_transaction(
        db_session, st_create, user.id_user
    )
    assert st_res["amount"] == Decimal("200.00")
    assert st_res["frequency"] == structure.ScheduleFrequency.MONTHLY
    assert st_res["account_name"] == "Main Bank Account"
    assert st_res["category_name"] == "Jedzenie"
    assert st_res["currency_code"] == "PLN"

    st_list = scheduled_service.get_user_scheduled_transactions(
        db_session, user.id_user
    )
    assert len(st_list) == 1
    assert st_list[0]["account_name"] == "Main Bank Account"


def test_notification_service(db_session, test_user_and_setup):
    user, _, _, _ = test_user_and_setup

    notif = structure.Notification(
        message="Test Notification",
        user_id=user.id_user,
        is_read=False,
    )
    db_session.add(notif)
    db_session.commit()

    unread = notification_service.get_unread_notifications(db_session, user.id_user)
    assert len(unread) == 1
    assert unread[0].message == "Test Notification"

    notification_service.mark_notification_as_read(
        db_session, notif.id_notification, user.id_user
    )
    unread_after = notification_service.get_unread_notifications(
        db_session, user.id_user
    )
    assert len(unread_after) == 0


def test_savings_goal_service(db_session, test_user_and_setup):
    user, _, currency, _ = test_user_and_setup

    goal_dto = savings_goal_dto.SavingsGoalCreate(
        name="Wakacje",
        target=Decimal("5000.00"),
        current_amount=Decimal("1000.00"),
        currency_id=currency.id_currency,
    )

    goal_res = savings_goal_service.create_savings_goal(
        db_session, goal_dto, user.id_user
    )
    assert goal_res["name"] == "Wakacje"
    assert goal_res["percent_complete"] == 20.0

    contrib = savings_goal_dto.SavingsGoalContribution(amount=Decimal("500.00"))
    updated = savings_goal_service.add_to_savings_goal(
        db_session, goal_res["id_saving_goal"], contrib, user.id_user
    )
    assert updated["current_amount"] == Decimal("1500.00")
    assert updated["percent_complete"] == 30.0
