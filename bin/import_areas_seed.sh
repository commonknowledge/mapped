#!/bin/bash

if [ "$ENVIRONMENT" != "production" ]; then
    unzip -o data/areas.psql.zip -d data
    PGPASSWORD=password psql -U postgres -h db test_local-intelligence < data/areas.psql
else
    echo "This command cannot run in production environments."
fi
