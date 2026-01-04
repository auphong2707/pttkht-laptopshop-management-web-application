#!/bin/bash
set -e

echo "Waiting for PostgreSQL to be ready..."
until PGPASSWORD=$PGPASSWORD psql -h "$PGHOST" -U "$PGUSER" -d "$PGDATABASE" -c '\q' 2>/dev/null; do
  echo "PostgreSQL is unavailable - sleeping"
  sleep 2
done

echo "PostgreSQL is up - checking if tables exist..."

# Check if tables exist
TABLE_EXISTS=$(PGPASSWORD=$PGPASSWORD psql -h "$PGHOST" -U "$PGUSER" -d "$PGDATABASE" -tAc "SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'laptops');")

if [ "$TABLE_EXISTS" = "f" ]; then
  echo "Tables do not exist - initializing database..."
  
  # Generate sample data (this includes image generation)
  python commands/generate_sample_data.py
  
  # Create tables
  PGPASSWORD=$PGPASSWORD psql -h "$PGHOST" -U "$PGUSER" -d "$PGDATABASE" -f commands/create_table.sql
  
  # Insert sample data
  PGPASSWORD=$PGPASSWORD psql -h "$PGHOST" -U "$PGUSER" -d "$PGDATABASE" -f commands/insert_sample_data.sql
  
  # Ensure admin account exists
  python commands/ensure_admin.py
  
  # Setup pg_cron extension
  PGPASSWORD=$PGPASSWORD psql -h "$PGHOST" -U "$PGUSER" -d "$PGDATABASE" -c "DROP EXTENSION IF EXISTS pg_cron CASCADE;" || true
  PGPASSWORD=$PGPASSWORD psql -h "$PGHOST" -U "$PGUSER" -d "$PGDATABASE" -c "CREATE EXTENSION pg_cron;" || true
  
  echo "Database initialized successfully"
else
  echo "Tables already exist - skipping database initialization"
  
  # Check if images exist, generate if missing
  if [ ! -d "./static/laptop_images" ] || [ -z "$(ls -A ./static/laptop_images 2>/dev/null)" ] || [ ! -d "./static/post_images" ] || [ -z "$(ls -A ./static/post_images 2>/dev/null)" ]; then
    echo "Images not found or incomplete - generating images..."
    python commands/generate_images.py
    echo "Images generated successfully"
  else
    echo "Images already exist - skipping image generation"
  fi
  
  # Ensure admin account exists even if database was already initialized
  echo "Checking admin account..."
  python commands/ensure_admin.py
fi

echo "Waiting for Elasticsearch to be ready..."
until curl -sf "http://$ELASTICSEARCH_HOST:9200/_cluster/health" >/dev/null 2>&1; do
  echo "Elasticsearch is unavailable - sleeping"
  sleep 2
done

echo "Starting application..."
exec "$@"
