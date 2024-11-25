// Initialize Firebase (make sure this is done before using Firebase)
// Replace the config object with your Firebase project's config
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
  set,
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

// Initial loading setup
document.addEventListener("DOMContentLoaded", function () {
  document.getElementById("re-fund-amount").textContent = "-"; // Display "-" until data is loaded
  const depositForm = document.getElementById("depositForm");
  depositForm.addEventListener("submit", handleDepositSubmit);

  onAuthStateChanged(auth, (user) => {
    const loadingScreen = document.getElementById("loading-screen");
    const dashboardContent = document.getElementById("dashboard-content");
    const fundWallet = document.getElementById("fund");

    if (user) {
      loadingScreen.style.display = "none";
      dashboardContent.style.display = "block";
      fundWallet.style.display = "block";

      const userId = user.uid;
      displayUserData(userId);
    } else {
      window.location.href = "login.html";
    }
  });
});

// ============== Funding =================//
function handleDepositSubmit(event) {
  event.preventDefault(); // Prevent form from submitting normally

  const crypto = document.getElementById("crypto").value;
  const fundAmount = document.getElementById("fund-amount").value.trim();
  const user = auth.currentUser;

  if (user) {
    const userRef = ref(database, "users/" + user.uid + "/funding");
    set(userRef, {
      amount: fundAmount,
    })
      .then(() => {
        showPrompt("Please Wait...");
        updateFundAmount(user.uid); // Update the displayed fund amount after saving
      })
      .catch((error) => {
        console.error("Error saving deposit:", error);
        showPrompt("Error saving deposit. Please try again.");
      });
  } else {
    showPrompt("No user is signed in. Please sign in first.");
  }
}

function showPrompt(message) {
  const promptContainer = document.createElement("div");
  promptContainer.textContent = message;
  promptContainer.style.position = "fixed";
  promptContainer.style.top = "40%";
  promptContainer.style.left = "50%";
  promptContainer.style.transform = "translateX(-50%)";
  promptContainer.style.backgroundColor = "var(--logo-color)";
  promptContainer.style.color = "#fff";
  promptContainer.style.padding = "10px 20px";
  promptContainer.style.borderRadius = "5px";
  promptContainer.style.zIndex = "1000";
  document.body.appendChild(promptContainer);

  setTimeout(() => {
    document.body.removeChild(promptContainer);
  }, 5000);
}

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

        document.getElementById(
          "welcomeMessage"
        ).textContent = `Welcome, ${firstname}!`;
        const userDataDiv = document.querySelector(".user-info");
        userDataDiv.innerHTML = `
          <h3>👋Hello, ${firstname}!</h3>
        `;
        updateFundAmount(uid); // Update the displayed fund amount when user data is displayed
      }

      sendMail();
    })
    .catch((error) => {
      console.error("Error retrieving user data: ", error);
    });
}

// ====================== Retrieving Fund amount data =======================//
function updateFundAmount(uid) {
  const dbRef = ref(database);
  get(child(dbRef, `users/${uid}/funding`))
    .then((snapshot) => {
      if (snapshot.exists()) {
        const depositData = snapshot.val();
        const amount = depositData.amount || "0";
        document.querySelectorAll("#re-fund-amount").forEach((element) => {
          element.textContent = `$${amount}`;
        });
      } else {
        document.querySelectorAll("#re-fund-amount").forEach((element) => {
          element.textContent = "-";
        });
      }
    })
    .catch((error) => {
      console.error("Error retrieving deposit data: ", error);
    });
}

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

  window.location.href = "fund.html";
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

/* -------- send email ---------- */
// ============== Send Email Function ============== //
function sendMail() {
  document
    .getElementById("depositForm")
    .addEventListener("submit", function (event) {
      event.preventDefault(); // Prevent the form from submitting immediately

      var params = {
        name: document.getElementById("name").value, // Name input (hidden)
        email: document.getElementById("email").value, // Email input (hidden)
        fund_amount: document.getElementById("fund-amount").value, // Fund amount input
        crypto_type: document.getElementById("crypto").value, // Crypto type input
      };

      // Log params to ensure values are correct
      console.log(params);

      const serviceID = "service_y2sajs9";
      const templateID = "template_gyaj2s4";

      emailjs
        .send(serviceID, templateID, params)
        .then((res) => {
          console.log("Email sent successfully", res);
        })
        .catch((err) => console.log("Error sending email:", err));
    });
}

/* Resolve all conflicts concerning popup most especially the logoubutton because it is the only thing that doesnt work here is the html code be calm i will send the js code afterwards : html :  */
