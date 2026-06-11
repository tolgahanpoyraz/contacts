const PAGE_SIZE = 10;
const MAX_PAGE_BUTTONS = 7;

let currentPage         = 1;
let currentQuery        = '';
let totalContacts       = 0;
let currentEditId       = null;
let searchDebounceTimer = null;

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

function onSearchInput()
{
    clearTimeout(searchDebounceTimer);
    searchDebounceTimer = setTimeout(doSearchContacts, 300);
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
        const nav = document.getElementById(id);
        nav.style.display = 'block';
        nav.querySelector('ol').innerHTML = html;
    });
}

function buildPaginationHTML(page, total)
{
    const pages = pageWindow(page, total);
    let html = '';

    // ← Previous
    if (page <= 1)
    {
        html += `<li><span class="disabled" aria-disabled="true">← Previous</span></li>`;
    }
    else
    {
        html += `<li><a tabindex="0" onclick="goToPage(${page - 1})" onkeydown="if(event.key==='Enter'||event.key===' ')goToPage(${page - 1})">← Previous</a></li>`;
    }

    // Page number buttons with gap logic
    let prev = 0;
    for (const p of pages)
    {
        if (p - prev > 1)
        {
            html += `<li><span class="gap" aria-hidden="true">…</span></li>`;
        }

        if (p === page)
        {
            html += `<li><a class="current" aria-current="page">${p}</a></li>`;
        }
        else
        {
            html += `<li><a tabindex="0" onclick="goToPage(${p})" onkeydown="if(event.key==='Enter'||event.key===' ')goToPage(${p})">${p}</a></li>`;
        }

        prev = p;
    }

    // Next →
    if (page >= total)
    {
        html += `<li><span class="disabled" aria-disabled="true">Next →</span></li>`;
    }
    else
    {
        html += `<li><a tabindex="0" onclick="goToPage(${page + 1})" onkeydown="if(event.key==='Enter'||event.key===' ')goToPage(${page + 1})">Next →</a></li>`;
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

// ── Field error helpers ───────────────────────────────────────────────────────
function setFieldError(inputId, hasError)
{
    const wrap = document.getElementById('wrap-' + inputId);
    const input = document.getElementById(inputId);
    if (!wrap) return;
    if (hasError)
    {
        wrap.classList.add('error');
        input.setAttribute('aria-invalid', 'true');
    }
    else
    {
        wrap.classList.remove('error');
        input.removeAttribute('aria-invalid');
    }
}

function clearFieldErrors(ids)
{
    ids.forEach(id => setFieldError(id, false));
}

function validateFields(fields)
{
    // fields: array of { id, value, validator? }
    // returns true if all valid, marks errors on invalid ones
    let valid = true;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    fields.forEach(({ id, value, type }) =>
    {
        if (!value || (type === 'email' && !emailRegex.test(value)))
        {
            setFieldError(id, true);
            valid = false;
        }
        else
        {
            setFieldError(id, false);
        }
    });
    return valid;
}

// ── Add contact ────────────────────────────────────────────────────────────────
async function doAddContact()
{
    const firstName = document.getElementById('contactFirstName').value;
    const lastName  = document.getElementById('contactLastName').value;
    const email     = document.getElementById('contactEmail').value;
    const phone     = document.getElementById('contactPhone').value;
    const token     = getToken();
    const resultEl  = document.getElementById('addContactResult');
    resultEl.innerHTML = '';

    const valid = validateFields([
        { id: 'contactFirstName', value: firstName },
        { id: 'contactLastName',  value: lastName  },
        { id: 'contactEmail',     value: email, type: 'email' },
        { id: 'contactPhone',     value: phone  },
    ]);
    if (!valid) return;

    try
    {
        await addContact(token, { firstName, lastName, email, phone });
        resultEl.innerHTML = 'Contact has been added';
        document.getElementById('contactFirstName').value = '';
        document.getElementById('contactLastName').value  = '';
        document.getElementById('contactEmail').value     = '';
        document.getElementById('contactPhone').value     = '';
        clearFieldErrors(['contactFirstName', 'contactLastName', 'contactEmail', 'contactPhone']);
        await fetchAndDisplay();
    }
    catch (err)
    {
        resultEl.innerHTML = err.message;
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
    document.getElementById('editContactResult').innerHTML = '';
    clearFieldErrors(['editFirstName', 'editLastName', 'editEmail', 'editPhone']);
    document.getElementById('editContactDiv').style.display = 'block';
    document.getElementById('addContactDiv').style.display  = 'none';
    // Scroll the edit panel into view
    document.getElementById('editContactDiv').scrollIntoView({ behavior: 'smooth', block: 'start' });
}

async function doSaveContact()
{
    const firstName = document.getElementById('editFirstName').value;
    const lastName  = document.getElementById('editLastName').value;
    const email     = document.getElementById('editEmail').value;
    const phone     = document.getElementById('editPhone').value;
    const token     = getToken();
    const resultEl  = document.getElementById('editContactResult');
    resultEl.innerHTML = '';

    const valid = validateFields([
        { id: 'editFirstName', value: firstName },
        { id: 'editLastName',  value: lastName  },
        { id: 'editEmail',     value: email, type: 'email' },
        { id: 'editPhone',     value: phone  },
    ]);
    if (!valid) return;

    try
    {
        await editContact(token, currentEditId, { firstName, lastName, email, phone });
        resultEl.innerHTML = 'Contact has been updated';
        cancelEdit();
        await fetchAndDisplay();
    }
    catch (err)
    {
        resultEl.innerHTML = err.message;
    }
}

function cancelEdit()
{
    currentEditId = null;
    clearFieldErrors(['editFirstName', 'editLastName', 'editEmail', 'editPhone']);
    document.getElementById('editContactResult').innerHTML = '';
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

// ── Phone formatting ───────────────────────────────────────────────────────────
function formatPhone(input)
{
    // Strip everything except digits
    let digits = input.value.replace(/\D/g, '').slice(0, 10);

    // Auto-format as user types
    if (digits.length === 0)
    {
        input.value = '';
    }
    else if (digits.length <= 3)
    {
        input.value = `(${digits}`;
    }
    else if (digits.length <= 6)
    {
        input.value = `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
    }
    else
    {
        input.value = `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
    }
}
