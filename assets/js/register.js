import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.1/firebase-app.js";
import {
  getAuth,
  createUserWithEmailAndPassword,
} from "https://www.gstatic.com/firebasejs/10.12.1/firebase-auth.js";
import {
  getDatabase,
  ref,
  set,
} from "https://www.gstatic.com/firebasejs/10.12.1/firebase-database.js";

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBr41oUYa1OarPVkA7oTZ5U80yeDmLuewY",
  authDomain: "robinhood-fx.firebaseapp.com",
  projectId: "robinhood-fx",
  storageBucket: "robinhood-fx.appspot.com",
  messagingSenderId: "274862764153",
  appId: "1:274862764153:web:7f0796a69966dc779fa4a8",
  measurementId: "G-KNHNN8YDXY",
  databaseURL: "https://robinhood-fx-default-rtdb.firebaseio.com",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const database = getDatabase(app);

// DOM Elements
const form = document.getElementById("form");
const firstname = document.getElementById("firstname");
const lastname = document.getElementById("lastname");
const email = document.getElementById("email");
const password = document.getElementById("password");
const password2 = document.getElementById("password2");
const submit = document.getElementById("submit");
const popup = document.getElementById("popup");
const errorPopup = document.getElementById("error-popup");
const popupMessage = document.getElementById("popup-message");
const errorMessage = document.getElementById("error-message");

// Form validation
const setError = (element, message) => {
  const inputControl = element.parentElement;
  const errorDisplay = inputControl.querySelector(".error");
  errorDisplay.innerText = message;
  inputControl.classList.add("error");
  inputControl.classList.remove("success");
};

const setSuccess = (element) => {
  const inputControl = element.parentElement;
  const errorDisplay = inputControl.querySelector(".error");
  errorDisplay.innerText = "";
  inputControl.classList.add("success");
  inputControl.classList.remove("error");
};

const isValidEmail = (email) => {
  const re =
    /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
  return re.test(String(email).toLowerCase());
};

const isValidUsername = (username) => {
  const re = /^[a-zA-Z][a-zA-Z0-9._]{1,15}$/;
  return re.test(username);
};

const validateInputs = async () => {
  const firstnameValue = firstname.value.trim();
  const lastnameValue = lastname.value.trim();
  const emailValue = email.value.trim();
  const passwordValue = password.value.trim();
  const password2Value = password2.value.trim();

  let isValid = true;

  if (firstnameValue === "") {
    setError(firstname, "Username is required");
    isValid = false;
  } else if (!isValidUsername(firstnameValue)) {
    setError(
      firstname,
      "3-16 chars, begin with a letter. Contain: letters, numbers underscores and periods."
    );
    isValid = false;
  } else {
    setSuccess(firstname);
  }

  if (lastnameValue === "") {
    setError(lastname, "Full name is required");
    isValid = false;
  } else {
    setSuccess(lastname);
  }

  if (emailValue === "") {
    setError(email, "Email is required");
    isValid = false;
  } else if (!isValidEmail(emailValue)) {
    setError(email, "Provide a valid email address");
    isValid = false;
  } else {
    setSuccess(email);
  }

  if (passwordValue === "") {
    setError(password, "Password is required");
    isValid = false;
  } else if (passwordValue.length < 8) {
    setError(password, "Password must be at least 8 characters.");
    isValid = false;
  } else {
    setSuccess(password);
  }

  if (password2Value === "") {
    setError(password2, "Please confirm your password");
    isValid = false;
  } else if (password2Value !== passwordValue) {
    setError(password2, "Passwords don't match");
    isValid = false;
  } else {
    setSuccess(password2);
  }

  return isValid;
};

// Popup functions
const showPopup = (message) => {
  popupMessage.textContent = message;
  popup.classList.add("show");
};

const showError = (message) => {
  errorMessage.textContent = message;
  errorPopup.classList.add("show");
};

const closePopup = () => {
  window.location.href = "register.html";
};

// Attach the closePopup function to the close button
document.querySelector(".close").addEventListener("click", closePopup);

// Submit event listener
submit.addEventListener("click", async (event) => {
  event.preventDefault();

  // Disable the submit button
  submit.disabled = true;

  if (await validateInputs()) {
    const emailValue = email.value.trim();
    const firstnameValue = firstname.value.trim();
    const lastnameValue = lastname.value.trim();
    const passwordValue = password.value.trim();

    createUserWithEmailAndPassword(auth, emailValue, passwordValue)
      .then((userCredential) => {
        const user = userCredential.user;

        // Store user data in Realtime Database
        set(ref(database, "users/" + user.uid), {
          firstname: firstnameValue,
          lastname: lastnameValue,
          email: emailValue,
          role: "user",
          balance: 0,
          investments: 0,
          deposits: 0,
          referrals: 0,
        })
          .then(() => {
            showPopup("Account Created Successfully.");
            setTimeout(() => {
              window.location.href = "login.html";
            }, 5000);
          })
          .catch((error) => {
            console.error("Error writing user data:", error);
            showError("Error writing user data: " + error.message);
            // Re-enable the submit button
            submit.disabled = false;
          });
      })
      .catch((error) => {
        // Handle specific Firebase errors
        if (error.code === "auth/email-already-in-use") {
          showError("This email is already registered with an account.");
          setTimeout(() => {
            window.location.href = "register.html";
          }, 5000);
        } else {
          showError("An error occurred: " + error.message);
        }
        // Re-enable the submit button
        submit.disabled = false;
      });
  } else {
    // If validation fails, re-enable the submit button
    submit.disabled = false;
  }
});
