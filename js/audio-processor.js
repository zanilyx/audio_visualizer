/**
 * Audio Processor
 * Handles audio analysis and processing using Web Audio API
 */
class AudioProcessor {
    constructor() {
        this.audioContext = null;
        this.analyser = null;
        this.source = null;
        this.audioBuffer = null;
        this.frequencyData = null;
        this.timeData = null;
        this.bpm = 120;
        this.isPlaying = false;
        this.startTime = 0;
        this.pauseTime = 0;
        this.duration = 0;
        this.onAudioProcessCallback = null;
        this.onPlaybackEndCallback = null;
        
        // Audio features detection thresholds
        this.beatThreshold = 0.15;
        this.energyThreshold = 0.25;
        this.peakThreshold = 0.30;
        
        // Previous values for detection
        this.prevAverage = 0;
        this.energyHistory = [];
        this.beatHistory = [];
    }

    async initialize() {
        try {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            this.analyser = this.audioContext.createAnalyser();
            this.analyser.fftSize = 2048;
            this.analyser.smoothingTimeConstant = 0.85;
            
            // Create frequency and time domain data arrays
            this.frequencyData = new Uint8Array(this.analyser.frequencyBinCount);
            this.timeData = new Uint8Array(this.analyser.frequencyBinCount);
            
            // Initialize energy history
            for (let i = 0; i < 60; i++) {
                this.energyHistory.push(0);
                this.beatHistory.push(false);
            }
            
            return true;
        } catch (error) {
            console.error("Error initializing audio processor:", error);
            return false;
        }
    }

    async loadAudioFile(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            
            reader.onload = async (event) => {
                try {
                    const arrayBuffer = event.target.result;
                    this.audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);
                    this.duration = this.audioBuffer.duration;
                    resolve(true);
                } catch (error) {
                    console.error("Error decoding audio data:", error);
                    reject(error);
                }
            };
            
            reader.onerror = (error) => {
                console.error("Error reading file:", error);
                reject(error);
            };
            
            reader.readAsArrayBuffer(file);
        });
    }

    play() {
        if (this.isPlaying) return;
        
        // If we're resuming from pause
        if (this.pauseTime > 0) {
            const elapsedTime = this.pauseTime - this.startTime;
            this.startTime = this.audioContext.currentTime - elapsedTime;
        } else {
            this.startTime = this.audioContext.currentTime;
        }
        
        // Create a new source (required each time for playback)
        this.source = this.audioContext.createBufferSource();
        this.source.buffer = this.audioBuffer;
        this.source.connect(this.analyser);
        this.analyser.connect(this.audioContext.destination);
        
        // Calculate offset if resuming
        const offset = this.pauseTime > 0 ? this.pauseTime - this.startTime : 0;
        
        // Start playback
        this.source.start(0, offset);
        this.isPlaying = true;
        
        // Handle playback end
        this.source.onended = () => {
            if (this.isPlaying) {
                this.stop();
                if (this.onPlaybackEndCallback) {
                    this.onPlaybackEndCallback();
                }
            }
        };
    }

    pause() {
        if (!this.isPlaying) return;
        
        this.pauseTime = this.audioContext.currentTime;
        this.source.stop();
        this.isPlaying = false;
    }

    stop() {
        if (this.source) {
            this.source.stop();
        }
        this.isPlaying = false;
        this.pauseTime = 0;
        this.startTime = 0;
    }

    getCurrentTime() {
        if (!this.isPlaying) {
            return this.pauseTime > 0 ? this.pauseTime - this.startTime : 0;
        }
        return this.audioContext.currentTime - this.startTime;
    }

    getAudioData() {
        // Update frequency and time domain data
        this.analyser.getByteFrequencyData(this.frequencyData);
        this.analyser.getByteTimeDomainData(this.timeData);
        
        // Calculate metrics
        const bassValue = this.getBassValue();
        const midValue = this.getMidValue();
        const trebleValue = this.getTrebleValue();
        const volume = this.getVolume();
        const beat = this.detectBeat();
        const energy = this.calculateEnergy();
        const peak = this.detectPeak();
        
        return {
            frequencyData: this.frequencyData,
            timeData: this.timeData,
            bass: bassValue,
            mid: midValue,
            treble: trebleValue,
            volume: volume,
            beat: beat,
            energy: energy,
            peak: peak,
            currentTime: this.getCurrentTime(),
            duration: this.duration
        };
    }

    processAudio() {
        if (!this.isPlaying) return null;
        
        const data = this.getAudioData();
        
        if (this.onAudioProcessCallback) {
            this.onAudioProcessCallback(data);
        }
        
        return data;
    }

    // Bass frequency range (20-250Hz)
    getBassValue() {
        const bassRange = this.frequencyData.slice(1, 10);
        const sum = bassRange.reduce((total, value) => total + value, 0);
        return sum / bassRange.length / 255; // Normalize to 0-1
    }

    // Mid frequency range (250Hz-2kHz)
    getMidValue() {
        const midRange = this.frequencyData.slice(10, 80);
        const sum = midRange.reduce((total, value) => total + value, 0);
        return sum / midRange.length / 255; // Normalize to 0-1
    }

    // Treble frequency range (2kHz-20kHz)
    getTrebleValue() {
        const trebleRange = this.frequencyData.slice(80, this.frequencyData.length);
        const sum = trebleRange.reduce((total, value) => total + value, 0);
        return sum / trebleRange.length / 255; // Normalize to 0-1
    }

    // Overall volume
    getVolume() {
        const sum = this.frequencyData.reduce((total, value) => total + value, 0);
        return sum / this.frequencyData.length / 255; // Normalize to 0-1
    }

    // Beat detection using energy difference
    detectBeat() {
        const bass = this.getBassValue();
        const energy = this.calculateEnergy();
        
        // Get average of recent energy values
        const recent = this.energyHistory.slice(-8);
        const avgEnergy = recent.reduce((sum, val) => sum + val, 0) / recent.length;
        
        // Check if current energy is significantly higher than average
        const beat = energy > avgEnergy * (1 + this.beatThreshold) && bass > 0.15;
        
        // Update history
        this.beatHistory.push(beat);
        if (this.beatHistory.length > 60) this.beatHistory.shift();
        
        return beat;
    }

    // Calculate energy of signal
    calculateEnergy() {
        const bass = this.getBassValue() * 3; // Weight bass more heavily
        const mid = this.getMidValue();
        const energy = (bass + mid) / 4; // Normalized energy value
        
        // Update history
        this.energyHistory.push(energy);
        if (this.energyHistory.length > 60) this.energyHistory.shift();
        
        return energy;
    }

    // Detect peaks in audio signal
    detectPeak() {
        const volume = this.getVolume();
        const isPeak = volume > this.prevAverage * (1 + this.peakThreshold);
        this.prevAverage = (this.prevAverage * 9 + volume) / 10; // Smoothing
        
        return isPeak;
    }

    // Estimate BPM (basic implementation)
    estimateBPM() {
        // Count beats in the last 5 seconds (assuming 60 frames = ~1 second)
        const recentBeats = this.beatHistory.slice(-300);
        const beatCount = recentBeats.filter(beat => beat).length;
        
        // Calculate beats per minute
        const bpm = beatCount * (60 / 5); // 60 seconds divided by sample window (5s)
        
        // Return a reasonable value or default to 120
        return bpm > 50 && bpm < 200 ? bpm : 120;
    }

    setOnAudioProcessCallback(callback) {
        this.onAudioProcessCallback = callback;
    }

    setOnPlaybackEndCallback(callback) {
        this.onPlaybackEndCallback = callback;
    }
}