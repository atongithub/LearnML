# The AI Codex

A Full-Stack Educational Platform showcasing the three foundational paradigms of Machine Learning through live interactive labs.

## Architecture & Tech Stack
* **Frontend**: HTML5, CSS3, JavaScript (ES6). Features a clean "Notion-style" vertical-scrolling layout with Dark/Light mode natively supported.
* **Backend**: Python (FastAPI). Lightweight, clean microservices.
* **ML Engines**: `scikit-learn` for Clustering and Supervised Classifiers, pure Python Genetic Algorithm implementation for RL.
* **Canvas Engines**: `p5.js` (Instance Mode) for high-performance visualizations in the browser.

## Features
1. **Supervised Learning (Neural Sketchpad)**: Draw a digit (0-9) on the canvas. Uses an `sklearn` MLP trained out-of-the-box on the digits dataset to classify drawings.
2. **Unsupervised Learning (Market Plane)**: Click to scatter imaginary customers based on 2 continuous features. Use backend K-Means to identify standard clusters and shift colors.
3. **Reinforcement Learning (Apex Simulator)**: Watch an agent environment loop. A swarm of cars uses Feed-Forward Neural Networks and 5 simulated distance sensors to navigate. When they crash out, the python backend calculates the crossover/mutation and returns the next generation's weights.

## How to Run

1. **Install Dependencies**
   ```bash
   pip install -r requirements.txt
   ```
   *Note: Includes `fastapi`, `uvicorn`, `scikit-learn`, `numpy`, and `pillow`.*

2. **Start the API & Web Server**
   ```bash
   python main.py
   ```
   *The very first run will take ~3-5 seconds longer to train the digit classification MLP locally!*

3. **Open the Platform**
   Navigate to [http://localhost:8000](http://localhost:8000)

## Design Notes
* Custom CSS variables for instant `.dark-mode` toggling.
* `fetchAPI` wrappers provide generic error handling and trigger `toast-container` messages and a global loading spinner.
* Handled CORS on the backend natively via FastAPI.
