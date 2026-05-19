// ===== AUTH MANAGEMENT =====
// In production: replace with Spring Boot JWT API calls

let currentUser = JSON.parse(localStorage.getItem("pt_user") || "null");

// Mock users DB
const MOCK_USERS = [
  { id:1, name:"Admin User", email:"admin@pageturn.vn", password:"admin123", role:"admin", phone:"0912345678" },
  { id:2, name:"Test User", email:"user@pageturn.vn", password:"user1234", role:"user", phone:"0987654321" },
];
let users = JSON.parse(localStorage.getItem("pt_users") || JSON.stringify(MOCK_USERS));

function openAuth(tab = "login") {
  const modal = document.getElementById("auth-modal");
  if (modal) {
    modal.classList.remove("hidden");
    switchTab(tab);
  }
}

function closeAuth() {
  document.getElementById("auth-modal")?.classList.add("hidden");
}

function switchTab(tab) {
  document.querySelectorAll(".auth-tab").forEach((t, i) => {
    t.classList.toggle("active", (i === 0 && tab === "login") || (i === 1 && tab === "register"));
  });
  document.getElementById("login-form")?.classList.toggle("hidden", tab !== "login");
  document.getElementById("register-form")?.classList.toggle("hidden", tab !== "register");
}

function clearErr(fieldId) {
  const el = document.getElementById(fieldId);
  const errEl = document.getElementById(fieldId + "-err");
  if (el) el.classList.remove("error");
  if (errEl) errEl.textContent = "";
}

function showFieldErr(fieldId, msg) {
  const el = document.getElementById(fieldId);
  const errEl = document.getElementById(fieldId + "-err");
  if (el) el.classList.add("error");
  if (errEl) errEl.textContent = msg;
  return false;
}

function validateEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}
function validatePhone(phone) {
  return /^\d{9,11}$/.test(phone);  
}

function handleLogin() {
  const email = document.getElementById("login-email")?.value.trim();
  const pass = document.getElementById("login-pass")?.value;
  let valid = true;

  if (!email) { showFieldErr("login-email", "Email is required"); valid = false; }
  else if (!validateEmail(email)) { showFieldErr("login-email", "Invalid email format"); valid = false; }
  if (!pass) { showFieldErr("login-pass", "Password is required"); valid = false; }
  else if (pass.length < 6) { showFieldErr("login-pass", "Password too short"); valid = false; }
  if (!valid) return;

  // Mock authentication — replace with: POST /api/auth/login
  const user = users.find(u => u.email === email && u.password === pass);
  if (!user) {
    showFieldErr("login-pass", "Incorrect email or password");
    return;
  }

  const remember = document.getElementById("remember")?.checked;
  currentUser = { id: user.id, name: user.name, email: user.email, role: user.role };
  localStorage.setItem("pt_user", JSON.stringify(currentUser));
  if (remember) localStorage.setItem("pt_remember", "true");

  currentUser = { id: user.id, name: user.name, email: user.email, role: user.role };
  localStorage.setItem("pt_user", JSON.stringify(currentUser));

  closeAuth();
  updateAuthUI();
  showToast(`Welcome back, ${user.name}! 👋`, "success");

  if (user.role === "admin") {
    // Submit form tới Spring Security
    const form = document.createElement("form");
    form.method = "POST";
    form.action = "/login";  // Spring Security endpoint
    
    const u = document.createElement("input");
    u.type = "hidden"; u.name = "username"; u.value = email;
    
    const p = document.createElement("input");
    p.type = "hidden"; p.name = "password"; p.value = pass;
    
    document.body.appendChild(form);
    form.appendChild(u);
    form.appendChild(p);
    form.submit();
    return;
  }

  if (cart.length > 0) {
    setTimeout(() => window.location.href = "/checkout", 800);
  }
}

function handleRegister() {
  const name = document.getElementById("reg-name")?.value.trim();
  const email = document.getElementById("reg-email")?.value.trim();
  const phone = document.getElementById("reg-phone")?.value.trim();
  const pass = document.getElementById("reg-pass")?.value;
  let valid = true;

  if (!name || name.length < 2) { showFieldErr("reg-name", "Name must be at least 2 characters"); valid = false; }
  if (!email) { showFieldErr("reg-email", "Email is required"); valid = false; }
  else if (!validateEmail(email)) { showFieldErr("reg-email", "Invalid email format"); valid = false; }
  else if (users.find(u => u.email === email)) { showFieldErr("reg-email", "Email already registered"); valid = false; }
  if (!phone) { showFieldErr("reg-phone", "Phone is required"); valid = false; }
  else if (!validatePhone(phone)) { showFieldErr("reg-phone", "Phone must be 9-11 digits only"); valid = false; }
  if (!pass || pass.length < 8) { showFieldErr("reg-pass", "Password must be at least 8 characters"); valid = false; }
  if (!valid) return;

  // Mock registration — replace with: POST /api/auth/register
  const newUser = { id: users.length + 1, name, email, phone, password: pass, role: "user" };
  users.push(newUser);
  localStorage.setItem("pt_users", JSON.stringify(users));

  currentUser = { id: newUser.id, name, email, role: "user" };
  localStorage.setItem("pt_user", JSON.stringify(currentUser));
  closeAuth();
  updateAuthUI();
  showToast(`Welcome to PageTurn, ${name}! 🎉`, "success");
}

function handleLogout() {
  currentUser = null;
  localStorage.removeItem("pt_user");
  localStorage.removeItem("pt_remember");
  updateAuthUI();
  showToast("Signed out successfully", "info");
}

function showForgotPassword() {
  showToast("Password reset email sent (demo only)", "info");
}

function updateAuthUI() {
  const authLinks = document.getElementById("nav-auth-links");
  const userLinks = document.getElementById("nav-user-links");
  const adminBtn = document.getElementById("admin-btn");
  const usernameEl = document.getElementById("nav-username");
  if (!authLinks) return;

  if (currentUser) {
    authLinks.classList.add("hidden");
    userLinks?.classList.remove("hidden");
    if (usernameEl) usernameEl.textContent = currentUser.name;
    if (adminBtn) adminBtn.style.display = currentUser.role === "admin" ? "block" : "none";
  } else {
    authLinks.classList.remove("hidden");
    userLinks?.classList.add("hidden");
    if (adminBtn) adminBtn.style.display = "none";
  }
}

// Close modal on overlay click
document.getElementById("auth-modal")?.addEventListener("click", function(e) {
  if (e.target === this) closeAuth();
});
document.getElementById("cart-sidebar")?.addEventListener("click", function(e) {
  if (e.target === this) toggleCart();
});

updateAuthUI();
