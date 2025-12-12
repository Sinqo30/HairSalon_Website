const bookingForm = document.getElementById("bookingForm");
const statusMsg = document.getElementById("statusMsg");

bookingForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const booking = {
        name: document.getElementById("name").value,
        email: document.getElementById("email").value,
        phone: document.getElementById("phone").value,
        service: document.getElementById("service").value,
        date: document.getElementById("date").value,
    };

    try {
        const res = await fetch("/api/bookings", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(booking),
        });

        if (res.ok) {
            statusMsg.textContent = "Booking submitted successfully!";
            bookingForm.reset();
        } else {
            statusMsg.textContent = "Failed to submit booking.";
        }
    } catch (err) {
        console.error(err);
        statusMsg.textContent = "Error connecting to server.";
    }
});
