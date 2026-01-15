const bookingsTable = document.querySelector("#bookingsTable tbody");
const blockedTable = document.querySelector("#blockedTable tbody");
const blockForm = document.getElementById("blockForm");
const blockTimeSelect = document.getElementById("blockTime");
const logoutBtn = document.getElementById("logoutBtn");

// ----------------------
// Generate admin times
// ----------------------
function generateAdminTimes() {
  blockTimeSelect.innerHTML = `<option value="">-- All Day --</option>`;
  for (let h = 7; h <= 19; h++) {
    const t = String(h).padStart(2, "0") + ":00";
    const opt = document.createElement("option");
    opt.value = t;
    opt.textContent = t;
    blockTimeSelect.appendChild(opt);
  }
}
generateAdminTimes();

// ----------------------
// LOAD BOOKINGS
// ----------------------
async function loadBookings() {
  const res = await fetch("/api/bookings", { credentials: "include" });
  const bookings = await res.json();

  bookingsTable.innerHTML = "";
  bookings.forEach(b => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${b.id}</td>
      <td>${b.name}</td>
      <td>${b.email || ""}</td>
      <td>${b.service}</td>
      <td>${b.date}</td>
      <td>${b.time}</td>
      <td>
        <button onclick="deleteBooking(${b.id})">Delete</button>
      </td>
    `;
    bookingsTable.appendChild(tr);
  });
}

// ----------------------
// LOAD BLOCKED SLOTS
// ----------------------
async function loadBlocked() {
  const res = await fetch("/api/blocked", { credentials: "include" });
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

// ----------------------
// DELETE BOOKING
// ----------------------
async function deleteBooking(id) {
  if (!confirm("Delete this booking?")) return;

  await fetch("/api/delete-booking", {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ id })
  });

  loadBookings();
}

// ----------------------
// BLOCK DATE/TIME
// ----------------------
blockForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  const date = document.getElementById("blockDate").value;
  const time = blockTimeSelect.value;

  await fetch("/api/block", {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ date, time })
  });

  loadBlocked();
});

// ----------------------
// UNBLOCK
// ----------------------
async function unblock(id) {
  await fetch("/api/unblock", {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ id })
  });

  loadBlocked();
}

// ----------------------
// CHANGE PASSWORD
// ----------------------
const changePasswordForm = document.getElementById("changePasswordForm");
const passwordMsg = document.getElementById("passwordMsg");

changePasswordForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  const currentPassword = document.getElementById("currentPassword").value;
  const newPassword = document.getElementById("newPassword").value;
  const confirmPassword = document.getElementById("confirmNewPassword").value;

  if (newPassword !== confirmPassword) {
    passwordMsg.textContent = "New passwords do not match.";
    passwordMsg.style.color = "red";
    return;
  }

  const res = await fetch("/api/change-password", {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ currentPassword, newPassword })
  });

  const data = await res.json();

  if (!data.success) {
    passwordMsg.textContent = data.error;
    passwordMsg.style.color = "red";
    return;
  }

  passwordMsg.textContent = "Password changed successfully.";
  passwordMsg.style.color = "green";
  changePasswordForm.reset();
});

// ----------------------
// LOGOUT
// ----------------------
logoutBtn.addEventListener("click", async () => {
  await fetch("/api/logout", {
    method: "POST",
    credentials: "include"
  });

  window.location.href = "/admin-login.html";
});

// Init
loadBookings();
loadBlocked();
