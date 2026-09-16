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


// =========================
// ADMIN SECURITY
// =========================

const ADMIN_EMAIL =
    "abakahaugustines2@gmail.com";


onAuthStateChanged(
    auth,
    (user) => {

        // No user is logged in

        if (!user) {

            alert(
                "Please log in to access the Admin Dashboard."
            );

            window.location.href =
                "account.html";

            return;

        }


        // User is logged in,
        // but is not the Yellow Cicy admin

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


        // =========================
        // ADMIN VERIFIED
        // =========================

        console.log(
            "Yellow Cicy admin verified."
        );


        // Now it is safe to load
        // the admin products

        loadProducts();

    }
);


// =========================
// ELEMENTS
// =========================

const nameInput =
    document.getElementById("name");

const descriptionInput =
    document.getElementById("description");

const priceInput =
    document.getElementById("price");

const discountPriceInput =
    document.getElementById("discountPrice");

const stockInput =
    document.getElementById("stock");

const categoryInput =
    document.getElementById("category");

const sizesInput =
    document.getElementById("sizes");

const colorsInput =
    document.getElementById("colors");

const imagesInput =
    document.getElementById("images");

const imagePreview =
    document.getElementById("image-preview");

const newArrivalInput =
    document.getElementById("newArrival");

const flashSaleInput =
    document.getElementById("flashSale");

const flashStartInput =
    document.getElementById("flashStart");

const flashEndInput =
    document.getElementById("flashEnd");

const addButton =
    document.getElementById("add-btn");

const productList =
    document.getElementById("product-list");


// =========================
// SELECTED IMAGES
// =========================

let selectedImages = [];


// =========================
// READ IMAGE FILE
// =========================

function readImage(file) {

    return new Promise(
        (resolve, reject) => {

            const reader =
                new FileReader();


            reader.onload =
                () => {

                    resolve(
                        reader.result
                    );

                };


            reader.onerror =
                () => {

                    reject(
                        new Error(
                            "Unable to read image."
                        )
                    );

                };


            reader.readAsDataURL(file);

        }
    );

}


// =========================
// SHOW IMAGE PREVIEW
// =========================

function showImagePreview(image) {

    const wrapper =
        document.createElement("div");


    wrapper.style.position =
        "relative";


    const img =
        document.createElement("img");


    img.src =
        image;


    img.alt =
        "Product image";


    img.style.width =
        "90px";


    img.style.height =
        "90px";


    img.style.objectFit =
        "cover";


    img.style.borderRadius =
        "8px";


    img.style.border =
        "1px solid #ddd";


    wrapper.appendChild(
        img
    );


    imagePreview.appendChild(
        wrapper
    );

}


// =========================
// IMAGE SELECTION
// =========================

if (imagesInput) {

    imagesInput.addEventListener(
        "change",
        async () => {

            const files =
                Array.from(
                    imagesInput.files
                );


            if (!files.length) {

                return;

            }


            try {

                // Read all newly selected
                // images

                const newImages =
                    await Promise.all(
                        files.map(
                            readImage
                        )
                    );


                // Add new images to the
                // existing images

                newImages.forEach(
                    (image) => {

                        selectedImages.push(
                            image
                        );


                        showImagePreview(
                            image
                        );

                    }
                );


            } catch (error) {

                console.error(
                    "Image reading error:",
                    error
                );


                alert(
                    "Unable to read one of the selected images."
                );

            }


            // Clear the file input.
            //
            // This allows Android to choose
            // another photo again.

            imagesInput.value = "";

        }
    );

}


// =========================
// ADD PRODUCT BUTTON
// =========================

if (addButton) {

    addButton.addEventListener(
        "click",
        addProduct
    );

}


// =========================
// ADD PRODUCT
// =========================

async function addProduct() {

    const name =
        nameInput.value.trim();


    const description =
        descriptionInput.value.trim();


    const price =
        Number(
            priceInput.value
        );


    const discountPrice =
        discountPriceInput.value
            ? Number(
                discountPriceInput.value
            )
            : null;


    const stock =
        stockInput.value
            ? Number(
                stockInput.value
            )
            : 0;


    const category =
        categoryInput.value;


    const sizes =
        sizesInput.value
            .split(",")
            .map(
                size => size.trim()
            )
            .filter(
                size => size
            );


    const colors =
        colorsInput.value
            .split(",")
            .map(
                color => color.trim()
            )
            .filter(
                color => color
            );


    const newArrival =
        newArrivalInput.checked;


    const flashSale =
        flashSaleInput.checked;


    const flashStart =
        flashStartInput.value || "";


    const flashEnd =
        flashEndInput.value || "";


    // =========================
    // VALIDATION
    // =========================

    if (!name) {

        alert(
            "Please enter a product name."
        );

        return;

    }


    if (
        !priceInput.value ||
        isNaN(price) ||
        price < 0
    ) {

        alert(
            "Please enter a valid price."
        );

        return;

    }


    if (!category) {

        alert(
            "Please select a category."
        );

        return;

    }


    if (!selectedImages.length) {

        alert(
            "Please select at least one product photo."
        );

        return;

    }


    if (
        discountPrice !== null &&
        (
            isNaN(discountPrice) ||
            discountPrice < 0
        )
    ) {

        alert(
            "Please enter a valid discount price."
        );

        return;

    }


    if (
        discountPrice !== null &&
        discountPrice >= price
    ) {

        alert(
            "Discount price must be lower than the regular price."
        );

        return;

    }


    if (
        isNaN(stock) ||
        stock < 0
    ) {

        alert(
            "Please enter a valid stock quantity."
        );

        return;

    }


    // =========================
    // FLASH SALE VALIDATION
    // =========================

    if (flashSale) {

        if (
            !flashStart ||
            !flashEnd
        ) {

            alert(
                "Please enter both Flash Sale start and end dates."
            );

            return;

        }


        if (
            new Date(flashEnd) <=
            new Date(flashStart)
        ) {

            alert(
                "Flash Sale end time must be after the start time."
            );

            return;

        }

    }


    // =========================
    // ADD TO FIRESTORE
    // =========================

    try {

        addButton.disabled = true;

        addButton.textContent =
            "Adding...";


        await addDoc(
            collection(
                db,
                "products"
            ),
            {

                name:
                    name,

                description:
                    description,

                price:
                    price,

                discountPrice:
                    discountPrice,

                stock:
                    stock,

                category:
                    category,

                sizes:
                    sizes,

                colors:
                    colors,

                // All product photos

                images:
                    selectedImages,

                // First image kept for
                // existing code

                image:
                    selectedImages[0],

                newArrival:
                    newArrival,

                flashSale:
                    flashSale,

                flashStart:
                    flashStart,

                flashEnd:
                    flashEnd,

                createdAt:
                    serverTimestamp()

            }
        );


        alert(
            "Product added successfully!"
        );


        // =========================
        // CLEAR FORM
        // =========================

        nameInput.value = "";

        descriptionInput.value = "";

        priceInput.value = "";

        discountPriceInput.value = "";

        stockInput.value = "";

        categoryInput.value = "";

        sizesInput.value = "";

        colorsInput.value = "";

        imagesInput.value = "";

        newArrivalInput.checked =
            false;

        flashSaleInput.checked =
            false;

        flashStartInput.value = "";

        flashEndInput.value = "";


        selectedImages = [];


        imagePreview.innerHTML =
            "";


        // Reload products

        await loadProducts();


    } catch (error) {

        console.error(
            "Error adding product:",
            error
        );


        alert(
            "Unable to add product.\n\n" +
            error.message
        );


    } finally {

        addButton.disabled =
            false;


        addButton.textContent =
            "Add Product";

    }

}


// =========================
// LOAD PRODUCTS
// =========================

async function loadProducts() {

    productList.innerHTML = `

        <tr>

            <td colspan="5">
                Loading products...
            </td>

        </tr>

    `;


    try {

        const snapshot =
            await getDocs(
                collection(
                    db,
                    "products"
                )
            );


        if (snapshot.empty) {

            productList.innerHTML = `

                <tr>

                    <td colspan="5">
                        No products found.
                    </td>

                </tr>

            `;

            return;

        }


        productList.innerHTML =
            "";


        snapshot.forEach(
            (productDoc) => {

                const product =
                    productDoc.data();


                const category =
                    product.category ||
                    "Other";


                const image =
                    product.image ||
                    (
                        product.images &&
                        product.images[0]
                    ) ||
                    "";


                const row =
                    document.createElement(
                        "tr"
                    );


                row.innerHTML = `

                    <td>

                        <img
                            src="${image}"
                            alt="${product.name || "Product"}"
                            style="
                                width:60px;
                                height:60px;
                                object-fit:cover;
                                border-radius:8px;
                            "
                        >

                    </td>


                    <td>
                        ${product.name || ""}
                    </td>


                    <td>
                        ${category}
                    </td>


                    <td>

                        GHS ${Number(
                            product.price || 0
                        ).toFixed(2)}

                    </td>


                    <td>

                        <button
                            class="delete-btn"
                            data-id="${productDoc.id}"
                        >
                            Delete
                        </button>

                    </td>

                `;


                const deleteButton =
                    row.querySelector(
                        ".delete-btn"
                    );


                deleteButton.addEventListener(
                    "click",
                    () => {

                        deleteProduct(
                            productDoc.id,
                            product.name
                        );

                    }
                );


                productList.appendChild(
                    row
                );

            }
        );


    } catch (error) {

        console.error(
            "Error loading products:",
            error
        );


        productList.innerHTML = `

            <tr>

                <td colspan="5">

                    Unable to load products.

                </td>

            </tr>

        `;

    }

}


// =========================
// DELETE PRODUCT
// =========================

async function deleteProduct(
    id,
    productName
) {

    const confirmed =
        confirm(
            "Delete " +
            productName +
            "?"
        );


    if (!confirmed) {

        return;

    }


    try {

        await deleteDoc(
            doc(
                db,
                "products",
                id
            )
        );


        alert(
            "Product deleted successfully!"
        );


        await loadProducts();


    } catch (error) {

        console.error(
            "Error deleting product:",
            error
        );


        alert(
            "Unable to delete product.\n\n" +
            error.message
        );

    }

}


// =========================
// START
// =========================
//
// loadProducts() is intentionally
// NOT called here.
//
// It is called only after Firebase
// confirms the admin account above.
