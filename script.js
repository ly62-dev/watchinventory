function generateWatchID(status, brand) {
  const statusCode = status ? status.substring(0, 3).toUpperCase() : "XXX";
  const brandCode = brand ? brand.substring(0, 3).toUpperCase() : "XXX";
  return `${statusCode}-${brandCode}-${Date.now()}`;
}

function renderDashboard() {
  loadInventoryRecords();
}

document.addEventListener("DOMContentLoaded", function () {
  console.log("Script Loaded!");

  const watchIDField = document.getElementById('watchID');
  const brandSelect = document.getElementById('brand');
  const statusSelect = document.getElementById('status');

  loadDropdowns();
  renderDashboard();

  const updateWatchID = () => {
    const status = statusSelect.value;
    const brand = brandSelect.value;
    if (status && brand) {
      watchIDField.value = generateWatchID(status, brand);
    } else {
      watchIDField.value = "";
    }
  };

  brandSelect.addEventListener('change', updateWatchID);
  statusSelect.addEventListener('change', updateWatchID);

  const refreshBtn = document.getElementById('refreshBtn');
  if (refreshBtn) {
    refreshBtn.addEventListener('click', () => {
      document.getElementById('loader').style.display = "flex";
      document.getElementById('content').style.display = "none";
      renderDashboard();
    });
  }

  const addButton = document.querySelector('#inventoryForm button[type="submit"]');
  const originalBtnText = addButton.textContent;

  document.getElementById('inventoryForm').addEventListener('submit', async function (e) {
    e.preventDefault();
    addButton.disabled = true;
    addButton.textContent = "Saving...";

    const watchID = document.getElementById('watchID').value;
    const status = statusSelect.value;
    const brand = brandSelect.value;
    const model = document.getElementById('model').value;
    const movement = document.getElementById('movement').value;
    const qty = document.getElementById('qty').value;
    const boughtPrice = document.getElementById('boughtPrice').value;
    const boughtDate = document.getElementById('boughtDate').value;
    const sellingPrice = document.getElementById('sellingPrice').value;
    const supplier = document.getElementById('supplier').value;
    const notes = document.getElementById('notes').value;
    const imageFiles = document.getElementById('images').files;

    let imagesData = [];
    const readFile = (file) => new Promise((resolve) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result.split(",")[1]);
    });

    for (let file of imageFiles) {
      imagesData.push(await readFile(file));
    }

    fetch('https://script.google.com/macros/s/AKfycbwlF1K3yWaVKcMu_sb7DDgjm5LQmF1n0BiQgacJSkvlastNSU0DCVMAnLaxE_phiyfu/exec', {
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
        watchIDField.value = "";
        updateWatchID();
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
  });

  // 🔍 Add filters
  document.getElementById('searchInput').addEventListener('input', applyTableFilters);
  document.getElementById('statusFilter').addEventListener('change', applyTableFilters);

  // ❌ Clear filters button
  document.getElementById('clearFiltersBtn').addEventListener('click', () => {
    document.getElementById('searchInput').value = '';
    document.getElementById('statusFilter').value = '';
    applyTableFilters();
  });
});

function loadInventoryRecords() {
  console.log("fetching table!");

  fetch('https://script.google.com/macros/s/AKfycbwlF1K3yWaVKcMu_sb7DDgjm5LQmF1n0BiQgacJSkvlastNSU0DCVMAnLaxE_phiyfu/exec')
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

  return tr;
}

function applyTableFilters() {
  const searchTerm = document.getElementById('searchInput').value.toLowerCase();
  const statusFilter = document.getElementById('statusFilter').value;

  const rows = document.querySelectorAll('#inventoryTableBody tr');
  rows.forEach(row => {
    const cells = row.querySelectorAll('td');
    const rowText = Array.from(cells).map(cell => cell.textContent.toLowerCase()).join(" ");
    const rowStatus = cells[1]?.textContent || "";

    const matchesSearch = rowText.includes(searchTerm);
    const matchesStatus = !statusFilter || rowStatus === statusFilter;

    row.style.display = (matchesSearch && matchesStatus) ? "" : "none";
  });
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
