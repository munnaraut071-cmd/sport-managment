import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar as CalendarIcon, Clock, Package, User, ChevronLeft, ChevronRight, Filter, AlertCircle, CheckCircle, Sparkles, Plus, CalendarDays } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { transactionsAPI, reservationsAPI } from '@/services/api';

const Calendar = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDay, setSelectedDay] = useState(new Date().getDate());
  const [showOverdueOnly, setShowOverdueOnly] = useState(false);

  useEffect(() => {
    fetchEvents();
  }, [currentDate]);

  const fetchEvents = async () => {
    try {
      setLoading(true);
      const [transactionsRes, reservationsRes] = await Promise.allSettled([
        transactionsAPI.getAll(),
        reservationsAPI.getAll()
      ]);

      let transactionEvents = [];
      if (transactionsRes.status === 'fulfilled') {
        const tData = transactionsRes.value.data?.data || transactionsRes.value.data || [];
        transactionEvents = tData.map(t => {
          const dueDate = new Date(t.dueDate || t.expectedReturnDate);
          const isOverdue = !t.returnDate && dueDate < new Date() && dueDate.getTime() > 0;
          
          return {
            id: t._id || t.id || Math.random().toString(),
            title: t.kit?.name || t.kitName || 'Equipment',
            userName: t.user?.name || t.userName || t.issuedTo || 'Student',
            date: dueDate,
            type: t.returnDate ? 'returned' : 'due',
            status: t.status,
            quantity: t.quantity || 1,
            isOverdue: isOverdue
          };
        });
      }

      let reservationEvents = [];
      if (reservationsRes.status === 'fulfilled') {
        const rData = reservationsRes.value.data?.data || reservationsRes.value.data?.reservations || [];
        reservationEvents = rData.map(r => ({
          id: r._id || r.id || Math.random().toString(),
          title: `Reserved: ${r.kit?.name || 'Equipment'}`,
          userName: r.user?.name || 'Student',
          date: new Date(r.startDate),
          endDate: new Date(r.endDate),
          type: 'reservation',
          status: r.status,
          quantity: r.quantity || 1,
          isOverdue: false
        }));
      }

      setEvents([...transactionEvents, ...reservationEvents]);
    } catch (error) {
      console.error('Error fetching calendar events:', error);
    } finally {
      setLoading(false);
    }
  };

  const getDaysInMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDay = firstDay.getDay();

    return { daysInMonth, startingDay };
  };

  const getEventsForDate = (day) => {
    const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
    return events.filter(event => {
      const eventDate = new Date(event.date);
      return eventDate.getDate() === date.getDate() &&
             eventDate.getMonth() === date.getMonth() &&
             eventDate.getFullYear() === date.getFullYear();
    });
  };

  const { daysInMonth, startingDay } = getDaysInMonth(currentDate);
  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'];

  const prevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
    setSelectedDay(1);
  };

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
    setSelectedDay(1);
  };

  const selectedDayEvents = getEventsForDate(selectedDay).filter(e => !showOverdueOnly || e.isOverdue);

  return (
    <div className="w-full min-h-screen space-y-8 animate-in fade-in duration-500">
      {/* Header Section */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/20">
            <CalendarIcon size={24} className="text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">Calendar</h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Track equipment due dates and reservations</p>
          </div>
        </div>

        <div className="flex items-center gap-2 bg-white dark:bg-[#111827] p-1.5 rounded-xl border border-gray-200 dark:border-slate-800 shadow-sm">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={prevMonth}
            className="h-8 w-8 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-lg"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <h2 className="text-base font-bold min-w-[140px] text-center text-gray-900 dark:text-white">
            {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
          </h2>
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={nextMonth}
            className="h-8 w-8 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-lg"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="grid lg:grid-cols-4 gap-6">
        {/* Main Calendar Card */}
        <div className="lg:col-span-3 space-y-4">
          <Card className="bg-white dark:bg-[#0F172A] border-gray-200 dark:border-slate-800 shadow-lg rounded-2xl overflow-hidden border-none ring-1 ring-gray-200 dark:ring-slate-800">
            <CardContent className="p-0">
              {/* Days header */}
              <div className="grid grid-cols-7 border-b border-gray-100 dark:border-slate-800 bg-gray-50/50 dark:bg-slate-900/50">
                {['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'].map(day => (
                  <div key={day} className="text-center text-[9px] font-bold text-slate-400 py-3 tracking-widest">
                    {day}
                  </div>
                ))}
              </div>

              {/* Calendar grid */}
              <div className="grid grid-cols-7">
                {/* Empty cells */}
                {[...Array(startingDay)].map((_, i) => (
                  <div key={`empty-${i}`} className="aspect-square border-b border-r border-gray-100 dark:border-slate-800/50 bg-gray-50/20 dark:bg-slate-900/10" />
                ))}

                {/* Days */}
                {[...Array(daysInMonth)].map((_, i) => {
                  const day = i + 1;
                  const dayEvents = getEventsForDate(day);
                  const isToday = new Date().getDate() === day &&
                                 new Date().getMonth() === currentDate.getMonth() &&
                                 new Date().getFullYear() === currentDate.getFullYear();
                  const isSelected = selectedDay === day;

                  return (
                    <div
                      key={day}
                      onClick={() => setSelectedDay(day)}
                      className={`relative aspect-[1/0.8] border-b border-r border-gray-100 dark:border-slate-800/50 group cursor-pointer transition-all ${
                        isSelected ? 'bg-emerald-500/5 dark:bg-emerald-500/10' : 'hover:bg-gray-50 dark:hover:bg-slate-800/40'
                      }`}
                    >
                      <div className="absolute top-2 left-2 flex flex-col items-start gap-1">
                        <span className={`text-xs font-bold transition-colors ${
                          isToday 
                            ? 'w-6 h-6 bg-emerald-500 text-white rounded-lg flex items-center justify-center -mt-0.5 -ml-0.5 shadow-md shadow-emerald-500/30' 
                            : isSelected ? 'text-emerald-500' : 'text-slate-600 dark:text-slate-400'
                        }`}>
                          {day}
                        </span>
                      </div>

                      {dayEvents.length > 0 && (
                        <div className="absolute bottom-2 left-2 right-2 flex flex-wrap gap-1">
                          {dayEvents.slice(0, 4).map((event, idx) => (
                            <div
                              key={idx}
                              className={`w-1 h-1 rounded-full ring-1 ring-white dark:ring-slate-900 ${
                                event.isOverdue ? 'bg-red-500 animate-pulse' :
                                event.type === 'returned' ? 'bg-emerald-500' :
                                event.type === 'due' ? 'bg-amber-500' :
                                'bg-blue-500'
                              }`}
                            />
                          ))}
                          {dayEvents.length > 4 && (
                            <span className="text-[10px] text-slate-400 font-bold">+{dayEvents.length - 4}</span>
                          )}
                        </div>
                      )}
                      
                      {isSelected && (
                        <motion.div 
                          layoutId="activeDay"
                          className="absolute inset-0 border-2 border-emerald-500 rounded-none z-10 pointer-events-none" 
                        />
                      )}
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Legend Section */}
          <div className="flex flex-wrap items-center gap-4 p-4 bg-white dark:bg-[#0F172A] rounded-xl border border-gray-200 dark:border-slate-800 shadow-sm">
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-sm shadow-emerald-500/40" />
              <span className="text-[9px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">Returned</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-amber-500 shadow-sm shadow-amber-500/40" />
              <span className="text-[9px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">Due Today</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse shadow-sm shadow-red-500/40" />
              <span className="text-[9px] font-bold text-red-500 uppercase tracking-wider">Overdue</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-blue-500 shadow-sm shadow-blue-500/40" />
              <span className="text-[9px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">Reservation</span>
            </div>
          </div>
        </div>

        {/* Sidebar - Daily Detail */}
        <div className="lg:col-span-1 space-y-4">
          <Card className="bg-white dark:bg-[#0F172A] border-gray-200 dark:border-slate-800 shadow-lg rounded-2xl overflow-hidden border-none ring-1 ring-gray-200 dark:ring-slate-800 h-full">
            <CardHeader className="p-4 border-b border-gray-100 dark:border-slate-800 bg-gray-50/30 dark:bg-slate-900/30">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2">
                  <Sparkles size={16} className="text-emerald-500" />
                  {selectedDay} {monthNames[currentDate.getMonth()]}
                </CardTitle>
                <button 
                  onClick={() => setShowOverdueOnly(!showOverdueOnly)}
                  className={`p-1.5 rounded-lg transition-colors ${showOverdueOnly ? 'bg-red-500/10 text-red-500' : 'text-slate-400 hover:bg-gray-100 dark:hover:bg-slate-800'}`}
                  title="Show Overdue Only"
                >
                  <AlertCircle size={16} />
                </button>
              </div>
            </CardHeader>
            <CardContent className="p-4">
              {loading ? (
                <div className="flex flex-col items-center justify-center py-20 gap-4">
                  <div className="w-10 h-10 border-4 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin" />
                  <p className="text-sm text-slate-500 font-medium animate-pulse">Loading events...</p>
                </div>
              ) : selectedDayEvents.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
                  <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800/50 rounded-2xl flex items-center justify-center">
                    <CalendarDays className="text-slate-400" size={32} />
                  </div>
                  <div>
                    <p className="text-slate-900 dark:text-white font-bold">No Events</p>
                    <p className="text-xs text-slate-500 mt-1">Free day for this equipment!</p>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Schedule for today</p>
                  <AnimatePresence mode="popLayout">
                    {selectedDayEvents.map((event) => (
                      <motion.div
                        layout
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        key={event.id}
                        className={`p-4 rounded-2xl border transition-all ${
                          event.isOverdue 
                            ? 'bg-red-500/5 border-red-500/20' 
                            : 'bg-gray-50 dark:bg-slate-800/50 border-gray-100 dark:border-slate-700/50 hover:border-emerald-500/30'
                        }`}
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div className={`p-2 rounded-xl ${
                            event.type === 'returned' ? 'bg-emerald-500/10 text-emerald-500' :
                            event.type === 'due' ? 'bg-amber-500/10 text-amber-500' :
                            'bg-blue-500/10 text-blue-500'
                          }`}>
                            {event.type === 'returned' ? <CheckCircle size={16} /> :
                             event.type === 'due' ? <Clock size={16} /> :
                             <Plus size={16} />}
                          </div>
                          <Badge variant="outline" className={`text-[10px] font-bold tracking-wider uppercase border-none ${
                            event.isOverdue ? 'bg-red-500 text-white' :
                            event.type === 'returned' ? 'bg-emerald-500/20 text-emerald-600' :
                            event.type === 'due' ? 'bg-amber-500/20 text-amber-600' :
                            'bg-blue-500/20 text-blue-600'
                          }`}>
                            {event.isOverdue ? 'Overdue' : event.type}
                          </Badge>
                        </div>
                        
                        <h4 className="text-gray-900 dark:text-white font-bold leading-tight">{event.title}</h4>
                        <div className="mt-3 flex items-center gap-2 text-slate-500 dark:text-slate-400">
                          <User size={12} />
                          <span className="text-xs font-medium">{event.userName}</span>
                        </div>
                        <div className="mt-1 flex items-center gap-2 text-slate-500 dark:text-slate-400">
                          <Package size={12} />
                          <span className="text-xs font-medium">{event.quantity} Units</span>
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Calendar;
