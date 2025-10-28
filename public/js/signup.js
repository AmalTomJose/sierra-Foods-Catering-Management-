const firstname = document.getElementById('Firstname');
const firstnameError = document.getElementById('FirstnameError');

const lastname = document.getElementById('Lastname');
const lastnameError = document.getElementById('LastnameError');

const email = document.getElementById('email');
const emailError = document.getElementById('emailError');

const phoneno = document.getElementById('phoneno');
const phonenoError = document.getElementById('phonenoError');

const password = document.getElementById('password');
const passwordError = document.getElementById('passwordError');

const confirmpassword = document.getElementById('confirmpassword');
const confirmpasswordError = document.getElementById('confirmpasswordError');

const form = document.getElementById('form');
const formError = document.getElementById('formError');

// ✅ Validate Firstname
function validateFirstname() {
  const namePattern = /^[A-Za-z]+(?: [A-Za-z]+)*$/; // letters & optional spaces (no symbols/numbers)
  
  if (firstname.value.trim() === "" || firstname.value === null) {
    firstnameError.textContent = "First name is required";
    firstnameError.style.visibility = "visible";
    return false;
  } else if (!namePattern.test(firstname.value.trim())) {
    firstnameError.textContent = "Enter a valid first name (letters only)";
    firstnameError.style.visibility = "visible";
    return false;
  } else {
    firstnameError.style.visibility = "hidden";
    return true;
  }
}

// ✅ Validate Lastname
function validateLastname() {
  const namePattern = /^[A-Za-z]+(?: [A-Za-z]+)*$/;

  if (lastname.value.trim() === "" || lastname.value === null) {
    lastnameError.textContent = "Last name is required";
    lastnameError.style.visibility = "visible";
    return false;
  } else if (!namePattern.test(lastname.value.trim())) {
    lastnameError.textContent = "Enter a valid last name (letters only)";
    lastnameError.style.visibility = "visible";
    return false;
  } else {
    lastnameError.style.visibility = "hidden";
    return true;
  }
}

// ✅ Validate Email
function validateEmail() {
  const emailPattern =
    /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;

  if (email.value.trim() === "" || email.value === null) {
    emailError.textContent = "Email is required";
    emailError.style.visibility = "visible";
    return false;
  } else if (!emailPattern.test(email.value.trim())) {
    emailError.textContent = "Enter a valid email";
    emailError.style.visibility = "visible";
    return false;
  } else {
    emailError.style.visibility = "hidden";
    return true;
  }
}

// ✅ Validate Phone Number
function validatePhoneno() {
  const phone = phoneno.value.trim();
  const phoneRegex = /^[0-9]{10}$/;

  if (phone === "" || phone === null) {
    phonenoError.textContent = "Phone number is required";
    phonenoError.style.visibility = "visible";
    return false;
  } else if (!phoneRegex.test(phone)) {
    phonenoError.textContent = "Enter a valid 10-digit phone number";
    phonenoError.style.visibility = "visible";
    return false;
  } else {
    phonenoError.style.visibility = "hidden";
    return true;
  }
}

// ✅ Validate Password
function validatePassword() {
  const pass = password.value.trim();
  if (pass === "" || pass === null) {
    passwordError.textContent = "Password is required";
    passwordError.style.visibility = "visible";
    return false;
  } else if (pass.length < 8) {
    passwordError.textContent = "Password must be at least 8 characters long";
    passwordError.style.visibility = "visible";
    return false;
  } else {
    passwordError.style.visibility = "hidden";
    return true;
  }
}

// ✅ Validate Confirm Password
function validateconfirmPassword() {
  const confirm = confirmpassword.value.trim();
  if (confirm === "" || confirm === null) {
    confirmpasswordError.textContent = "Please confirm your password";
    confirmpasswordError.style.visibility = "visible";
    return false;
  } else if (confirm !== password.value) {
    confirmpasswordError.textContent = "Passwords do not match";
    confirmpasswordError.style.visibility = "visible";
    return false;
  } else {
    confirmpasswordError.style.visibility = "hidden";
    return true;
  }
}

// ✅ Form Submit Event
form.addEventListener("submit", (e) => {
  if (
    !validateFirstname() ||
    !validateLastname() ||
    !validateEmail() ||
    !validatePhoneno() ||
    !validatePassword() ||
    !validateconfirmPassword()
  ) {
    e.preventDefault();
    formError.style.visibility = "visible";
    setTimeout(() => (formError.style.visibility = "hidden"), 3000);
  }
});
