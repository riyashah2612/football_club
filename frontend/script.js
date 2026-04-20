// API base URL - automatically detects if using Live Server (port 5501) or XAMPP
// If using Live Server, PHP must run on XAMPP, so use absolute URL
// If using XAMPP directly, use relative path
const API_BASE = (window.location.port === '5501' || window.location.port === '5500') 
  ? "http://localhost/football-club/backend" 
  : "../backend";

const tableSchemas = {
  clubs: {
    columns: [
      { key: "Club_ID", label: "Club ID", required: true },
      { key: "Club_Name", label: "Club Name", required: true },
      { key: "City", label: "City" },
    ],
    defaultSort: "Club_ID",
    filters: [{ key: "City", label: "City" }],
  },
  coach: {
    columns: [
      { key: "Coach_ID", label: "Coach ID", required: true },
      { key: "Coach_Name", label: "Coach Name", required: true },
      { key: "Years_of_experience", label: "Years of Experience" },
      { key: "Salary", label: "Salary" },
      { key: "Coach_PhoneNumber", label: "Phone Number" },
      { key: "Club_ID", label: "Club ID" },
    ],
    defaultSort: "Coach_ID",
    filters: [
      { key: "Club_ID", label: "Club" },
      { key: "Coach_Name", label: "Coach Name" },
    ],
  },
  employee: {
    columns: [
      { key: "Emp_ID", label: "Employee ID", required: true },
      { key: "Emp_Name", label: "Employee Name", required: true },
      { key: "Emp_Salary", label: "Salary" },
      { key: "Emp_Dept", label: "Department" },
      { key: "Emp_PhoneNumber", label: "Phone Number" },
    ],
    defaultSort: "Emp_ID",
    filters: [
      { key: "Emp_Dept", label: "Department" },
    ],
  },
  matches: {
    columns: [
      { key: "Match_ID", label: "Match ID", required: true },
      { key: "Date", label: "Date", type: "date" },
      { key: "Time", label: "Time" },
      { key: "Home_Team", label: "Home Team", required: true },
      { key: "Away_Team", label: "Away Team", required: true },
      { key: "Result", label: "Result" },
      { key: "Venue_ID", label: "Venue ID" },
    ],
    defaultSort: "Date",
    filters: [
      { key: "Venue_ID", label: "Venue" },
      { key: "Date", label: "Date" },
    ],
  },
  players: {
    columns: [
      { key: "Player_ID", label: "Player ID", required: true },
      { key: "Player_Name", label: "Player Name", required: true },
      { key: "Player_DOB", label: "Date of Birth", type: "date" },
      { key: "Gender", label: "Gender" },
      { key: "Height_in_cm", label: "Height (cm)" },
      { key: "Weight_in_kg", label: "Weight (kg)" },
      { key: "No_of_Matches", label: "No. of Matches" },
      { key: "Player_PhoneNumber", label: "Phone Number" },
      { key: "Club_ID", label: "Club ID" },
    ],
    defaultSort: "Player_ID",
    filters: [
      { key: "Gender", label: "Gender" },
      { key: "Club_ID", label: "Club" },
    ],
  },
  training_session: {
    columns: [
      { key: "TS_ID", label: "Session ID", required: true },
      { key: "TS_Date", label: "Date", type: "date" },
      { key: "TS_Time", label: "Time" },
      { key: "Duration", label: "Duration" },
      { key: "Type", label: "Type" },
      { key: "Gear", label: "Gear" },
      { key: "Coach_ID", label: "Coach ID" },
      { key: "Venue_ID", label: "Venue ID" },
    ],
    defaultSort: "TS_Date",
    filters: [
      { key: "Coach_ID", label: "Coach" },
      { key: "Venue_ID", label: "Venue" },
    ],
  },
  venue: {
    columns: [
      { key: "Venue_ID", label: "Venue ID", required: true },
      { key: "Venue_Name", label: "Venue Name", required: true },
      { key: "Venue_Location", label: "Location" },
    ],
    defaultSort: "Venue_ID",
    filters: [{ key: "Venue_Location", label: "Location" }],
  },
};

function fetchJSON(url, options = {}) {
  return fetch(url, {
    headers: {
      "Content-Type": "application/json",
    },
    ...options,
  }).then(async (response) => {
    const contentType = response.headers.get("content-type") || "";
    const isJson = contentType.includes("application/json");
    
    const text = await response.text();
    
    // Check if response looks like HTML (common for 404 or PHP errors)
    if (text.trim().startsWith('<!DOCTYPE') || text.trim().startsWith('<html') || text.trim().startsWith('<?php')) {
      console.error("Received HTML instead of JSON. URL might be incorrect or PHP error occurred.");
      console.error("Response preview:", text.substring(0, 500));
      throw new Error("Server returned HTML instead of JSON. Check if the API endpoint is correct and PHP is running.");
    }
    
    let payload;
    try {
      // Try to parse as JSON regardless of content-type (PHP might not set it correctly)
      const trimmedText = text.trim();
      if (trimmedText.startsWith('{') || trimmedText.startsWith('[')) {
        payload = JSON.parse(trimmedText);
      } else if (isJson) {
        // Content-type says JSON but doesn't start with { or [
        payload = JSON.parse(trimmedText);
      } else {
        // Not JSON, return as text
        payload = text;
      }
    } catch (parseError) {
      console.error("JSON parse error:", parseError);
      console.error("Response text:", text.substring(0, 500)); // Log first 500 chars
      console.error("Full URL:", url);
      throw new Error("Failed to parse JSON response: " + parseError.message + ". Response might be HTML or invalid JSON.");
    }

    if (!response.ok) {
      // If payload is an error object with a message, use it
      if (payload && typeof payload === 'object' && payload.message) {
        throw new Error(payload.message);
      }
      const message = payload?.message || response.statusText || "Request failed";
      throw new Error(typeof payload === "string" ? payload : message);
    }

    // If response is OK but contains an error object, throw it
    if (payload && typeof payload === 'object' && !Array.isArray(payload) && payload.success === false) {
      throw new Error(payload.message || "Server returned an error");
    }

    return payload;
  });
}

function selectSchema(table) {
  return tableSchemas[table] || null;
}

function getQueryParams(element) {
  if (!element) return {};
  const { table, include } = element.dataset;
  return {
    table,
    include: include ? include.split(",") : [],
  };
}

function renderTableHead(tableEl, schema) {
  const thead = tableEl.querySelector("thead");
  thead.innerHTML = "";
  const row = document.createElement("tr");
  schema.columns.forEach((col) => {
    const th = document.createElement("th");
    th.textContent = col.label;
    row.appendChild(th);
  });
  thead.appendChild(row);
}

function renderTableBody(tableEl, schema, records) {
  const tbody = tableEl.querySelector("tbody");
  tbody.innerHTML = "";

  // Ensure records is an array
  if (!Array.isArray(records)) {
    const emptyRow = document.createElement("tr");
    const td = document.createElement("td");
    td.colSpan = schema.columns.length;
    td.innerHTML = `<div class="empty-state">No records found.</div>`;
    emptyRow.appendChild(td);
    tbody.appendChild(emptyRow);
    return;
  }

  if (!records.length) {
    const emptyRow = document.createElement("tr");
    const td = document.createElement("td");
    td.colSpan = schema.columns.length;
    td.innerHTML = `<div class="empty-state">No records found.</div>`;
    emptyRow.appendChild(td);
    tbody.appendChild(emptyRow);
    return;
  }

  records.forEach((record) => {
    const row = document.createElement("tr");
    schema.columns.forEach((column) => {
      const cell = document.createElement("td");
      let value = record[column.key] ?? "";
      if (column.type === "date" && value) {
        value = value.split("T")[0];
      }
      cell.textContent = value;
      row.appendChild(cell);
    });
    tbody.appendChild(row);
  });
}

async function loadTable(tableEl, tableName) {
  const schema = selectSchema(tableName);
  if (!schema) return;

  renderTableHead(tableEl, schema);
  setLoadingState(tableEl, true);

  try {
    const url = `${API_BASE}/fetch_data.php?table=${tableName}`;
    console.log(`Loading table "${tableName}" from:`, url);
    
    const data = await fetchJSON(url);
    console.log(`Response for "${tableName}":`, data, `Type: ${typeof data}`, `Is Array: ${Array.isArray(data)}`);
    
    setLoadingState(tableEl, false);
    
    // Handle error objects that might come through as 200 OK
    if (data && typeof data === 'object' && !Array.isArray(data)) {
      if (data.success === false && data.message) {
        console.error("Error object received:", data);
        setLoadingState(tableEl, false, data.message);
        return;
      }
    }
    
    // Ensure data is an array before rendering
    if (!Array.isArray(data)) {
      console.error("Invalid data format received:", data, typeof data);
      console.error("Full response:", JSON.stringify(data, null, 2));
      setLoadingState(
        tableEl,
        false,
        `Invalid data format: Expected array, got ${typeof data}. Check browser console (F12) for details.`
      );
      return;
    }
    renderTableBody(tableEl, schema, data);
  } catch (error) {
    console.error(`Error loading table "${tableName}":`, error);
    setLoadingState(tableEl, false, error.message);
  }
}

function setLoadingState(tableEl, isLoading, errorMessage) {
  const tbody = tableEl.querySelector("tbody");
  tbody.innerHTML = "";
  const row = document.createElement("tr");
  const td = document.createElement("td");
  td.colSpan = tableEl.querySelectorAll("thead th").length || 1;
  td.innerHTML = `<div class="${isLoading ? "table-loading" : "status-message error"}">${
    isLoading ? "Loading data..." : errorMessage || "Error loading data."
  }</div>`;
  row.appendChild(td);
  tbody.appendChild(row);
}

function buildFilterOptions(filterConfig, data) {
  const options = new Set();
  if (!Array.isArray(data)) {
    return [];
  }
  data.forEach((record) => {
    const value = record[filterConfig.key];
    if (value !== undefined && value !== null && value !== "") {
      options.add(value);
    }
  });
  return Array.from(options).sort();
}

function initSearchFilter(tableEl, tableName, container) {
  const schema = selectSchema(tableName);
  if (!schema || !container) return;

  if (
    container.dataset.listenersBound === "true" &&
    container.dataset.boundTable === tableName
  ) {
    return;
  }

  container.dataset.listenersBound = "true";
  container.dataset.boundTable = tableName;

  const searchInput = container.querySelector('[data-role="search-input"]');
  const filterSelect = container.querySelector('[data-role="filter-select"]');
  const filterValuesSelect = container.querySelector('[data-role="filter-value"]');
  const searchForm = container.querySelector('[data-role="search-form"]');
  const columnSelect = container.querySelector('[data-role="column-select"]');

  if (!searchInput || !searchForm) return;

  if (columnSelect && !columnSelect.children.length) {
    schema.columns.forEach((column) => {
      const option = document.createElement("option");
      option.value = column.key;
      option.textContent = column.label;
      columnSelect.appendChild(option);
    });
  }

  if (filterSelect && !filterSelect.dataset.initialised) {
    filterSelect.innerHTML = `<option value="">No filter</option>`;
    (schema.filters || []).forEach((filter) => {
      const option = document.createElement("option");
      option.value = filter.key;
      option.textContent = filter.label;
      filterSelect.appendChild(option);
    });
    filterSelect.dataset.initialised = "true";
  }

  let cachedData = [];

  const refreshFilters = () => {
    if (!filterSelect || !schema.filters || !filterValuesSelect) return;
    const activeFilterKey = filterSelect.value;
    filterValuesSelect.innerHTML = `<option value="">All</option>`;
    if (!activeFilterKey) return;
    const filterConfig = schema.filters.find((f) => f.key === activeFilterKey);
    if (!filterConfig) return;
    const options = buildFilterOptions(filterConfig, cachedData);
    filterValuesSelect.innerHTML = `<option value="">All ${filterConfig.label}</option>`;
    options.forEach((value) => {
      const option = document.createElement("option");
      option.value = value;
      option.textContent = value;
      filterValuesSelect.appendChild(option);
    });
  };

  const applyLocalFilter = () => {
    const keyword = searchInput.value.toLowerCase().trim();
    const activeFilterKey = filterSelect?.value || "";
    const filterValue = filterValuesSelect?.value?.toLowerCase() || "";

    const rows = tableEl.querySelectorAll("tbody tr");
    rows.forEach((row) => {
      const rowText = row.innerText.toLowerCase();
      const matchKeyword = !keyword || rowText.includes(keyword);
      let matchFilter = true;
      if (activeFilterKey && filterValue) {
        const cellIndex = schema.columns.findIndex((col) => col.key === activeFilterKey);
        if (cellIndex >= 0) {
          const cellText = (row.children[cellIndex].textContent || "").toLowerCase();
          matchFilter = cellText.includes(filterValue);
        }
      }
      row.style.display = matchKeyword && matchFilter ? "" : "none";
    });
  };

  searchInput.addEventListener("input", applyLocalFilter);
  filterSelect?.addEventListener("change", () => {
    refreshFilters();
    applyLocalFilter();
  });
  filterValuesSelect?.addEventListener("change", applyLocalFilter);

  searchForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const keyword = searchInput.value.trim();
    const column = columnSelect?.value || schema.columns[0].key;

    if (!keyword) {
      renderTableBody(tableEl, schema, cachedData);
      applyLocalFilter();
      return;
    }

    try {
      const result = await fetchJSON(
        `${API_BASE}/search_data.php?table=${tableName}&column=${column}&value=${encodeURIComponent(
          keyword
        )}`
      );
      if (!Array.isArray(result)) {
        console.error("Invalid search result format:", result);
        return;
      }
      renderTableBody(tableEl, schema, result);
    } catch (error) {
      console.error(error);
    }
  });

  fetchJSON(`${API_BASE}/fetch_data.php?table=${tableName}`)
    .then((data) => {
      if (!Array.isArray(data)) {
        console.error("Invalid data format received:", data);
        return;
      }
      cachedData = data;
      renderTableBody(tableEl, schema, cachedData);
      refreshFilters();
    })
    .catch((err) => {
      console.error(err);
    });
}

function serialiseForm(form) {
  const formData = new FormData(form);
  return Array.from(formData.entries()).reduce((acc, [key, value]) => {
    acc[key] = value.trim();
    return acc;
  }, {});
}

function populateForm(form, schema, data) {
  schema.columns.forEach((column) => {
    const field = form.elements[column.key];
    if (!field) return;
    field.value = data[column.key] ?? "";
  });
}

function buildForm(schema, mode) {
  const form = document.createElement("form");
  form.classList.add("modal-form");
  form.dataset.mode = mode;

  schema.columns.forEach((column) => {
    const wrapper = document.createElement("div");
    wrapper.classList.add("field-group");

    const label = document.createElement("label");
    label.setAttribute("for", column.key);
    label.textContent = column.label;

    const input = document.createElement("input");
    input.name = column.key;
    input.id = column.key;
    input.type = column.type === "date" ? "date" : "text";
    if (column.required) {
      input.required = true;
    }
    wrapper.append(label, input);
    form.appendChild(wrapper);
  });

  const submitButton = document.createElement("button");
  submitButton.type = "submit";
  submitButton.className = "btn";
  submitButton.textContent = mode === "insert" ? "Insert Record" : "Submit";
  form.appendChild(submitButton);
  return form;
}

function openModal(modal) {
  modal.classList.add("open");
}

function closeModal(modal) {
  modal.classList.remove("open");
  const status = modal.querySelector(".status-message");
  if (status) {
    status.remove();
  }
  const form = modal.querySelector("form");
  if (form) {
    form.reset();
  }
}

function attachModalHandlers() {
  document.querySelectorAll("[data-modal]").forEach((trigger) => {
    const targetId = trigger.dataset.modal;
    const modal = document.getElementById(targetId);
    if (!modal) return;

    trigger.addEventListener("click", () => openModal(modal));

    modal.querySelectorAll(".modal-close").forEach((closeButton) => {
      closeButton.addEventListener("click", () => closeModal(modal));
    });

    modal.addEventListener("click", (event) => {
      if (event.target === modal) {
        closeModal(modal);
      }
    });
  });
}

function setModalStatus(modal, message, isSuccess = true) {
  let status = modal.querySelector(".status-message");
  if (!status) {
    status = document.createElement("div");
    status.classList.add("status-message");
    modal.querySelector(".modal-content").appendChild(status);
  }
  status.className = `status-message ${isSuccess ? "success" : "error"}`;
  status.textContent = message;
}

function handleCrudForms(tableName) {
  const schema = selectSchema(tableName);
  if (!schema) return;

  const modalContainer = document.getElementById("modal-root");
  if (!modalContainer) return;

  const modalIds = ["insert-modal", "update-modal", "search-modal", "delete-modal"];

  modalContainer.querySelectorAll(".modal").forEach((modal) => modal.remove());

  modalIds.forEach((id) => {
    const modal = document.createElement("div");
    modal.className = "modal";
    modal.id = id;
    modal.innerHTML = `
      <div class="modal-content">
        <div class="modal-close" role="button" aria-label="Close">✕</div>
        <h2>${id.split("-")[0].toUpperCase()} ${tableName.replace("_", " ")}</h2>
      </div>
    `;
    modalContainer.appendChild(modal);
  });

  const [insertModal, updateModal, searchModal, deleteModal] = modalIds.map((id) =>
    document.getElementById(id)
  );

  const insertForm = buildForm(schema, "insert");
  insertModal.querySelector(".modal-content").appendChild(insertForm);

  const updateForm = buildForm(schema, "update");
  updateModal.querySelector(".modal-content").appendChild(updateForm);

  const searchForm = buildForm(schema, "search");
  searchModal.querySelector(".modal-content").appendChild(searchForm);

  const deleteForm = document.createElement("form");
  deleteForm.innerHTML = `
    <div class="field-group">
      <label for="delete_id">Enter ${schema.columns[0].label} to delete</label>
      <input type="text" id="delete_id" name="${schema.columns[0].key}" required />
    </div>
    <button type="submit" class="btn">Delete Record</button>
  `;
  deleteModal.querySelector(".modal-content").appendChild(deleteForm);

  attachModalHandlers();

  insertForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const payload = serialiseForm(insertForm);
    try {
      const response = await fetchJSON(`${API_BASE}/insert_data.php`, {
        method: "POST",
        body: JSON.stringify({ table: tableName, data: payload }),
      });
      setModalStatus(insertModal, response.message || "Record inserted successfully.");
      insertForm.reset();
      refreshCurrentTable();
    } catch (error) {
      setModalStatus(insertModal, error.message, false);
    }
  });

  updateForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const payload = serialiseForm(updateForm);
    try {
      const response = await fetchJSON(`${API_BASE}/update_data.php`, {
        method: "POST",
        body: JSON.stringify({ table: tableName, data: payload }),
      });
      setModalStatus(updateModal, response.message || "Record updated successfully.");
      refreshCurrentTable();
    } catch (error) {
      setModalStatus(updateModal, error.message, false);
    }
  });

  searchForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const payload = serialiseForm(searchForm);
    try {
      const schemaKeys = Object.keys(payload).filter((key) => payload[key] !== "");
      if (!schemaKeys.length) {
        setModalStatus(searchModal, "Please enter at least one field to search.", false);
        return;
      }
      const query = new URLSearchParams({
        table: tableName,
        column: schemaKeys[0],
        value: payload[schemaKeys[0]],
      }).toString();
      const result = await fetchJSON(`${API_BASE}/search_data.php?${query}`);
      if (!Array.isArray(result)) {
        setModalStatus(searchModal, "Invalid search result format.", false);
        return;
      }
      renderTableBody(
        document.querySelector(`[data-table="${tableName}"]`),
        schema,
        result
      );
      setModalStatus(
        searchModal,
        result.length ? "Search results updated below." : "No records matched."
      );
    } catch (error) {
      setModalStatus(searchModal, error.message, false);
    }
  });

  deleteForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const payload = serialiseForm(deleteForm);
    try {
      const response = await fetchJSON(`${API_BASE}/delete_data.php`, {
        method: "POST",
        body: JSON.stringify({ table: tableName, data: payload }),
      });
      setModalStatus(deleteModal, response.message || "Record deleted successfully.");
      deleteForm.reset();
      refreshCurrentTable();
    } catch (error) {
      setModalStatus(deleteModal, error.message, false);
    }
  });
}

function refreshCurrentTable() {
  const activeTable = document.querySelector("[data-table].active-table") || document.querySelector("[data-table]");
  if (!activeTable) return;
  loadTable(activeTable, activeTable.dataset.table);
}

function rebindSearch(tableEl) {
  const selector = tableEl.dataset.searchContainer;
  if (!selector) return;
  const currentContainer = document.querySelector(selector);
  if (!currentContainer) return;
  const clone = currentContainer.cloneNode(true);
  currentContainer.parentNode.replaceChild(clone, currentContainer);
  initSearchFilter(tableEl, tableEl.dataset.table, clone);
}

function initDashboard() {
  const selector = document.querySelector("[data-role='entity-selector']");
  if (!selector) return;

  const tableEl = document.querySelector("[data-role='crud-table']");
  const defaultTable = selector.value;
  if (tableEl) {
    tableEl.dataset.table = defaultTable;
    loadTable(tableEl, defaultTable);
    tableEl.classList.add("active-table");
    rebindSearch(tableEl);
  }
  handleCrudForms(defaultTable);

  selector.addEventListener("change", (event) => {
    const tableName = event.target.value;
    if (tableEl) {
      tableEl.dataset.table = tableName;
      loadTable(tableEl, tableName);
      rebindSearch(tableEl);
      handleCrudForms(tableName);
    }
  });
}

function initLoginModals() {
  document.querySelectorAll("[data-login]").forEach((button) => {
    button.addEventListener("click", () => {
      const target = button.dataset.login;
      const modal = document.getElementById(`${target}-login`);
      if (modal) openModal(modal);
    });
  });

  document.querySelectorAll(".login-form").forEach((form) => {
    form.addEventListener("submit", (event) => {
      event.preventDefault();
      const targetPage = form.dataset.redirect;
      if (targetPage) {
        window.location.href = targetPage;
      }
    });
  });
}

document.addEventListener("DOMContentLoaded", () => {
  attachModalHandlers();
  initLoginModals();
  initDashboard();

  document.querySelectorAll("[data-table]").forEach((tableEl) => {
    const tableName = tableEl.dataset.table;
    if (!tableName) return;
    loadTable(tableEl, tableName);
    const containerSelector = tableEl.dataset.searchContainer;
    const container = containerSelector ? document.querySelector(containerSelector) : tableEl.closest("[data-search-container]");
    initSearchFilter(tableEl, tableName, container);
  });
});

