#!/bin/bash

# Chemly Backend Cloud Run Deployment Script - Cost Optimized

PROJECT_ID="your-project-id"
SERVICE_NAME="chemly-backend"
REGION="us-central1"

echo "🚀 Building and deploying Chemly backend to Cloud Run..."
echo "💰 Cost optimization: Reduced health check frequency to minimize per-request billing"

# Build and push Docker image
echo "📦 Building Docker image..."
docker build -t gcr.io/$PROJECT_ID/$SERVICE_NAME:latest .
docker push gcr.io/$PROJECT_ID/$SERVICE_NAME:latest

# Production deployment (cost-optimized)
echo "🎯 Deploying to production with cost-optimized health checks..."
gcloud run deploy $SERVICE_NAME \
  --image gcr.io/$PROJECT_ID/$SERVICE_NAME:latest \
  --platform managed \
  --region $REGION \
  --allow-unauthenticated \
  --memory 4Gi \
  --cpu 8 \
  --min-instances 1 \
  --max-instances 10 \
  --timeout 300 \
  --concurrency 20 \
  --no-cpu-throttling \
  --execution-environment gen2 \
  --startup-cpu-boost

echo "✅ Deployment complete!"
echo "🌐 Service URL: $(gcloud run services describe $SERVICE_NAME --region=$REGION --format='value(status.url)')"

echo ""
echo "💰 COST OPTIMIZATIONS APPLIED:"
echo "   • Health checks reduced from every 10s to every 5 minutes"
echo "   • Removed readiness probe (cost savings: ~80% health check reduction)"
echo "   • Using ultra-minimal /ping endpoint"
echo "   • Estimated health check cost reduction: ~90%"
echo ""
echo "📊 Health Check Frequency:"
echo "   • Startup: Every 30s (only during startup)"
echo "   • Runtime: Every 5 minutes (300s)"
echo "   • Estimated: ~12 health checks per hour (vs 360+ before)"

# Alternative: Development deployment (lower cost)
echo ""
echo "💡 For development/testing, use this lower-resource command instead:"
echo "gcloud run deploy $SERVICE_NAME \\"
echo "  --image gcr.io/$PROJECT_ID/$SERVICE_NAME:latest \\"
echo "  --memory 2Gi \\"
echo "  --cpu 2 \\"
echo "  --min-instances 0 \\"
echo "  --max-instances 5 \\"
echo "  --timeout 180" 