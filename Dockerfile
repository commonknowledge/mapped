FROM python:3.12.3
ENV INSIDE_DOCKER=1 \
    PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PIP_NO_CACHE_DIR=off \
    PIP_DISABLE_PIP_VERSION_CHECK=on \
    PIP_DEFAULT_TIMEOUT=100 \
    POETRY_VERSION=1.8.1 \
    POETRY_VIRTUALENVS_CREATE=true \
    POETRY_VIRTUALENVS_IN_PROJECT=true \
    PYSETUP_PATH="/opt/pysetup" \
    SHELL=/bin/bash
RUN apt-get update && apt-get install -y \
    binutils gdal-bin libproj-dev git npm python3-dev \
    && rm -rf /var/lib/apt/lists/*
RUN curl -sSL https://install.python-poetry.org | python -
ENV PATH="/root/.local/bin:$PATH"
WORKDIR $PYSETUP_PATH
COPY poetry.lock pyproject.toml ./
# Not needed (mapping handled by docker-compose)
# WORKDIR /app
# COPY . .
#RUN ./manage.py collectstatic --no-input
RUN echo "source .venv/bin/activate" >> "/root/.bashrc"