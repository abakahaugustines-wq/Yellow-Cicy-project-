import { db, auth } from "./firebase.js";

import {
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/12.17.1/firebase-auth.js";

import {
    collection,
    getDocs,
    addDoc,
    deleteDoc,
    doc,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.17.1/firebase-firestore.js";


// =====================================================
// ADMIN SECURITY
// =====================================================

const ADMIN_EMAIL =
    "abakahaugustines2@gmail.com";


onAuthStateChanged(auth, (user) => {

    if (!user) {

        alert(
            "Please log in to access Pickup Management."
        );

        window.location.href =
            "account.html";

        return;

    }


    if (user.email !== ADMIN_EMAIL) {

        alert(
            "Access denied. Admins only."
        );

        window.location.href =
            "index.html";

        return;

    }


    console.log(
        "Yellow Cicy pickup admin verified."
    );


    // Start pickup management only
    // after admin verification.

    loadPickupStations();

});

// =====================================================
// ELEMENTS
// =====================================================

const orderNumberInput =
    document.getElementById("order-number");

const searchOrderButton =
    document.getElementById("search-order-btn");

const pickupResult =
    document.getElementById("pickup-result");


const pickupRegion =
    document.getElementById("pickup-region");

const pickupCity =
    document.getElementById("pickup-city");

const pickupBranch =
    document.getElementById("pickup-branch");

const pickupPoint =
    document.getElementById("pickup-point");

const pickupAddress =
    document.getElementById("pickup-address");

const addPickupButton =
    document.getElementById("add-pickup-btn");

const pickupList =
    document.getElementById("pickup-list");


// =====================================================
// ORDER SEARCH BUTTON
// =====================================================

if (searchOrderButton) {

    searchOrderButton.addEventListener(
        "click",
        searchOrder
    );

}


// =====================================================
// ENTER KEY FOR ORDER SEARCH
// =====================================================

if (orderNumberInput) {

    orderNumberInput.addEventListener(
        "keydown",
        function(event) {

            if (event.key === "Enter") {

                event.preventDefault();

                searchOrder();

            }

        }
    );

}


// =====================================================
// ADD PICKUP STATION BUTTON
// =====================================================

if (addPickupButton) {

    addPickupButton.addEventListener(
        "click",
        addPickupStation
    );

}


// =====================================================
// SEARCH ORDER
// =====================================================

async function searchOrder() {

    const orderNumber =
        orderNumberInput
            ? orderNumberInput.value.trim()
            : "";


    if (!orderNumber) {

        alert(
            "Please enter an order number."
        );

        if (orderNumberInput) {
            orderNumberInput.focus();
        }

        return;

    }


    if (pickupResult) {

        pickupResult.innerHTML = `

            <div style="
                background:#f8f8f8;
                padding:20px;
                border-radius:10px;
                text-align:center;
            ">

                🔎 Searching for order...

            </div>

        `;

    }


    try {

        const snapshot =
            await getDocs(
                collection(db, "orders")
            );


        let foundOrder = null;


        snapshot.forEach(
            function(orderDoc) {

                const order =
                    orderDoc.data();


                const reference =
                    String(
                        order.reference || ""
                    )
                    .trim();


                const documentId =
                    String(
                        orderDoc.id
                    )
                    .trim();


                const searchValue =
                    orderNumber.toLowerCase();


                if (
                    reference.toLowerCase() ===
                    searchValue
                    ||
                    documentId.toLowerCase() ===
                    searchValue
                ) {

                    foundOrder = {

                        id:
                            orderDoc.id,

                        data:
                            order

                    };

                }

            }
        );


        if (!foundOrder) {

            if (pickupResult) {

                pickupResult.innerHTML = `

                    <div style="
                        background:#ffebee;
                        padding:20px;
                        border-radius:10px;
                        text-align:center;
                        color:#c62828;
                    ">

                        <h3>
                            ❌ Order Not Found
                        </h3>

                        <p style="margin-top:10px;">
                            No order was found with this
                            order number.
                        </p>

                    </div>

                `;

            }

            return;

        }


        displayOrder(
            foundOrder.id,
            foundOrder.data
        );


    }

    catch (error) {

        console.error(
            "ORDER SEARCH ERROR:",
            error
        );


        if (pickupResult) {

            pickupResult.innerHTML = `

                <div style="
                    background:#ffebee;
                    padding:20px;
                    border-radius:10px;
                    color:#c62828;
                ">

                    <h3>
                        Unable to search order
                    </h3>

                    <p style="margin-top:10px;">
                        ${escapeHTML(
                            error.message
                        )}
                    </p>

                </div>

            `;

        }

    }

}


// =====================================================
// DISPLAY ORDER
// =====================================================

function displayOrder(
    orderId,
    order
) {

    if (!pickupResult) {
        return;
    }


    const reference =
        order.reference ||
        orderId;


    const status =
        order.status ||
        "Unknown";


    const customerName =
        order.customerName ||
        "Not provided";


    const customerPhone =
        order.customerPhone ||
        "Not provided";


    const customerEmail =
        order.customerEmail ||
        "Not provided";


    const deliveryAddress =
        order.deliveryAddress ||
        "Not provided";


    const deliveryCity =
        order.deliveryCity ||
        "Not provided";


    const deliveryRegion =
        order.deliveryRegion ||
        "Not provided";


    const total =
        Number(
            order.total || 0
        );


    const items =
        Array.isArray(order.items)
            ? order.items
            : [];


    let itemsHTML = "";


    if (items.length === 0) {

        itemsHTML = `

            <p style="
                text-align:center;
                color:#777;
            ">

                No products recorded for this order.

            </p>

        `;

    }

    else {

        items.forEach(
            function(item) {

                const name =
                    escapeHTML(
                        item.name ||
                        "Product"
                    );


                const quantity =
                    Number(
                        item.quantity || 1
                    );


                const price =
                    Number(
                        item.price || 0
                    );


                const image =
                    item.image ||
                    "";


                itemsHTML += `

                    <div style="
                        display:flex;
                        align-items:center;
                        gap:15px;
                        padding:15px 0;
                        border-bottom:1px solid #ddd;
                    ">

                        ${
                            image
                            ?
                            `
                            <img
                                src="${escapeAttribute(image)}"
                                alt="${name}"
                                style="
                                    width:70px;
                                    height:70px;
                                    object-fit:cover;
                                    border-radius:8px;
                                "
                            >
                            `
                            :
                            `
                            <div style="
                                width:70px;
                                height:70px;
                                background:#eee;
                                border-radius:8px;
                                display:flex;
                                align-items:center;
                                justify-content:center;
                                font-size:25px;
                            ">
                                📦
                            </div>
                            `
                        }


                        <div style="flex:1;">

                            <strong>
                                ${name}
                            </strong>

                            <p style="
                                margin-top:5px;
                                color:#666;
                            ">

                                Quantity:
                                ${quantity}

                            </p>

                            <p style="
                                margin-top:3px;
                                font-weight:bold;
                            ">

                                GHS
                                ${(
                                    price *
                                    quantity
                                ).toFixed(2)}

                            </p>

                        </div>

                    </div>

                `;

            }
        );

    }


    pickupResult.innerHTML = `

        <div style="
            background:white;
            border-radius:12px;
            padding:20px;
            box-shadow:
                0 5px 15px rgba(0,0,0,0.08);
        ">

            <div style="
                background:#e8f5e9;
                padding:15px;
                border-radius:8px;
                margin-bottom:20px;
                text-align:center;
            ">

                <h2>
                    ✅ Order Found
                </h2>

                <p style="
                    margin-top:8px;
                    font-weight:bold;
                ">

                    Order Number:
                    ${escapeHTML(
                        String(reference)
                    )}

                </p>

            </div>


            <h3>
                Customer Information
            </h3>


            <div style="
                margin-top:12px;
                line-height:1.7;
            ">

                <p>
                    <strong>Name:</strong>
                    ${escapeHTML(
                        String(customerName)
                    )}
                </p>

                <p>
                    <strong>Phone:</strong>
                    ${escapeHTML(
                        String(customerPhone)
                    )}
                </p>

                <p>
                    <strong>Email:</strong>
                    ${escapeHTML(
                        String(customerEmail)
                    )}
                </p>

            </div>


            <h3 style="margin-top:25px;">
                Delivery Information
            </h3>


            <div style="
                margin-top:12px;
                line-height:1.7;
            ">

                <p>
                    <strong>Address:</strong>
                    ${escapeHTML(
                        String(deliveryAddress)
                    )}
                </p>

                <p>
                    <strong>City:</strong>
                    ${escapeHTML(
                        String(deliveryCity)
                    )}
                </p>

                <p>
                    <strong>Region:</strong>
                    ${escapeHTML(
                        String(deliveryRegion)
                    )}
                </p>

            </div>


            <h3 style="margin-top:25px;">
                Products To Give Customer
            </h3>


            <div style="margin-top:10px;">

                ${itemsHTML}

            </div>


            <div style="
                margin-top:20px;
                padding:15px;
                background:#fff8d6;
                border-radius:8px;
                text-align:right;
            ">

                <strong>
                    Total:
                    GHS ${total.toFixed(2)}
                </strong>

                <br>

                <span>
                    Status:
                    ${escapeHTML(
                        String(status)
                    )}
                </span>

            </div>


            <button
                type="button"
                onclick="window.print()"
                style="
                    width:100%;
                    padding:13px;
                    margin-top:20px;
                    background:#FFD700;
                    color:#222;
                    border:none;
                    border-radius:8px;
                    font-weight:bold;
                    font-size:16px;
                    cursor:pointer;
                "
            >

                🖨️ Print Order Details

            </button>

        </div>

    `;

}
// =====================================================
// ADD PICKUP STATION
// =====================================================

async function addPickupStation() {

    const region =
        pickupRegion
            ? pickupRegion.value.trim()
            : "";


    const city =
        pickupCity
            ? pickupCity.value.trim()
            : "";


    const branch =
        pickupBranch
            ? pickupBranch.value.trim()
            : "";


    const point =
        pickupPoint
            ? pickupPoint.value.trim()
            : "";


    const address =
        pickupAddress
            ? pickupAddress.value.trim()
            : "";


    // =================================================
    // VALIDATION
    // =================================================

    if (!region) {

        alert(
            "Please select a region."
        );

        if (pickupRegion) {
            pickupRegion.focus();
        }

        return;

    }


    if (!city) {

        alert(
            "Please enter the city or town."
        );

        if (pickupCity) {
            pickupCity.focus();
        }

        return;

    }


    if (!branch) {

        alert(
            "Please enter the branch name."
        );

        if (pickupBranch) {
            pickupBranch.focus();
        }

        return;

    }


    if (!point) {

        alert(
            "Please enter the exact pickup point."
        );

        if (pickupPoint) {
            pickupPoint.focus();
        }

        return;

    }


    if (!address) {

        alert(
            "Please enter the full address."
        );

        if (pickupAddress) {
            pickupAddress.focus();
        }

        return;

    }


    // =================================================
    // DISABLE BUTTON
    // =================================================

    if (addPickupButton) {

        addPickupButton.disabled =
            true;

        addPickupButton.textContent =
            "Adding station...";

    }


    try {

        // =================================================
        // PICKUP STATION DATA
        // =================================================

        const stationData = {

            region:
                region,

            city:
                city,

            branch:
                branch,

            pickupPoint:
                point,

            address:
                address,

            active:
                true,

            createdAt:
                serverTimestamp()

        };


        // =================================================
        // SAVE TO FIRESTORE
        // =================================================

        const stationRef =
            await addDoc(
                collection(
                    db,
                    "pickupStations"
                ),
                stationData
            );


        console.log(
            "Pickup station added:",
            stationRef.id
        );


        // =================================================
        // CLEAR FORM
        // =================================================

        if (pickupRegion) {
            pickupRegion.value = "";
        }

        if (pickupCity) {
            pickupCity.value = "";
        }

        if (pickupBranch) {
            pickupBranch.value = "";
        }

        if (pickupPoint) {
            pickupPoint.value = "";
        }

        if (pickupAddress) {
            pickupAddress.value = "";
        }


        alert(
            "Pickup station added successfully."
        );


        // =================================================
        // REFRESH LIST
        // =================================================

        await loadPickupStations();

    }


    catch (error) {

        console.error(
            "ADD PICKUP STATION ERROR:",
            error
        );


        alert(
            "Could not add pickup station.\n\n" +
            error.message
        );

    }


    finally {

        if (addPickupButton) {

            addPickupButton.disabled =
                false;

            addPickupButton.textContent =
                "📍 Add Pickup Station";

        }

    }

}


// =====================================================
// LOAD PICKUP STATIONS
// =====================================================

async function loadPickupStations() {

    if (!pickupList) {
        return;
    }


    pickupList.innerHTML = `

        <tr>

            <td colspan="6">
                Loading pickup stations...
            </td>

        </tr>

    `;


    try {

        const snapshot =
            await getDocs(
                collection(
                    db,
                    "pickupStations"
                )
            );


        if (snapshot.empty) {

            pickupList.innerHTML = `

                <tr>

                    <td
                        colspan="6"
                        style="
                            text-align:center;
                            padding:25px;
                        "
                    >

                        No pickup stations added yet.

                    </td>

                </tr>

            `;

            return;

        }


        pickupList.innerHTML = "";


        snapshot.forEach(
            function(stationDoc) {

                const station =
                    stationDoc.data();


                const row =
                    document.createElement("tr");


                row.innerHTML = `

                    <td>
                        ${escapeHTML(
                            String(
                                station.region ||
                                ""
                            )
                        )}
                    </td>

                    <td>
                        ${escapeHTML(
                            String(
                                station.city ||
                                ""
                            )
                        )}
                    </td>

                    <td>
                        ${escapeHTML(
                            String(
                                station.branch ||
                                ""
                            )
                        )}
                    </td>

                    <td>
                        ${escapeHTML(
                            String(
                                station.pickupPoint ||
                                ""
                            )
                        )}
                    </td>

                    <td>
                        ${escapeHTML(
                            String(
                                station.address ||
                                ""
                            )
                        )}
                    </td>

                    <td>

                        <button
                            type="button"
                            class="delete"
                            data-id="${escapeAttribute(
                                stationDoc.id
                            )}"
                        >

                            Delete

                        </button>

                    </td>

                `;


                pickupList.appendChild(row);

            }
        );


        // =================================================
        // DELETE BUTTONS
        // =================================================

        const deleteButtons =
            pickupList.querySelectorAll(
                ".delete"
            );


        deleteButtons.forEach(
            function(button) {

                button.addEventListener(
                    "click",
                    async function() {

                        const stationId =
                            button.dataset.id;


                        const confirmed =
                            confirm(
                                "Are you sure you want to delete this pickup station?"
                            );


                        if (!confirmed) {
                            return;
                        }


                        button.disabled =
                            true;

                        button.textContent =
                            "Deleting...";


                        try {

                            await deleteDoc(
                                doc(
                                    db,
                                    "pickupStations",
                                    stationId
                                )
                            );


                            alert(
                                "Pickup station deleted."
                            );


                            await loadPickupStations();

                        }


                        catch (error) {

                            console.error(
                                "DELETE PICKUP STATION ERROR:",
                                error
                            );


                            alert(
                                "Could not delete pickup station.\n\n" +
                                error.message
                            );


                            button.disabled =
                                false;

                            button.textContent =
                                "Delete";

                        }

                    }
                );

            }
        );

    }


    catch (error) {

        console.error(
            "LOAD PICKUP STATIONS ERROR:",
            error
        );


        pickupList.innerHTML = `

            <tr>

                <td colspan="6">

                    Unable to load pickup stations.

                    <br><br>

                    ${escapeHTML(
                        error.message
                    )}

                </td>

            </tr>

        `;

    }

}


// =====================================================
// ESCAPE HTML
// =====================================================

function escapeHTML(value) {

    return String(value)

        .replace(
            /&/g,
            "&amp;"
        )

        .replace(
            /</g,
            "&lt;"
        )

        .replace(
            />/g,
            "&gt;"
        )

        .replace(
            /"/g,
            "&quot;"
        )

        .replace(
            /'/g,
            "&#039;"
        );

}


// =====================================================
// ESCAPE ATTRIBUTE
// =====================================================

function escapeAttribute(value) {

    return escapeHTML(value);

}