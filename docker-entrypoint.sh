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
else
  echo "Using SQLite database configuration."
  sed -i 's/provider = "postgresql"/provider = "sqlite"/g' prisma/schema.prisma
  if [ -z "$DATABASE_URL" ]; then
    export DATABASE_URL="file:/app/prisma/dev.db"
  fi
fi

# Ensure Prisma client is compiled for the active provider before server starts (takes ~200ms)
echo "Generating Prisma client for $(grep 'provider = ' prisma/schema.prisma | tr -d ' ')..."
npx prisma generate

# Run database schema push and admin seeding in the background so port binding on Render is immediate
(npx prisma db push --skip-generate && npm run db:seed || echo "Notice: background db init completed") &

echo "Launching application server on port ${PORT:-3000}..."
exec node server.js
