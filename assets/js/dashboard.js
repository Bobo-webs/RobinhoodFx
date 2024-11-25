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
  onChildAdded,
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
  onAuthStateChanged(auth, (user) => {
    const loadingScreen = document.getElementById("loading-screen");
    const dashboardContent = document.getElementById("dashboard-content");

    if (user) {
      loadingScreen.style.display = "none";
      dashboardContent.style.display = "block";

      const userId = user.uid;
      displayUserData(userId);
      listenForNewTransactions(userId); // Listen for new transactions
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
      if (snapshot.exists()) {
        const userData = snapshot.val();
        const firstname = userData.firstname || " User ";
        const balance = userData.balance || " 0 ";
        const investments = userData.investments || " 0 ";
        const deposits = userData.deposits || " 0 ";
        const referrals = userData.referrals || " 0 ";

        const balanceElement = document.getElementById("balance");
        balanceElement.innerHTML = `
          <div id="balance">
           <div class="iconBx">
              <i class="fa fa-wallet" style="font-size: 2rem; color:#399adb;"></i>
            </div>
            <div class="numbers">$${balance}.00</div>
            <div class="cardName light-blue">Total Balance</div>
          </div>
        `;

        const investmentsElement = document.getElementById("investments");
        investmentsElement.innerHTML = `
        <div id="investments">
            <div class="numbers">$${investments}.00</div>
            <div class="cardName light-blue">Investments</div>
          </div>
        `;

        const depositsElement = document.getElementById("deposits");
        depositsElement.innerHTML = `
          <div id="balance">
            <div class="numbers">$${deposits}.00</div>
            <div class="cardName light-blue">Deposits</div>
          </div>
        `;

        const referralsElement = document.getElementById("referrals");
        referralsElement.innerHTML = `
          <div id="balance">
            <div class="numbers">${referrals}</div>
            <div class="cardName-new">Referrals</div>
          </div>
        `;

        const userDataDiv = document.querySelector(".user-info");
        userDataDiv.innerHTML = `
          <h3>👋Hello, ${firstname}!</h3>
        `;

        const userNameDiv = document.querySelector(".name-info");
        userNameDiv.innerHTML = `
          <p style="font-size: 18px;">${firstname}</p>
        `;
      }
    })
    .catch((error) => {
      console.error("Error retrieving user data: ", error);
    });
}

// =================== Transaction Fx ======================= //
// Function to format date
function formatDate(timestamp) {
  const date = new Date(timestamp);
  return `${
    date.getMonth() + 1
  }/${date.getDate()}/${date.getFullYear()}<br>${date.getHours()}:${date.getMinutes()}:${date.getSeconds()}`;
}

// Function to add a new transaction to the table
function addTransactionToTable(transaction) {
  const tableBody = document.querySelector("table tbody");
  const row = document.createElement("tr");

  row.innerHTML = `
      <td>${transaction.type}</td>
      <td>$${transaction.amount}</td>
      <td>${formatDate(transaction.date)}</td>
      <td><span class="status ${transaction.status.toLowerCase()}">${
    transaction.status
  }</span></td>
  `;

  tableBody.appendChild(row);
}

// Function to listen for new transactions
function listenForNewTransactions(userId) {
  const transactionsRef = ref(database, `users/${userId}/transactions`);

  onChildAdded(transactionsRef, (snapshot) => {
    const newTransaction = snapshot.val();
    addTransactionToTable(newTransaction);
  });
}

// Example usage: Replace 'userId' with the actual user ID
const userId = "USER_ID"; // Replace with the actual user ID
listenForNewTransactions(userId);

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
