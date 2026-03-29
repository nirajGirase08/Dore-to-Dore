#!/bin/bash

# Run project database migrations
# Usage: ./run_migration.sh

DB_NAME="crisis_connect"
DB_USER="postgres"

echo "Running messaging tables migration..."
psql -U "$DB_USER" -d "$DB_NAME" -f migrations/001_add_messaging_tables.sql

if [ $? -ne 0 ]; then
  echo "✗ Messaging migration failed. Please check the error messages above."
  exit 1
fi

echo "Applying messaging compatibility migration..."
psql -U "$DB_USER" -d "$DB_NAME" -f migrations/003_messaging_compatibility.sql

if [ $? -ne 0 ]; then
  echo "✗ Messaging compatibility migration failed. Please check the error messages above."
  exit 1
fi

echo "Applying marketplace targeting migration..."
psql -U "$DB_USER" -d "$DB_NAME" -f migrations/004_marketplace_targeting.sql

if [ $? -ne 0 ]; then
  echo "✗ Marketplace targeting migration failed. Please check the error messages above."
  exit 1
fi

echo "Applying image upload support migration..."
psql -U "$DB_USER" -d "$DB_NAME" -f migrations/005_image_upload_support.sql

if [ $? -ne 0 ]; then
  echo "✗ Image upload migration failed. Please check the error messages above."
  exit 1
fi

echo "Applying assistance transaction migration..."
psql -U "$DB_USER" -d "$DB_NAME" -f migrations/006_assistance_transactions.sql

if [ $? -ne 0 ]; then
  echo "✗ Assistance transaction migration failed. Please check the error messages above."
  exit 1
fi

echo "Applying assistance feedback migration..."
psql -U "$DB_USER" -d "$DB_NAME" -f migrations/007_assistance_feedback.sql

if [ $? -ne 0 ]; then
  echo "✗ Assistance feedback migration failed. Please check the error messages above."
  exit 1
fi

echo "Applying rides support migration..."
psql -U "$DB_USER" -d "$DB_NAME" -f migrations/008_rides_support.sql

if [ $? -ne 0 ]; then
  echo "✗ Rides migration failed. Please check the error messages above."
  exit 1
fi

echo "Applying blockage schema updates..."
psql -U "$DB_USER" -d "$DB_NAME" <<'SQL'
ALTER TABLE blockages ADD COLUMN IF NOT EXISTS authority_notified BOOLEAN DEFAULT false;
ALTER TABLE blockages ADD COLUMN IF NOT EXISTS notified_at TIMESTAMP;
ALTER TABLE blockages ADD COLUMN IF NOT EXISTS expires_at TIMESTAMP;
ALTER TABLE blockages ADD COLUMN IF NOT EXISTS photo_url TEXT;
SQL

if [ $? -eq 0 ]; then
  echo "✓ Migrations completed successfully!"
else
  echo "✗ Blockage migration failed. Please check the error messages above."
  exit 1
fi
