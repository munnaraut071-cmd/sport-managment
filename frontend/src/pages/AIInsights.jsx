import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Sparkles, TrendingUp, AlertTriangle, RefreshCw, Brain, Lightbulb, Target, CheckCircle, X } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/use-toast';
import { aiAPI } from '@/services/api';

const AIInsights = () => {
  const [insights, setInsights] = useState([]);
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchAIInsights();
  }, []);

  const fetchAIInsights = async () => {
    try {
      setLoading(true);
      
      // Fetch real AI data from backend
      const [insightsRes, recommendationsRes] = await Promise.all([
        aiAPI.getInsights(),
        aiAPI.getRecommendations()
      ]);
      
      setInsights(insightsRes.data.data || insightsRes.data || []);
      setRecommendations(recommendationsRes.data.data || recommendationsRes.data || []);
    } catch (error) {
      console.error('Error fetching AI insights:', error);
      // Fallback to empty arrays if API fails
      setInsights([]);
      setRecommendations([]);
      toast({ title: 'Failed to load AI insights', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = () => {
    fetchAIInsights();
    toast({ title: 'AI insights refreshed' });
  };

  const handleDismiss = (id) => {
    setInsights(insights.filter(i => i._id !== id));
  };

  const getImpactColor = (impact) => {
    switch (impact) {
      case 'critical': return 'bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400';
      case 'high': return 'bg-orange-100 text-orange-700 dark:bg-orange-500/20 dark:text-orange-400';
      case 'medium': return 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400';
      case 'low': return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400';
      default: return '';
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400';
      case 'medium': return 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400';
      case 'low': return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400';
      default: return '';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Sparkles className="h-8 w-8 text-emerald-500" />
            AI Insights
          </h1>
          <p className="text-slate-500 mt-1">AI-powered predictions and recommendations</p>
        </div>
        <Button variant="outline" onClick={handleRefresh}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { label: 'Active Insights', value: insights.length, icon: Sparkles },
          { label: 'Recommendations', value: recommendations.length, icon: Lightbulb },
          { label: 'High Confidence', value: insights.filter(i => i.confidence >= 80).length, icon: Target },
          { label: 'Actionable Items', value: insights.filter(i => i.actionable).length, icon: CheckCircle }
        ].map((stat, index) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card className="bg-white dark:bg-[#111827] border-gray-200 dark:border-slate-800">
              <CardContent className="p-6 flex items-center gap-4">
                <div className="p-3 rounded-lg bg-emerald-100 dark:bg-emerald-500/10">
                  <stat.icon className="h-6 w-6 text-emerald-600 dark:text-emerald-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stat.value}</p>
                  <p className="text-xs text-slate-500">{stat.label}</p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* AI Insights */}
      <Card className="bg-white dark:bg-[#111827] border-gray-200 dark:border-slate-800">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-emerald-500" />
            AI-Generated Insights
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-emerald-500" />
            </div>
          ) : insights.length === 0 ? (
            <div className="text-center py-12">
              <Sparkles className="h-16 w-16 mx-auto mb-4 text-slate-400" />
              <p className="text-slate-500">No AI insights available</p>
            </div>
          ) : (
            <div className="space-y-4">
              {insights.map((insight, index) => (
                <motion.div
                  key={insight._id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="p-4 bg-gradient-to-r from-gray-50 to-white dark:from-slate-800 dark:to-slate-900 rounded-lg border border-gray-200 dark:border-slate-700 hover:border-emerald-500/50 transition-colors"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${
                        insight.type === 'demand' ? 'bg-blue-100 dark:bg-blue-500/20' :
                        insight.type === 'risk' ? 'bg-red-100 dark:bg-red-500/20' :
                        insight.type === 'pattern' ? 'bg-purple-100 dark:bg-purple-500/20' :
                        'bg-emerald-100 dark:bg-emerald-500/20'
                      }`}>
                        {insight.type === 'demand' && <TrendingUp className="h-4 w-4 text-blue-600 dark:text-blue-400" />}
                        {insight.type === 'risk' && <AlertTriangle className="h-4 w-4 text-red-600 dark:text-red-400" />}
                        {insight.type === 'pattern' && <Brain className="h-4 w-4 text-purple-600 dark:text-purple-400" />}
                        {insight.type === 'prediction' && <Sparkles className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />}
                      </div>
                      <div>
                        <h3 className="font-semibold">{insight.title}</h3>
                        <p className="text-sm text-slate-500 mt-1">{insight.description}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className={getImpactColor(insight.impact)}>
                        {insight.impact}
                      </Badge>
                      <Badge variant="outline" className="capitalize">
                        {insight.type}
                      </Badge>
                      <Button variant="ghost" size="icon" onClick={() => handleDismiss(insight._id)}>
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 text-sm">
                    <span className="text-slate-500">Confidence: <span className="font-semibold">{insight.confidence}%</span></span>
                    {insight.actionable && (
                      <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400">
                        Actionable
                      </Badge>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recommendations */}
      <Card className="bg-white dark:bg-[#111827] border-gray-200 dark:border-slate-800">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lightbulb className="h-5 w-5 text-emerald-500" />
            AI Recommendations
          </CardTitle>
        </CardHeader>
        <CardContent>
          {recommendations.length === 0 ? (
            <div className="text-center py-12">
              <Lightbulb className="h-16 w-16 mx-auto mb-4 text-slate-400" />
              <p className="text-slate-500">No recommendations available</p>
            </div>
          ) : (
            <div className="space-y-4">
              {recommendations.map((rec, index) => (
                <motion.div
                  key={rec._id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="p-4 bg-gradient-to-r from-emerald-50 to-white dark:from-emerald-500/10 dark:to-slate-900 rounded-lg border border-emerald-200 dark:border-emerald-500/30 hover:border-emerald-500/50 transition-colors"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-emerald-100 dark:bg-emerald-500/20">
                        <Lightbulb className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                      </div>
                      <div>
                        <h3 className="font-semibold">{rec.title}</h3>
                        <p className="text-sm text-slate-500 mt-1">{rec.description}</p>
                      </div>
                    </div>
                    <Badge className={getPriorityColor(rec.priority)}>
                      {rec.priority} priority
                    </Badge>
                  </div>
                  <div className="flex items-center gap-4 text-sm">
                    <span className="text-slate-500">Cost: <span className="font-semibold">{rec.estimatedCost}</span></span>
                    <span className="text-slate-500">Benefit: <span className="font-semibold text-emerald-600 dark:text-emerald-400">{rec.expectedBenefit}</span></span>
                  </div>
                  <Button className="mt-3 bg-emerald-500 hover:bg-emerald-600" size="sm">
                    Implement
                  </Button>
                </motion.div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AIInsights;
