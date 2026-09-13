let cart =
    JSON.parse(
        localStorage.getItem("cart")
    ) || [];


const cartItems =
    document.getElementById(
        "cart-items"
    );


const totalElement =
    document.getElementById(
        "total"
    );


const checkoutButton =
    document.getElementById(
        "checkout-btn"
    );


/* =========================
   SAVE CART
========================= */

function saveCart() {

    localStorage.setItem(
        "cart",
        JSON.stringify(cart)
    );

}


/* =========================
   DISPLAY CART
========================= */

function displayCart() {

    if (!cartItems) return;


    cartItems.innerHTML = "";


    if (cart.length === 0) {

        cartItems.innerHTML = `
            <div class="empty-cart">
                <h3>
                    Your cart is empty.
                </h3>

                <a href="index.html">
                    Continue Shopping
                </a>
            </div>
        `;


        if (totalElement) {

            totalElement.textContent =
                "Total: GHS 0.00";

        }


        if (checkoutButton) {

            checkoutButton.disabled =
                true;

        }


        return;

    }


    if (checkoutButton) {

        checkoutButton.disabled =
            false;

    }


    let total = 0;


    cart.forEach(
        (item, index) => {

            const price =
                Number(item.price) || 0;


            const quantity =
                Number(item.quantity) || 1;


            total +=
                price * quantity;


            const card =
                document.createElement(
                    "div"
                );


            card.className =
                "product cart-item";


            card.innerHTML = `

                <img
                    src="${item.image || ""}"
                    alt="${item.name || "Product"}"
                >

                <h3>
                    ${item.name || "Product"}
                </h3>

                <p>
                    GHS ${price.toFixed(2)}
                </p>

                <div class="quantity-controls">

                    <button
                        class="minus"
                        type="button"
                    >
                        −
                    </button>

                    <span>
                        ${quantity}
                    </span>

                    <button
                        class="plus"
                        type="button"
                    >
                        +
                    </button>

                </div>

                <p>
                    Subtotal:
                    GHS ${(price * quantity).toFixed(2)}
                </p>

                <button
                    class="remove"
                    type="button"
                >
                    Remove
                </button>

            `;


            card
                .querySelector(".plus")
                .addEventListener(
                    "click",
                    function() {

                        cart[index].quantity =
                            quantity + 1;

                        saveCart();

                        displayCart();

                    }
                );


            card
                .querySelector(".minus")
                .addEventListener(
                    "click",
                    function() {

                        if (quantity > 1) {

                            cart[index].quantity =
                                quantity - 1;

                        } else {

                            cart.splice(
                                index,
                                1
                            );

                        }


                        saveCart();

                        displayCart();

                    }
                );


            card
                .querySelector(".remove")
                .addEventListener(
                    "click",
                    function() {

                        cart.splice(
                            index,
                            1
                        );


                        saveCart();

                        displayCart();

                    }
                );


            cartItems.appendChild(card);

        }
    );


    if (totalElement) {

        totalElement.textContent =
            "Total: GHS " +
            total.toFixed(2);

    }

}


displayCart();