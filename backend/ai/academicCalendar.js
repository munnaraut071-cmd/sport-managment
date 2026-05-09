/**
 * Academic Calendar & Sports Events Integration
 * Predicts demand based on:
 * - Academic calendar (exams, breaks, semesters)
 * - Sports tournaments and events
 * - Seasonal sports patterns
 */

const ACADEMIC_CALENDAR = {
  // Indian academic calendar (adjustable)
  semesters: [
    { name: 'Spring Semester', startMonth: 1, endMonth: 5, peakSports: ['Cricket', 'Football', 'Basketball'] },
    { name: 'Monsoon Semester', startMonth: 6, endMonth: 9, peakSports: ['Badminton', 'Table Tennis', 'Indoor Sports'] },
    { name: 'Winter Semester', startMonth: 10, endMonth: 12, peakSports: ['Hockey', 'Football', 'Cricket'] }
  ],
  
  tournaments: [
    // Annual Inter-College Tournaments
    { name: 'Inter-College Cricket Tournament', month: 3, sports: ['Cricket'], priority: 'high', duration: 14 },
    { name: 'Annual Sports Meet', month: 2, sports: ['All'], priority: 'high', duration: 7 },
    { name: 'Football Championship', month: 9, sports: ['Football'], priority: 'high', duration: 10 },
    { name: 'Basketball League', month: 11, sports: ['Basketball'], priority: 'medium', duration: 21 },
    { name: 'Badminton Tournament', month: 8, sports: ['Badminton'], priority: 'medium', duration: 5 },
    { name: 'Hockey Championship', month: 12, sports: ['Hockey'], priority: 'medium', duration: 7 },
    { name: 'Table Tennis Championship', month: 7, sports: ['Table Tennis'], priority: 'low', duration: 3 }
  ],
  
  breaks: [
    { name: 'Summer Break', months: [5, 6], activity: 'low' },
    { name: 'Winter Break', months: [12, 1], activity: 'low' },
    { name: 'Diwali Break', months: [10, 11], activity: 'medium' }
  ]
};

/**
 * Get upcoming sports events within next N days
 */
const getUpcomingEvents = (daysAhead = 30) => {
  const now = new Date();
  const upcoming = [];
  
  ACADEMIC_CALENDAR.tournaments.forEach(event => {
    const eventDate = new Date(now.getFullYear(), event.month - 1, 15);
    
    // Check if event is within lookahead period
    const diffTime = eventDate - now;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays > 0 && diffDays <= daysAhead) {
      upcoming.push({
        ...event,
        daysUntil: diffDays,
        date: eventDate
      });
    }
  });
  
  return upcoming.sort((a, b) => a.daysUntil - b.daysUntil);
};

/**
 * Get current academic period info
 */
const getCurrentAcademicPeriod = () => {
  const now = new Date();
  const currentMonth = now.getMonth() + 1; // 1-indexed
  
  const currentSemester = ACADEMIC_CALENDAR.semesters.find(
    s => currentMonth >= s.startMonth && currentMonth <= s.endMonth
  );
  
  const currentBreak = ACADEMIC_CALENDAR.breaks.find(
    b => b.months.includes(currentMonth)
  );
  
  return {
    semester: currentSemester,
    isBreak: !!currentBreak,
    breakInfo: currentBreak,
    month: currentMonth,
    peakSports: currentSemester?.peakSports || []
  };
};

/**
 * Calculate demand multiplier based on academic calendar
 */
const getAcademicMultiplier = (category) => {
  const period = getCurrentAcademicPeriod();
  
  // During breaks, demand drops
  if (period.isBreak) {
    return period.breakInfo.activity === 'low' ? 0.3 : 0.6;
  }
  
  // Check if category is in peak sports for current semester
  if (period.peakSports.includes(category)) {
    return 1.5;
  }
  
  // Check for upcoming tournaments
  const upcomingEvents = getUpcomingEvents(14);
  const relevantEvents = upcomingEvents.filter(e => 
    e.sports.includes('All') || e.sports.includes(category)
  );
  
  if (relevantEvents.length > 0) {
    const highPriorityEvent = relevantEvents.some(e => e.priority === 'high');
    return highPriorityEvent ? 2.0 : 1.3;
  }
  
  return 1.0;
};

/**
 * Generate restocking alerts based on upcoming events
 */
const generateRestockingAlerts = async (Kit, Transaction) => {
  const alerts = [];
  const upcomingEvents = getUpcomingEvents(30);
  
  for (const event of upcomingEvents) {
    const relevantCategories = event.sports.includes('All') 
      ? ['Cricket', 'Football', 'Basketball', 'Badminton', 'Hockey', 'Table Tennis', 'Tennis', 'Volleyball']
      : event.sports;
    
    for (const category of relevantCategories) {
      const kits = await Kit.find({ category, status: 'active' });
      
      for (const kit of kits) {
        // Calculate projected demand during event
        const historicalUsage = await Transaction.countDocuments({
          kit: kit._id,
          type: 'issue',
          createdAt: { $gte: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000) }
        });
        
        const weeklyAvg = historicalUsage / 12;
        const eventDemand = Math.ceil(weeklyAvg * (event.duration / 7) * 2); // Double during events
        
        const stockNeeded = eventDemand - kit.available;
        
        if (stockNeeded > 0) {
          alerts.push({
            type: 'tournament_preparation',
            priority: event.priority,
            event: event.name,
            daysUntil: event.daysUntil,
            kit: {
              id: kit._id,
              name: kit.name,
              category: kit.category,
              currentStock: kit.available
            },
            recommendedAction: 'restock',
            quantityNeeded: Math.ceil(stockNeeded * 1.2), // 20% buffer
            message: `${kit.name} needs ${Math.ceil(stockNeeded * 1.2)} units for ${event.name} (in ${event.daysUntil} days)`,
            reserveUntil: new Date(Date.now() + event.daysUntil * 24 * 60 * 60 * 1000)
          });
        }
      }
    }
  }
  
  return alerts.sort((a, b) => {
    const priorityOrder = { high: 0, medium: 1, low: 2 };
    return priorityOrder[a.priority] - priorityOrder[b.priority] || a.daysUntil - b.daysUntil;
  });
};

/**
 * Get seasonal forecast for next quarter
 */
const getQuarterlyForecast = () => {
  const now = new Date();
  const currentMonth = now.getMonth();
  
  const forecast = [];
  
  for (let i = 0; i < 3; i++) {
    const month = ((currentMonth + i) % 12) + 1;
    const semester = ACADEMIC_CALENDAR.semesters.find(
      s => month >= s.startMonth && month <= s.endMonth
    );
    
    const monthTournaments = ACADEMIC_CALENDAR.tournaments.filter(t => t.month === month);
    
    forecast.push({
      month,
      monthName: new Date(2024, month - 1, 1).toLocaleString('default', { month: 'long' }),
      semester: semester?.name || 'Break Period',
      peakSports: semester?.peakSports || [],
      events: monthTournaments,
      demandLevel: monthTournaments.length > 0 ? 'high' : semester ? 'medium' : 'low'
    });
  }
  
  return forecast;
};

module.exports = {
  getUpcomingEvents,
  getCurrentAcademicPeriod,
  getAcademicMultiplier,
  generateRestockingAlerts,
  getQuarterlyForecast,
  ACADEMIC_CALENDAR
};
