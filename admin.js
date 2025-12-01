const bookingsTable = document.getElementById("bookingsTable").querySelector("tbody");
const blockedTable = document.getElementById("blockedTable").querySelector("tbody");
const blockForm = document.getElementById("blockForm");
const logoutBtn = document.getElementById("logoutBtn");

// Fetch and populate bookings
async function loadBookings() {
  const res = await fetch("/api/bookings");
  const bookings = await res.json();
  bookingsTable.innerHTML = "";
  bookings.forEach(b => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${b.id}</td>
      <td>${b.name}</td>
      <td>${b.email}</td>
      <td>${b.service}</td>
      <td>${b.date}</td>
      <td>${b.time}</td>
      <td><button onclick="deleteBooking(${b.id})">Delete</button></td>
    `;
    bookingsTable.appendChild(tr);
  });
}

// Fetch and populate blocked
async function loadBlocked() {
  const res = await fetch("/api/blocked");
  const blocks = await res.json();
  blockedTable.innerHTML = "";
  blocks.forEach(b => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${b.id}</td>
      <td>${b.date}</td>
      <td>${b.time || "All Day"}</td>
      <td><button onclick="unblock(${b.id})">Unblock</button></td>
    `;
    blockedTable.appendChild(tr);
  });
}

// Delete booking
async function deleteBooking(id) {
  if (!confirm("Delete this booking?")) return;
  await fetch("/api/delete-booking", {
    method: "POST",
    headers: {"Content-Type":"application/json"},
    body: JSON.stringify({id})
  });
  loadBookings();
}

// Block date/time
blockForm.addEventListener("submit", async (e)=>{
  e.preventDefault();
  const date = document.getElementById("blockDate").value;
  const time = document.getElementById("blockTime").value;
  const res = await fetch("/api/block", {
    method:"POST",
    headers: {"Content-Type":"application/json"},
    body: JSON.stringify({date,time})
  });
  const result = await res.json();
  if(!result.success) alert(result.error);
  loadBlocked();
});

// Unblock
async function unblock(id){
  await fetch("/api/unblock", {
    method:"POST",
    headers: {"Content-Type":"application/json"},
    body: JSON.stringify({id})
  });
  loadBlocked();
}

// Logout
logoutBtn.addEventListener("click", async ()=>{
  await fetch("/api/logout", {method:"POST"});
  window.location.href = "/admin-login.html";
});

// Initial load
loadBookings();
loadBlocked();
