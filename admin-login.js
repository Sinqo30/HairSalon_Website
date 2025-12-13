const adminLoginForm = document.getElementById("adminLoginForm");
const loginMessage = document.getElementById("loginMessage");

adminLoginForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const credentials = {
        username: adminLoginForm.username.value,
        password: adminLoginForm.password.value
    };

    try {
        const response = await fetch("/api/admin-login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(credentials)
        });

        if (response.ok) {
            window.location.href = "/admin.html";
        } else {
            loginMessage.textContent = "Invalid username or password.";
        }
    } catch (err) {
        console.error(err);
        loginMessage.textContent = "Login error.";
    }
});
