const mongoose = require('mongoose');
const Kit = require('./models/Kit');
require('dotenv').config();

const seedCricketKits = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/sportkits');
    console.log('Connected to MongoDB');

    // Comprehensive Cricket Kits with improved icons
    const cricketKits = [
      // Bats
      { name: 'SG English Willow Bat', category: 'Cricket', quantity: 8, available: 6, emoji: '🏏', description: 'Premium English willow cricket bat for professionals' },
      { name: 'Kashmir Willow Bat', category: 'Cricket', quantity: 15, available: 12, emoji: '🏏', description: 'Grade A Kashmir willow cricket bat for intermediate players' },
      { name: 'MRF Genius Bat', category: 'Cricket', quantity: 6, available: 4, emoji: '🏏', description: 'MRF Genius edition cricket bat - endorsed by Virat Kohli' },
      { name: 'Gray Nicolls Predator', category: 'Cricket', quantity: 5, available: 3, emoji: '🏏', description: 'Gray Nicolls Predator cricket bat for power hitters' },
      { name: 'SS Ton Gladiator', category: 'Cricket', quantity: 7, available: 5, emoji: '🏏', description: 'SS Ton Gladiator cricket bat with thick edges' },
      
      // Balls
      { name: 'Kookaburra Red Ball', category: 'Cricket', quantity: 30, available: 25, emoji: '🔴', description: 'Kookaburra Turf Red ball for Test matches' },
      { name: 'Kookaburra White Ball', category: 'Cricket', quantity: 25, available: 20, emoji: '⚪', description: 'Kookaburra White ball for ODI and T20 matches' },
      { name: 'SG Test Ball', category: 'Cricket', quantity: 20, available: 18, emoji: '🔴', description: 'SG Test Red ball used in Indian cricket' },
      { name: 'Duke Cricket Ball', category: 'Cricket', quantity: 15, available: 12, emoji: '🔴', description: 'Duke Special County cricket ball for professional matches' },
      { name: 'Leather Tennis Ball', category: 'Cricket', quantity: 40, available: 35, emoji: '🎾', description: 'Leather covered tennis ball for practice' },
      { name: 'Rubber Cricket Ball', category: 'Cricket', quantity: 50, available: 45, emoji: '⚫', description: 'Soft rubber cricket ball for beginners' },
      
      // Protective Equipment
      { name: 'Masuri Vision Series Helmet', category: 'Cricket', quantity: 10, available: 8, emoji: '🪖', description: 'Masuri Vision Series helmet with titanium grille' },
      { name: 'Shrey Helmet', category: 'Cricket', quantity: 12, available: 10, emoji: '🪖', description: 'Shrey Classic helmet with adjustable strap' },
      { name: 'SF Batting Gloves', category: 'Cricket', quantity: 20, available: 18, emoji: '�', description: 'SF Professional batting gloves with extra padding' },
      { name: 'Kookaburra Batting Gloves', category: 'Cricket', quantity: 15, available: 12, emoji: '�', description: 'Kookaburra Pro batting gloves with cotton lining' },
      { name: 'SG Batting Gloves', category: 'Cricket', quantity: 18, available: 15, emoji: '�', description: 'SG Elite batting gloves with leather palm' },
      { name: 'GM Batting Gloves', category: 'Cricket', quantity: 10, available: 8, emoji: '�', description: 'Gunn & Moore batting gloves with reinforced fingers' },
      
      // Pads
      { name: 'Masuri Batting Pads', category: 'Cricket', quantity: 12, available: 10, emoji: '�', description: 'Masuri Lightweight batting pads with cane inserts' },
      { name: 'Kookaburra Batting Pads', category: 'Cricket', quantity: 15, available: 12, emoji: '�', description: 'Kookaburra Pro batting pads with extra knee protection' },
      { name: 'SG Batting Pads', category: 'Cricket', quantity: 18, available: 15, emoji: '�', description: 'SG Elite batting pads with traditional design' },
      { name: 'SF Batting Pads', category: 'Cricket', quantity: 14, available: 11, emoji: '�', description: 'SF Professional batting pads with ambidextrous design' },
      { name: 'Gray Nicolls Pads', category: 'Cricket', quantity: 8, available: 6, emoji: '�', description: 'Gray Nicolls batting pads for professional players' },
      
      // Wicket Keeping Equipment
      { name: 'Kookaburra Keeping Gloves', category: 'Cricket', quantity: 8, available: 6, emoji: '🧤', description: 'Kookaburra Pro wicket keeping gloves with webbing' },
      { name: 'SG Keeping Gloves', category: 'Cricket', quantity: 6, available: 4, emoji: '🧤', description: 'SG Elite wicket keeping gloves with cotton palm' },
      { name: 'SF Keeping Pads', category: 'Cricket', quantity: 8, available: 6, emoji: '�', description: 'SF Professional wicket keeping pads with extra protection' },
      { name: 'Masuri Keeping Pads', category: 'Cricket', quantity: 5, available: 3, emoji: '�', description: 'Masuri wicket keeping pads with reinforced knee' },
      
      // Stumps and Bails
      { name: 'Kookaburra Stumps Set', category: 'Cricket', quantity: 12, available: 10, emoji: '🚩', description: 'Complete Kookaburra stumps set with metal spikes and bails' },
      { name: 'SG Stumps Set', category: 'Cricket', quantity: 15, available: 12, emoji: '🚩', description: 'SG Professional stumps set with wooden base' },
      { name: 'Spring Back Stumps', category: 'Cricket', quantity: 6, available: 4, emoji: '🚩', description: 'Spring loaded stumps for practice sessions' },
      { name: 'LED Stumps Set', category: 'Cricket', quantity: 4, available: 2, emoji: '💡', description: 'LED illuminated stumps for day-night matches' },
      
      // Body Protection
      { name: 'Masuri Thigh Guard', category: 'Cricket', quantity: 15, available: 12, emoji: '🛡️', description: 'Masuri Lightweight thigh guard with extra padding' },
      { name: 'SG Abdominal Guard', category: 'Cricket', quantity: 20, available: 18, emoji: '🛡️', description: 'SG abdominal guard (box) for male players' },
      { name: 'Kookaburra Chest Guard', category: 'Cricket', quantity: 8, available: 6, emoji: '🦺', description: 'Kookaburra chest guard for close-in fielders' },
      { name: 'SF Elbow Guard', category: 'Cricket', quantity: 12, available: 10, emoji: '🛡️', description: 'SF elbow guard for batting protection' },
      { name: 'Arm Guard', category: 'Cricket', quantity: 18, available: 15, emoji: '💪', description: 'Adjustable arm guard for forearms protection' },
      
      // Shoes and Footwear
      { name: 'Kookaburra Cricket Shoes', category: 'Cricket', quantity: 10, available: 8, emoji: '👟', description: 'Kookaburra Pro cricket shoes with metal spikes' },
      { name: 'SG Cricket Shoes', category: 'Cricket', quantity: 12, available: 10, emoji: '👟', description: 'SG Elite cricket shoes with rubber studs' },
      { name: 'Adidas Cricket Shoes', category: 'Cricket', quantity: 8, available: 6, emoji: '👟', description: 'Adidas cricket shoes with spike system' },
      { name: 'Puma Cricket Shoes', category: 'Cricket', quantity: 6, available: 4, emoji: '👟', description: 'Puma cricket shoes with lightweight design' },
      
      // Training Equipment
      { name: 'Cricket Bowling Machine', category: 'Cricket', quantity: 3, available: 2, emoji: '🤖', description: 'Automatic bowling machine for practice' },
      { name: 'Slip Catching Cradle', category: 'Cricket', quantity: 5, available: 4, emoji: '🎯', description: 'Slip catching practice cradle' },
      { name: 'Cricket Net Set', category: 'Cricket', quantity: 8, available: 6, emoji: '🕸️', description: 'Portable cricket net for practice' },
      { name: 'Cone Markers Set', category: 'Cricket', quantity: 20, available: 18, emoji: '🚧', description: 'Set of cone markers for fielding drills' },
      { name: 'Cricket Scoreboard', category: 'Cricket', quantity: 4, available: 3, emoji: '📊', description: 'Manual scoreboard for matches' },
      
      // Accessories
      { name: 'Cricket Kit Bag', category: 'Cricket', quantity: 15, available: 12, emoji: '🎒', description: 'Large cricket kit bag with wheels' },
      { name: 'Bat Grip Set', category: 'Cricket', quantity: 30, available: 25, emoji: '🔧', description: 'Assorted cricket bat grips' },
      { name: 'Bat Mallet', category: 'Cricket', quantity: 10, available: 8, emoji: '🔨', description: 'Wooden mallet for bat knocking' },
      { name: 'Bat Oil', category: 'Cricket', quantity: 12, available: 10, emoji: '🧴', description: 'Linseed oil for bat maintenance' },
      { name: 'Cricket Tape Set', category: 'Cricket', quantity: 20, available: 18, emoji: '📼', description: 'Assorted colors grip tape for bats' },
      
      // Team Equipment
      { name: 'Cractice Cones', category: 'Cricket', quantity: 25, available: 22, emoji: '🚧', description: 'Plastic cones for fielding practice' },
      { name: 'First Aid Kit', category: 'Cricket', quantity: 6, available: 5, emoji: '🏥', description: 'Cricket specific first aid kit' },
      { name: 'Water Bottle Set', category: 'Cricket', quantity: 40, available: 35, emoji: '💧', description: 'Team water bottle set with carrier' },
      { name: 'Cricket Cap Set', category: 'Cricket', quantity: 30, available: 28, emoji: '🧢', description: 'Team cricket caps in various sizes' },
      { name: 'Towel Set', category: 'Cricket', quantity: 20, available: 18, emoji: '🏖️', description: 'Quick dry towels for players' }
    ];

    let created = 0;
    let existing = 0;

    for (const kitData of cricketKits) {
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

    console.log(`\n🎉 Cricket Kits Seed Complete!`);
    console.log(`   Created: ${created} kits`);
    console.log(`   Already existed: ${existing} kits`);
    process.exit(0);
  } catch (error) {
    console.error('❌ Seed failed:', error);
    process.exit(1);
  }
};

seedCricketKits();
