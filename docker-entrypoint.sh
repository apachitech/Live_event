#!/bin/sh
set -e
export NODE_ENV="production"
export NEXT_TELEMETRY_DISABLED=1

echo "=== PulseStream Container Bootstrapping ==="
echo "PORT: ${PORT:-3000}"
echo "NODE_ENV: $NODE_ENV"

# Detect if PostgreSQL DATABASE_URL is configured
if [ -n "$DATABASE_URL" ] && echo "$DATABASE_URL" | grep -qE '^postgres(ql)?://'; then
  echo "Detected PostgreSQL database connection."
  sed -i 's/provider = "sqlite"/provider = "postgresql"/g' prisma/schema.prisma
  (npx prisma generate && npx prisma db push --skip-generate || echo "Notice: background db push finished") &
else
  echo "No PostgreSQL URL detected; using SQLite configuration."
  sed -i 's/provider = "postgresql"/provider = "sqlite"/g' prisma/schema.prisma
  if [ -z "$DATABASE_URL" ]; then
    export DATABASE_URL="file:/app/prisma/dev.db"
  fi
  (npx prisma generate && npx prisma db push --skip-generate || echo "Notice: background db push finished") &
fi

echo "Launching application server on port ${PORT:-3000}..."
exec node server.js
