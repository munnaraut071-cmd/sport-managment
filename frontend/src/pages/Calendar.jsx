import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Calendar as CalendarIcon, Clock, Package, User, ChevronLeft, ChevronRight } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/use-toast';
import { transactionsAPI } from '@/services/api';
import { reservationsAPI } from '@/services/api';

const Calendar = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchEvents();
  }, [currentDate]);

  const fetchEvents = async () => {
    try {
      setLoading(true);
      // Fetch transactions and reservations for the current month
      const [transactionsRes, reservationsRes] = await Promise.all([
        transactionsAPI.getAll(),
        reservationsAPI.getAll()
      ]);

      const transactionEvents = (transactionsRes.data.data || transactionsRes.data || []).map(t => ({
        id: t._id,
        title: `${t.kit?.name || 'Kit'} - ${t.user?.name || 'User'}`,
        date: new Date(t.dueDate || t.expectedReturnDate),
        type: t.returnDate ? 'returned' : 'due',
        status: t.status
      }));

      const reservationEvents = (reservationsRes.data.data || reservationsRes.data.reservations || []).map(r => ({
        id: r._id,
        title: `Reserved: ${r.kit?.name || 'Kit'}`,
        date: new Date(r.startDate),
        endDate: new Date(r.endDate),
        type: 'reservation',
        status: r.status
      }));

      setEvents([...transactionEvents, ...reservationEvents]);
    } catch (error) {
      console.error('Error fetching events:', error);
      toast({ title: 'Failed to load calendar events', variant: 'destructive' });
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
  };

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Calendar</h1>
          <p className="text-slate-500 mt-1">View all kit due dates and reservations</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={prevMonth}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <h2 className="text-xl font-semibold min-w-[200px] text-center">
            {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
          </h2>
          <Button variant="outline" onClick={nextMonth}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Calendar */}
        <Card className="lg:col-span-2 bg-white dark:bg-[#111827] border-gray-200 dark:border-slate-800">
          <CardContent className="p-6">
            {/* Days header */}
            <div className="grid grid-cols-7 gap-1 mb-2">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                <div key={day} className="text-center text-sm font-medium text-slate-500 py-2">
                  {day}
                </div>
              ))}
            </div>

            {/* Calendar grid */}
            <div className="grid grid-cols-7 gap-1">
              {/* Empty cells for starting day */}
              {[...Array(startingDay)].map((_, i) => (
                <div key={`empty-${i}`} className="aspect-square" />
              ))}

              {/* Days */}
              {[...Array(daysInMonth)].map((_, i) => {
                const day = i + 1;
                const dayEvents = getEventsForDate(day);
                const isToday = new Date().getDate() === day &&
                               new Date().getMonth() === currentDate.getMonth() &&
                               new Date().getFullYear() === currentDate.getFullYear();

                return (
                  <motion.div
                    key={day}
                    whileHover={{ scale: 1.05 }}
                    className={`aspect-square border border-gray-200 dark:border-slate-800 rounded-lg p-2 cursor-pointer transition-colors ${
                      isToday ? 'bg-emerald-100 dark:bg-emerald-500/20 border-emerald-500' : 'hover:bg-gray-50 dark:hover:bg-slate-800'
                    }`}
                  >
                    <span className={`text-sm font-medium ${isToday ? 'text-emerald-600 dark:text-emerald-400' : ''}`}>
                      {day}
                    </span>
                    {dayEvents.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-1">
                        {dayEvents.slice(0, 3).map((event, idx) => (
                          <div
                            key={idx}
                            className={`w-2 h-2 rounded-full ${
                              event.type === 'returned' ? 'bg-emerald-500' :
                              event.type === 'due' ? 'bg-amber-500' :
                              event.type === 'reservation' ? 'bg-blue-500' : 'bg-purple-500'
                            }`}
                          />
                        ))}
                        {dayEvents.length > 3 && (
                          <span className="text-xs text-slate-400">+{dayEvents.length - 3}</span>
                        )}
                      </div>
                    )}
                  </motion.div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Upcoming Events */}
        <Card className="bg-white dark:bg-[#111827] border-gray-200 dark:border-slate-800">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-emerald-500" />
              Upcoming Events
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-emerald-500" />
              </div>
            ) : events.length === 0 ? (
              <p className="text-slate-500 text-center py-8">No upcoming events</p>
            ) : (
              <div className="space-y-3">
                {events.slice(0, 10).map((event) => (
                  <div
                    key={event.id}
                    className="p-3 bg-gray-50 dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-700"
                  >
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className={`
                        ${event.type === 'returned' ? 'border-emerald-500 text-emerald-500' : ''}
                        ${event.type === 'due' ? 'border-amber-500 text-amber-500' : ''}
                        ${event.type === 'reservation' ? 'border-blue-500 text-blue-500' : ''}
                      `}>
                        {event.type}
                      </Badge>
                      <span className="text-sm text-slate-500">
                        {event.date.toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-gray-900 dark:text-white font-medium mt-1">{event.title}</p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-6">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-emerald-500" />
          <span className="text-sm text-slate-600 dark:text-slate-400">Returned</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-amber-500" />
          <span className="text-sm text-slate-600 dark:text-slate-400">Due</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-blue-500" />
          <span className="text-sm text-slate-600 dark:text-slate-400">Reservation</span>
        </div>
      </div>
    </div>
  );
};

export default Calendar;
