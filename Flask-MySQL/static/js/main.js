/* ============================================================
   GLOBAL HELPERS
============================================================ */

async function apiGet(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

async function apiPost(url, body) {
  const res = await fetch(url, {
    method: "POST",
    headers: {"Content-Type": "application/json"},
    body: JSON.stringify(body)
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || JSON.stringify(data));
  return data;
}

async function apiPut(url, body) {
  const res = await fetch(url, {
    method: "PUT",
    headers: {"Content-Type": "application/json"},
    body: JSON.stringify(body)
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || JSON.stringify(data));
  return data;
}

async function apiDelete(url) {
  const res = await fetch(url, {method: "DELETE"});
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.message || data.error || JSON.stringify(data));
  return data;
}

function renderPagination(container, totalItems, perPage, currentPage, onChange) {
  const totalPages = Math.max(1, Math.ceil(totalItems / perPage));
  container.innerHTML = "";
  for (let p = 1; p <= totalPages; p++) {
    const li = document.createElement("li");
    li.className = "page-item" + (p === currentPage ? " active" : "");
    const a = document.createElement("a");
    a.className = "page-link";
    a.href = "#";
    a.textContent = p;
    a.addEventListener("click", (e) => {
      e.preventDefault();
      onChange(p);
    });
    li.appendChild(a);
    container.appendChild(li);
  }
}

function statusBadge(status) {
  const span = document.createElement("span");
  span.textContent = status || "No shipment";
  let cls = "bg-secondary";
  if (status === "Pending") cls = "bg-warning text-dark";
  if (status === "In Transit") cls = "bg-primary";
  if (status === "Delivered") cls = "bg-success";
  span.className = "badge " + cls;
  return span;
}

/* ============================================================
   SUPPLIERS — CRUD COMPLETE (FINAL VERSION)
============================================================ */

async function initSuppliers() {
  const tbody = document.querySelector("#suppliers-table tbody");
  if (!tbody) return;   // Not on this page

  const pagUl = document.getElementById("suppliers-pagination");
  const perPage = 20;
  let page = 1;
  let rows = [];

  // ELEMENTS FROM YOUR HTML
  const newBtn = document.getElementById("sp-new-btn");
  const modalEl = document.getElementById("sp-modal");
  const modal = new bootstrap.Modal(modalEl);

  const form = document.getElementById("sp-form");
  const title = document.getElementById("sp-modal-title");
  const idField = document.getElementById("sp-id");
  const nameField = document.getElementById("sp-name");
  const countryField = document.getElementById("sp-country");

  // OPEN CREATE MODAL
  function openCreateModal() {
    idField.value = "";
    nameField.value = "";
    countryField.value = "";
    title.textContent = "New Supplier";
    modal.show();
  }

  // OPEN EDIT MODAL
  function openEditModal(s) {
    idField.value = s.supplier_id;
    nameField.value = s.name;
    countryField.value = s.country;
    title.textContent = "Edit Supplier";
    modal.show();
  }

  // CLICK + NEW
  newBtn.onclick = openCreateModal;

  // SUBMIT FORM
  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const payload = {
      name: nameField.value.trim(),
      country: countryField.value.trim(),
    };

    try {
      if (idField.value) {
        // UPDATE
        await apiPut(`/supplier/${idField.value}`, payload);
      } else {
        // CREATE — MUST USE SINGULAR
        await apiPost("/supplier", payload);
      }

      modal.hide();
      await loadSuppliers();

    } catch (err) {
      alert(err.message || "Error saving supplier");
    }
  });

  // LOAD DB CONTENT
  async function loadSuppliers() {
    try {
      rows = await apiGet("/suppliers");  // GET plural works
      render();
    } catch (e) {
      console.error(e);
    }
  }

  // RENDER TABLE
  function render() {
    const start = (page - 1) * perPage;
    const slice = rows.slice(start, start + perPage);

    tbody.innerHTML = "";

    slice.forEach(s => {
      const tr = document.createElement("tr");

      tr.innerHTML = `
        <td>${s.supplier_id}</td>
        <td>${s.name}</td>
        <td>${s.country}</td>
      `;

      const tdActions = document.createElement("td");

      const editBtn = document.createElement("button");
      editBtn.className = "btn btn-sm btn-outline-primary me-2";
      editBtn.textContent = "Edit";
      editBtn.onclick = () => openEditModal(s);

      const delBtn = document.createElement("button");
      delBtn.className = "btn btn-sm btn-outline-danger";
      delBtn.textContent = "Delete";
      delBtn.onclick = async () => {
        if (!confirm("Delete this supplier?")) return;

        try {
          await apiDelete(`/supplier/${s.supplier_id}`);
          await loadSuppliers();
        } catch (err) {
          alert(err.message || "Error deleting supplier");
        }
      };

      tdActions.appendChild(editBtn);
      tdActions.appendChild(delBtn);
      tr.appendChild(tdActions);

      tbody.appendChild(tr);
    });

    renderPagination(pagUl, rows.length, perPage, page, (p) => {
      page = p;
      render();
    });
  }

  // INITIAL LOAD
  loadSuppliers();
}


/* ============================================================
   SYSTEM QUERIES
============================================================ */

async function initQueries() {
  const select = document.getElementById("query-select");
  const btn = document.getElementById("run-query-btn");
  if (!select || !btn) return;

  const tableHead = document.querySelector("#query-results-table thead");
  const tableBody = document.querySelector("#query-results-table tbody");

  async function runQuery() {
    const q = select.value;
    let endpoint = "";

    if (q === "products_suppliers") endpoint = "/query/products-suppliers";
    if (q === "orders_status") endpoint = "/query/orders-status";
    if (q === "suppliers_stock") endpoint = "/query/suppliers-stock";
    if (q === "orders_by_customer") endpoint = "/query/orders-by-customer";
    if (q === "sales_by_product") endpoint = "/query/sales-by-product";

    if (!endpoint) return;

    tableHead.innerHTML = "";
    tableBody.innerHTML = "<tr><td>Loading...</td></tr>";

    try {
      const rows = await apiGet(endpoint);

      if (!rows || rows.length === 0) {
        tableBody.innerHTML = "<tr><td>No results found.</td></tr>";
        return;
      }

      const headers = Object.keys(rows[0]);

      tableHead.innerHTML = `
        <tr>
          ${headers.map(h => `<th>${h}</th>`).join("")}
        </tr>
      `;

      tableBody.innerHTML = rows
        .map(r => `
          <tr>
            ${headers.map(h => `<td>${r[h]}</td>`).join("")}
          </tr>
        `)
        .join("");

    } catch (err) {
      tableBody.innerHTML = `<tr><td>Error: ${err.message}</td></tr>`;
    }
  }

  btn.addEventListener("click", runQuery);
}

/* ============================================================
   REPORTS DASHBOARD
============================================================ */

async function initReports() {
  // Check page
  const totalProducts = document.getElementById("rep-total-products");
  if (!totalProducts) return;

  const totalCustomers = document.getElementById("rep-total-customers");
  const totalOrders = document.getElementById("rep-total-orders");
  const lowStockCount = document.getElementById("rep-low-stock-count");

  const lowStockTableHead = document.querySelector("#rep-low-stock-table thead");
  const lowStockTableBody = document.querySelector("#rep-low-stock-table tbody");

  // Load counters
  try {
    const products = await apiGet("/products");
    const customers = await apiGet("/customers");
    const orders = await apiGet("/orders");
    const lowStock = await apiGet("/query/low_stock"); // must exist

    totalProducts.textContent = products.length;
    totalCustomers.textContent = customers.length;
    totalOrders.textContent = orders.length;
    lowStockCount.textContent = lowStock.length;

    // Populate low stock table
    if (lowStock.length > 0) {
      const headers = Object.keys(lowStock[0]);

      lowStockTableHead.innerHTML = `
        <tr>${headers.map(h => `<th>${h}</th>`).join("")}</tr>
      `;

      lowStockTableBody.innerHTML = lowStock
        .map(row =>
          `<tr>${headers.map(h => `<td>${row[h]}</td>`).join("")}</tr>`
        )
        .join("");
    } else {
      lowStockTableBody.innerHTML = "<tr><td>No low stock products.</td></tr>";
    }

  } catch (e) {
    console.error("Error loading summary:", e);
  }

  // Load Stock Distribution chart
  try {
    const stockData = await apiGet("/query/suppliers-stock");

    new Chart(
      document.getElementById("rep-stock-chart"),
      {
        type: "pie",
        data: {
          labels: stockData.map(r => r.supplier),
          datasets: [{
            data: stockData.map(r => r.total_stock)
          }]
        }
      }
    );
  } catch (e) {
    console.error("Stock chart error:", e);
  }

  // Load Orders per Month chart
  try {
    const ordersMonth = await apiGet("/query/orders-by-month"); // create below

    new Chart(
      document.getElementById("rep-orders-chart"),
      {
        type: "bar",
        data: {
          labels: ordersMonth.map(r => r.month),
          datasets: [{
            label: "Orders",
            data: ordersMonth.map(r => r.total),
          }]
        }
      }
    );
  } catch (e) {
    console.error("Orders chart error:", e);
  }
}


/* ============================================================
   PRODUCTS — CRUD COMPLETE
============================================================ */

async function initProducts() {
  const tbody = document.querySelector("#products-table tbody");
  if (!tbody) return;

  const pagUl = document.getElementById("products-pagination");
  const newBtn = document.getElementById("pr-new-btn");

  // Modal elements
  const modal = new bootstrap.Modal(document.getElementById("pr-modal"));
  const form = document.getElementById("pr-form");
  const title = document.getElementById("pr-modal-title");
  const idField = document.getElementById("pr-id");
  const brandField = document.getElementById("pr-brand");
  const modelField = document.getElementById("pr-model");
  const sizeField = document.getElementById("pr-size");
  const priceField = document.getElementById("pr-price");
  const stockField = document.getElementById("pr-stock");
  const supplierField = document.getElementById("pr-supplier");

  let rows = [];
  let suppliers = [];
  let page = 1;
  const perPage = 20;

  async function loadSuppliers() {
    suppliers = await apiGet("/suppliers");
    supplierField.innerHTML = "";
    suppliers.forEach(s => {
      const opt = document.createElement("option");
      opt.value = s.supplier_id;
      opt.textContent = `${s.supplier_id} — ${s.name}`;
      supplierField.appendChild(opt);
    });
  }

  function openCreateModal() {
    idField.value = "";
    brandField.value = "";
    modelField.value = "";
    sizeField.value = "";
    priceField.value = "";
    stockField.value = "";

    title.textContent = "New Product";
    modal.show();
  }

  function openEditModal(p) {
    idField.value = p.product_id;
    brandField.value = p.brand;
    modelField.value = p.model;
    sizeField.value = p.size;
    priceField.value = p.price;
    stockField.value = p.stock;
    supplierField.value = p.supplier_id;

    title.textContent = "Edit Product";
    modal.show();
  }

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const payload = {
      brand: brandField.value.trim(),
      model: modelField.value.trim(),
      size: parseInt(sizeField.value),
      price: parseFloat(priceField.value),
      stock: parseInt(stockField.value),
      supplier_id: parseInt(supplierField.value)
    };

    try {
      if (idField.value) {
        await apiPut(`/product/${idField.value}`, payload);
      } else {
        await apiPost("/products", payload);
      }

      modal.hide();
      loadProducts();

    } catch (err) {
      alert(err.message);
    }
  });

  newBtn.onclick = openCreateModal;

  async function loadProducts() {
    try {
      rows = await apiGet("/products");
      render();
    } catch (e) {
      console.error(e);
    }
  }

  function render() {
    const start = (page - 1) * perPage;
    const slice = rows.slice(start, start + perPage);

    tbody.innerHTML = "";
    slice.forEach(p => {
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${p.product_id}</td>
        <td>${p.brand}</td>
        <td>${p.model}</td>
        <td>${p.size}</td>
        <td>${p.price}</td>
        <td>${p.stock}</td>
        <td>${p.supplier_id}</td>
      `;

      const actions = document.createElement("td");

      const editBtn = document.createElement("button");
      editBtn.className = "btn btn-sm btn-outline-primary me-2";
      editBtn.textContent = "Edit";
      editBtn.onclick = () => openEditModal(p);

      const delBtn = document.createElement("button");
      delBtn.className = "btn btn-sm btn-outline-danger";
      delBtn.textContent = "Delete";
      delBtn.onclick = async () => {
        if (!confirm("Delete this product?")) return;
        try {
          await apiDelete(`/product/${p.product_id}`);
          loadProducts();
        } catch (err) {
          alert(err.message);
        }
      };

      actions.appendChild(editBtn);
      actions.appendChild(delBtn);
      tr.appendChild(actions);

      tbody.appendChild(tr);
    });

    renderPagination(pagUl, rows.length, perPage, page, p => {
      page = p;
      render();
    });
  }

  await loadSuppliers();
  loadProducts();
}


/* ============================================================
   CUSTOMERS — CRUD COMPLETE
============================================================ */

async function initCustomers() {
  const tbody = document.querySelector("#customers-table tbody");
  if (!tbody) return;

  const pagUl = document.getElementById("customers-pagination");
  const newBtn = document.getElementById("cu-new-btn");

  // Modal components
  const modal = new bootstrap.Modal(document.getElementById("cu-modal"));
  const form = document.getElementById("cu-form");
  const title = document.getElementById("cu-modal-title");

  const idField = document.getElementById("cu-id");
  const nameField = document.getElementById("cu-name");
  const emailField = document.getElementById("cu-email");
  const addressField = document.getElementById("cu-address");

  let rows = [];
  let page = 1;
  const perPage = 20;

  function openCreateModal() {
    idField.value = "";
    nameField.value = "";
    emailField.value = "";
    addressField.value = "";
    title.textContent = "New Customer";
    modal.show();
  }

  function openEditModal(c) {
    idField.value = c.customer_id;
    nameField.value = c.name;
    emailField.value = c.email;
    addressField.value = c.address;
    title.textContent = "Edit Customer";
    modal.show();
  }

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const payload = {
      name: nameField.value.trim(),
      email: emailField.value.trim(),
      address: addressField.value.trim()
    };

    try {
      if (idField.value) {
        await apiPut(`/customer/${idField.value}`, payload);
      } else {
        await apiPost("/customers", payload);
      }

      modal.hide();
      loadCustomers();

    } catch (err) {
      alert(err.message);
    }
  });

  newBtn.onclick = openCreateModal;

  async function loadCustomers() {
    try {
      rows = await apiGet("/customers");
      render();
    } catch (e) {
      console.error(e);
    }
  }

  function render() {
    const start = (page - 1) * perPage;
    const slice = rows.slice(start, start + perPage);

    tbody.innerHTML = "";
    slice.forEach(c => {
      const tr = document.createElement("tr");

      tr.innerHTML = `
        <td>${c.customer_id}</td>
        <td>${c.name}</td>
        <td>${c.email}</td>
        <td>${c.address}</td>
      `;

      const actions = document.createElement("td");

      const editBtn = document.createElement("button");
      editBtn.className = "btn btn-sm btn-outline-primary me-2";
      editBtn.textContent = "Edit";
      editBtn.onclick = () => openEditModal(c);

      const delBtn = document.createElement("button");
      delBtn.className = "btn btn-sm btn-outline-danger";
      delBtn.textContent = "Delete";
      delBtn.onclick = async () => {
        if (!confirm("Delete this customer?")) return;

        try {
          await apiDelete(`/customer/${c.customer_id}`);
          loadCustomers();
        } catch (err) {
          alert(err.message);
        }
      };

      actions.appendChild(editBtn);
      actions.appendChild(delBtn);
      tr.appendChild(actions);

      tbody.appendChild(tr);
    });

    renderPagination(pagUl, rows.length, perPage, page, p => {
      page = p;
      render();
    });
  }

  loadCustomers();
}


/* ============================================================
   ORDERS LIST (with Status Sorting)
============================================================ */

async function initOrders() {
  const tableBody = document.querySelector("#orders-table tbody");
  if (!tableBody) return;

  const pagUl = document.getElementById("orders-pagination");
  const perPage = 20;
  let page = 1;
  let rows = [];

  // Sorting State
  let statusAscending = true;
  const sortBtn = document.getElementById("orders-sort-btn");

  // Shipment status mapping
  const statusOrder = {
    "Pending": 1,
    "In Transit": 2,
    "Delivered": 3,
    "No shipment": 99
  };

  // Sorting function
  function sortOrders() {
    rows.sort((a, b) => {
      const A = statusOrder[a.shipment_status] ?? 99;
      const B = statusOrder[b.shipment_status] ?? 99;

      return statusAscending ? (A - B) : (B - A);
    });
  }

  // Handle button click
  if (sortBtn) {
    sortBtn.onclick = () => {
      statusAscending = !statusAscending;

      sortBtn.textContent = statusAscending
        ? "Sort by Status (Asc)"
        : "Sort by Status (Desc)";

      sortOrders();
      page = 1;
      render();
    };
  }

  // Render table
  function render() {
    sortOrders(); // ← ALWAYS SORT BEFORE RENDERING

    const start = (page - 1) * perPage;
    const slice = rows.slice(start, start + perPage);
    tableBody.innerHTML = "";

    slice.forEach(r => {
      const tr = document.createElement("tr");

      const statusLabel = r.shipment_status || "No shipment";
      const canDelete = r.shipment_status === "Pending";

      tr.innerHTML = `
        <td>${r.order_id}</td>
        <td>${r.customer_id}</td>
        <td>${r.order_date}</td>
      `;

      // STATUS cell
      const tdStatus = document.createElement("td");
      tdStatus.appendChild(statusBadge(statusLabel));
      tr.appendChild(tdStatus);

      // ACTIONS cell
      const tdActions = document.createElement("td");

      const editBtn = document.createElement("a");
      editBtn.href = `/gui/orders/${r.order_id}/edit`;
      editBtn.className = "btn btn-sm btn-outline-primary me-2";
      editBtn.textContent = "Edit";

      const delBtn = document.createElement("button");
      delBtn.className = "btn btn-sm btn-outline-danger";
      delBtn.textContent = "Delete";
      delBtn.disabled = !canDelete;

      delBtn.addEventListener("click", async () => {
        if (!confirm("Delete this order?")) return;
        try {
          await apiDelete(`/order/${r.order_id}`);
          rows = rows.filter(x => x.order_id !== r.order_id);
          render();
        } catch (err) {
          alert(err.message);
        }
      });

      tdActions.appendChild(editBtn);
      tdActions.appendChild(delBtn);
      tr.appendChild(tdActions);

      tableBody.appendChild(tr);
    });

    // Pagination
    renderPagination(pagUl, rows.length, perPage, page, p => {
      page = p;
      render();
    });
  }

  // Load data
  try {
    rows = await apiGet("/orders");
    render();
  } catch (e) {
    console.error(e);
  }
}


/* ============================================================
   ORDER DETAILS
============================================================ */

async function initOrderDetails() {
  const tbody = document.querySelector("#od-table tbody");
  if (!tbody) return;

  const pagUl = document.getElementById("od-pagination");
  const perPage = 20;
  let page = 1;
  let rows = [];

  function render() {
    const start = (page - 1) * perPage;
    const slice = rows.slice(start, start + perPage);

    tbody.innerHTML = "";
    slice.forEach(r => {
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${r.order_id}</td>
        <td>${r.product_id}</td>
        <td>${r.quantity}</td>
      `;
      tbody.appendChild(tr);
    });

    renderPagination(pagUl, rows.length, perPage, page, p => {
      page = p;
      render();
    });
  }

  try {
    rows = await apiGet("/orderdetails");
    render();
  } catch (e) {
    console.error(e);
  }
}

/* ============================================================
   SHIPMENTS
============================================================ */

async function initShipments() {
  const tbody = document.querySelector("#sh-table tbody");
  if (!tbody) return;

  const pagUl = document.getElementById("sh-pagination");
  const toggleBtn = document.getElementById("sh-toggle-sort");

  let rows = [];
  let page = 1;
  const perPage = 20;
  let asc = true;

  const orderAsc = {"Pending": 1, "In Transit": 2, "Delivered": 3};
  const orderDesc = {"Pending": 3, "In Transit": 2, "Delivered": 1};

  function sortRows() {
    const map = asc ? orderAsc : orderDesc;
    rows.sort((a, b) => (map[a.status] || 99) - (map[b.status] || 99));
  }

  function render() {
    sortRows();
    const start = (page - 1) * perPage;
    const slice = rows.slice(start, start + perPage);

    tbody.innerHTML = "";
    slice.forEach(r => {
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${r.shipment_id}</td>
        <td>${r.order_id}</td>
        <td>${r.courier}</td>
      `;

      const tdStatus = document.createElement("td");
      tdStatus.appendChild(statusBadge(r.status));
      tr.appendChild(tdStatus);

      const tdActions = document.createElement("td");
      const btn = document.createElement("button");
      btn.className = "btn btn-sm btn-outline-primary";
      btn.textContent = "Edit";
      btn.onclick = () => openShipmentModal(r);
      tdActions.appendChild(btn);

      tr.appendChild(tdActions);
      tbody.appendChild(tr);
    });

    renderPagination(pagUl, rows.length, perPage, page, p => {
      page = p;
      render();
    });
  }

  let modal, form, idField, courierField, statusField;

  function setupModal() {
    modal = new bootstrap.Modal(document.getElementById("sh-edit-modal"));
    form = document.getElementById("sh-edit-form");
    idField = document.getElementById("sh-edit-id");
    courierField = document.getElementById("sh-edit-courier");
    statusField = document.getElementById("sh-edit-status");

    form.addEventListener("submit", async e => {
      e.preventDefault();
      try {
        await apiPut(`/shipment/${idField.value}`, {
          courier: courierField.value,
          status: statusField.value
        });

        const idx = rows.findIndex(r => r.shipment_id == idField.value);
        if (idx >= 0) {
          rows[idx].courier = courierField.value;
          rows[idx].status = statusField.value;
        }

        modal.hide();
        render();
      } catch (err) {
        alert(err.message);
      }
    });
  }

  function openShipmentModal(row) {
    if (!modal) setupModal();
    idField.value = row.shipment_id;
    courierField.value = row.courier;
    statusField.value = row.status;
    modal.show();
  }

  toggleBtn.onclick = () => {
    asc = !asc;
    toggleBtn.textContent = asc ? "Sort by status (asc)" : "Sort by status (desc)";
    render();
  };

  try {
    rows = await apiGet("/shipments");
    render();
  } catch (e) {
    console.error(e);
  }
}

/* ============================================================
   CREATE ORDER — (ya confirmado funcional)
============================================================ */

async function initCreateOrder() {
  const nameInput = document.getElementById("co-customer-name");
  if (!nameInput) return;

  const emailInput = document.getElementById("co-customer-email");
  const addrInput = document.getElementById("co-customer-address");
  const idInput = document.getElementById("co-customer-id");

  const searchBtn = document.getElementById("co-search-customer");
  const dateInput = document.getElementById("co-order-date");
  const productSelect = document.getElementById("co-product-select");
  const qtyInput = document.getElementById("co-product-qty");
  const addBtn = document.getElementById("co-add-to-cart");
  const cartTableBody = document.querySelector("#co-cart-table tbody");
  const totalCell = document.getElementById("co-cart-total");
  const createBtn = document.getElementById("co-create-order");
  const msgDiv = document.getElementById("co-message");

  dateInput.valueAsNumber = Date.now() - (new Date().getTimezoneOffset() * 60000);

  let products = [];
  let cart = [];

  function renderCart() {
    cartTableBody.innerHTML = "";
    let total = 0;

    cart.forEach((item, idx) => {
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${item.label}</td>
        <td>${item.size}</td>
        <td>${item.price}</td>
        <td>${item.stock}</td>
        <td>${item.quantity}</td>
        <td>${(item.quantity * item.price).toFixed(2)}</td>
        <td><button class="btn btn-sm btn-danger" data-i="${idx}">Remove</button></td>
      `;
      cartTableBody.appendChild(tr);

      total += item.quantity * item.price;
    });

    totalCell.textContent = total.toFixed(2);

    cartTableBody.querySelectorAll("button[data-i]").forEach(btn => {
      btn.onclick = e => {
        cart.splice(e.target.dataset.i, 1);
        renderCart();
      };
    });
  }

  try {
    products = await apiGet("/products");
    products.forEach(p => {
      const opt = document.createElement("option");
      opt.value = p.product_id;
      opt.textContent = `${p.brand} - ${p.model} (size ${p.size}) $${p.price}`;
      opt.dataset.size = p.size;
      opt.dataset.price = p.price;
      opt.dataset.stock = p.stock;
      productSelect.appendChild(opt);
    });
  } catch (e) {
    console.error(e);
    msgDiv.textContent = "Could not load products.";
  }

  searchBtn.onclick = async () => {
    const name = nameInput.value.trim();
    if (!name) return;

    try {
      const data = await apiGet(`/customer/search?name=${encodeURIComponent(name)}`);
      if (data.found) {
        idInput.value = data.customer_id;
        emailInput.value = data.email;
        addrInput.value = data.address;
        emailInput.disabled = true;
        addrInput.disabled = true;
        msgDiv.textContent = "Existing customer loaded.";
      } else {
        idInput.value = "";
        emailInput.value = "";
        addrInput.value = "";
        emailInput.disabled = false;
        addrInput.disabled = false;
        msgDiv.textContent = "New customer. Enter details.";
      }
    } catch (e) {
      msgDiv.textContent = "Error searching customer.";
    }
  };

  addBtn.onclick = () => {
    const pid = parseInt(productSelect.value);
    const qty = parseInt(qtyInput.value);
    if (!pid || qty <= 0) return;

    const opt = productSelect.selectedOptions[0];
    const size = parseInt(opt.dataset.size);
    const stock = parseInt(opt.dataset.stock);
    const price = parseFloat(opt.dataset.price);

    if (qty > stock) {
      msgDiv.textContent = "Not enough stock.";
      return;
    }

    cart.push({
      product_id: pid,
      label: opt.textContent,
      size,
      price,
      stock,
      quantity: qty
    });

    renderCart();
  };

  createBtn.onclick = async () => {
    if (!cart.length) {
      msgDiv.textContent = "Cart is empty.";
      return;
    }

    try {
      const res = await apiPost("/orders/full", {
        customer: {
          existing_customer_id: idInput.value || null,
          name: nameInput.value.trim(),
          email: emailInput.value.trim(),
          address: addrInput.value.trim()
        },
        order: { order_date: dateInput.value },
        items: cart.map(c => ({ product_id: c.product_id, quantity: c.quantity }))
      });

      msgDiv.textContent = `Order created (ID ${res.order_id})`;
      cart = [];
      renderCart();
    } catch (e) {
      msgDiv.textContent = "Error creating order.";
    }
  };
}

/* ============================================================
   DASHBOARD COUNTERS
============================================================ */

async function initDashboard() {

  const supCount = document.getElementById("dash-suppliers-count");
  if (!supCount) return;   // ← dashboard no está en esta página

  const prodCount = document.getElementById("dash-products-count");
  const custCount = document.getElementById("dash-customers-count");
  const pendingCount = document.getElementById("dash-pending-shipments");

  try {
    // GET ALL DATA
    const suppliers = await apiGet("/suppliers");
    const products = await apiGet("/products");
    const customers = await apiGet("/customers");
    const shipments = await apiGet("/shipments");

    // Update counts
    supCount.textContent = suppliers.length;
    prodCount.textContent = products.length;
    custCount.textContent = customers.length;

    const pending = shipments.filter(s => s.status === "Pending");
    pendingCount.textContent = pending.length;

  } catch (e) {
    console.error("Dashboard error:", e);
  }
}

/* ============================================================
   EDIT ORDER
============================================================ */

async function initEditOrder() {
  const orderIdInput = document.getElementById("eo-order-id");
  if (!orderIdInput) return;

  const order_id = parseInt(orderIdInput.value);

  const nameInput = document.getElementById("eo-customer-name");
  const emailInput = document.getElementById("eo-customer-email");
  const addrInput = document.getElementById("eo-customer-address");
  const cidInput = document.getElementById("eo-customer-id");
  const dateInput = document.getElementById("eo-order-date");
  const badge = document.getElementById("eo-shipment-badge");

  const productSelect = document.getElementById("eo-product-select");
  const qtyInput = document.getElementById("eo-product-qty");
  const addBtn = document.getElementById("eo-add-to-cart");
  const cartBody = document.querySelector("#eo-cart-table tbody");
  const saveBtn = document.getElementById("eo-save-order");
  const cancelBtn = document.getElementById("eo-cancel-order");
  const msgDiv = document.getElementById("eo-message");

  let products = [];
  let cart = [];
  let shipmentStatus = null;

  function showMessage(text, error = false) {
    msgDiv.textContent = text;
    msgDiv.className = error ? "text-danger" : "text-success";
  }

  function renderCart() {
    cartBody.innerHTML = "";
    cart.forEach((item, idx) => {
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${item.label}</td>
        <td>${item.size}</td>
        <td>${item.price}</td>
        <td>${item.quantity}</td>
        <td>${(item.price * item.quantity).toFixed(2)}</td>
        <td><button class="btn btn-sm btn-danger" data-i="${idx}">Remove</button></td>
      `;
      cartBody.appendChild(tr);
    });

    cartBody.querySelectorAll("button[data-i]").forEach(btn => {
      btn.onclick = e => {
        cart.splice(btn.dataset.i, 1);
        renderCart();
      };
    });
  }

  function updateBadge(status) {
    shipmentStatus = status;
    const b = statusBadge(status);
    badge.className = b.className;
    badge.textContent = b.textContent;
  }

  // Load data
  try {
    products = await apiGet("/products");
    products.forEach(p => {
      const opt = document.createElement("option");
      opt.value = p.product_id;
      opt.textContent = `${p.brand} - ${p.model} (size ${p.size})`;
      opt.dataset.size = p.size;
      opt.dataset.price = p.price;
      productSelect.appendChild(opt);
    });

    const full = await apiGet(`/order/${order_id}/full`);

    cidInput.value = full.customer.customer_id;
    nameInput.value = full.customer.name;
    emailInput.value = full.customer.email;
    addrInput.value = full.customer.address;
    dateInput.value = full.order_date;

    if (full.shipment) updateBadge(full.shipment.status);

    cart = full.items.map(it => {
      const p = products.find(x => x.product_id === it.product_id);
      return {
        product_id: it.product_id,
        label: `${p.brand} - ${p.model}`,
        size: p.size,
        price: p.price,
        quantity: it.quantity
      };
    });

    renderCart();

  } catch (e) {
    showMessage("Error loading order", true);
  }

  addBtn.onclick = () => {
    const pid = parseInt(productSelect.value);
    const qty = parseInt(qtyInput.value);
    if (!pid || qty <= 0) return;

    const opt = productSelect.selectedOptions[0];
    cart.push({
      product_id: pid,
      label: opt.textContent,
      size: opt.dataset.size,
      price: parseFloat(opt.dataset.price),
      quantity: qty
    });

    renderCart();
  };

  saveBtn.onclick = async () => {
    try {
      await apiPut(`/order/${order_id}/full`, {
        customer: {
          customer_id: cidInput.value,
          name: nameInput.value,
          email: emailInput.value,
          address: addrInput.value
        },
        order: { order_date: dateInput.value },
        items: cart.map(c => ({
          product_id: c.product_id,
          quantity: c.quantity
        }))
      });

      showMessage("Order updated successfully");
    } catch (e) {
      showMessage("Error updating order", true);
    }
  };

  cancelBtn.onclick = async () => {
    if (shipmentStatus !== "Pending") {
      alert("Cannot cancel — shipment not pending.");
      return;
    }

    if (!confirm("Cancel this order?")) return;

    try {
      await apiDelete(`/order/${order_id}`);
      window.location.href = "/gui/orders";
    } catch (e) {
      alert(e.message);
    }
  };
}

/* ============================================================
   INITIALIZER
============================================================ */

document.addEventListener("DOMContentLoaded", () => {
  initSuppliers();
  initProducts();
  initCustomers();
  initOrders();
  initOrderDetails();
  initShipments();
  initCreateOrder();
  initEditOrder();
  initQueries();
  initReports();
  initDashboard();
});
