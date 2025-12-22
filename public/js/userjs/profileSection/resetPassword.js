

const submitBtn = document.getElementById('submitBtn');

submitBtn.addEventListener('click', (event) => {

    const existingPassword = document.getElementById('existingPassword').value;
    const newPassword = document.getElementById('newPassword').value;
    const confirmPassword = document.getElementById('confirmPassword').value;

    document.getElementById('confirmPassErr').innerHTML = '';
    document.getElementById('existingPasswordErr').innerHTML = '';

    let verification = true

    if (newPassword != confirmPassword) {
        verification = false
        document.getElementById('confirmPassErr').innerHTML = 'Confirm Password not Match'
    }

    if (existingPassword.trim().length < 8) {
        verification = false
        document.getElementById('existingPasswordErr').innerHTML = 'Enter a correct Password'
    }

    const passwordPattern = /^(?=.*[a-zA-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    if (!passwordPattern.test(newPassword)) {
        verification = false
        document.getElementById('confirmPassErr').innerHTML = 'Password should be minimum 8 char & include symbols'
    }

    if (newPassword === existingPassword) {
        verification = false
        document.getElementById('confirmPassErr').innerHTML = 'New password Should not be same as old'
    }

    if (verification) {
        passwordReset(existingPassword, newPassword)
    }

})

async function passwordReset(existingPassword, newPassword) {
    try {
        const respose = await fetch('/resetPassword', {
            method: 'POST',
            headers: {
                'content-type': 'application/json'
            },
            body: JSON.stringify({ existingPassword, newPassword })
        })

        console.log();

        if (respose.ok) {

            Swal.fire({
                title: "Sucess!",
                text: "Your Password Reseted Sucessfully!",
                icon: "success"
            });

        } else {
            Swal.fire({
                icon: "error",
                title: "Oops...",
                text: "Please Enter Correct Password",
            });
        }

    } catch (error) {
        console.log(error);

    }

}