// F1 Car Physics handling friction, momentum, and sensors.
class Car {
    constructor(x, y, isAI = true) {
        this.x = x;
        this.y = y;
        this.width = 14;
        this.height = 24;
        this.isAI = isAI;

        // Physics
        this.speed = 0;
        this.acceleration = 0.2;
        this.maxSpeed = 5;
        this.friction = 0.05;
        this.angle = 0;
        this.rotationSpeed = 0.05;

        // State
        this.crashed = false;
        this.score = 0; // Fitness score (distance travelled)
        
        // Raycasting sensors
        this.sensors = [];
        this.sensorAngles = [-Math.PI/2, -Math.PI/4, 0, Math.PI/4, Math.PI/2];
        this.sensorDistances = [0, 0, 0, 0, 0];
        
        // Neural Net weights representation (dummy for now)
        this.weights = []; 
    }

    reset(x, y) {
        this.x = x;
        this.y = y;
        this.speed = 0;
        this.angle = 0;
        this.crashed = false;
        this.score = 0;
    }

    update(trackBoundaryLines) {
        if (this.crashed) return;

        this.move();
        this.updateSensors(trackBoundaryLines);
        this.checkCollision(trackBoundaryLines);
        this.score += this.speed; // Increment fitness score
    }

    move() {
        // Simple momentum and friction application
        if (this.speed > 0) {
            this.speed -= this.friction;
        } else if (this.speed < 0) {
            this.speed += this.friction;
        }

        if (Math.abs(this.speed) < this.friction) {
            this.speed = 0;
        }

        // Clip speed
        if (this.speed > this.maxSpeed) this.speed = this.maxSpeed;
        if (this.speed < -this.maxSpeed / 2) this.speed = -this.maxSpeed / 2;

        this.x += Math.sin(this.angle) * this.speed;
        this.y -= Math.cos(this.angle) * this.speed;
    }

    // Move left/right for turning
    turn(dir) {
        if (this.speed !== 0) {
            const flip = this.speed > 0 ? 1 : -1;
            this.angle += dir * this.rotationSpeed * flip;
        }
    }

    accelerate() {
        this.speed += this.acceleration;
    }

    brake() {
        this.speed -= this.acceleration;
    }

    // AI "Think" step - gets distances from sensors and maps to controls
    think() {
        if (!this.isAI || this.crashed) return;
        // In a real GA, this would pass sensorDistances through a feed-forward NN
        // with `this.weights` to produce output controls [accelerate, left, right, brake]
        
        // Basic hardcoded logic fallback: Default drive forward, turn if obstruction
        this.accelerate();
        if (this.sensorDistances[1] < 50) this.turn(1); // turn right
        if (this.sensorDistances[3] < 50) this.turn(-1); // turn left
    }

    updateSensors(boundaries) {
        // Simplified Raycasting logic (Dummy implementation for structure)
        // Raycasting would shoot 5 rays out from the car based on `this.angle`
        // Finding intersections with `boundaries`.
        for(let i=0; i<this.sensorAngles.length; i++) {
            // Placeholder distances 
            this.sensorDistances[i] = 100; // max distance seeable
        }
    }

    checkCollision(boundaries) {
        // Check if car x/y hits track boundaries.
        // Simplified version: Check container bounds for now.
        if (this.x < 0 || this.x > 800 || this.y < 0 || this.y > 600) {
            this.crashed = true;
        }
    }

    draw(p) {
        p.push();
        p.translate(this.x, this.y);
        p.rotate(this.angle);
        
        if (this.crashed) {
            p.fill(255, 50, 50, 100);
        } else {
            p.fill(59, 130, 246); // Accent blue
        }
        
        // Car Body
        p.rectMode(p.CENTER);
        p.rect(0, 0, this.width, this.height, 4);

        // Optional: Draw sensors
        if (!this.crashed && this.isAI) {
            p.stroke(0, 255, 0, 50);
            for(let i=0; i<this.sensorAngles.length; i++) {
                p.line(0, 0, Math.sin(this.sensorAngles[i]) * this.sensorDistances[i], -Math.cos(this.sensorAngles[i]) * this.sensorDistances[i]);
            }
        }
        p.pop();
    }
}
