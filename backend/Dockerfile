FROM python:3.14-slim-trixie AS builder

ENV POETRY_VIRTUALENVS_CREATE=false \
    POETRY_NO_INTERACTION=1

RUN pip install --no-cache-dir poetry

WORKDIR /app/src

COPY pyproject.toml poetry.lock ./

RUN poetry install --only main --no-root

COPY . .

CMD ["python", "-m", "backend"]

HEALTHCHECK --interval=10s --timeout=3s --start-period=15s --retries=5 CMD python -c "import os, urllib.request; urllib.request.urlopen(f\"http://127.0.0.1:{os.environ.get('BACKEND_PORT', '3000')}/api/health\")"

# Development build: includes dev dependencies
FROM builder AS dev

RUN poetry install --with dev
