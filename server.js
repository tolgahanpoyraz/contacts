/**
 * mock-server.js
 *
 * A fully working mock backend for the Personal Contacts Manager.
 * Matches every endpoint in the Swagger spec exactly.
 *
 * Run:  node server.js
 * URL:  http://localhost:8000
 *
 * No real database — data lives in memory while the server is running.
 * Restart the server = data resets to the seed data below.
 */
 
const express = require('express');
const jwt     = require('jsonwebtoken');
const bcrypt  = require('bcryptjs');
const cors    = require('cors');
 
const app    = express();
const PORT   = 8000;
const SECRET = 'mock-jwt-secret-key'; // only for local development
 
// ─────────────────────────────────────────────────────
// Middleware
// ─────────────────────────────────────────────────────
 
app.use(cors());                   // allow requests from your HTML files
app.use(express.json());           // parse JSON request bodies
 
// ─────────────────────────────────────────────────────
// In-memory "database"
// ─────────────────────────────────────────────────────
 
// Pre-hashed password for seed users: "password123"
const HASHED_PASSWORD = bcrypt.hashSync('password123', 10);
 
// Users table
const users = [
  { id: 1, username: 'johndoe', password: HASHED_PASSWORD, firstName: 'John', lastName: 'Doe' },
  { id: 2, username: 'janedoe', password: HASHED_PASSWORD, firstName: 'Jane', lastName: 'Doe' },
];
 
// Contacts table  (each contact belongs to a userId)
const contacts = [
  { id: 1, userId: 1, firstName: 'Alice',   lastName: 'Smith',   email: 'alice@example.com',   phone: '555-0101' },
  { id: 2, userId: 1, firstName: 'Bob',     lastName: 'Johnson', email: 'bob@example.com',     phone: '555-0102' },
  { id: 3, userId: 1, firstName: 'Carol',   lastName: 'Williams',email: 'carol@example.com',   phone: '555-0103' },
  { id: 4, userId: 2, firstName: 'David',   lastName: 'Brown',   email: 'david@example.com',   phone: '555-0104' },
];
 
// Simple auto-increment counters
let nextUserId    = 3;
let nextContactId = 5;
 
// ─────────────────────────────────────────────────────
// Helper: verify JWT from Authorization header
// Returns the decoded payload or null
// ─────────────────────────────────────────────────────
 
function verifyToken(req) {
  const authHeader = req.headers['authorization'];
  if (!authHeader || !authHeader.startsWith('Bearer ')) return null;
 
  const token = authHeader.split(' ')[1]; // "Bearer <token>" → "<token>"
 
  try {
    return jwt.verify(token, SECRET); // { userId, username, iat, exp }
  } catch {
    return null; // expired or tampered token
  }
}
 
// ─────────────────────────────────────────────────────
// Helper: middleware that protects routes requiring auth
// ─────────────────────────────────────────────────────
 
function requireAuth(req, res, next) {
  const payload = verifyToken(req);
 
  if (!payload) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
 
  req.userId = payload.userId; // attach userId so route handlers can use it
  next();
}
 
// ─────────────────────────────────────────────────────
// POST /login
// ─────────────────────────────────────────────────────
 
app.post('/login', (req, res) => {
  const { username, password } = req.body;
 
  // 400 — missing fields
  const missingFields = [];
  if (!username) missingFields.push('username');
  if (!password) missingFields.push('password');
 
  if (missingFields.length > 0) {
    return res.status(400).json({
      error: 'Missing required fields',
      fields: missingFields,
    });
  }
 
  // 401 — user not found
  const user = users.find(u => u.username === username);
  if (!user) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }
 
  // 401 — wrong password
  const passwordMatch = bcrypt.compareSync(password, user.password);
  if (!passwordMatch) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }
 
  // 200 — success
  const token = jwt.sign(
    { userId: user.id, username: user.username },
    SECRET,
    { expiresIn: '24h' }
  );
 
  return res.status(200).json({
    token,
    firstName: user.firstName,
    lastName:  user.lastName,
  });
});
 
// ─────────────────────────────────────────────────────
// POST /register
// ─────────────────────────────────────────────────────
 
app.post('/register', (req, res) => {
  const { username, password, firstName, lastName } = req.body;
 
  // 400 — missing fields
  const missingFields = [];
  if (!username)   missingFields.push('username');
  if (!password)   missingFields.push('password');
  if (!firstName)  missingFields.push('firstName');
  if (!lastName)   missingFields.push('lastName');
 
  if (missingFields.length > 0) {
    return res.status(400).json({
      error: 'Missing required fields',
      fields: missingFields,
    });
  }
 
  // 409 — username already taken
  const existing = users.find(u => u.username === username);
  if (existing) {
    return res.status(409).json({ error: 'Username already taken' });
  }
 
  // 201 — create the user
  const hashedPassword = bcrypt.hashSync(password, 10);
  const newUser = {
    id:        nextUserId++,
    username,
    password:  hashedPassword,
    firstName,
    lastName,
  };
  users.push(newUser);
 
  const token = jwt.sign(
    { userId: newUser.id, username: newUser.username },
    SECRET,
    { expiresIn: '24h' }
  );
 
  return res.status(201).json({
    token,
    firstName: newUser.firstName,
    lastName:  newUser.lastName,
  });
});
 
// ─────────────────────────────────────────────────────
// GET /contacts  (optionally ?q=searchTerm)
// ─────────────────────────────────────────────────────
 
app.get('/contacts', requireAuth, (req, res) => {
  const { q } = req.query;
 
  // Filter by userId first (users only see their own contacts)
  let result = contacts.filter(c => c.userId === req.userId);
 
  // If a search query is provided, filter by name or email
  if (q) {
    const term = q.toLowerCase();
    result = result.filter(c =>
      c.firstName.toLowerCase().includes(term) ||
      c.lastName.toLowerCase().includes(term)  ||
      c.email.toLowerCase().includes(term)
    );
  }
 
  // Strip userId before sending (not part of the API contract)
  const sanitized = result.map(({ userId, ...contact }) => contact);
 
  return res.status(200).json({ contacts: sanitized });
});
 
// ─────────────────────────────────────────────────────
// POST /contacts
// ─────────────────────────────────────────────────────
 
app.post('/contacts', requireAuth, (req, res) => {
  const { firstName, lastName, email, phone } = req.body;
 
  // 400 — missing or invalid fields
  const missingFields = [];
  if (!firstName) missingFields.push('firstName');
  if (!lastName)  missingFields.push('lastName');
  if (!email)     missingFields.push('email');
  if (!phone)     missingFields.push('phone');
 
  if (missingFields.length > 0) {
    return res.status(400).json({
      error: 'Missing required fields',
      fields: missingFields,
    });
  }
 
  // Basic email format check
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({
      error: 'Invalid email format',
      fields: ['email'],
    });
  }
 
  // 201 — create contact
  const newContact = {
    id: nextContactId++,
    userId: req.userId,
    firstName,
    lastName,
    email,
    phone,
  };
  contacts.push(newContact);
 
  const { userId, ...sanitized } = newContact;
  return res.status(201).json({ contact: sanitized });
});
 
// ─────────────────────────────────────────────────────
// PATCH /contacts/:contactId
// ─────────────────────────────────────────────────────
 
app.patch('/contacts/:contactId', requireAuth, (req, res) => {
  const contactId = parseInt(req.params.contactId, 10);
  const index     = contacts.findIndex(
    c => c.id === contactId && c.userId === req.userId
  );
 
  // 404 — not found (or belongs to a different user)
  if (index === -1) {
    return res.status(404).json({ error: 'Contact not found' });
  }
 
  const { firstName, lastName, email, phone } = req.body;
 
  // Validate email format if provided
  if (email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        error: 'Invalid field value',
        fields: ['email'],
      });
    }
  }
 
  // Apply only the fields that were sent (PATCH semantics)
  if (firstName !== undefined) contacts[index].firstName = firstName;
  if (lastName  !== undefined) contacts[index].lastName  = lastName;
  if (email     !== undefined) contacts[index].email     = email;
  if (phone     !== undefined) contacts[index].phone     = phone;
 
  const { userId, ...sanitized } = contacts[index];
  return res.status(200).json({ contact: sanitized });
});
 
// ─────────────────────────────────────────────────────
// DELETE /contacts/:contactId
// ─────────────────────────────────────────────────────
 
app.delete('/contacts/:contactId', requireAuth, (req, res) => {
  const contactId = parseInt(req.params.contactId, 10);
  const index     = contacts.findIndex(
    c => c.id === contactId && c.userId === req.userId
  );
 
  // 404 — not found
  if (index === -1) {
    return res.status(404).json({ error: 'Contact not found' });
  }
 
  contacts.splice(index, 1);
 
  return res.status(204).send(); // 204 = No Content, no body
});
 
// ─────────────────────────────────────────────────────
// Start the server
// ─────────────────────────────────────────────────────
 
app.listen(PORT, () => {
  console.log(`
╔══════════════════════════════════════════╗
║       Mock Contacts API is running       ║
╠══════════════════════════════════════════╣
║  URL  →  http://localhost:${PORT}           ║
╠══════════════════════════════════════════╣
║  Seed users (password: password123)      ║
║    username: johndoe  (3 contacts)       ║
║    username: janedoe  (1 contact)        ║
╠══════════════════════════════════════════╣
║  Endpoints                               ║
║    POST   /login                         ║
║    POST   /register                      ║
║    GET    /contacts?q=                   ║
║    POST   /contacts                      ║
║    PATCH  /contacts/:id                  ║
║    DELETE /contacts/:id                  ║
╚══════════════════════════════════════════╝
  `);
});