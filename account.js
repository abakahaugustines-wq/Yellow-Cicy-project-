import { auth } from "./firebase.js";

import {
    onAuthStateChanged,
    signOut
} from "https://www.gstatic.com/firebasejs/12.17.1/firebase-auth.js";


// =====================================================
// ELEMENTS
// =====================================================

const customerName =
    document.getElementById("customer-name");

const customerEmail =
    document.getElementById("customer-email");

const logoutButton =
    document.getElementById("logout-btn");

const callSupportButton =
    document.getElementById("support-call-btn");


// =====================================================
// CUSTOMER SUPPORT NUMBER
// =====================================================

const SUPPORT_NUMBER =
    "+233597131974";


// =====================================================
// AUTH STATE
// =====================================================

onAuthStateChanged(
    auth,
    function(user) {

        // =================================================
        // NO USER
        // =================================================

        if (!user) {

            if (customerName) {

                customerName.textContent =
                    "Welcome to Yellow Cicy";

            }


            if (customerEmail) {

                customerEmail.innerHTML = `
                    You are not currently logged in.
                    <br>

                    <button
                        type="button"
                        id="customer-login-link"
                        style="
                            display:inline-block;
                            margin-top:8px;
                            padding:10px 16px;
                            border:none;
                            border-radius:8px;
                            background:#FFD700;
                            color:#111;
                            font-weight:bold;
                            cursor:pointer;
                        "
                    >
                        🔐 Login or Create Account
                    </button>
                `;


                const customerLoginLink =
                    document.getElementById(
                        "customer-login-link"
                    );


                if (customerLoginLink) {

                    customerLoginLink.addEventListener(
    "click",
    function() {

        window.location.href =
            "customer-login.html";

    }
);
                }

            }


            return;
        }


        // =================================================
        // USER IS LOGGED IN
        // =================================================

        if (customerName) {

            customerName.textContent =
                "Welcome to Yellow Cicy";

        }


        if (customerEmail) {

            // =============================================
            // EMAIL ACCOUNT
            // =============================================

            if (
                !user.isAnonymous &&
                user.email
            ) {

                customerEmail.innerHTML = `
                    Logged in as:
                    <strong>
                        ${escapeHTML(user.email)}
                    </strong>
                `;

            }


            // =============================================
            // ANONYMOUS CHECKOUT ACCOUNT
            // =============================================

            else {

                customerEmail.innerHTML = `
                    You are using a guest account.
                    <br>

                    <a
                        href="./customer-login.html"
                        style="
                            display:inline-block;
                            margin-top:8px;
                            font-weight:bold;
                            text-decoration:none;
                        "
                    >
                        🔐 Create an account to manage your orders
                    </a>
                `;

            }

        }

    }
);


// =====================================================
// LOGOUT
// =====================================================

if (logoutButton) {

    logoutButton.addEventListener(
        "click",
        async function() {

            const confirmed =
                confirm(
                    "Are you sure you want to logout?"
                );


            if (!confirmed) {

                return;

            }


            try {

                logoutButton.disabled =
                    true;

                logoutButton.textContent =
                    "Logging out...";


                await signOut(auth);


                window.location.href =
                    "index.html";


            } catch (error) {

                console.error(
                    "Logout error:",
                    error
                );


                alert(
                    "Logout failed.\n\n" +
                    error.message
                );


                logoutButton.disabled =
                    false;

                logoutButton.innerHTML = `
                    <span class="menu-icon">
                        🚪
                    </span>

                    <span>
                        Logout
                    </span>
                `;

            }

        }
    );

}


// =====================================================
// CALL SUPPORT
// =====================================================

if (callSupportButton) {

    callSupportButton.addEventListener(
        "click",
        function() {

            window.location.href =
                "tel:" + SUPPORT_NUMBER;

        }
    );

}


// =====================================================
// HTML ESCAPE
// =====================================================

function escapeHTML(value) {

    return String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");

}