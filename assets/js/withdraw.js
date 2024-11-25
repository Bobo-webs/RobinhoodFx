// Initialize Firebase (make sure this is done before using Firebase)
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.1/firebase-app.js";
import {
  getAuth,
  onAuthStateChanged,
  signOut,
} from "https://www.gstatic.com/firebasejs/10.12.1/firebase-auth.js";
import {
  getDatabase,
  ref,
  get,
  child,
} from "https://www.gstatic.com/firebasejs/10.12.1/firebase-database.js";

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

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const database = getDatabase(app);
const logoutButton = document.getElementById("logoutButton");
const confirmYes = document.getElementById("confirmYes");
const confirmNo = document.getElementById("confirmNo");
const confirmationPopup = document.getElementById("confirmationPopup");

document.addEventListener("DOMContentLoaded", function () {
  const withdrawalForm = document.getElementById("withdrawalForm");
  const numberElement = document.querySelectorAll("#number-element");

  onAuthStateChanged(auth, (user) => {
    const loadingScreen = document.getElementById("loading-screen");
    const dashboardContent = document.getElementById("dashboard-content");
    const withdrawal = document.getElementById("withdraw");

    if (user) {
      loadingScreen.style.display = "none";
      dashboardContent.style.display = "block";
      withdrawal.style.display = "block";

      const userId = user.uid;
      displayUserData(userId);
    } else {
      window.location.href = "login.html";
    }
  });

  // ============== Form Submission Handler ============== //
  withdrawalForm.addEventListener("submit", function (event) {
    event.preventDefault();
    console.log("Submit button clicked"); // Debugging: Check if submit is triggered

    // Capture input values
    const withdrawAmount = parseFloat(
      document.getElementById("withdraw-amount").value.trim()
    );
    const crypto = document.getElementById("crypto").value.trim();
    const walletAddress = document
      .getElementById("wallet-address")
      .value.trim();
    const user = auth.currentUser;

    if (!withdrawAmount || !crypto || !walletAddress) {
      console.error("All fields are required.");
      alert("Please fill out all fields.");
      return;
    }

    if (user) {
      const userRef = ref(database, "users/" + user.uid + "/balance");

      get(userRef)
        .then((snapshot) => {
          if (snapshot.exists()) {
            const balance = snapshot.val();
            console.log("Balance fetched:", balance); // Debugging: Confirm balance fetch
            if (withdrawAmount > balance) {
              alert("Insufficient balance.");
            } else {
              // Balance is sufficient, send email and show custom popup
              console.log("Sufficient balance, sending email..."); // Debugging
              sendMail(); // Send email without showing success alert
              const customPopup = document.getElementById("customPopup");
              customPopup.classList.remove("hidden-pay");
            }
          } else {
            alert("No balance information found.");
          }
        })
        .catch((error) => {
          console.error("Error retrieving balance:", error);
        });
    } else {
      alert("No user is signed in. Please sign in first.");
    }
  });

  if (numberElement) {
    const number = parseFloat(numberElement.textContent.trim());
    if (!isNaN(number)) {
      numberElement.textContent = number.toLocaleString("en-US");
    }
  }
});

// ============== Display user data from Realtime Db ============== //
function displayUserData(uid) {
  const dbRef = ref(database);
  get(child(dbRef, `users/${uid}`))
    .then((snapshot) => {
      if (snapshot.exists()) {
        const userData = snapshot.val();
        const lastname = userData.lastname || "-";
        const firstname = userData.firstname || "user";
        const email = userData.email || "-";

        // Set the lastname in the fullname input field and disable it
        const fullnameInput = document.getElementById("name");
        if (fullnameInput) {
          fullnameInput.value = lastname;
          fullnameInput.disabled = true;
        }

        // Update email and disable input
        const emailInput = document.getElementById("email");
        if (emailInput) {
          emailInput.value = email;
          emailInput.disabled = true;
        }

        // Update the welcome message
        document.getElementById("welcomeMessage").textContent = `Welcome, ${firstname}!`;
        
        // Optionally display the user info in a specific div
        const userDataDiv = document.querySelector(".user-info");
        if (userDataDiv) {
          userDataDiv.innerHTML = `<h3>👋Hello, ${firstname}!</h3>`;
        }

        // Call function to update fund amount if needed
        updateFundAmount(uid);
      }
    })
    .catch((error) => {
      console.error("Error retrieving user data: ", error);
    });
}



// ============== Logout Fx ================ //
logoutButton.addEventListener("click", () => {
  localStorage.clear(); // Clear the storage
  confirmationPopup.classList.add("show");
});

confirmYes.addEventListener("click", () => {
  signOut(auth)
    .then(() => {
      showPopup("Logged out successfully!");
      setTimeout(() => {
        window.location.href = "login.html";
      }, 5000);
    })
    .catch((error) => {
      console.error("Error logging out:", error);
      showPopup("Error logging out: " + error.message);
    });
  confirmationPopup.classList.remove("show");
});

confirmNo.addEventListener("click", () => {
  confirmationPopup.classList.remove("show");
});

const showPopup = (message) => {
  const popup = document.getElementById("popup");
  const popupMessage = document.getElementById("popup-message");
  popupMessage.textContent = message;
  popup.classList.add("show");
};

const closePopup = () => {
  const popup = document.getElementById("popup");
  popup.classList.remove("show");
};

document.querySelector(".close").addEventListener("click", closePopup);

// --------------------
// Show the custom popup when the "Confirm Payment" button is clicked
document.addEventListener("click", function (event) {
  if (event.target.classList.contains("confirmPaymentButton")) {
    const customPopup = document.getElementById("customPopup");
    customPopup.classList.remove("hidden-pay");
  }
});

// When the user clicks "OK" in the custom popup, show the browser alert and close the custom popup
document.getElementById("popupOkButton").addEventListener("click", function () {
  alert("Verifying your deposit... Account will be credited upon confirmation");
  window.location.href = "withdraw.html";
  const customPopup = document.getElementById("customPopup");
  customPopup.classList.add("hidden-pay");
});

// Close the custom popup when the close button is clicked
document
  .getElementById("popupCloseButton")
  .addEventListener("click", function () {
    const customPopup = document.getElementById("customPopup");
    customPopup.classList.add("hidden-pay");
  });

// ============== Send Email Function ============== //
function sendMail() {
  var params = {
    name: document.getElementById("name").value,
    email: document.getElementById("email").value,
    wallet_address: document.getElementById("wallet-address").value,
    withdraw_amount: document.getElementById("withdraw-amount").value,
    crypto_type: document.getElementById("crypto").value
  };

  const serviceID = "service_y2sajs9";
  const templateID = "template_5nifo4i";

  emailjs
    .send(serviceID, templateID, params)
    .then((res) => {
      console.log("Email sent successfully", res); // Log success without showing an alert
    })
    .catch((err) => console.log("Error sending email:", err));
}
