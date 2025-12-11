const form = document.getElementById("bookingForm");
const dateInput = document.getElementById("date");
const timeSelect = document.getElementById("time");

// Generate 1-hour intervals (SA time)
function generateTimes() {
  let times = [];
  for (let i = 7; i <= 19; i++) {
    let hour = String(i).padStart(2, "0");
    times.push(`${hour}:00`);
  }
  return times;
}

// Load times when date changes
dateInput.addEventListener("change", async () => {
  const date = dateInput.value;
  if (!date) return;

  const res = await fetch(`/api/bookings/${date}`);
  const data = await res.json();

  const booked = data.bookedTimes || [];
  const blocked = data.blockedTimes || [];

  const times = generateTimes();

  timeSelect.innerHTML = `<option value="">-- Select Time --</option>`;

  times.forEach((t) => {
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

  const payload = {
    name: form.name.value,
    email: form.email.value,
    service: form.service.value,
    date: form.date.value,
    time: form.time.value,
  };

  const res = await fetch("/api/book", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  const result = await res.json();

  if (!result.success) {
    alert(result.error || "Booking failed");
    return;
  }

  alert("Your appointment has been successfully booked!");
  form.reset();
  timeSelect.innerHTML = `<option value="">-- Select Time --</option>`;
});
