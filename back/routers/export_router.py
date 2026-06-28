import csv
import io
from datetime import datetime

from back import structure
from back.database import get_db
from back.dependencies import get_current_user
from fastapi import APIRouter, Depends
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session

router = APIRouter(prefix="/export", tags=["export"])


@router.get("/csv")
def export_transactions_to_csv(
    db: Session = Depends(get_db),
    current_user: structure.User = Depends(get_current_user),
):
    accounts = (
        db.query(structure.Account).filter_by(User_id_user=current_user.id_user).all()
    )
    account_ids = [acc.id_account for acc in accounts]

    if not account_ids:
        transactions = []
    else:
        transactions = (
            db.query(
                structure.Transaction,
                structure.Category.name.label("category_name"),
                structure.Account.name.label("account_name"),
            )
            .join(
                structure.Category,
                structure.Transaction.Category_id_category
                == structure.Category.id_category,
            )
            .join(
                structure.Account,
                structure.Transaction.Account_id_account
                == structure.Account.id_account,
            )
            .filter(structure.Transaction.Account_id_account.in_(account_ids))
            .order_by(structure.Transaction.date.desc())
            .all()
        )

    stream = io.StringIO()
    writer = csv.writer(stream, delimiter=";")

    writer.writerow(["Date", "Amount", "Type", "Description", "Category", "Account"])

    for tx, category_name, account_name in transactions:
        writer.writerow(
            [
                tx.date,
                tx.amount,
                "Income" if tx.is_income == "T" else "Expense",
                tx.description,
                category_name,
                account_name,
            ]
        )

    stream.seek(0)

    today_str = datetime.now().strftime("%Y-%m-%d")
    filename = f"SmartBudget_export_{today_str}.csv"

    return StreamingResponse(
        iter([stream.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename={filename}"},
    )
