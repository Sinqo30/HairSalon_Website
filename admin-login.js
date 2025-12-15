const form = document.getElementById("loginForm");
const error = document.getElementById("error");
const passwordInput = document.getElementById("password");
const togglePassword = document.getElementById("togglePassword");

// ----------------------
// SHOW / HIDE PASSWORD
// ----------------------
togglePassword.addEventListener("change", () => {
  passwordInput.type = togglePassword.checked ? "text" : "password";
});

// ----------------------
// LOGIN
// ----------------------
form.addEventListener("submit", async (e) => {
  e.preventDefault();

  const username = document.getElementById("username").value;
  const password = passwordInput.value;

  const res = await fetch("/api/admin-login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password })
  });

  const result = await res.json();

  if (!result.success) {
    error.textContent = "Invalid username or password.";
    return;
  }

  window.location.href = "/admin.html";
});
