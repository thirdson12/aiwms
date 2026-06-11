#!/usr/bin/env sh
set -e

if [ -z "$DATABASE_URL" ]; then
  echo "ERROR: DATABASE_URL is not set"
  exit 1
fi

# Render Postgres requires SSL for reliable Prisma connections
case "$DATABASE_URL" in
  *sslmode=* ) ;;
  *\?* ) export DATABASE_URL="${DATABASE_URL}&sslmode=require" ;;
  * ) export DATABASE_URL="${DATABASE_URL}?sslmode=require" ;;
esac

echo "DATABASE host: $(node -e "try { console.log(new URL(process.env.DATABASE_URL).hostname) } catch { console.log('invalid') }")"

attempt=1
max=30
until pnpm db:migrate:deploy; do
  if [ "$attempt" -ge "$max" ]; then
    echo "ERROR: Database not reachable after ${max} attempts (P1001)."
    echo "Check: API and PostgreSQL must be in the SAME Render region,"
    echo "or set DATABASE_URL to the External Database URL from Render dashboard."
    exit 1
  fi
  echo "Database not ready (attempt ${attempt}/${max}), retrying in 5s..."
  attempt=$((attempt + 1))
  sleep 5
done

pnpm db:seed
exec node apps/api/dist/main.js
