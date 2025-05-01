#    **WARNING: NOT WORKING AT ALL LIKE EXTREMELY BUGGY**





# 🎶 **Interactive Music Visualizer** 🎨

Welcome to the **Interactive Music Visualizer** — the web app that brings your music to life through vibrant, dynamic, and artistic visualizations! 🖥️💫 With just a simple drag-and-drop interface, you can process a single song or an entire folder of songs, and generate stunning visual animations that respond to every beat and rhythm. 🎧🎶

---

## ✨ **Core Features** ✨

### 1. **Song Processing 🎵**
- **Drag & Drop:** Simply drag a song file and drop it into the app to start the magic! 📤🎶
- **Bouncing Cube:** Watch a colorful, square cube bounce around the screen, leaving a trail of smooth, vibrant RGB particles behind. ✨🟥🟦🟩
- **Hotspots & Sound:** Whenever the cube hits invisible "hotspots," it triggers soft piano-like sounds (think MIDI notes) 🎹✨.
- **Music Sync:** The cube’s movement dynamically reacts to the beats, bass, and energy of the song — faster and more intense for higher energy beats! ⚡️🎶
- **Particle Trails:** As the cube moves, it leaves behind a smooth trail of color-changing particles, creating an ever-changing, artistic visualization. 🌈💥

### 2. **Folder Mode 📂**
- **Batch Processing:** Select a folder with multiple songs, and the app will automatically process them one by one. 📂🎶
- **MP4 Recording:** For every song, the app records the entire visual experience into an MP4 video. 🎥📹
- **Download Ready:** After processing, all the MP4s will be ready for download, making it easy to save and share your visual creations. 🗂️💾

### 3. **Customization 🎨**
- **Visual Tweaks:** Personalize the cube’s speed, particle size, and color schemes to match your style. 🎨🖌️
- **BPM Sync Toggle:** Sync the cube’s movement even more to the song’s BPM for extra responsiveness. 🕺🎵
- **Sound Presets:** Choose from a variety of sound presets like "Piano", "Synth", or "Bell" for a different musical vibe. 🎹🎸🔔

### 4. **Sound Integration 🎶**
- **Audio Analysis:** The app uses the **Web Audio API** to analyze the song’s beats and energy in real-time, syncing the visuals accordingly. 🎧💻
- **Sound Triggers:** When the cube interacts with hotspots, it generates soft, piano-like notes using **Tone.js** (if needed). 🎶🎼

---

## 🔧 **Technical Details** 🔧

- **Audio Analysis:** Real-time beat and peak detection using the **Web Audio API** for smooth, dynamic interactions. 🔊🎶
- **3D Rendering:** Beautiful and smooth visual effects powered by **Three.js** for the cube and particle trails. 🎮✨
- **Sound Generation:** **Tone.js** (optional) creates the piano-like sounds that sync with the cube's interactions. 🎶🎼
- **MP4 Recording:** **CCapture.js** or **MediaRecorder API** for automatically recording the animations into MP4 files. 📹🎥
- **Drag & Drop:** Support for both individual song files and entire folders using the `webkitdirectory` attribute. 🖱️💿
- **No Backend Required:** Everything runs fully in the browser — zero server-side code required! 🌐🚀

---

## 🚀 **Getting Started** 🚀

### **Requirements:**
- A modern web browser (e.g., Chrome, Firefox, Safari, or Edge) 🌍💻
- No server setup required — everything works in your browser! 🎉

### **Installation:**
1. Clone or download the repository to your local machine. 🧳
2. Open the `index.html` file in your browser. 🌐
3. Drag & drop a song file (or folder) into the app to begin creating amazing visualizations! 🎶🖥️

### **Controls:**
- **Drag & Drop:** Drop a song or folder into the interface to start processing. 🖱️📂
- **Start Processing:** Click "Process Song" for single song processing, or "Process Folder" to process all songs in a folder. 📂🎶
- **Settings:** Adjust the cube’s speed, particle size, or change sound presets through the settings menu. ⚙️🎨

### **Folder Processing:**
- Select a folder, and the app will automatically process all songs, saving each animation as an MP4. 📹💾
- Once the folder is processed, you can download all the videos at once for easy access. 🎥🔽

---

## ⚡️ **How It Works** ⚡️

1. **Step 1:** Drop a song or folder onto the app. 🎶📂
2. **Step 2:** The app analyzes the song’s audio, detecting beats, peaks, and energy changes in real-time. 🎧🎤
3. **Step 3:** A colorful cube starts bouncing around, leaving behind trails of particles while reacting to the song’s rhythm. 🔴🟢🔵
4. **Step 4:** The cube’s interaction with invisible hotspots triggers soft sounds, like piano notes. 🎹✨
5. **Step 5:** After folder processing, all MP4 videos of the animations will be ready for download. 🎥💾

---

## 🛠️ **Libraries Used** 🛠️

- **Web Audio API:** Real-time audio analysis for beat detection and syncing visual effects. 🎶🔊
- **Three.js:** For rendering smooth, interactive 3D visuals. 🌈🔲
- **Tone.js:** (Optional) Used for generating musical notes when the cube interacts with hotspots. 🎵🎹
- **CCapture.js / MediaRecorder API:** For recording and saving visualizations as MP4 files. 🎥💾
- **Tailwind CSS / Bootstrap:** For a sleek, modern, and responsive user interface. 🎨✨

---

## 📅 **Roadmap** 📅

- [ ] **Add More Sound Presets** (e.g., Guitar, Drums, Bass). 🎸🥁
- [ ] **Improve UI/UX** for a more immersive experience. 🖥️🎮
- [ ] **More Customization Options** (particle effects, cube movement styles, etc.). ✨🎨
- [ ] **Waveform Visualizations** for even more exciting interaction. 🎶🔊

---

## 🤝 **Contributing** 🤝

Want to help improve this project? Great! 🎉 Feel free to fork the repo and submit a pull request with your changes. Report any issues or suggest new features in the Issues section. 🙌💻

---

## 📜 **License** 📜

This project is licensed under the MIT License. See the [LICENSE.md](LICENSE.md) file for more details. 📝🔓

---

## 💖 **Acknowledgements** 💖

Big thanks to the creators of **Three.js**, **Tone.js**, and **Web Audio API** for the powerful tools that helped make this project a reality. 🎉🌍
