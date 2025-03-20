const loginsec = document.querySelector('.login-section');
const loginlink = document.querySelector('.login-link');
const registerlink = document.querySelector('.register-link');
const loginForm = document.getElementById('loginForm');
const signupForm = document.getElementById('signupForm');
const loginButton = loginForm.querySelector('button[type="submit"]');
const emailInput = loginForm.querySelector('input[type=email]');
const passwordInput = loginForm.querySelector('input[type=password]');
const errorMessage = document.createElement('p'); // Create error message element
errorMessage.style.color = 'red';
errorMessage.style.fontWeight = 'bold';
errorMessage.style.marginTop = '10px';
loginForm.appendChild(errorMessage); // Add error message below form

// Toggle between login and register forms
registerlink.addEventListener('click', () => {
    loginsec.classList.add('active');
});
loginlink.addEventListener('click', () => {
    loginsec.classList.remove('active');
});

// Function to display error with shake effect
function showError(message, inputField) {
    inputField.classList.add('shake');
    errorMessage.innerHTML = `❌ ${message}`;
    setTimeout(() => inputField.classList.remove('shake'), 500);
}

// Handle Sign-Up form submission
signupForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const username = signupForm.querySelector('input[type=text]').value;
    const email = signupForm.querySelector('input[type=email]').value;
    const password = signupForm.querySelector('input[type=password]').value;

    const response = await fetch('http://localhost:3000/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, email, password })
    });

    const result = await response.json();
    if (result.success) {
        alert("✅ Sign up successful! Please log in.");
        loginsec.classList.remove('active'); // Switch to login form
    } else {
        errorMessage.innerText = result.message;
    }
});

// Handle Login form submission
loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const email = emailInput.value;
    const password = passwordInput.value;

    loginButton.disabled = true; // Disable button to prevent multiple clicks

    const response = await fetch('http://localhost:3000/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
    });

    const result = await response.json();

    if (result.success) {
        // Store the username in localStorage
        localStorage.setItem('username', result.username);

        // Redirect to the chat page
        window.location.href = './chat program/chat.html'; // Update this path
    } else {
        if (result.message.includes('Email')) {
            showError('Email not found, please Sign up first!', emailInput);
        } else if (result.message.includes('Incorrect password')) {
            showError('Wrong password!', passwordInput);
        }
        loginButton.disabled = false; // Re-enable button for another attempt
    }
});