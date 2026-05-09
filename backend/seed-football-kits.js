const mongoose = require('mongoose');
const Kit = require('./models/Kit');
require('dotenv').config();

const seedFootballKits = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/sportkits');
    console.log('Connected to MongoDB');

    // Comprehensive Football Kits with improved names and icons
    const footballKits = [
      // Footballs
      { name: 'FIFA World Cup Official Match Ball', category: 'Football', quantity: 20, available: 18, emoji: '⚽', description: 'FIFA approved professional match ball for international matches' },
      { name: 'Adidas Tango Rosario Match Ball', category: 'Football', quantity: 25, available: 22, emoji: '⚽', description: 'Adidas Tango Rosario series football for professional matches' },
      { name: 'Nike Premier League Orbit Ball', category: 'Football', quantity: 15, available: 12, emoji: '⚽', description: 'Official Nike Premier League Orbit match ball' },
      { name: 'Select Brillant Super Training Ball', category: 'Football', quantity: 40, available: 35, emoji: '⚪', description: 'Select Brillant Super training football for daily practice' },
      { name: 'Mikasa Futsal FT5 Ball', category: 'Football', quantity: 20, available: 18, emoji: '🟡', description: 'Mikasa FT5 size 4 futsal ball for indoor competitions' },
      { name: 'Wilson Beach Soccer Ball', category: 'Football', quantity: 15, available: 12, emoji: '🏖️', description: 'Wilson official beach soccer ball for sand tournaments' },
      
      // Footwear
      { name: 'Nike Mercurial Vapor 14 Elite', category: 'Football', quantity: 12, available: 10, emoji: '👟', description: 'Nike Mercurial Vapor 14 Elite speed boots for wingers and forwards' },
      { name: 'Adidas Predator Edge.1 Low', category: 'Football', quantity: 10, available: 8, emoji: '👟', description: 'Adidas Predator Edge.1 Low control boots for midfielders and playmakers' },
      { name: 'Puma Future Ultimate 1.3', category: 'Football', quantity: 8, available: 6, emoji: '👟', description: 'Puma Future Ultimate 1.3 adaptive boots for agile players' },
      { name: 'Nike Phantom GX Academy Turf', category: 'Football', quantity: 15, available: 12, emoji: '👟', description: 'Nike Phantom GX Academy artificial turf football shoes' },
      { name: 'Adidas Copa Sense.3 Indoor', category: 'Football', quantity: 10, available: 8, emoji: '👟', description: 'Adidas Copa Sense.3 indoor court shoes for futsal' },
      
      // Protective Equipment
      { name: 'Nike Guard Lock Elite Shin Guards', category: 'Football', quantity: 30, available: 25, emoji: '🛡️', description: 'Nike Guard Lock Elite shin guards with ankle protection system' },
      { name: 'Adidas Predator Pro Goalkeeper Gloves', category: 'Football', quantity: 8, available: 6, emoji: '🧤', description: 'Adidas Predator Pro goalkeeper gloves with URG 2.0 grip technology' },
      { name: 'Schutt Youth Football Helmet', category: 'Football', quantity: 5, available: 4, emoji: '🪖', description: 'Schutt youth football helmet with facemask for young players' },
      { name: 'Shock Doctor Pro Mouth Guard', category: 'Football', quantity: 20, available: 18, emoji: '🦷', description: 'Shock Doctor Pro custom fit mouth guards with gel liner' },
      
      // Goals and Nets
      { name: 'Kwik Goal Professional 8x24 Goal', category: 'Football', quantity: 4, available: 2, emoji: '🥅', description: 'Kwik Goal professional 8x24 full size football goal with net' },
      { name: 'Franklin Sports Youth 6x18 Goal', category: 'Football', quantity: 6, available: 4, emoji: '🥅', description: 'Franklin Sports youth 6x18 football goal for training and matches' },
      { name: 'SKLZ Quickster Pop Up Goal Set', category: 'Football', quantity: 8, available: 6, emoji: '🥅', description: 'SKLZ Quickster portable pop up goals for practice sessions' },
      { name: 'Professional Replacement Net 8x24', category: 'Football', quantity: 10, available: 8, emoji: '🕸️', description: 'Professional replacement football nets for 8x24 goals' },
      { name: 'Goal Post Safety Pad Set', category: 'Football', quantity: 8, available: 6, emoji: '🦺', description: 'High-density foam safety pads for goal posts' },
      
      // Training Equipment
      { name: 'Markwort Premium Soccer Cones Set', category: 'Football', quantity: 30, available: 25, emoji: '🚧', description: 'Set of 50 colored Markwort premium cones for training drills' },
      { name: 'SKLZ Agility Ladder Pro', category: 'Football', quantity: 12, available: 10, emoji: '🪜', description: 'SKLZ 15-foot agility ladder for footwork and speed training' },
      { name: 'Kwik Goal Training Poles Set', category: 'Football', quantity: 16, available: 14, emoji: '🏁', description: 'Kwik Goal set of 6 training poles for dribbling and slalom drills' },
      { name: 'Kbands Resistance Parachute Pro', category: 'Football', quantity: 8, available: 6, emoji: '🪂', description: 'Kbands speed resistance parachute for acceleration training' },
      { name: 'Yes4All Adjustable Agility Hurdles', category: 'Football', quantity: 10, available: 8, emoji: '🏃', description: 'Yes4All set of 6 adjustable hurdles for agility training' },
      { name: 'TRX Medicine Ball Set 3-12lbs', category: 'Football', quantity: 6, available: 4, emoji: '🏋️', description: 'TRX set of medicine balls 3-12lbs for strength and core training' },
      { name: 'BlazePod Speed Rings Training System', category: 'Football', quantity: 20, available: 18, emoji: '⭕', description: 'BlazePod speed rings for quick feet and reaction training' },
      
      // Team Equipment
      { name: 'Puma Team Backpack Pro', category: 'Football', quantity: 15, available: 12, emoji: '🎒', description: 'Puma large football team backpack with shoe compartment' },
      { name: 'Gatorade Water Bottle Carrier 12 Bottle', category: 'Football', quantity: 10, available: 8, emoji: '💧', description: 'Gatorade 12 bottle carrier with insulated compartments' },
      { name: 'Brazuca Electric Ball Pump Pro', category: 'Football', quantity: 12, available: 10, emoji: '🎈', description: 'Brazuca professional electric football ball pump with pressure gauge' },
      { name: 'Digital Ball Pressure Gauge Pro', category: 'Football', quantity: 8, available: 6, emoji: '📊', description: 'Professional digital ball pressure gauge for precise measurements' },
      { name: 'Nike Dri-FIT Training Bibs Set', category: 'Football', quantity: 20, available: 18, emoji: '👕', description: 'Nike Dri-FIT colored training bibs set of 20 for team practice' },
      
      // Accessories
      { name: 'Nike Elite Cushioned Football Socks', category: 'Football', quantity: 40, available: 35, emoji: '🧦', description: 'Nike Elite cushioned football socks with arch support and grip' },
      { name: 'Adidas Captain Armband Pro', category: 'Football', quantity: 6, available: 5, emoji: '💪', description: 'Adidas professional captain armband with Velcro closure' },
      { name: 'FIFA Professional Referee Whistle Set', category: 'Football', quantity: 8, available: 6, emoji: '📢', description: 'FIFA approved professional referee whistle set with lanyard' },
      { name: 'Professional Referee Cards Set', category: 'Football', quantity: 10, available: 8, emoji: '🟥', description: 'Professional referee red and yellow cards with notebook and wallet' },
      { name: 'Ultrak Digital Stopwatch Pro', category: 'Football', quantity: 6, available: 5, emoji: '⏱️', description: 'Ultrak professional digital stopwatch with lap timer' },
      { name: 'Magnetic Soccer Tactical Board Pro', category: 'Football', quantity: 4, available: 3, emoji: '📋', description: 'Professional magnetic soccer tactical board with markers and eraser' },
      
      // Field Equipment
      { name: 'Professional Corner Flags Set', category: 'Football', quantity: 8, available: 6, emoji: '🚩', description: 'Professional weighted corner flags set with spring base' },
      { name: 'Kwik Goal Field Line Marker Spray', category: 'Football', quantity: 10, available: 8, emoji: '🎨', description: 'Kwik Goal professional field line marking spray chalk' },
      { name: 'Electronic Soccer Scoreboard Pro', category: 'Football', quantity: 2, available: 1, emoji: '📺', description: 'Electronic soccer scoreboard with timer and score display' },
      { name: 'Aluminum Team Bench Set', category: 'Football', quantity: 4, available: 3, emoji: '🪑', description: 'Aluminum team bench for substitutes and coaching staff' },
      
      // Goalkeeper Equipment
      { name: 'Nike Goalkeeper Match Jersey Long Sleeve', category: 'Football', quantity: 6, available: 5, emoji: '👕', description: 'Nike professional goalkeeper long sleeve match jersey' },
      { name: 'Adidas Predator Goalkeeper Shorts', category: 'Football', quantity: 6, available: 5, emoji: '🩳', description: 'Adidas Predator padded goalkeeper shorts with hip protection' },
      { name: 'Puma Goalkeeper Match Pants', category: 'Football', quantity: 6, available: 5, emoji: '👖', description: 'Puma full length goalkeeper match pants with padded knees' },
      { name: 'Goalkeeper Knee Pads Pro', category: 'Football', quantity: 8, available: 6, emoji: '🦿', description: 'Professional goalkeeper knee pads for diving and protection' },
      
      // Technology Equipment
      { name: 'Catapult GPS Player Tracker Set', category: 'Football', quantity: 4, available: 3, emoji: '📡', description: 'Catapult GPS player performance trackers with analytics software' },
      { name: 'GoPro HERO Body Camera Kit', category: 'Football', quantity: 2, available: 1, emoji: '📹', description: 'GoPro HERO body camera kit for match recording and analysis' },
      { name: 'iPad Pro for Match Analysis', category: 'Football', quantity: 2, available: 1, emoji: '📱', description: 'iPad Pro with tactical analysis software for coaches' },
      
      // Recovery and Miscellaneous
      { name: 'Microfiber Football Towel Set', category: 'Football', quantity: 20, available: 18, emoji: '🏖️', description: 'Quick dry microfiber football towels for players' },
      { name: 'Instant Cold Pack Therapy Set', category: 'Football', quantity: 15, available: 12, emoji: '🧊', description: 'Instant cold pack therapy set for injuries and recovery' },
      { name: 'KT Athletic Tape Pro Set', category: 'Football', quantity: 12, available: 10, emoji: '📼', description: 'KT professional athletic tape set for joint support' },
      { name: 'TriggerPoint Foam Roller Pro', category: 'Football', quantity: 8, available: 6, emoji: '🎽', description: 'TriggerPoint professional foam roller for muscle recovery' }
    ];

    let created = 0;
    let existing = 0;

    for (const kitData of footballKits) {
      const existingKit = await Kit.findOne({ name: kitData.name });
      if (!existingKit) {
        await Kit.create({
          ...kitData,
          status: 'active',
          condition: 'good'
        });
        console.log(`✅ Created: ${kitData.emoji} ${kitData.name}`);
        created++;
      } else {
        console.log(`⚠️ Exists: ${kitData.emoji} ${kitData.name}`);
        existing++;
      }
    }

    console.log(`\n🎉 Football Kits Seed Complete!`);
    console.log(`   Created: ${created} kits`);
    console.log(`   Already existed: ${existing} kits`);
    process.exit(0);
  } catch (error) {
    console.error('❌ Seed failed:', error);
    process.exit(1);
  }
};

seedFootballKits();
