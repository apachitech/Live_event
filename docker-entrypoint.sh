#!/bin/sh
set -e

echo "=== PulseStream Container Bootstrapping ==="
echo "PORT: ${PORT:-3000}"
echo "NODE_ENV: ${NODE_ENV:-production}"

# Detect if PostgreSQL DATABASE_URL is configured
if [ -n "$DATABASE_URL" ] && echo "$DATABASE_URL" | grep -qE '^postgres(ql)?://'; then
  echo "Detected PostgreSQL database connection."
  sed -i 's/provider = "sqlite"/provider = "postgresql"/g' prisma/schema.prisma
else
  echo "No PostgreSQL URL detected; using SQLite configuration."
  sed -i 's/provider = "postgresql"/provider = "sqlite"/g' prisma/schema.prisma
  if [ -z "$DATABASE_URL" ]; then
    export DATABASE_URL="file:/app/prisma/dev.db"
  fi
fi

# Regenerate Prisma Client to match the configured database provider
echo "Generating Prisma client..."
npx prisma generate

# Synchronize database schema automatically
echo "Synchronizing database schema..."
npx prisma db push --skip-generate || echo "Warning: prisma db push encountered an issue, proceeding..."

echo "Launching application server on port ${PORT:-3000}..."
exec node server.js
