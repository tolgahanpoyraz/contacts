// const urlBase = 'http://COP4331-9.com/api';
// const extension = 'php';

const urlBase = 'http://localhost:8000';

let userId = 0;
let firstName = "";
let lastName = "";
let token = "";

function doLogin()
{
    userId = 0;
    firstName = "";
    lastName = "";
    token = "";

    let username = document.getElementById("loginName").value;
    let password = document.getElementById("loginPassword").value;

    document.getElementById("loginResult").innerHTML = "";

    let tmp = { username: username, password: password };
    let jsonPayload = JSON.stringify( tmp );

    let url = urlBase + '/login';

    let xhr = new XMLHttpRequest();
    xhr.open("POST", url, true);
    xhr.setRequestHeader("Content-type", "application/json; charset=UTF-8");

    try
    {
        xhr.onreadystatechange = function()
        {
            if (this.readyState == 4)
            {
                if (this.status == 200)
                {
                    let jsonObject = JSON.parse( xhr.responseText );

                    token = jsonObject.token;
                    firstName = jsonObject.firstName;
                    lastName = jsonObject.lastName;

                    saveSession();

                    window.location.href = "contacts.html";
                }
				else if (this.status == 401)
                {
                    document.getElementById("loginResult").innerHTML = "User/Password combination incorrect";
                }
				else if (this.status == 400)
                {
                    let res = JSON.parse( xhr.responseText );
                    document.getElementById("loginResult").innerHTML = "Missing fields: " + (res.fields || []).join(", ");
                }
                else
                {
                    document.getElementById("loginResult").innerHTML = "Server error. Please try again.";
                }
            }
        };
        xhr.send(jsonPayload);
    }
    catch(err)
    {
        document.getElementById("loginResult").innerHTML = err.message;
    }
}
 
function doRegister()
{
    let username = document.getElementById("regUsername").value.trim();
    let password = document.getElementById("regPassword").value;
    let first = document.getElementById("regFirstName").value.trim();
    let last = document.getElementById("regLastName").value.trim();

    document.getElementById("registerResult").innerHTML = "";

    let tmp = { username: username, password: password, firstName: first, lastName: last };
    let jsonPayload = JSON.stringify( tmp );

    let url = urlBase + '/register';

    let xhr = new XMLHttpRequest();
    xhr.open("POST", url, true);
    xhr.setRequestHeader("Content-type", "application/json; charset=UTF-8");

    try
    {
        xhr.onreadystatechange = function()
        {
            if (this.readyState == 4)
            {
                if (this.status == 201)
                {
                    let jsonObject = JSON.parse( xhr.responseText );

                    token = jsonObject.token;
                    firstName = jsonObject.firstName;
                    lastName = jsonObject.lastName;

                    saveSession();

                    window.location.href = "contacts.html";
                }
				else if (this.status == 409)
                {
                    document.getElementById("registerResult").innerHTML = "Username already taken. Please choose another.";
                }
				else if (this.status == 400)
                {
                    let res = JSON.parse( xhr.responseText );
                    document.getElementById("registerResult").innerHTML = "Missing fields: " + (res.fields || []).join(", ");
                }
                else
                {
                    document.getElementById("registerResult").innerHTML = "Server error. Please try again.";
                }
            }
        };
        xhr.send(jsonPayload);
    }
    catch(err)
    {
        document.getElementById("registerResult").innerHTML = err.message;
    }
}
 
function saveSession()
{
    sessionStorage.setItem("token", token);
    sessionStorage.setItem("firstName", firstName);
    sessionStorage.setItem("lastName", lastName);
}

function readSession()
{
    token = sessionStorage.getItem("token") || "";
    firstName = sessionStorage.getItem("firstName") || "";
    lastName = sessionStorage.getItem("lastName") || "";

    if (!token)
    {
        window.location.href = "index.html";
        return;
    }

    let nameEl = document.getElementById("userName");
    if (nameEl)
    {
        nameEl.innerHTML = "Logged in as " + firstName + " " + lastName;
    }
}

function doLogout()
{
    userId = 0;
    firstName = "";
    lastName = "";
    token = "";
    sessionStorage.clear();
    window.location.href = "index.html";
}

function addContact()
{
    let first = document.getElementById("firstName").value.trim();
    let last = document.getElementById("lastName").value.trim();
    let email = document.getElementById("contactEmail").value.trim();
    let phone = document.getElementById("contactPhone").value.trim();

    document.getElementById("contactAddResult").innerHTML = "";

    if (first === "" && last === "")
    {
        document.getElementById("contactAddResult").innerHTML = "Please include a name for Contact";
        return;
    }

    let emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (email !== "" && !emailRegex.test(email))
    {
        document.getElementById("contactAddResult").innerHTML = "Please enter a valid email address";
        return;
    }

    let tmp = { firstName: first, lastName: last, email: email, phone: phone };
    let jsonPayload = JSON.stringify( tmp );

    let url = urlBase + '/contacts'; 

    let xhr = new XMLHttpRequest();
    xhr.open("POST", url, true);
    xhr.setRequestHeader("Content-type", "application/json; charset=UTF-8");
    xhr.setRequestHeader("Authorization", "Bearer " + token);

    try
    {
        xhr.onreadystatechange = function()
        {
            if (this.readyState == 4)
            {
                if (this.status == 201)
                {
                    document.getElementById("contactAddResult").innerHTML = "Contact has been added";
                    searchContacts();
                }
                else if (this.status == 400)
                {
                    let res = JSON.parse( xhr.responseText );
                    document.getElementById("contactAddResult").innerHTML = "Invalid input: " + (res.fields || []).join(", ");
                }
                else if (this.status == 401)
                {
                    window.location.href = "index.html";
                }
                else
                {
                    document.getElementById("contactAddResult").innerHTML = "Server error. Please try again.";
                }
            }
        };
        xhr.send(jsonPayload);
    }
    catch(err)
    {
        document.getElementById("contactAddResult").innerHTML = err.message;
    }
}

function searchContacts()
{
    let srch = document.getElementById("searchText").value.trim();
    document.getElementById("colorSearchResult").innerHTML = "";

    let url = urlBase + '/contacts';
    if (srch !== "")
    {
        url += '?q=' + encodeURIComponent(srch);
    }

    let xhr = new XMLHttpRequest();
    xhr.open("GET", url, true);
    xhr.setRequestHeader("Content-type", "application/json; charset=UTF-8");
    xhr.setRequestHeader("Authorization", "Bearer " + token);

    try
    {
        xhr.onreadystatechange = function()
        {
            if (this.readyState == 4)
            {
                if (this.status == 200)
                {
                    let jsonObject = JSON.parse( xhr.responseText );
                    let contactList = jsonObject.contacts || [];

                    document.getElementById("colorSearchResult").innerHTML = contactList.length + " contact(s) found";

                    let contactListString = "";
                    for (let i = 0; i < contactList.length; i++)
                    {
                        let c = contactList[i];
                        contactListString += c.firstName + " " + c.lastName + " | " + c.email + " | " + c.phone +
                                  " <button onclick='deleteContact(" + c.id + ")'>Delete</button>" +
                                  " <button onclick='openEditModal(" + c.id + ")'>Edit</button>";
                        if (i < contactList.length - 1)
                        {
                            contactListString += "<br />\r\n";
                        }
                    }

                    document.getElementsByTagName("p")[0].innerHTML = contactList;
                }
                else if (this.status == 401)
                {
                    window.location.href = "index.html";
                }
                else
                {
                    document.getElementById("colorSearchResult").innerHTML = "Server error. Please try again.";
                }
            }
        };
        xhr.send();
    }
    catch(err)
    {
        document.getElementById("colorSearchResult").innerHTML = err.message;
    }
}

function editContact( contactId )
{
    let first = document.getElementById("editFirstName").value.trim();
    let last = document.getElementById("editLastName").value.trim();
    let email = document.getElementById("editEmail").value.trim();
    let phone = document.getElementById("editPhone").value.trim();

    document.getElementById("contactEditResult").innerHTML = "";

    let tmp = {};
    if (first !== "") tmp.firstName = first;
    if (last !== "") tmp.lastName = last;
    if (email !== "") tmp.email = email;
    if (phone !== "") tmp.phone = phone;

    let jsonPayload = JSON.stringify( tmp );

    let url = urlBase + '/contacts/' + contactId;

    let xhr = new XMLHttpRequest();
    xhr.open("PATCH", url, true); 
    xhr.setRequestHeader("Content-type", "application/json; charset=UTF-8");
    xhr.setRequestHeader("Authorization", "Bearer " + token); 

    try
    {
        xhr.onreadystatechange = function()
        {
            if (this.readyState == 4)
            {
                if (this.status == 200)
                {
                    document.getElementById("contactEditResult").innerHTML = "Contact has been updated";
                    searchContacts();
                }
                else if (this.status == 404)
                {
                    document.getElementById("contactEditResult").innerHTML = "Contact not found";
                }
                else if (this.status == 400)
                {
                    let res = JSON.parse( xhr.responseText );
                    document.getElementById("contactEditResult").innerHTML = "Invalid field: " + (res.fields || []).join(", ");
                }
                else if (this.status == 401)
                {
                    window.location.href = "index.html";
                }
                else
                {
                    document.getElementById("contactEditResult").innerHTML = "Server error. Please try again.";
                }
            }
        };
        xhr.send(jsonPayload);
    }
    catch(err)
    {
        document.getElementById("contactEditResult").innerHTML = err.message;
    }
}

function deleteContact( contactId )
{
    document.getElementById("colorDeleteResult").innerHTML = "";

    if (!confirm("Are you sure you want to delete this contact?"))
    {
        return;
    }

    let url = urlBase + '/contacts/' + contactId;

    let xhr = new XMLHttpRequest();
    xhr.open("DELETE", url, true);
    xhr.setRequestHeader("Content-Type", "application/json; charset=UTF-8");
    xhr.setRequestHeader("Authorization", "Bearer " + token);

    try
    {
        xhr.onreadystatechange = function()
        {
            if (this.readyState == 4)
            {
                if (this.status == 204)
                {
                    document.getElementById("colorDeleteResult").innerHTML = "Contact has been deleted";
                    searchContacts();
                }
                else if (this.status == 404)
                {
                    document.getElementById("colorDeleteResult").innerHTML = "Contact not found";
                }
				else if (this.status == 401)
                {
                    window.location.href = "index.html";
                }
                else
                {
                    document.getElementById("colorDeleteResult").innerHTML = "Server error. Please try again.";
                }
            }
        };
        xhr.send();
    }
    catch(err)
    {
        document.getElementById("colorDeleteResult").innerHTML = err.message;
    }
}