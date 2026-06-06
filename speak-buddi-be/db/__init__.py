# speak-buddi-be/db/__init__.py
# Gói DB — expose get_db() dependency cho FastAPI routes.
from .connection import get_db, engine  # noqa: F401
