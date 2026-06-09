const PAGE_SIZE = 10;
const MAX_PAGE_BUTTONS = 7;

let currentPage   = 1;
let currentQuery  = '';
let totalContacts = 0;
let currentEditId = null;

// ── Bootstrap ──────────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', function ()
{
    requireAuth();
    const user = getUser();
    document.getElementById('userName').innerHTML =
        'Logged in as ' + user.firstName + ' ' + user.lastName;
    fetchAndDisplay();
}, false);

// ── Search ─────────────────────────────────────────────────────────────────────
async function doSearchContacts()
{
    currentQuery = document.getElementById('searchText').value;
    currentPage  = 1;
    await fetchAndDisplay();
}

// ── Core fetch + render ────────────────────────────────────────────────────────
async function fetchAndDisplay()
{
    const token = getToken();
    document.getElementById('contactsResult').innerHTML = '';
    try
    {
        const data = await getContacts(token, currentQuery, currentPage, PAGE_SIZE);
        totalContacts = data.total;
        displayContacts(data.contacts);
        renderPagination();
    }
    catch (err)
    {
        document.getElementById('contactsResult').innerHTML = err.message;
    }
}

// ── Display contacts ───────────────────────────────────────────────────────────
function displayContacts(contacts)
{
    const list = document.getElementById('contactList');
    list.innerHTML = '';

    if (contacts.length === 0)
    {
        list.innerHTML = '<p style="color:var(--muted);font-style:italic;">No contacts found.</p>';
        return;
    }

    for (const contact of contacts)
    {
        list.innerHTML +=
            `<div class="contact">
                <span>${contact.firstName} ${contact.lastName}</span>
                <span>${contact.email}</span>
                <span>${contact.phone}</span>
                <button class="buttons" onclick="doEditContact(${contact.id},'${contact.firstName}','${contact.lastName}','${contact.email}','${contact.phone}')">Edit</button>
                <button class="buttons" onclick="doDeleteContact(${contact.id})">Delete</button>
            </div>`;
    }
}

// ── Pagination rendering ───────────────────────────────────────────────────────
function renderPagination()
{
    const totalPages = Math.ceil(totalContacts / PAGE_SIZE);
    const ids = ['paginationTop', 'paginationBottom'];

    if (totalPages <= 1)
    {
        ids.forEach(id => { document.getElementById(id).style.display = 'none'; });
        return;
    }

    const html = buildPaginationHTML(currentPage, totalPages);
    ids.forEach(id =>
    {
        const el = document.getElementById(id);
        el.style.display = 'flex';
        el.innerHTML = html;
    });
}

function buildPaginationHTML(page, total)
{
    const pages = pageWindow(page, total);
    let html = '';

    // ← Previous
    if (page <= 1)
    {
        html += `<li><span class="disabled">← Previous</span></li>`;
    }
    else
    {
        html += `<li><a onclick="goToPage(${page - 1})">← Previous</a></li>`;
    }

    // Page number buttons with gap logic
    let prev = 0;
    for (const p of pages)
    {
        if (p - prev > 1)
        {
            html += `<li><span class="gap">…</span></li>`;
        }

        if (p === page)
        {
            html += `<li><a class="current" aria-current="page">${p}</a></li>`;
        }
        else
        {
            html += `<li><a onclick="goToPage(${p})">${p}</a></li>`;
        }

        prev = p;
    }

    // Next →
    if (page >= total)
    {
        html += `<li><span class="disabled">Next →</span></li>`;
    }
    else
    {
        html += `<li><a onclick="goToPage(${page + 1})">Next →</a></li>`;
    }

    return html;
}

// Builds the set of page numbers to show.
// Always includes page 1 and the last page.
// Shows up to MAX_PAGE_BUTTONS pages in a window around the current page.
function pageWindow(current, total)
{
    if (total <= MAX_PAGE_BUTTONS)
    {
        return Array.from({ length: total }, (_, i) => i + 1);
    }

    const half = Math.floor((MAX_PAGE_BUTTONS - 2) / 2);
    let start  = Math.max(2, current - half);
    let end    = Math.min(total - 1, current + half);

    // Keep the window full when near the edges
    if (current - half <= 2)
    {
        end = Math.min(total - 1, MAX_PAGE_BUTTONS - 1);
    }
    if (current + half >= total - 1)
    {
        start = Math.max(2, total - MAX_PAGE_BUTTONS + 2);
    }

    const middle = Array.from({ length: end - start + 1 }, (_, i) => start + i);
    return [1, ...middle, total];
}

function goToPage(p)
{
    currentPage = p;
    fetchAndDisplay();
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ── Add contact ────────────────────────────────────────────────────────────────
async function doAddContact()
{
    const firstName = document.getElementById('contactFirstName').value;
    const lastName  = document.getElementById('contactLastName').value;
    const email     = document.getElementById('contactEmail').value;
    const phone     = document.getElementById('contactPhone').value;
    const token     = getToken();
    document.getElementById('addContactsResult').innerHTML = '';

    if (!firstName || !lastName || !email || !phone)
    {
        document.getElementById('addContactsResult').innerHTML = 'All fields are required';
        return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
    {
        document.getElementById('addContactsResult').innerHTML = 'Please enter a valid email address';
        return;
    }

    try
    {
        await addContact(token, { firstName, lastName, email, phone });
        document.getElementById('addContactsResult').innerHTML = 'Contact has been added';
        document.getElementById('contactFirstName').value = '';
        document.getElementById('contactLastName').value  = '';
        document.getElementById('contactEmail').value     = '';
        document.getElementById('contactPhone').value     = '';
        // Re-run the current search so the list reflects the change
        await fetchAndDisplay();
    }
    catch (err)
    {
        document.getElementById('addContactsResult').innerHTML = err.message;
    }
}

// ── Edit contact ───────────────────────────────────────────────────────────────
function doEditContact(contactId, firstName, lastName, email, phone)
{
    currentEditId = contactId;
    document.getElementById('editFirstName').value = firstName;
    document.getElementById('editLastName').value  = lastName;
    document.getElementById('editEmail').value     = email;
    document.getElementById('editPhone').value     = phone;
    document.getElementById('editContactDiv').style.display = 'block';
    document.getElementById('addContactDiv').style.display  = 'none';
}

async function doSaveContact()
{
    const firstName = document.getElementById('editFirstName').value;
    const lastName  = document.getElementById('editLastName').value;
    const email     = document.getElementById('editEmail').value;
    const phone     = document.getElementById('editPhone').value;
    const token     = getToken();
    document.getElementById('editContactsResult').innerHTML = '';

    if (!firstName || !lastName || !email || !phone)
    {
        document.getElementById('editContactsResult').innerHTML = 'All fields are required';
        return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
    {
        document.getElementById('editContactsResult').innerHTML = 'Please enter a valid email address';
        return;
    }

    try
    {
        await editContact(token, currentEditId, { firstName, lastName, email, phone });
        document.getElementById('editContactsResult').innerHTML = 'Contact has been updated';
        cancelEdit();
        await fetchAndDisplay();
    }
    catch (err)
    {
        document.getElementById('editContactsResult').innerHTML = err.message;
    }
}

function cancelEdit()
{
    currentEditId = null;
    document.getElementById('editContactDiv').style.display = 'none';
    document.getElementById('addContactDiv').style.display  = 'block';
}

// ── Delete contact ─────────────────────────────────────────────────────────────
async function doDeleteContact(contactId)
{
    if (!confirm('Are you sure you want to delete this contact?')) return;

    const token = getToken();
    document.getElementById('contactsResult').innerHTML = '';

    try
    {
        await deleteContact(token, contactId);
        document.getElementById('contactsResult').innerHTML = 'Contact has been deleted';
        // If deleting the last item on this page, step back one page
        const remaining = totalContacts - 1;
        const maxPage   = Math.max(1, Math.ceil(remaining / PAGE_SIZE));
        if (currentPage > maxPage) currentPage = maxPage;
        await fetchAndDisplay();
    }
    catch (err)
    {
        document.getElementById('contactsResult').innerHTML = err.message;
    }
}
