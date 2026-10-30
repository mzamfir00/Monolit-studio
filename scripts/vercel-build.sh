#!/bin/sh
# Vercel build: bring the database schema up to date, load the starter catalogue into an empty database,
# then build. Without a database (the very first import, before Neon is connected) only the build runs.
set -e
if [ -n "$DATABASE_URL" ]; then
  npx prisma migrate deploy
  npx tsx prisma/seed.ts --if-empty
else
  echo "DATABASE_URL is not set: skipping migrations and seed. Connect a database, then redeploy."
fi
npx next build
