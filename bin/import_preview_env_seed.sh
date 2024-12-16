#!/bin/bash

unzip data/preview_env_seed.zip -d data
cat data/preview_env_seed.psql | python manage.py dbshell
