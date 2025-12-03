const form = document.getElementById("bookingForm");
const dateInput = document.getElementById("date");
const timeSelect = document.getElementById("time");

// Populate available times
dateInput.addEventListener("change", async () => {
  const date = dateInput.value;
  if (!date) return;

  const res = await fetch(`/api/bookings/${date}`);
  const data = await res.json();
  const bookedTimes = data.bookedTimes || [];

  const times = ["09:00","10:00","11:00","12:00","13:00","14:00","15:00","16:00"];
  timeSelect.innerHTML = `<option value="">-- Select Time --</option>`;
  
  times.forEach(t => {
    const opt = document.createElement("option");
    opt.value = t;
    opt.textContent = t;
    if (bookedTimes.includes(t)) opt.disabled = true; // block booked/blocked times
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
