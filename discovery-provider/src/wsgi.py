# exposes flask create_app() function as gunicorn entrypoint

from src import create_app

app = create_app()
