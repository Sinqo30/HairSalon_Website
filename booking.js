const form = document.getElementById("bookingForm");
const dateInput = document.getElementById("date");
const timeSelect = document.getElementById("time");

// Generate 07:00 → 19:00 (can change if your hours differ)
function generateTimes() {
  let times = [];
  for (let i = 7; i <= 19; i++) {
    const t = String(i).padStart(2, "0") + ":00";
    times.push(t);
  }
  return times;
}

// Load available times when date is picked
dateInput.addEventListener("change", async () => {
  const date = dateInput.value;
  if (!date) return;

  const res = await fetch(`/api/bookings/${date}`);
  const data = await res.json();

  const booked = data.bookedTimes || [];
  const blocked = data.blockedTimes || [];

  const allTimes = generateTimes();
  timeSelect.innerHTML = `<option value="">-- Select Time --</option>`;

  allTimes.forEach((t) => {
    const opt = document.createElement("option");
    opt.value = t;
    opt.textContent = t;

    if (booked.includes(t) || blocked.includes(t)) {
      opt.disabled = true;
    }

    timeSelect.appendChild(opt);
  });
});

// Submit booking
form.addEventListener("submit", async (e) => {
  e.preventDefault();

  const data = {
    name: form.name.value,
    email: form.email.value,
    service: form.service.value,
    date: form.date.value,
    time: form.time.value
  };

  const res = await fetch("/api/book", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data)
  });

  const result = await res.json();

  if (!result.success) {
    alert(result.error || "Failed to book");
    return;
  }

  alert("Appointment booked successfully!");
  form.reset();
  timeSelect.innerHTML = `<option value="">-- Select Time --</option>`;
});
