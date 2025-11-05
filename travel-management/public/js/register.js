document.getElementById('registerForm').onsubmit = async (e) => {
  e.preventDefault();
  const f = e.target;
  const data = {
    full_name: f.full_name.value,
    email: f.email.value,
    password: f.password.value,
    contact_no: f.contact_no.value,
    address: f.address.value
  };
  const res = await fetch('/api/register', {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify(data)
  });
  const result = await res.json();
  const msg = document.getElementById('msg');
  if (result.error) {
    msg.textContent = result.error;
    msg.style.color = 'red';
  } else {
    msg.textContent = '✅ Registered successfully! Redirecting...';
    msg.style.color = 'green';
    setTimeout(() => location.href = '/login.html', 1500);
  }
};
