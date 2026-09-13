import { auth } from "./firebase.js";

import {
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword
} from "https://www.gstatic.com/firebasejs/12.17.1/firebase-auth.js";


// =====================================================
// ELEMENTS
// =====================================================

const emailInput =
    document.getElementById("email");

const passwordInput =
    document.getElementById("password");

const loginButton =
    document.getElementById("login-btn");

const registerButton =
    document.getElementById("register-btn");

const message =
    document.getElementById("login-message");


// =====================================================
// LOGIN
// =====================================================

loginButton.addEventListener(
    "click",
    async function() {

        const email =
            emailInput.value.trim();

        const password =
            passwordInput.value;


        if (!email || !password) {

            message.textContent =
                "Please enter your email and password.";

            return;
        }


        loginButton.disabled = true;
        registerButton.disabled = true;

        loginButton.textContent =
            "Logging in...";

        message.textContent = "";


        try {

            await signInWithEmailAndPassword(
                auth,
                email,
                password
            );


            message.textContent =
                "Login successful!";


            window.location.href =
                "account.html";


        } catch (error) {

            console.error(
                "Customer login error:",
                error
            );


            if (
                error.code ===
                "auth/invalid-credential"
            ) {

                message.textContent =
                    "Incorrect email or password.";

            } else if (
                error.code ===
                "auth/too-many-requests"
            ) {

                message.textContent =
                    "Too many attempts. Please try again later.";

            } else {

                message.textContent =
                    "Login failed. Please try again.";

            }


            loginButton.disabled = false;
            registerButton.disabled = false;

            loginButton.textContent =
                "🔐 Login";

        }

    }
);


// =====================================================
// CREATE ACCOUNT
// =====================================================

registerButton.addEventListener(
    "click",
    async function() {

        const email =
            emailInput.value.trim();

        const password =
            passwordInput.value;


        if (!email || !password) {

            message.textContent =
                "Please enter an email and password.";

            return;
        }


        if (password.length < 6) {

            message.textContent =
                "Password must be at least 6 characters.";

            return;
        }


        loginButton.disabled = true;
        registerButton.disabled = true;

        registerButton.textContent =
            "Creating account...";

        message.textContent = "";


        try {

            await createUserWithEmailAndPassword(
                auth,
                email,
                password
            );


            message.textContent =
                "Account created successfully!";


            window.location.href =
                "account.html";


        } catch (error) {

            console.error(
                "Account creation error:",
                error
            );


            if (
                error.code ===
                "auth/email-already-in-use"
            ) {

                message.textContent =
                    "This email already has an account.";

            } else if (
                error.code ===
                "auth/invalid-email"
            ) {

                message.textContent =
                    "Please enter a valid email address.";

            } else {

                message.textContent =
                    "Account creation failed. Please try again.";

            }


            loginButton.disabled = false;
            registerButton.disabled = false;

            registerButton.textContent =
                "📝 Create Account";

        }

    }
);