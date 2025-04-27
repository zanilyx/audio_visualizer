/**
 * Visualizer
 * Handles 3D rendering using Three.js
 */
class Visualizer {
    constructor(containerId) {
        this.container = document.getElementById(containerId);
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.cube = null;
        this.particles = [];
        this.hotspots = [];
        this.bounds = { width: 20, height: 20, depth: 20 };
        
        // Settings
        this.cubeSpeed = 1;
        this.particleSize = 0.5;
        this.particleLifespan = 180; // frames
        this.maxParticles = 5000;
        this.colorPalette = [
            new THREE.Color(0xff6b6b), // Red
            new THREE.Color(0xff6bdb), // Pink
            new THREE.Color(0x6b6bff), // Blue
            new THREE.Color(0x6bffdb), // Cyan
            new THREE.Color(0x6bff6b)  // Green
        ];
        
        // Audio reactive properties
        this.velocity = new THREE.Vector3(0.05, 0.07, 0.06);
        this.audioBounceIntensity = 0;
        this.audioColorIntensity = 0;
        this.useAutoBPM = false;
        
        // Sound generation
        this.noteIndex = 0;
        this.notes = ['C4', 'D4', 'E4', 'G4', 'A4', 'C5', 'D5', 'E5'];
        this.soundPreset = 'piano';
        this.synth = null;
        
        // Initialize hotspots
        this.createHotspots(8);
    }

    initialize() {
        // Create scene
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x121212);
        
        // Create camera
        this.camera = new THREE.PerspectiveCamera(
            75,
            this.container.clientWidth / this.container.clientHeight,
            0.1,
            1000
        );
        this.camera.position.z = 30;
        
        // Create renderer
        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.renderer.setSize(this.container.clientWidth, this.container.clientHeight);
        this.container.appendChild(this.renderer.domElement);
        
        // Add responsive resizing
        window.addEventListener('resize', () => this.onWindowResize());
        
        // Create the bouncing cube
        this.createCube();
        
        // Create bounding box (invisible)
        this.createBoundingBox();
        
        // Create hotspot indicators (for debug)
        this.visualizeHotspots(false);
        
        // Initialize Tone.js synth
        this.initializeSynth();
        
        // Add ambient light
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
        this.scene.add(ambientLight);
        
        // Add directional light
        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
        directionalLight.position.set(0, 10, 10);
        this.scene.add(directionalLight);
    }

    initializeSynth() {
        // Start Tone.js audio context
        Tone.start();
        
        // Create synth based on selected preset
        this.updateSoundPreset(this.soundPreset);
    }

    updateSoundPreset(preset) {
        this.soundPreset = preset;
        
        // Clean up previous synth if exists
        if (this.synth) {
            this.synth.dispose();
        }
        
        // Create new synth based on preset
        switch (preset) {
            case 'piano':
                this.synth = new Tone.Sampler({
                    urls: {
                        C4: "C4.mp3",
                        G4: "G4.mp3",
                    },
                    baseUrl: "https://tonejs.github.io/audio/salamander/",
                    onload: () => console.log("Piano samples loaded")
                }).toDestination();
                break;
                
            case 'synth':
                this.synth = new Tone.PolySynth(Tone.Synth, {
                    oscillator: {
                        type: "sine"
                    },
                    envelope: {
                        attack: 0.01,
                        decay: 0.2,
                        sustain: 0.4,
                        release: 1
                    }
                }).toDestination();
                break;
                
            case 'bell':
                this.synth = new Tone.MetalSynth({
                    frequency: 200,
                    envelope: {
                        attack: 0.001,
                        decay: 1.4,
                        release: 0.2
                    },
                    harmonicity: 5.1,
                    modulationIndex: 32,
                    resonance: 4000,
                    octaves: 1.5
                }).toDestination();
                this.synth.volume.value = -15; // Reduce volume for bell
                break;
                
            default:
                this.synth = new Tone.Synth().toDestination();
        }
    }

    createCube() {
        const geometry = new THREE.BoxGeometry(2, 2, 2);
        const material = new THREE.MeshPhongMaterial({
            color: 0xffffff,
            shininess: 90,
            reflectivity: 1,
            emissive: 0x222222
        });
        
        this.cube = new THREE.Mesh(geometry, material);
        this.scene.add(this.cube);
    }

    createBoundingBox() {
        const boxGeometry = new THREE.BoxGeometry(
            this.bounds.width, 
            this.bounds.height, 
            this.bounds.depth
        );
        
        const wireframe = new THREE.EdgesGeometry(boxGeometry);
        const line = new THREE.LineSegments(
            wireframe,
            new THREE.LineBasicMaterial({ color: 0x333333 })
        );
        
        this.scene.add(line);
    }

    createHotspots(count) {
        this.hotspots = [];
        
        // Create random hotspots throughout the bounding box
        for (let i = 0; i < count; i++) {
            const hotspot = {
                position: new THREE.Vector3(
                    (Math.random() - 0.5) * this.bounds.width * 0.8,
                    (Math.random() - 0.5) * this.bounds.height * 0.8,
                    (Math.random() - 0.5) * this.bounds.depth * 0.8
                ),
                radius: Math.random() * 1.5 + 1, // Random radius between 1-2.5
                triggered: false,
                note: this.notes[i % this.notes.length]
            };
            
            this.hotspots.push(hotspot);
        }
    }

    visualizeHotspots(visible) {
        // Remove any existing hotspot visuals
        this.scene.children.forEach(child => {
            if (child.userData && child.userData.isHotspot) {
                this.scene.remove(child);
            }
        });
        
        if (!visible) return;
        
        // Create sphere for each hotspot
        this.hotspots.forEach(hotspot => {
            const geometry = new THREE.SphereGeometry(hotspot.radius, 16, 16);
            const material = new THREE.MeshBasicMaterial({
                color: 0xffff00,
                transparent: true,
                opacity: 0.3,
                wireframe: true
            });
            
            const sphere = new THREE.Mesh(geometry, material);
            sphere.position.copy(hotspot.position);
            sphere.userData = { isHotspot: true };
            
            this.scene.add(sphere);
        });
    }

    addParticle(position, color) {
        const geometry = new THREE.SphereGeometry(this.particleSize, 8, 8);
        const material = new THREE.MeshBasicMaterial({ 
            color: color,
            transparent: true,
            opacity: 0.8
        });
        
        const particle = new THREE.Mesh(geometry, material);
        particle.position.copy(position);
        particle.userData = { 
            life: this.particleLifespan,
            originalOpacity: 0.8,
            originalScale: this.particleSize
        };
        
        this.scene.add(particle);
        this.particles.push(particle);
        
        // Limit total particles
        if (this.particles.length > this.maxParticles) {
            const oldestParticle = this.particles.shift();
            this.scene.remove(oldestParticle);
            oldestParticle.geometry.dispose();
            oldestParticle.material.dispose();
        }
    }

    updateParticles() {
        // Update each particle
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const particle = this.particles[i];
            
            // Update life
            particle.userData.life--;
            
            // Update opacity and scale based on remaining life
            const lifeRatio = particle.userData.life / this.particleLifespan;
            particle.material.opacity = particle.userData.originalOpacity * lifeRatio;
            const scale = particle.userData.originalScale * (0.5 + lifeRatio * 0.5);
            particle.scale.set(scale, scale, scale);
            
            // Remove if dead
            if (particle.userData.life <= 0) {
                this.scene.remove(particle);
                this.particles.splice(i, 1);
                particle.geometry.dispose();
                particle.material.dispose();
            }
        }
    }

    checkHotspotCollisions() {
        // Check if cube collides with any hotspot
        for (let hotspot of this.hotspots) {
            const distance = this.cube.position.distanceTo(hotspot.position);
            
            if (distance < hotspot.radius + 1) { // +1 for cube radius
                if (!hotspot.triggered) {
                    // Play note corresponding to this hotspot
                    this.playNote(hotspot.note);
                    
                    // Mark as triggered
                    hotspot.triggered = true;
                    
                    // Visual feedback - pulse hotspot
                    if (hotspot.visual) {
                        hotspot.visual.material.opacity = 0.6;
                    }
                }
            } else {
                // Reset trigger state when cube moves away
                hotspot.triggered = false;
                
                // Reset visual
                if (hotspot.visual) {
                    hotspot.visual.material.opacity = 0.3;
                }
            }
        }
    }

playNote(note) {
    if (!this.synth) return;
    
    try {
        // Different behavior based on sound preset
        switch (this.soundPreset) {
            case 'piano':
            case 'synth':
                this.synth.triggerAttackRelease(note, "8n");
                break;
                
            case 'bell':
                // For bell, we adjust the frequency based on the note
                const noteFreq = Tone.Frequency(note).toFrequency();
                this.synth.triggerAttackRelease(noteFreq, "16n");
                break;
                
            default:
                this.synth.triggerAttackRelease(note, "8n");
        }
    } catch (e) {
        console.warn("Error playing note:", e);
    }
}

updateCube(audioData) {
    if (!this.cube || !audioData) return;
    
    // Get current position
    const position = this.cube.position;
    
    // Calculate speed multiplier based on audio
    let speedMultiplier = this.cubeSpeed;
    
    // Apply BPM sync if enabled
    if (this.useAutoBPM && audioData.beat) {
        // Bounce the cube on beats
        this.audioBounceIntensity = 1.0;
    }
    
    // Apply audio reactivity
    if (audioData.beat) {
        // Increase bounce intensity on beat
        this.audioBounceIntensity = Math.min(this.audioBounceIntensity + 0.3, 1.5);
        
        // Add pulse effect to cube
        this.cube.scale.set(1.2, 1.2, 1.2);
        
        // Change cube color on beat
        const beatColor = new THREE.Color(
            0.5 + audioData.bass * 0.5,
            0.3 + audioData.mid * 0.7,
            0.8 + audioData.treble * 0.2
        );
        this.cube.material.color.set(beatColor);
        this.cube.material.emissive.set(new THREE.Color(beatColor).multiplyScalar(0.2));
    } else {
        // Gradually reduce bounce intensity
        this.audioBounceIntensity *= 0.95;
        
        // Return cube scale to normal
        this.cube.scale.lerp(new THREE.Vector3(1, 1, 1), 0.1);
    }
    
    // Apply audio energy to speed
    const energyFactor = 1 + audioData.energy * 2 * this.audioBounceIntensity;
    speedMultiplier *= energyFactor;
    
    // Update position based on velocity
    position.x += this.velocity.x * speedMultiplier;
    position.y += this.velocity.y * speedMultiplier;
    position.z += this.velocity.z * speedMultiplier;
    
    // Check bounds and bounce
    if (Math.abs(position.x) > this.bounds.width / 2 - 1) {
        this.velocity.x *= -1;
        position.x = Math.sign(position.x) * (this.bounds.width / 2 - 1);
        
        // Add particles at bounce location
        this.createBounceParticles(position, Math.abs(this.velocity.x) * speedMultiplier);
    }
    
    if (Math.abs(position.y) > this.bounds.height / 2 - 1) {
        this.velocity.y *= -1;
        position.y = Math.sign(position.y) * (this.bounds.height / 2 - 1);
        
        // Add particles at bounce location
        this.createBounceParticles(position, Math.abs(this.velocity.y) * speedMultiplier);
    }
    
    if (Math.abs(position.z) > this.bounds.depth / 2 - 1) {
        this.velocity.z *= -1;
        position.z = Math.sign(position.z) * (this.bounds.depth / 2 - 1);
        
        // Add particles at bounce location
        this.createBounceParticles(position, Math.abs(this.velocity.z) * speedMultiplier);
    }
    
    // Apply rotation based on audio
    this.cube.rotation.x += 0.01 + audioData.bass * 0.02;
    this.cube.rotation.y += 0.01 + audioData.mid * 0.02;
    this.cube.rotation.z += 0.01 + audioData.treble * 0.02;
    
    // Add trailing particle
    if (Math.random() < 0.3 + audioData.energy * 0.5) {
        const colorIndex = Math.floor(Math.random() * this.colorPalette.length);
        const color = this.colorPalette[colorIndex].clone();
        
        // Modulate color based on audio
        const audioColor = new THREE.Color(
            0.5 + audioData.bass * 0.5,
            0.5 + audioData.mid * 0.5,
            0.5 + audioData.treble * 0.5
        );
        
        color.lerp(audioColor, 0.3); // Blend with audio color
        this.addParticle(position.clone(), color);
    }
    
    // Check hotspot collisions
    this.checkHotspotCollisions();
}

createBounceParticles(position, intensity) {
    const particleCount = Math.floor(3 + intensity * 5);
    
    for (let i = 0; i < particleCount; i++) {
        const colorIndex = Math.floor(Math.random() * this.colorPalette.length);
        const color = this.colorPalette[colorIndex];
        
        // Random position around bounce point
        const offset = new THREE.Vector3(
            (Math.random() - 0.5) * 2,
            (Math.random() - 0.5) * 2,
            (Math.random() - 0.5) * 2
        );
        
        const particlePos = position.clone().add(offset.multiplyScalar(0.5));
        this.addParticle(particlePos, color);
    }
}

update(audioData) {
    // Update cube position and physics
    this.updateCube(audioData);
    
    // Update particles
    this.updateParticles();
    
    // Camera slowly orbit around the scene
    const time = Date.now() * 0.0001;
    this.camera.position.x = Math.sin(time) * 35;
    this.camera.position.z = Math.cos(time) * 35;
    this.camera.lookAt(0, 0, 0);
    
    // Render scene
    this.renderer.render(this.scene, this.camera);
}

onWindowResize() {
    this.camera.aspect = this.container.clientWidth / this.container.clientHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(this.container.clientWidth, this.container.clientHeight);
}

setCubeSpeed(speed) {
    this.cubeSpeed = speed;
}

setParticleSize(size) {
    this.particleSize = size;
}

setUseAutoBPM(value) {
    this.useAutoBPM = value;
}

resetScene() {
    // Clear particles
    this.particles.forEach(particle => {
        this.scene.remove(particle);
        particle.geometry.dispose();
        particle.material.dispose();
    });
    this.particles = [];
    
    // Reset cube position
    if (this.cube) {
        this.cube.position.set(0, 0, 0);
        this.cube.rotation.set(0, 0, 0);
        this.cube.scale.set(1, 1, 1);
    }
    
    // Reset velocity with a random direction
    this.velocity = new THREE.Vector3(
        (Math.random() - 0.5) * 0.1,
        (Math.random() - 0.5) * 0.1,
        (Math.random() - 0.5) * 0.1
    ).normalize().multiplyScalar(0.05);
    
    // Create new hotspots
    this.createHotspots(8);
    this.visualizeHotspots(false);
}

dispose() {
    // Clean up Three.js resources
    this.particles.forEach(particle => {
        particle.geometry.dispose();
        particle.material.dispose();
    });
    
    if (this.cube) {
        this.cube.geometry.dispose();
        this.cube.material.dispose();
    }
    
    // Remove renderer
    if (this.renderer) {
        this.renderer.domElement.remove();
        this.renderer.dispose();
    }
    
    // Clean up Tone.js resources
    if (this.synth) {
        this.synth.dispose();
    }
}

}