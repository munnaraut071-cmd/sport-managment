// DOM Elements
const playerEl = document.getElementById("player");
const kitEl = document.getElementById("kit");
const dateEl = document.getElementById("date");
const issueBtn = document.getElementById("issueBtn");
const issuedTable = document.getElementById("issuedTable");
const returnedTable = document.getElementById("returnedTable");

// Data from localStorage
let issued = JSON.parse(localStorage.getItem("issuedKits")) || [];
let returned = JSON.parse(localStorage.getItem("returnedKits")) || [];

// Event listener
issueBtn.addEventListener("click", issueKit);

// Issue kit function
function issueKit() {
  const player = playerEl.value;
  const kit = kitEl.value;
  const date = dateEl.value;

  if (!player || !kit || !date) {
    alert("Please fill all fields");
    return;
  }

  issued.push({ player, kit, date });
  localStorage.setItem("issuedKits", JSON.stringify(issued));

  playerEl.value = "";
  kitEl.value = "";
  dateEl.value = "";

  loadTables();
}

// Return kit function
function returnKit(index) {
  const item = issued[index];
  issued.splice(index, 1);

  returned.push({
    player: item.player,
    kit: item.kit,
    date: new Date().toLocaleDateString()
  });

  localStorage.setItem("issuedKits", JSON.stringify(issued));
  localStorage.setItem("returnedKits", JSON.stringify(returned));

  loadTables();
}

// Load tables
function loadTables() {
  // Issued Table
  issuedTable.innerHTML = `
    <tr>
      <th>Player</th>
      <th>Kit</th>
      <th>Date</th>
      <th>Status</th>
      <th>Action</th>
    </tr>`;

  issued.forEach((item, i) => {
    issuedTable.innerHTML += `
      <tr>
        <td>${item.player}</td>
        <td>${item.kit}</td>
        <td>${item.date}</td>
        <td class="issued">Issued</td>
        <td><button class="action-btn" onclick="returnKit(${i})">Return</button></td>
      </tr>`;
  });

  // Returned Table
  returnedTable.innerHTML = `
    <tr>
      <th>Player</th>
      <th>Kit</th>
      <th>Return Date</th>
      <th>Status</th>
    </tr>`;

  returned.forEach(item => {
    returnedTable.innerHTML += `
      <tr>
        <td>${item.player}</td>
        <td>${item.kit}</td>
        <td>${item.date}</td>
        <td class="returned">Returned</td>
      </tr>`;
  });
}

// Initial load
loadTables();


