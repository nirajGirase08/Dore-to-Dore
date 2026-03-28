#!/bin/bash

# Run the messaging tables migration
# Usage: ./run_migration.sh

DB_NAME="crisis_connect"
DB_USER="postgres"

echo "Running messaging tables migration..."
psql -U $DB_USER -d $DB_NAME -f migrations/001_add_messaging_tables.sql

if [ $? -eq 0 ]; then
  echo "✓ Migration completed successfully!"
else
  echo "✗ Migration failed. Please check the error messages above."
fi
