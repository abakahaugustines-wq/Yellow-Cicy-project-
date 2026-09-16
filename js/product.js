import { db } from "./firebase.js";

import {
    doc,
    getDoc,
    getDocFromCache
} from "https://www.gstatic.com/firebasejs/12.17.1/firebase-firestore.js";


// =====================================================
// GET PRODUCT ID FROM URL
// =====================================================

const params =
    new URLSearchParams(window.location.search);

const productId =
    params.get("id");


// =====================================================
// DOM
// =====================================================

const productContainer =
    document.getElementById("product-details");


// =====================================================
// LOAD PRODUCT
// =====================================================

async function loadProduct() {

    if (!productId) {
        showError("Product not found.");
        return;
    }

    const productRef =
        doc(db, "products", productId);


    // =================================================
    // TRY CACHE FIRST
    // =================================================

    try {

        const cachedProduct =
            await getDocFromCache(productRef);

        if (cachedProduct.exists()) {

            const product = {
                id: cachedProduct.id,
                ...cachedProduct.data()
            };

            displayProduct(product);

            console.log(
                "Product loaded instantly from cache."
            );
        }

    } catch (cacheError) {

        // Cache may not exist on first visit.
        // This is normal.

        console.log(
            "No cached product available."
        );
    }


    // =================================================
    // GET FRESH PRODUCT FROM FIREBASE
    // =================================================

    try {

        const productSnap =
            await getDoc(productRef);


        if (!productSnap.exists()) {

            showError(
                "This product is no longer available."
            );

            return;
        }


        const product = {

            id: productSnap.id,

            ...productSnap.data()

        };


        // Display fresh data.
        // If cache already displayed it,
        // this simply refreshes the page data.

        displayProduct(product);


        console.log(
            "Product loaded from Firebase."
        );


    } catch (error) {

        console.error(
            "Error loading product:",
            error
        );


        // Only show an error if nothing
        // has already been displayed.

        if (
            !productContainer.dataset.loaded
        ) {

            showError(
                "Unable to load this product."
            );

        }

    }

}


// =====================================================
// DISPLAY PRODUCT
// =====================================================

function displayProduct(product) {

    productContainer.dataset.loaded =
        "true";


    const price =
        getProductPrice(product);


    const mainImage =
        getMainImage(product);


    const images =
        getProductImages(product);


    const stock =
        Number(product.stock || 0);


    const sizes =
        Array.isArray(product.sizes)
            ? product.sizes
            : [];


    const colors =
        Array.isArray(product.colors)
            ? product.colors
            : [];


    const rating =
        Number(product.averageRating || 0);


    const reviewCount =
        Number(product.reviewCount || 0);


    productContainer.innerHTML = `

        <div class="product-detail-page">


            <!-- =========================================
                 IMAGE GALLERY
                 ========================================= -->

            <div class="product-detail-gallery">

                <div
    class="product-main-image"
    style="
        width:100%;
        max-width:100%;
        overflow:hidden;
        box-sizing:border-box;
    "
>

                    <img
    id="product-main-image"
    src="${escapeHTML(mainImage)}"
    alt="${escapeHTML(product.name || "Product")}"
    decoding="async"
    style="
        display:block;
        width:100%;
        max-width:100%;
        height:auto;
        max-height:500px;
        object-fit:contain;
        margin:0 auto;
    "
>
                </div>


                ${
                    images.length > 1
                    ? `

                    <div class="product-thumbnails">

                        ${
                            images.map(
                                function(image, index) {

                                    return `

                                        <button
                                            type="button"
                                            class="product-thumbnail ${
                                                index === 0
                                                    ? "active"
                                                    : ""
                                            }"
                                            data-image="${escapeHTML(image)}"
                                        >

                                            <img
                                                src="${escapeHTML(image)}"
                                                alt="${escapeHTML(product.name || "Product")}"
                                                loading="lazy"
                                                decoding="async"
                                            >

                                        </button>

                                    `;

                                }
                            ).join("")
                        }

                    </div>

                    `
                    : ""
                }

            </div>



            <!-- =========================================
                 PRODUCT INFORMATION
                 ========================================= -->

            <div class="product-detail-info">


                ${
                    product.category
                    ? `

                        <div class="product-detail-category">

                            ${escapeHTML(product.category)}

                        </div>

                    `
                    : ""
                }


                <h1>

                    ${escapeHTML(
                        product.name || "Product"
                    )}

                </h1>


                <!-- RATING -->

                <div class="product-detail-rating">

                    <span class="detail-stars">

                        ${createStars(rating)}

                    </span>

                    <span>

                        ${
                            rating > 0
                                ? rating.toFixed(1)
                                : "No rating"
                        }

                    </span>

                    <span>

                        (${reviewCount} reviews)

                    </span>

                </div>


                <!-- PRICE -->

                <div class="product-detail-price">

                    ${
                        product.discountPrice &&
                        Number(product.discountPrice) <
                        Number(product.price)
                        ? `

                            <span class="detail-old-price">

                                GHS
                                ${Number(
                                    product.price
                                ).toFixed(2)}

                            </span>

                        `
                        : ""
                    }


                    <strong>

                        GHS
                        ${price.toFixed(2)}

                    </strong>

                </div>


                <!-- STOCK -->

                <div class="product-detail-stock">

                    ${
                        stock > 0

                        ? `

                            <span class="in-stock">

                                ✓ ${stock} available

                            </span>

                        `

                        : `

                            <span class="out-of-stock">

                                Out of stock

                            </span>

                        `
                    }

                </div>


                <!-- DESCRIPTION -->

                ${
                    product.description

                    ? `

                        <div class="product-description">

                            <h2>
                                Description
                            </h2>

                            <p>

                                ${escapeHTML(
                                    product.description
                                )}

                            </p>

                        </div>

                    `

                    : ""
                }


                <!-- SIZE OPTIONS -->

                ${
                    sizes.length > 0

                    ? `

                        <div class="product-option-group">

                            <h3>
                                Select Size
                            </h3>

                            <div
                                class="product-options"
                                id="size-options"
                            >

                                ${
                                    sizes.map(
                                        function(size, index) {

                                            return `

                                                <button
                                                    type="button"
                                                    class="product-option ${
                                                        index === 0
                                                            ? "selected"
                                                            : ""
                                                    }"
                                                    data-size="${escapeHTML(size)}"
                                                >

                                                    ${escapeHTML(size)}

                                                </button>

                                            `;

                                        }
                                    ).join("")
                                }

                            </div>

                        </div>

                    `

                    : ""
                }


                <!-- COLOR OPTIONS -->

                ${
                    colors.length > 0

                    ? `

                        <div class="product-option-group">

                            <h3>
                                Select Color
                            </h3>

                            <div
                                class="product-options"
                                id="color-options"
                            >

                                ${
                                    colors.map(
                                        function(color, index) {

                                            return `

                                                <button
                                                    type="button"
                                                    class="product-option ${
                                                        index === 0
                                                            ? "selected"
                                                            : ""
                                                    }"
                                                    data-color="${escapeHTML(color)}"
                                                >

                                                    ${escapeHTML(color)}

                                                </button>

                                            `;

                                        }
                                    ).join("")
                                }

                            </div>

                        </div>

                    `

                    : ""
                }


                <!-- QUANTITY -->

                <div class="product-option-group">

                    <h3>
                        Quantity
                    </h3>


                    <div class="quantity-selector">

                        <button
                            type="button"
                            id="quantity-minus"
                        >
                            −
                        </button>


                        <span id="product-quantity">
                            1
                        </span>


                        <button
                            type="button"
                            id="quantity-plus"
                        >
                            +
                        </button>

                    </div>

                </div>


                <!-- ACTIONS -->

                <div class="product-detail-actions">

                    <button
                        type="button"
                        id="add-to-cart-detail"
                        class="product-detail-cart-btn"
                        ${stock <= 0 ? "disabled" : ""}
                    >

                        🛒 Add to Cart

                    </button>


                    <button
                        type="button"
                        id="buy-now-detail"
                        class="product-detail-buy-btn"
                        ${stock <= 0 ? "disabled" : ""}
                    >

                        ⚡ Buy Now

                    </button>

                </div>


                <!-- WISHLIST -->

                <button
                    type="button"
                    id="detail-wishlist-btn"
                    class="product-detail-wishlist"
                >

                    ♡ Add to Wishlist

                </button>


                <!-- BENEFITS -->

                <div class="product-detail-benefits">

                    <div>

                        🚚

                        <strong>
                            Ghana Delivery
                        </strong>

                        <span>
                            Available across Ghana
                        </span>

                    </div>


                    <div>

                        📍

                        <strong>
                            Pickup Stations
                        </strong>

                        <span>
                            Convenient pickup options
                        </span>

                    </div>


                    <div>

                        🔒

                        <strong>
                            Secure Payment
                        </strong>

                        <span>
                            Pay securely with Paystack
                        </span>

                    </div>

                </div>

            </div>

        </div>

    `;


    setupGallery();

    setupOptions();

    setupQuantity(product, stock);

    setupCart(product);

    setupWishlist(product);

}


// =====================================================
// PRICE
// =====================================================

function getProductPrice(product) {

    const normalPrice =
        Number(product.price || 0);


    const discountPrice =
        Number(product.discountPrice || 0);


    if (
        discountPrice > 0 &&
        discountPrice < normalPrice
    ) {

        return discountPrice;

    }


    return normalPrice;

}


// =====================================================
// IMAGES
// =====================================================

function getMainImage(product) {

    if (product.image) {

        return product.image;

    }


    if (
        Array.isArray(product.images) &&
        product.images.length > 0
    ) {

        return product.images[0];

    }


    return "images/logo.png";

}


function getProductImages(product) {

    let images = [];


    if (Array.isArray(product.images)) {

        images =
            product.images.filter(Boolean);

    }


    if (
        product.image &&
        !images.includes(product.image)
    ) {

        images.unshift(product.image);

    }


    if (images.length === 0) {

        images.push(
            "images/logo.png"
        );

    }


    return images;

}


// =====================================================
// IMAGE GALLERY
// =====================================================

function setupGallery() {

    const mainImage =
        document.getElementById(
            "product-main-image"
        );


    const thumbnails =
        document.querySelectorAll(
            ".product-thumbnail"
        );


    thumbnails.forEach(
        function(thumbnail) {

            thumbnail.addEventListener(
                "click",
                function() {

                    const image =
                        thumbnail.dataset.image;


                    if (mainImage) {

                        mainImage.src =
                            image;

                    }


                    thumbnails.forEach(
                        function(item) {

                            item.classList.remove(
                                "active"
                            );

                        }
                    );


                    thumbnail.classList.add(
                        "active"
                    );

                }
            );

        }
    );

}


// =====================================================
// OPTIONS
// =====================================================

function setupOptions() {

    const optionButtons =
        document.querySelectorAll(
            ".product-option"
        );


    optionButtons.forEach(
        function(button) {

            button.addEventListener(
                "click",
                function() {

                    const parent =
                        button.parentElement;


                    parent
                        .querySelectorAll(
                            ".product-option"
                        )
                        .forEach(
                            function(item) {

                                item.classList.remove(
                                    "selected"
                                );

                            }
                        );


                    button.classList.add(
                        "selected"
                    );

                }
            );

        }
    );

}


// =====================================================
// GET SELECTED OPTIONS
// =====================================================

function getSelectedOptions() {

    const selectedSize =
        document.querySelector(
            "#size-options .product-option.selected"
        );


    const selectedColor =
        document.querySelector(
            "#color-options .product-option.selected"
        );


    return {

        size:
            selectedSize
                ? selectedSize.dataset.size
                : null,

        color:
            selectedColor
                ? selectedColor.dataset.color
                : null

    };

}


// =====================================================
// QUANTITY
// =====================================================

function setupQuantity(product, stock) {

    const minus =
        document.getElementById(
            "quantity-minus"
        );


    const plus =
        document.getElementById(
            "quantity-plus"
        );


    const quantityElement =
        document.getElementById(
            "product-quantity"
        );


    let quantity = 1;


    minus.addEventListener(
        "click",
        function() {

            if (quantity > 1) {

                quantity--;

                quantityElement.textContent =
                    quantity;

            }

        }
    );


    plus.addEventListener(
        "click",
        function() {

            if (
                stock > 0 &&
                quantity < stock
            ) {

                quantity++;

                quantityElement.textContent =
                    quantity;

            }

        }
    );

}


// =====================================================
// CART BUTTONS
// =====================================================

function setupCart(product) {

    const addButton =
        document.getElementById(
            "add-to-cart-detail"
        );


    const buyButton =
        document.getElementById(
            "buy-now-detail"
        );


    addButton.addEventListener(
        "click",
        function() {

            addProductToCart(product);

        }
    );


    buyButton.addEventListener(
        "click",
        function() {

            addProductToCart(product);

            window.location.href =
                "cart.html";

        }
    );

}


// =====================================================
// ADD PRODUCT TO CART
// =====================================================

function addProductToCart(product) {

    const quantityElement =
        document.getElementById(
            "product-quantity"
        );


    const quantity =
        Number(
            quantityElement.textContent || 1
        );


    const selectedOptions =
        getSelectedOptions();


    let cart = [];


    try {

        cart =
            JSON.parse(
                localStorage.getItem(
                    "cart"
                )
            ) || [];

    } catch (error) {

        cart = [];

    }


    /*
     * Products with different options
     * should be treated as different cart items.
     */

    const existingIndex =
        cart.findIndex(
            function(item) {

                return (

                    item.id === product.id &&

                    (item.size || null) ===
                    (selectedOptions.size || null) &&

                    (item.color || null) ===
                    (selectedOptions.color || null)

                );

            }
        );


    const cartItem = {

        id: product.id,

        name: product.name,

        price:
            getProductPrice(product),

        image:
            getMainImage(product),

        quantity:
            quantity,

        size:
            selectedOptions.size,

        color:
            selectedOptions.color

    };


    if (existingIndex !== -1) {

        cart[existingIndex].quantity +=
            quantity;

    } else {

        cart.push(cartItem);

    }


    localStorage.setItem(
        "cart",
        JSON.stringify(cart)
    );


    alert(
        `${product.name} added to your cart.`
    );

}


// =====================================================
// WISHLIST
// =====================================================

function setupWishlist(product) {

    const button =
        document.getElementById(
            "detail-wishlist-btn"
        );


    let wishlist = [];


    try {

        wishlist =
            JSON.parse(
                localStorage.getItem(
                    "wishlist"
                )
            ) || [];

    } catch (error) {

        wishlist = [];

    }


    const alreadySaved =
        wishlist.some(
            function(item) {

                return item.id === product.id;

            }
        );


    if (alreadySaved) {

        button.textContent =
            "♥ Saved to Wishlist";

    }


    button.addEventListener(
        "click",
        function() {

            let currentWishlist = [];


            try {

                currentWishlist =
                    JSON.parse(
                        localStorage.getItem(
                            "wishlist"
                        )
                    ) || [];

            } catch (error) {

                currentWishlist = [];

            }


            const index =
                currentWishlist.findIndex(
                    function(item) {

                        return item.id === product.id;

                    }
                );


            if (index === -1) {

                currentWishlist.push({

                    id:
                        product.id,

                    name:
                        product.name,

                    price:
                        getProductPrice(product),

                    image:
                        getMainImage(product)

                });


                button.textContent =
                    "♥ Saved to Wishlist";


                alert(
                    "Added to your wishlist."
                );


            } else {

                currentWishlist.splice(
                    index,
                    1
                );


                button.textContent =
                    "♡ Add to Wishlist";

            }


            localStorage.setItem(
                "wishlist",
                JSON.stringify(
                    currentWishlist
                )
            );

        }
    );

}


// =====================================================
// STAR RATING
// =====================================================

function createStars(rating) {

    const rounded =
        Math.round(
            Number(rating || 0)
        );


    let stars = "";


    for (
        let i = 1;
        i <= 5;
        i++
    ) {

        stars +=
            i <= rounded
                ? "★"
                : "☆";

    }


    return stars;

}


// =====================================================
// ERROR
// =====================================================

function showError(message) {

    productContainer.innerHTML = `

        <div class="product-error">

            <h2>
                😔 ${escapeHTML(message)}
            </h2>

            <p>
                We couldn't find the product you're looking for.
            </p>

            <a
                href="index.html"
                class="product-back-btn"
            >
                ← Back to Shopping
            </a>

        </div>

    `;

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
// START
// =====================================================

loadProduct();
