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
  
  ACADEMIC_CALENDAR.tournaments.forEach((event, index) => {
    const eventDate = new Date(now.getFullYear(), event.month - 1, 15);
    
    // Check if event is within lookahead period
    const diffTime = eventDate - now;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays > 0 && diffDays <= daysAhead) {
      upcoming.push({
        id: `event-${index}-${event.month}`,
        ...event,
        type: 'tournament',
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

/**
 * Generate highly detailed tournament recommendations based on usage & upcoming tournaments
 */
const generateTournamentRecommendations = async (Kit, Transaction, Tournament, Recommendation) => {
  const recommendations = [];
  
  // 1. Get static events
  const staticEvents = getUpcomingEvents(60);
  
  // 2. Get database tournaments
  let dbTournaments = [];
  if (Tournament) {
    try {
      dbTournaments = await Tournament.find({
        startDate: { $gte: new Date() },
        status: { $in: ['draft', 'active'] }
      });
    } catch (err) {
      console.error('Error fetching tournaments from DB:', err.message);
    }
  }
  
  // Combine them into a normalized list of events
  const allEvents = [];
  
  staticEvents.forEach(e => {
    allEvents.push({
      id: e.id,
      name: e.name,
      date: e.date,
      sports: e.sports,
      priority: e.priority,
      duration: e.duration || 7,
      type: 'academic_event',
      daysUntil: e.daysUntil
    });
  });
  
  dbTournaments.forEach(t => {
    const diffTime = t.startDate - new Date();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    // Estimate duration
    const durationDays = Math.ceil((t.endDate - t.startDate) / (1000 * 60 * 60 * 24)) || 3;
    
    // Parse sports category
    let sports = ['All'];
    if (t.eventType) {
      // Map eventType/description/name to sports categories
      const categories = ['Cricket', 'Football', 'Basketball', 'Badminton', 'Hockey', 'Table Tennis', 'Tennis', 'Volleyball'];
      const matched = categories.filter(c => 
        t.eventName.toLowerCase().includes(c.toLowerCase()) || 
        (t.description && t.description.toLowerCase().includes(c.toLowerCase())) ||
        t.eventType.toLowerCase().includes(c.toLowerCase())
      );
      if (matched.length > 0) {
        sports = matched;
      }
    }
    
    allEvents.push({
      id: t._id.toString(),
      name: t.eventName,
      date: t.startDate,
      sports: sports,
      priority: t.priority || 'medium',
      duration: durationDays,
      type: 'database_tournament',
      daysUntil: diffDays
    });
  });
  
  // Map sports category to approximate price per unit for estimated cost
  const priceMap = {
    'Cricket': 45,
    'Football': 25,
    'Basketball': 30,
    'Badminton': 20,
    'Hockey': 40,
    'Table Tennis': 15,
    'Tennis': 25,
    'Volleyball': 20,
    'Other': 15
  };
  
  for (const event of allEvents) {
    const relevantCategories = event.sports.includes('All')
      ? ['Cricket', 'Football', 'Basketball', 'Badminton', 'Hockey', 'Table Tennis', 'Tennis', 'Volleyball']
      : event.sports;
      
    for (const category of relevantCategories) {
      const kits = await Kit.find({ category, status: 'active' });
      
      for (const kit of kits) {
        // Calculate historical usage in the last 90 days
        const historicalUsage = await Transaction.countDocuments({
          kit: kit._id,
          type: 'issue',
          createdAt: { $gte: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000) }
        });
        
        // Weekly average usage over 12 weeks
        const weeklyAvg = historicalUsage / 12;
        
        // Calculate demand multiplier based on event priority
        let multiplier = 1.5;
        if (event.priority === 'high' || event.priority === 'urgent') {
          multiplier = 2.5;
        } else if (event.priority === 'low') {
          multiplier = 1.1;
        }
        
        const expectedDemand = Math.ceil(weeklyAvg * (event.duration / 7) * multiplier);
        const shortfall = expectedDemand - kit.available;
        
        const unitPrice = priceMap[category] || 25;

        if (shortfall > 0) {
          const estCost = shortfall * unitPrice;
          const recData = {
            _id: `rec-${event.id}-${kit._id}`,
            kitId: kit._id,
            targetId: event.id,
            targetModel: 'Tournament',
            title: `Restock ${kit.name} for ${event.name}`,
            description: `Upcoming ${event.priority} priority event in ${event.daysUntil} days. Based on historical weekly usage (${weeklyAvg.toFixed(1)} units/week), expected demand is ${expectedDemand} units. Available stock is ${kit.available} units. Shortfall of ${shortfall} units.`,
            priority: event.priority === 'high' || event.priority === 'urgent' ? 'high' : 'medium',
            estimatedCost: `$${estCost}`,
            expectedBenefit: `Prevent kit stockouts during the ${event.name}`,
            type: 'restock',
            eventDate: event.date,
            eventType: event.type,
            quantityNeeded: shortfall,
            kitName: kit.name,
            category: kit.category,
            predictedDemand: expectedDemand
          };
          
          recommendations.push(recData);
        } else {
          // No shortfall, check if it's high priority to recommend an inspection
          if (event.priority === 'high' || event.priority === 'urgent') {
            recommendations.push({
              _id: `rec-inspect-${event.id}-${kit._id}`,
              kitId: kit._id,
              targetId: event.id,
              targetModel: 'Tournament',
              title: `Inspect ${kit.name} for ${event.name}`,
              description: `You have adequate stock (${kit.available} units) for the expected event demand (${expectedDemand} units). However, perform a quality and safety check on available kits.`,
              priority: 'low',
              estimatedCost: '$0',
              expectedBenefit: `Ensure kit quality for ${event.name}`,
              type: 'inspection',
              eventDate: event.date,
              eventType: event.type,
              quantityNeeded: 0,
              kitName: kit.name,
              category: kit.category,
              predictedDemand: expectedDemand
            });
          }
        }
      }
    }
  }
  
  // Save recommendations to DB if model is provided
  if (Recommendation) {
    for (const rec of recommendations) {
      if (rec.targetModel === 'Tournament' && rec.targetId.length === 24) { // Only valid ObjectIds
        await Recommendation.findOneAndUpdate(
          { kit: rec.kitId, targetId: rec.targetId, type: rec.type },
          { 
            kit: rec.kitId, targetId: rec.targetId, targetModel: rec.targetModel,
            type: rec.type, priority: rec.priority, predictedDemand: rec.predictedDemand,
            quantityNeeded: rec.quantityNeeded, reason: rec.description
          },
          { upsert: true, new: true }
        ).catch(e => console.error('Failed to save rec', e.message));
      }
    }
  }

  // Sort recommendations by priority and date
  return recommendations.sort((a, b) => {
    const priorityOrder = { high: 0, medium: 1, low: 2, urgent: -1 };
    const aPriority = priorityOrder[a.priority] !== undefined ? priorityOrder[a.priority] : 1;
    const bPriority = priorityOrder[b.priority] !== undefined ? priorityOrder[b.priority] : 1;
    return aPriority - bPriority || new Date(a.eventDate) - new Date(b.eventDate);
  });
};

/**
 * Generate personalized recommendations for a player
 */
const generatePersonalizedRecommendations = async (User, Kit, Transaction, Recommendation, playerId) => {
  const recommendations = [];
  
  const player = await User.findById(playerId);
  if (!player || player.role !== 'player') {
    return recommendations;
  }
  
  // 1. Get kits matching player's sports
  let sports = player.sportType && player.sportType.length > 0 ? player.sportType : ['Cricket', 'Football', 'Basketball', 'Badminton'];
  
  // Match playing position if available (e.g. Wicket Keeper -> Gloves)
  const position = player.playingPosition ? player.playingPosition.toLowerCase() : '';
  
  for (const sport of sports) {
    let query = { category: sport, status: 'active' };
    
    // Position-specific logic
    if (sport === 'Cricket' && position.includes('keeper')) {
      query.name = { $regex: /keeping|gloves|pads/i };
    } else if (sport === 'Football' && position.includes('goal')) {
      query.name = { $regex: /gloves|keeper/i };
    }
    
    const availableKits = await Kit.find(query).limit(5);
    
    for (const kit of availableKits) {
      // Check if player frequently uses this
      const pastUsage = await Transaction.countDocuments({
        user: playerId,
        kit: kit._id,
        type: 'issue'
      });
      
      let priority = 'low';
      let reason = `Recommended based on your sport: ${sport}.`;
      
      if (pastUsage > 3) {
        priority = 'high';
        reason = `You frequently use this kit. Make sure to reserve it early for upcoming matches!`;
      } else if (pastUsage > 0) {
        priority = 'medium';
        reason = `Based on your past usage.`;
      }
      
      // If position matched specifically
      if (position && kit.name.toLowerCase().includes('glove')) {
        priority = 'high';
        reason = `Essential for your position: ${player.playingPosition}.`;
      }
      
      recommendations.push({
        kitId: kit._id,
        kitName: kit.name,
        category: kit.category,
        priority,
        reason,
        type: 'personalized',
        predictedDemand: pastUsage > 0 ? pastUsage : 1
      });
      
      if (Recommendation) {
        await Recommendation.findOneAndUpdate(
          { kit: kit._id, targetId: playerId, type: 'personalized' },
          { 
            kit: kit._id, targetId: playerId, targetModel: 'User',
            type: 'personalized', priority, predictedDemand: pastUsage > 0 ? pastUsage : 1,
            quantityNeeded: 1, reason
          },
          { upsert: true, new: true }
        ).catch(e => console.error(e.message));
      }
    }
  }
  
  // Sort by priority
  return recommendations.sort((a, b) => {
    const priorityOrder = { high: 0, medium: 1, low: 2, urgent: -1 };
    return priorityOrder[a.priority] - priorityOrder[b.priority];
  });
};

module.exports = {
  getUpcomingEvents,
  getCurrentAcademicPeriod,
  getAcademicMultiplier,
  generateRestockingAlerts,
  getQuarterlyForecast,
  generateTournamentRecommendations,
  generatePersonalizedRecommendations,
  ACADEMIC_CALENDAR
};
