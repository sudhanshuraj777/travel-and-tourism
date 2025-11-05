// public/js/bookings.js
console.log("✅ bookings.js loaded successfully");

document.addEventListener("DOMContentLoaded", async () => {
  await checkUserSession();
  await loadBookings();
});

// ✅ Display correct navbar for Admin or Tourist
async function checkUserSession() {
  const res = await fetch("/api/me");
  const { user } = await res.json();
  const nav = document.getElementById("navLinks");

  if (!user) {
    nav.innerHTML = `
      <a href="/">Home</a> |
      <a href="/login.html">Login</a>
    `;
    document.body.innerHTML += "<p>Please login to see your bookings.</p>";
    return;
  }

  if (user.type === "Admin") {
    nav.innerHTML = `
      <a href="/">Home</a> |
      <a href="/admin.html">Admin Dashboard</a> |
      <a href="/bookings.html">All Bookings</a> |
      <a href="#" id="logoutBtn">Logout</a>
    `;
  } else {
    nav.innerHTML = `
      <a href="/">Home</a> |
      <a href="/bookings.html">My Bookings</a> |
      <a href="#" id="logoutBtn">Logout</a>
    `;
  }

  document.getElementById("logoutBtn").addEventListener("click", async () => {
    await fetch("/api/logout", { method: "POST" });
    location.href = "/";
  });
}

// ✅ Load bookings (admin or tourist)
async function loadBookings() {
  try {
    const res = await fetch("/api/bookings");
    const bookings = await res.json();
    const container = document.getElementById("bookingList");
    container.innerHTML = "";

    if (!Array.isArray(bookings) || bookings.length === 0) {
      container.innerHTML = "<p>No bookings found.</p>";
      return;
    }

    bookings.forEach(b => {
      const div = document.createElement("div");
      div.className = "booking-card";

      // ✅ Show more info if Admin
      div.innerHTML = `
        <h3>${b.Package_Name} (${b.Destination})</h3>
        <p><strong>Booking ID:</strong> ${b.Booking_ID}</p>
        <p><strong>Date:</strong> ${new Date(b.Booking_Date).toLocaleDateString()}</p>
        <p><strong>People:</strong> ${b.No_of_People}</p>
        <p><strong>Total Cost:</strong> ₹${b.Total_Cost}</p>
        <p><strong>Status:</strong> ${b.Status}</p>
        ${b.Tourist_Name ? `<p><strong>Booked by:</strong> ${b.Tourist_Name} (${b.Tourist_Email})</p>` : ""}
      `;
      container.appendChild(div);
    });

  } catch (err) {
    console.error("❌ Error loading bookings:", err);
  }
}
