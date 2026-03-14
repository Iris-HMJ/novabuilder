#!/bin/bash

# NovaBuilder Database Backup Script
# Usage: ./backup.sh [backup_name]
#
# This script creates a backup of the NovaBuilder PostgreSQL database.
# It saves backups to the ./backups directory with timestamp.

set -e

# Configuration
BACKUP_DIR="$(dirname "$0")/backups"
DB_NAME="${DB_NAME:-novabuilder}"
DB_USER="${DB_USER:-postgres}"
DB_HOST="${DB_HOST:-localhost}"
DB_PORT="${DB_PORT:-5432}"

# Create backup directory if it doesn't exist
mkdir -p "$BACKUP_DIR"

# Generate backup filename
if [ -n "$1" ]; then
    BACKUP_NAME="$1"
else
    BACKUP_NAME="novabuilder_backup_$(date +%Y%m%d_%H%M%S)"
fi

BACKUP_FILE="$BACKUP_DIR/${BACKUP_NAME}.sql.gz"

echo "=========================================="
echo "NovaBuilder Database Backup"
echo "=========================================="
echo "Database: $DB_NAME"
echo "Host: $DB_HOST:$DB_PORT"
echo "User: $DB_USER"
echo "Output: $BACKUP_FILE"
echo "=========================================="

# Check if docker is available for remote backup
if command -v docker &> /dev/null && docker ps --format '{{.Names}}' | grep -q "postgres"; then
    echo "Using Docker PostgreSQL container..."
    docker exec novabuilder-postgres pg_dump -U "$DB_USER" "$DB_NAME" | gzip > "$BACKUP_FILE"
else
    # Use local pg_dump
    if command -v pg_dump &> /dev/null; then
        PGPASSWORD="$DB_PASSWORD" pg_dump -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" "$DB_NAME" | gzip > "$BACKUP_FILE"
    else
        echo "Error: pg_dump not found and Docker PostgreSQL container not available."
        echo "Please install PostgreSQL client or ensure Docker is running."
        exit 1
    fi
fi

# Check if backup was successful
if [ -f "$BACKUP_FILE" ] && [ -s "$BACKUP_FILE" ]; then
    FILE_SIZE=$(du -h "$BACKUP_FILE" | cut -f1)
    echo "=========================================="
    echo "Backup completed successfully!"
    echo "File: $BACKUP_FILE"
    echo "Size: $FILE_SIZE"
    echo "=========================================="

    # Keep only last 7 backups
    cd "$BACKUP_DIR"
    ls -t novabuilder_backup_*.sql.gz 2>/dev/null | tail -n +8 | xargs -r rm -f
    echo "Old backups cleaned up (keeping last 7)"
else
    echo "Error: Backup failed!"
    exit 1
fi
