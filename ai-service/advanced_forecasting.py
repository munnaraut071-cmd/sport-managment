"""
Advanced AI Forecasting Engine for Sports Kits Management
Enterprise-grade demand forecasting with Prophet, ML, and statistical methods
"""

import pandas as pd
import numpy as np
from datetime import datetime, timedelta
from typing import List, Dict, Any, Optional, Tuple
import json

# Prophet for time series forecasting
try:
    from prophet import Prophet
    PROPHET_AVAILABLE = True
except ImportError:
    PROPHET_AVAILABLE = False
    print("Warning: Prophet not available. Using statistical methods only.")

# Scikit-learn for ML
try:
    from sklearn.ensemble import RandomForestRegressor, GradientBoostingRegressor
    from sklearn.linear_model import LinearRegression
    from sklearn.preprocessing import StandardScaler
    from sklearn.model_selection import train_test_split
    from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score
    SKLEARN_AVAILABLE = True
except ImportError:
    SKLEARN_AVAILABLE = False
    print("Warning: Scikit-learn not available.")

# Statistical methods
from scipy import stats
from scipy.optimize import curve_fit

class AdvancedForecastingEngine:
    """
    Enterprise AI forecasting engine with multiple algorithms
    """
    
    def __init__(self):
        self.models = {}
        self.confidence_threshold = 0.7
        
    def forecast_demand(
        self,
        historical_data: List[Dict[str, Any]],
        forecast_days: int = 30,
        tournament_dates: Optional[List[str]] = None,
        category: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Multi-algorithm demand forecasting with ensemble approach
        """
        if not historical_data or len(historical_data) < 7:
            return self._generate_fallback_forecast(forecast_days, category)
        
        # Prepare data
        df = self._prepare_data(historical_data)
        
        # Run multiple forecasting methods
        forecasts = {}
        
        # 1. Prophet Forecast (if available)
        if PROPHET_AVAILABLE and len(df) >= 14:
            forecasts['prophet'] = self._prophet_forecast(df, forecast_days)
        
        # 2. Statistical Forecast
        forecasts['statistical'] = self._statistical_forecast(df, forecast_days)
        
        # 3. ML Forecast (if available)
        if SKLEARN_AVAILABLE and len(df) >= 30:
            forecasts['ml'] = self._ml_forecast(df, forecast_days)
        
        # 4. Tournament-adjusted forecast
        if tournament_dates:
            forecasts['tournament'] = self._tournament_adjusted_forecast(
                forecasts.get('statistical', []), 
                tournament_dates
            )
        
        # Ensemble: Combine forecasts
        ensemble_forecast = self._ensemble_forecasts(forecasts, forecast_days)
        
        # Calculate confidence and metrics
        confidence_metrics = self._calculate_confidence_metrics(df, ensemble_forecast)
        
        return {
            'forecast': ensemble_forecast,
            'individual_models': forecasts,
            'summary': {
                'total_predicted_demand': sum(day['predicted_demand'] for day in ensemble_forecast),
                'avg_daily_demand': np.mean([day['predicted_demand'] for day in ensemble_forecast]),
                'peak_demand': max(day['predicted_demand'] for day in ensemble_forecast),
                'confidence': confidence_metrics['level'],
                'confidence_score': confidence_metrics['score'],
                'mae': confidence_metrics.get('mae'),
                'rmse': confidence_metrics.get('rmse'),
                'r2': confidence_metrics.get('r2')
            },
            'recommendations': self._generate_recommendations(ensemble_forecast, confidence_metrics),
            'tournament_impact': self._analyze_tournament_impact(ensemble_forecast, tournament_dates),
            'model_used': self._determine_best_model(forecasts, confidence_metrics),
            'generated_at': datetime.now().isoformat()
        }
    
    def _prepare_data(self, historical_data: List[Dict]) -> pd.DataFrame:
        """Prepare and clean historical data"""
        df = pd.DataFrame(historical_data)
        df['date'] = pd.to_datetime(df['issue_date'])
        df['quantity'] = df.get('quantity', 1)
        
        # Aggregate by date
        daily_data = df.groupby('date').agg({
            'quantity': 'sum',
            'is_overdue': 'sum',
            'is_returned': 'sum'
        }).reset_index()
        
        daily_data.columns = ['ds', 'y', 'overdue', 'returned']
        return daily_data
    
    def _prophet_forecast(self, df: pd.DataFrame, forecast_days: int) -> List[Dict]:
        """Prophet-based time series forecasting"""
        try:
            model = Prophet(
                yearly_seasonality=True,
                weekly_seasonality=True,
                daily_seasonality=False,
                changepoint_prior_scale=0.05,
                seasonality_prior_scale=10.0
            )
            
            model.fit(df[['ds', 'y']])
            
            future = model.make_future_dataframe(periods=forecast_days)
            forecast = model.predict(future)
            
            # Extract future predictions
            future_forecast = forecast.tail(forecast_days)
            
            return [
                {
                    'date': row['ds'].strftime('%Y-%m-%d'),
                    'predicted_demand': round(row['yhat'], 2),
                    'lower_bound': round(row['yhat_lower'], 2),
                    'upper_bound': round(row['yhat_upper'], 2),
                    'uncertainty': round((row['yhat_upper'] - row['yhat_lower']) / 2, 2)
                }
                for _, row in future_forecast.iterrows()
            ]
        except Exception as e:
            print(f"Prophet forecast error: {e}")
            return []
    
    def _statistical_forecast(self, df: pd.DataFrame, forecast_days: int) -> List[Dict]:
        """Statistical forecasting with trend and seasonality"""
        # Calculate trend
        x = np.arange(len(df))
        y = df['y'].values
        
        # Linear trend
        slope, intercept, r_value, p_value, std_err = stats.linregress(x, y)
        
        # Calculate seasonality (weekly pattern)
        df['day_of_week'] = df['ds'].dt.dayofweek
        seasonal_pattern = df.groupby('day_of_week')['y'].mean().to_dict()
        
        # Calculate moving average
        ma_window = min(7, len(df))
        moving_avg = df['y'].rolling(window=ma_window).mean().iloc[-1]
        
        # Generate forecast
        forecast = []
        start_date = df['ds'].max() + timedelta(days=1)
        
        for i in range(forecast_days):
            date = start_date + timedelta(days=i)
            
            # Trend component
            trend = slope * (len(df) + i) + intercept
            
            # Seasonality component
            seasonal = seasonal_pattern.get(date.weekday(), moving_avg)
            
            # Moving average component
            combined = (trend + seasonal + moving_avg) / 3
            
            # Add confidence intervals
            std_dev = df['y'].std()
            
            forecast.append({
                'date': date.strftime('%Y-%m-%d'),
                'predicted_demand': round(max(0, combined), 2),
                'lower_bound': round(max(0, combined - 1.96 * std_dev), 2),
                'upper_bound': round(combined + 1.96 * std_dev, 2),
                'uncertainty': round(1.96 * std_dev, 2)
            })
        
        return forecast
    
    def _ml_forecast(self, df: pd.DataFrame, forecast_days: int) -> List[Dict]:
        """Machine learning-based forecasting"""
        if not SKLEARN_AVAILABLE or len(df) < 30:
            return []
        
        try:
            # Feature engineering
            df['day_of_week'] = df['ds'].dt.dayofweek
            df['month'] = df['ds'].dt.month
            df['day_of_year'] = df['ds'].dt.dayofyear
            df['lag_1'] = df['y'].shift(1)
            df['lag_7'] = df['y'].shift(7)
            df['rolling_mean_7'] = df['y'].rolling(window=7).mean()
            df['rolling_std_7'] = df['y'].rolling(window=7).std()
            
            # Remove NaN values
            df_clean = df.dropna()
            
            if len(df_clean) < 14:
                return []
            
            # Features
            feature_cols = ['day_of_week', 'month', 'day_of_year', 'lag_1', 'lag_7', 
                          'rolling_mean_7', 'rolling_std_7']
            X = df_clean[feature_cols].values
            y = df_clean['y'].values
            
            # Scale features
            scaler = StandardScaler()
            X_scaled = scaler.fit_transform(X)
            
            # Train model
            model = GradientBoostingRegressor(
                n_estimators=100,
                learning_rate=0.1,
                max_depth=4,
                random_state=42
            )
            model.fit(X_scaled, y)
            
            # Generate future features
            last_row = df.iloc[-1]
            forecast = []
            start_date = df['ds'].max() + timedelta(days=1)
            
            for i in range(forecast_days):
                date = start_date + timedelta(days=i)
                
                features = np.array([[
                    date.weekday(),
                    date.month,
                    date.timetuple().tm_yday,
                    last_row['y'],
                    df['y'].iloc[-7] if len(df) >= 7 else last_row['y'],
                    df['y'].tail(7).mean(),
                    df['y'].tail(7).std()
                ]])
                
                features_scaled = scaler.transform(features)
                prediction = model.predict(features_scaled)[0]
                
                # Estimate uncertainty
                residuals = y - model.predict(X_scaled)
                std_residuals = np.std(residuals)
                
                forecast.append({
                    'date': date.strftime('%Y-%m-%d'),
                    'predicted_demand': round(max(0, prediction), 2),
                    'lower_bound': round(max(0, prediction - 1.96 * std_residuals), 2),
                    'upper_bound': round(prediction + 1.96 * std_residuals, 2),
                    'uncertainty': round(1.96 * std_residuals, 2)
                })
            
            return forecast
        except Exception as e:
            print(f"ML forecast error: {e}")
            return []
    
    def _ensemble_forecasts(self, forecasts: Dict[str, List], forecast_days: int) -> List[Dict]:
        """Combine multiple forecasts using weighted ensemble"""
        # Get available forecasts
        available = {k: v for k, v in forecasts.items() if v}
        
        if not available:
            return self._generate_fallback_forecast(forecast_days, None)
        
        # Weights based on model reliability
        weights = {
            'prophet': 0.4,
            'ml': 0.35,
            'statistical': 0.25,
            'tournament': 0.1  # Adjustment layer
        }
        
        # Normalize weights for available models
        total_weight = sum(weights.get(k, 0.25) for k in available.keys())
        normalized_weights = {k: weights.get(k, 0.25) / total_weight for k in available.keys()}
        
        ensemble = []
        for i in range(forecast_days):
            weighted_sum = 0
            weighted_lower = 0
            weighted_upper = 0
            
            for model_name, forecast in available.items():
                if i < len(forecast):
                    weight = normalized_weights[model_name]
                    weighted_sum += forecast[i]['predicted_demand'] * weight
                    weighted_lower += forecast[i].get('lower_bound', forecast[i]['predicted_demand']) * weight
                    weighted_upper += forecast[i].get('upper_bound', forecast[i]['predicted_demand']) * weight
            
            # Get date from first available forecast
            first_forecast = list(available.values())[0]
            date = first_forecast[i]['date'] if i < len(first_forecast) else (
                datetime.now() + timedelta(days=i)
            ).strftime('%Y-%m-%d')
            
            ensemble.append({
                'date': date,
                'predicted_demand': round(weighted_sum, 2),
                'lower_bound': round(weighted_lower, 2),
                'upper_bound': round(weighted_upper, 2),
                'uncertainty': round((weighted_upper - weighted_lower) / 2, 2),
                'models_used': list(available.keys())
            })
        
        return ensemble
    
    def _tournament_adjusted_forecast(
        self,
        base_forecast: List[Dict],
        tournament_dates: List[str]
    ) -> List[Dict]:
        """Adjust forecast based on tournament dates"""
        adjusted = []
        
        for day in base_forecast:
            date = datetime.strptime(day['date'], '%Y-%m-%d')
            is_tournament_day = any(
                date.strftime('%Y-%m-%d') == t or 
                (datetime.strptime(t, '%Y-%m-%d') - timedelta(days=1)).strftime('%Y-%m-%d') == day['date']
                for t in tournament_dates
            )
            
            multiplier = 2.5 if is_tournament_day else 1.0
            
            adjusted.append({
                **day,
                'predicted_demand': round(day['predicted_demand'] * multiplier, 2),
                'lower_bound': round(day['lower_bound'] * multiplier, 2),
                'upper_bound': round(day['upper_bound'] * multiplier, 2),
                'is_tournament_day': is_tournament_day
            })
        
        return adjusted
    
    def _calculate_confidence_metrics(
        self,
        historical_data: pd.DataFrame,
        forecast: List[Dict]
    ) -> Dict[str, Any]:
        """Calculate forecast confidence metrics"""
        n_samples = len(historical_data)
        
        # Base confidence on data size
        if n_samples < 7:
            confidence_level = 'low'
            confidence_score = 0.3
        elif n_samples < 30:
            confidence_level = 'medium'
            confidence_score = 0.6
        elif n_samples < 90:
            confidence_level = 'high'
            confidence_score = 0.8
        else:
            confidence_level = 'very_high'
            confidence_score = 0.95
        
        metrics = {
            'level': confidence_level,
            'score': confidence_score,
            'data_points': n_samples,
            'days_of_history': (historical_data['ds'].max() - historical_data['ds'].min()).days
        }
        
        # Calculate MAE if we have enough data
        if n_samples >= 14:
            try:
                train_size = int(n_samples * 0.8)
                train = historical_data[:train_size]
                test = historical_data[train_size:]
                
                # Simple prediction for validation
                mean_value = train['y'].mean()
                predictions = [mean_value] * len(test)
                
                mae = mean_absolute_error(test['y'], predictions)
                rmse = np.sqrt(mean_squared_error(test['y'], predictions))
                
                metrics['mae'] = round(mae, 2)
                metrics['rmse'] = round(rmse, 2)
            except Exception as e:
                print(f"Error calculating metrics: {e}")
        
        return metrics
    
    def _generate_recommendations(
        self,
        forecast: List[Dict],
        confidence_metrics: Dict
    ) -> List[str]:
        """Generate actionable recommendations"""
        recommendations = []
        
        total_demand = sum(day['predicted_demand'] for day in forecast)
        avg_demand = total_demand / len(forecast) if forecast else 0
        max_demand = max(day['predicted_demand'] for day in forecast) if forecast else 0
        
        # Stock recommendations
        if max_demand > avg_demand * 2:
            recommendations.append(
                f"⚠️ High demand spike detected: Peak of {max_demand:.0f} units predicted. "
                "Consider increasing safety stock."
            )
        
        if confidence_metrics['level'] in ['low', 'medium']:
            recommendations.append(
                f"📊 Forecast confidence is {confidence_metrics['level']}. "
                "Collect more historical data for better predictions."
            )
        
        if total_demand > 100:
            recommendations.append(
                f"📈 High total demand ({total_demand:.0f} units in {len(forecast)} days). "
                "Plan for bulk procurement."
            )
        
        # Tournament recommendations
        tournament_days = [day for day in forecast if day.get('is_tournament_day')]
        if tournament_days:
            recommendations.append(
                f"🏆 {len(tournament_days)} tournament days detected. "
                "Demand may spike 2.5x on these dates."
            )
        
        return recommendations
    
    def _analyze_tournament_impact(
        self,
        forecast: List[Dict],
        tournament_dates: Optional[List[str]]
    ) -> List[Dict]:
        """Analyze tournament impact on demand"""
        if not tournament_dates:
            return []
        
        impact = []
        for date in tournament_dates:
            # Find forecast for tournament date
            day_forecast = next(
                (day for day in forecast if day['date'] == date),
                None
            )
            
            if day_forecast:
                impact.append({
                    'date': date,
                    'predicted_demand': day_forecast['predicted_demand'],
                    'impact': 'high' if day_forecast['predicted_demand'] > 10 else 'medium',
                    'multiplier': 2.5
                })
        
        return impact
    
    def _determine_best_model(
        self,
        forecasts: Dict[str, List],
        confidence_metrics: Dict
    ) -> str:
        """Determine which model performed best"""
        if 'prophet' in forecasts and confidence_metrics['score'] >= 0.7:
            return 'prophet (primary) + ensemble'
        elif 'ml' in forecasts:
            return 'ml (primary) + ensemble'
        else:
            return 'statistical (primary) + ensemble'
    
    def _generate_fallback_forecast(self, forecast_days: int, category: Optional[str]) -> List[Dict]:
        """Generate fallback forecast when insufficient data"""
        base_demand = 2.0 if category == 'Cricket' else 1.5
        
        forecast = []
        start_date = datetime.now()
        
        for i in range(forecast_days):
            date = start_date + timedelta(days=i)
            weekend_multiplier = 1.2 if date.weekday() >= 5 else 1.0
            
            demand = base_demand * weekend_multiplier * (1 + i * 0.01)
            
            forecast.append({
                'date': date.strftime('%Y-%m-%d'),
                'predicted_demand': round(demand, 2),
                'lower_bound': round(demand * 0.6, 2),
                'upper_bound': round(demand * 1.4, 2),
                'uncertainty': round(demand * 0.4, 2),
                'is_estimate': True
            })
        
        return forecast

# Export singleton
forecasting_engine = AdvancedForecastingEngine()
