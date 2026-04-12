class Car {
    constructor(brain) {
        // Physics
        this.x = 200;
        this.y = 80;
        this.width = 15;
        this.height = 30;
        this.angle = 0;
        this.speed = 0;
        this.maxSpeed = 5;
        this.acceleration = 0.2;
        this.friction = 0.05;
        
        // State
        this.alive = true;
        this.distance = 0;
        this.fitness = 0;
        this.checkpoints = []; // for accurate distance measuring
        
        // AI Brain
        if (brain) {
            this.brain = brain.copy();
        } else {
            // 5 inputs (sensors), 8 hidden, 2 outputs (steering and acceleration)
            this.brain = new NeuralNetwork(5, 8, 2);
        }

        // Sensors raycasting
        this.rayCount = 5;
        this.rayLength = 100;
        this.raySpread = Math.PI / 2; // -45 to 45 degrees
        this.sensorReadings = new Array(this.rayCount).fill(0);
        this.rays = [];
    }

    update(trackBoundaries) {
        if (!this.alive) return;

        this.move();
        this.updateSensors(trackBoundaries);
        
        // Collision Detection
        if (this.checkCollision(trackBoundaries)) {
            this.alive = false;
        }

        // AI Think
        this.think();
        
        // Update distance
        this.distance += this.speed;
        
        // Fail safe: If car is barely moving, kill it so it doesn't survive by standing still
        if(this.speed < 0.5 && this.distance > 50) {
           // this.alive = false; // Actually, cars might just hit wall and die. Handling stagnation in arena logic.
        }
    }

    updateSensors(trackBoundaries) {
        this.rays = [];
        this.sensorReadings = new Array(this.rayCount).fill(0);

        for (let i = 0; i < this.rayCount; i++) {
            // Calculate ray angle (-45, -22.5, 0, 22.5, 45)
            let t = this.rayCount === 1 ? 0.5 : i / (this.rayCount - 1);
            const rayAngle = (this.raySpread / 2) + t * (-this.raySpread) + this.angle;

            const start = { x: this.x, y: this.y };
            const end = {
                x: this.x - Math.sin(rayAngle) * this.rayLength,
                y: this.y - Math.cos(rayAngle) * this.rayLength
            };

            this.rays.push([start, end]);

            // Find closest intersection
            let closest = null;
            let minDistance = Infinity;

            for (let boundary of trackBoundaries) {
                const intersection = this.getIntersection(start, end, boundary[0], boundary[1]);
                if (intersection) {
                    const dist = Math.hypot(start.x - intersection.x, start.y - intersection.y);
                    if (dist < minDistance) {
                        minDistance = dist;
                        closest = intersection;
                    }
                }
            }

            if (closest) {
                // Push normalized distance value (0 = closest, 1 = furthest) to input array
                // We map dist so closer wall = higher value (stronger activation)
                this.sensorReadings[i] = 1 - (minDistance / this.rayLength);
            } else {
                this.sensorReadings[i] = 0;
            }
        }
    }

    think() {
        // Output from NN: [Steering, Acceleration] between 0 and 1
        const action = this.brain.predict(this.sensorReadings);
        
        // Steering: 0 -> full left, 1 -> full right, 0.5 -> center
        const steerVal = action[0];
        if (steerVal < 0.4) {
            this.angle += 0.05; // Right
        } else if (steerVal > 0.6) {
            this.angle -= 0.05; // Left
        }

        // Acceleration: 0 -> brake/reverse, 1 -> accelerate
        const accVal = action[1];
        if (accVal > 0.5) {
            this.speed += this.acceleration;
        } else {
            this.speed -= this.acceleration;
        }
    }

    move() {
        // Cap speed
        if (this.speed > this.maxSpeed) {
            this.speed = this.maxSpeed;
        }
        if (this.speed < -this.maxSpeed / 2) {
            this.speed = -this.maxSpeed / 2; // reverse speed limited
        }

        // Apply friction
        if (this.speed > 0) {
            this.speed -= this.friction;
        }
        if (this.speed < 0) {
            this.speed += this.friction;
        }
        
        // Stop completely if very slow
        if (Math.abs(this.speed) < this.friction) {
            this.speed = 0;
        }

        // Move relative to angle
        this.x -= Math.sin(this.angle) * this.speed;
        this.y -= Math.cos(this.angle) * this.speed;
    }

    checkCollision(boundaries) {
        const poly = this.getPolygon();
        for (let i = 0; i < poly.length; i++) {
            let next = (i + 1) % poly.length;
            for (let boundary of boundaries) {
                if (this.getIntersection(poly[i], poly[next], boundary[0], boundary[1])) {
                    return true;
                }
            }
        }
        return false;
    }

    getPolygon() {
        const points = [];
        const rad = Math.hypot(this.width, this.height) / 2;
        const alpha = Math.atan2(this.width, this.height);
        
        points.push({
            x: this.x - Math.sin(this.angle - alpha) * rad,
            y: this.y - Math.cos(this.angle - alpha) * rad
        });
        points.push({
            x: this.x - Math.sin(this.angle + alpha) * rad,
            y: this.y - Math.cos(this.angle + alpha) * rad
        });
        points.push({
            x: this.x - Math.sin(Math.PI + this.angle - alpha) * rad,
            y: this.y - Math.cos(Math.PI + this.angle - alpha) * rad
        });
        points.push({
            x: this.x - Math.sin(Math.PI + this.angle + alpha) * rad,
            y: this.y - Math.cos(Math.PI + this.angle + alpha) * rad
        });
        return points;
    }

    getIntersection(A, B, C, D) {
        const tTop = (D.x - C.x) * (A.y - C.y) - (D.y - C.y) * (A.x - C.x);
        const uTop = (C.y - A.y) * (A.x - B.x) - (C.x - A.x) * (A.y - B.y);
        const bottom = (D.y - C.y) * (B.x - A.x) - (D.x - C.x) * (B.y - A.y);

        if (bottom !== 0) {
            const t = tTop / bottom;
            const u = uTop / bottom;
            if (t >= 0 && t <= 1 && u >= 0 && u <= 1) {
                return {
                    x: A.x + (B.x - A.x) * t,
                    y: A.y + (B.y - A.y) * t,
                    offset: t
                };
            }
        }
        return null;
    }

    draw(p, isLeader) {
        // Draw sensors
        if (this.alive && isLeader) {
            for (let ray of this.rays) {
                p.stroke(59, 130, 246, 50); // Realistic blue, transparent
                p.strokeWeight(1);
                p.line(ray[0].x, ray[0].y, ray[1].x, ray[1].y);
            }
        }

        // Draw car
        p.push();
        p.translate(this.x, this.y);
        p.rotate(-this.angle);

        if (isLeader) {
            p.fill(139, 92, 246); // Violet
            p.stroke(59, 130, 246);
            p.strokeWeight(2);
        } else if (!this.alive) {
            p.fill(203, 213, 225, 150); // Dead gray (slate)
            p.noStroke();
        } else {
            p.fill(59, 130, 246, 150); // Standard live car
            p.noStroke();
        }

        p.rectMode(p.CENTER);
        p.rect(0, 0, this.width, this.height);
        
        // Headlights (directional indicator)
        if(this.alive) {
            p.fill(255);
            p.rect(-this.width/2 + 2, -this.height/2 + 3, 3, 5);
            p.rect(this.width/2 - 2, -this.height/2 + 3, 3, 5);
        }
        p.pop();
    }
}
