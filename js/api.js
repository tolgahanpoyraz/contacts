const urlBase = 'https://COP4331-9.com/api';
const extension = 'php';

async function loginUser(username, password) {
  let response;
  let data;

  response = await fetch(`${urlBase}/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  });

  data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || 'Login failed');
  }

  return data;

}

async function registerUser(username, password, firstName, lastName) {
  let response;
  let data;

  response = await fetch(`${urlBase}/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password, firstName, lastName }),
  });

  data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || 'Registration failed');
  }

  return data;
}

async function getContacts(token, query = '', page = 1, limit = 10) {
    const params = new URLSearchParams();
    if (query) params.set('q', query);
    params.set('page', page);
    params.set('limit', limit);

    const url = `${urlBase}/contacts?${params}`;
    const response = await fetch(url, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
        },
    });
    const data = await response.json();
    if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch contacts');
    }
    return data;
}


async function addContact(token, contactData) {
  let response;
  let data;
  
  response = await fetch(`${urlBase}/contacts`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify(contactData),
  });

  data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || 'Failed to add contact');
  }

  return data;
}

async function editContact(token, contactId, patchData) {
  let response;
  let data;

  response = await fetch(`${urlBase}/contacts/${contactId}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify(patchData),
  });

  data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || 'Failed to update contact');
  }

  return data;
}

async function deleteContact(token, contactId) {
  let response;
  let data;

  response = await fetch(`${urlBase}/contacts/${contactId}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    data = await response.json().catch(() => ({}));
    throw new Error(data.error || 'Failed to delete contact');
  }
}
