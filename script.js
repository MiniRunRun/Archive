// Wait for the document to fully load before executing the script
document.addEventListener('DOMContentLoaded', () => {
    
    // Google Sheets API details
    const SHEET_ID = '1--uA2REsaw76iW2xG79rl5cJJtAkEf5hNBEVCAlBYQw'; // Spreadsheet ID
    const API_KEY = 'AIzaSyCqZzQ1lChN67KySstdi8-i7eue-oUIyKs'; // API key for authentication
    const RANGE = 'Sheet1!A1:M50'; // The range of data to fetch (columns A to J, rows 1 to 500)

    // Construct the API URL to fetch data from the Google Sheets
    const SHEET_API_URL = `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/${RANGE}?key=${API_KEY}`;

    // Fetch data from the Google Sheets API
    fetch(SHEET_API_URL)
        .then(response => {
            // Check if the response is okay (status 200)
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.json(); // Parse response as JSON
        })
        .then(data => {
            const rows = data.values; // Extract the rows from the data
            const headers = rows[0]; // First row contains headers (column names)
            
            // Convert the remaining rows into an array of objects
            const jsonData = rows.slice(1).map(row => {
                const obj = {};
                row.forEach((value, index) => {
                    obj[headers[index]] = value; // Map column headers to corresponding row values
                });
                return obj;
            });

            console.log('Parsed JSON Data:', jsonData); // Log the structured data for debugging
            renderData(jsonData); // Call function to display the data on the webpage
        })
        .catch(error => console.error('Error fetching data:', error)); // Handle any fetch errors

 
    /**
     * Function to render the fetched data as selectable content
     */
    function renderData(data) {
        const interactiveContainer = document.querySelector('.interactive-container'); // Container where images will be placed
        const centerDisplay = document.querySelector('.center-display'); // Modal-like display area for selected item
        const centerContent = document.querySelector('.center-content'); // Clickable area to close the modal
// change this
        data.forEach(item => {
            const { title, category, year, name, size, description, visuals, why, color, image,top,left} = item; // Destructure properties from item

            // Check if image is missing or empty, and skip this item if so
            if (!image || !image.trim()) {
                console.warn('Skipping item due to missing or invalid ImageURL:', item);
                return;
            }

            // Create a div container for the item
            const container = document.createElement('div');
            container.className = 'image-container';
            container.style.top = `${parseFloat(top) || 0}%`; // Set vertical position
            container.style.left = `${parseFloat(left) || 0}%`; // Set horizontal position

            // Store metadata as data attributes
            container.setAttribute('data-name', name || 'Unknown');
            container.setAttribute('data-category', category || 'Unknown');
            container.setAttribute('data-size', size || 'Unknown');
            container.setAttribute('data-title', title || 'Untitled');
            container.setAttribute('data-year', year || 'Unknown');
            container.setAttribute('data-visuals', visuals || 'Unknown');
            container.setAttribute('data-why', why || 'Unknown');
            container.setAttribute('data-color', color || 'Unknown');
            container.setAttribute('data-image', image || 'unavailable');
            container.setAttribute('data-description', description || 'No description available.');

            // Create an image element
            const img = document.createElement('img');
            img.src = image.trim(); // Assign image source
            img.alt = title || 'image'; // Provide an alt text for accessibility

          
            // Append image to container and container to the interactive area
            container.appendChild(img);
            interactiveContainer.appendChild(container);
        });

        // Add event listener to handle clicks on images
        interactiveContainer.addEventListener('click', (event) => {
            const container = event.target.closest('.image-container'); // Find the closest clicked container
            if (container) {
                displayCenterInfo(container); // Show details of the clicked item
            }
        });

        // Click event to hide the center display when clicked
        centerContent.addEventListener('click', () => {
            centerDisplay.style.display = 'none';
        });
    }

    /**
     * Function to display detailed information in the center display area
     */
    function displayCenterInfo(container) {
        // Select elements for displaying detailed information
        const centerImage = document.getElementById('center-image');
        const centerName = document.getElementById('center-name');
        const centerTitle = document.getElementById('center-title');
        const centerYear = document.getElementById('center-year');
        const centerBody = document.getElementById('center-body');
        const centerDisplay = document.querySelector('.center-display');

        // Populate the center display with the item's data
        centerImage.src = container.querySelector('img').src;
        centerName.textContent = container.getAttribute('data-name');
        centerTitle.textContent = container.getAttribute('data-title');
        centerYear.textContent = container.getAttribute('data-year');
        centerBody.textContent = container.getAttribute('data-description');

        // Show the center display
        centerDisplay.style.display = 'flex';
    }
  
});



