// Create floating particles
function createParticles() {
    const particleCount = 50;
    for (let i = 0; i < particleCount; i++) {
        const particle = document.createElement('div');
        particle.classList.add('particle');
        const size = Math.random() * 5 + 2;
        particle.style.width = `${size}px`;
        particle.style.height = `${size}px`;
        particle.style.left = `${Math.random() * 100}%`;
        particle.style.animationDuration = `${Math.random() * 10 + 10}s`;
        particle.style.animationDelay = `${Math.random() * 5}s`;
        document.body.appendChild(particle);
    }
}

// Check password strength via API
async function checkPasswordStrength(password) {
    if (!password) return;
    
    try {
        const response = await fetch('/api/check-password-strength', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ password: password })
        });
        
        const data = await response.json();
        const strengthBar = document.getElementById('strengthBar');
        const strengthText = document.getElementById('strengthText');
        
        strengthBar.style.width = data.width;
        strengthBar.style.background = data.color;
        strengthText.textContent = data.message;
        strengthText.style.color = data.color;
    } catch (error) {
        console.error('Error checking password:', error);
    }
}

// Check email availability
let emailCheckTimeout;
async function checkEmailAvailability(email) {
    if (!email) return;
    
    const emailCheckDiv = document.getElementById('emailCheck');
    
    try {
        const response = await fetch('/api/check-email', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email: email })
        });
        
        const data = await response.json();
        
        if (data.exists) {
            emailCheckDiv.textContent = '❌ Email already registered';
            emailCheckDiv.style.color = '#ff4444';
            return false;
        } else {
            emailCheckDiv.textContent = '✓ Email available';
            emailCheckDiv.style.color = '#00ff00';
            return true;
        }
    } catch (error) {
        console.error('Error checking email:', error);
        return false;
    }
}

// Show alert message
function showAlert(message, type) {
    const alert = document.getElementById('alert');
    alert.textContent = message;
    alert.className = `alert alert-${type}`;
    alert.style.display = 'block';
    
    setTimeout(() => {
        alert.style.display = 'none';
    }, 3000);
}

// Handle form submission
document.getElementById('registerForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const username = document.getElementById('username').value.trim();
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    const termsChecked = document.getElementById('termsCheckbox').checked;
    
    // Check if terms are accepted
    if (!termsChecked) {
        showAlert('Please accept the Terms and Conditions', 'error');
        return;
    }
    
    if (password !== confirmPassword) {
        showAlert('Passwords do not match', 'error');
        return;
    }
    
    try {
        const response = await fetch('/api/register', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                username,
                email,
                password,
                confirmPassword
            })
        });
        
        const data = await response.json();
        
        if (data.success) {
            showAlert('Registration successful! Welcome!', 'success');
            document.getElementById('registerForm').reset();
            document.getElementById('strengthBar').style.width = '0%';
            document.getElementById('emailCheck').textContent = '';
            // Reset checkbox styling
            const termsCheckbox = document.getElementById('termsCheckbox');
            const customCheckbox = document.querySelector('.custom-checkbox');
            termsCheckbox.checked = false;
            customCheckbox.style.background = 'rgba(255, 255, 255, 0.05)';
        } else {
            showAlert(data.message, 'error');
        }
    } catch (error) {
        showAlert('Registration failed. Please try again.', 'error');
        console.error('Error:', error);
    }
});

// Real-time password strength check
const passwordInput = document.getElementById('password');
if (passwordInput) {
    passwordInput.addEventListener('input', (e) => {
        checkPasswordStrength(e.target.value);
    });
}

// Real-time email availability check
const emailInput = document.getElementById('email');
if (emailInput) {
    emailInput.addEventListener('input', (e) => {
        clearTimeout(emailCheckTimeout);
        emailCheckTimeout = setTimeout(() => {
            checkEmailAvailability(e.target.value);
        }, 500);
    });
}

// Custom checkbox functionality - FIXED VERSION
document.addEventListener('DOMContentLoaded', function() {
    const termsCheckbox = document.getElementById('termsCheckbox');
    const customCheckbox = document.querySelector('.custom-checkbox');
    
    if (termsCheckbox && customCheckbox) {
        // Make the entire terms div clickable
        const termsDiv = document.querySelector('.terms');
        if (termsDiv) {
            termsDiv.addEventListener('click', function(e) {
                // Don't toggle if clicking on links
                if (e.target.tagName !== 'A') {
                    termsCheckbox.checked = !termsCheckbox.checked;
                    updateCheckboxStyle(termsCheckbox, customCheckbox);
                }
            });
        }
        
        // Also handle click on custom checkbox directly
        customCheckbox.addEventListener('click', function(e) {
            e.stopPropagation();
            termsCheckbox.checked = !termsCheckbox.checked;
            updateCheckboxStyle(termsCheckbox, customCheckbox);
        });
        
        // Handle checkbox change
        termsCheckbox.addEventListener('change', function() {
            updateCheckboxStyle(termsCheckbox, customCheckbox);
        });
    }
});

// Function to update checkbox styling
function updateCheckboxStyle(checkbox, customCheckbox) {
    if (checkbox.checked) {
        customCheckbox.style.background = '#0066ff';
        customCheckbox.style.borderColor = '#0066ff';
        const checkIcon = customCheckbox.querySelector('i');
        if (checkIcon) {
            checkIcon.style.display = 'block';
        }
    } else {
        customCheckbox.style.background = 'rgba(255, 255, 255, 0.05)';
        customCheckbox.style.borderColor = 'rgba(0, 102, 255, 0.3)';
        const checkIcon = customCheckbox.querySelector('i');
        if (checkIcon) {
            checkIcon.style.display = 'none';
        }
    }
}

// Initialize
createParticles();