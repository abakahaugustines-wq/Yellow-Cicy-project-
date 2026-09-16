// =========================
// WISHLIST
// =========================

const wishlistGrid =
    document.getElementById(
        "wishlist-grid"
    );


// =========================
// LOAD WISHLIST
// =========================

function getWishlist() {

    return JSON.parse(
        localStorage.getItem(
            "wishlist"
        )
    ) || [];

}


// =========================
// SAVE WISHLIST
// =========================

function saveWishlist(
    wishlist
) {

    localStorage.setItem(
        "wishlist",
        JSON.stringify(
            wishlist
        )
    );

}


// =========================
// DISPLAY WISHLIST
// =========================

function displayWishlist() {

    if (!wishlistGrid) {

        return;

    }


    const wishlist =
        getWishlist();


    wishlistGrid.innerHTML = "";


    if (wishlist.length === 0) {

        wishlistGrid.innerHTML = `

            <div
                style="
                    width:100%;
                    text-align:center;
                    padding:40px 20px;
                "
            >

                <h2>
                    Your wishlist is empty ❤️
                </h2>

                <p>
                    Add products you love to your wishlist.
                </p>

                <a
                    href="index.html"
                    class="account-button"
                >
                    🛍️ Continue Shopping
                </a>

            </div>

        `;

        return;

    }


    wishlist.forEach(
        product => {

            const card =
                document.createElement(
                    "div"
                );


            card.className =
                "product";


            card.innerHTML = `

                <div
                    style="
                        position:relative;
                    "
                >

                    <img
                        src="${product.image || ""}"
                        alt="${product.name || "Product"}"
                    >

                </div>


                <h3>
                    ${product.name || ""}
                </h3>


                <p
                    style="
                        font-size:14px;
                        opacity:0.7;
                    "
                >
                    ${product.category || "Other"}
                </p>


                <p class="price">
                    GHS ${Number(
                        product.price || 0
                    ).toFixed(2)}
                </p>


                <button
                    type="button"
                    class="wishlist-remove"
                >
                    💔 Remove
                </button>


                <button
                    type="button"
                    class="wishlist-cart"
                >
                    🛒 Add to Cart
                </button>

            `;


            // =========================
            // REMOVE
            // =========================

            const removeButton =
                card.querySelector(
                    ".wishlist-remove"
                );


            removeButton.addEventListener(
                "click",
                () => {

                    const updated =
                        getWishlist().filter(
                            item =>
                                item.id !==
                                product.id
                        );


                    saveWishlist(
                        updated
                    );


                    displayWishlist();

                }
            );


            // =========================
            // ADD TO CART
            // =========================

            const cartButton =
                card.querySelector(
                    ".wishlist-cart"
                );


            cartButton.addEventListener(
                "click",
                () => {

                    let cart =
                        JSON.parse(
                            localStorage.getItem(
                                "cart"
                            )
                        ) || [];


                    const existing =
                        cart.find(
                            item =>
                                item.name ===
                                product.name
                        );


                    if (existing) {

                        existing.quantity++;

                    } else {

                        cart.push({

                            id:
                                product.id,

                            name:
                                product.name,

                            price:
                                Number(
                                    product.price
                                ),

                            image:
                                product.image,

                            quantity:
                                1

                        });

                    }


                    localStorage.setItem(
                        "cart",
                        JSON.stringify(
                            cart
                        )
                    );


                    alert(
                        product.name +
                        " added to cart!"
                    );

                }
            );


            wishlistGrid.appendChild(
                card
            );

        }
    );

}


// =========================
// START
// =========================

displayWishlist();
