HOW TO USE POSTMAN

1. Start the app 
2. Register using visual app use easy login name and pass for example
a
a@a.a
a
3. Open Postman
4. POST to http://localhost:8000/login
Body Json raw
{
    "email": "a@a.a",
    "password": "a"
}
5. Copy string from token
6. Create new request and click on authorisation
7. Chose Bearer Token and paste token
8. Now you can test functions requiering token f.e.

POST http://localhost:8000/transactions/

{
    "amount": 1.0,
    "description": "a",
    "type": "EXPENSE",
    "Account_id_account": 1,
    "Category_id_category": 1
}