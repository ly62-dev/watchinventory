function generateWatchID() {
    return 'WID-' + Date.now(); // Uses timestamp for uniqueness
}
document.addEventListener("DOMContentLoaded", function() {
    console.log("Script Loaded!");  

    // Ensure `watchID` field exists before setting a value
    const watchIDField = document.getElementById('watchID');
    if (watchIDField) {
        watchIDField.value = generateWatchID();
    }

    // Load table data on page load
    loadInventoryRecords();

    document.getElementById('inventoryForm').addEventListener('submit', async function(e) {
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

        // Send data to Google Apps Script
        fetch('https://script.google.com/macros/s/AKfycbz2cel9Dqg5SYps0qwEGu1K8DU4qCU2_DTAk_07wuMxy9lte8lQXSsQIf69wlG_HmJt/exec', {
            method: 'POST',
            mode: 'cors',
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ watchID, status, brand, model, movement, qty, boughtPrice, boughtDate, sellingPrice, supplier, notes, images: imagesData })
        })
        .then(response => response.json())
        .then(data => {
            console.log("Watch added successfully!", data);
            return loadInventoryRecords(); // ✅ Ensure new records load immediately after adding
        })
        .catch(error => {
            console.error("Fetch Error:", error);
            alert("Failed to add watch. Please try again.");
        });
    });
});

// ✅ Load Inventory Records Function
function loadInventoryRecords() {
    fetch('https://script.google.com/macros/s/AKfycbz2cel9Dqg5SYps0qwEGu1K8DU4qCU2_DTAk_07wuMxy9lte8lQXSsQIf69wlG_HmJt/exec')
    .then(response => response.json())
    .then(data => {
        console.log("Fetched Data:", data);
        const tableContainer = document.getElementById("tableContainer");
        const tableBody = document.getElementById("inventoryTableBody");

        if (!data || data.length === 0) {  
            tableContainer.style.display = "none"; 
            console.warn("No valid inventory data received.");
            return; // 🚨 Exit early if no data
        } else {  
            tableContainer.style.display = "block"; 
        }

        tableBody.innerHTML = "";

        data.forEach((row, index) => {
            if (index === 0) return;

            let tr = document.createElement("tr");
            row.forEach(cell => {
                let td = document.createElement("td");
                td.textContent = cell;
                tr.appendChild(td);
            });
            tableBody.appendChild(tr);
        });
    })
    .catch(error => {
        console.error("Table Fetch Error:", error);
        alert("Failed to load inventory records.");
    });
}
