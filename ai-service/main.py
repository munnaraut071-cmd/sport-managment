"""
AI Microservice for Sports Kits Management System
FastAPI-based service for demand forecasting, late return prediction,
and kit recommendation using Prophet and Scikit-learn.
"""

from fastapi import FastAPI, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
import pandas as pd
import numpy as np
from datetime import datetime, timedelta
import joblib
import os
import json

# Prophet imports (optional - will use fallback if not available)
try:
    from prophet import Prophet
    PROPHET_AVAILABLE = True
except ImportError:
    PROPHET_AVAILABLE = False
    print("Warning: Prophet not available. Using fallback forecasting.")

# Scikit-learn imports
try:
    from sklearn.ensemble import RandomForestClassifier, GradientBoostingRegressor
    from sklearn.linear_model import LinearRegression
    from sklearn.model_selection import train_test_split
    from sklearn.preprocessing import StandardScaler
    from sklearn.metrics import mean_absolute_error, r2_score
    SKLEARN_AVAILABLE = True
except ImportError:
    SKLEARN_AVAILABLE = False
    print("Warning: Scikit-learn not available. Using statistical methods.")

app = FastAPI(
    title="Sports Kits AI Service",
    description="AI-powered forecasting and prediction service",
    version="1.0.0"
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Pydantic models
class TransactionData(BaseModel):
    kit_id: str
    kit_name: str
    category: str
    user_id: str
    issue_date: str
    return_date: Optional[str] = None
    due_date: str
    is_returned: bool
    is_overdue: bool
    quantity: int

class DemandForecastRequest(BaseModel):
    kit_id: str
    kit_name: str
    category: str
    historical_data: List[TransactionData]
    forecast_days: int = 30
    tournament_dates: Optional[List[str]] = None

class LateReturnPredictionRequest(BaseModel):
    user_id: str
    user_history: List[TransactionData]
    kit_category: str
    current_loans: int
    avg_return_days: float
    late_returns_count: int
    total_transactions: int

class RestockRecommendation(BaseModel):
    kit_id: str
    kit_name: str
    category: str
    current_stock: int
    available_stock: int
    avg_monthly_demand: float
    predicted_demand_30d: float
    predicted_demand_90d: float
    last_restock_date: Optional[str] = None

class KitPurchaseRecommendation(BaseModel):
    categories: List[str]
    budget: Optional[float] = None
    tournament_sports: Optional[List[str]] = None
    historical_usage: Dict[str, Any]

# AI Models storage (in-memory for demo, use Redis/DB in production)
ai_models = {}

# ============ Helper Functions ============

def calculate_demand_metrics(historical_data: List[TransactionData]) -> Dict[str, Any]:
    """Calculate demand metrics from historical data."""
    if not historical_data:
        return {
            "avg_daily_demand": 0,
            "avg_monthly_demand": 0,
            "peak_demand": 0,
            "trend": "stable"
        }
    
    # Group by month
    monthly_counts = {}
    for transaction in historical_data:
        month_key = transaction.issue_date[:7]  # YYYY-MM
        monthly_counts[month_key] = monthly_counts.get(month_key, 0) + transaction.quantity
    
    if not monthly_counts:
        return {"avg_daily_demand": 0, "avg_monthly_demand": 0, "peak_demand": 0, "trend": "stable"}
    
    demands = list(monthly_counts.values())
    
    return {
        "avg_daily_demand": sum(demands) / len(demands) / 30 if demands else 0,
        "avg_monthly_demand": sum(demands) / len(demands) if demands else 0,
        "peak_demand": max(demands) if demands else 0,
        "trend": "increasing" if len(demands) > 1 and demands[-1] > demands[0] else "stable"
    }

def simple_forecast(historical_data: List[TransactionData], days: int) -> List[Dict[str, Any]]:
    """Simple statistical forecasting when Prophet is not available."""
    if not historical_data:
        return []
    
    metrics = calculate_demand_metrics(historical_data)
    base_demand = metrics["avg_daily_demand"]
    
    # Add seasonality and trend
    forecast = []
    start_date = datetime.now()
    
    for i in range(days):
        date = start_date + timedelta(days=i)
        
        # Simple seasonality: higher on weekends
        seasonality = 1.2 if date.weekday() >= 5 else 1.0
        
        # Trend factor
        trend = 1 + (i * 0.001)  # 0.1% daily growth
        
        predicted = base_demand * seasonality * trend
        
        forecast.append({
            "date": date.strftime("%Y-%m-%d"),
            "predicted_demand": round(predicted, 2),
            "lower_bound": round(predicted * 0.8, 2),
            "upper_bound": round(predicted * 1.2, 2)
        })
    
    return forecast

def prophet_forecast(historical_data: List[TransactionData], days: int) -> List[Dict[str, Any]]:
    """Prophet-based forecasting."""
    if not PROPHET_AVAILABLE or len(historical_data) < 7:
        return simple_forecast(historical_data, days)
    
    # Prepare data for Prophet
    df_data = []
    for transaction in historical_data:
        df_data.append({
            'ds': transaction.issue_date,
            'y': transaction.quantity
        })
    
    df = pd.DataFrame(df_data)
    df['ds'] = pd.to_datetime(df['ds'])
    df = df.groupby('ds')['y'].sum().reset_index()
    
    if len(df) < 7:
        return simple_forecast(historical_data, days)
    
    # Fit Prophet model
    model = Prophet(
        yearly_seasonality=True,
        weekly_seasonality=True,
        daily_seasonality=False
    )
    
    try:
        model.fit(df)
        
        # Create future dataframe
        future = model.make_future_dataframe(periods=days)
        forecast = model.predict(future)
        
        # Get last 'days' predictions
        future_forecast = forecast.tail(days)
        
        return [
            {
                "date": row['ds'].strftime("%Y-%m-%d"),
                "predicted_demand": round(row['yhat'], 2),
                "lower_bound": round(row['yhat_lower'], 2),
                "upper_bound": round(row['yhat_upper'], 2)
            }
            for _, row in future_forecast.iterrows()
        ]
    except Exception as e:
        print(f"Prophet forecast error: {e}")
        return simple_forecast(historical_data, days)

def predict_late_return_probability(data: LateReturnPredictionRequest) -> Dict[str, Any]:
    """Predict probability of late return based on user history."""
    
    # Calculate risk factors
    risk_score = 0
    factors = []
    
    # Factor 1: Historical late return rate
    if data.total_transactions > 0:
        late_rate = data.late_returns_count / data.total_transactions
        risk_score += late_rate * 40  # 40% weight
        if late_rate > 0.3:
            factors.append("High historical late return rate")
    
    # Factor 2: Number of current loans
    if data.current_loans > 2:
        risk_score += min((data.current_loans - 2) * 10, 20)
        factors.append(f"Has {data.current_loans} active loans")
    
    # Factor 3: Average return time
    if data.avg_return_days > 7:
        risk_score += min((data.avg_return_days - 7) * 2, 15)
        factors.append("Tends to keep items longer than average")
    
    # Factor 4: Kit category risk (some categories have higher late rates)
    high_risk_categories = ['Cricket', 'Football']
    if data.kit_category in high_risk_categories:
        risk_score += 10
        factors.append(f"{data.kit_category} kits have higher late return rates")
    
    # Cap risk score at 100
    risk_score = min(risk_score, 100)
    
    # Determine risk level
    if risk_score >= 70:
        risk_level = "high"
        recommendation = "Require deposit or supervisor approval"
    elif risk_score >= 40:
        risk_level = "medium"
        recommendation = "Send reminder 2 days before due date"
    else:
        risk_level = "low"
        recommendation = "Standard loan process"
    
    return {
        "late_return_probability": round(risk_score / 100, 2),
        "risk_score": round(risk_score, 1),
        "risk_level": risk_level,
        "recommendation": recommendation,
        "factors": factors,
        "confidence": "high" if data.total_transactions > 10 else "medium"
    }

def generate_restock_recommendations(recommendations: List[RestockRecommendation]) -> List[Dict[str, Any]]:
    """Generate restock recommendations based on demand forecasting."""
    results = []
    
    for rec in recommendations:
        current_ratio = rec.available_stock / rec.current_stock if rec.current_stock > 0 else 0
        
        # Calculate days until stockout
        daily_demand = rec.predicted_demand_30d / 30
        days_until_stockout = rec.available_stock / daily_demand if daily_demand > 0 else float('inf')
        
        # Determine urgency
        if days_until_stockout < 7:
            urgency = "urgent"
            action = "Restock immediately"
            suggested_quantity = int(rec.predicted_demand_30d * 1.5)
        elif days_until_stockout < 14:
            urgency = "high"
            action = "Restock within 1 week"
            suggested_quantity = int(rec.predicted_demand_30d * 1.3)
        elif days_until_stockout < 30:
            urgency = "medium"
            action = "Plan restock soon"
            suggested_quantity = int(rec.predicted_demand_30d)
        else:
            urgency = "low"
            action = "No action needed"
            suggested_quantity = 0
        
        # Check for tournament demand spike
        if rec.predicted_demand_90d > rec.avg_monthly_demand * 4:
            urgency = "high"
            action = "Restock for upcoming tournament demand"
            suggested_quantity = int(rec.predicted_demand_90d * 0.5)
        
        results.append({
            "kit_id": rec.kit_id,
            "kit_name": rec.kit_name,
            "category": rec.category,
            "current_stock": rec.current_stock,
            "available_stock": rec.available_stock,
            "current_ratio": round(current_ratio * 100, 1),
            "days_until_stockout": round(days_until_stockout, 1) if days_until_stockout != float('inf') else "N/A",
            "urgency": urgency,
            "action": action,
            "suggested_quantity": suggested_quantity,
            "predicted_demand_30d": round(rec.predicted_demand_30d, 1),
            "predicted_demand_90d": round(rec.predicted_demand_90d, 1),
            "estimated_cost": suggested_quantity * 50  # Assume average $50 per kit
        })
    
    return sorted(results, key=lambda x: ["urgent", "high", "medium", "low"].index(x["urgency"]))

def recommend_kit_purchases(data: KitPurchaseRecommendation) -> List[Dict[str, Any]]:
    """Recommend which kits to purchase based on demand and budget."""
    recommendations = []
    
    for category in data.categories:
        # Get historical usage for this category
        category_usage = data.historical_usage.get(category, {})
        
        if not category_usage:
            continue
        
        monthly_usage = category_usage.get('monthly_usage', 0)
        peak_usage = category_usage.get('peak_usage', monthly_usage * 1.5)
        current_stock = category_usage.get('current_stock', 0)
        
        # Calculate gap
        optimal_stock = int(peak_usage * 1.2)  # 20% buffer
        gap = max(0, optimal_stock - current_stock)
        
        # Priority score based on usage frequency and gap
        priority_score = (monthly_usage / 100) * (gap / 10)
        
        recommendations.append({
            "category": category,
            "current_stock": current_stock,
            "optimal_stock": optimal_stock,
            "gap": gap,
            "monthly_usage": monthly_usage,
            "priority_score": round(priority_score, 2),
            "estimated_cost": gap * category_usage.get('avg_price', 50),
            "justification": f"High demand with {gap} units shortfall" if gap > 5 else f"Low stock for {category}"
        })
    
    # Sort by priority score
    recommendations.sort(key=lambda x: x['priority_score'], reverse=True)
    
    # Apply budget constraint if provided
    if data.budget:
        total_cost = sum(r['estimated_cost'] for r in recommendations if r['gap'] > 0)
        if total_cost > data.budget:
            # Scale down quantities proportionally
            scale_factor = data.budget / total_cost
            for rec in recommendations:
                if rec['gap'] > 0:
                    rec['gap'] = int(rec['gap'] * scale_factor)
                    rec['estimated_cost'] = rec['gap'] * 50
                    rec['justification'] += f" (Budget-adjusted)"
    
    return recommendations

# ============ API Endpoints ============

@app.get("/")
async def root():
    return {
        "message": "Sports Kits AI Service",
        "version": "1.0.0",
        "status": "running",
        "models": {
            "prophet": PROPHET_AVAILABLE,
            "sklearn": SKLEARN_AVAILABLE
        }
    }

@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "timestamp": datetime.now().isoformat(),
        "models_loaded": len(ai_models)
    }

@app.post("/forecast/demand")
async def forecast_demand(request: DemandForecastRequest):
    """Forecast demand for a specific kit."""
    try:
        # Use Prophet if available, otherwise use simple forecasting
        if PROPHET_AVAILABLE and len(request.historical_data) >= 7:
            forecast = prophet_forecast(request.historical_data, request.forecast_days)
        else:
            forecast = simple_forecast(request.historical_data, request.forecast_days)
        
        # Calculate summary metrics
        total_predicted = sum(day['predicted_demand'] for day in forecast)
        avg_daily = total_predicted / len(forecast) if forecast else 0
        
        # Check for tournament spikes
        tournament_impact = []
        if request.tournament_dates:
            for date in request.tournament_dates:
                # Find forecast for tournament date
                for day in forecast:
                    if day['date'] == date:
                        tournament_impact.append({
                            "date": date,
                            "predicted_demand": day['predicted_demand'],
                            "impact": "high" if day['predicted_demand'] > avg_daily * 2 else "medium"
                        })
        
        return {
            "kit_id": request.kit_id,
            "kit_name": request.kit_name,
            "forecast": forecast,
            "summary": {
                "total_predicted_demand": round(total_predicted, 2),
                "avg_daily_demand": round(avg_daily, 2),
                "peak_demand": max(day['predicted_demand'] for day in forecast) if forecast else 0,
                "confidence": "high" if len(request.historical_data) > 30 else "medium"
            },
            "tournament_impact": tournament_impact,
            "recommendation": "Increase stock" if avg_daily > 5 else "Maintain current stock",
            "model_used": "prophet" if PROPHET_AVAILABLE else "statistical"
        }
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Forecast error: {str(e)}")

@app.post("/predict/late-return")
async def predict_late_return(request: LateReturnPredictionRequest):
    """Predict probability of late return for a user."""
    try:
        prediction = predict_late_return_probability(request)
        return {
            "user_id": request.user_id,
            **prediction
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Prediction error: {str(e)}")

@app.post("/recommend/restock")
async def recommend_restock(recommendations: List[RestockRecommendation]):
    """Generate restock recommendations."""
    try:
        results = generate_restock_recommendations(recommendations)
        return {
            "recommendations": results,
            "total_suggested_purchase": sum(r['suggested_quantity'] for r in results),
            "total_estimated_cost": sum(r['estimated_cost'] for r in results),
            "urgent_count": len([r for r in results if r['urgency'] == 'urgent']),
            "high_priority_count": len([r for r in results if r['urgency'] == 'high'])
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Recommendation error: {str(e)}")

@app.post("/recommend/purchases")
async def recommend_purchases(request: KitPurchaseRecommendation):
    """Recommend kit purchases based on demand and budget."""
    try:
        recommendations = recommend_kit_purchases(request)
        return {
            "recommendations": recommendations,
            "total_categories": len(recommendations),
            "total_estimated_cost": sum(r['estimated_cost'] for r in recommendations),
            "high_priority_categories": [r['category'] for r in recommendations if r['priority_score'] > 5]
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Purchase recommendation error: {str(e)}")

@app.post("/analyze/usage-patterns")
async def analyze_usage_patterns(transactions: List[TransactionData]):
    """Analyze usage patterns and provide insights."""
    try:
        if not transactions:
            return {"error": "No transaction data provided"}
        
        # Category analysis
        category_stats = {}
        for t in transactions:
            cat = t.category
            if cat not in category_stats:
                category_stats[cat] = {'count': 0, 'total_quantity': 0, 'overdue_count': 0}
            category_stats[cat]['count'] += 1
            category_stats[cat]['total_quantity'] += t.quantity
            if t.is_overdue:
                category_stats[cat]['overdue_count'] += 1
        
        # Time-based analysis
        monthly_usage = {}
        for t in transactions:
            month = t.issue_date[:7]
            monthly_usage[month] = monthly_usage.get(month, 0) + t.quantity
        
        # Peak usage month
        peak_month = max(monthly_usage.items(), key=lambda x: x[1]) if monthly_usage else (None, 0)
        
        # Overdue analysis
        total_overdue = sum(1 for t in transactions if t.is_overdue)
        overdue_rate = total_overdue / len(transactions) if transactions else 0
        
        return {
            "total_transactions": len(transactions),
            "category_breakdown": category_stats,
            "monthly_trends": monthly_usage,
            "peak_month": {"month": peak_month[0], "usage": peak_month[1]},
            "overdue_statistics": {
                "total_overdue": total_overdue,
                "overdue_rate": round(overdue_rate * 100, 2),
                "category_with_highest_overdue": max(
                    category_stats.items(),
                    key=lambda x: x[1]['overdue_count'] / x[1]['count'] if x[1]['count'] > 0 else 0
                )[0] if category_stats else None
            },
            "insights": [
                f"{peak_month[0]} was the busiest month with {peak_month[1]} issues" if peak_month[0] else "No peak month data",
                f"{overdue_rate*100:.1f}% of transactions are overdue" if overdue_rate > 0 else "No overdue transactions",
                f"Most popular category: {max(category_stats.items(), key=lambda x: x[1]['count'])[0]}" if category_stats else "No category data"
            ]
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Analysis error: {str(e)}")

# ============ Background Tasks ============

def train_models_background():
    """Background task to train AI models periodically."""
    print("Training AI models...")
    # In production, this would fetch data from MongoDB and retrain models
    pass

@app.on_event("startup")
async def startup_event():
    """Initialize on startup."""
    print("AI Service starting up...")
    print(f"Prophet available: {PROPHET_AVAILABLE}")
    print(f"Scikit-learn available: {SKLEARN_AVAILABLE}")

# Run with: uvicorn main:app --reload --port 8000
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
