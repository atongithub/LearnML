// js/sketchpad.js

const sketchpadConfig = (p) => {
    let painting = false;
    let classifier;
    
    p.setup = () => {
        p.createCanvas(280, 280);
        p.background(10, 10, 25); // match cyber dark theme
        p.strokeWeight(12);
        p.stroke(0, 255, 255); // neon cyan trace
        
        // Initialize KNN
        classifier = knnClassifier.create();

        // Buttons
        document.getElementById('clear-sketch-btn').addEventListener('click', () => {
            p.background(10, 10, 25);
            classifier.clearAllClasses();
            updateResult('Cache Purged. Model Empty.');
        });

        document.getElementById('train-circle-btn').addEventListener('click', () => train('Circle'));
        document.getElementById('train-triangle-btn').addEventListener('click', () => train('Triangle'));
        document.getElementById('train-square-btn').addEventListener('click', () => train('Square'));
    };

    p.draw = () => {
        if (painting) {
            // glow effect for drawing stroke
            p.stroke(0, 255, 255, 100);
            p.strokeWeight(16);
            p.line(p.pmouseX, p.pmouseY, p.mouseX, p.mouseY);
            
            p.stroke(255);
            p.strokeWeight(8);
            p.line(p.pmouseX, p.pmouseY, p.mouseX, p.mouseY);
            
            // core stroke
            p.stroke(0, 255, 255);
        }
    };

    p.mousePressed = () => {
        if (p.mouseX >= 0 && p.mouseX <= p.width && p.mouseY >= 0 && p.mouseY <= p.height) {
            painting = true;
        }
    };

    p.mouseReleased = () => {
        if (painting) {
            painting = false;
            predictShape();
        }
    };
    
    p.mouseDragged = () => {
        return false; // prevent scrolling
    };

    function getCanvasTensor() {
        const canvasElement = document.querySelector('#sketch-container canvas');
        
        // 1. Isolate drawing bounding box for scale/translation invariance
        const ctx = canvasElement.getContext('2d', { willReadFrequently: true });
        const imgData = ctx.getImageData(0, 0, canvasElement.width, canvasElement.height);
        const data = imgData.data;
        let minX = canvasElement.width, minY = canvasElement.height, maxX = 0, maxY = 0;
        let hasPixels = false;
        
        for (let y = 0; y < canvasElement.height; y++) {
            for (let x = 0; x < canvasElement.width; x++) {
                const i = (y * canvasElement.width + x) * 4;
                // Green channel (>50 signifies drawn neon cyan trace)
                if (data[i+1] > 50) { 
                    if (x < minX) minX = x;
                    if (x > maxX) maxX = x;
                    if (y < minY) minY = y;
                    if (y > maxY) maxY = y;
                    hasPixels = true;
                }
            }
        }

        return tf.tidy(() => {
            if (!hasPixels) {
                return tf.zeros([32 * 32]).flatten();
            }

            // Extract just the drawn bounding box region with slight padding
            const pad = 10;
            minX = Math.max(0, minX - pad);
            minY = Math.max(0, minY - pad);
            maxX = Math.min(canvasElement.width, maxX + pad);
            maxY = Math.min(canvasElement.height, maxY + pad);
            
            const w = maxX - minX;
            const h = maxY - minY;

            const img = tf.browser.fromPixels(canvasElement, 1);
            const cropped = tf.slice(img, [minY, minX, 0], [h, w, 1]);
            
            // Resize always limits drawing to exactly 32x32 footprint!
            const resized = tf.image.resizeBilinear(cropped, [32, 32]);
            const normalized = resized.div(255.0);
            return normalized.flatten();
        });
    }

    function train(label) {
        const tensor = getCanvasTensor();
        classifier.addExample(tensor, label);
        tensor.dispose();
        
        updateResult(`Learned Node: ${label}`);
        // Clear quickly so user can draw or predict right away
        setTimeout(() => p.background(10, 10, 25), 400);
    }

    async function predictShape() {
        const classCount = classifier.getClassExampleCount();
        const total = classCount ? Object.values(classCount).reduce((a, b) => a + b, 0) : 0;

        if (total > 0) {
            const tensor = getCanvasTensor();
            try {
                // Compute dynamic K value for realistic confidence
                const k = Math.min(3, total);
                const res = await classifier.predictClass(tensor, k); 
                const conf = (res.confidences[res.label] * 100).toFixed(1);
                
                const resultDiv = document.getElementById('sketch-result');
                resultDiv.innerText = `Prediction: ${res.label} (${conf}%)`;
                
                // Color formatting based on neon classes
                const colors = {
                    'Circle': '#0ff', // cyan
                    'Triangle': '#f0f', // magenta
                    'Square': '#0f0' // green
                };
                
                resultDiv.style.color = colors[res.label];
                resultDiv.style.textShadow = `0 0 10px ${colors[res.label]}`;

            } catch (err) {
                console.error(err);
            } finally {
                tensor.dispose();
            }
        } else {
            updateResult('Awaiting Training Data...');
        }
    }

    function updateResult(msg) {
        const rs = document.getElementById('sketch-result');
        rs.innerText = msg;
        rs.style.color = 'var(--text-primary)';
        rs.style.textShadow = 'none';
    }
};

new p5(sketchpadConfig, 'sketch-container');
