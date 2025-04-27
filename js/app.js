/**
 * Main Application
 * Coordinates audio processing, visualization and recording
 */
class AudioVisualizerApp {
    constructor() {
        // Core components
        this.audioProcessor = new AudioProcessor();
        this.visualizer = null;
        this.recorder = null;
        
        // UI elements
        this.landingScreen = document.getElementById('landing');
        this.playerScreen = document.getElementById('player');
        this.dropZone = document.getElementById('drop-zone');
        this.fileInput = document.getElementById('file-input');
        this.folderInput = document.getElementById('folder-input');
        this.songTitle = document.getElementById('song-title');
        this.songProgress = document.getElementById('song-progress');
        this.playPauseButton = document.getElementById('play-pause');
        this.backButton = document.getElementById('back-button');
        this.saveVideoButton = document.getElementById('save-video');
        this.saveAllButton = document.getElementById('save-all');
        this.progressContainer = document.getElementById('progress-container');
        this.progressBar = document.getElementById('progress-bar');
        this.progressText = document.getElementById('progress-text');
        
        // Settings controls
        this.cubeSpeedControl = document.getElementById('cube-speed');
        this.particleSizeControl = document.getElementById('particle-size');
        this.soundPresetControl = document.getElementById('sound-preset');
        this.bpmSyncControl = document.getElementById('bpm-sync');
        
        // State variables
        this.isPlaying = false;
        this.isPaused = false;
        this.isProcessingFolder = false;
        this.currentFileIndex = 0;
        this.audioFiles = [];
        this.rafId = null;
        
        // Initialize
        this.init();
    }

    async init() {
        // Initialize audio processor
        const audioInitialized = await this.audioProcessor.initialize();
        if (!audioInitialized) {
            alert("Failed to initialize audio system. Please try a different browser.");
            return;
        }
        
        // Set up event listeners
        this.setupEventListeners();
        
        // Create visualizer (after UI is shown)
        this.visualizer = new Visualizer('canvas-container');
        this.visualizer.initialize();
        
        // Create recorder
        this.recorder = new VideoRecorder(this.visualizer.renderer);
        
        // Animation loop
        this.animate();
    }

    setupEventListeners() {
        // Drop zone events
        this.dropZone.addEventListener('dragover', (e) => {
            e.preventDefault();
            this.dropZone.classList.add('active');
        });
        
        this.dropZone.addEventListener('dragleave', () => {
            this.dropZone.classList.remove('active');
        });
        
        this.dropZone.addEventListener('drop', (e) => {
            e.preventDefault();
            this.dropZone.classList.remove('active');
            
            // Check if files or folders were dropped
            if (e.dataTransfer.items) {
                // Check if a folder was dropped
                const items = e.dataTransfer.items;
                if (items[0].webkitGetAsEntry && items[0].webkitGetAsEntry().isDirectory) {
                    this.handleFolderSelection(e.dataTransfer.items);
                } else {
                    // Handle files
                    const files = e.dataTransfer.files;
                    if (files.length > 0) {
                        if (files.length === 1) {
                            this.processSingleFile(files[0]);
                        } else {
                            this.processMultipleFiles(Array.from(files));
                        }
                    }
                }
            }
        });
        
        // File input events
        this.fileInput.addEventListener('change', (e) => {
            if (e.target.files.length > 0) {
                this.processSingleFile(e.target.files[0]);
            }
        });
        
        // Folder input events
        this.folderInput.addEventListener('change', (e) => {
            if (e.target.files.length > 0) {
                this.processMultipleFiles(Array.from(e.target.files));
            }
        });
        
        // Player controls
        this.playPauseButton.addEventListener('click', () => {
            if (this.isPlaying) {
                if (this.isPaused) {
                    this.resumePlayback();
                } else {
                    this.pausePlayback();
                }
            }
        });
        
        this.backButton.addEventListener('click', () => {
            this.stopPlayback();
            this.switchToLandingScreen();
        });
        
        this.saveVideoButton.addEventListener('click', () => {
            if (this.recorder && this.recorder.getRecordedVideos().length > 0) {
                this.recorder.saveVideo();
            }
        });
        
        this.saveAllButton.addEventListener('click', () => {
            if (this.recorder && this.recorder.getRecordedVideos().length > 0) {
                this.recorder.saveAllVideos();
            }
        });
        
        // Settings controls
        this.cubeSpeedControl.addEventListener('input', (e) => {
            this.visualizer.setCubeSpeed(parseFloat(e.target.value));
        });
        
        this.particleSizeControl.addEventListener('input', (e) => {
            this.visualizer.setParticleSize(parseFloat(e.target.value));
        });
        
        this.soundPresetControl.addEventListener('change', (e) => {
            this.visualizer.updateSoundPreset(e.target.value);
        });
        
        this.bpmSyncControl.addEventListener('change', (e) => {
            this.visualizer.setUseAutoBPM(e.target.checked);
        });
        
        // Handle keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if (e.code === 'Space' && this.isPlaying) {
                e.preventDefault();
                if (this.isPaused) {
                    this.resumePlayback();
                } else {
                    this.pausePlayback();
                }
            }
        });
        
        // Handle window resize
        window.addEventListener('resize', () => {
            if (this.visualizer) {
                this.visualizer.onWindowResize();
            }
        });
    }

    async processSingleFile(file) {
        // Check if file is audio
        if (!file.type.startsWith('audio/')) {
            alert('Please select an audio file.');
            return;
        }
        
        // Switch to player screen
        this.switchToPlayerScreen();
        
        // Show loading
        this.showProgress(true);
        this.updateProgress(0, `Loading ${file.name}...`);
        
        try {
            // Load audio file
            await this.audioProcessor.loadAudioFile(file);
            
            // Update title
            this.songTitle.textContent = file.name;
            
            // Reset visualizer
            this.visualizer.resetScene();
            
            // Start recording if needed
            this.recorder.startRecording(file.name);
            
            // Start playback
            this.startPlayback();
            
            // Update UI
            this.saveVideoButton.disabled = true;
            
            // Configure audio processor callbacks
            this.audioProcessor.setOnPlaybackEndCallback(() => {
                this.handlePlaybackEnd();
            });
            
        } catch (error) {
            console.error("Error processing audio file:", error);
            alert("Failed to process audio file. It may be corrupted or in an unsupported format.");
            this.switchToLandingScreen();
        } finally {
            this.showProgress(false);
        }
    }

    async processMultipleFiles(files) {
        // Filter only audio files
        const audioFiles = files.filter(file => file.type.startsWith('audio/'));
        
        if (audioFiles.length === 0) {
            alert('No audio files found.');
            return;
        }
        
        // Sort files by name
        this.audioFiles = audioFiles.sort((a, b) => a.name.localeCompare(b.name));
        this.currentFileIndex = 0;
        this.isProcessingFolder = true;
        
        // Start processing the first file
        await this.processSingleFile(this.audioFiles[0]);
        
        // Update UI
        this.saveAllButton.disabled = false;
        this.updateProgress(
            this.currentFileIndex / this.audioFiles.length * 100,
            `Processing file ${this.currentFileIndex + 1} of ${this.audioFiles.length}`
        );
        this.showProgress(true);
    }

    async handleFolderSelection(items) {
        // Process folder entries recursively
        this.audioFiles = [];
        
        // Show progress while scanning
        this.showProgress(true);
        this.updateProgress(0, "Scanning folder...");
        
        // Process all items
        const promises = [];
        for (let i = 0; i < items.length; i++) {
            const entry = items[i].webkitGetAsEntry();
            if (entry) {
                promises.push(this.scanEntry(entry));
            }
        }
        
        await Promise.all(promises);
        
        // Filter only audio files and sort by name
        this.audioFiles = this.audioFiles.filter(file => file.type.startsWith('audio/'))
            .sort((a, b) => a.name.localeCompare(b.name));
        
        if (this.audioFiles.length === 0) {
            alert('No audio files found in the folder.');
            this.showProgress(false);
            return;
        }
        
        // Start processing the folder
        this.currentFileIndex = 0;
        this.isProcessingFolder = true;
        
        // Start processing the first file
        await this.processSingleFile(this.audioFiles[0]);
        
        // Update UI
        this.saveAllButton.disabled = false;
        this.updateProgress(
            this.currentFileIndex / this.audioFiles.length * 100,
            `Processing file ${this.currentFileIndex + 1} of ${this.audioFiles.length}`
        );
        this.showProgress(true);
    }

    scanEntry(entry) {
        return new Promise((resolve) => {
            if (entry.isFile) {
                entry.file(file => {
                    this.audioFiles.push(file);
                    resolve();
                });
            } else if (entry.isDirectory) {
                const reader = entry.createReader();
                reader.readEntries(entries => {
                    const promises = [];
                    for (let i = 0; i < entries.length; i++) {
                        promises.push(this.scanEntry(entries[i]));
                    }
                    Promise.all(promises).then(resolve);
                });
            } else {
                resolve();
            }
        });
    }

    startPlayback() {
        // Start audio playback
        this.audioProcessor.play();
        this.isPlaying = true;
        this.isPaused = false;
        
        // Update UI
        this.playPauseButton.textContent = "Pause";
    }

    pausePlayback() {
        // Pause audio playback
        this.audioProcessor.pause();
        this.isPaused = true;
        
        // Update UI
        this.playPauseButton.textContent = "Resume";
    }

    resumePlayback() {
        // Resume audio playback
        this.audioProcessor.play();
        this.isPaused = false;
        
        // Update UI
        this.playPauseButton.textContent = "Pause";
    }

    async stopPlayback() {
        // If recording, stop it
        if (this.recorder && this.recorder.isRecording) {
            try {
                const videoData = await this.recorder.stopRecording();
                this.saveVideoButton.disabled = false;
            } catch (error) {
                console.error("Error stopping recording:", error);
            }
        }
        
        // Stop audio playback
        this.audioProcessor.stop();
        this.isPlaying = false;
        this.isPaused = false;
        
        // Reset visualizer
        if (this.visualizer) {
            this.visualizer.resetScene();
        }
        
        // Cancel animation frame
        if (this.rafId) {
            cancelAnimationFrame(this.rafId);
            this.rafId = null;
        }
    }

    async handlePlaybackEnd() {
        // Stop recording
        if (this.recorder && this.recorder.isRecording) {
            try {
                const videoData = await this.recorder.stopRecording();
                console.log("Video recorded:", videoData.filename);
                this.saveVideoButton.disabled = false;
            } catch (error) {
                console.error("Error stopping recording:", error);
            }
        }
        
        // If processing a folder, move to the next file
        if (this.isProcessingFolder && this.currentFileIndex < this.audioFiles.length - 1) {
            this.currentFileIndex++;
            
            // Update progress
            this.updateProgress(
                this.currentFileIndex / this.audioFiles.length * 100,
                `Processing file ${this.currentFileIndex + 1} of ${this.audioFiles.length}`
            );
            
            // Process next file
            await this.processSingleFile(this.audioFiles[this.currentFileIndex]);
        } else {
            // All files processed
            if (this.isProcessingFolder) {
                this.updateProgress(100, "All files processed!");
                this.saveAllButton.disabled = false;
                this.isProcessingFolder = false;
            }
            
            // Stop playback and reset
            this.stopPlayback();
            this.playPauseButton.textContent = "Play";
        }
    }

    switchToPlayerScreen() {
        this.landingScreen.classList.remove('active');
        this.playerScreen.classList.add('active');
    }

    switchToLandingScreen() {
        this.playerScreen.classList.remove('active');
        this.landingScreen.classList.add('active');
        
        // Reset state
        this.isProcessingFolder = false;
        this.audioFiles = [];
        this.saveVideoButton.disabled = true;
        this.saveAllButton.disabled = true;
        this.showProgress(false);
    }

    showProgress(visible) {
        this.progressContainer.style.display = visible ? 'block' : 'none';
    }

    updateProgress(percent, text) {
        this.progressBar.style.width = `${percent}%`;
        if (text) {
            this.progressText.textContent = text;
        }
    }

    updateTimeDisplay() {
        if (!this.audioProcessor || !this.isPlaying) return;
        
        const currentTime = this.audioProcessor.getCurrentTime();
        const duration = this.audioProcessor.duration;
        
        if (isNaN(currentTime) || isNaN(duration)) return;
        
        // Format time as mm:ss
        const formatTime = (time) => {
            const minutes = Math.floor(time / 60);
            const seconds = Math.floor(time % 60);
            return `${minutes}:${seconds.toString().padStart(2, '0')}`;
        };
        
        this.songProgress.textContent = `${formatTime(currentTime)} / ${formatTime(duration)}`;
    }

    animate() {
        this.rafId = requestAnimationFrame(() => this.animate());
        
        // Process audio if playing
        if (this.isPlaying && !this.isPaused) {
            const audioData = this.audioProcessor.processAudio();
            
            if (audioData) {
                // Update visualizer
                this.visualizer.update(audioData);
                
                // Capture frame if recording
                if (this.recorder && this.recorder.isRecording) {
                    this.recorder.capture();
                }
                
                // Update time display
                this.updateTimeDisplay();
            }
        } else {
            // Just render the scene if paused
            if (this.visualizer) {
                this.visualizer.update(null);
            }
        }
    }
}

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    const app = new AudioVisualizerApp();
});