// js/racer.js

const racerConfig = (p) => {
    // Standard Sigmoid Activation Function
    // This maps any real-valued number into a value between 0 and 1
    function sigmoid(x) {
        return 1 / (1 + Math.exp(-x));
    }

    // Multi-Dimensional Generic Feed-Forward Neural Network
    // Responsible for computing actions based on the weights given
    class NeuralNetwork {
        constructor(shape, weights = null) {
            this.shape = shape;
            this.size = shape.length;
            this.weights = [];

            if (weights) {
                this.weights = weights;
            } else {
                for (let i = 1; i < this.size; i++) {
                    let rows = this.shape[i-1];
                    let cols = this.shape[i];
                    let layer = [];
                    for (let r = 0; r < rows; r++) {
                        let row = [];
                        for (let c = 0; c < cols; c++) {
                            row.push(Math.random() - 0.5);
                        }
                        layer.push(row);
                    }
                    this.weights.push(layer);
                }
            }
        }

        predict(inp) {
            let layer = [...inp];
            for (let i = 0; i < this.size - 1; i++) {
                let nextLayer = new Array(this.shape[i+1]).fill(0);
                let currentWeights = this.weights[i];
                
                for (let outNode = 0; outNode < this.shape[i+1]; outNode++) {
                    let sum = 0;
                    for (let inNode = 0; inNode < this.shape[i]; inNode++) {
                        sum += layer[inNode] * currentWeights[inNode][outNode];
                    }
                    nextLayer[outNode] = sum;
                }
                
                for (let ind = 0; ind < nextLayer.length; ind++) {
                    nextLayer[ind] = sigmoid(nextLayer[ind]);
                }
                layer = nextLayer;
            }
            return layer;
        }
    }

    class Car {
        constructor(startX, startY, startAngle, weights = null) {
            this.x = startX;
            this.y = startY;
            this.angle = startAngle;
            this.speed = 0;
            this.maxSpeed = 8;
            this.alive = true;
            this.score = 0; 
            
            // Explicit network architecture config:
            // 6 explicit input layer options, two hidden layers (4 and 3 nodes each), 2 output nodes (turning, acceleration)
            this.brain = new NeuralNetwork([6, 4, 3, 2], weights);
            
            // Base 5 angle positions for radar measurements mapping around car parameters
            // Coordinate points define offset ray limits around vehicle structure
            this.sensorAngles = [
                Math.atan2(-140, 25),
                Math.atan2(-100, 190),
                0,
                Math.atan2(100, 190),
                Math.atan2(140, 25)
            ];
            this.sensorLengths = [
                Math.hypot(25, -140),
                Math.hypot(190, -100),
                300,
                Math.hypot(190, 100),
                Math.hypot(25, 140)
            ];
            this.sensorReadings = [0, 0, 0, 0, 0];
            
            this.history = [];
        }

        update(trackInner, trackOuter) {
            if (!this.alive) return;
            
            // Store trace
            if (p.frameCount % 2 === 0) {
                this.history.push({x: this.x, y: this.y});
                if (this.history.length > 20) this.history.shift();
            }

            // Move based on speed and angle
            this.x += Math.cos(this.angle) * this.speed;
            this.y += Math.sin(this.angle) * this.speed;
            
            // Fitness Function: (Distance * 10) + (Speed * 100)
            if (this.speed > 0) {
                this.score += (this.speed * 100) + 10;
            } else {
                this.score -= 50;
            }

            // Check collision with strict elimination
            let distToCenter = p.dist(this.x, this.y, p.width/2, p.height/2);
            if (distToCenter < trackInner || distToCenter > trackOuter) {
                this.alive = false;
                return;
            }

            // Raycasting
            for (let i=0; i<this.sensorAngles.length; i++) {
                let absAngle = this.angle + this.sensorAngles[i];
                let rayX = this.x;
                let rayY = this.y;
                let reading = 0;
                let maxLen = this.sensorLengths[i];
                while (reading < maxLen) {
                    rayX += Math.cos(absAngle) * 5;
                    rayY += Math.sin(absAngle) * 5;
                    let d = p.dist(rayX, rayY, p.width/2, p.height/2);
                    if (d < trackInner || d > trackOuter) {
                        break;
                    }
                    reading += 5;
                }
                this.sensorReadings[i] = reading / maxLen;
            }

            // Neural Net decision
            let normalizedSpeed = this.speed / this.maxSpeed;
            let inputs = [...this.sensorReadings, normalizedSpeed];
            let decision = this.brain.predict(inputs);
            
            // Re-scale the 0-1 outputs from Sigmoid into standard metrics
            // Index 0 adjusts steering direction, mapping to a full rotation max scalar
            let steer = (decision[0] - 0.5) * 2 * (4 * Math.PI / 180); 
            // Index 1 controls forward thrust or acceleration output
            let acc = decision[1] * 1; 
            
            this.angle += steer;
            this.speed += acc; 
            
            // Standard simulated physics variables for drag and environment friction 
            this.speed *= 0.95; 
            if (this.speed > this.maxSpeed) this.speed = this.maxSpeed;
            if (this.speed < -2) this.speed = -2;
        }

        draw(isLeader) {
            p.push();
            
            // Draw glowing trail if leader
            if (isLeader && this.alive) {
                p.noFill();
                p.strokeWeight(4);
                
                for (let i = 0; i < this.history.length - 1; i++) {
                    p.stroke(138, 43, 226, p.map(i, 0, this.history.length, 0, 255)); 
                    p.line(this.history[i].x, this.history[i].y, this.history[i+1].x, this.history[i+1].y);
                }
            }

            p.translate(this.x, this.y);
            p.rotate(this.angle);
            
            if (this.alive) {
                p.fill(0, 255, 255); 
                p.stroke(isLeader ? p.color(138, 43, 226) : p.color(255));
                p.strokeWeight(isLeader ? 2 : 1);
                
                p.stroke(0, 255, 255, isLeader ? 150 : 50);
                p.strokeWeight(1);
                for (let i=0; i<this.sensorAngles.length; i++) {
                    let len = this.sensorReadings[i] * this.sensorLengths[i];
                    p.line(0, 0, Math.cos(this.sensorAngles[i]) * len, Math.sin(this.sensorAngles[i]) * len);
                }
            } else {
                p.fill(255, 0, 0, 100); 
            }
            
            p.noStroke();
            p.rectMode(p.CENTER);
            if (isLeader && this.alive) {
                p.fill(138, 43, 226);
                p.rect(0, 0, 20, 14);
                p.fill(0, 255, 255);
            }
            p.rect(0, 0, 16, 10);
            
            p.pop();
        }
    }

    let cars = [];
    // Number of agent instances generated per simulation population epoch
    let popSize = 40; 
    let trackInner = 70;
    let trackOuter = 150;
    let generation = 1;
    let evolving = false;
    let epochCounter = 0;
    const maxEpochs = 1200; // 30 seconds at 40fps 

    function initPopulation(weightsArray = null) {
        cars = [];
        let startAngle = 0;
        let startX = p.width / 2;
        let startY = p.height / 2 - (trackInner + trackOuter) / 2;
        epochCounter = 0;
        
        for (let i = 0; i < popSize; i++) {
            let weights = weightsArray ? weightsArray[i].weights : null;
            cars.push(new Car(startX, startY, startAngle, weights));
        }
    }

    p.setup = () => {
        p.createCanvas(340, 340);
        initPopulation();
        
        document.getElementById('restart-evo-btn').addEventListener('click', () => {
            generation = 1;
            document.getElementById('rl-generation').innerText = `Gen: ${generation}`;
            initPopulation();
            showToast("System Reset to Gen.01", "success");
        });
    };

    p.draw = () => {
        p.background(10, 10, 25); 
        p.translate(p.width/2, p.height/2);

        p.fill(0, 255, 255, 20);
        p.noStroke();
        p.circle(0, 0, trackOuter * 2 + 10);
        
        p.fill(20, 20, 40); 
        p.stroke(0, 255, 255); 
        p.strokeWeight(2);
        p.circle(0, 0, trackOuter * 2);
        
        p.fill(10, 10, 25); 
        p.stroke(0, 255, 255);
        p.circle(0, 0, trackInner * 2);

        p.translate(-p.width/2, -p.height/2);

        if (evolving) {
            p.fill(255);
            p.textAlign(p.CENTER, p.CENTER);
            p.text("EVOLVING MODEL...", p.width/2, p.height/2);
            return;
        }

        let allDead = true;
        let leaderIndex = -1;
        let bestScore = -Infinity;
        
        for (let i = 0; i < cars.length; i++) {
            if (cars[i].score > bestScore) {
                bestScore = cars[i].score;
                leaderIndex = i;
            }
            if (cars[i].alive) allDead = false;
        }

        epochCounter++;
        
        for (let i = 0; i < cars.length; i++) {
            cars[i].update(trackInner, trackOuter);
            if (!cars[i].alive) {
                cars[i].draw(false);
            }
        }
        
        for (let i = 0; i < cars.length; i++) {
            if (cars[i].alive && i !== leaderIndex) {
                cars[i].draw(false);
            }
        }
        
        if (leaderIndex !== -1) {
            cars[leaderIndex].draw(true);
        }

        if (allDead || epochCounter > maxEpochs) {
            evolveNextGen();
        }
    };

    async function evolveNextGen() {
        evolving = true;
        
        // Preparing generation dataset: mapping agent performance and inverse distancing bounds to pass array matrix 
        let reqData = {
            generation: generation,
            results: cars.map(c => ({
                score: c.score,
                dist: -c.score, // Visualizer lacks discrete checkpoints, inverted score provides fallback tracking
                weights: c.brain.weights
            }))
        };

        try {
            console.log("Transmitting Gen " + generation + " data...");
            const response = await fetchAPI('/api/evolve/f1', reqData, false);
            
            generation++;
            let tag = document.getElementById('rl-generation');
            tag.innerText = `Gen: ${generation}`;
            
            tag.style.boxShadow = "0 0 10px #8a2be2";
            setTimeout(() => tag.style.boxShadow = "0 0 5px #8a2be2", 300);

            initPopulation(response.next_generation);
        } catch (err) {
            console.error(err);
            initPopulation(); 
        }
        
        evolving = false;
    }
};

new p5(racerConfig, 'rl-container');