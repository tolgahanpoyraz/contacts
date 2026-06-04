function getToken() {
  return localStorage.getItem('token');
}

function isLoggedIn() {
  return !!getToken();
}

function saveAuth(authData) {
  localStorage.setItem('token',     authData.token);
  localStorage.setItem('firstName', authData.firstName);
  localStorage.setItem('lastName',  authData.lastName);
}

function clearAuth() {
  localStorage.removeItem('token');
  localStorage.removeItem('firstName');
  localStorage.removeItem('lastName');
}

async function handleLogin(username, password) {

  if (!username || !password) {
    throw new Error('Username and password are required.');
  }

  const data = await loginUser(username, password);

  saveAuth(data);

  window.location.href = 'contacts.html';
}

async function handleRegister(username, password, firstName, lastName) {
  if (!username || !password || !firstName || !lastName) {
    throw new Error('All fields are required.');
  }

  const data = await registerUser(username, password, firstName, lastName);

  saveAuth(data);

  window.location.href = 'contacts.html';
}

function handleLogout() {
  clearAuth();
  window.location.href = 'login.html';
}

function checkAuth() {
  if (!isLoggedIn()) {
    window.location.href = 'login.html';
  }
}