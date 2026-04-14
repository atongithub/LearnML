// Core application logic to handle routing and generic API requests

// State Enum
const DEMOS = {
    SKETCHPAD: 'sketchpad',
    CLUSTERER: 'clusterer',
    RACER: 'racer'
};

let currentDemo = DEMOS.SKETCHPAD;
const API_BASE = "http://127.0.0.1:8000/api";

document.addEventListener("DOMContentLoaded", () => {
    // Nav handlers
    const navButtons = document.querySelectorAll('.nav-btn');
    
    navButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            // Update active state
            navButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            
            const target = btn.getAttribute('data-target');
            switchDemo(target);
        });
    });

    // Initialize first demo setup
    switchDemo(DEMOS.SKETCHPAD);
});

function switchDemo(target) {
    currentDemo = target;
    const titleObj = document.getElementById("current-lab-title");
    const controlsContainer = document.getElementById("top-controls");
    const resultsArea = document.getElementById("results-area");
    
    // Clear the p5 canvas (it will be recreated by each demo script if active)
    document.getElementById("canvas-wrapper").innerHTML = "";
    
    controlsContainer.innerHTML = "";
    resultsArea.innerHTML = "<p>Waiting for model output...</p>";
    
    if(target === DEMOS.SKETCHPAD) {
        titleObj.innerText = "The Neural Sketchpad (Supervised Learning)";
        
        const clearBtn = document.createElement("button");
        clearBtn.className = "action-btn";
        clearBtn.innerText = "Clear Canvas";
        clearBtn.onclick = () => { if(window.sketchpadAPI) window.sketchpadAPI.clear() };
        
        const predBtn = document.createElement("button");
        predBtn.className = "action-btn predict";
        predBtn.innerText = "Predict Object!";
        predBtn.onclick = () => { if(window.sketchpadAPI) window.sketchpadAPI.predict() };
        
        controlsContainer.appendChild(clearBtn);
        controlsContainer.appendChild(predBtn);
        
        // Boot p5 instance for sketchpad
        if (window.initSketchpad) window.initSketchpad();
        
    } else if(target === DEMOS.CLUSTERER) {
        titleObj.innerText = "The Star Clusterer (Unsupervised Learning)";
        
        const clearBtn = document.createElement("button");
        clearBtn.className = "action-btn";
        clearBtn.innerText = "Clear Galaxy";
        clearBtn.onclick = () => { if(window.clustererAPI) window.clustererAPI.clear() };
        
        controlsContainer.appendChild(clearBtn);
        
        if (window.initClusterer) window.initClusterer();

    } else if (target === DEMOS.RACER) {
        titleObj.innerText = "The F1 Neuro-Racer (Reinforcement Learning)";
        
        const resetBtn = document.createElement("button");
        resetBtn.className = "action-btn";
        resetBtn.innerText = "Restart Generation";
        resetBtn.onclick = () => { if(window.racerAPI) window.racerAPI.reset() };
        
        controlsContainer.appendChild(resetBtn);

        if (window.initRacer) window.initRacer();
    }
}

// Utility to make API calls wrapped in try/catch safely
async function apiCall(endpoint, data) {
    try {
        const response = await fetch(`${API_BASE}${endpoint}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data)
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        return await response.json();
    } catch (error) {
        console.error("API Call Failed:", error);
        return { error: error.message };
    }
}
