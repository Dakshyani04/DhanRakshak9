const expenseForm = document.getElementById('expense-form');
const expensesList = document.getElementById('expenses');
const totalAmountDisplay = document.getElementById('total-amount');
const budgetForm = document.getElementById('budget-form');
// const budgetAmountInput = document.getElementById('budget-amount');
const budgetFrequency = document.getElementById('budget-frequency');
const budgetAlert = document.getElementById('budget-alert');
const alertSound = document.getElementById('alert-sound');
const bookImage = document.getElementById('book-image');
const bookPdfLink = document.getElementById('book-pdf-link');
const bookLinks = document.querySelectorAll('.dropdown-content a[data-image]');

// Initialize data from localStorage or set defaults
let expenses = JSON.parse(localStorage.getItem('expenses')) || [];
let totalAmount = parseFloat(localStorage.getItem('totalAmount')) || 0;
let budgetAmount = parseFloat(localStorage.getItem('budgetAmount')) || 0;
let budgetFreq = localStorage.getItem('budgetFrequency') || 'weekly';
let budgetExceededNotified = false;

// Update Total Amount
function updateTotalAmount() {
    if (totalAmountDisplay) {
        totalAmountDisplay.textContent = `Total: ₹${totalAmount.toFixed(2)}`;
    }
    checkBudget();
}

// Update Expense List
function updateExpenseList() {
    if (expensesList) {
        expensesList.innerHTML = '';
        expenses.forEach((expense, index) => {
            const li = document.createElement('li');
            li.innerHTML = `
                <span>${expense.title} - ₹${expense.amount.toFixed(2)} (${expense.paymentMethod}) on ${expense.date} - Notes: ${expense.notes}</span>
                <button onclick="removeExpense(${index})">Remove</button>
            `;
            expensesList.appendChild(li);
        });
    }
}

// Remove Expense
function removeExpense(index) {
    const removedExpense = expenses.splice(index, 1)[0];
    totalAmount -= removedExpense.amount;
    localStorage.setItem('expenses', JSON.stringify(expenses));
    localStorage.setItem('totalAmount', totalAmount.toString());
    updateExpenseList();
    updateTotalAmount();
    updateChart();
}

// Add Expense
function addExpense(event) {
    event.preventDefault();
    const title = document.getElementById('expense-title').value;
    const amount = parseFloat(document.getElementById('expense-amount').value);
    const paymentMethod = document.getElementById('payment-method').value;
    const date = document.getElementById('expense-date').value;
    const notes = document.getElementById('expense-notes').value;

    if (isNaN(amount) || amount <= 0) {
        alert("Please enter a valid amount.");
        return;
    }

    const expense = { title, amount, paymentMethod, date, notes };
    expenses.push(expense);
    totalAmount += amount;
    localStorage.setItem('expenses', JSON.stringify(expenses));
    localStorage.setItem('totalAmount', totalAmount.toString());
    window.location.href = 'expense-history.html';
}

// Update Chart
function updateChart() {
    const ctx = document.getElementById('expense-chart');
    if (!ctx) return;

    const expenseCategories = {};
    expenses.forEach(expense => {
        if (expenseCategories[expense.paymentMethod]) {
            expenseCategories[expense.paymentMethod] += expense.amount;
        } else {
            expenseCategories[expense.paymentMethod] = expense.amount;
        }
    });

    const labels = Object.keys(expenseCategories);
    const data = Object.values(expenseCategories);

    new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: labels,
            datasets: [{
                label: 'Expenses by Payment Method',
                data: data,
                backgroundColor: ['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF'],
                borderColor: ['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF'],
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        color: '#ffffff',
                        font: { size: 12 }
                    }
                },
                title: {
                    display: true,
                    text: 'Expense Distribution',
                    color: '#ffffff',
                    font: { size: 14 }
                }
            }
        }
    });
}
// Set Budget
function setBudget(event) {
    event.preventDefault();
    budgetAmount = parseFloat(document.getElementById('budget-amount').value);
    budgetFreq = budgetFrequency.value;

    if (isNaN(budgetAmount) || budgetAmount <= 0) {
        alert("Please enter a valid budget amount.");
        return;
    }

    localStorage.setItem('budgetAmount', budgetAmount.toString());
    localStorage.setItem('budgetFrequency', budgetFreq);

    // Update budget alert with remaining amount
    const remainingAmount = budgetAmount - totalAmount;
    budgetAlert.textContent = `Budget: ₹${budgetAmount.toFixed(2)} | Remaining: ₹${remainingAmount.toFixed(2)}`;

    checkBudget();
    updateBarChart();
}
// Check Budget
function checkBudget() {
    const currentPage = window.location.pathname.split('/').pop();
    if (currentPage !== 'index.html' && currentPage !== 'expense-history.html') return;

    if (budgetAmount > 0) {
        const usedPercentage = (totalAmount / budgetAmount) * 100;
        const remainingPercentage = 100 - usedPercentage;
        const remainingAmount = budgetAmount - totalAmount;

        // Display remaining amount below the Set Budget button
        if (budgetAlert) {
            budgetAlert.textContent = `Budget: ₹${budgetAmount.toFixed(2)} | Remaining: ₹${remainingAmount.toFixed(2)} (${remainingPercentage.toFixed(2)}%)`;
        }

        // Check if budget is exceeded
        if (totalAmount > budgetAmount && !budgetExceededNotified) {
            budgetExceededNotified = true; // Set the flag to true to prevent multiple alerts

            // Play alert sound first
            if (alertSound) {
                alertSound.play().then(() => {
                    // Show pop-up message after the alert sound
                    setTimeout(() => {
                        alert("Budget exceeded! Please check your expenses.");
                    }, 100); // Delay to ensure the sound plays first
                });
            }

            // Update budget alert to show exceeded amount
            if (budgetAlert) {
                budgetAlert.textContent = `Budget: ₹${budgetAmount.toFixed(2)} | Exceeded by ₹${(totalAmount - budgetAmount).toFixed(2)} (${usedPercentage.toFixed(2)}% used)`;
            }
        }
    }
}
// Update Total Amount
function updateTotalAmount() {
    if (totalAmountDisplay) {
        totalAmountDisplay.textContent = `Total: ₹${totalAmount.toFixed(2)}`;
    }
    checkBudget(); // Call checkBudget to update the remaining amount
}

// Update Bar Chart
function updateBarChart() {
    const barCtx = document.getElementById('bar-chart');
    if (!barCtx) return;

    const groupedExpenses = groupExpensesByFrequency();
    const labels = Object.keys(groupedExpenses);
    const data = Object.values(groupedExpenses);

    const colors = {
        weekly: '#FF6384',
        monthly: '#36A2EB',
        yearly: '#FFCE56'
    };

    new Chart(barCtx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'Expenses',
                data: data,
                backgroundColor: colors[budgetFreq],
                borderColor: colors[budgetFreq],
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false },
                title: {
                    display: true,
                    text: `Expenses by ${budgetFreq.charAt(0).toUpperCase() + budgetFreq.slice(1)}`,
                    color: '#ffffff',
                    font: { size: 14 }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: { color: '#ffffff' }
                },
                x: {
                    ticks: { color: '#ffffff' }
                }
            }
        }
    });

    if (budgetFreq === 'weekly') {
        const dayExpenses = getDayOfWeekExpenses();
        const maxDay = Object.keys(dayExpenses).reduce((a, b) => dayExpenses[a] > dayExpenses[b] ? a : b);
        budgetAlert.textContent += `\nHighest expenses on: ${maxDay}`;
    }
}

// Group Expenses by Frequency
function groupExpensesByFrequency() {
    const groupedExpenses = {};
    expenses.forEach(expense => {
        const date = new Date(expense.date);
        let key;
        if (budgetFreq === 'weekly') {
            key = `Week ${getWeekNumber(date)}`;
        } else if (budgetFreq === 'monthly') {
            key = date.toLocaleString('default', { month: 'long' });
        } else if (budgetFreq === 'yearly') {
            key = date.getFullYear();
        }
        if (groupedExpenses[key]) {
            groupedExpenses[key] += expense.amount;
        } else {
            groupedExpenses[key] = expense.amount;
        }
    });
    return groupedExpenses;
}

// Get Day of Week Expenses
function getDayOfWeekExpenses() {
    const dayExpenses = {
        'Sunday': 0,
        'Monday': 0,
        'Tuesday': 0,
        'Wednesday': 0,
        'Thursday': 0,
        'Friday': 0,
        'Saturday': 0
    };
    expenses.forEach(expense => {
        const date = new Date(expense.date);
        const day = date.toLocaleString('default', { weekday: 'long' });
        dayExpenses[day] += expense.amount;
    });
    return dayExpenses;
}

// Get Week Number
function getWeekNumber(date) {
    const oneJan = new Date(date.getFullYear(), 0, 1);
    const numberOfDays = Math.floor((date - oneJan) / (24 * 60 * 60 * 1000));
    return Math.ceil((date.getDay() + 1 + numberOfDays) / 7);
}

// Initialize page
function initializePage() {
    updateTotalAmount();
    updateExpenseList();
    updateChart();
    updateBarChart();

    

    if (expenseForm) expenseForm.addEventListener('submit', addExpense);
    if (budgetForm) budgetForm.addEventListener('submit', setBudget);
    if (bookLinks) {
        bookLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const imageSrc = link.getAttribute('data-image');
                const pdfSrc = link.getAttribute('data-pdf');
                bookImage.src = imageSrc;
                bookImage.style.display = 'block';
                bookPdfLink.href = pdfSrc;
            });
        });
    }
}

// Hamburger Menu Toggle
function toggleMenu() {
    const menu = document.getElementById('menu');
    menu.classList.toggle('active');
}

// Scroll Event for Header
window.addEventListener('scroll', function() {
    const header = document.querySelector('.header');
    if (window.scrollY > 50) {
        header.classList.add('scrolled');
    } else {
        header.classList.remove('scrolled');
    }
});

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', initializePage);
// Voice Recognition Setup
const voiceTitle = document.getElementById('voice-title');
const voiceAmount = document.getElementById('voice-amount');
const voiceNotes = document.getElementById('voice-notes'); // ✅ Notes Microphone
const voiceBudget = document.getElementById('voice-budget'); // ✅ Budget Microphone

const expenseTitleInput = document.getElementById('expense-title');
const expenseAmountInput = document.getElementById('expense-amount');
const expenseNotesInput = document.getElementById('expense-notes'); // ✅ Notes Input Field
const budgetAmountInput = document.getElementById('budget-amount'); // ✅ Budget Input Field

let recognition;
let activeInputField = null; // Track which input field is active

// Check if browser supports Speech Recognition
if ('webkitSpeechRecognition' in window) {
    recognition = new webkitSpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'en-US';

    recognition.onresult = function(event) {
        const transcript = event.results[0][0].transcript;
        if (activeInputField) {
            if (activeInputField === expenseTitleInput || activeInputField === expenseNotesInput) {
                activeInputField.value = transcript; // For text-based fields
            } else if (activeInputField === expenseAmountInput || activeInputField === budgetAmountInput) {
                const amount = parseFloat(transcript.replace(/[^0-9.]/g, '')); // Extract numbers
                if (!isNaN(amount)) {
                    activeInputField.value = amount;
                }
            }
        }
    };

    recognition.onerror = function(event) {
        console.error('Voice recognition error:', event.error);
        alert("Voice input error: " + event.error);
    };
} else {
    console.warn('Web Speech API is not supported in this browser.');
    alert("Voice input is not supported in your browser. Try using Google Chrome.");
}

// Function to start voice recognition
function startVoiceRecognition(inputField) {
    if (recognition) {
        activeInputField = inputField;
        recognition.start();
    } else {
        alert("Your browser does not support voice recognition.");
    }
}

// Add event listeners to microphone icons
if (voiceTitle) voiceTitle.addEventListener('click', () => startVoiceRecognition(expenseTitleInput));
if (voiceAmount) voiceAmount.addEventListener('click', () => startVoiceRecognition(expenseAmountInput));
if (voiceNotes) voiceNotes.addEventListener('click', () => startVoiceRecognition(expenseNotesInput)); // ✅ Enable for Notes
if (voiceBudget) voiceBudget.addEventListener('click', () => startVoiceRecognition(budgetAmountInput)); // ✅ Enable for Budget

// Logout Modal Elements
const logoutBtn = document.getElementById("logout-btn");
const logoutModal = document.getElementById("logout-modal");
const confirmLogout = document.getElementById("confirm-logout");
const cancelLogout = document.getElementById("cancel-logout");

// Show logout modal when logout button is clicked
if (logoutBtn) {
    logoutBtn.addEventListener("click", () => {
        if (logoutModal) {
            logoutModal.style.display = "block";
        }
    });
}

// Hide modal on cancel
if (cancelLogout) {
    cancelLogout.addEventListener("click", () => {
        if (logoutModal) {
            logoutModal.style.display = "none";
        }
    });
}

// Perform logout action
if (confirmLogout) {
    confirmLogout.addEventListener("click", () => {
        // Clear login session from localStorage
        localStorage.removeItem("isLoggedIn");
        
        // Redirect user to login page (pp.html)
        window.location.href = "login.html";
    });
}

// Check if user is logged in before accessing protected pages
const protectedPages = ["index.html", "expense-history.html", "expense-analytics.html", "book-recommendation.html", "passive-income.html", "download-log.html"];
const currentPage = window.location.pathname.split('/').pop();

if (protectedPages.includes(currentPage) && !localStorage.getItem("isLoggedIn")) {
    window.location.href = "login.html"; // Redirect to login if not logged in
}

// Event listener for registration form submission
const registerForm = document.getElementById('registerForm');
if (registerForm) {
    registerForm.addEventListener('submit', function(event) {
        event.preventDefault();
        const phone = document.getElementById('registerPhone').value;
        const password = document.getElementById('registerPassword').value;
        const confirmPassword = document.getElementById('confirmPassword').value;

        if (password !== confirmPassword) {
            alert("Passwords do not match! Please enter the same password.");
            return;
        }

        // Check if the user already exists
        let users = JSON.parse(localStorage.getItem('users')) || [];
        const userExists = users.some(u => u.phone === phone);
        if (userExists) {
            alert('User already registered. Please log in.');
        } else {
            users.push({ phone, password });
            localStorage.setItem('users', JSON.stringify(users));
            alert('Registration successful! Please log in.');
            showLoginBox();  // Redirect to login
        }
    });
}

// Forgot Password Elements
const forgotPasswordLink = document.getElementById("forgotPasswordLink");
const forgotPasswordModal = document.getElementById("forgotPasswordModal");
const resetPasswordBtn = document.getElementById("resetPassword");
const closeForgotModal = document.getElementById("closeForgotModal");

// Open forgot password modal
if (forgotPasswordLink) {
    forgotPasswordLink.addEventListener("click", () => {
        if (forgotPasswordModal) {
            forgotPasswordModal.style.display = "block";
        }
    });
}

// Close forgot password modal
if (closeForgotModal) {
    closeForgotModal.addEventListener("click", () => {
        if (forgotPasswordModal) {
            forgotPasswordModal.style.display = "none";
        }
    });
}

// Handle password reset
if (resetPasswordBtn) {
    resetPasswordBtn.addEventListener("click", () => {
        const forgotPhoneNumber = document.getElementById("forgotPhoneNumber");
        if (forgotPhoneNumber) {
            const phone = forgotPhoneNumber.value;
            let users = JSON.parse(localStorage.getItem('users')) || [];

            const user = users.find(u => u.phone === phone);
            if (user) {
                const newPassword = prompt("Enter your new password:");
                if (newPassword) {
                    user.password = newPassword;
                    localStorage.setItem('users', JSON.stringify(users));
                    alert("Password reset successful! Please log in.");
                    forgotPasswordModal.style.display = "none";
                }
            } else {
                alert("Phone number not found!");
            }
        }
    });
}

// OTP Verification Elements
const otpModal = document.getElementById("otpModal");
const verifyOtpBtn = document.getElementById("verifyOtp");
const cancelOtpBtn = document.getElementById("cancelOtp");
let generatedOtp = null;
let currentUserPhone = null;

// Generate OTP function
function generateOtp() {
    return Math.floor(100000 + Math.random() * 900000);  // 6-digit OTP
}

// Handle login with OTP
const loginForm = document.getElementById('loginForm');
if (loginForm) {
    loginForm.addEventListener('submit', function(event) {
        event.preventDefault();
        const phone = document.getElementById('phone').value;
        const password = document.getElementById('password').value;
        let users = JSON.parse(localStorage.getItem('users')) || [];

        const user = users.find(u => u.phone === phone && u.password === password);
        if (user) {
            // Generate OTP and show OTP modal
            generatedOtp = generateOtp();
            currentUserPhone = phone;
            alert(`Your OTP is: ${generatedOtp}`);  // Simulating OTP send
            if (otpModal) {
                otpModal.style.display = "block";
            }
        } else {
            alert('Invalid phone number or password');
        }
    });
}

// Verify OTP
if (verifyOtpBtn) {
    verifyOtpBtn.addEventListener("click", () => {
        const otpInput = document.getElementById("otpInput");
        if (otpInput) {
            const enteredOtp = otpInput.value;
            if (parseInt(enteredOtp) === generatedOtp) {
                alert("Login successful!");
                localStorage.setItem('isLoggedIn', 'true');
                window.location.href = 'index.html';
            } else {
                alert("Invalid OTP! Try again.");
            }
        }
    });
}

// Cancel OTP
if (cancelOtpBtn) {
    cancelOtpBtn.addEventListener("click", () => {
        if (otpModal) {
            otpModal.style.display = "none";
        }
    });
}

// Function to log downloads
function logDownload(fileName, type) {
    const downloadLogs = JSON.parse(localStorage.getItem('downloadLogs')) || [];
    const dateTime = new Date().toLocaleString();
    downloadLogs.push({ dateTime, fileName, type });
    localStorage.setItem('downloadLogs', JSON.stringify(downloadLogs));
    
    // Log to console for debugging
    console.log('Download logged:', { dateTime, fileName, type });
    console.log('Current logs:', downloadLogs);
}

// Function to export Expense History as PDF
function exportExpenseHistoryToPDF() {
    const { jsPDF } = window.jspdf;
    if (!jsPDF) {
        console.error('jsPDF library not loaded properly');
        alert('Error: PDF generation library not loaded. Please refresh the page.');
        return;
    }
    
    const doc = new jsPDF();
    const expenses = JSON.parse(localStorage.getItem('expenses')) || [];
    const totalAmount = parseFloat(localStorage.getItem('totalAmount')) || 0;

    doc.setFontSize(18);
    doc.text("Expense History Report", 10, 10);
    doc.setFontSize(12);

    let yPos = 20;
    expenses.forEach((expense, index) => {
        const text = `${index + 1}. ${expense.title} - ₹${expense.amount.toFixed(2)} (${expense.paymentMethod}) on ${expense.date} - Notes: ${expense.notes}`;
        doc.text(text, 10, yPos);
        yPos += 10;
    });

    doc.text(`Total Amount: ₹${totalAmount.toFixed(2)}`, 10, yPos + 10);

    const fileName = "Expense_History_Report.pdf";
    doc.save(fileName);

    // Log the download
    logDownload(fileName, "Expense History");

    // Delay the redirection to ensure the download is complete
    setTimeout(() => {
        window.location.href = "download-log.html";
    }, 1000); // 1-second delay
}

// Function to export Expense Analytics as PDF
function exportExpenseAnalyticsToPDF() {
    const { jsPDF } = window.jspdf;
    if (!jsPDF) {
        console.error('jsPDF library not loaded properly');
        alert('Error: PDF generation library not loaded. Please refresh the page.');
        return;
    }
    
    const doc = new jsPDF();
    const expenses = JSON.parse(localStorage.getItem('expenses')) || [];
    const totalAmount = parseFloat(localStorage.getItem('totalAmount')) || 0;

    doc.setFontSize(18);
    doc.text("Expense Analytics Report", 10, 10);
    doc.setFontSize(12);

    // Add doughnut chart image
    const doughnutChart = document.getElementById('expense-chart');
    if (doughnutChart) {
        const canvas = doughnutChart;
        const image = canvas.toDataURL('image/png');
        doc.addImage(image, 'PNG', 10, 20, 180, 100);
    }

    // Add bar chart image
    const barChart = document.getElementById('bar-chart');
    if (barChart) {
        const canvas = barChart;
        const image = canvas.toDataURL('image/png');
        doc.addImage(image, 'PNG', 10, 130, 180, 100);
    }

    doc.text(`Total Amount: ₹${totalAmount.toFixed(2)}`, 10, 240);

    const fileName = "Expense_Analytics_Report.pdf";
    doc.save(fileName);

    // Log the download
    logDownload(fileName, "Expense Analytics");

    // Delay the redirection to ensure the download is complete
    setTimeout(() => {
        window.location.href = "download-log.html";
    }, 1000); // 1-second delay
}

// Function to display download logs in the download-log.html page
function displayDownloadLogs() {
    const logTableBody = document.getElementById('download-log-entries');
    if (!logTableBody) return;

    // Retrieve logs from localStorage
    const downloadLogs = JSON.parse(localStorage.getItem('downloadLogs')) || [];
    console.log('Retrieved download logs:', downloadLogs);

    // Clear existing table rows
    logTableBody.innerHTML = '';

    // Add each log entry to the table
    downloadLogs.forEach((log) => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${log.dateTime}</td>
            <td>${log.fileName}</td>
            <td>${log.type}</td>
            <td><a href="#" class="file-link" onclick="viewFile('${log.fileName}')">View</a></td>
        `;
        logTableBody.appendChild(row);
    });

    // Show or hide the no-data message
    const noDownloadsMessage = document.getElementById('no-downloads-message');
    if (noDownloadsMessage) {
        if (downloadLogs.length === 0) {
            noDownloadsMessage.style.display = 'block';
        } else {
            noDownloadsMessage.style.display = 'none';
        }
    }
}

// Log Downloads
function logDownload(fileName, type) {
    const downloadLogs = JSON.parse(localStorage.getItem('downloadLogs')) || [];
    const dateTime = new Date().toLocaleString();
    downloadLogs.push({ dateTime, fileName, type });
    localStorage.setItem('downloadLogs', JSON.stringify(downloadLogs));
}

// Display Download Logs
function displayDownloadLogs() {
    const logTableBody = document.getElementById('download-log-entries');
    if (!logTableBody) return;

    const downloadLogs = JSON.parse(localStorage.getItem('downloadLogs')) || [];
    logTableBody.innerHTML = '';

    downloadLogs.forEach((log) => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${log.dateTime}</td>
            <td>${log.fileName}</td>
            <td>${log.type}</td>
        `;
        logTableBody.appendChild(row);
    });

    const noDownloadsMessage = document.getElementById('no-downloads-message');
    if (noDownloadsMessage) {
        if (downloadLogs.length === 0) {
            noDownloadsMessage.style.display = 'block';
        } else {
            noDownloadsMessage.style.display = 'none';
        }
    }
}

// Clear Download History
function clearDownloadHistory() {
    localStorage.removeItem('downloadLogs');
    displayDownloadLogs(); // Refresh the table
}

// Initialize Download Logs on Page Load
document.addEventListener('DOMContentLoaded', () => {
    displayDownloadLogs();

    // Attach event listener to the "Clear Download History" button
    const clearLogBtn = document.getElementById('clear-log-btn');
    if (clearLogBtn) {
        clearLogBtn.addEventListener('click', clearDownloadHistory);
    }
});

// Function to load the profile section
function loadProfileSection() {
    const profilePlaceholder = document.getElementById('profile-placeholder');
    if (profilePlaceholder) {
        fetch('profile.html')
            .then(response => response.text())
            .then(data => {
                profilePlaceholder.innerHTML = data;
                initializeProfile(); // Initialize profile functionality
            })
            .catch(error => console.error('Error loading profile section:', error));
    }
}

// Initialize profile functionality
function initializeProfile() {
    const profileImage = document.getElementById('profile-image');
    const profileImageUpload = document.getElementById('profile-image-upload');
    const profileNameInput = document.getElementById('profile-name');

    // Load saved profile data
    function loadProfile() {
        const savedName = localStorage.getItem('profileName');
        const savedImage = localStorage.getItem('profileImage');

        if (savedName) {
            profileNameInput.value = savedName;
        }
        if (savedImage) {
            profileImage.src = savedImage;
        }
    }

    // Save profile data
    function saveProfile() {
        const name = profileNameInput.value;
        const image = profileImage.src;

        localStorage.setItem('profileName', name);
        localStorage.setItem('profileImage', image);
    }

    // Handle profile image upload
    if (profileImageUpload) {
        profileImageUpload.addEventListener('change', function(event) {
            const file = event.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = function(e) {
                    profileImage.src = e.target.result;
                    saveProfile();
                };
                reader.readAsDataURL(file);
            }
        });
    }

    // Handle profile name change
    if (profileNameInput) {
        profileNameInput.addEventListener('input', function() {
            saveProfile();
        });
    }

    // Load profile data when the page loads
    loadProfile();
}

// Load profile section when the DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    loadProfileSection();
});
