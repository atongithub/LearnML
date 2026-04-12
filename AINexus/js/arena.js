const arenaSketch = (p) => {
    let cars = [];
    const populationSize = 50;
    let trackBoundaries = [];
    let trackInner = [];
    let trackOuter = [];
    let fastForward = false;
    let generation = 1;
    let maxCycles = 600; // Base time limit per generation
    let currentCycle = 0;

    const startX = 100;
    const startY = 100;
    const startAngle = -Math.PI / 2; // Facing right

    p.setup = () => {
        let canvas = p.createCanvas(600, 400);
        canvas.parent('arena-canvas-container');
        
        buildTrack();
        
        for(let i=0; i<populationSize; i++){
            let c = new Car();
            c.x = startX; c.y = startY; c.angle = startAngle;
            c.trackProgress = 0;
            c.lastTrackAngle = Math.atan2(c.y - 200, c.x - 300);
            cars.push(c);
        }
        
        // UI Controls
        document.getElementById('toggle-fast-forward').addEventListener('click', (e) => {
            fastForward = !fastForward;
            e.target.innerText = fastForward ? "Fast Forward: ON" : "Fast Forward: OFF";
            e.target.classList.toggle('neon-glow');
        });
        
        document.getElementById('restart-evolution').addEventListener('click', () => {
            nextGeneration(); // immediate kill and evolve
        });
    };

    p.draw = () => {
        let cycles = fastForward ? 15 : 1;
        
        for(let c=0; c<cycles; c++){
            let allDead = true;
            let maxDistance = 0;
            
            for(let car of cars){
                car.update(trackBoundaries);
                if(car.alive) {
                    allDead = false;
                    let ang = Math.atan2(car.y - 200, car.x - 300);
                    let delta = ang - car.lastTrackAngle;
                    
                    // Handle wraparound at Math.PI
                    if (delta > Math.PI) delta -= Math.PI * 2;
                    if (delta < -Math.PI) delta += Math.PI * 2;
                    
                    car.trackProgress += delta;
                    car.lastTrackAngle = ang;
                    
                    if(car.trackProgress > maxDistance) {
                        maxDistance = car.trackProgress;
                    }
                }
            }
            
            currentCycle++;
            
            // Allow more time if they are traveling further (to allow completing multiple laps)
            if(allDead || currentCycle > maxCycles + (maxDistance * 150)) {
                nextGeneration();
                break; // exit inner simulation loop to render new gen safely
            }
        }
        
        renderScene();
    };

    function renderScene() {
        p.background(241, 245, 249);
        
        // Draw Track Background
        p.fill(226, 232, 240);
        p.noStroke();
        p.beginShape();
        for(let pt of trackOuter) p.vertex(pt.x, pt.y);
        p.beginContour();
        for(let i = trackInner.length - 1; i >= 0; i--) p.vertex(trackInner[i].x, trackInner[i].y);
        p.endContour();
        p.endShape(p.CLOSE);

        // Draw track borders glowing
        p.stroke(59, 130, 246, 150); // Soft Blue
        p.strokeWeight(3);
        p.noFill();
        p.beginShape();
        for(let pt of trackOuter) p.vertex(pt.x, pt.y);
        p.endShape(p.CLOSE);
        
        p.stroke(139, 92, 246, 150); // Soft Violet inner
        p.beginShape();
        for(let pt of trackInner) p.vertex(pt.x, pt.y);
        p.endShape(p.CLOSE);
        
        // Draw colorful start/finish line indicator
        p.stroke(236, 72, 153, 200); // Vibrant Pink
        p.strokeWeight(4);
        p.line(100, 50, 100, 150);
        
        p.fill(255);
        p.noStroke();
        p.textSize(12);
        p.text("START", 110, 100);

        let bestCar = cars[0];
        let bestDistance = 0;
        let aliveCount = 0;
        
        for(let car of cars){
            if(car.alive) aliveCount++;
            let progress = car.trackProgress || 0;
            if(progress > bestDistance){
                bestDistance = progress;
                bestCar = car;
            }
        }
        
        for(let car of cars){
            if(car !== bestCar) {
                car.draw(p, false);
            }
        }
        if(bestCar) {
            bestCar.draw(p, true);
        }
        
        // Update Dashboard Stats occasionally to avoid UI lag
        if(p.frameCount % 5 === 0) {
            const rlTab = document.getElementById('rl-arena');
            if(rlTab && rlTab.classList.contains('active')) {
                document.getElementById('stat-generation').innerText = generation;
                document.getElementById('stat-alive').innerText = aliveCount + " / " + populationSize;
                document.getElementById('stat-fitness').innerText = Math.floor(bestDistance);
            }
        }
    }
    
    function buildTrack() {
        // Simple rectangular track with chamfered corners for slight smoothness
        trackOuter = [
            {x: 50, y: 100}, {x: 100, y: 50}, {x: 500, y: 50}, {x: 550, y: 100},
            {x: 550, y: 300}, {x: 500, y: 350}, {x: 100, y: 350}, {x: 50, y: 300}
        ];
        
        trackInner = [
            {x: 150, y: 175}, {x: 175, y: 150}, {x: 425, y: 150}, {x: 450, y: 175},
            {x: 450, y: 225}, {x: 425, y: 250}, {x: 175, y: 250}, {x: 150, y: 225}
        ];
        
        trackBoundaries = [];
        
        for(let i=0; i<trackOuter.length; i++){
            let next = (i+1) % trackOuter.length;
            trackBoundaries.push([trackOuter[i], trackOuter[next]]);
        }
        for(let i=0; i<trackInner.length; i++){
            let next = (i+1) % trackInner.length;
            trackBoundaries.push([trackInner[i], trackInner[next]]);
        }
    }
    
    function nextGeneration() {
        calculateFitness();
        
        cars.sort((a,b) => b.fitness - a.fitness);
        
        let nextGen = [];
        
        // Top 10% Reproduction
        let survivorsCount = Math.floor(populationSize * 0.1);
        if(survivorsCount < 1) survivorsCount = 1;
        let survivors = cars.slice(0, survivorsCount);
        
        // Elitism - keep #1 best performer exactly as is
        let elite = new Car(survivors[0].brain.copy());
        elite.x = startX; elite.y = startY; elite.angle = startAngle;
        elite.trackProgress = 0;
        elite.lastTrackAngle = Math.atan2(elite.y - 200, elite.x - 300);
        nextGen.push(elite);
        
        // Crossover / mutation for remainder
        for(let i=1; i<populationSize; i++){
            let pIndex = Math.floor(Math.random() * survivors.length);
            let child = new Car(survivors[pIndex].brain.copy());
            child.brain.mutate(0.05); // 5% mutation rate
            
            child.x = startX;
            child.y = startY;
            child.angle = startAngle;
            child.trackProgress = 0;
            child.lastTrackAngle = Math.atan2(child.y - 200, child.x - 300);
            nextGen.push(child);
        }
        
        cars = nextGen;
        generation++;
        currentCycle = 0;
    }
    
    function calculateFitness() {
        let maxDist = 0;
        for(let car of cars) {
            let score = car.trackProgress > 0 ? car.trackProgress : 0.01;
            car.fitness = score * score; // Reward progression polynomially
            if(score > maxDist) maxDist = score;
        }
        // Normalize fitness
        if(maxDist > 0) {
            for(let car of cars) {
                car.fitness /= (maxDist * maxDist);
            }
        }
    }
};

new p5(arenaSketch);
