const TOKEN_KEY = 'token';
const FIRST_NAME_KEY = 'firstName';
const LAST_NAME_KEY = 'lastName';
const USERNAME_KEY = 'username';

function saveAuth(data)
{
    sessionStorage.setItem(TOKEN_KEY, data.token);
    sessionStorage.setItem(FIRST_NAME_KEY, data.firstName);
    sessionStorage.setItem(LAST_NAME_KEY, data.lastName);
    sessionStorage.setItem(USERNAME_KEY, data.username);
}

function getToken()
{
    return sessionStorage.getItem(TOKEN_KEY);
}

function getUser()
{
    return {
        firstName: sessionStorage.getItem(FIRST_NAME_KEY),
        lastName: sessionStorage.getItem(LAST_NAME_KEY),
        username: sessionStorage.getItem(USERNAME_KEY)
    };
}

function isLoggedIn()
{
    return getToken() !== null;
}

function requireAuth()
{
    if (!isLoggedIn())
    {
        window.location.href = 'index.html';
    }
}

function clearAuth()
{
    sessionStorage.removeItem(TOKEN_KEY);
    sessionStorage.removeItem(FIRST_NAME_KEY);
    sessionStorage.removeItem(LAST_NAME_KEY);
    sessionStorage.removeItem(USERNAME_KEY);
}

function doLogout()
{
    clearAuth();
    window.location.href = 'index.html';
}
