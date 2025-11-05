// public/js/main.js
async function loadPackages() {
  try {
    const response = await fetch('/api/packages');
    const packages = await response.json();
    const container = document.getElementById('packages');
    container.innerHTML = '';

    packages.forEach(pkg => {
      const card = document.createElement('div');
      card.className = 'card';
      card.innerHTML = `
        <h3>${pkg.Package_Name}</h3>
        <p><b>Destination:</b> ${pkg.Destination}</p>
        <p><b>Duration:</b> ${pkg.Duration_Days} days</p>
        <p><b>Cost:</b> ₹${pkg.Package_Cost}</p>
        <p>${pkg.Description}</p>
      `;
      container.appendChild(card);
    });
  } catch (error) {
    console.error('Error loading packages:', error);
  }
}

loadPackages();
