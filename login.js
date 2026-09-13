import { db } from "./firebase.js";

import {
    getAuth,
    signInWithEmailAndPassword
} from "https://www.gstatic.com/firebasejs/12.17.1/firebase-auth.js";


const auth = getAuth();


const emailInput =
    document.getElementById("email");

const passwordInput =
    document.getElementById("password");

const loginButton =
    document.getElementById("login-btn");

const message =
    document.getElementById("login-message");


loginButton.addEventListener(
    "click",
    async () => {

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
                "admin.html";


        } catch (error) {

            console.error(
                "Login error:",
                error
            );


            message.textContent =
                "Invalid email or password.";

            loginButton.disabled = false;

            loginButton.textContent =
                "Login";

        }

    }
);