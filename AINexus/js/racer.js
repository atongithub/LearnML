// js/racer.js

const racerConfig = (p) => {
    // Simple FFNN class for the car
    class FFNN {
        constructor(weights = null) {
            this.inputs = 5;
            this.hidden = 6;
            this.outputs = 2;
            
            // Total weights = (5*6 + 6 biases) + (6*2 + 2 biases) = 36 + 14 = 50
            this.totalWeights = 50;
            
            if (weights && weights.length === this.totalWeights) {
                this.weights = weights;
            } else {
                this.weights = Array.from({length: this.totalWeights}, () => (Math.random() * 2) - 1);
            }
        }
        
        predict(inputs) {
            let idx = 0;
            let hiddenVals = [];
            // Hidden layer
            for (let i = 0; i < this.hidden; i++) {
                let sum = 0;
                for (let j = 0; j < this.inputs; j++) {
                    sum += inputs[j] * this.weights[idx++];
                }
                sum += this.weights[idx++]; // bias
                hiddenVals.push(Math.max(0, sum)); // ReLU
            }
            
            let outputsVals = [];
            // Output layer
            for (let i = 0; i < this.outputs; i++) {
                let sum = 0;
                for (let j = 0; j < this.hidden; j++) {
                    sum += hiddenVals[j] * this.weights[idx++];
                }
                sum += this.weights[idx++]; // bias
                outputsVals.push(Math.tanh(sum)); // -1 to 1
            }
            return outputsVals; // [steer, accelerate/brake]
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
            this.score = 0; // Fitness
            
            this.brain = new FFNN(weights);
            
            // 5 sensors: 0, 22.5, -22.5, 45, -45 degrees
            this.sensorAngles = [0, Math.PI/8, -Math.PI/8, Math.PI/4, -Math.PI/4];
            this.sensorReadings = [0, 0, 0, 0, 0];
            
            // For glowing trail
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
            // Distance approximated by just speed accumulated, as long as it's moving forward
            // Penalty for backwards driving
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
                let maxLen = 120;
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
            let decision = this.brain.predict(this.sensorReadings);
            
            let steer = decision[0] * 0.15; // Steering force
            let acc = decision[1] * 0.8;   // Acceleration force
            
            this.angle += steer;
            this.speed += acc; // Momentum
            
            // Friction and drag
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
                    p.stroke(138, 43, 226, p.map(i, 0, this.history.length, 0, 255)); // purple neon
                    p.line(this.history[i].x, this.history[i].y, this.history[i+1].x, this.history[i+1].y);
                }
            }

            p.translate(this.x, this.y);
            p.rotate(this.angle);
            
            if (this.alive) {
                p.fill(0, 255, 255); // Cyan body
                p.stroke(isLeader ? p.color(138, 43, 226) : p.color(255));
                p.strokeWeight(isLeader ? 2 : 1);
                
                // Draw sensors for all alive cars with opacity
                p.stroke(0, 255, 255, isLeader ? 150 : 50);
                p.strokeWeight(1);
                for (let i=0; i<this.sensorAngles.length; i++) {
                    let len = this.sensorReadings[i] * 120;
                    p.line(0, 0, Math.cos(this.sensorAngles[i]) * len, Math.sin(this.sensorAngles[i]) * len);
                }
            } else {
                p.fill(255, 0, 0, 100); // Dead red
            }
            
            p.noStroke();
            p.rectMode(p.CENTER);
            if (isLeader && this.alive) {
                // Glow body for leader
                p.fill(138, 43, 226);
                p.rect(0, 0, 20, 14);
                p.fill(0, 255, 255);
            }
            p.rect(0, 0, 16, 10);
            
            p.pop();
        }
    }

    let cars = [];
    let popSize = 25;
    let trackInner = 70;
    let trackOuter = 150;
    let generation = 1;
    let evolving = false;
    let epochCounter = 0;
    const maxEpochs = 600; // max steps before forced evolution

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
        p.background(10, 10, 25); // Dark Cyber
        p.translate(p.width/2, p.height/2);

        // Draw track
        // Outer glow
        p.fill(0, 255, 255, 20);
        p.noStroke();
        p.circle(0, 0, trackOuter * 2 + 10);
        
        p.fill(20, 20, 40); // Track asphalt
        p.stroke(0, 255, 255); // Neon track bounds
        p.strokeWeight(2);
        p.circle(0, 0, trackOuter * 2);
        
        p.fill(10, 10, 25); // Inner void
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
        
        // Find leader
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
            // Draw dead cars first, then alive, then leader on top
            if (!cars[i].alive) {
                cars[i].draw(false);
            }
        }
        
        for (let i = 0; i < cars.length; i++) {
            if (cars[i].alive && i !== leaderIndex) {
                cars[i].draw(false);
            }
        }
        
        // Draw leader on top
        if (leaderIndex !== -1) {
            cars[leaderIndex].draw(true);
        }

        if (allDead || epochCounter > maxEpochs) {
            evolveNextGen();
        }
    };

    async function evolveNextGen() {
        evolving = true;
        
        let reqData = {
            generation: generation,
            scores: cars.map(c => c.score),
            population: cars.map(c => ({ weights: c.brain.weights }))
        };

        try {
            // Log for realism
            console.log("Transmitting Gen " + generation + " data...");
            const response = await fetchAPI('/api/evolve/f1', reqData, false);
            
            generation++;
            let tag = document.getElementById('rl-generation')
            tag.innerText = `Gen: ${generation}`;
            
            // Cycle colors or glow for Gen update
            tag.style.boxShadow = "0 0 10px #8a2be2";
            setTimeout(() => tag.style.boxShadow = "0 0 5px #8a2be2", 300);

            initPopulation(response.next_generation);
        } catch (err) {
            console.error(err);
            initPopulation(); // Restart in case of error
        }
        
        evolving = false;
    }
};

new p5(racerConfig, 'rl-container');
