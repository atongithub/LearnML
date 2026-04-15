// Inside your Car constructor:
this.maxSpeed = 5; // Define your max speed
this.brain = new NeuralNetwork([6, 6, 2], weights);

// Inside your Car update/think function:
let normalizedSpeed = this.speed / this.maxSpeed;
let inputs = [...this.sensorReadings, normalizedSpeed]; 

let decision = this.brain.predict(inputs);

// decision[0] is steering (0 to 1), decision[1] is acceleration (0 to 1)
let steer = (decision[0] - 0.5) * 2 * 0.15; // maps 0..1 to -0.15..0.15
let acc = decision[1] * 0.8;

this.move(acc);
this.turn(steer);// Inside your Car constructor:

