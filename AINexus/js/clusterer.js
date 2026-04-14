// js/clusterer.js

const clustererConfig = (p) => {
    let points = [];
    let labels = [];
    let centroids = [];
    
    // Core Cyberpunk Colors
    const colors = [
        [0, 255, 255], // Cyan
        [255, 0, 255], // Magenta
        [0, 255, 0]    // Green
    ];

    p.setup = () => {
        p.createCanvas(320, 320);
        p.background(10, 10, 25);
        
        document.getElementById('clear-clusters-btn').addEventListener('click', () => {
            points = [];
            labels = [];
            centroids = [];
            p.background(10, 10, 25);
        });

        document.getElementById('run-kmeans-btn').addEventListener('click', async () => {
            if (points.length < 3) {
                showToast("Need at least 3 nodes to cluster!", "error");
                return;
            }
            
            try {
                // Send points to backend
                const response = await fetchAPI('/api/cluster/stars', { points: points });
                labels = response.labels;
                centroids = response.centroids;
                
                // Draw Voronoi after receiving centroids
                drawVoronoi();
                showToast("K-Means clustering complete!", "success");
            } catch (err) {
                // handled by fetchAPI
            }
        });
    };

    function drawVoronoi() {
        if (centroids.length === 0) return;
        
        p.loadPixels();
        for (let x = 0; x < p.width; x++) {
            for (let y = 0; y < p.height; y++) {
                let closestDist = Infinity;
                let closestIdx = -1;
                
                for (let i = 0; i < centroids.length; i++) {
                    let d = p.dist(x, y, centroids[i][0], centroids[i][1]);
                    if (d < closestDist) {
                        closestDist = d;
                        closestIdx = i;
                    }
                }
                
                let col = colors[closestIdx % colors.length];
                let index = (x + y * p.width) * 4;
                
                p.pixels[index] = col[0] / 3;     // R (dimmed for background)
                p.pixels[index + 1] = col[1] / 3; // G
                p.pixels[index + 2] = col[2] / 3; // B
                p.pixels[index + 3] = 255;        // Alpha
            }
        }
        p.updatePixels();
    }

    p.draw = () => {
        // Redraw only points and centroids over the pre-drawn Voronoi background
        // Background is already drawn once in drawVoronoi or setup
        if (centroids.length === 0) {
            p.background(10, 10, 25);
        }
        
        p.strokeWeight(1);
        
        // Draw points
        for (let i = 0; i < points.length; i++) {
            let col = p.color(200); // Default gray-ish
            if (labels.length > 0 && labels[i] !== undefined) {
                let colorIdx = labels[i] % colors.length;
                col = p.color(colors[colorIdx][0], colors[colorIdx][1], colors[colorIdx][2]);
            }
            
            p.fill(col);
            p.stroke(255); // white ring
            p.circle(points[i][0], points[i][1], 10);
        }
        
        // Draw centroids as glowing squares
        for (let i = 0; i < centroids.length; i++) {
            let colorIdx = i % colors.length;
            p.fill(colors[colorIdx][0], colors[colorIdx][1], colors[colorIdx][2], 150);
            p.stroke(255);
            p.strokeWeight(2);
            p.rectMode(p.CENTER);
            p.rect(centroids[i][0], centroids[i][1], 16, 16);
            
            // Inner core
            p.noStroke();
            p.fill(255);
            p.rect(centroids[i][0], centroids[i][1], 6, 6);
        }
        p.rectMode(p.CORNER);
    };

    p.mousePressed = () => {
        if (p.mouseX >= 0 && p.mouseX <= p.width && p.mouseY >= 0 && p.mouseY <= p.height) {
            points.push([p.mouseX, p.mouseY]);
            // Re-render points without wiping Voronoi... wait, adding a new point resets clusters!
            labels = [];
            centroids = [];
            p.background(10, 10, 25); // clear Voronoi map
        }
    };
};

new p5(clustererConfig, 'cluster-container');
