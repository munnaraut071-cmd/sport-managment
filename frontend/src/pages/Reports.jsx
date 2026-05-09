import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FileText, Download, Calendar, Filter, BarChart3, PieChart, TrendingUp, Printer, FileSpreadsheet } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/use-toast';
import { analyticsAPI } from '@/services/api';

const Reports = () => {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState('30d');
  const [reportType, setReportType] = useState('all');
  const { toast } = useToast();

  useEffect(() => {
    fetchReports();
  }, [dateRange]);

  const fetchReports = async () => {
    try {
      setLoading(true);
      const response = await analyticsAPI.getReports({ dateRange });
      setReports(response.data.data || response.data || []);
    } catch (error) {
      console.error('Error fetching reports:', error);
      setReports([]);
      toast({ title: 'Failed to load reports', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateReport = async (type) => {
    try {
      toast({ title: `Generating ${type} report...` });
      const response = await analyticsAPI.generateReport({
        type,
        dateRange,
        title: `${type.charAt(0).toUpperCase() + type.slice(1)} Report`
      });
      if (response.data.success) {
        setReports([response.data.data, ...reports]);
        toast({ title: 'Report generated successfully!' });
      }
    } catch (error) {
      console.error('Error generating report:', error);
      toast({ title: 'Failed to generate report', variant: 'destructive' });
    }
  };

  const handleDownload = (report) => {
    toast({ title: `Downloading ${report.name}...` });
  };

  const handlePrint = (report) => {
    toast({ title: `Printing ${report.name}...` });
  };

  const filteredReports = reports.filter(r => 
    reportType === 'all' || r.type === reportType
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <FileText className="h-8 w-8 text-emerald-500" />
            Reports
          </h1>
          <p className="text-slate-500 mt-1">Generate and download system reports</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => handleGenerateReport('inventory')}>
            <BarChart3 className="h-4 w-4 mr-2" />
            Generate Inventory Report
          </Button>
          <Button variant="outline" onClick={() => handleGenerateReport('transactions')}>
            <TrendingUp className="h-4 w-4 mr-2" />
            Generate Transaction Report
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Reports', value: reports.length, icon: FileText },
          { label: 'This Month', value: reports.filter(r => new Date(r.date).getMonth() === new Date().getMonth()).length, icon: Calendar },
          { label: 'Inventory Reports', value: reports.filter(r => r.type === 'inventory').length, icon: BarChart3 },
          { label: 'Transaction Reports', value: reports.filter(r => r.type === 'transactions').length, icon: TrendingUp }
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

      {/* Filters */}
      <div className="flex gap-4">
        <Select value={dateRange} onValueChange={setDateRange}>
          <SelectTrigger className="w-[180px] bg-white dark:bg-[#111827] border-gray-200 dark:border-slate-800">
            <Calendar className="h-4 w-4 mr-2 text-slate-400" />
            <SelectValue placeholder="Date Range" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7d">Last 7 days</SelectItem>
            <SelectItem value="30d">Last 30 days</SelectItem>
            <SelectItem value="90d">Last 90 days</SelectItem>
            <SelectItem value="1y">Last year</SelectItem>
            <SelectItem value="all">All time</SelectItem>
          </SelectContent>
        </Select>
        <Select value={reportType} onValueChange={setReportType}>
          <SelectTrigger className="w-[180px] bg-white dark:bg-[#111827] border-gray-200 dark:border-slate-800">
            <Filter className="h-4 w-4 mr-2 text-slate-400" />
            <SelectValue placeholder="Report Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="inventory">Inventory</SelectItem>
            <SelectItem value="transactions">Transactions</SelectItem>
            <SelectItem value="users">Users</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Reports Table */}
      <Card className="bg-white dark:bg-[#111827] border-gray-200 dark:border-slate-800">
        <CardHeader>
          <CardTitle>Generated Reports</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-emerald-500" />
            </div>
          ) : filteredReports.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="h-16 w-16 mx-auto mb-4 text-slate-400" />
              <p className="text-slate-500">No reports found</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredReports.map((report, index) => (
                <motion.div
                  key={report._id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="flex items-center justify-between p-4 bg-gray-50 dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-700 hover:border-emerald-500/50 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="p-3 rounded-lg bg-emerald-100 dark:bg-emerald-500/10">
                      <FileText className="h-5 w-5 text-emerald-600 dark:text-emerald-500" />
                    </div>
                    <div>
                      <h3 className="font-semibold">{report.name}</h3>
                      <p className="text-sm text-slate-500">
                        {new Date(report.date).toLocaleDateString()} • Generated by {report.generatedBy}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400">
                      {report.status}
                    </Badge>
                    <Badge variant="outline" className="capitalize">
                      {report.type}
                    </Badge>
                    <Button variant="ghost" size="icon" onClick={() => handleDownload(report)}>
                      <Download className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => handlePrint(report)}>
                      <Printer className="h-4 w-4" />
                    </Button>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Export Options */}
      <Card className="bg-white dark:bg-[#111827] border-gray-200 dark:border-slate-800">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5 text-emerald-500" />
            Quick Export
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              { label: 'Export to Excel', icon: FileSpreadsheet, color: 'emerald' },
              { label: 'Export to PDF', icon: FileText, color: 'blue' },
              { label: 'Export to CSV', icon: Download, color: 'amber' }
            ].map((option, index) => (
              <motion.button
                key={option.label}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="flex items-center gap-3 p-4 bg-gray-50 dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-700 hover:border-emerald-500/50 transition-colors"
              >
                <div className={`p-3 rounded-lg bg-${option.color}-100 dark:bg-${option.color}-500/10`}>
                  <option.icon className={`h-5 w-5 text-${option.color}-600 dark:text-${option.color}-500`} />
                </div>
                <span className="font-medium">{option.label}</span>
              </motion.button>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Reports;
