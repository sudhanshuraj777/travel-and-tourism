console.log("✅ index.js loaded successfully");

// ---------------- INITIALIZE ----------------
document.addEventListener('DOMContentLoaded', () => {
  checkUserSession();
  loadPackages();
});

// ---------------- CHECK USER SESSION ----------------
async function checkUserSession() {
  try {
    const res = await fetch('/api/me', { credentials: 'include' });
    const data = await res.json();
    console.log("User session data:", data);

    const nav = document.getElementById('navLinks');
    if (!nav) {
      console.error("❌ navLinks not found in HTML!");
      return;
    }

    // ✅ User is logged in
    if (data.user) {
      const user = data.user;

      // ✅ Admin Navbar
      if (user.type === 'Admin') {
        nav.innerHTML = `
          <a href="/">Home</a> |
          <a href="/admin.html">Admin Dashboard</a> |
          <a href="#" id="logoutBtn">Logout</a>
        `;
      } 
      // ✅ Tourist Navbar
      else {
        nav.innerHTML = `
          <a href="/">Home</a> |
          <a href="/bookings.html">My Bookings</a> |
          <a href="#" id="logoutBtn">Logout</a>
        `;
      }

      // ✅ Logout functionality
      const logoutBtn = document.getElementById('logoutBtn');
      logoutBtn.addEventListener('click', async () => {
        await fetch('/api/logout', { method: 'POST', credentials: 'include' });
        location.href = '/';
      });

    } 
    // ✅ Not logged in
    else {
      nav.innerHTML = `
        <a href="/">Home</a> |
        <a href="/register.html">Register</a> |
        <a href="/login.html">Login</a>
      `;
    }
  } catch (err) {
    console.error("Error checking session:", err);
  }
}

// ---------------- LOAD PACKAGES ----------------
async function loadPackages() {
  try {
    const res = await fetch('/api/packages');
    const packages = await res.json();
    const container = document.getElementById('packages');
    const msg = document.getElementById('msg');
    container.innerHTML = '';

    if (!Array.isArray(packages) || packages.length === 0) {
      container.innerHTML = '<p>No packages available.</p>';
      return;
    }

    // ✅ Display all packages
    packages.forEach(pkg => {
      const div = document.createElement('div');
      div.className = 'package';
      div.innerHTML = `
        <h3>${pkg.Package_Name}</h3>
        <p><strong>Destination:</strong> ${pkg.Destination}</p>
        <p><strong>Duration:</strong> ${pkg.Duration_Days} days</p>
        <p><strong>Cost:</strong> ₹${parseFloat(pkg.Package_Cost).toFixed(2)}</p>
        <p>${pkg.Description}</p>
        <button class="book-btn" data-id="${pkg.Package_ID}" data-cost="${pkg.Package_Cost}">
          Book Now
        </button>
      `;
      container.appendChild(div);
    });

    // ✅ Handle “Book Now” clicks
    document.querySelectorAll('.book-btn').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        const packageId = e.target.dataset.id;
        const people = prompt('Enter number of people:');
        if (!people || isNaN(people) || people <= 0) return alert('Invalid number!');

        const res = await fetch('/api/book', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ package_id: packageId, no_of_people: parseInt(people) })
        });
        const result = await res.json();

        if (result.error) {
          msg.textContent = '❌ ' + result.error;
          msg.style.color = 'red';
        } else {
          msg.textContent = `✅ ${result.message} (Total ₹${result.total_cost})`;
          msg.style.color = 'green';
        }
      });
    });

  } catch (err) {
    console.error("Error loading packages:", err);
  }
}
