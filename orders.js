import { db, auth } from "./firebase.js";

import {
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/12.17.1/firebase-auth.js";

import {
    collection,
    getDocs,
    doc,
    updateDoc,
    serverTimestamp,
    Timestamp
} from "https://www.gstatic.com/firebasejs/12.17.1/firebase-firestore.js";


/* =========================
   ADMIN SECURITY
========================= */

const ADMIN_EMAIL =
    "abakahaugustines2@gmail.com";

onAuthStateChanged(
    auth,
    (user) => {

        if (!user) {

            alert(
                "Please log in to access Customer Orders."
            );

            window.location.href =
                "account.html";

            return;

        }

        if (
            user.email !==
            ADMIN_EMAIL
        ) {

            alert(
                "Access denied. Admins only."
            );

            window.location.href =
                "index.html";

            return;

        }

        console.log(
            "Yellow Cicy admin verified."
        );

        loadOrders();

    }
);


/* =========================
   ELEMENTS
========================= */

const ordersList =
    document.getElementById("orders-list");

const orderModal =
    document.getElementById("order-modal");

const orderDetails =
    document.getElementById("order-details");

const closeOrderModal =
    document.getElementById("close-order-modal");

const invoiceActions =
    document.getElementById("invoice-actions");

const invoiceBtn =
    document.getElementById("invoice-btn");

const statusActions =
    document.getElementById("status-actions");

const orderStatus =
    document.getElementById("order-status");

const updateStatusBtn =
    document.getElementById("update-status-btn");

const statusMessage =
    document.getElementById("status-message");


/* =========================
   CANCELLATION ELEMENTS
========================= */

const cancelOrderActions =
    document.getElementById("cancel-order-actions");

const cancelOrderBtn =
    document.getElementById("cancel-order-btn");

const cancelOrderMessage =
    document.getElementById("cancel-order-message");


/* =========================
   DELIVERY / PICKUP ELEMENTS
========================= */

const deliveryPickupInfo =
    document.getElementById("delivery-pickup-info");

const shippedDate =
    document.getElementById("shipped-date");

const expectedArrivalDate =
    document.getElementById("expected-arrival-date");

const pickupArrivalDate =
    document.getElementById("pickup-arrival-date");

const pickupDeadline =
    document.getElementById("pickup-deadline");


/* =========================
   DATA
========================= */

let orders = [];

let selectedOrder = null;


/* =========================
   ESCAPE HTML
========================= */

function escapeHTML(value) {

    if (
        value === null ||
        value === undefined
    ) {
        return "";
    }

    return String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");

}


/* =========================
   DATE FORMAT
========================= */

function formatDate(timestamp) {

    if (!timestamp) {
        return "Not available";
    }

    try {

        if (
            timestamp.seconds !== undefined
        ) {

            return new Date(
                timestamp.seconds * 1000
            ).toLocaleString();

        }

        return new Date(
            timestamp
        ).toLocaleString();

    } catch (error) {

        return "Not available";

    }

}


/* =========================
   GET DATE
========================= */

function getDateFromTimestamp(timestamp) {

    if (!timestamp) {
        return null;
    }

    try {

        if (
            timestamp.seconds !== undefined
        ) {

            return new Date(
                timestamp.seconds * 1000
            );

        }

        const date =
            new Date(timestamp);

        if (
            isNaN(
                date.getTime()
            )
        ) {

            return null;

        }

        return date;

    } catch (error) {

        return null;

    }

}


/* =========================
   ADD DAYS
========================= */

function addDays(date, days) {

    const result =
        new Date(date);

    result.setDate(
        result.getDate() + days
    );

    return result;

}


/* =========================
   SIMPLE DATE
========================= */

function formatSimpleDate(date) {

    if (!date) {
        return "Not available";
    }

    return date.toLocaleDateString(
        undefined,
        {
            year: "numeric",
            month: "long",
            day: "numeric"
        }
    );

}


/* =========================
   LOAD ORDERS
========================= */

async function loadOrders() {

    try {

        if (ordersList) {

            ordersList.innerHTML = `

                <tr>

                    <td colspan="5">

                        Loading orders...

                    </td>

                </tr>

            `;

        }


        const snapshot =
            await getDocs(
                collection(
                    db,
                    "orders"
                )
            );


        orders = [];


        snapshot.forEach(
            (orderDoc) => {

                orders.push({

                    id: orderDoc.id,

                    ...orderDoc.data()

                });

            }
        );


        orders.sort(
            (a, b) => {

                const dateA =
                    a.createdAt?.seconds || 0;

                const dateB =
                    b.createdAt?.seconds || 0;

                return dateB - dateA;

            }
        );


        displayOrders();


        try {

            await checkPickupDeadlines();

            displayOrders();

        } catch (deadlineError) {

            console.error(
                "Pickup deadline check failed:",
                deadlineError
            );

        }


    } catch (error) {

        console.error(
            "Error loading orders:",
            error
        );


        if (ordersList) {

            ordersList.innerHTML = `

                <tr>

                    <td colspan="5">

                        Unable to load orders.

                    </td>

                </tr>

            `;

        }

    }

}


/* =========================
   DISPLAY ORDERS
========================= */

function displayOrders() {

    if (!ordersList) {
        return;
    }


    ordersList.innerHTML = "";


    if (orders.length === 0) {

        ordersList.innerHTML = `

            <tr>

                <td colspan="5">

                    No orders found.

                </td>

            </tr>

        `;

        return;

    }


    orders.forEach(
        (order, index) => {

            const row =
                document.createElement("tr");


            row.innerHTML = `

                <td>

                    ${escapeHTML(
                        order.reference ||
                        order.id
                    )}

                </td>


                <td>

                    GHS ${Number(
                        order.total || 0
                    ).toFixed(2)}

                </td>


                <td>

                    ${escapeHTML(
                        order.status ||
                        "Paid"
                    )}

                </td>


                <td>

                    ${formatDate(
                        order.createdAt
                    )}

                </td>


                <td>

                    <button
                        type="button"
                        class="view-order-btn"
                        data-index="${index}"
                        style="
                            padding:8px 12px;
                            border:none;
                            border-radius:6px;
                            background:#FFD700;
                            color:#111;
                            cursor:pointer;
                            font-weight:bold;
                        "
                    >
                        View
                    </button>

                </td>

            `;


            ordersList.appendChild(row);

        }
    );


    document
        .querySelectorAll(
            ".view-order-btn"
        )
        .forEach(
            (button) => {

                button.addEventListener(
                    "click",
                    () => {

                        const index =
                            Number(
                                button.dataset.index
                            );

                        openOrderDetails(
                            orders[index]
                        );

                    }
                );

            }
        );

}
/* =========================
   ORDER DETAILS
========================= */

function openOrderDetails(order) {

    selectedOrder = order;

    let itemsHTML = "";


    if (
        Array.isArray(order.items) &&
        order.items.length > 0
    ) {

        itemsHTML = `

            <h3>
                Products
            </h3>

            <div
                style="
                    display:flex;
                    flex-direction:column;
                    gap:12px;
                    margin-bottom:20px;
                "
            >

        `;


        order.items.forEach(
            (item) => {

                const quantity =
                    Number(
                        item.quantity || 1
                    );

                const price =
                    Number(
                        item.price || 0
                    );

                const subtotal =
                    price * quantity;


                itemsHTML += `

                    <div
                        style="
                            display:flex;
                            gap:12px;
                            align-items:center;
                            padding:10px;
                            border:1px solid #ddd;
                            border-radius:8px;
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
                                    item.name ||
                                    "Product"
                                )}"
                                style="
                                    width:65px;
                                    height:65px;
                                    object-fit:cover;
                                    border-radius:8px;
                                "
                            >
                            `
                            :
                            ""
                        }


                        <div
                            style="
                                flex:1;
                            "
                        >

                            <strong>
                                ${escapeHTML(
                                    item.name ||
                                    "Product"
                                )}
                            </strong>


                            <div>
                                Qty:
                                ${quantity}
                            </div>


                            <div>
                                GHS ${price.toFixed(2)}
                                each
                            </div>

                        </div>


                        <strong>
                            GHS ${subtotal.toFixed(2)}
                        </strong>

                    </div>

                `;

            }
        );


        itemsHTML += `

            </div>

        `;

    } else {

        itemsHTML = `

            <p>
                No product details available.
            </p>

        `;

    }


    orderDetails.innerHTML = `

        <div
            style="
                line-height:1.7;
            "
        >

            <p>

                <strong>
                    Reference:
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

                ${escapeHTML(
                    order.status ||
                    "Paid"
                )}

            </p>


            <p>

                <strong>
                    Date:
                </strong>

                ${formatDate(
                    order.createdAt
                )}

            </p>


            ${
                order.customerName
                ?
                `
                <p>

                    <strong>
                        Customer:
                    </strong>

                    ${escapeHTML(
                        order.customerName
                    )}

                </p>
                `
                :
                ""
            }


            ${
                order.email
                ?
                `
                <p>

                    <strong>
                        Email:
                    </strong>

                    ${escapeHTML(
                        order.email
                    )}

                </p>
                `
                :
                ""
            }


            ${
                order.phone
                ?
                `
                <p>

                    <strong>
                        Phone:
                    </strong>

                    ${escapeHTML(
                        order.phone
                    )}

                </p>
                `
                :
                ""
            }


            ${
                order.deliveryAddress
                ?
                `
                <p>

                    <strong>
                        Delivery Address:
                    </strong>

                    ${escapeHTML(
                        order.deliveryAddress
                    )}

                </p>
                `
                :
                ""
            }


            ${
                order.pickupStation
                ?
                `
                <p>

                    <strong>
                        Pickup Station:
                    </strong>

                    ${escapeHTML(
                        order.pickupStation
                    )}

                </p>
                `
                :
                ""
            }


            ${itemsHTML}


            <div
                style="
                    border-top:2px solid #222;
                    padding-top:15px;
                    margin-top:15px;
                    font-size:20px;
                "
            >

                <strong>
                    Total Paid:
                </strong>

                GHS ${Number(
                    order.total || 0
                ).toFixed(2)}

            </div>

        </div>

    `;


    if (statusActions) {

        statusActions.style.display =
            "block";

    }


    if (orderStatus) {

        orderStatus.value =
            order.status || "Paid";

    }


    if (statusMessage) {

        statusMessage.textContent = "";

    }


    const cancellableStatuses = [
        "Paid",
        "Processing",
        "Shipped"
    ];


    const currentStatus =
        order.status || "Paid";


    if (cancelOrderActions) {

        if (
            cancellableStatuses.includes(
                currentStatus
            )
        ) {

            cancelOrderActions.style.display =
                "block";

        } else {

            cancelOrderActions.style.display =
                "none";

        }

    }


    if (cancelOrderMessage) {

        cancelOrderMessage.textContent = "";

    }


    updateDeliveryPickupInfo(
        order
    );


    if (invoiceActions) {

        invoiceActions.style.display =
            "block";

    }


    if (orderModal) {

        orderModal.style.display =
            "block";

    }


    document.body.style.overflow =
        "hidden";

}


/* =========================
   DELIVERY & PICKUP INFO
========================= */

function updateDeliveryPickupInfo(order) {

    if (!deliveryPickupInfo) {
        return;
    }


    deliveryPickupInfo.style.display =
        "block";


    const shippedAt =
        getDateFromTimestamp(
            order.shippedAt
        );


    if (shippedDate) {

        shippedDate.textContent =
            shippedAt
                ? `🚚 Shipped: ${formatSimpleDate(shippedAt)}`
                : "🚚 Shipped: Not yet shipped";

    }


    if (expectedArrivalDate) {

        const expectedAt =
            getDateFromTimestamp(
                order.expectedArrivalAt
            );


        if (expectedAt) {

            expectedArrivalDate.textContent =
                `📅 Expected at pickup station: ${formatSimpleDate(expectedAt)}`;

        } else if (shippedAt) {

            const calculatedDate =
                addDays(
                    shippedAt,
                    5
                );


            expectedArrivalDate.textContent =
                `📅 Expected at pickup station: ${formatSimpleDate(calculatedDate)}`;

        } else {

            expectedArrivalDate.textContent =
                "📅 Expected at pickup station: Not available";

        }

    }


    const arrivedAt =
        getDateFromTimestamp(
            order.pickupArrivedAt
        );


    if (pickupArrivalDate) {

        pickupArrivalDate.textContent =
            arrivedAt
                ? `📍 Arrived at pickup station: ${formatSimpleDate(arrivedAt)}`
                : "📍 Arrived at pickup station: Not yet arrived";

    }


    if (pickupDeadline) {

        const deadlineAt =
            getDateFromTimestamp(
                order.pickupDeadlineAt
            );


        if (deadlineAt) {

            pickupDeadline.textContent =
                `⏳ Pickup deadline: ${formatSimpleDate(deadlineAt)}`;

        } else if (arrivedAt) {

            const calculatedDeadline =
                addDays(
                    arrivedAt,
                    9
                );


            pickupDeadline.textContent =
                `⏳ Pickup deadline: ${formatSimpleDate(calculatedDeadline)}`;

        } else {

            pickupDeadline.textContent =
                "⏳ Pickup deadline: Not available";

        }

    }

}


/* =========================================
   UPDATE ORDER STATUS
========================================= */

async function updateOrderStatus() {

    if (!selectedOrder) {
        return;
    }

    if (!orderStatus) {
        return;
    }


    const newStatus =
        orderStatus.value;


    if (!newStatus) {
        return;
    }


    const oldStatus =
        selectedOrder.status || "Paid";


    try {

        if (statusMessage) {

            statusMessage.textContent =
                "Updating...";

            statusMessage.style.color =
                "#333";

        }


        const updateData = {

            status: newStatus

        };


        if (
            newStatus === "Shipped" &&
            oldStatus !== "Shipped"
        ) {

            const shippedAt =
                new Date();

            const expectedArrival =
                addDays(
                    shippedAt,
                    5
                );


            updateData.shippedAt =
                serverTimestamp();

            updateData.expectedArrivalAt =
                Timestamp.fromDate(
                    expectedArrival
                );

        }


        if (
            newStatus === "At Pickup Station" &&
            oldStatus !== "At Pickup Station"
        ) {

            const arrivedAt =
                new Date();

            const pickupDeadlineDate =
                addDays(
                    arrivedAt,
                    9
                );


            updateData.pickupArrivedAt =
                serverTimestamp();

            updateData.pickupDeadlineAt =
                Timestamp.fromDate(
                    pickupDeadlineDate
                );

        }


        await updateDoc(
            doc(
                db,
                "orders",
                selectedOrder.id
            ),
            updateData
        );


        selectedOrder.status =
            newStatus;


        if (
            newStatus === "Shipped" &&
            oldStatus !== "Shipped"
        ) {

            const shippedDateNow =
                new Date();

            selectedOrder.shippedAt =
                Timestamp.fromDate(
                    shippedDateNow
                );

            selectedOrder.expectedArrivalAt =
                Timestamp.fromDate(
                    addDays(
                        shippedDateNow,
                        5
                    )
                );

        }


        if (
            newStatus === "At Pickup Station" &&
            oldStatus !== "At Pickup Station"
        ) {

            const arrivalDate =
                new Date();


            selectedOrder.pickupArrivedAt =
                Timestamp.fromDate(
                    arrivalDate
                );

            selectedOrder.pickupDeadlineAt =
                Timestamp.fromDate(
                    addDays(
                        arrivalDate,
                        9
                    )
                );

        }


        const orderIndex =
            orders.findIndex(
                order =>
                    order.id ===
                    selectedOrder.id
            );


        if (orderIndex !== -1) {

            orders[orderIndex] =
                selectedOrder;

        }


        displayOrders();


        updateDeliveryPickupInfo(
            selectedOrder
        );


        const cancellableStatuses = [
            "Paid",
            "Processing",
            "Shipped"
        ];


        if (cancelOrderActions) {

            cancelOrderActions.style.display =
                cancellableStatuses.includes(
                    newStatus
                )
                ? "block"
                : "none";

        }


        if (statusMessage) {

            statusMessage.textContent =
                "✓ Order status updated successfully.";

            statusMessage.style.color =
                "green";

        }

    } catch (error) {

        console.error(
            "Error updating order status:",
            error
        );


        if (statusMessage) {

            statusMessage.textContent =
                "Failed to update order status.";

            statusMessage.style.color =
                "red";

        }

    }

}


/* =========================================
   AUTOMATIC PICKUP DEADLINE CHECK
========================================= */

async function checkPickupDeadlines() {

    const now =
        new Date();


    for (
        const order of orders
    ) {

        if (
            order.status !==
            "At Pickup Station"
        ) {

            continue;

        }


        const deadline =
            getDateFromTimestamp(
                order.pickupDeadlineAt
            );


        if (!deadline) {

            continue;

        }


        if (
            now.getTime() >
            deadline.getTime()
        ) {

            try {

                await updateDoc(
                    doc(
                        db,
                        "orders",
                        order.id
                    ),
                    {
                        status: "Cancelled",
                        pickupExpiredAt:
                            serverTimestamp()
                    }
                );


                order.status =
                    "Cancelled";


                console.log(
                    "Pickup deadline expired:",
                    order.id
                );


            } catch (error) {

                console.error(
                    "Failed to automatically cancel expired pickup order:",
                    order.id,
                    error
                );

            }

        }

    }

}
/* =========================================
   CUSTOMER ORDER CANCELLATION
========================================= */

async function cancelOrder() {

    if (!selectedOrder) {

        return;

    }


    const currentStatus =
        selectedOrder.status ||
        "Paid";


    const cancellableStatuses = [
        "Paid",
        "Processing",
        "Shipped"
    ];


    if (
        !cancellableStatuses.includes(
            currentStatus
        )
    ) {

        if (cancelOrderMessage) {

            cancelOrderMessage.textContent =
                "This order can no longer be cancelled.";

            cancelOrderMessage.style.color =
                "red";

        }

        return;

    }


    const confirmed =
        confirm(
            "Are you sure you want to cancel this order?"
        );


    if (!confirmed) {

        return;

    }


    try {

        if (cancelOrderMessage) {

            cancelOrderMessage.textContent =
                "Cancelling order...";

            cancelOrderMessage.style.color =
                "#333";

        }


        await updateDoc(
            doc(
                db,
                "orders",
                selectedOrder.id
            ),
            {
                status: "Cancelled",
                cancelledAt:
                    serverTimestamp()
            }
        );


        selectedOrder.status =
            "Cancelled";


        const orderIndex =
            orders.findIndex(
                order =>
                    order.id ===
                    selectedOrder.id
            );


        if (orderIndex !== -1) {

            orders[orderIndex] =
                selectedOrder;

        }


        if (orderStatus) {

            orderStatus.value =
                "Cancelled";

        }


        if (cancelOrderActions) {

            cancelOrderActions.style.display =
                "none";

        }


        displayOrders();


        if (cancelOrderMessage) {

            cancelOrderMessage.textContent =
                "✓ Order cancelled successfully.";

            cancelOrderMessage.style.color =
                "green";

        }


        openOrderDetails(
            selectedOrder
        );


    } catch (error) {

        console.error(
            "Error cancelling order:",
            error
        );


        if (cancelOrderMessage) {

            cancelOrderMessage.textContent =
                "Failed to cancel order.";

            cancelOrderMessage.style.color =
                "red";

        }

    }

}


/* =========================================
   UPDATE STATUS BUTTON
========================================= */

if (updateStatusBtn) {

    updateStatusBtn.addEventListener(
        "click",
        updateOrderStatus
    );

}


/* =========================================
   CANCEL ORDER BUTTON
========================================= */

if (cancelOrderBtn) {

    cancelOrderBtn.addEventListener(
        "click",
        cancelOrder
    );

}


/* =========================================
   CLOSE ORDER MODAL
========================================= */

if (closeOrderModal) {

    closeOrderModal.addEventListener(
        "click",
        () => {

            if (orderModal) {

                orderModal.style.display =
                    "none";

            }


            document.body.style.overflow =
                "auto";


            selectedOrder = null;

        }
    );

}


/* =========================================
   CLOSE MODAL BY CLICKING OUTSIDE
========================================= */

if (orderModal) {

    orderModal.addEventListener(
        "click",
        (event) => {

            if (
                event.target ===
                orderModal
            ) {

                orderModal.style.display =
                    "none";


                document.body.style.overflow =
                    "auto";


                selectedOrder = null;

            }

        }
    );

}


/* =========================================
   INVOICE BUTTON
========================================= */

if (invoiceBtn) {

    invoiceBtn.addEventListener(
        "click",
        showInvoice
    );

}


/* =========================================
   SHOW INVOICE
========================================= */

function showInvoice() {

    if (!selectedOrder) {

        alert(
            "Please select an order first."
        );

        return;

    }


    const order =
        selectedOrder;


    const itemsHTML =
        (order.items || [])
        .map(
            item => {

                const price =
                    Number(
                        item.price
                    ) || 0;


                const quantity =
                    Number(
                        item.quantity
                    ) || 1;


                const subtotal =
                    price * quantity;


                return `

                    <tr>

                        <td>
                            ${escapeHTML(
                                item.name ||
                                "Product"
                            )}
                        </td>


                        <td>
                            ${quantity}
                        </td>


                        <td>
                            GHS ${price.toFixed(2)}
                        </td>


                        <td>
                            GHS ${subtotal.toFixed(2)}
                        </td>

                    </tr>

                `;

            }
        )
        .join("");


    const total =
        Number(
            order.total
        ) || 0;


    const invoiceHTML = `

<!DOCTYPE html>

<html lang="en">

<head>

<meta charset="UTF-8">

<meta
    name="viewport"
    content="width=device-width, initial-scale=1.0"
>

<title>
    Yellow Cicy Invoice
</title>


<style>

body {

    font-family:
        Arial,
        sans-serif;

    margin:0;

    padding:30px;

    color:#111;

}


.invoice {

    max-width:800px;

    margin:auto;

}


.header {

    text-align:center;

    border-bottom:
        2px solid #FFD700;

    padding-bottom:20px;

    margin-bottom:25px;

}


.header h1 {

    margin:0;

}


.header p {

    margin:6px 0;

}


.info {

    margin-bottom:25px;

}


table {

    width:100%;

    border-collapse:
        collapse;

    margin-top:20px;

}


th,
td {

    border:
        1px solid #ddd;

    padding:12px;

    text-align:left;

}


th {

    background:#FFD700;

}


.total {

    text-align:right;

    font-size:20px;

    font-weight:bold;

    margin-top:20px;

}


.buttons {

    text-align:center;

    margin-top:30px;

}


button {

    padding:12px 20px;

    margin:5px;

    border:none;

    border-radius:6px;

    cursor:pointer;

    font-size:16px;

}


.print-button {

    background:#FFD700;

}


.back-button {

    background:#ddd;

}


@media print {

    .buttons {

        display:none;

    }


    body {

        padding:0;

    }

}

</style>

</head>


<body>

<div class="invoice">


    <div class="header">

        <h1>
            Yellow Cicy
        </h1>


        <p>
            Customer Invoice
        </p>


        <p>

            Order ID:

            ${escapeHTML(
                order.id || ""
            )}

        </p>

    </div>


    <div class="info">

        <p>

            <strong>
                Customer:
            </strong>

            ${escapeHTML(
                order.customerName ||
                "Customer"
            )}

        </p>


        <p>

            <strong>
                Phone:
            </strong>

            ${escapeHTML(
                order.phone || ""
            )}

        </p>


        <p>

            <strong>
                Status:
            </strong>

            ${escapeHTML(
                order.status ||
                "Paid"
            )}

        </p>


        <p>

            <strong>
                Payment Reference:
            </strong>

            ${escapeHTML(
                order.reference || ""
            )}

        </p>


        <p>

            <strong>
                Date:
            </strong>

            ${formatDate(
                order.createdAt
            )}

        </p>

    </div>


    <table>

        <thead>

            <tr>

                <th>
                    Product
                </th>

                <th>
                    Qty
                </th>

                <th>
                    Price
                </th>

                <th>
                    Subtotal
                </th>

            </tr>

        </thead>


        <tbody>

            ${itemsHTML}

        </tbody>

    </table>


    <div class="total">

        Total:
        GHS ${total.toFixed(2)}

    </div>


    <div class="buttons">

        <button
            class="print-button"
            type="button"
            onclick="window.print()"
        >
            🖨️ Print / Save as PDF
        </button>


        <button
            class="back-button"
            type="button"
            onclick="window.close()"
        >
            ← Back
        </button>

    </div>


</div>

</body>

</html>

`;


    const invoiceWindow =
        window.open(
            "",
            "_blank"
        );


    if (!invoiceWindow) {

        alert(
            "Please allow pop-ups in your browser to view the invoice."
        );

        return;

    }


    invoiceWindow.document.open();


    invoiceWindow.document.write(
        invoiceHTML
    );


    invoiceWindow.document.close();

}