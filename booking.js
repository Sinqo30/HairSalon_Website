const form = document.getElementById("bookingForm");
const dateInput = document.getElementById("date");
const timeSelect = document.getElementById("time");

// Generate 1-hour intervals from 07:00 to 19:00
function generateTimes() {
  let times = [];
  for (let i = 7; i <= 19; i++) {
    const t = String(i).padStart(2, "0") + ":00";
    times.push(t);
  }
  return times;
}

// When date changes → fetch booked + blocked times
dateInput.addEventListener("change", async () => {
  const date = dateInput.value;
  if (!date) return;

  const res = await fetch(`/api/bookings/${date}`);
  const data = await res.json();

  const bookedTimes = data.bookedTimes || [];
  const blockedTimes = data.blockedTimes || [];

  const allTimes = generateTimes();

  timeSelect.innerHTML = `<option value="">-- Select Time --</option>`;

  allTimes.forEach((t) => {
    const opt = document.createElement("option");
    opt.value = t;
    opt.textContent = t;

    if (bookedTimes.includes(t) || blockedTimes.includes(t)) {
      opt.disabled = true;
    }

    timeSelect.appendChild(opt);
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
    headers: {"Content-Type":"application/json"},
    body: JSON.stringify(bookingData)
  });

  const result = await res.json();

  if (!result.success) {
    alert(result.error || "Booking failed");
    return;
  }

  alert("Your appointment has been booked!");
  form.reset();
  timeSelect.innerHTML = `<option value="">-- Select Time --</option>`;
});
