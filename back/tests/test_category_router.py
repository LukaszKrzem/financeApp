import back.structure as structure


def test_get_categories(client, db_session):
    cat1 = structure.Category(name="Groceries", type=structure.TransactionType.EXPENSE)
    cat2 = structure.Category(name="Salary", type=structure.TransactionType.INCOME)
    db_session.add_all([cat1, cat2])
    db_session.commit()

    response = client.get("/categories/")
    assert response.status_code == 200
    categories = response.json()
    assert len(categories) >= 2
    names = [c["name"] for c in categories]
    assert "Groceries" in names
    assert "Salary" in names
