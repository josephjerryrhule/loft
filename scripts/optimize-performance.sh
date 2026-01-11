#!/bin/bash

# Performance Optimization Script
# Run this script to apply database indexes and verify performance improvements

echo "🚀 Starting performance optimization..."
echo ""

# Check if psql is available
if ! command -v psql &> /dev/null; then
    echo "❌ psql command not found. Please install PostgreSQL client tools."
    echo "   macOS: brew install postgresql"
    echo "   Ubuntu: sudo apt-get install postgresql-client"
    exit 1
fi

# Try to load from .env file if it exists
if [ -f .env ]; then
    echo "📁 Loading environment from .env file..."
    export $(grep -v '^#' .env | xargs)
fi

# Get database URL from environment
if [ -z "$DATABASE_URL" ]; then
    echo ""
    echo "❌ DATABASE_URL environment variable is not set"
    echo ""
    echo "Please create a .env file in the project root with your DATABASE_URL:"
    echo "   DATABASE_URL='postgresql://user:password@host:5432/database'"
    echo ""
    echo "Or export it in your shell:"
    echo "   export DATABASE_URL='postgresql://user:password@host:5432/database'"
    echo ""
    echo "You can find your database URL in your Supabase project settings:"
    echo "   1. Go to https://supabase.com/dashboard"
    echo "   2. Select your project"
    echo "   3. Go to Project Settings > Database"
    echo "   4. Copy the connection string under 'Connection string' (URI format)"
    echo ""
    exit 1
fi

echo "✅ Database URL found"
echo ""

# Apply indexes
echo "📊 Adding performance indexes to database..."
psql "$DATABASE_URL" -f scripts/add-performance-indexes.sql

if [ $? -eq 0 ]; then
    echo "✅ Indexes added successfully"
else
    echo "❌ Failed to add indexes"
    exit 1
fi

echo ""
echo "📈 Verifying indexes..."

# Verify indexes were created
psql "$DATABASE_URL" -c "
SELECT 
    schemaname,
    tablename,
    indexname,
    indexdef
FROM pg_indexes 
WHERE schemaname = 'public'
AND indexname LIKE 'idx_%'
ORDER BY tablename, indexname;
" -t

echo ""
echo "🎉 Performance optimization complete!"
echo ""
echo "Next steps:"
echo "1. Monitor query performance in your application logs"
echo "2. Use Vercel Analytics to track Core Web Vitals"
echo "3. Review PERFORMANCE_OPTIMIZATIONS.md for additional improvements"
echo "4. Run 'npm run build' to verify production bundle size"
echo ""
echo "Expected improvements:"
echo "- Faster user lookups (email queries)"
echo "- Improved dashboard loading times"
echo "- Quicker commission and order queries"
echo "- Faster flipbook library loading"
echo ""
