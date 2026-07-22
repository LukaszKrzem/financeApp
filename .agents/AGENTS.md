# Project Rules

## Code Verification
- **Frontend (JavaScript/React)**: Always verify that written or edited code passes ESLint (`npm run lint` or `npx eslint`) and adheres to Prettier formatting (`.prettierrc`) before declaring completion.
- **Backend (Python)**: Always verify that written or edited Python code in `back/` passes Ruff linting (`ruff check .` or `.\venv\Scripts\ruff check .`) and formatting (`ruff format --check .` or `.\venv\Scripts\ruff format .`) before declaring completion.

## Database & Models (SQLAlchemy + Pydantic)
- **Strict Naming Conventions:** Always use the established foreign key naming convention (`account_id`, `category_id`, `currency_id`, `user_id`) and primary key convention (`id_account`, `id_user`, etc.). Never invent legacy names like `User_id_user` for foreign keys.
- **Type Consistency:** Always ensure that SQLAlchemy models (`structure.py`) match Pydantic DTO types (e.g., if a database column is `Boolean`, the DTO must use `bool`).
- **Querying:** When querying relationships or resources, always verify ownership (e.g., `account.user_id == user_id`) to prevent unauthorized data access.

## Testing (Pytest)
- **Test Coverage:** When adding or modifying a backend service function or route, update or add corresponding unit/integration tests in `back/tests/`.
- **Database Fixture:** Use the existing `db_session` fixture and test setup in `conftest.py` for integration tests.

## Frontend Architecture (React)
- **State Management & Refreshes:** After implementing CRUD operations (POST, PATCH, DELETE), call `refreshData()` from `useData()` (`DataContext.jsx`) to sync local application state.
- **Imports:** Always use `@/` absolute path alias for internal components, contexts, hooks, and helpers (e.g., `import { useData } from '@/context/DataContext'`).
- **Styling & UI Components:** Use Tailwind CSS for styling. Use existing UI components from `@/components/ui/` (like `Button`, `Input`, `ResponsiveDialog`, `PageHeader`) instead of re-creating raw HTML elements.
