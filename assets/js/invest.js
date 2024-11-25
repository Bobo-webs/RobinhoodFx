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
const progressBar = document.getElementById("progress-bar");

function updateProgressBar(progress) {
  progressBar.style.width = `${progress}%`;
  if (progress === 0 || progress === 100) {
    document.getElementById("progress-bar-container").style.display = "none";
  } else {
    document.getElementById("progress-bar-container").style.display = "block";
  }
}

document.addEventListener("DOMContentLoaded", function () {
  onAuthStateChanged(auth, (user) => {
    const loadingScreen = document.getElementById("loading-screen");
    const dashboardContent = document.getElementById("dashboard-content");
    const invest = document.getElementById("invest");

    if (user) {
      loadingScreen.style.display = "none";
      dashboardContent.style.display = "block";
      invest.style.display = "block";

      const userId = user.uid;
      updateProgressBar(20);
      displayUserData(userId);
    } else {
      window.location.href = "login.html";
    }
  });
});

// ============== Display user data from Realtime Db ============== //
function displayUserData(uid) {
  const dbRef = ref(database);
  get(child(dbRef, `users/${uid}`))
    .then((snapshot) => {
      updateProgressBar(70);
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
      }
      updateProgressBar(100);
      setTimeout(() => {
        updateProgressBar(0);
      }, 500); // Hide progress bar
    })
    .catch((error) => {
      console.error("Error retrieving user data: ", error);
      updateProgressBar(0); // Reset progress bar on error
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
  window.location.href = "invest.html";
};

document.querySelector(".close-popup").addEventListener("click", closePopup);

// ============== Form Submission Check ============== //
document
  .getElementById("investmentForm")
  .addEventListener("submit", function (event) {
    event.preventDefault(); // Prevent the form from submitting

    // Get selected package
    const selectedPackage = document.querySelector(
      'input[name="package"]:checked'
    );
    if (!selectedPackage) {
      showPopup("Please select a package.");
      return;
    }

    const packageElement = selectedPackage.closest(".packages");
    const packageValue = parseFloat(
      packageElement.querySelector(".text2").textContent.replace(/[^\d.]/g, "")
    );

    // Fetch user balance from Firebase
    const user = auth.currentUser;
    if (user) {
      updateProgressBar(20);
      const userId = user.uid;
      get(child(ref(database), `users/${userId}/balance`))
        .then((snapshot) => {
          updateProgressBar(70);
          if (snapshot.exists()) {
            const balance = snapshot.val();

            if (balance < packageValue) {
              showPopup(
                "Insufficient balance❌, kindly top up balance for this package."
              );
            } else {
              showPopup("Processing the activation of your investment plan...");
              // Add additional logic here if needed (e.g., process the investment)
            }
          } else {
            showPopup("Balance information not found.");
          }
          updateProgressBar(100);
          setTimeout(() => {
            updateProgressBar(0);
          }, 500); // Hide progress bar
        })
        .catch((error) => {
          console.error("Error fetching user balance:", error);
          showPopup("An error occurred. Please try again later.");
          updateProgressBar(0); // Reset progress bar on error
        });
    } else {
      showPopup("User not authenticated.");
    }
  });

// ============== Send Email Function ============== //
function sendMail() {
  const selectedPackage = document.querySelector(
    'input[name="package"]:checked'
  );

  var params = {
    name: document.getElementById("name").value,
    email: document.getElementById("email").value,
    invest_amount: document.getElementById("invest-amount").value,
    package: selectedPackage ? selectedPackage.value : ""
  };

  // Log params to ensure values are correct
  console.log(params);

  const serviceID = "service_usy65hc";
  const templateID = "template_6qilufd";

  emailjs
    .send(serviceID, templateID, params)
    .then((res) => {
      console.log("Email sent successfully", res);
    })
    .catch((err) => console.log("Error sending email:", err));
}

// Set up the event listener
document.addEventListener("DOMContentLoaded", function () {
  document
    .getElementById("investmentForm")
    .addEventListener("submit", function (event) {
      event.preventDefault(); // Prevent the form from submitting immediately
      sendMail(); // Call the sendMail function
    });
});
