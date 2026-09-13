import { db, auth } from "./firebase.js";

import {
    signInAnonymously
} from "https://www.gstatic.com/firebasejs/12.17.1/firebase-auth.js";

import {
    collection,
    getDocs,
    addDoc,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.17.1/firebase-firestore.js";


// =====================================================
// ELEMENTS
// =====================================================

const productGrid =
    document.getElementById("product-grid");

const searchInput =
    document.getElementById("search");

const searchButton =
    document.getElementById("search-btn");

const categoryButtons =
    document.querySelectorAll(".category-btn");

const categoryProductsTitle =
    document.getElementById("category-products-title");

const categoryProductsCount =
    document.getElementById("category-products-count");


// =====================================================
// DATA
// =====================================================

let products = [];

let reviews = [];

let currentCategory = "All";


// =====================================================
// CATEGORY FROM URL
// =====================================================

const urlParams =
    new URLSearchParams(
        window.location.search
    );

const urlCategory =
    urlParams.get("category");


if (urlCategory) {

    currentCategory =
        urlCategory;

}


// =====================================================
// CATEGORY TITLE / COUNT
// =====================================================

function updateCategoryInfo(productList) {

    if (categoryProductsTitle) {

        if (
            currentCategory &&
            currentCategory !== "All"
        ) {

            categoryProductsTitle.textContent =
                currentCategory;

        } else {

            categoryProductsTitle.textContent =
                "All Products";

        }

    }


    if (categoryProductsCount) {

        categoryProductsCount.textContent =
            `${productList.length} product${
                productList.length === 1
                    ? ""
                    : "s"
            }`;

    }

}


// =====================================================
// WISHLIST
// =====================================================

function getWishlist() {

    return JSON.parse(
        localStorage.getItem("wishlist")
    ) || [];

}


function saveWishlist(wishlist) {

    localStorage.setItem(
        "wishlist",
        JSON.stringify(wishlist)
    );

}


function isInWishlist(product) {

    const wishlist =
        getWishlist();

    return wishlist.some(
        item =>
            item.id === product.id
    );

}


function toggleWishlist(product) {

    let wishlist =
        getWishlist();

    const exists =
        wishlist.some(
            item =>
                item.id === product.id
        );


    if (exists) {

        wishlist =
            wishlist.filter(
                item =>
                    item.id !== product.id
            );

    } else {

        wishlist.push({

            id:
                product.id,

            name:
                product.name,

            price:
                getProductPrice(product),

            image:
                getMainImage(product),

            category:
                product.category ||
                "Other"

        });

    }


    saveWishlist(wishlist);


    displayProducts(
        getFilteredProducts()
    );

}


// =====================================================
// SAFE TEXT
// =====================================================

function escapeHTML(value) {

    return String(value || "")
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
// PRODUCT PRICE
// =====================================================

function getProductPrice(product) {

    const regularPrice =
        Number(
            product.price || 0
        );


    const discountPrice =
        Number(
            product.discountPrice
        );


    if (
        product.discountPrice !== null &&
        product.discountPrice !== undefined &&
        !isNaN(discountPrice) &&
        discountPrice >= 0 &&
        discountPrice < regularPrice
    ) {

        return discountPrice;

    }


    return regularPrice;

}


// =====================================================
// MAIN PRODUCT IMAGE
// =====================================================

function getMainImage(product) {

    if (
        product.images &&
        Array.isArray(product.images) &&
        product.images.length > 0
    ) {

        return product.images[0];

    }


    return product.image || "";

}


// =====================================================
// PRODUCT IMAGES
// =====================================================

function getProductImages(product) {

    let images = [];


    if (
        product.images &&
        Array.isArray(product.images)
    ) {

        images =
            product.images.filter(
                image =>
                    image
            );

    }


    // Keep old products working

    if (
        !images.length &&
        product.image
    ) {

        images.push(
            product.image
        );

    }


    return images;

}


// =====================================================
// OPEN PRODUCT DETAILS
// =====================================================

function openProductDetails(product) {

    if (!product || !product.id) {

        return;

    }


    window.location.href =
        `product.html?id=${encodeURIComponent(product.id)}`;

}


// =====================================================
// IMAGE GALLERY / ZOOM
// =====================================================

function openImageGallery(
    images,
    name,
    startIndex = 0
) {

    if (!images.length) {

        return;

    }


    let currentIndex =
        startIndex;


    const overlay =
        document.createElement("div");


    overlay.id =
        "product-image-gallery";


    overlay.style.cssText = `
        position:fixed;
        inset:0;
        background:rgba(0,0,0,0.92);
        z-index:99999;
        display:flex;
        align-items:center;
        justify-content:center;
        padding:20px;
        box-sizing:border-box;
    `;


    overlay.innerHTML = `

        <button
            type="button"
            class="gallery-close"
            style="
                position:absolute;
                top:15px;
                right:15px;
                width:45px;
                height:45px;
                border:none;
                border-radius:50%;
                background:white;
                color:#222;
                font-size:30px;
                cursor:pointer;
                z-index:5;
            "
        >
            ×
        </button>


        <button
            type="button"
            class="gallery-prev"
            style="
                position:absolute;
                left:12px;
                top:50%;
                transform:translateY(-50%);
                width:45px;
                height:45px;
                border:none;
                border-radius:50%;
                background:white;
                font-size:28px;
                cursor:pointer;
                z-index:5;
            "
        >
            ‹
        </button>


        <div
            style="
                width:100%;
                max-width:900px;
                height:90vh;
                display:flex;
                align-items:center;
                justify-content:center;
            "
        >

            <img
                class="gallery-image"
                alt="${escapeHTML(name)}"
                style="
                    max-width:100%;
                    max-height:85vh;
                    object-fit:contain;
                    border-radius:10px;
                "
            >

        </div>


        <button
            type="button"
            class="gallery-next"
            style="
                position:absolute;
                right:12px;
                top:50%;
                transform:translateY(-50%);
                width:45px;
                height:45px;
                border:none;
                border-radius:50%;
                background:white;
                font-size:28px;
                cursor:pointer;
                z-index:5;
            "
        >
            ›
        </button>


        <div
            class="gallery-counter"
            style="
                position:absolute;
                bottom:20px;
                left:50%;
                transform:translateX(-50%);
                background:white;
                color:#222;
                padding:8px 14px;
                border-radius:20px;
                font-size:14px;
            "
        ></div>

    `;


    document.body.appendChild(
        overlay
    );


    const galleryImage =
        overlay.querySelector(
            ".gallery-image"
        );


    const counter =
        overlay.querySelector(
            ".gallery-counter"
        );


    const closeButton =
        overlay.querySelector(
            ".gallery-close"
        );


    const previousButton =
        overlay.querySelector(
            ".gallery-prev"
        );


    const nextButton =
        overlay.querySelector(
            ".gallery-next"
        );


    function updateGallery() {

        galleryImage.src =
            images[currentIndex];


        counter.textContent =
            `${currentIndex + 1} / ${images.length}`;

    }


    updateGallery();


    closeButton.addEventListener(
        "click",
        () => {

            overlay.remove();

            document.removeEventListener(
                "keydown",
                closeWithEscape
            );

        }
    );


    previousButton.addEventListener(
        "click",
        () => {

            currentIndex--;

            if (
                currentIndex < 0
            ) {

                currentIndex =
                    images.length - 1;

            }


            updateGallery();

        }
    );


    nextButton.addEventListener(
        "click",
        () => {

            currentIndex++;

            if (
                currentIndex >=
                images.length
            ) {

                currentIndex = 0;

            }


            updateGallery();

        }
    );


    overlay.addEventListener(
        "click",
        event => {

            if (
                event.target ===
                overlay
            ) {

                overlay.remove();

                document.removeEventListener(
                    "keydown",
                    closeWithEscape
                );

            }

        }
    );


    function closeWithEscape(event) {

        if (
            event.key ===
            "Escape"
        ) {

            overlay.remove();

            document.removeEventListener(
                "keydown",
                closeWithEscape
            );

        }


        if (
            event.key ===
            "ArrowLeft"
        ) {

            previousButton.click();

        }


        if (
            event.key ===
            "ArrowRight"
        ) {

            nextButton.click();

        }

    }


    document.addEventListener(
        "keydown",
        closeWithEscape
    );

}


// =====================================================
// GET PRODUCT REVIEWS
// =====================================================

function getProductReviews(productId) {

    return reviews.filter(
        review =>
            review.productId === productId
    );

}


// =====================================================
// GET AVERAGE RATING
// =====================================================

function getAverageRating(productId) {

    const productReviews =
        getProductReviews(
            productId
        );


    if (!productReviews.length) {

        return 0;

    }


    const total =
        productReviews.reduce(
            (sum, review) =>
                sum +
                Number(
                    review.rating || 0
                ),
            0
        );


    return total /
        productReviews.length;

}


// =====================================================
// STAR DISPLAY
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
// REVIEWS MODAL
// =====================================================

function openReviewsModal(product) {

    const productReviews =
        getProductReviews(
            product.id
        );


    const average =
        getAverageRating(
            product.id
        );


    const overlay =
        document.createElement("div");


    overlay.style.cssText = `
        position:fixed;
        inset:0;
        background:rgba(0,0,0,0.65);
        z-index:100000;
        display:flex;
        align-items:center;
        justify-content:center;
        padding:20px;
        box-sizing:border-box;
        overflow:auto;
    `;


    let reviewHTML = "";


    if (!productReviews.length) {

        reviewHTML = `
            <p
                style="
                    text-align:center;
                    color:#666;
                    padding:20px;
                "
            >
                No reviews yet.
                Be the first to review this product!
            </p>
        `;

    } else {

        reviewHTML =
            productReviews
                .map(
                    review => {

                        const rating =
                            Number(
                                review.rating || 0
                            );


                        return `

                            <div
                                style="
                                    padding:15px 0;
                                    border-bottom:1px solid #eee;
                                "
                            >

                                <strong>
                                    ${escapeHTML(
                                        review.customerName ||
                                        "Customer"
                                    )}
                                </strong>


                                <div
                                    style="
                                        color:#f5a400;
                                        font-size:20px;
                                        margin:5px 0;
                                    "
                                >
                                    ${createStars(
                                        rating
                                    )}
                                </div>


                                <p
                                    style="
                                        margin:5px 0;
                                        color:#555;
                                        line-height:1.5;
                                    "
                                >
                                    ${escapeHTML(
                                        review.comment
                                    )}
                                </p>

                            </div>

                        `;

                    }
                )
                .join("");

    }


    overlay.innerHTML = `

        <div
            style="
                width:100%;
                max-width:500px;
                max-height:90vh;
                overflow:auto;
                background:white;
                border-radius:15px;
                padding:25px;
                box-sizing:border-box;
            "
        >

            <button
                type="button"
                class="reviews-close"
                style="
                    float:right;
                    width:40px;
                    height:40px;
                    border:none;
                    border-radius:50%;
                    background:#eee;
                    font-size:25px;
                    cursor:pointer;
                "
            >
                ×
            </button>


            <h2>
                Reviews
            </h2>


            <h3>
                ${escapeHTML(
                    product.name
                )}
            </h3>


            <div
                style="
                    color:#f5a400;
                    font-size:25px;
                    margin:10px 0;
                "
            >
                ${createStars(
                    average
                )}
            </div>


            <p>
                ${
                    productReviews.length
                    ?
                    `${average.toFixed(1)} / 5 `
                    :
                    "No rating yet "
                }

                (${productReviews.length}
                review${
                    productReviews.length === 1
                        ? ""
                        : "s"
                })
            </p>


            <div
                style="
                    margin-top:20px;
                "
            >
                ${reviewHTML}
            </div>

        </div>

    `;


    document.body.appendChild(
        overlay
    );


    const closeButton =
        overlay.querySelector(
            ".reviews-close"
        );


    closeButton.addEventListener(
        "click",
        () => {

            overlay.remove();

        }
    );


    overlay.addEventListener(
        "click",
        event => {

            if (
                event.target ===
                overlay
            ) {

                overlay.remove();

            }

        }
    );

}


// =====================================================
// WRITE REVIEW MODAL
// =====================================================

function openReviewForm(product) {

    const overlay =
        document.createElement("div");


    overlay.style.cssText = `
        position:fixed;
        inset:0;
        background:rgba(0,0,0,0.65);
        z-index:100000;
        display:flex;
        align-items:center;
        justify-content:center;
        padding:20px;
        box-sizing:border-box;
    `;


    overlay.innerHTML = `

        <div
            style="
                width:100%;
                max-width:450px;
                background:white;
                border-radius:15px;
                padding:25px;
                box-sizing:border-box;
            "
        >

            <h2>
                Write a Review
            </h2>


            <p>
                ${escapeHTML(
                    product.name
                )}
            </p>


            <label
                style="
                    display:block;
                    margin-top:15px;
                    font-weight:bold;
                "
            >
                Your Name
            </label>


            <input
                type="text"
                id="review-name"
                placeholder="Enter your name"
                maxlength="50"
                style="
                    width:100%;
                    padding:12px;
                    margin-top:7px;
                    box-sizing:border-box;
                    border:1px solid #ccc;
                    border-radius:7px;
                "
            >


            <label
                style="
                    display:block;
                    margin-top:15px;
                    font-weight:bold;
                "
            >
                Rating
            </label>


            <select
                id="review-rating"
                style="
                    width:100%;
                    padding:12px;
                    margin-top:7px;
                    box-sizing:border-box;
                    border:1px solid #ccc;
                    border-radius:7px;
                "
            >

                <option value="5">
                    ⭐⭐⭐⭐⭐ 5 - Excellent
                </option>

                <option value="4">
                    ⭐⭐⭐⭐ 4 - Very Good
                </option>

                <option value="3">
                    ⭐⭐⭐ 3 - Good
                </option>

                <option value="2">
                    ⭐⭐ 2 - Fair
                </option>

                <option value="1">
                    ⭐ 1 - Poor
                </option>

            </select>


            <label
                style="
                    display:block;
                    margin-top:15px;
                    font-weight:bold;
                "
            >
                Your Review
            </label>


            <textarea
                id="review-comment"
                placeholder="Write your review..."
                maxlength="500"
                rows="5"
                style="
                    width:100%;
                    padding:12px;
                    margin-top:7px;
                    box-sizing:border-box;
                    border:1px solid #ccc;
                    border-radius:7px;
                    resize:vertical;
                "
            ></textarea>


            <button
                type="button"
                class="submit-review-btn"
                style="
                    width:100%;
                    margin-top:15px;
                    padding:13px;
                    border:none;
                    border-radius:8px;
                    background:#FFD700;
                    color:#111;
                    font-weight:bold;
                    cursor:pointer;
                "
            >
                ⭐ Submit Review
            </button>


            <button
                type="button"
                class="cancel-review-btn"
                style="
                    width:100%;
                    margin-top:10px;
                    padding:12px;
                    border:none;
                    border-radius:8px;
                    background:#eee;
                    color:#111;
                    font-weight:bold;
                    cursor:pointer;
                "
            >
                Cancel
            </button>

        </div>

    `;


    document.body.appendChild(
        overlay
    );


    const submitButton =
        overlay.querySelector(
            ".submit-review-btn"
        );


    const cancelButton =
        overlay.querySelector(
            ".cancel-review-btn"
        );


    submitButton.addEventListener(
        "click",
        async () => {

            const nameInput =
                overlay.querySelector(
                    "#review-name"
                );


            const ratingInput =
                overlay.querySelector(
                    "#review-rating"
                );


            const commentInput =
                overlay.querySelector(
                    "#review-comment"
                );


            const customerName =
                nameInput.value.trim();


            const rating =
                Number(
                    ratingInput.value
                );


            const comment =
                commentInput.value.trim();


            if (!customerName) {

                alert(
                    "Please enter your name."
                );

                return;

            }


            if (!comment) {

                alert(
                    "Please write a review."
                );

                return;

            }


            if (
                rating < 1 ||
                rating > 5
            ) {

                alert(
                    "Please select a rating."
                );

                return;

            }


            submitButton.disabled =
                true;


            submitButton.textContent =
                "Submitting...";


            try {
                if (!auth.currentUser) {
    await signInAnonymously(auth);
}

                await addDoc(
                    collection(
                        db,
                        "reviews"
                    ),
                    {

                        productId:
                            product.id,

                        productName:
                            product.name,

                        customerName:
                            customerName,

                        rating:
                            rating,

                        comment:
                            comment,
                            customerUid: auth.currentUser.uid,

                        createdAt:
                            serverTimestamp()

                    }
                );


                alert(
                    "Thank you! Your review has been submitted."
                );


                overlay.remove();


                await loadReviews();


                displayProducts(
                    getFilteredProducts()
                );


            } catch (error) {

                console.error(
                    "Error submitting review:",
                    error
                );


                alert(
                    "Unable to submit your review. Please check your internet connection and try again."
                );


                submitButton.disabled =
                    false;


                submitButton.textContent =
                    "⭐ Submit Review";

            }

        }
    );


    cancelButton.addEventListener(
        "click",
        () => {

            overlay.remove();

        }
    );

}


// =====================================================
// PRODUCT CARD
// =====================================================

function displayProducts(productList) {

    if (!productGrid) {

        return;

    }


    productGrid.innerHTML = "";

    updateCategoryInfo(productList);


    if (!productList.length) {

        productGrid.innerHTML = `
            <p style="
                text-align:center;
                padding:30px;
                width:100%;
            ">
                No products found.
            </p>
        `;

        return;

    }


    productList.forEach(product => {

        const images =
            getProductImages(product);


        const mainImage =
            getMainImage(product);


        const regularPrice =
            Number(
                product.price || 0
            );


        const sellingPrice =
            getProductPrice(product);


        const hasDiscount =
            sellingPrice <
            regularPrice;


        const averageRating =
            getAverageRating(
                product.id
            );


        const reviewCount =
            getProductReviews(
                product.id
            ).length;


        const card =
            document.createElement("div");


        card.className =
            "product-card";


        card.innerHTML = `

            <div
                class="product-image-container"
                style="
                    position:relative;
                    cursor:pointer;
                "
            >

                <img
                    src="${escapeHTML(mainImage)}"
                    alt="${escapeHTML(product.name)}"
                    class="product-image"
                    style="
                        width:100%;
                        height:220px;
                        object-fit:contain;
                    "
                >


                ${
                    product.newArrival
                    ?
                    `
                    <span
                        style="
                            position:absolute;
                            top:10px;
                            left:10px;
                            background:#FFD700;
                            color:#111;
                            padding:5px 9px;
                            border-radius:5px;
                            font-size:12px;
                            font-weight:bold;
                        "
                    >
                        NEW
                    </span>
                    `
                    :
                    ""
                }


                ${
                    product.flashSale
                    ?
                    `
                    <span
                        style="
                            position:absolute;
                            top:10px;
                            right:10px;
                            background:#e53935;
                            color:white;
                            padding:5px 9px;
                            border-radius:5px;
                            font-size:12px;
                            font-weight:bold;
                        "
                    >
                        FLASH SALE
                    </span>
                    `
                    :
                    ""
                }


                ${
                    hasDiscount
                    ?
                    `
                    <span
                        style="
                            position:absolute;
                            bottom:10px;
                            left:10px;
                            background:#2e7d32;
                            color:white;
                            padding:5px 9px;
                            border-radius:5px;
                            font-size:12px;
                            font-weight:bold;
                        "
                    >
                        SALE
                    </span>
                    `
                    :
                    ""
                }

            </div>


            <div class="product-info">

                <button
                    type="button"
                    class="wishlist-btn"
                    data-id="${product.id}"
                    style="
                        float:right;
                        border:none;
                        background:none;
                        font-size:24px;
                        cursor:pointer;
                    "
                >
                    ${
                        isInWishlist(product)
                        ? "♥"
                        : "♡"
                    }
                </button>


                <h3
                    class="product-card-name"
                    style="
                        cursor:pointer;
                    "
                >
                    ${escapeHTML(product.name)}
                </h3>


                <p>
                    ${escapeHTML(
                        product.category ||
                        "Other"
                    )}
                </p>


                ${
                    product.description
                    ?
                    `
                    <p
                        style="
                            font-size:14px;
                            color:#666;
                        "
                    >
                        ${escapeHTML(
                            product.description
                        )}
                    </p>
                    `
                    :
                    ""
                }


                <div
                    class="product-price"
                    style="
                        margin:10px 0;
                    "
                >

                    ${
                        hasDiscount
                        ?
                        `
                        <span
                            style="
                                text-decoration:line-through;
                                color:#888;
                                margin-right:8px;
                            "
                        >
                            GHS ${regularPrice.toLocaleString()}
                        </span>
                        `
                        :
                        ""
                    }


                    <strong
                        style="
                            font-size:18px;
                        "
                    >
                        GHS ${sellingPrice.toLocaleString()}
                    </strong>

                </div>


                ${
                    product.stock !== undefined
                    ?
                    `
                    <p
                        style="
                            font-size:13px;
                            color:${
                                Number(product.stock) > 0
                                ? "#2e7d32"
                                : "#d32f2f"
                            };
                            font-weight:bold;
                        "
                    >
                        ${
                            Number(product.stock) > 0
                            ?
                            `${Number(product.stock)} in stock`
                            :
                            "Out of stock"
                        }
                    </p>
                    `
                    :
                    ""
                }


                ${
                    product.sizes &&
                    Array.isArray(product.sizes) &&
                    product.sizes.length
                    ?
                    `
                    <p>
                        <strong>
                            Sizes:
                        </strong>

                        ${product.sizes
                            .map(size =>
                                escapeHTML(size)
                            )
                            .join(", ")
                        }
                    </p>
                    `
                    :
                    ""
                }


                ${
                    product.colors &&
                    Array.isArray(product.colors) &&
                    product.colors.length
                    ?
                    `
                    <p>
                        <strong>
                            Colors:
                        </strong>

                        ${product.colors
                            .map(color =>
                                escapeHTML(color)
                            )
                            .join(", ")
                        }
                    </p>
                    `
                    :
                    ""
                }


                <div
                    style="
                        margin:10px 0;
                        color:#f5a400;
                    "
                >

                    <span
                        style="
                            font-size:20px;
                        "
                    >
                        ${createStars(
                            averageRating
                        )}
                    </span>


                    <button
                        type="button"
                        class="reviews-btn"
                        style="
                            border:none;
                            background:none;
                            cursor:pointer;
                            color:#555;
                            margin-left:5px;
                        "
                    >
                        ${
                            reviewCount
                            ?
                            `${reviewCount} review${
                                reviewCount === 1
                                    ? ""
                                    : "s"
                            }`
                            :
                            "No reviews"
                        }
                    </button>

                </div>


                <button
                    type="button"
                    class="view-product-btn"
                    style="
                        width:100%;
                        margin-top:8px;
                        padding:10px;
                        border:none;
                        border-radius:6px;
                        background:#eee;
                        cursor:pointer;
                    "
                >
                    View Product
                </button>


                <button
                    type="button"
                    class="write-review-btn"
                    style="
                        width:100%;
                        margin-top:8px;
                        padding:10px;
                        border:none;
                        border-radius:6px;
                        background:#f5f5f5;
                        cursor:pointer;
                    "
                >
                    ⭐ Write a Review
                </button>


                <button
                    type="button"
                    class="add-cart-btn"
                    ${
                        Number(product.stock) === 0
                        ?
                        "disabled"
                        :
                        ""
                    }
                    style="
                        width:100%;
                        margin-top:8px;
                        padding:11px;
                        border:none;
                        border-radius:6px;
                        background:#FFD700;
                        color:#111;
                        font-weight:bold;
                        cursor:pointer;
                    "
                >
                    ${
                        Number(product.stock) === 0
                        ?
                        "Out of Stock"
                        :
                        "Add to Cart"
                    }
                </button>

            </div>

        `;


        // =================================================
        // PRODUCT IMAGE
        // =================================================

        const imageContainer =
            card.querySelector(
                ".product-image-container"
            );


        if (imageContainer) {

            imageContainer.addEventListener(
                "click",
                event => {

                    event.stopPropagation();

                    openProductDetails(
                        product
                    );

                }
            );

        }


        // =================================================
        // PRODUCT NAME
        // =================================================

        const productName =
            card.querySelector(
                ".product-card-name"
            );


        if (productName) {

            productName.addEventListener(
                "click",
                event => {

                    event.stopPropagation();

                    openProductDetails(
                        product
                    );

                }
            );

        }


        // =================================================
        // VIEW PRODUCT
        // =================================================

        const viewButton =
            card.querySelector(
                ".view-product-btn"
            );


        if (viewButton) {

            viewButton.addEventListener(
                "click",
                event => {

                    event.stopPropagation();

                    openProductDetails(
                        product
                    );

                }
            );

        }


        // =================================================
        // WISHLIST
        // =================================================

        const wishlistButton =
            card.querySelector(
                ".wishlist-btn"
            );


        if (wishlistButton) {

            wishlistButton.addEventListener(
                "click",
                event => {

                    event.stopPropagation();

                    toggleWishlist(product);

                }
            );

        }


        // =================================================
        // REVIEWS
        // =================================================

        const reviewsButton =
            card.querySelector(
                ".reviews-btn"
            );


        if (reviewsButton) {

            reviewsButton.addEventListener(
                "click",
                event => {

                    event.stopPropagation();

                    openReviewsModal(
                        product
                    );

                }
            );

        }


        const writeReviewButton =
            card.querySelector(
                ".write-review-btn"
            );


        if (writeReviewButton) {

            writeReviewButton.addEventListener(
                "click",
                event => {

                    event.stopPropagation();

                    openReviewForm(
                        product
                    );

                }
            );

        }


        // =================================================
        // ADD TO CART
        // =================================================

        const cartButton =
            card.querySelector(
                ".add-cart-btn"
            );


        if (cartButton) {

            cartButton.addEventListener(
                "click",
                event => {

                    event.stopPropagation();


                    if (
                        Number(product.stock) === 0
                    ) {

                        return;

                    }


                    addToCart(product);

                }
            );

        }


        productGrid.appendChild(
            card
        );

    });

}


// =====================================================
// ADD TO CART
// =====================================================

function addToCart(product) {

    let cart =
        JSON.parse(
            localStorage.getItem("cart")
        ) || [];


    const existing =
        cart.find(
            item =>
                item.id === product.id
        );


    if (existing) {

        existing.quantity =
            Number(
                existing.quantity || 1
            ) + 1;

    } else {

        cart.push({

            id:
                product.id,

            name:
                product.name,

            price:
                getProductPrice(product),

            image:
                getMainImage(product),

            quantity:
                1

        });

    }


    localStorage.setItem(
        "cart",
        JSON.stringify(cart)
    );


    alert(
        `${product.name} added to cart.`
    );

}


// =====================================================
// FILTER PRODUCTS
// =====================================================

function getFilteredProducts() {

    let filtered =
        [...products];


    // CATEGORY FILTER

    if (
        currentCategory &&
        currentCategory !== "All"
    ) {

        const selectedCategory =
            String(
                currentCategory || ""
            )
            .trim()
            .toLowerCase();


        filtered =
            filtered.filter(
                product => {

                    const productCategory =
                        String(
                            product.category || ""
                        )
                        .trim()
                        .toLowerCase();


                    return (
                        productCategory ===
                        selectedCategory
                    );

                }
            );

    }


    // SEARCH FILTER

    const searchTerm =
        searchInput
            ?
            searchInput.value
                .trim()
                .toLowerCase()
            :
            "";


    if (searchTerm) {

        filtered =
            filtered.filter(
                product => {

                    const name =
                        String(
                            product.name || ""
                        ).toLowerCase();


                    const category =
                        String(
                            product.category || ""
                        ).toLowerCase();


                    const description =
                        String(
                            product.description || ""
                        ).toLowerCase();


                    return (
                        name.includes(searchTerm) ||
                        category.includes(searchTerm) ||
                        description.includes(searchTerm)
                    );

                }
            );

    }


    return filtered;

}


// =====================================================
// SEARCH
// =====================================================

if (searchButton) {

    searchButton.addEventListener(
        "click",
        () => {

            displayProducts(
                getFilteredProducts()
            );

        }
    );

}


if (searchInput) {

    searchInput.addEventListener(
        "input",
        () => {

            displayProducts(
                getFilteredProducts()
            );

        }
    );


    searchInput.addEventListener(
        "keydown",
        event => {

            if (
                event.key ===
                "Enter"
            ) {

                displayProducts(
                    getFilteredProducts()
                );

            }

        }
    );

}


// =====================================================
// CATEGORY BUTTONS
// =====================================================

function updateActiveCategoryButton() {

    categoryButtons.forEach(
        button => {

            const buttonCategory =
                button.dataset.category ||
                button.textContent.trim();


            button.classList.remove(
                "active"
            );

            button.classList.remove(
                "active-category"
            );


            if (
                buttonCategory.toLowerCase() ===
                currentCategory.toLowerCase()
            ) {

                button.classList.add(
                    "active-category"
                );

            }

        }
    );

}


categoryButtons.forEach(
    button => {

        button.addEventListener(
            "click",
            () => {

                currentCategory =
                    button.dataset.category ||
                    button.textContent.trim();


                updateActiveCategoryButton();


                displayProducts(
                    getFilteredProducts()
                );

            }
        );

    }
);


updateActiveCategoryButton();


// =====================================================
// LOAD REVIEWS FROM FIRESTORE
// =====================================================

async function loadReviews() {

    try {

        const snapshot =
            await getDocs(
                collection(
                    db,
                    "reviews"
                )
            );


        reviews = [];


        snapshot.forEach(
            documentSnapshot => {

                reviews.push({

                    id:
                        documentSnapshot.id,

                    ...documentSnapshot.data()

                });

            }
        );


    } catch (error) {

        console.error(
            "Error loading reviews:",
            error
        );

    }

}


// =====================================================
// LOAD PRODUCTS FROM FIRESTORE
// =====================================================

async function loadProducts() {

    if (!productGrid) {

        return;

    }


    productGrid.innerHTML = `
        <p style="
            text-align:center;
            padding:30px;
            width:100%;
        ">
            Loading products...
        </p>
    `;


    try {

        await loadReviews();


        const snapshot =
            await getDocs(
                collection(
                    db,
                    "products"
                )
            );


        products = [];


        snapshot.forEach(
            documentSnapshot => {

                products.push({

                    id:
                        documentSnapshot.id,

                    ...documentSnapshot.data()

                });

            }
        );


        // =================================================
        // SORT NEWEST PRODUCTS FIRST
        // =================================================

        products.sort(
            (a, b) => {

                const dateA =
                    a.createdAt?.seconds ||
                    0;


                const dateB =
                    b.createdAt?.seconds ||
                    0;


                return dateB - dateA;

            }
        );


        displayProducts(
            getFilteredProducts()
        );


    } catch (error) {

        console.error(
            "Error loading products:",
            error
        );


        productGrid.innerHTML = `
            <p style="
                text-align:center;
                padding:30px;
                width:100%;
                color:#d32f2f;
            ">
                Unable to load products.
                Please check your internet connection
                and try again.
            </p>
        `;

    }

}


// =====================================================
// INITIAL LOAD
// =====================================================

loadProducts();


// =====================================================
// MAKE FUNCTIONS AVAILABLE IF NEEDED
// =====================================================

window.loadProducts =
    loadProducts;

window.displayProducts =
    displayProducts;

window.openReviewsModal =
    openReviewsModal;

window.openReviewForm =
    openReviewForm;