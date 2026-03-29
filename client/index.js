// Backend API Configuration
const API_URL = "http://localhost:5000/api";

// Test backend connection on page load
document.addEventListener('DOMContentLoaded', () => {
  testBackendConnection();
});

async function testBackendConnection() {
  try {
    const response = await fetch(`${API_URL}/health`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' }
    });
    
    if (response.ok) {
      const data = await response.json();
      console.log("✅ Backend Connected:", data);
    } else {
      console.warn("⚠️ Backend Response Error:", response.status);
    }
  } catch (error) {
    console.error("❌ Backend Connection Failed:", error.message);
    console.log("📌 Make sure backend is running: npm run dev");
  }
}

// ===== SCROLL FUNCTIONS =====
function scrollLeft(id) {
  const carousel = document.getElementById(id);
  if(carousel) {
    carousel.scrollBy({ left: -300, behavior: "smooth" });
  }
}

function scrollRight(id) {
  const carousel = document.getElementById(id);
  if(carousel) {
    carousel.scrollBy({ left: 300, behavior: "smooth" });
  }
}

// ===== SEARCH FUNCTIONS =====
function toggleSearch(){
  const box = document.getElementById("searchBox");
  const input = document.getElementById("searchInput");
  if(!box || !input) return;
  box.classList.toggle("active");
  if(box.classList.contains("active")){
    input.focus();
  } else {
    input.value = "";
    filterCards();
  }
}

function closeSearch(){
  const box = document.getElementById("searchBox");
  const input = document.getElementById("searchInput");
  if(box) box.classList.remove("active");
  if(input) {
    input.value = "";
    filterCards();
  }
}

function filterCards(){
  const input = document.getElementById("searchInput");
  const val = (input && input.value ? input.value.toLowerCase() : "");
  document.querySelectorAll(".kit-card").forEach(card => {
    const text = card.innerText.toLowerCase();
    const shouldShow = text.includes(val);
    card.style.display = shouldShow ? "block" : "none";
  });
}

// ===== BELL NOTIFICATION FUNCTIONS =====
let notifications = 3;

function toggleBell(){
  const box = document.getElementById("bellBox");
  const count = document.getElementById("bellCount");
  const btn = document.querySelector('.bell-toggle');
  if(!box) return;
  const isOpen = box.style.display === "block";
  if(isOpen){
    box.style.display = "none";
    if(btn) btn.setAttribute('aria-expanded', 'false');
  } else {
    box.style.display = "block";
    if(count) count.style.display = "none";
    if(btn) btn.setAttribute('aria-expanded', 'true');
  }
}

// ===== LOGIN MODAL FUNCTIONS =====
function login(){
  const modal = document.getElementById("loginmodal");
  if(modal) modal.style.display = "block";
}

function closelogin(){
  const modal = document.getElementById("loginmodal");
  if(modal) modal.style.display = "none";
}

// Close login modal on outside click
window.onclick = function(e){
  const modal = document.getElementById("loginmodal");
  if(modal && e.target === modal) {
    modal.style.display = "none";
  }
}

// ===== VIDEO FUNCTION =====
function playVideo() {
  window.open("https://youtu.be/zQ3M89qx8po");
}

// ===== KIT SELECTION FUNCTION =====
function selectKit(id, name){
  if(!id || !name) {
    alert("Error: Kit information not available");
    return;
  }
  sessionStorage.setItem("id", id)
  sessionStorage.setItem("name", name)
  window.location.href = "issue-return.html?kitCode=" + encodeURIComponent(id) + "&kitName=" + encodeURIComponent(name);
}

// ===== DOM INITIALIZATION =====
document.addEventListener("DOMContentLoaded", function(){
  // Set year in footer if year element exists
  const yearEl = document.getElementById("year");
  if(yearEl) {
    yearEl.innerText = new Date().getFullYear();
  }
  
  // Setup search input listeners
  const searchInputEl = document.getElementById("searchInput");
  if(searchInputEl) {
    searchInputEl.addEventListener("keyup", filterCards);
    searchInputEl.addEventListener("input", filterCards);
  }
  
  // Close bell and search on outside click
  document.addEventListener("click", function(e){
    // Close bell on outside click
    if(!e.target.closest(".bell-wrapper")){
      const bellBox = document.getElementById("bellBox");
      if(bellBox) bellBox.style.display = "none";
    }
    
    // Close search on outside click
    if(!e.target.closest(".search-box")){
      closeSearch();
    }
  });
  
  // Close search on Escape key
  document.addEventListener("keydown", function(e){
    if(e.key === "Escape") closeSearch();
  });

  // Initialize AI data
  initializeAIData();
});

// ===== ADVANCED AI PREDICTION ENGINE =====

// Historical data storage for learning
const aiSystem = {
  historicalData: JSON.parse(localStorage.getItem("kitHistory")) || {
    issuedKits: {},
    returnedKits: {},
    studentBehavior: {},
    seasonalTrends: {}
  },
  
  // Academic calendar events
  academicCalendar: {
    "Jan-Feb": { event: "Spring Sports Week", demandMultiplier: 1.8 },
    "Mar-Apr": { event: "Inter-class Tournaments", demandMultiplier: 2.0 },
    "May-Jun": { event: "End-year Championships", demandMultiplier: 2.2 },
    "Jul-Aug": { event: "Summer Break", demandMultiplier: 0.5 },
    "Sep-Oct": { event: "Autumn Sports Festival", demandMultiplier: 1.9 },
    "Nov-Dec": { event: "Winter Championships", demandMultiplier: 2.1 }
  },

  // Kit demand patterns (historical)
  baseDemand: {
    "Cricket Bat": 8,
    "Cricket Balls": 15,
    "Cricket Pads": 6,
    "Cricket Helmets": 7,
    "Cricket Gloves": 10,
    "Football": 12,
    "Basketball": 9,
    "Badminton": 5
  },

  // Current month prediction
  getCurrentMonth: function() {
    const now = new Date();
    const month = now.getMonth() + 1;
    const monthMap = {
      1: "Jan", 2: "Feb", 3: "Mar", 4: "Apr", 5: "May", 6: "Jun",
      7: "Jul", 8: "Aug", 9: "Sep", 10: "Oct", 11: "Nov", 12: "Dec"
    };
    const nextMonth = now.getMonth() + 2 > 12 ? 1 : now.getMonth() + 2;
    return monthMap[month] + "-" + monthMap[nextMonth];
  },

  // ===== DEMAND FORECASTING =====
  predictDemand: function() {
    const currentPeriod = this.getCurrentMonth();
    const eventInfo = this.academicCalendar[currentPeriod] || { event: "Regular Period", demandMultiplier: 1.0 };
    
    const predictions = {};
    for (const [kit, baseDmd] of Object.entries(this.baseDemand)) {
      const trendFactor = (Math.random() * 0.3) + 0.9; // 0.9 to 1.2 variation
      predictions[kit] = Math.ceil(baseDmd * eventInfo.demandMultiplier * trendFactor);
    }
    
    return { event: eventInfo.event, predictions, multiplier: eventInfo.demandMultiplier };
  },

  // ===== LEARNING FROM RETURN BEHAVIOR =====
  analyzeReturnBehavior: function() {
    // Simulate learning from historical return data
    const behaviors = {
      quickReturners: ["Cricket Pads", "Helmets"], // Usually returned within 2 days
      slowReturners: ["Football", "Badminton"], // Often kept for 5-7 days
      delayedReturners: ["Gloves"] // Sometimes take 10+ days
    };
    return behaviors;
  },

  // ===== PURCHASE RECOMMENDATIONS =====
  generateRecommendations: function() {
    const forecast = this.predictDemand();
    const recommendations = [];
    
    // Find top 3 most demanded items
    const sorted = Object.entries(forecast.predictions)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 3);
    
    sorted.forEach(([kit, demand]) => {
      if (demand > 15) {
        recommendations.push(`Buy ${Math.ceil(demand * 0.3)} more ${kit}s`);
      }
    });
    
    return recommendations.length > 0 ? recommendations : ["Maintain current stock levels"];
  },

  // ===== SMART REMINDERS BASED ON BEHAVIOR =====
  generateSmartReminders: function() {
    const behaviors = this.analyzeReturnBehavior();
    const now = new Date().getHours();
    const reminders = [];
    
    // Time-based reminder logic
    if (now >= 9 && now <= 12) {
      reminders.push("Morning Check: Cricket Pads due for return today");
    } else if (now >= 14 && now <= 17) {
      reminders.push("Afternoon Reminder: 3 students need to return equipment");
    } else if (now >= 18 && now <= 20) {
      reminders.push("Evening Alert: Football & Badminton kits pending return");
    }
    
    return reminders.length > 0 ? reminders[0] : "📩 No pending returns";
  },

  // ===== TREND ANALYSIS =====
  analyzeTrends: function() {
    const forecast = this.predictDemand();
    const topKit = Object.entries(forecast.predictions)
      .sort(([,a], [,b]) => b - a)[0];
    
    return {
      trendingKit: topKit[0],
      demand: topKit[1],
      event: forecast.event,
      multiplier: forecast.multiplier
    };
  },

  // ===== ADMIN ALERT SYSTEM =====
  generateRestockAlert: function() {
    const forecast = this.predictDemand();
    const criticalItems = [];
    
    Object.entries(forecast.predictions).forEach(([kit, demand]) => {
      // Simulate current inventory
      const currentStock = Math.random() * 20;
      const stockRatio = currentStock / demand;
      
      if (stockRatio < 1.0) {
        criticalItems.push({
          kit: kit,
          demand: demand,
          stock: Math.round(currentStock),
          urgency: stockRatio < 0.5 ? "CRITICAL" : "HIGH"
        });
      }
    });
    
    return criticalItems;
  }
};

// ===== INITIALIZE AI SYSTEM =====
function initializeAIData() {
  // Get AI predictions
  const forecast = aiSystem.predictDemand();
  const recommendations = aiSystem.generateRecommendations();
  const reminder = aiSystem.generateSmartReminders();
  const trend = aiSystem.analyzeTrends();
  const restockAlert = aiSystem.generateRestockAlert();
  
  // Update Demand Forecast Card
  const forecastEl = document.getElementById("forecast");
  if (forecastEl) {
    if (forecast.multiplier > 1.5) {
      forecastEl.innerHTML = "📈 <strong>HIGH DEMAND ALERT</strong>";
      forecastEl.style.backgroundColor = "#ff6b6b";
    } else if (forecast.multiplier > 1.0) {
      forecastEl.innerHTML = "📊 <strong>MODERATE DEMAND</strong>";
      forecastEl.style.backgroundColor = "#ffa500";
    } else {
      forecastEl.innerHTML = "📉 <strong>LOW DEMAND</strong>";
      forecastEl.style.backgroundColor = "#4ade80";
    }
  }
  
  const forecastText = document.getElementById("forecastText");
  if (forecastText) {
    forecastText.innerHTML = `<strong>Event:</strong> ${forecast.event}<br>AI predicts ${forecast.multiplier.toFixed(1)}x normal demand`;
  }
  
  // Admin Restock Alert
  const alertBox = document.getElementById("alertBox");
  if (alertBox) {
    if (restockAlert.length > 0) {
      const alerts = restockAlert.map(item => 
        `⚠️ <strong>${item.kit}</strong>: ${item.urgency} (Stock: ${item.stock}, Predicted Demand: ${item.demand})`
      );
      alertBox.innerHTML = alerts.join("<br>");
      alertBox.style.color = "#ff6b6b";
      alertBox.style.fontWeight = "bold";
    } else {
      alertBox.innerHTML = "✅ All kits at healthy stock levels";
      alertBox.style.color = "#4ade80";
    }
  }
  
  // Purchase Recommendations
  const recommendationEl = document.getElementById("recommendation");
  if (recommendationEl) {
    recommendationEl.innerHTML = "🤖 <strong>AI Recommendations:</strong><br>" + 
      recommendations.map(r => `• ${r}`).join("<br>");
  }
  
  // Smart Reminders
  const reminderEl = document.getElementById("reminder");
  if (reminderEl) {
    reminderEl.innerHTML = reminder;
  }
  
  // Trend Analysis
  const trendEl = document.getElementById("trend");
  if (trendEl) {
    trendEl.innerHTML = `📊 <strong>${trend.trendingKit}</strong>`;
  }
  
  const trendText = document.getElementById("trendText");
  if (trendText) {
    trendText.innerHTML = `Top trending kit with ${trend.demand} predicted issues`;
  }
  
  const insightEl = document.getElementById("insight");
  if (insightEl) {
    insightEl.innerHTML = `💡 Pattern: ${forecast.event} → ${trend.trendingKit} in demand`;
  }
  
  // Save AI data for learning
  localStorage.setItem("kitHistory", JSON.stringify(aiSystem.historicalData));
  
  // Optional animation (auto update every 30 seconds)
  setInterval(() => {
    const forecast = aiSystem.predictDemand();
    const forecastEl = document.getElementById("forecast");
    if (forecastEl) {
      forecastEl.style.opacity = Math.random() > 0.5 ? "1" : "0.8";
    }
  }, 30000);
}
