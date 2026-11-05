import "./style.css";
import { products } from "./products.js";

const productList = document.querySelector("#product-list");
const searchInput = document.querySelector("#search-input");
const categoryFilter = document.querySelector("#category-filter");
const sortSelect = document.querySelector("#sort-select");
const status = document.querySelector("#status");

const cartButton = document.querySelector("#cart-button");
const cartPanel = document.querySelector("#cart-panel");
const closeCartButton = document.querySelector("#close-cart-button");
const cartItems = document.querySelector("#cart-items");
const cartCount = document.querySelector("#cart-count");

const modal = document.querySelector("#product-modal");
const modalBody = document.querySelector("#modal-body");
const closeModalButton = document.querySelector("#close-modal-button");

const state = {
  products,
  cart: loadCart(),
  category: "all",
  sort: "name",
};

let searchTimeout;
let latestSearchRequest = 0;
let modalTrigger = null;

function loadCart() {
  let savedCart;

  try {
    savedCart = localStorage.getItem("cart");
  } catch (error) {
    console.error("Could not read the saved cart.", error);
    return [];
  }

  if (!savedCart) return [];

  try {
    const parsedCart = JSON.parse(savedCart);

    if (!Array.isArray(parsedCart)) {
      throw new TypeError("Saved cart data must be an array.");
    }

    return parsedCart.map((item) => {
      const productId = typeof item === "number" ? item : item?.id;
      const product = products.find(({ id }) => id === productId);

      if (!product) {
        throw new TypeError("Saved cart contains an unknown product.");
      }

      return product;
    });
  } catch (error) {
    console.error("Saved cart data is invalid and has been cleared.", error);

    try {
      localStorage.removeItem("cart");
    } catch (storageError) {
      console.error("Could not clear the invalid saved cart.", storageError);
    }

    return [];
  }
}

function searchProductsFromServer(query) {
  const delay = Math.random() * 900 + 100;

  return new Promise((resolve) => {
    setTimeout(() => {
      const normalizedQuery = query.trim().toLowerCase();

      const results = state.products.filter((product) => {
        return product.name.toLowerCase().includes(normalizedQuery);
      });

      resolve(results);
    }, delay);
  });
}

function sortProducts(items, sortOption) {
  const sortedItems = [...items];

  if (sortOption === "price-asc") {
    return sortedItems.sort((a, b) => a.price - b.price);
  }

  if (sortOption === "price-desc") {
    return sortedItems.sort((a, b) => b.price - a.price);
  }

  if (sortOption === "rating") {
    return sortedItems.sort((a, b) => b.rating - a.rating);
  }

  return sortedItems.sort((a, b) => a.name.localeCompare(b.name));
}

function renderProducts(items) {
  productList.innerHTML = "";

  if (items.length === 0) {
    productList.innerHTML = "<p>No products found.</p>";
    return;
  }

  items.forEach((product) => {
    const card = document.createElement("article");
    card.className = "product-card";

    card.innerHTML = `
      <h2>${product.name}</h2>
      <p><strong>Category:</strong> ${product.category}</p>
      <p><strong>Price:</strong> $${product.price.toFixed(2)}</p>
      <p><strong>Rating:</strong> ${product.rating}</p>
      <button class="add-button" data-product-id="${product.id}">
        Add to cart
      </button>
      <button class="details-button" data-product-id="${product.id}">
        View details
      </button>
    `;

    productList.append(card);
  });
}

function handleProductClick(event) {
  if (!(event.target instanceof Element)) return;

  const button = event.target.closest("button");

  if (!button || !productList.contains(button)) return;

  const productId = Number(button.dataset.productId);
  const product = products.find((item) => item.id === productId);

  if (!product) return;

  if (button.classList.contains("add-button")) {
    addToCart(product);
  }

  if (button.classList.contains("details-button")) {
    openProductModal(product);
  }
}

function addToCart(product) {
  state.cart.push(product);

  try {
    localStorage.setItem("cart", JSON.stringify(state.cart));
  } catch (error) {
    console.error("Could not save the cart.", error);
    status.textContent = "Your cart could not be saved on this device.";
  }

  renderCart();
}

function renderCart() {
  cartCount.textContent = state.cart.length;

  cartItems.innerHTML = state.cart
    .map((product) => `<li>${product.name} — $${product.price.toFixed(2)}</li>`)
    .join("");
}

function openProductModal(product) {
  modalTrigger = document.activeElement;
  modalBody.innerHTML = `
    <p>${product.description}</p>
    <p><strong>Price:</strong> $${product.price.toFixed(2)}</p>
    <p><strong>Rating:</strong> ${product.rating}</p>
  `;

  modal.hidden = false;
  closeModalButton.focus();
}

function closeProductModal() {
  if (modal.hidden) return;

  modal.hidden = true;

  if (modalTrigger instanceof HTMLElement && modalTrigger.isConnected) {
    modalTrigger.focus();
  }

  modalTrigger = null;
}

async function updateProducts(requestId) {
  const query = searchInput.value;

  status.textContent = "Loading products...";

  let searchedProducts;

  try {
    searchedProducts = await searchProductsFromServer(query);
  } catch (error) {
    if (requestId !== latestSearchRequest) return;

    console.error("Could not load products.", error);
    status.textContent = "Could not load products. Please try again.";
    return;
  }

  if (requestId !== latestSearchRequest) return;

  let visibleProducts = searchedProducts.filter((product) => {
    if (state.category === "all") return true;
    return product.category === state.category;
  });

  visibleProducts = sortProducts(visibleProducts, state.sort);

  status.textContent = `${visibleProducts.length} product(s) found`;
  renderProducts(visibleProducts);
}

function scheduleProductUpdate(debounce = false) {
  const requestId = ++latestSearchRequest;
  clearTimeout(searchTimeout);

  if (debounce) {
    searchTimeout = setTimeout(() => updateProducts(requestId), 250);
  } else {
    updateProducts(requestId);
  }
}

productList.addEventListener("click", handleProductClick);

searchInput.addEventListener("input", () => {
  scheduleProductUpdate(true);
});

categoryFilter.addEventListener("change", () => {
  state.category = categoryFilter.value;
  scheduleProductUpdate();
});

sortSelect.addEventListener("change", () => {
  state.sort = sortSelect.value;
  scheduleProductUpdate();
});

cartButton.addEventListener("click", () => {
  cartPanel.hidden = false;
});

closeCartButton.addEventListener("click", () => {
  cartPanel.hidden = true;
});

closeModalButton.addEventListener("click", () => {
  closeProductModal();
});

modal.addEventListener("click", (event) => {
  if (event.target === modal) closeProductModal();
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && !modal.hidden) {
    closeProductModal();
  }
});

renderCart();
scheduleProductUpdate();
