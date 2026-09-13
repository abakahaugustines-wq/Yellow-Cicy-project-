import { db, auth } from "./firebase.js";

import {
    signInAnonymously
} from "https://www.gstatic.com/firebasejs/12.17.1/firebase-auth.js";

import {
    collection,
    addDoc,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.17.1/firebase-firestore.js";


// =====================================================
// ELEMENTS
// =====================================================

const checkoutButton =
    document.getElementById("checkout-btn");

const nameInput =
    document.getElementById("customer-name");

const emailInput =
    document.getElementById("customer-email");

const phoneInput =
    document.getElementById("customer-phone");

const addressInput =
    document.getElementById("delivery-address");

const cityInput =
    document.getElementById("delivery-city");

const regionInput =
    document.getElementById("delivery-region");

const instructionsInput =
    document.getElementById("delivery-instructions");

const homeDelivery =
    document.getElementById("home-delivery");

const pickupDelivery =
    document.getElementById("pickup-delivery");

const pickupRegion =
    document.getElementById("pickup-region");

const pickupCity =
    document.getElementById("pickup-city");

const pickupStation =
    document.getElementById("pickup-station");


// =====================================================
// CHECKOUT BUTTON
// =====================================================

if (checkoutButton) {

    checkoutButton.addEventListener(
        "click",
        startCheckout
    );

}


// =====================================================
// START CHECKOUT
// =====================================================

async function startCheckout() {

    console.log(
        "Checkout button clicked."
    );


    // =================================================
    // GET CART
    // =================================================

    const cart =
        JSON.parse(
            localStorage.getItem("cart")
        ) || [];


    // =================================================
    // CHECK CART
    // =================================================

    if (cart.length === 0) {

        alert(
            "Your cart is empty."
        );

        return;

    }


    // =================================================
    // FIREBASE AUTHENTICATION
    // =================================================

    let currentUser =
        auth.currentUser;


    if (!currentUser) {

        try {

            const anonymousResult =
                await signInAnonymously(
                    auth
                );


            currentUser =
                anonymousResult.user;


            console.log(
                "Anonymous guest signed in:",
                currentUser.uid
            );

        }

        catch (error) {

            console.error(
                "GUEST AUTH ERROR:",
                error
            );


            alert(
                "We could not start your checkout session.\n\n" +
                "Please refresh the page and try again."
            );


            return;

        }

    }


    // =================================================
    // CUSTOMER UID
    // =================================================

    const customerUid =
        currentUser.uid;


    console.log(
        "Customer UID:",
        customerUid
    );


    // =================================================
    // CUSTOMER INFORMATION
    // =================================================

    const customerName =
        nameInput
            ? nameInput.value.trim()
            : "";

    const email =
        emailInput
            ? emailInput.value.trim()
            : "";

    const phone =
        phoneInput
            ? phoneInput.value.trim()
            : "";


    // =================================================
    // VALIDATE NAME
    // =================================================

    if (!customerName) {

        alert(
            "Please enter your full name."
        );

        if (nameInput) {
            nameInput.focus();
        }

        return;

    }


    // =================================================
    // VALIDATE EMAIL
    // =================================================

    if (!email) {

        alert(
            "Please enter your email address."
        );

        if (emailInput) {
            emailInput.focus();
        }

        return;

    }


    if (!email.includes("@")) {

        alert(
            "Please enter a valid email address."
        );

        if (emailInput) {
            emailInput.focus();
        }

        return;

    }


    // =================================================
    // VALIDATE PHONE
    // =================================================

    if (!phone) {

        alert(
            "Please enter your phone number."
        );

        if (phoneInput) {
            phoneInput.focus();
        }

        return;

    }


    // =================================================
    // DELIVERY METHOD
    // =================================================

    const deliveryMethod =
        pickupDelivery &&
        pickupDelivery.checked
            ? "pickup_station"
            : "home_delivery";


    console.log(
        "Delivery method:",
        deliveryMethod
    );


    // =================================================
    // DELIVERY VARIABLES
    // =================================================

    let deliveryAddress = "";

    let deliveryCity = "";

    let deliveryRegion = "";

    let deliveryInstructions = "";


    // =================================================
    // PICKUP VARIABLE
    // =================================================

    let selectedPickupStation =
        null;


    // =================================================
    // HOME DELIVERY
    // =================================================

    if (
        deliveryMethod ===
        "home_delivery"
    ) {

        deliveryAddress =
            addressInput
                ? addressInput.value.trim()
                : "";

        deliveryCity =
            cityInput
                ? cityInput.value.trim()
                : "";

        deliveryRegion =
            regionInput
                ? regionInput.value
                : "";

        deliveryInstructions =
            instructionsInput
                ? instructionsInput.value.trim()
                : "";


        if (!deliveryAddress) {

            alert(
                "Please enter your delivery address."
            );

            if (addressInput) {
                addressInput.focus();
            }

            return;

        }


        if (!deliveryCity) {

            alert(
                "Please enter your city or town."
            );

            if (cityInput) {
                cityInput.focus();
            }

            return;

        }


        if (!deliveryRegion) {

            alert(
                "Please select your region."
            );

            if (regionInput) {
                regionInput.focus();
            }

            return;

        }

    }


    // =================================================
    // PICKUP STATION
    // =================================================

    if (
        deliveryMethod ===
        "pickup_station"
    ) {

        const savedPickup =
            localStorage.getItem(
                "selectedPickupStation"
            );


        if (!savedPickup) {

            alert(
                "Please select an exact pickup station."
            );

            if (pickupStation) {
                pickupStation.focus();
            }

            return;

        }


        try {

            selectedPickupStation =
                JSON.parse(
                    savedPickup
                );

        }

        catch (error) {

            console.error(
                "PICKUP DATA ERROR:",
                error
            );


            alert(
                "The selected pickup station is invalid. Please select it again."
            );


            localStorage.removeItem(
                "selectedPickupStation"
            );


            return;

        }


        if (
            !selectedPickupStation ||
            !selectedPickupStation.id
        ) {

            alert(
                "Please select an exact pickup station."
            );

            return;

        }


        console.log(
            "Selected pickup station:",
            selectedPickupStation
        );

    }
    // =================================================
    // CALCULATE CART TOTAL
    // =================================================

    const total =
        cart.reduce(
            function(sum, item) {

                const price =
                    Number(
                        item.price
                    ) || 0;

                const quantity =
                    Number(
                        item.quantity
                    ) || 1;

                return (
                    sum +
                    price * quantity
                );

            },
            0
        );


    // =================================================
    // CONVERT TO PESEWAS
    // =================================================

    const amount =
        Math.round(
            total * 100
        );


    // =================================================
    // CHECK PAYMENT AMOUNT
    // =================================================

    if (amount <= 0) {

        alert(
            "Invalid payment amount."
        );

        return;

    }


    // =================================================
    // CHECK PAYSTACK
    // =================================================

    if (
        typeof
        "undefined"
    ) {

        alert(
            "Paystack failed to load. Please refresh the page and try again."
        );


        console.error(
            "PaystackPop is undefined."
        );


        return;

    }


    // =================================================
    // DISABLE CHECKOUT BUTTON
    // =================================================

    checkoutButton.disabled =
        true;


    checkoutButton.textContent =
        "Opening payment...";


    // =================================================
    // START PAYMENT
    // =================================================

    try {

        const paystack =
            new PaystackPop();


        paystack.newTransaction({

            // =========================================
            // PAYSTACK PUBLIC KEY
            // =========================================

            key:
                "pk_live_0e78f523d2e6e1c3d058f7cb02303c69f7e37b59",


            // =========================================
            // CUSTOMER EMAIL
            // =========================================

            email:
                email,


            // =========================================
            // AMOUNT
            // =========================================

            amount:
                amount,


            // =========================================
            // CURRENCY
            // =========================================

            currency:
                "GHS",


            // =========================================
            // PAYMENT SUCCESS
            // =========================================

            onSuccess:
                async function(transaction) {

                    console.log(
                        "PAYMENT SUCCESS:",
                        transaction
                    );


                    checkoutButton.textContent =
                        "Saving order...";


                    // =================================
                    // DEFAULT PICKUP DATA
                    // =================================

                    let pickupData = {

                        pickupStationId: "",

                        pickupRegion: "",

                        pickupCity: "",

                        pickupBranch: "",

                        pickupPoint: "",

                        pickupAddress: ""

                    };


                    // =================================
                    // SAVE SELECTED STATION DATA
                    // =================================

                    if (
                        deliveryMethod ===
                        "pickup_station"
                    ) {

                        pickupData = {

                            pickupStationId:
                                selectedPickupStation.id ||
                                "",

                            pickupRegion:
                                selectedPickupStation.region ||
                                "",

                            pickupCity:
                                selectedPickupStation.city ||
                                "",

                            pickupBranch:
                                selectedPickupStation.branch ||
                                "",

                            pickupPoint:
                                selectedPickupStation.pickupPoint ||
                                "",

                            pickupAddress:
                                selectedPickupStation.address ||
                                ""

                        };

                    }


                    console.log(
                        "Pickup data:",
                        pickupData
                    );


                    // =================================
                    // CREATE ORDER DATA
                    // =================================

                    const orderData = {

                        reference:
                            transaction.reference,

                        status:
                            "paid",

                        total:
                            total,

                        currency:
                            "GHS",

                        // Firebase Auth UID
                        // for registered or guest customer

                        customerUid:
                            customerUid,

                        items:
                            cart,

                        customerName:
                            customerName,

                        customerEmail:
                            email,

                        customerPhone:
                            phone,

                        deliveryMethod:
                            deliveryMethod,

                        deliveryAddress:
                            deliveryAddress,

                        deliveryCity:
                            deliveryCity,

                        deliveryRegion:
                            deliveryRegion,

                        deliveryInstructions:
                            deliveryInstructions,

                        pickupStationId:
                            pickupData.pickupStationId,

                        pickupRegion:
                            pickupData.pickupRegion,

                        pickupCity:
                            pickupData.pickupCity,

                        pickupBranch:
                            pickupData.pickupBranch,

                        pickupPoint:
                            pickupData.pickupPoint,

                        pickupAddress:
                            pickupData.pickupAddress,

                        createdAt:
                            serverTimestamp()

                    };


                    console.log(
                        "Order ready to save:",
                        orderData
                    );


                    // =================================
                    // SAVE ORDER TO FIRESTORE
                    // =================================

                    try {

                        const orderRef =
                            await addDoc(
                                collection(
                                    db,
                                    "orders"
                                ),
                                orderData
                            );


                        console.log(
                            "ORDER SAVED:",
                            orderRef.id
                        );


                        // =================================
                        // CLEAR CART
                        // =================================

                        localStorage.removeItem(
                            "cart"
                        );


                        // =================================
                        // CLEAR PICKUP STATION
                        // =================================

                        localStorage.removeItem(
                            "selectedPickupStation"
                        );


                        // =================================
                        // SUCCESS MESSAGE
                        // =================================

                        alert(
                            "Payment successful!\n\n" +
                            "Your order has been saved successfully.\n\n" +
                            "Order Number:\n" +
                            transaction.reference
                        );


                        // =================================
                        // GO TO ORDERS PAGE
                        // =================================

                        window.location.href =
                            "my-orders.html";

                    }


                    // =================================
                    // ORDER SAVE ERROR
                    // =================================

                    catch (error) {

                        console.error(
                            "ORDER SAVE FAILED:",
                            error
                        );


                        console.error(
                            "Firebase error code:",
                            error.code
                        );


                        console.error(
                            "Firebase error message:",
                            error.message
                        );


                        alert(
                            "Payment succeeded, but the order could not be saved.\n\n" +
                            error.message
                        );


                        checkoutButton.disabled =
                            false;


                        checkoutButton.textContent =
                            "Proceed to Checkout";

                    }

                },
                // =================================================
            // PAYMENT CANCELLED
            // =================================================

            onCancel:
                function() {

                    console.log(
                        "Payment cancelled."
                    );


                    checkoutButton.disabled =
                        false;


                    checkoutButton.textContent =
                        "Proceed to Checkout";


                    alert(
                        "Payment was cancelled."
                    );

                }

        });

    }


    // =================================================
    // PAYMENT OPENING ERROR
    // =================================================

    catch (error) {

        console.error(
            "PAYMENT ERROR:",
            error
        );


        checkoutButton.disabled =
            false;


        checkoutButton.textContent =
            "Proceed to Checkout";


        alert(
            "Could not open payment.\n\n" +
            error.message
        );

    }

}


// =====================================================
// END OF CHECKOUT.JS
// =====================================================