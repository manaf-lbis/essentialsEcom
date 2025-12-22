const form = document.getElementById('form');

const testLoginBtn = document.getElementById('testLoginBtn');
if (testLoginBtn) {
    testLoginBtn.addEventListener('click', () => {
        document.getElementById('emailField').value = 'user@gmail.com';
        document.getElementById('passwordField').value = 'Login@121';
    });
}

form.addEventListener("submit", (event) => {
    event.preventDefault();

    clearError();

    const email = document.getElementById('emailField').value;
    const password = document.getElementById('passwordField').value;

    let validation = true;

    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !emailPattern.test(email)) {
        validation = false;
        document.getElementById('emailerr').innerHTML = 'Valid email is required.';
    }

    const passwordPattern = /^(?=.*[a-zA-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    if (!passwordPattern.test(password)) {
        document.getElementById('passworderr').innerHTML = 'Password must be at least 8 characters long and contain at least one letter and one number.';
        validation = false;
    }

    function clearError() {
        document.getElementById('emailerr').innerHTML = '';
        document.getElementById('passworderr').innerHTML = '';
    }

    if (validation) {
        form.submit();
    }

});
