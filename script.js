function generateWatchID() {
    return 'WID-' + Date.now(); // Uses timestamp for uniqueness
}

//------------------------------------------------------------------------------------------------------------------
document.addEventListener("DOMContentLoaded", function () {
    console.log("Script Loaded!");



    // Ensure `watchID` field exists before setting a value
    const watchIDField = document.getElementById('watchID');
    if (watchIDField) {
        watchIDField.value = generateWatchID();
    }

    loadDropdowns();

    // Load table data
    loadInventoryRecords()
    document.getElementById('inventoryForm').addEventListener('submit', async function (e) {
        e.preventDefault();

        // Collect form values
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
        let imagesData = [];

        const readFile = (file) => {
            return new Promise((resolve) => {
                const reader = new FileReader();
                reader.readAsDataURL(file);
                reader.onload = () => resolve(reader.result.split(",")[1]);
            });
        };

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
                return loadInventoryRecords();
            })
            .catch(error => {
                console.error("Fetch Error:", error);
                alert("Failed to add watch. Please try again.");
            });
    });
});

// ✅ Load Inventory Records Function
//------------------------------------------------------------------------------------------------------------------
function loadInventoryRecords() {
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

      tableBody.innerHTML = "";

      data.forEach((row, index) => {
        if (index === 0) return; // Skip header row

        let tr = document.createElement("tr");
        row.forEach((cell, cellIndex) => {
          let td = document.createElement("td");

          if (cellIndex === row.length - 7 && cell) {
            td.textContent = new Date(cell).toISOString().split("T")[0];
          } else if (cellIndex === row.length - 3 && cell.startsWith("https")) {
            let link = document.createElement("a");
            link.href = cell;
            link.textContent = "[View Folder]";
            link.target = "_blank";
            link.title = cell;
            td.appendChild(link);
          } else if (cellIndex === row.length - 2 && cell.includes(",")) {
            td.textContent = "Multiple Images";
          } else if (cellIndex === row.length - 2 && cell.startsWith("https")) {
            let imageLink = document.createElement("a");
            imageLink.href = cell;
            imageLink.textContent = "[View Image]";
            imageLink.target = "_blank";
            imageLink.title = cell;
            td.appendChild(imageLink);
          } else if (cellIndex === row.length - 1 && cell) {
            td.textContent = new Date(cell).toISOString().split("T")[0];
          } else {
            td.textContent = cell;
          }

          tr.appendChild(td);
        });
        tableBody.appendChild(tr);
      });
        // ✅ Show content and hide loader once data is ready
document.getElementById("loader").style.display = "none";
document.getElementById("content").style.display = "block";
    })
    .catch(error => {
      console.error("Table Fetch Error:", error);
      alert("Failed to load inventory records.");
    });
}


//------------------------------------------------------------------------------------------------------------------
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

            data.movements.forEach(movement => {
                let option = document.createElement("option");
                option.value = movement;
                option.textContent = movement;
                movementSelect.appendChild(option);
            });

            data.statuses.forEach(status => {
                let option = document.createElement("option");
                option.value = status;
                option.textContent = status;
                statusSelect.appendChild(option);
            });

            data.brands.forEach(brand => {
                let option = document.createElement("option");
                option.value = brand;
                option.textContent = brand;
                brandSelect.appendChild(option);
            });
        })
        .catch(error => console.error("Dropdown Fetch Error:", error));
}
