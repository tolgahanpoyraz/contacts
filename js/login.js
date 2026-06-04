async function doLogin()
{
    let username = document.getElementById("loginName").value;
    let password = document.getElementById("loginPassword").value;
    document.getElementById("error-msg").innerHTML = "";

    if (username === "" || password === "")
    {
        document.getElementById("error-msg").innerHTML = "Please enter a username and password";
        return;
    }

    try
    {
        let data = await loginUser(username, password);
        saveAuth(data);
        window.location.href = 'contacts.html';
    }
    catch(err)
    {
        document.getElementById("error-msg").innerHTML = err.message;
    }
}

async function doRegister()
{
    let username = document.getElementById("registerUsername").value;
    let firstName = document.getElementById("registerFirstName").value;
    let lastName = document.getElementById("registerLastName").value;
    let password = document.getElementById("registerPassword").value;
    document.getElementById("error-msg").innerHTML = "";

    if (username === "" || firstName === "" || lastName === "" || password === "")
    {
        document.getElementById("error-msg").innerHTML = "All fields are required";
        return;
    }

    if (username === "" || firstName === "" || lastName === "" || password === "")
    {
        document.getElementById("error-msg").innerHTML = "All fields are required";
        return;
    }    

    try
    {
        let data = await registerUser(username, password, firstName, lastName);
        saveAuth(data);
        window.location.href = 'contacts.html';
    }
    catch(err)
    {
        document.getElementById("error-msg").innerHTML = err.message;
    }
}