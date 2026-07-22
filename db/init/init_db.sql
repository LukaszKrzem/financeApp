DO $$ BEGIN
    CREATE TYPE transactiontype AS ENUM ('INCOME', 'EXPENSE');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE schedulefrequency AS ENUM ('DAILY', 'WEEKLY', 'MONTHLY', 'YEARLY');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;


CREATE TABLE IF NOT EXISTS currency (
    id_currency SERIAL PRIMARY KEY,
    code CHAR(3) NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    exchange_rate NUMERIC(10, 4) NOT NULL
);

CREATE TABLE IF NOT EXISTS "user" (
    id_user SERIAL PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    "password" VARCHAR(255) NOT NULL,
    "name" VARCHAR(255) NOT NULL
);

CREATE TABLE IF NOT EXISTS bank_connection (
    id_connection SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES "user"(id_user) ON DELETE CASCADE,
    bank_name VARCHAR(100),
    session_id VARCHAR(255) NOT NULL,
    valid_until TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS account (
    id_account SERIAL PRIMARY KEY,
    "name" VARCHAR(255) NOT NULL,
    current_balance NUMERIC(20, 2) NOT NULL,
    currency_id INTEGER NOT NULL REFERENCES currency(id_currency),
    user_id INTEGER NOT NULL REFERENCES "user"(id_user) ON DELETE CASCADE,
    bank_connection_id INTEGER REFERENCES bank_connection(id_connection) ON DELETE SET NULL,
    bank_account_uid VARCHAR(255) UNIQUE
);

CREATE TABLE IF NOT EXISTS categories (
    id_category SERIAL PRIMARY KEY,
    "name" VARCHAR(100) NOT NULL,
    "type" transactiontype NOT NULL
);

CREATE TABLE IF NOT EXISTS transaction (
    id_transaction SERIAL PRIMARY KEY,
    "type" transactiontype NOT NULL,
    amount NUMERIC(20, 2) NOT NULL CHECK (amount >= 0),
    transaction_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    description VARCHAR(255),
    exchange_rate_snapshot NUMERIC(10, 4) NOT NULL,
    external_id VARCHAR(255),
    account_id INTEGER NOT NULL REFERENCES account(id_account) ON DELETE CASCADE,
    category_id INTEGER REFERENCES categories(id_category) ON DELETE SET NULL,
    currency_id INTEGER NOT NULL REFERENCES currency(id_currency)
);

CREATE TABLE IF NOT EXISTS scheduled_transaction (
    id_schedule_transaction SERIAL PRIMARY KEY,
    "type" transactiontype NOT NULL,
    frequency schedulefrequency NOT NULL,
    next_date DATE NOT NULL,
    amount NUMERIC(20, 2) NOT NULL CHECK (amount >= 0),
    description VARCHAR(255),
    exchange_rate_snapshot NUMERIC(10, 4) NOT NULL,
    account_id INTEGER NOT NULL REFERENCES account(id_account) ON DELETE CASCADE,
    currency_id INTEGER NOT NULL REFERENCES currency(id_currency),
    category_id INTEGER REFERENCES categories(id_category) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS budget (
    id_budget SERIAL PRIMARY KEY,
    "limit" NUMERIC(20, 2) NOT NULL,
    start_date DATE NOT NULL,
    "end" DATE NOT NULL,
    user_id INTEGER NOT NULL REFERENCES "user"(id_user) ON DELETE CASCADE,
    category_id INTEGER NOT NULL REFERENCES categories(id_category) ON DELETE CASCADE,
    currency_id INTEGER NOT NULL REFERENCES currency(id_currency)
);

CREATE TABLE IF NOT EXISTS savinggoal (
    id_saving_goal SERIAL PRIMARY KEY,
    "name" VARCHAR(200) NOT NULL,
    target NUMERIC(20, 2) NOT NULL,
    current_amount NUMERIC(20, 2) NOT NULL,
    start_date DATE NOT NULL DEFAULT CURRENT_DATE,
    time_limit DATE,
    user_id INTEGER NOT NULL REFERENCES "user"(id_user) ON DELETE CASCADE,
    currency_id INTEGER NOT NULL REFERENCES currency(id_currency)
);

CREATE TABLE IF NOT EXISTS notification (
    id_notification SERIAL PRIMARY KEY,
    message VARCHAR(400) NOT NULL,
    "date" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    is_read BOOLEAN NOT NULL DEFAULT FALSE,
    user_id INTEGER NOT NULL REFERENCES "user"(id_user) ON DELETE CASCADE
);


CREATE INDEX IF NOT EXISTS ix_bank_connection_user_id ON bank_connection(user_id);

CREATE INDEX IF NOT EXISTS ix_account_currency_id ON account(currency_id);
CREATE INDEX IF NOT EXISTS ix_account_user_id ON account(user_id);
CREATE INDEX IF NOT EXISTS ix_account_bank_connection_id ON account(bank_connection_id);

CREATE INDEX IF NOT EXISTS ix_transaction_account_id ON transaction(account_id);
CREATE INDEX IF NOT EXISTS ix_transaction_category_id ON transaction(category_id);
CREATE INDEX IF NOT EXISTS ix_transaction_currency_id ON transaction(currency_id);

CREATE UNIQUE INDEX IF NOT EXISTS ux_transaction_account_external_id ON transaction (account_id, external_id) WHERE external_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS ix_scheduled_transaction_account_id ON scheduled_transaction(account_id);
CREATE INDEX IF NOT EXISTS ix_scheduled_transaction_currency_id ON scheduled_transaction(currency_id);
CREATE INDEX IF NOT EXISTS ix_scheduled_transaction_category_id ON scheduled_transaction(category_id);

CREATE INDEX IF NOT EXISTS ix_budget_user_id ON budget(user_id);
CREATE INDEX IF NOT EXISTS ix_budget_category_id ON budget(category_id);
CREATE INDEX IF NOT EXISTS ix_budget_currency_id ON budget(currency_id);

CREATE INDEX IF NOT EXISTS ix_savinggoal_user_id ON savinggoal(user_id);
CREATE INDEX IF NOT EXISTS ix_savinggoal_currency_id ON savinggoal(currency_id);

CREATE INDEX IF NOT EXISTS ix_notification_user_id ON notification(user_id);

INSERT INTO currency (id_currency, code, "name", exchange_rate)
VALUES (1, 'PLN', 'Złoty', 1.000)
ON CONFLICT DO NOTHING;

SELECT setval('currency_id_currency_seq', (SELECT MAX(id_currency) FROM currency));

INSERT INTO categories (name, "type")
VALUES ('Jedzenie i Kawiarnie', 'EXPENSE')
ON CONFLICT DO NOTHING;

SELECT setval('categories_id_category_seq', (SELECT MAX(id_category) FROM categories));


CREATE OR REPLACE FUNCTION create_def_acc()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO account ("name", current_balance, currency_id, user_id)
    VALUES ('Main Account', 0.00, 1, NEW.id_user);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_create_def_acc ON "user";
CREATE TRIGGER trg_create_def_acc
AFTER INSERT ON "user"
FOR EACH ROW
EXECUTE FUNCTION create_def_acc();


CREATE OR REPLACE PROCEDURE catch_up_scheduled_transactions(p_user_id INT)
LANGUAGE plpgsql AS $$
DECLARE
    r_sched RECORD;
    v_acc_rate NUMERIC(10,4);
    v_converted_amount NUMERIC(20,2);
    v_current_next_date DATE;
    v_final_description VARCHAR(255);
BEGIN
    FOR r_sched IN
        SELECT st.* FROM scheduled_transaction st
        JOIN account a ON st.account_id = a.id_account
        WHERE a.user_id = p_user_id AND st.next_date <= CURRENT_DATE
    LOOP
        IF r_sched.description IS NOT NULL AND r_sched.description <> '' THEN
            v_final_description := r_sched.description;
        ELSE
            v_final_description := 'Automatic payment (' || r_sched.frequency || ')';
        END IF;

        SELECT exchange_rate INTO v_acc_rate FROM currency WHERE id_currency = (SELECT currency_id FROM account WHERE id_account = r_sched.account_id);

        v_converted_amount := r_sched.amount * (r_sched.exchange_rate_snapshot / v_acc_rate);
        v_current_next_date := r_sched.next_date;

        WHILE v_current_next_date <= CURRENT_DATE LOOP
            INSERT INTO transaction ("type", amount, transaction_date, description, exchange_rate_snapshot, account_id, category_id, currency_id)
            VALUES (
                r_sched.type,
                r_sched.amount,
                v_current_next_date,
                v_final_description,
                r_sched.exchange_rate_snapshot,
                r_sched.account_id,
                r_sched.category_id,
                r_sched.currency_id
            );

            IF r_sched.type = 'EXPENSE' THEN
                UPDATE account SET current_balance = current_balance - v_converted_amount WHERE id_account = r_sched.account_id;
            ELSE
                UPDATE account SET current_balance = current_balance + v_converted_amount WHERE id_account = r_sched.account_id;
            END IF;

            IF UPPER(r_sched.frequency::text) = 'DAILY' THEN
                v_current_next_date := v_current_next_date + INTERVAL '1 day';
            ELSIF UPPER(r_sched.frequency::text) = 'WEEKLY' THEN
                v_current_next_date := v_current_next_date + INTERVAL '1 week';
            ELSIF UPPER(r_sched.frequency::text) = 'MONTHLY' THEN
                v_current_next_date := v_current_next_date + INTERVAL '1 month';
            ELSIF UPPER(r_sched.frequency::text) = 'YEARLY' THEN
                v_current_next_date := v_current_next_date + INTERVAL '1 year';
            ELSE
                v_current_next_date := v_current_next_date + INTERVAL '1 month';
            END IF;
        END LOOP;

        UPDATE scheduled_transaction
        SET next_date = v_current_next_date
        WHERE id_schedule_transaction = r_sched.id_schedule_transaction;
    END LOOP;
END;
$$;


CREATE OR REPLACE FUNCTION check_budget_overflow()
RETURNS TRIGGER AS $$
DECLARE
    v_user_id INT;
    v_budget_id INT;
    v_budget_limit NUMERIC(20, 2);
    v_budget_currency_id INT;
    v_current_spent NUMERIC(20, 2);
    v_new_tx_converted NUMERIC(20, 2);
BEGIN
    IF NEW.type = 'EXPENSE' THEN
        SELECT user_id INTO v_user_id
        FROM account
        WHERE id_account = NEW.account_id;

        SELECT id_budget, "limit", currency_id INTO v_budget_id, v_budget_limit, v_budget_currency_id
        FROM budget
        WHERE user_id = v_user_id
          AND category_id = NEW.category_id
          AND NEW.transaction_date >= start_date::timestamp
          AND NEW.transaction_date <= "end"::timestamp;

        IF v_budget_id IS NOT NULL THEN
            SELECT COALESCE(SUM(t.amount * (t.exchange_rate_snapshot / curr_budget.exchange_rate)), 0.00) INTO v_current_spent
            FROM transaction t
            JOIN account a ON t.account_id = a.id_account
            JOIN currency curr_budget ON curr_budget.id_currency = v_budget_currency_id
            WHERE a.user_id = v_user_id
              AND t.category_id = NEW.category_id
              AND t.type = 'EXPENSE'
              AND t.transaction_date >= (SELECT start_date FROM budget WHERE id_budget = v_budget_id)::timestamp
              AND t.transaction_date <= (SELECT "end" FROM budget WHERE id_budget = v_budget_id)::timestamp;

            SELECT (NEW.amount * (NEW.exchange_rate_snapshot / curr_budget.exchange_rate)) INTO v_new_tx_converted
            FROM currency curr_budget
            WHERE curr_budget.id_currency = v_budget_currency_id;

            IF v_current_spent > v_budget_limit AND (v_current_spent - COALESCE(v_new_tx_converted, 0)) <= v_budget_limit THEN
                INSERT INTO notification (message, "date", is_read, user_id)
                VALUES (
                    'Limit surpassed. Current spending is: ' || v_current_spent || ' while limit is: ' || v_budget_limit || ' (Percentage used: ' || ROUND((v_current_spent / v_budget_limit) * 100, 2) || '%)',
                    NOW(),
                    FALSE,
                    v_user_id
                );
            END IF;
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_check_budget_overflow ON transaction;
CREATE TRIGGER trg_check_budget_overflow
AFTER INSERT ON transaction
FOR EACH ROW
EXECUTE FUNCTION check_budget_overflow();


DROP TABLE IF EXISTS v_budget_analytics;

CREATE OR REPLACE VIEW v_budget_analytics AS
SELECT
    b.id_budget,
    b.limit,
    b.start_date,
    b.end,
    b.user_id,
    b.category_id,
    c.name AS category_name,
    b.currency_id,
    curr.code AS currency_code,

    COALESCE(
        (
            SELECT SUM(t.amount * (t.exchange_rate_snapshot / curr_budget.exchange_rate))
            FROM transaction t
            JOIN account a ON t.account_id = a.id_account
            JOIN currency curr_budget ON curr_budget.id_currency = b.currency_id
            WHERE a.user_id = b.user_id
              AND t.category_id = b.category_id
              AND t.type = 'EXPENSE'
              AND t.transaction_date >= b.start_date::timestamp
              AND t.transaction_date <= b.end::timestamp
        ), 0.00
    ) AS current_spent,

    ROUND((COALESCE(
        (
            SELECT SUM(t.amount * (t.exchange_rate_snapshot / curr_budget.exchange_rate))
            FROM transaction t
            JOIN account a ON t.account_id = a.id_account
            JOIN currency curr_budget ON curr_budget.id_currency = b.currency_id
            WHERE a.user_id = b.user_id
              AND t.category_id = b.category_id
              AND t.type = 'EXPENSE'
              AND t.transaction_date >= b.start_date::timestamp
              AND t.transaction_date <= b.end::timestamp
        ), 0.00
    ) / b.limit) * 100, 2)::float AS percent_used

FROM budget b
JOIN categories c ON b.category_id = c.id_category
JOIN currency curr ON b.currency_id = curr.id_currency;