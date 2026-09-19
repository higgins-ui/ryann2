# Galaxy Happy Birthday 3D


An interactive 3D web project built as a personalized birthday gift. It renders a space environment with Three.js that transitions through photos and custom messages accompanied by background audio.

Live Demo: https://cotera2024.github.io/Happy-Birthday-Galaxy--main/

## Features

* Real-time 3D galaxy rendered with Three.js.
* Camera transitions and timeline animations powered by GSAP.
* Centralized configuration: all text content, photo paths, and audio tracks are managed through a single JSON file without editing source code.
* Responsive rendering for mobile and desktop devices.

## Project Structure

* `index.html`: Main HTML entry point.
* `settings.json`: Configuration file for texts, photos, and audio.
* `js/main.js`: Entry point that wires the state, DOM, events and render loop.
* `js/environment.js`: 3D world (scene, camera, renderer, post-FX, starfield).
* `js/sequence.js`: GSAP animations (intro, focus tours, captions, finale).
* `js/media.js`: Creates the photo planes inside the scene.
* `js/settings.js`: Loads and merges `settings.json` with built-in defaults.
* `js/config.js`: Visual/performance constants (colors, quality, particle ranges).
* `js/utils.js`: Shared pure helpers (mobile/WebGL checks, textures, random).
* `css/styles.css`: Visual styling and overlay UI.
* `photos/`: Directory for image assets.
* `music/`: Directory for audio files.

## Customization

To customize the gift, modify the `settings.json` file:

1. Place your images in the `photos/` directory (WebP format recommended).
2. Place your audio tracks in the `music/` directory (provide `.m4a` and `.ogg` formats for cross-browser compatibility).
3. Open `settings.json` and update the values:
   * `texts`: Interface headings and captions.
   * `audio`: File paths for ambient and final music tracks.
   * `photos`: Image lists along with their captions.

## Local Setup

Because this project uses ES Modules, opening `index.html` directly via file protocol will be blocked by CORS policies.

To run it locally, start a local HTTP server:

```bash
python3 -m http.server 8080
```

Alternatively, use the Live Server extension in VS Code.

---

**Isaac Daniel Cotera — 2026**
