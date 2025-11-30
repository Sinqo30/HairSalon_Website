// LOGIN
const loginForm = document.getElementById("loginForm");

if (loginForm) {
  loginForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const username = document.getElementById("username").value;
    const password = document.getElementById("password").value;

    const res = await fetch("/api/admin-login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ username, password })
    });

    const data = await res.json();

    if (data.success) {
      window.location.href = "admin.html";
    } else {
      document.getElementById("error").innerText = "Invalid login.";
    }
  });
}

// LOAD BOOKINGS
async function loadBookings() {
  const res = await fetch("/api/bookings", { credentials: "include" });

  if (!res.ok) {
    document.body.innerHTML = "<h2 style='color:red;'>Not Authorized</h2>";
    return;
  }

  const bookings = await res.json();
  const tbody = document.querySelector("#bookingsTable tbody");
  tbody.innerHTML = "";

  bookings.forEach((b) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${b.id}</td>
      <td>${b.name}</td>
      <td>${b.email}</td>
      <td>${b.service}</td>
      <td>${b.date}</td>
      <td>${b.time}</td>
    `;
    tbody.appendChild(tr);
  });
}

if (document.querySelector("#bookingsTable")) loadBookings();

// LOGOUT
const logoutBtn = document.getElementById("logoutBtn");

if (logoutBtn) {
  logoutBtn.addEventListener("click", async () => {
    await fetch("/api/logout", {
      method: "POST",
      credentials: "include"
    });
    window.location.href = "admin-login.html";
  });
}
