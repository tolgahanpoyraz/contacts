document.addEventListener('DOMContentLoaded', function()
{
    requireAuth();
    let user = getUser();
    document.getElementById("userName").innerHTML = "Logged in as " + user.firstName + " " + user.lastName;
    loadContacts();
}, false);

async function loadContacts()
{
    let token = getToken();
    try
    {
        let data = await getContacts(token);
        displayContacts(data.contacts);
    }
    catch(err)
    {
        document.getElementById("contactsResult").innerHTML = err.message;
    }
}

function displayContacts(contacts)
{
    let contactList = document.getElementById("contactList");
    contactList.innerHTML = "";

    if (contacts.length === 0)
    {
        contactList.innerHTML = "No contacts found";
        return;
    }

    for (let i = 0; i < contacts.length; i++)
    {
        let contact = contacts[i];
        contactList.innerHTML +=
            `<div class="contact">
                <span>${contact.firstName} ${contact.lastName}</span>
                <span>${contact.email}</span>
                <span>${contact.phone}</span>
                <button class="buttons" onclick="doEditContact(${contact.id}, '${contact.firstName}', '${contact.lastName}', '${contact.email}', '${contact.phone}')">Edit</button>
                <button class="buttons" onclick="doDeleteContact(${contact.id})">Delete</button>
            </div>`;
    }
}

async function doSearchContacts()
{
    let query = document.getElementById("searchText").value;
    let token = getToken();
    document.getElementById("contactsResult").innerHTML = "";

    try
    {
        let data = await getContacts(token, query);
        displayContacts(data.contacts);
    }
    catch(err)
    {
        document.getElementById("contactsResult").innerHTML = err.message;
    }
}

async function doAddContact()
{
    let firstName = document.getElementById("contactFirstName").value;
    let lastName = document.getElementById("contactLastName").value;
    let email = document.getElementById("contactEmail").value;
    let phone = document.getElementById("contactPhone").value;
    let token = getToken();
    document.getElementById("contactsResult").innerHTML = "";

    if (firstName === "" || lastName === "" || email === "" || phone === "")
    {
        document.getElementById("contactsResult").innerHTML = "All fields are required";
        return;
    }

    let emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email))
    {
        document.getElementById("contactsResult").innerHTML = "Please enter a valid email address";
        return;
    }

    try
    {
        await addContact(token, { firstName, lastName, email, phone });
        document.getElementById("contactsResult").innerHTML = "Contact has been added";
        document.getElementById("contactFirstName").value = "";
        document.getElementById("contactLastName").value = "";
        document.getElementById("contactEmail").value = "";
        document.getElementById("contactPhone").value = "";
        loadContacts();
    }
    catch(err)
    {
        document.getElementById("contactsResult").innerHTML = err.message;
    }
}

let currentEditId = null;

function doEditContact(contactId, firstName, lastName, email, phone)
{
    currentEditId = contactId;

    document.getElementById("editFirstName").value = firstName;
    document.getElementById("editLastName").value = lastName;
    document.getElementById("editEmail").value = email;
    document.getElementById("editPhone").value = phone;

    document.getElementById("editContactDiv").style.display = "block";
    document.getElementById("addContactDiv").style.display = "none";
}

async function doSaveContact()
{
    let firstName = document.getElementById("editFirstName").value;
    let lastName = document.getElementById("editLastName").value;
    let email = document.getElementById("editEmail").value;
    let phone = document.getElementById("editPhone").value;
    let token = getToken();
    document.getElementById("contactsResult").innerHTML = "";

    if (firstName === "" || lastName === "" || email === "" || phone === "")
    {
        document.getElementById("contactsResult").innerHTML = "All fields are required";
        return;
    }

    let emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email))
    {
        document.getElementById("contactsResult").innerHTML = "Please enter a valid email address";
        return;
    }

    try
    {
        await editContact(token, currentEditId, { firstName, lastName, email, phone });
        document.getElementById("contactsResult").innerHTML = "Contact has been updated";
        cancelEdit();
        loadContacts();
    }
    catch(err)
    {
        document.getElementById("contactsResult").innerHTML = err.message;
    }
}

function cancelEdit()
{
    currentEditId = null;
    document.getElementById("editContactDiv").style.display = "none";
    document.getElementById("addContactDiv").style.display = "block";
}


async function doDeleteContact(contactId)
{
    if (!confirm("Are you sure you want to delete this contact?"))
    {
        return;
    }

    let token = getToken();
    document.getElementById("contactsResult").innerHTML = "";

    try
    {
        await deleteContact(token, contactId);
        document.getElementById("contactsResult").innerHTML = "Contact has been deleted";
        loadContacts();
    }
    catch(err)
    {
        document.getElementById("contactsResult").innerHTML = err.message;
    }
}
