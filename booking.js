const form = document.getElementById("bookingForm");
const dateInput = document.getElementById("date");
const timeSelect = document.getElementById("time");
const statusMessage = document.getElementById("statusMessage");

// Generate 1-hour intervals from 07:00 to 19:00
function generateTimes() {
  let times = [];
  for (let i = 7; i <= 19; i++) {
    const t = String(i).padStart(2, "0") + ":00";
    times.push(t);
  }
  return times;
}

// Set minimum date to today
const today = new Date().toISOString().split("T")[0];
dateInput.setAttribute("min", today);

// Prevent Sunday bookings & populate time dropdown
document.addEventListener("DOMContentLoaded", () => {
  timeSelect.innerHTML = '<option value="">-- Select Time --</option>';
});

// When date changes → fetch booked + blocked times
dateInput.addEventListener("change", async () => {
  const date = dateInput.value;
  if (!date) return;

  const selectedDay = new Date(date + "T00:00:00").getDay();
  if (selectedDay === 0) {
    alert("Ntobeko Beauty Studio is closed on Sundays.");
    dateInput.value = "";
    timeSelect.innerHTML = '<option value="">-- Select Time --</option>';
    return;
  }

  const res = await fetch(`/api/bookings/${date}`);
  const data = await res.json();

  const bookedTimes = data.bookedTimes || [];
  const blockedTimes = data.blockedTimes || [];

  const allTimes = generateTimes();
  const now = new Date();

  timeSelect.innerHTML = `<option value="">-- Select Time --</option>`;

  allTimes.forEach((t) => {
    const [hour, minute] = t.split(":").map(Number);
    const selectedDateTime = new Date(date + "T" + t + ":00");

    const option = document.createElement("option");
    option.value = t;
    option.textContent = t;

    if (
      bookedTimes.includes(t) ||
      blockedTimes.includes(t) ||
      selectedDateTime < now
    ) {
      option.disabled = true;
    }

    timeSelect.appendChild(option);
  });
});

// Submit booking
form.addEventListener("submit", async (e) => {
  e.preventDefault();

  const bookingData = {
    name: form.name.value,
    email: form.email.value,
    service: form.service.value,
    date: form.date.value,
    time: form.time.value
  };

  const res = await fetch("/api/book", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(bookingData)
  });

  const result = await res.json();

  if (!result.success) {
    statusMessage.textContent = result.error || "Booking failed";
    statusMessage.style.color = "red";
    return;
  }

  statusMessage.textContent = "Your appointment has been booked!";
  statusMessage.style.color = "green";

  form.reset();
  timeSelect.innerHTML = `<option value="">-- Select Time --</option>`;
});
