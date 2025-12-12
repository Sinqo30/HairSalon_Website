async function loadBookings() {
    try {
        const response = await fetch("/api/bookings");
        const bookings = await response.json();

        const tableBody = document.querySelector("#bookingTable tbody");
        tableBody.innerHTML = "";

        bookings.forEach(b => {
            const row = document.createElement("tr");
            row.innerHTML = `
                <td>${b.name}</td>
                <td>${b.phone}</td>
                <td>${b.service}</td>
                <td>${b.date}</td>
            `;
            tableBody.appendChild(row);
        });
    } catch (err) {
        console.error("Failed to load bookings:", err);
    }
}

document.addEventListener("DOMContentLoaded", loadBookings);
