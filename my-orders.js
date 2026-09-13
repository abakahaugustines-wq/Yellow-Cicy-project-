import { auth, db } from "./firebase.js";

import {
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/12.17.1/firebase-auth.js";

import {
    collection,
    getDocs,
    query,
    where,
    doc,
    updateDoc,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.17.1/firebase-firestore.js";


// =====================================================
// ELEMENTS
// =====================================================

const ordersContainer =
    document.getElementById("customer-orders");

const notificationsContainer =
    document.getElementById("order-notifications");


// =====================================================
// HELPERS
// =====================================================

function escapeHTML(value) {

    return String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");

}


// =====================================================
// FORMAT DATE
// =====================================================

function formatDate(value) {

    if (!value) {
        return "Not available";
    }

    let date;

    if (
        value &&
        typeof value.toDate === "function"
    ) {

        date = value.toDate();

    } else {

        date = new Date(value);

    }

    if (isNaN(date.getTime())) {
        return "Not available";
    }

    return date.toLocaleDateString(
        "en-GH",
        {
            year: "numeric",
            month: "long",
            day: "numeric"
        }
    );

}


// =====================================================
// GET DATE
// =====================================================

function getDate(value) {

    if (!value) {
        return null;
    }

    if (
        value &&
        typeof value.toDate === "function"
    ) {

        return value.toDate();

    }

    const date =
        new Date(value);

    if (isNaN(date.getTime())) {
        return null;
    }

    return date;

}


// =====================================================
// STATUS CLASS
// =====================================================

function getStatusClass(status) {

    return String(status || "")
        .toLowerCase()
        .replace(/\s+/g, "-");

}
// =====================================================
// ORDER TRACKING
// =====================================================

function getTrackingSteps(order) {

    const deliveryMethod =
        order.deliveryMethod === "pickup_station"
            ? "pickup"
            : "delivery";

    const status =
        String(order.status || "paid")
            .toLowerCase()
            .trim();


    // -------------------------------------------------
    // CANCELLED ORDER
    // -------------------------------------------------

    if (status === "cancelled") {

        return [

            {
                label: "Order Placed",
                date: order.createdAt,
                completed: true
            },

            {
                label: "Cancelled",
                date: order.cancelledAt,
                completed: true,
                current: true
            }

        ];

    }


    // -------------------------------------------------
    // PICKUP STATION
    // -------------------------------------------------

    if (deliveryMethod === "pickup") {

        const steps = [

            {
                label: "Order Placed",
                date: order.createdAt
            },

            {
                label: "Processing",
                date: order.processingAt
            },

            {
                label: "Shipped",
                date: order.shippedAt
            },

            {
                label: "At Pickup Station",
                date: order.pickupArrivedAt
            },

            {
                label: "Collected",
                date: order.collectedAt
            }

        ];


        let currentIndex = 0;


        if (
            status === "processing"
        ) {

            currentIndex = 1;

        } else if (
            status === "shipped"
        ) {

            currentIndex = 2;

        } else if (
            status === "at pickup station"
        ) {

            currentIndex = 3;

        } else if (
            status === "collected" ||
            status === "picked up" ||
            status === "delivered"
        ) {

            currentIndex = 4;

        }


        return steps.map(
            function(step, index) {

                return {

                    ...step,

                    completed:
                        index < currentIndex,

                    current:
                        index === currentIndex

                };

            }
        );

    }


    // -------------------------------------------------
    // HOME DELIVERY
    // -------------------------------------------------

    const steps = [

        {
            label: "Order Placed",
            date: order.createdAt
        },

        {
            label: "Processing",
            date: order.processingAt
        },

        {
            label: "Shipped",
            date: order.shippedAt
        },

        {
            label: "Out for Delivery",
            date: order.outForDeliveryAt
        },

        {
            label: "Delivered",
            date: order.deliveredAt
        }

    ];


    let currentIndex = 0;


    if (
        status === "processing"
    ) {

        currentIndex = 1;

    } else if (
        status === "shipped"
    ) {

        currentIndex = 2;

    } else if (
        status === "out for delivery"
    ) {

        currentIndex = 3;

    } else if (
        status === "delivered"
    ) {

        currentIndex = 4;

    }


    return steps.map(
        function(step, index) {

            return {

                ...step,

                completed:
                    index < currentIndex,

                current:
                    index === currentIndex

            };

        }
    );

}


// =====================================================
// RENDER ORDER TRACKING
// =====================================================

function renderOrderTracking(order) {

    const steps =
        getTrackingSteps(order);


    const status =
        String(
            order.status || "paid"
        ).toLowerCase();


    const timeline =
        steps.map(
            function(step) {

                let icon = "○";


                if (step.completed) {
                    icon = "✓";
                }


                if (step.current) {
                    icon = "●";
                }


                return `

                    <div
                        class="
                            tracking-step
                            ${
                                step.completed
                                    ? "completed"
                                    : ""
                            }
                            ${
                                step.current
                                    ? "current"
                                    : ""
                            }
                        "
                    >

                        <div class="tracking-icon">
                            ${icon}
                        </div>


                        <span class="tracking-label">
                            ${escapeHTML(
                                step.label
                            )}
                        </span>


                        ${
                            step.date
                                ? `
                                    <span class="tracking-date">
                                        ${escapeHTML(
                                            formatDate(
                                                step.date
                                            )
                                        )}
                                    </span>
                                `
                                : ""
                        }

                    </div>

                `;

            }
        ).join("");


    let message =
        "Your order has been placed successfully.";


    if (status === "processing") {

        message =
            "Your order is being prepared.";

    } else if (status === "shipped") {

        message =
            "Your order has been shipped and is on its way.";

    } else if (
        status === "out for delivery"
    ) {

        message =
            "Your order is out for delivery.";

    } else if (
        status === "at pickup station"
    ) {

        message =
            "Your order has arrived at the pickup station and is ready for collection.";

    } else if (
        status === "collected" ||
        status === "picked up"
    ) {

        message =
            "Your order has been collected successfully.";

    } else if (
        status === "delivered"
    ) {

        message =
            "Your order has been delivered successfully.";

    } else if (
        status === "cancelled"
    ) {

        message =
            "This order has been cancelled.";

    }


    return `

        <div class="order-tracking">

            <h3 class="order-tracking-title">
                📍 Order Tracking
            </h3>


            <div class="tracking-timeline">

                ${timeline}

            </div>


            <div class="tracking-message">

                ${escapeHTML(message)}

            </div>

        </div>

    `;

}


// =====================================================
// PICKUP NOTIFICATION
// =====================================================

function showPickupNotification(order) {

    if (
        String(order.status || "")
            .toLowerCase() !==
        "at pickup station"
    ) {

        return;

    }


    const station =
        order.pickupBranch ||
        order.pickupPoint ||
        order.pickupAddress ||
        "Your selected pickup station";


    const pickupPoint =
        order.pickupPoint ||
        "Pickup point not provided";


    const pickupAddress =
        order.pickupAddress ||
        "";


    const arrivedDate =
        order.pickupArrivedAt
            ? formatDate(
                order.pickupArrivedAt
            )
            : "Recently";


    const deadline =
        order.pickupDeadlineAt
            ? formatDate(
                order.pickupDeadlineAt
            )
            : "9 days after arrival";


    notificationsContainer.innerHTML += `

        <div
            class="pickup-ready-card"
        >

            <div
                class="pickup-ready-icon"
            >
                📍
            </div>


            <div>

                <h2>
                    🎉 Your Order Is Ready for Pickup!
                </h2>


                <p>
                    Order
                    <strong>
                        ${escapeHTML(
                            order.reference ||
                            order.id
                        )}
                    </strong>
                    has arrived and is ready for collection.
                </p>

            </div>


            <div
                class="pickup-details-box"
            >

                <div>

                    <span>
                        🏪
                    </span>

                    <div>

                        <strong>
                            Pickup Station
                        </strong>

                        <p>
                            ${escapeHTML(
                                station
                            )}
                        </p>

                    </div>

                </div>


                <div>

                    <span>
                        📍
                    </span>

                    <div>

                        <strong>
                            Pickup Point
                        </strong>

                        <p>
                            ${escapeHTML(
                                pickupPoint
                            )}
                        </p>

                    </div>

                </div>


                ${
                    pickupAddress
                    ?
                    `

                    <div>

                        <span>
                            🗺️
                        </span>

                        <div>

                            <strong>
                                Address
                            </strong>

                            <p>
                                ${escapeHTML(
                                    pickupAddress
                                )}
                            </p>

                        </div>

                    </div>

                    `
                    :
                    ""
                }


                <div>

                    <span>
                        📅
                    </span>

                    <div>

                        <strong>
                            Arrived
                        </strong>

                        <p>
                            ${escapeHTML(
                                arrivedDate
                            )}
                        </p>

                    </div>

                </div>


                <div>

                    <span>
                        ⏰
                    </span>

                    <div>

                        <strong>
                            Pickup Deadline
                        </strong>

                        <p>
                            ${escapeHTML(
                                deadline
                            )}
                        </p>

                    </div>

                </div>

            </div>


            <div
                class="pickup-ready-message"
            >

                <strong>
                    💡 Please bring your order number when collecting your package.
                </strong>

                <br>

                Collect your order before the pickup deadline.

            </div>


            <div
                class="pickup-status-badge"
            >

                ✅ READY FOR PICKUP

            </div>

        </div>

    `;

}

// =====================================================
// CANCEL ORDER
// =====================================================

async function cancelOrder(
    orderId,
    currentUser
) {

    const confirmation =
        confirm(
            "Are you sure you want to cancel this order?"
        );

    if (!confirmation) {
        return;
    }


    try {

        // =============================================
        // CHECK CURRENT USER
        // =============================================

        if (
            !currentUser ||
            !currentUser.uid
        ) {

            alert(
                "Your checkout session could not be found. Please refresh the page."
            );

            return;

        }


        // =============================================
        // GET ORDER
        // =============================================

        const ordersQuery =
            query(
                collection(
                    db,
                    "orders"
                ),

                where(
                    "__name__",
                    "==",
                    orderId
                )
            );


        const snapshot =
            await getDocs(
                ordersQuery
            );


        if (snapshot.empty) {

            alert(
                "This order could not be found."
            );

            return;

        }


        const orderDoc =
            snapshot.docs[0];


        const orderData =
            orderDoc.data();


        // =============================================
        // VERIFY ORDER OWNER USING UID
        // =============================================

        if (
            !orderData.customerUid ||
            orderData.customerUid !==
            currentUser.uid
        ) {

            alert(
                "You are not authorized to cancel this order."
            );

            return;

        }


        // =============================================
        // VERIFY ORDER STATUS
        // =============================================

        const status =
            String(
                orderData.status ||
                "paid"
            ).toLowerCase();


        const canCancel =
            status === "paid" ||
            status === "processing" ||
            status === "shipped";


        if (!canCancel) {

            alert(
                "This order can no longer be cancelled."
            );

            return;

        }


        // =============================================
        // UPDATE ORDER
        // =============================================

        const orderRef =
            doc(
                db,
                "orders",
                orderId
            );


        await updateDoc(
            orderRef,
            {

                status:
                    "Cancelled",

                cancelledAt:
                    serverTimestamp(),

                cancelledBy:
                    "customer"

            }
        );


        alert(
            "Your order has been cancelled."
        );


        location.reload();


    } catch (error) {

        console.error(
            "CUSTOMER CANCEL ERROR:",
            error
        );


        alert(
            "Unable to cancel your order.\n\n" +
            error.message
        );

    }

}


// =====================================================
// DISPLAY ORDERS
// =====================================================

function displayOrders(orders) {

    if (orders.length === 0) {

        ordersContainer.innerHTML = `

            <div class="account-card">

                <h2>
                    No Orders Yet
                </h2>

                <p>
                    You have not placed any orders yet.
                </p>

                <a
                    href="index.html"
                    class="account-button"
                >
                    🛍️ Start Shopping
                </a>

            </div>

        `;

        return;

    }


    // =================================================
    // CLEAR OLD NOTIFICATIONS
    // =================================================

    notificationsContainer.innerHTML = "";


    // =================================================
    // SHOW PICKUP NOTIFICATIONS
    // =================================================

    orders.forEach(
        function(order) {

            showPickupNotification(order);

        }
    );


    let html = "";


    // =================================================
    // DISPLAY EACH ORDER
    // =================================================

    orders.forEach(
        function(order) {

            const status =
                order.status ||
                "paid";


            const items =
                Array.isArray(order.items)
                    ? order.items
                    : [];


            const deliveryMethod =
                order.deliveryMethod ===
                "pickup_station"
                    ? "Pickup Station"
                    : "Home Delivery";
                    const trackingHTML =
    renderOrderTracking(order);


            // =========================================
            // CUSTOMER CANCELLATION
            // =========================================

            const normalizedStatus =
                String(status)
                    .toLowerCase();


            const canCancel =
                normalizedStatus === "paid" ||
                normalizedStatus === "processing" ||
                normalizedStatus === "shipped";


            html += `

                <div
                    class="account-card"
                    style="
                        margin-bottom:20px;
                    "
                >

                    <h2>
                        📦 Order
                    </h2>


                    <p>

                        <strong>
                            Order Number:
                        </strong>

                        ${escapeHTML(
                            order.reference ||
                            order.id
                        )}

                    </p>


                    <p>

                        <strong>
                            Status:
                        </strong>

                        <span
                            class="order-status ${escapeHTML(
                                getStatusClass(status)
                            )}"
                        >
                            ${escapeHTML(status)}
                        </span>

                    </p>


                    <p>

                        <strong>
                            Total:
                        </strong>

                        GHS
                        ${Number(
                            order.total || 0
                        ).toFixed(2)}

                    </p>


                    <p>

                        <strong>
                            Delivery:
                        </strong>

                        ${deliveryMethod}

                    </p>


                    ${
                        order.deliveryMethod ===
                        "pickup_station"

                        ?

                        `

                        <p>

                            <strong>
                                Pickup Station:
                            </strong>

                            ${escapeHTML(
                                order.pickupBranch ||
                                order.pickupPoint ||
                                order.pickupAddress ||
                                "Selected pickup station"
                            )}

                        </p>

                        `

                        :

                        ""

                    }


                    <p>

                        <strong>
                            Order Date:
                        </strong>

                        ${formatDate(
                            order.createdAt
                        )}

                    </p>
                    ${trackingHTML}


                    ${
                        order.shippedAt

                        ?

                        `

                        <p>

                            🚚
                            <strong>
                                Shipped:
                            </strong>

                            ${formatDate(
                                order.shippedAt
                            )}

                        </p>

                        `

                        :

                        ""

                    }


                    ${
                        order.expectedArrivalAt

                        ?

                        `

                        <p>

                            📅
                            <strong>
                                Expected Arrival:
                            </strong>

                            ${formatDate(
                                order.expectedArrivalAt
                            )}

                        </p>

                        `

                        :

                        ""

                    }


                    ${
                        order.pickupArrivedAt

                        ?

                        `

                        <p>

                            📍
                            <strong>
                                Arrived At Pickup:
                            </strong>

                            ${formatDate(
                                order.pickupArrivedAt
                            )}

                        </p>

                        `

                        :

                        ""

                    }


                    ${
                        order.pickupDeadlineAt

                        ?

                        `

                        <p>

                            ⏰
                            <strong>
                                Pickup Deadline:
                            </strong>

                            ${formatDate(
                                order.pickupDeadlineAt
                            )}

                        </p>

                        `

                        :

                        ""

                    }


                    <h3>
                        Items
                    </h3>


                    <div>

                        ${
                            items.length > 0

                            ?

                            items.map(
                                function(item) {

                                    return `

                                        <div
                                            style="
                                                display:flex;
                                                align-items:center;
                                                gap:12px;
                                                margin-bottom:12px;
                                                padding:8px;
                                                border-bottom:1px solid #ddd;
                                            "
                                        >

                                            ${
                                                item.image

                                                ?

                                                `

                                                <img
                                                    src="${escapeHTML(
                                                        item.image
                                                    )}"
                                                    alt="${escapeHTML(
                                                        item.name
                                                    )}"
                                                    style="
                                                        width:60px;
                                                        height:60px;
                                                        object-fit:cover;
                                                        border-radius:8px;
                                                    "
                                                >

                                                `

                                                :

                                                ""

                                            }


                                            <div>

                                                <strong>
                                                    ${escapeHTML(
                                                        item.name ||
                                                        "Product"
                                                    )}
                                                </strong>

                                                <br>

                                                Quantity:
                                                ${Number(
                                                    item.quantity || 1
                                                )}

                                                <br>

                                                GHS
                                                ${Number(
                                                    item.price || 0
                                                ).toFixed(2)}

                                            </div>

                                        </div>

                                    `;

                                }
                            ).join("")

                            :

                            "<p>No item information available.</p>"

                        }

                    </div>


                    ${
                        canCancel

                        ?

                        `

                        <div
                            style="
                                margin-top:20px;
                                padding-top:15px;
                                border-top:1px solid #ddd;
                            "
                        >

                            <button
                                type="button"
                                class="account-button cancel-customer-order"
                                data-order-id="${escapeHTML(
                                    order.id
                                )}"
                                style="
                                    background:#d32f2f;
                                    color:white;
                                    border:none;
                                    cursor:pointer;
                                "
                            >
                                ❌ Cancel Order
                            </button>

                        </div>

                        `

                        :

                        ""

                    }


                    ${
                        normalizedStatus ===
                        "cancelled"

                        ?

                        `

                        <p
                            style="
                                margin-top:15px;
                                font-weight:bold;
                            "
                        >
                            ❌ This order has been cancelled.
                        </p>

                        `

                        :

                        ""

                    }


                </div>

            `;

        }
    );


    ordersContainer.innerHTML =
        html;


    // =================================================
    // CANCEL BUTTON EVENTS
    // =================================================

    const cancelButtons =
        document.querySelectorAll(
            ".cancel-customer-order"
        );


    cancelButtons.forEach(
        function(button) {

            button.addEventListener(
                "click",
                function() {

                    const orderId =
                        button.dataset.orderId;


                    cancelOrder(
                        orderId,
                        auth.currentUser
                    );

                }
            );

        }
    );

}
// =====================================================
// LOAD CUSTOMER ORDERS
// =====================================================

async function loadCustomerOrders(user) {

    ordersContainer.innerHTML = `

        <div class="account-card">

            <p>
                Loading your orders...
            </p>

        </div>

    `;


    notificationsContainer.innerHTML = "";


    try {

        // =================================================
        // FIND ORDERS USING FIREBASE AUTH UID
        // =================================================

        const ordersQuery =
            query(
                collection(
                    db,
                    "orders"
                ),

                where(
                    "customerUid",
                    "==",
                    user.uid
                )
            );


        const snapshot =
            await getDocs(
                ordersQuery
            );


        const orders = [];


        snapshot.forEach(
            function(docSnap) {

                orders.push({

                    id:
                        docSnap.id,

                    ...docSnap.data()

                });

            }
        );


        // =================================================
        // SORT NEWEST ORDERS FIRST
        // =================================================

        orders.sort(
            function(a, b) {

                const dateA =
                    getDate(
                        a.createdAt
                    );

                const dateB =
                    getDate(
                        b.createdAt
                    );


                return (
                    (dateB?.getTime() || 0) -
                    (dateA?.getTime() || 0)
                );

            }
        );


        displayOrders(
            orders
        );


    } catch (error) {

        console.error(
            "CUSTOMER ORDERS ERROR:",
            error
        );


        ordersContainer.innerHTML = `

            <div class="account-card">

                <h2>
                    Unable to load orders
                </h2>

                <p>
                    ${escapeHTML(
                        error.message
                    )}
                </p>

            </div>

        `;

    }

}


// =====================================================
// AUTHENTICATION
// =====================================================

onAuthStateChanged(
    auth,
    function(user) {

        if (!user) {

            ordersContainer.innerHTML = `

                <div class="account-card">

                    <h2>
                        🔐 Login Required
                    </h2>

                    <p>
                        Please log in to view your orders.
                    </p>

                    <a
                        href="login.html"
                        class="account-button"
                    >
                        Login
                    </a>

                </div>

            `;

            return;

        }


        // =================================================
        // LOAD ORDERS FOR CURRENT AUTH USER
        // =================================================

        loadCustomerOrders(
            user
        );

    }
);