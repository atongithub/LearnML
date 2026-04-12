const clusteringCanvas = document.getElementById('clustering-canvas');
const ctx = clusteringCanvas.getContext('2d');
let points = [];
let k = 3;
let centroids = [];

const clusterColors = [
    '#3b82f6', // blue
    '#8b5cf6', // violet
    '#ec4899', // pink
    '#10b981', // emerald
    '#f59e0b', // amber
    '#ef4444', // red
    '#06b6d4'  // cyan
];

function resizeCanvas() {
    // If the window resizes, we might want to scale, but for simplicity it's fixed 600x400
    // So no explicit resize logic required for basic functionality.
}
window.addEventListener('resize', resizeCanvas);

// Add stars on click
clusteringCanvas.addEventListener('click', (e) => {
    const rect = clusteringCanvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    points.push({x, y, cluster: -1});
    
    updateAnalytics();
    drawSpace();
});

// Clear canvas
document.getElementById('clear-clusters').addEventListener('click', () => {
    points = [];
    centroids = [];
    drawSpace();
    updateAnalytics();
});

// Run Algorithm
document.getElementById('run-kmeans').addEventListener('click', () => {
    const kInput = document.getElementById('k-value');
    k = parseInt(kInput.value);
    runKMeans();
});

function runKMeans() {
    if(points.length === 0) return;
    if(points.length < k) k = points.length;
    
    // Initialize centroids using random existing points
    centroids = [];
    let usedIndices = new Set();
    while(centroids.length < k) {
        let idx = Math.floor(Math.random() * points.length);
        if(!usedIndices.has(idx)) {
            usedIndices.add(idx);
            centroids.push({x: points[idx].x, y: points[idx].y});
        }
    }
    
    let iterations = 0;
    let changed = true;
    
    while(changed && iterations < 50) {
        changed = false;
        
        // Assign points to closest centroid
        for(let i=0; i<points.length; i++) {
            let p = points[i];
            let minDist = Infinity;
            let closest = -1;
            
            for(let j=0; j<centroids.length; j++) {
                let dist = Math.hypot(p.x - centroids[j].x, p.y - centroids[j].y);
                if(dist < minDist) {
                    minDist = dist;
                    closest = j;
                }
            }
            
            if(p.cluster !== closest) {
                p.cluster = closest;
                changed = true;
            }
        }
        
        // Update centroids
        let sums = Array(k).fill(0).map(() => ({x:0, y:0, count:0}));
        for(let p of points) {
            if(p.cluster !== -1) {
                sums[p.cluster].x += p.x;
                sums[p.cluster].y += p.y;
                sums[p.cluster].count++;
            }
        }
        
        for(let j=0; j<k; j++) {
            if(sums[j].count > 0) {
                centroids[j].x = sums[j].x / sums[j].count;
                centroids[j].y = sums[j].y / sums[j].count;
            }
        }
        
        iterations++;
    }
    
    drawSpace();
}

function hexToRgba(hex, alpha) {
    let r = parseInt(hex.slice(1, 3), 16),
        g = parseInt(hex.slice(3, 5), 16),
        b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function drawSpace() {
    ctx.clearRect(0, 0, clusteringCanvas.width, clusteringCanvas.height);
    
    // Draw glowing perimeters for clusters
    if(centroids.length > 0) {
        for(let j=0; j<k; j++) {
            let clusterPts = points.filter(p => p.cluster === j);
            if(clusterPts.length === 0) continue;
            
            // Find radius to enclose points
            let maxD = 0;
            for(let p of clusterPts) {
                let d = Math.hypot(p.x - centroids[j].x, p.y - centroids[j].y);
                if(d > maxD) maxD = d;
            }
            
            let rad = maxD + 25; // padding
            
            ctx.beginPath();
            ctx.arc(centroids[j].x, centroids[j].y, rad, 0, Math.PI * 2);
            let color = clusterColors[j % clusterColors.length];
            ctx.fillStyle = hexToRgba(color, 0.1);
            ctx.fill();
            
            ctx.strokeStyle = color;
            ctx.lineWidth = 2;
            ctx.shadowBlur = 20;
            ctx.shadowColor = color;
            ctx.stroke();
            ctx.shadowBlur = 0; // reset
        }
    }
    
    // Draw Points
    for(let p of points) {
        ctx.beginPath();
        ctx.arc(p.x, p.y, 5, 0, Math.PI * 2);
        
        if(p.cluster !== -1) {
            let color = clusterColors[p.cluster % clusterColors.length];
            ctx.fillStyle = color;
            ctx.shadowBlur = 10;
            ctx.shadowColor = color;
        } else {
            ctx.fillStyle = '#94a3b8';
            ctx.shadowBlur = 0;
            ctx.shadowColor = 'transparent';
        }
        
        ctx.fill();
        ctx.shadowBlur = 0;
    }
    
    // Draw centroids as distinct marks if computed
    if(centroids.length > 0) {
        for(let j=0; j<centroids.length; j++) {
            ctx.beginPath();
            ctx.arc(centroids[j].x, centroids[j].y, 3, 0, Math.PI*2);
            ctx.fillStyle = '#fff';
            ctx.fill();
            ctx.strokeStyle = '#000';
            ctx.stroke();
        }
    }
}

function updateAnalytics() {
    const totalStars = document.getElementById('stat-total-stars');
    if(totalStars) totalStars.textContent = points.length;
}

// Initial draw
drawSpace();
