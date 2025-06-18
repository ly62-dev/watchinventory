document.addEventListener("DOMContentLoaded", function() {
    console.log("Script Loaded!");  // ✅ This confirms the script runs

    // Function to generate a unique Watch ID
    function generateWatchID() {
        return 'WID-' + Date.now(); // Uses timestamp for uniqueness
    }
    
    document.getElementById('watchID').value = generateWatchID();

    // Fetch categories and statuses dynamically from JSON file
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

    document.getElementById('inventoryForm').addEventListener('submit', async function(e) {
        e.preventDefault();
        
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
        
        fetch('https://script.google.com/macros/s/AKfycbz2cel9Dqg5SYps0qwEGu1K8DU4qCU2_DTAk_07wuMxy9lte8lQXSsQIf69wlG_HmJt/exec', {
            method: 'POST',
            mode: 'cors',
            redirect: "follow",
            headers: { "Content-Type": "text/plain;charset=utf-8" },
            body: JSON.stringify({ watchID, status, brand, model, movement, qty, boughtPrice, boughtDate, sellingPrice, supplier, notes, images: imagesData })
        })
        .then(response => response.json())
        .then(data => console.log("Success:", data))
        .catch(error => console.error("Fetch Error:", error));

        // Fetch and display inventory records
        fetch('https://script.google.com/macros/s/AKfycbz2cel9Dqg5SYps0qwEGu1K8DU4qCU2_DTAk_07wuMxy9lte8lQXSsQIf69wlG_HmJt/exec')
        .then(response => response.json())
        .then(data => {
            console.log("Fetched Data:", data);
            const tableContainer = document.getElementById("tableContainer");
            const tableBody = document.getElementById("inventoryTableBody");

            if (!data || data.length === 0) {  
                tableContainer.style.display = "none"; 
                console.warn("No valid inventory data received.");
                return;
            }

            tableContainer.style.display = "block";  
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
        .catch(error => console.error("Table Fetch Error:", error));
    });
});
