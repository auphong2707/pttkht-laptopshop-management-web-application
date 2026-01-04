#!/bin/bash
set -e

python backend/commands/generate_sample_data.py

# Reset Postgres database
PGPASSWORD=postgres psql -h db -U postgres -d postgres -f backend/commands/clear_database.sql
PGPASSWORD=postgres psql -h db -U postgres -d postgres -f backend/commands/create_table.sql
PGPASSWORD=postgres psql -h db -U postgres -d postgres -f backend/commands/insert_sample_data.sql

# Reset Elasticsearch index
curl -X DELETE "http://elasticsearch:9200/_all"

# Ensure pg_cron is set up correctly
PGPASSWORD=postgres psql -h db -U postgres -d postgres -c "DROP EXTENSION IF EXISTS pg_cron CASCADE;"
PGPASSWORD=postgres psql -h db -U postgres -d postgres -c "CREATE EXTENSION pg_cron;"