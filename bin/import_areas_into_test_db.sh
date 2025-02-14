#!/bin/bash

if [ "$ENVIRONMENT" != "production" ]; then
    unzip -o data/areas_minimal.psql.zip -d data
    AREA_COUNT=$(PGPASSWORD=password psql -U postgres -h db test_postgres -t -A -c "SELECT COUNT(*) FROM hub_area" || echo 0)
    if [ "$AREA_COUNT" -lt 10000 ]; then
        PGPASSWORD=password psql -U postgres -h db test_postgres < data/areas_minimal.psql > /dev/null 2>&1
    fi
else
    echo "This command cannot run in production environments."
fi