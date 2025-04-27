/**
 * Video Recorder
 * Handles recording the canvas animation to MP4
 */
class VideoRecorder {
    constructor(renderer) {
        this.renderer = renderer;
        this.capturer = null;
        this.isRecording = false;
        this.filename = "audio_visualization";
        this.framerate = 60;
        this.recordedVideos = [];
    }

    startRecording(filename) {
        if (this.isRecording) return;
        
        if (filename) {
            this.filename = filename.replace(/\.[^/.]+$/, ""); // Remove extension if present
        }
        
        // Create CCapture instance
        this.capturer = new CCapture({
            format: 'webm',
            framerate: this.framerate,
            verbose: false,
            display: false,
            quality: 85,
            name: this.filename
        });
        
        console.log(`Starting recording: ${this.filename}`);
        this.capturer.start();
        this.isRecording = true;
    }

    capture() {
        if (!this.isRecording || !this.capturer) return;
        
        try {
            // Capture the current frame
            this.capturer.capture(this.renderer.domElement);
        } catch (error) {
            console.error("Error capturing frame:", error);
        }
    }

    stopRecording() {
        return new Promise((resolve, reject) => {
            if (!this.isRecording || !this.capturer) {
                reject(new Error("No active recording"));
                return;
            }
            
            console.log("Stopping recording and saving...");
            this.isRecording = false;
            
            try {
                this.capturer.stop();
                
                // Save the video
                this.capturer.save((blob) => {
                    const videoData = {
                        filename: `${this.filename}.webm`,
                        blob: blob,
                        url: URL.createObjectURL(blob)
                    };
                    
                    this.recordedVideos.push(videoData);
                    console.log(`Recording saved: ${videoData.filename}`);
                    resolve(videoData);
                });
            } catch (error) {
                console.error("Error stopping recording:", error);
                reject(error);
            }
        });
    }

    saveVideo(videoData) {
        if (!videoData) {
            if (this.recordedVideos.length === 0) {
                console.error("No video to save");
                return;
            }
            videoData = this.recordedVideos[this.recordedVideos.length - 1];
        }
        
        try {
            download(videoData.blob, videoData.filename, "video/webm");
        } catch (error) {
            console.error("Error saving video:", error);
            
            // Fallback method
            const link = document.createElement('a');
            link.href = videoData.url;
            link.download = videoData.filename;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }
    }

    saveAllVideos() {
        if (this.recordedVideos.length === 0) {
            console.error("No videos to save");
            return;
        }
        
        this.recordedVideos.forEach(video => {
            this.saveVideo(video);
        });
    }

    getRecordedVideos() {
        return this.recordedVideos;
    }

    clearRecordedVideos() {
        // Revoke URLs to free memory
        this.recordedVideos.forEach(video => {
            URL.revokeObjectURL(video.url);
        });
        
        this.recordedVideos = [];
    }
}