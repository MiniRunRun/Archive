document.addEventListener('DOMContentLoaded', () => {

    const interactiveContainer = document.querySelector('.interactive-container');
    const tunnelGridContainer = document.querySelector('.tunnel-grid-container'); 
    const centerDisplay = document.querySelector('.center-display');
    const buttonsContainer = document.getElementById('category-buttons');
    let activeTimeouts = [];
    let activeCategory = null; 

    window.addEventListener('scroll', () => {
        const scrollY = window.scrollY;
        interactiveContainer.style.transform = `translate3d(0, 0, ${scrollY}px)`;
        tunnelGridContainer.style.transform = `translate3d(0, 0, ${scrollY}px)`;
    }, { passive: true });

    document.addEventListener('mousemove', (e) => {
        const x = (e.clientX / window.innerWidth) * 2 - 1;
        const y = (e.clientY / window.innerHeight) * 2 - 1;
        document.body.style.setProperty('--mouse-x', x);
        document.body.style.setProperty('--mouse-y', y);
    });

    const SHEET_ID = '1--uA2REsaw76iW2xG79rl5cJJtAkEf5hNBEVCAlBYQw';
    const API_KEY = 'AIzaSyCqZzQ1lChN67KySstdi8-i7eue-oUIyKs'; 
    const RANGE = 'Sheet1!A1:M50';
    const SHEET_API_URL = `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/${RANGE}?key=${API_KEY}`;

    fetch(SHEET_API_URL)
        .then(response => {
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            return response.json();
        })
        .then(data => {
            const rows = data.values;
            const headers = rows[0];
            const jsonData = rows.slice(1).map(row => {
                const obj = {};
                row.forEach((value, index) => {
                    if (headers[index]) {
                        obj[headers[index].toLowerCase()] = value;
                    }
                });
                return obj;
            });
            renderData(jsonData);
        })
        .catch(error => {
            console.warn('Using Fallback Data:', error);
            renderFallbackData();
        });

    function renderData(data) {
        const validData = data.filter(item => item.image && item.image.trim());
        
        const categories = new Set();
        validData.forEach(item => {
            if(item.category && item.category.trim() !== '') {
                categories.add(item.category.trim());
            }
        });
        generateCategoryButtons(Array.from(categories));

        const Z_DISTANCE = 150;  
        const START_Z = -1000; 
        
        const SCATTER_X = 25; 
        const SCATTER_Y = 15; 

        const contentDepth = (validData.length * Z_DISTANCE);
        const totalPageHeight = contentDepth + window.innerHeight * 2;
        document.body.style.height = `${totalPageHeight}px`;

        const gridSpacing = 1000; 
        const gridCount = Math.ceil(totalPageHeight / gridSpacing) + 2; 
        
        for(let i = 0; i < gridCount; i++) {
            const frame = document.createElement('div');
            frame.className = 'tunnel-frame';
            const zPos = -(i * gridSpacing) + 500; 
            frame.style.transform = `translate(-50%, -50%) translate3d(0, 0, ${zPos}px)`;
            tunnelGridContainer.appendChild(frame);
        }

        validData.forEach((item, index) => {
            const { title, category, year, name, description, visuals, why, color, image, top, left} = item;

            const randomZ = (Math.random() - 0.5) * 50; 
            const zPos = START_Z - (index * Z_DISTANCE) + randomZ;
            
            const rawTop = parseFloat(top) || 50;
            const rawLeft = parseFloat(left) || 50;

            const randomX = (Math.random() - 0.5) * 5; 
            const randomY = (Math.random() - 0.5) * 5;
            
            const xOffset = ((rawLeft - 50) + randomX) * SCATTER_X / 10; 
            const yOffset = ((rawTop - 50) + randomY) * SCATTER_Y / 10;

            const relX = ((rawLeft - 50) + randomX) / 50;
            const relY = ((rawTop - 50) + randomY) / 50;

            const imgContainer = document.createElement('div');
            imgContainer.className = 'image-container';
            imgContainer.setAttribute('data-title', title || 'Untitled'); 
            
            imgContainer.style.setProperty('--rel-x', relX);
            imgContainer.style.setProperty('--rel-y', relY);

            imgContainer.style.transform = `
                translate3d(
                    calc(-50% + ${xOffset}vw), 
                    calc(-50% + ${yOffset}vh), 
                    calc(${zPos}px + (var(--mouse-y) * 200px) + var(--hover-z, 0px))
                )
            `;
            
            imgContainer.setAttribute('data-name', name || 'Unknown');
            imgContainer.setAttribute('data-category', category ? category.trim() : 'Uncategorized');
            imgContainer.setAttribute('data-year', year || 'Unknown');
            imgContainer.setAttribute('data-description', description || 'No description available.');
            imgContainer.setAttribute('data-visuals', visuals || 'Unknown');
            
            const colorCube = document.createElement('div');
            colorCube.className = 'color-cube';
            const blockColor = (color && color !== '') ? color : '#e0e0e0';
            colorCube.style.setProperty('--cube-color', blockColor);
            
            const faces = ['front', 'back', 'left', 'right', 'top', 'bottom'];
            faces.forEach(faceName => {
                const face = document.createElement('div');
                face.className = `cube-face face-${faceName}`;
                if(faceName === 'front') {
                    const infoText = document.createElement('div');
                    infoText.className = 'color-block-info';
                    let innerHTML = '';
                    if (why) innerHTML += `<div>${why}</div>`;
                    if (color) innerHTML += `<div>${color}</div>`;
                    infoText.innerHTML = innerHTML;
                    face.appendChild(infoText);
                }
                colorCube.appendChild(face);
            });

            const img = document.createElement('img');
            img.src = image.trim();
            img.alt = title || 'image';
            img.loading = "lazy";
            img.onerror = () => { imgContainer.style.display = 'none'; };

            const tempImg = new Image();
            tempImg.crossOrigin = "Anonymous";
            tempImg.src = image.trim();
            tempImg.onload = function() {
                try {
                    const dominantColor = getDominantColor(this);
                    if (dominantColor) {
                        colorCube.style.setProperty('--cube-color', dominantColor);
                    }
                } catch (e) {}
            };

            imgContainer.appendChild(colorCube);
            imgContainer.appendChild(img);
            interactiveContainer.appendChild(imgContainer);
        });

        interactiveContainer.addEventListener('click', (event) => {
            const targetContainer = event.target.closest('.image-container');
            if (targetContainer) {
                displayCenterInfo(targetContainer);
            }
        });

        centerDisplay.addEventListener('click', function(e) {
            if (e.target === this) {
                this.style.display = 'none';
            }
        });
    }

    function generateCategoryButtons(categories) {
        buttonsContainer.innerHTML = '';
        categories.sort();
        categories.forEach(cat => {
            const btn = document.createElement('button');
            btn.className = 'category-btn';
            btn.textContent = cat;
            btn.addEventListener('click', () => { toggleCategory(cat, btn); });
            buttonsContainer.appendChild(btn);
        });
    }

    function toggleCategory(category, btnElement) {
        const allItems = document.querySelectorAll('.image-container');
        const allBtns = document.querySelectorAll('.category-btn');

        if (activeCategory === category) {
            activeCategory = null;
            allBtns.forEach(b => b.classList.remove('active'));
            allItems.forEach(item => {
                item.classList.remove('highlighted');
                item.classList.remove('category-hidden');
            });
        } else {
            activeCategory = category;
            allBtns.forEach(b => b.classList.remove('active'));
            btnElement.classList.add('active');
            allItems.forEach(item => {
                const itemCat = item.getAttribute('data-category');
                if (itemCat === category) {
                    item.classList.add('highlighted');
                    item.classList.remove('category-hidden');
                } else {
                    item.classList.remove('highlighted');
                    item.classList.add('category-hidden'); 
                }
            });
        }
    }

    function renderFallbackData() {
        const baseItems = [
            { title: "Art 1", image: "https://images.unsplash.com/photo-1547891654-e66ed7ebb968?w=500", top: "20", left: "20", color: "#d4a5a5", category: "Art", why: "Shape", colorCode: "#d4a5a5" },
            { title: "Design 2", image: "https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=500", top: "80", left: "80", color: "#a5d4d4", category: "Graphic Design", why: "Texture", colorCode: "#a5d4d4" },
            { title: "Type 3", image: "https://images.unsplash.com/photo-1499781350541-7783f6c6a0c8?w=500", top: "30", left: "70", color: "#d4d4a5", category: "Typography", why: "Mood", colorCode: "#d4d4a5" },
            { title: "Art 4", image: "https://images.unsplash.com/photo-1501472312651-726afe119ff1?w=500", top: "70", left: "30", color: "#a5b4d4", category: "Art", why: "Light", colorCode: "#a5b4d4" },
            { title: "Photo 5", image: "https://images.unsplash.com/photo-1460661419201-fd4cecdf8a8b?w=500", top: "50", left: "50", color: "#d4a5c9", category: "Photography", why: "Form", colorCode: "#d4a5c9" },
        ];
        let fallbackItems = [];
        for(let i=0; i<4; i++) { 
             fallbackItems = fallbackItems.concat(baseItems.map(item => ({
                 ...item, 
                 top: Math.random() * 100, 
                 left: Math.random() * 100 
             })));
        }
        renderData(fallbackItems);
    }

    function getDominantColor(imgEl) {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        canvas.width = 50; canvas.height = 50;
        ctx.drawImage(imgEl, 0, 0, 50, 50);
        try {
            const imageData = ctx.getImageData(0, 0, 50, 50).data;
            return `rgb(${imageData[0]}, ${imageData[1]}, ${imageData[2]})`;
        } catch (e) { return null; }
    }

    function displayCenterInfo(container) {
        const title = container.getAttribute('data-title') || "Untitled";
        const imageSrc = container.querySelector('img').src || "";
        
        const html = `
            <div class="spec-sheet-container">
                <button class="close-btn" onclick="document.getElementById('center-display').style.display='none'">×</button>
                <div class="spec-image-col">
                    <img src="${imageSrc}" alt="${title}">
                </div>
                <div class="spec-info-col">
                    <h1 class="spec-title">${title}</h1>
                    <div class="spec-meta-grid">
                        <div class="spec-meta-item"><span class="label">AUTHOR</span><span class="value">${container.getAttribute('data-name')}</span></div>
                        <div class="spec-meta-item"><span class="label">CATEGORY</span><span class="value">${container.getAttribute('data-category')}</span></div>
                        <div class="spec-meta-item"><span class="label">YEAR</span><span class="value">${container.getAttribute('data-year')}</span></div>
                        <div class="spec-meta-item"><span class="label">VISUALS</span><span class="value">${container.getAttribute('data-visuals')}</span></div>
                    </div>
                    <div class="spec-description-row">
                        <div class="label-col">DESCRIPTION</div>
                        <div class="text-col">${container.getAttribute('data-description')}</div>
                    </div>
                </div>
            </div>
        `;
        centerDisplay.innerHTML = html;
        centerDisplay.style.display = 'flex';
    }
});