// ===============================
// 🧭 Admin Dashboard Script
// ===============================

console.log("✅ admin.js loaded successfully");

// ---------------- MAIN ----------------
document.addEventListener("DOMContentLoaded", async () => {
  await checkAdminSession();
  await loadPackages();
  await loadAllBookings();

  const form = document.getElementById("packageForm");
  if (form) form.addEventListener("submit", addPackage);
});

// ---------------- CHECK ADMIN SESSION ----------------
async function checkAdminSession() {
  try {
    const res = await fetch("/api/me", { credentials: "include" });
    const { user } = await res.json();

    if (!user) {
      alert("Please login as admin first.");
      location.href = "/login.html";
      return;
    }

    if (user.type !== "Admin") {
      alert("Access denied. Only admins can view this page.");
      location.href = "/";
      return;
    }

    console.log("👑 Logged in as Admin:", user.email);

    const logoutBtn = document.getElementById("logoutBtn");
    if (logoutBtn) {
      logoutBtn.addEventListener("click", async () => {
        await fetch("/api/logout", { method: "POST", credentials: "include" });
        location.href = "/";
      });
    }
  } catch (err) {
    console.error("❌ Error verifying admin:", err);
  }
}

// ---------------- ADD PACKAGE ----------------
async function addPackage(e) {
  e.preventDefault();
  const msg = document.getElementById("msg");

  const name = document.getElementById("name").value.trim();
  const destination = document.getElementById("destination").value.trim();
  const duration = document.getElementById("duration").value.trim();
  const cost = document.getElementById("cost").value.trim();
  const desc = document.getElementById("desc").value.trim();

  if (!name || !destination || !duration || !cost || !desc) {
    msg.textContent = "❌ Please fill all fields.";
    msg.style.color = "red";
    return;
  }

  try {
    const res = await fetch("/api/admin/package", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ name, destination, duration, cost, desc })
    });

    const result = await res.json();
    if (result.error) {
      msg.textContent = "❌ " + result.error;
      msg.style.color = "red";
    } else {
      msg.textContent = "✅ " + result.message;
      msg.style.color = "green";
      document.getElementById("packageForm").reset();
      await loadPackages(); // refresh list
    }
  } catch (err) {
    console.error("❌ Error adding package:", err);
    msg.textContent = "❌ Failed to add package.";
    msg.style.color = "red";
  }
}

// ---------------- LOAD PACKAGES ----------------
async function loadPackages() {
  try {
    const res = await fetch("/api/packages");
    const packages = await res.json();
    const container = document.getElementById("packages");
    container.innerHTML = "";

    if (!Array.isArray(packages) || packages.length === 0) {
      container.innerHTML = "<p>No packages found.</p>";
      return;
    }

    packages.forEach(pkg => {
      const div = document.createElement("div");
      div.className = "package";
      div.innerHTML = `
        <h3>${pkg.Package_Name}</h3>
        <p><strong>Destination:</strong> ${pkg.Destination}</p>
        <p><strong>Duration:</strong> ${pkg.Duration_Days} days</p>
        <p><strong>Cost:</strong> ₹${parseFloat(pkg.Package_Cost).toFixed(2)}</p>
        <p>${pkg.Description}</p>
        <button class="delete-btn" data-id="${pkg.Package_ID}">🗑 Delete</button>
      `;
      container.appendChild(div);
    });

    // Attach Delete handlers
    document.querySelectorAll(".delete-btn").forEach(btn => {
      btn.addEventListener("click", async e => {
        const id = e.target.dataset.id;
        if (confirm("Are you sure you want to delete this package?")) {
          await deletePackage(id);
        }
      });
    });
  } catch (err) {
    console.error("❌ Error loading packages:", err);
  }
}

// ---------------- DELETE PACKAGE ----------------
async function deletePackage(id) {
  try {
    const res = await fetch(`/api/admin/package/${id}`, {
      method: "DELETE",
      credentials: "include"
    });
    const result = await res.json();

    if (result.success) {
      alert("✅ Package deleted!");
      await loadPackages();
    } else {
      alert("❌ Failed to delete package.");
    }
  } catch (err) {
    console.error("❌ Error deleting package:", err);
  }
}

// ---------------- LOAD ALL BOOKINGS (ADMIN) ----------------
async function loadAllBookings() {
  try {
    const res = await fetch("/api/bookings", { credentials: "include" });
    const bookings = await res.json();
    const container = document.getElementById("bookings-container");
    container.innerHTML = "";

    if (!Array.isArray(bookings) || bookings.length === 0) {
      container.innerHTML = "<p>No bookings found.</p>";
      return;
    }

    bookings.forEach(b => {
      const card = document.createElement("div");
      card.className = "booking-card";
      card.innerHTML = `
        <h3>${b.Package_Name} <small>(${b.Destination})</small></h3>
        <p><strong>Booking ID:</strong> ${b.Booking_ID}</p>
        <p><strong>Tourist:</strong> ${b.Tourist_Name} (${b.Tourist_Email})</p>
        <p><strong>People:</strong> ${b.No_of_People}</p>
        <p><strong>Total:</strong> ₹${parseFloat(b.Total_Cost).toFixed(2)}</p>
        <p><strong>Status:</strong> ${b.Status}</p>
      `;
      container.appendChild(card);
    });

    console.log(`✅ Loaded ${bookings.length} bookings for admin.`);
  } catch (err) {
    console.error("❌ Error loading bookings:", err);
  }
}
