// Global sorting state
let sortState = { index: null, asc: true };

function generateWatchID(status, brand) {
  const statusCode = status ? status.substring(0, 3).toUpperCase() : "XXX";
  const brandCode = brand ? brand.substring(0, 3).toUpperCase() : "XXX";
  return `${statusCode}-${brandCode}-${Date.now()}`;
}
function updateWatchID() {
  const status = document.getElementById('status').value;
  const brand = document.getElementById('brand').value;
  const watchIDField = document.getElementById('watchID');

  if (status && brand) {
    watchIDField.value = generateWatchID(status, brand);
  } else {
    watchIDField.value = "";
  }
}
function renderDashboard() {
  loadInventoryRecords();
}
//------------------Add watch---------------------------------
async function handleAddWatch(e) {
  e.preventDefault();

  const addButton = document.querySelector('#inventoryForm button[type="submit"]');
  const originalBtnText = addButton.textContent;
  addButton.disabled = true;
  addButton.textContent = "Saving...";

  const watchID = document.getElementById('watchID').value;
  const status = document.getElementById('status').value;
  const brand = document.getElementById('brand').value;
  const model = document.getElementById('model').value;
  const movement = document.getElementById('movement').value;
  const qty = document.getElementById('qty').value;
  const boughtPrice = document.getElementById('boughtPrice').value;
  const boughtDate = document.getElementById('boughtDate').value;
  const sellingPrice = document.getElementById('sellingPrice').value;
  const supplier = document.getElementById('supplier').value;
  const notes = document.getElementById('notes').value;
  const imageFiles = document.getElementById('images').files;

  const imagesData = [];
  const readFile = (file) => new Promise((resolve) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result.split(",")[1]);
  });

  for (let file of imageFiles) {
    imagesData.push(await readFile(file));
  }

  fetch('https://script.google.com/macros/s/AKfycbwOVHVKknEYM6VdZTcWe_Ap17dB2isN4vpcpFlB1nuf9Hmx52nc-BZ9MZcOjOIHje-V/exec', {
    method: 'POST',
    mode: 'cors',
    redirect: "follow",
    headers: { "Content-Type": "text/plain" },
    body: JSON.stringify({
      watchID, status, brand, model, movement, qty,
      boughtPrice, boughtDate, sellingPrice, supplier, notes,
      images: imagesData
    })
  })
    .then(response => response.json())
    .then(data => {
      console.log("Watch added successfully!", data);
      document.getElementById('inventoryForm').reset();
      document.getElementById('watchID').value = "";
      updateWatchID(); // This should be globally accessible
      renderDashboard();
    })
    .catch(error => {
      console.error("Fetch Error:", error);
      alert("Failed to add watch. Please try again.");
    })
    .finally(() => {
      addButton.disabled = false;
      addButton.textContent = originalBtnText;
    });
}//------------------End add watch-----------------------------
//-------------------Delete watch------------------------------
async function handleDeleteWatch(e) {
  e.preventDefault();

  const deleteBtn = document.getElementById('deleteWatchBtn');
  const deleteInput = document.getElementById('deleteWatchID');
  const watchID = deleteInput.value.trim();
  const statusDiv = document.getElementById('deleteStatus');

  //deleteBtn.disabled = true;
  deleteBtn.textContent = "Deleting...";

  if (!watchID) {
    statusDiv.textContent = "⚠️ Please enter a Watch ID.";
    statusDiv.style.color = "orange";
    resetDeleteBtn();
    return;
  }

  if (!window.cachedWatchIDs || !window.cachedWatchIDs.includes(watchID)) {
    statusDiv.textContent = `❌ Watch ID "${watchID}" not found in inventory.`;
    statusDiv.style.color = "red";
    resetDeleteBtn();
    return;
  }

  const confirmed = confirm(`Are you sure you want to delete Watch ID: ${watchID}?`);
  if (!confirmed) {
    resetDeleteBtn();
    return;
  }

  try {
    const response = await fetch('https://script.google.com/macros/s/AKfycbwOVHVKknEYM6VdZTcWe_Ap17dB2isN4vpcpFlB1nuf9Hmx52nc-BZ9MZcOjOIHje-V/exec', {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain' },
      body: JSON.stringify({ action: 'delete', watchID })
    });

    const data = await response.json();

    if (data.success) {
      statusDiv.textContent = `✅ Watch ${watchID} deleted successfully.`;
      statusDiv.style.color = "green";
      deleteInput.value = "";
      renderDashboard();
    } else {
      statusDiv.textContent = `❌ Could not delete Watch ID "${watchID}".`;
      statusDiv.style.color = "red";
    }
  } catch (error) {
    console.error("Deletion error:", error);
    statusDiv.textContent = "❌ Something went wrong. Please try again.";
    statusDiv.style.color = "red";
  } finally {
    resetDeleteBtn();
  }
}

// ✨ Utility to restore button state
function resetDeleteBtn() {
  const deleteBtn = document.getElementById('deleteWatchBtn');
  deleteBtn.disabled = false;
  deleteBtn.textContent = "Delete";
}
//-------------------End delete watch--------------------------
//-------------------Edit watch--------------------------------
function handleEditWatch() {
  const watchID = document.getElementById('editWatchID').value.trim();
  const statusDiv = document.getElementById('editStatus');
  const formWrapper = document.getElementById('editFormWrapper');

  if (!window.cachedRecords || !Array.isArray(window.cachedRecords)) {
    statusDiv.textContent = "⚠️ Inventory not loaded. Try refreshing.";
    statusDiv.style.color = "orange";
    formWrapper.style.display = "none";
    return;
  }

  const match = window.cachedRecords.find(row => row[0] === watchID);
  if (!match) {
    statusDiv.textContent = `❌ Watch ID "${watchID}" not found.`;
    statusDiv.style.color = "red";
    formWrapper.style.display = "none";
    return;
  }

  const fieldMap = [
    'watchID', 'status', 'brand', 'model', 'movement',
    'qty', 'boughtPrice', 'boughtDate', 'sellingPrice',
    'supplier', 'notes'
  ];

  fieldMap.forEach((id, i) => {
    const el = document.getElementById(id);
    if (el) el.value = match[i] || '';
  });

  statusDiv.textContent = `✅ Loaded Watch ${watchID} for editing.`;
  statusDiv.style.color = "green";
  formWrapper.style.display = "block";

  const formTab = [...document.querySelectorAll('.custom-tab')].find(tab => tab.textContent.includes("Add") || tab.textContent.includes("Inventory"));
  if (formTab) formTab.click();
}
//-------------------End edit watch----------------------------

document.addEventListener("DOMContentLoaded", function () {
  const watchIDField = document.getElementById('watchID');
  const brandSelect = document.getElementById('brand');
  const statusSelect = document.getElementById('status');

  loadDropdowns();
  renderDashboard();

  brandSelect.addEventListener('change', updateWatchID);
  statusSelect.addEventListener('change', updateWatchID);

  const deleteInput = document.getElementById('deleteWatchID');
  const deleteBtn = document.getElementById('deleteWatchBtn');

  // Delete button
  deleteBtn.disabled = true;
  deleteInput.addEventListener('input', () => {
    const inputID = deleteInput.value.trim();
    //const isValid = window.cachedWatchIDs && window.cachedWatchIDs.includes(inputID);
    //deleteBtn.disabled = !isValid;
    deleteBtn.disabled = inputID.length !== 21;
    console.log("char" + inputID.length);
    });
    deleteBtn.addEventListener('click', handleDeleteWatch);
  
  //Edit button
  const editInput = document.getElementById('editWatchID');
  const editBtn = document.getElementById('editWatchBtn');

  editBtn.disabled = true;
  editInput.addEventListener('input', () => {
    const inputID = editInput.value.trim();
    editBtn.disabled = inputID.length !== 21; // adjust length to your real ID format
  });
  editBtn.addEventListener('click', handleEditWatch);

  const refreshBtn = document.getElementById('refreshBtn');
  if (refreshBtn) {
    refreshBtn.addEventListener('click', () => {
      document.getElementById('loader').style.display = "flex";
      document.getElementById('content').style.display = "none";
      renderDashboard();
    });
  }

  const cancelButton = document.getElementById('cancelWatchBtn');
  const originalCancelText = cancelButton.textContent;

  cancelButton.addEventListener('click', () => {
    if (confirm("Discard this watch entry?")) {
      cancelButton.disabled = true;
      cancelButton.textContent = "Clearing...";

      document.getElementById('inventoryForm').reset();
      watchIDField.value = "";
      updateWatchID();

      setTimeout(() => {
        cancelButton.disabled = false;
        cancelButton.textContent = originalCancelText;
      }, 600); // slight UX delay to match button vibe
    }
  });

    document.getElementById('inventoryForm').addEventListener('submit', handleAddWatch);
    document.getElementById('searchInput').addEventListener('input', applyTableFilters);
    document.getElementById('statusFilter').addEventListener('change', applyTableFilters);
    document.getElementById('clearFiltersBtn').addEventListener('click', () => {
    document.getElementById('searchInput').value = '';
    document.getElementById('statusFilter').value = '';
    applyTableFilters();
  });

  document.querySelectorAll("th.sortable").forEach(th => {
    th.addEventListener("click", () => {
      const colIndex = parseInt(th.dataset.index);
      sortState.asc = sortState.index === colIndex ? !sortState.asc : true;
      sortTableByColumn(colIndex);
    });
  });

  document.getElementById("exportCSVBtn").addEventListener("click", () => {
    exportTableToCSV();
});

  document.addEventListener("DOMContentLoaded", () => {
    document.querySelector(".custom-tab").click();
});

    // 🔃 Default sort: Date Added descending on load (column index 13)
    sortState.index = 13;
    sortState.asc = false;
    sortTableByColumn(13);
});

function loadInventoryRecords() {
  fetch('https://script.google.com/macros/s/AKfycbwOVHVKknEYM6VdZTcWe_Ap17dB2isN4vpcpFlB1nuf9Hmx52nc-BZ9MZcOjOIHje-V/exec')
    .then(response => response.json())
    .then(data => {
      console.log("Fetched Data:", data);
      const tableContainer = document.getElementById("tableContainer");
      const tableBody = document.getElementById("inventoryTableBody");

      if (!data || data.length === 0) {
        tableContainer.style.display = "none";
        console.warn("No valid inventory data received.");
        return;
      } else {
        tableContainer.style.display = "block";
      }

      tableBody.textContent = "";

      data.forEach((row, index) => {
        if (index === 0) return;
        const tr = createTableRow(row);
        tableBody.appendChild(tr);
      });
      
      updateDashboardStats(data);
      window.cachedWatchIDs = data.slice(1).map(row => row[0].trim());
      window.cachedRecords = data.slice(1); // Stores full rows for edit lookup

      //console.log("✅ cachedWatchIDs:", window.cachedWatchIDs);

      applyTableFilters();
      
      document.getElementById("loader").style.display = "none";
      document.getElementById("content").style.display = "block";
    })
    .catch(error => {
      console.error("Table Fetch Error:", error);
      alert("Failed to load inventory records.");
    });
}

function createTableRow(row) {
  const tr = document.createElement("tr");

  row.forEach((cell, i) => {
    const td = document.createElement("td");
    const isBoughtDate = i === row.length - 7;
    const isFolderLink = i === row.length - 3;
    const isImageLink = i === row.length - 2;
    const isDateAdded = i === row.length - 1;

    if ((isBoughtDate || isDateAdded) && cell) {
      td.textContent = new Date(cell).toISOString().split("T")[0];
    } else if (isFolderLink && cell.startsWith("https")) {
      const link = document.createElement("a");
      link.href = cell;
      link.textContent = "[View Folder]";
      link.target = "_blank";
      link.title = cell;
      td.appendChild(link);
    } else if (isImageLink && cell.includes(",")) {
      td.textContent = "Multiple Images";
    } else if (isImageLink && cell.startsWith("https")) {
      const imageLink = document.createElement("a");
      imageLink.href = cell;
      imageLink.textContent = "[View Image]";
      imageLink.target = "_blank";
      imageLink.title = cell;
      td.appendChild(imageLink);
    } else {
      td.textContent = cell;
    }

    tr.appendChild(td);
  });
  //----added for delete row
  //tr.setAttribute("data-watchid", row[0]); // assuming Watch ID is in the first column
  //tr.addEventListener("click", function () {
  //const watchID = this.getAttribute("data-watchid");
  //document.getElementById("deleteWatchID").value = watchID;
  //document.getElementById('deleteWatchID').dispatchEvent(new Event('input'));

  // Switch to the Delete tab
  //const deleteTabButton = [...document.querySelectorAll(".custom-tab")]
    //.find(btn => btn.textContent.includes("Delete"));
  //if (deleteTabButton) deleteTabButton.click();
  //});

  tr.setAttribute("data-watchid", row[0]);

  tr.addEventListener("click", function () {
    const watchID = this.getAttribute("data-watchid");

    const activeTab = document.querySelector(".custom-tab.active")?.textContent || "";

    if (activeTab.includes("Edit")) {
    // ➕ Fill Edit field and keep you in Edit tab
      const editInput = document.getElementById("editWatchID");
      editInput.value = watchID;
      editInput.dispatchEvent(new Event("input"));
    } else if (activeTab.includes("Delete")) {
    // ➖ Fill Delete field and keep you in Delete tab
      const deleteInput = document.getElementById("deleteWatchID");
      deleteInput.value = watchID;
      deleteInput.dispatchEvent(new Event("input"));
    } else {
      console.log("Row clicked outside Edit/Delete context.");
    }
  });

  //-------------------
  return tr;
}

function sortTableByColumn(index) {
  const tableBody = document.getElementById("inventoryTableBody");
  const rowsArray = Array.from(tableBody.querySelectorAll("tr"));

  rowsArray.sort((a, b) => {
    const valA = a.children[index].textContent.trim();
    const valB = b.children[index].textContent.trim();

    const dateA = new Date(valA);
    const dateB = new Date(valB);
    const isDate = !isNaN(dateA) && !isNaN(dateB);

    const numA = parseFloat(valA.replace(/[^\d.-]/g, ""));
    const numB = parseFloat(valB.replace(/[^\d.-]/g, ""));
    const isNumeric = !isNaN(numA) && !isNaN(numB);

    const compare = isDate
      ? dateA - dateB
      : isNumeric
        ? numA - numB
        : valA.localeCompare(valB, undefined, { sensitivity: "base" });


    return sortState.asc ? compare : -compare;
  });

  tableBody.innerHTML = "";
  rowsArray.forEach(row => tableBody.appendChild(row));
  sortState.index = index;
  
document.querySelectorAll("th.sortable").forEach(th => {
  const i = parseInt(th.dataset.index);
  const baseText = th.getAttribute("data-label") || th.textContent.replace(/[\u25B2\u25BC]/g, "").trim();
  th.innerHTML = baseText + (i === index
    ? ` <span class="sort-icon">${sortState.asc ? "🔼" : "🔽"}</span>`
    : ""
  );
});
}

function applyTableFilters() {
  const searchTerm = document.getElementById('searchInput').value.toLowerCase();
  const statusFilter = document.getElementById('statusFilter').value;

  const rows = document.querySelectorAll('#inventoryTableBody tr');
  let matchCount = 0;

  rows.forEach(row => {
    const cells = row.querySelectorAll('td');
    const rowText = Array.from(cells).map(cell => cell.textContent.toLowerCase()).join(" ");
    const rowStatus = cells[1]?.textContent || "";

    const matchesSearch = rowText.includes(searchTerm);
    const matchesStatus = !statusFilter || rowStatus === statusFilter;

    const isVisible = matchesSearch && matchesStatus;
    row.style.display = isVisible ? "" : "none";

    if (isVisible) matchCount++;
  });

  const counter = document.getElementById('resultCount');
  if (counter) {
    counter.textContent = `🔎 ${matchCount} result${matchCount !== 1 ? 's' : ''} found`;
  }
}

function exportTableToCSV(filename = "watch-inventory.csv") {
  const table = document.getElementById("inventoryTable");
  const tbody = document.getElementById("inventoryTableBody");

  if (!table || !tbody) {
    console.warn("Table elements not found");
    return;
  }

  const headers = Array.from(table.querySelectorAll("thead th"))
    .map(th => th.getAttribute("data-label") || th.textContent.replace(/[\u25B2\u25BC]/g, "").trim());

  const rows = Array.from(tbody.querySelectorAll("tr"))
    .filter(row => row.style.display !== "none") // export only visible rows
    .map(row => {
      return Array.from(row.querySelectorAll("td"))
        .map(td => {
          const link = td.querySelector("a");
          const cellContent = link ? link.href : td.textContent;
          return `"${cellContent.trim().replace(/"/g, '""')}"`;
        })

        .join(",");
    });

  const csvContent = [headers.join(","), ...rows].join("\n");

  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.setAttribute("download", filename);

  // Required for Firefox
  document.body.appendChild(link);
  console.log("Download ready:", link.href);
  link.click();
  document.body.removeChild(link);
}

function updateDashboardStats(dataRows) {
  const records = dataRows.slice(1);
  const uniqueBrands = new Set();
  const statusMap = {};

  records.forEach(row => {
    const status = row[1];
    const brand = row[2];

    if (brand) uniqueBrands.add(brand);
    if (status) {
      statusMap[status] = (statusMap[status] || 0) + 1;
    }
  });

  document.getElementById('recordCount').textContent = `📦 Total Records: ${records.length}`;
  document.getElementById('brandCount').textContent = `🧮 Total Brands: ${uniqueBrands.size}`;

  const statusDisplay = Object.entries(statusMap)
    .map(([status, count]) => `<div>${status}: ${count}</div>`)
    .join("");

  document.getElementById('statusCounts').innerHTML = statusDisplay;
}

function loadDropdowns() {
  fetch("watchInventoryDropdown.json")
    .then(response => response.json())
    .then(data => {
      const movementSelect = document.getElementById("movement");
      const statusSelect = document.getElementById("status");
      const brandSelect = document.getElementById("brand");

      movementSelect.innerHTML = `<option value="" selected disabled>Select movement...</option>`;
            statusSelect.innerHTML = `<option value="" selected disabled>Select status...</option>`;
            brandSelect.innerHTML = `<option value="" selected disabled>Select brand...</option>`;
      data.movements.forEach(m => { const option = document.createElement("option"); option.value = m; option.textContent = m; movementSelect.appendChild(option); });
      data.statuses.forEach(s => { const option = document.createElement("option"); option.value = s; option.textContent = s; statusSelect.appendChild(option); });
      data.brands.forEach(b => { const option = document.createElement("option"); option.value = b; option.textContent = b; brandSelect.appendChild(option); });
    })
    .catch(error => console.error("Dropdown Fetch Error:", error));
}

function openTab(evt, tabId) {
  // Hide all tab content
  document.querySelectorAll(".tab-content").forEach(tab => {
    tab.style.display = "none";
  });

  // Remove 'active' class from all tabs
  document.querySelectorAll(".custom-tab").forEach(btn => {
    btn.classList.remove("active");
  });

  // Show the selected tab content
  document.getElementById(tabId).style.display = "block";

  // Mark this tab as active
  evt.currentTarget.classList.add("active");
}
