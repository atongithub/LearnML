const supervisedSketch = (p) => {
    let canvas;
    let isDrawing = false;
    let path = [];
    let knnData = []; 
    
    p.setup = () => {
        canvas = p.createCanvas(500, 400);
        canvas.parent('supervised-canvas-container');
        generateTrainingData(); 
        
        document.getElementById('clear-sketch').addEventListener('click', () => {
            path = [];
            p.background(248, 250, 252);
            updateConfidenceBars([0,0,0]);
            document.getElementById('stat-top-pred').innerText = "--";
        });
        
        p.background(248, 250, 252);
    };

    p.draw = () => {
        // Redraw path
        p.background(248, 250, 252);
        p.stroke(59, 130, 246);
        p.strokeWeight(12);
        p.strokeJoin(p.ROUND);
        p.noFill();
        
        // Draw trace
        p.beginShape();
        for (let pt of path) {
            p.vertex(pt.x, pt.y);
        }
        p.endShape();
        
        // Handle drawing
        if (p.mouseIsPressed && p.mouseX >= 0 && p.mouseX <= p.width && p.mouseY >= 0 && p.mouseY <= p.height) {
            path.push({x: p.mouseX, y: p.mouseY});
            isDrawing = true;
        } else if (isDrawing) {
            isDrawing = false;
            // Finish stroke, trigger predict
            if (path.length > 20) predictShape();
        }
    };
    
    function predictShape() {
        let minX = p.width, maxX = 0, minY = p.height, maxY = 0;
        for(let pt of path) {
            if(pt.x < minX) minX = pt.x;
            if(pt.x > maxX) maxX = pt.x;
            if(pt.y < minY) minY = pt.y;
            if(pt.y > maxY) maxY = pt.y;
        }
        
        let w = maxX - minX;
        let h = maxY - minY;
        if(w < 20 || h < 20) return; // Too small to guess accurately
        
        let features = extractFeatures(path, minX, maxX, minY, maxY, 8);
        
        let distances = [];
        for(let data of knnData) {
            let dist = getDist(features, data.vector);
            distances.push({label: data.label, dist: dist});
        }
        
        distances.sort((a, b) => a.dist - b.dist);
        let kTop = distances.slice(0, 5); // K = 5
        
        let votes = { 'Circle': 0, 'Square': 0, 'Triangle': 0 };
        for(let v of kTop) {
            votes[v.label] += 1 / (v.dist + 1e-6); 
        }
        
        let total = votes['Circle'] + votes['Square'] + votes['Triangle'];
        if(total > 0) {
            let confCircle = (votes['Circle'] / total) * 100;
            let confSquare = (votes['Square'] / total) * 100;
            let confTriangle = (votes['Triangle'] / total) * 100;
            updateConfidenceBars([confCircle, confSquare, confTriangle]);
        }
    }
    
    function updateConfidenceBars(confidences) {
        document.getElementById('bar-circle').style.width = confidences[0] + "%";
        document.getElementById('val-circle').innerText = Math.round(confidences[0]) + "%";
        
        document.getElementById('bar-square').style.width = confidences[1] + "%";
        document.getElementById('val-square').innerText = Math.round(confidences[1]) + "%";
        
        document.getElementById('bar-triangle').style.width = confidences[2] + "%";
        document.getElementById('val-triangle').innerText = Math.round(confidences[2]) + "%";
        
        let labels = ["Circle", "Square", "Triangle"];
        let maxIdx = 0;
        let maxVal = confidences[0];
        for(let i=1; i<3; i++) {
            if(confidences[i] > maxVal) { maxVal = confidences[i]; maxIdx = i; }
        }
        
        document.getElementById('stat-top-pred').innerText = maxVal > 40 ? labels[maxIdx] : "--";
        document.getElementById('stat-model-status').innerText = "Processing...";
        
        setTimeout(() => {
            document.getElementById('stat-model-status').innerText = "Ready";
        }, 800);
    }
    
    // Convert array of x,y points into a low-resolution pixel density grid
    function extractFeatures(pts, minX, maxX, minY, maxY, gridSize = 8) {
        let grid = new Array(gridSize * gridSize).fill(0);
        let spanX = maxX - minX;
        let spanY = maxY - minY;
        
        for(let pt of pts) {
            let normX = (pt.x - minX) / spanX; 
            let normY = (pt.y - minY) / spanY;
            
            if (normX >= 1) normX = 0.999;
            if (normY >= 1) normY = 0.999;

            let col = Math.floor(normX * gridSize);
            let row = Math.floor(normY * gridSize);
            grid[row * gridSize + col] += 1;
        }
        
        let maxVal = Math.max(...grid);
        if(maxVal > 0) {
            for(let i=0; i<grid.length; i++) grid[i] /= maxVal;
        }
        return grid;
    }
    
    function getDist(v1, v2) {
        let sum = 0;
        for(let i=0; i<v1.length; i++) {
            sum += Math.pow(v1[i] - v2[i], 2);
        }
        return Math.sqrt(sum);
    }
    
    function generateTrainingData() {
        const createPoints = (genFunc) => {
            let pts = [];
            for(let i=0; i<80; i++) pts.push(genFunc(i/80));
            return pts;
        };

        for(let m=0; m<30; m++) { 
            let noise = () => (Math.random() - 0.5) * 15;
            
            // Circle
            let circ = createPoints(t => {
                let ang = t * Math.PI * 2;
                return {x: 200 + Math.cos(ang)*100 + noise(), y: 200 + Math.sin(ang)*100 + noise()};
            });
            knnData.push({
                label: 'Circle',
                vector: extractFeatures(circ, Math.min(...circ.map(p=>p.x)), Math.max(...circ.map(p=>p.x)), Math.min(...circ.map(p=>p.y)), Math.max(...circ.map(p=>p.y)))
            });
            
            // Square
            let sq = createPoints(t => {
                let x, y;
                if(t<0.25) {x=100 + t*4*200; y=100;} 
                else if(t<0.5) {x=300; y=100 + (t-0.25)*4*200;} 
                else if(t<0.75) {x=300 - (t-0.5)*4*200; y=300;} 
                else {x=100; y=300 - (t-0.75)*4*200;} 
                return {x: x + noise(), y: y + noise()};
            });
            knnData.push({
                label: 'Square',
                vector: extractFeatures(sq, Math.min(...sq.map(p=>p.x)), Math.max(...sq.map(p=>p.x)), Math.min(...sq.map(p=>p.y)), Math.max(...sq.map(p=>p.y)))
            });
            
            // Triangle
            let tri = createPoints(t => {
                let x, y;
                if(t<0.33) {x=200 - t*3*100; y=100 + t*3*200;} 
                else if(t<0.66) {x=100 + (t-0.33)*3*200; y=300;} 
                else {x=300 - (t-0.66)*3*100; y=300 - (t-0.66)*3*200;} 
                return {x: x + noise(), y: y + noise()};
            });
            knnData.push({
                label: 'Triangle',
                vector: extractFeatures(tri, Math.min(...tri.map(p=>p.x)), Math.max(...tri.map(p=>p.x)), Math.min(...tri.map(p=>p.y)), Math.max(...tri.map(p=>p.y)))
            });
        }
    }
};

new p5(supervisedSketch);
