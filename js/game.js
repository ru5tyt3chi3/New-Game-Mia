// ============================================
// Mia's Adventure - Platform Game Foundation
// ============================================

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Game Constants
const GRAVITY = 0.6;
const FRICTION = 0.85;
const JUMP_FORCE = -14;
const MOVE_SPEED = 3;

// Input Handler
const keys = {
    left: false,
    right: false,
    jump: false
};

// ============================================
// Sound Manager (Web Audio API)
// ============================================
class SoundManager {
    constructor() {
        this.audioContext = null;
        this.muted = false;
        this.musicGain = null;
        this.sfxGain = null;
        this.musicOscillators = [];
        this.initialized = false;
    }

    init() {
        if (this.initialized) return;
        this.audioContext = new (window.AudioContext || window.webkitAudioContext)();

        // Master gains for music and SFX
        this.musicGain = this.audioContext.createGain();
        this.musicGain.gain.value = 0.3;
        this.musicGain.connect(this.audioContext.destination);

        this.sfxGain = this.audioContext.createGain();
        this.sfxGain.gain.value = 0.5;
        this.sfxGain.connect(this.audioContext.destination);

        this.initialized = true;
    }

    playJump() {
        if (this.muted || !this.initialized) return;

        const osc = this.audioContext.createOscillator();
        const gain = this.audioContext.createGain();

        osc.connect(gain);
        gain.connect(this.sfxGain);

        osc.type = 'square';
        osc.frequency.setValueAtTime(300, this.audioContext.currentTime);
        osc.frequency.exponentialRampToValueAtTime(600, this.audioContext.currentTime + 0.1);

        gain.gain.setValueAtTime(0.3, this.audioContext.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.15);

        osc.start();
        osc.stop(this.audioContext.currentTime + 0.15);
    }

    playLand() {
        if (this.muted || !this.initialized) return;

        const osc = this.audioContext.createOscillator();
        const gain = this.audioContext.createGain();

        osc.connect(gain);
        gain.connect(this.sfxGain);

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(150, this.audioContext.currentTime);
        osc.frequency.exponentialRampToValueAtTime(80, this.audioContext.currentTime + 0.1);

        gain.gain.setValueAtTime(0.2, this.audioContext.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.1);

        osc.start();
        osc.stop(this.audioContext.currentTime + 0.1);
    }

    startMusic() {
        if (!this.initialized) return;
        this.stopMusic();

        // Simple looping melody
        const notes = [261.63, 329.63, 392.00, 329.63]; // C4, E4, G4, E4
        const noteLength = 0.5;

        const playNote = (freq, startTime, duration) => {
            const osc = this.audioContext.createOscillator();
            const gain = this.audioContext.createGain();

            osc.connect(gain);
            gain.connect(this.musicGain);

            osc.type = 'sine';
            osc.frequency.value = freq;

            gain.gain.setValueAtTime(0, startTime);
            gain.gain.linearRampToValueAtTime(0.15, startTime + 0.05);
            gain.gain.linearRampToValueAtTime(0, startTime + duration);

            osc.start(startTime);
            osc.stop(startTime + duration);

            this.musicOscillators.push(osc);
        };

        const loopLength = notes.length * noteLength;

        const scheduleLoop = () => {
            if (this.muted) return;

            const now = this.audioContext.currentTime;
            notes.forEach((note, i) => {
                playNote(note, now + i * noteLength, noteLength * 0.9);
            });

            this.musicTimeout = setTimeout(scheduleLoop, loopLength * 1000);
        };

        scheduleLoop();
    }

    startMenuMusic() {
        if (!this.initialized) return;
        this.stopMusic();

        // Calm, pleasant menu melody
        const melody = [
            { note: 392.00, dur: 0.4 },  // G4
            { note: 440.00, dur: 0.4 },  // A4
            { note: 493.88, dur: 0.8 },  // B4
            { note: 440.00, dur: 0.4 },  // A4
            { note: 392.00, dur: 0.4 },  // G4
            { note: 329.63, dur: 0.8 },  // E4
            { note: 293.66, dur: 0.4 },  // D4
            { note: 329.63, dur: 0.4 },  // E4
            { note: 392.00, dur: 1.2 },  // G4
        ];

        const playMenuNote = (freq, startTime, duration) => {
            const osc = this.audioContext.createOscillator();
            const gain = this.audioContext.createGain();

            osc.connect(gain);
            gain.connect(this.musicGain);

            osc.type = 'sine';
            osc.frequency.value = freq;

            // Soft attack and release
            gain.gain.setValueAtTime(0, startTime);
            gain.gain.linearRampToValueAtTime(0.12, startTime + 0.08);
            gain.gain.setValueAtTime(0.12, startTime + duration - 0.1);
            gain.gain.linearRampToValueAtTime(0, startTime + duration);

            osc.start(startTime);
            osc.stop(startTime + duration);

            this.musicOscillators.push(osc);
        };

        // Add gentle pad underneath
        const playPad = (freq, startTime, duration) => {
            const osc = this.audioContext.createOscillator();
            const gain = this.audioContext.createGain();

            osc.connect(gain);
            gain.connect(this.musicGain);

            osc.type = 'triangle';
            osc.frequency.value = freq / 2; // One octave lower

            gain.gain.setValueAtTime(0, startTime);
            gain.gain.linearRampToValueAtTime(0.05, startTime + 0.2);
            gain.gain.setValueAtTime(0.05, startTime + duration - 0.3);
            gain.gain.linearRampToValueAtTime(0, startTime + duration);

            osc.start(startTime);
            osc.stop(startTime + duration);

            this.musicOscillators.push(osc);
        };

        let totalDuration = 0;
        melody.forEach(n => totalDuration += n.dur);

        const scheduleMenuLoop = () => {
            if (this.muted) return;

            const now = this.audioContext.currentTime;
            let time = 0;

            melody.forEach(({ note, dur }) => {
                playMenuNote(note, now + time, dur * 0.9);
                time += dur;
            });

            // Pad chord
            playPad(261.63, now, totalDuration); // C
            playPad(329.63, now, totalDuration); // E
            playPad(392.00, now, totalDuration); // G

            this.musicTimeout = setTimeout(scheduleMenuLoop, totalDuration * 1000);
        };

        scheduleMenuLoop();
    }

    stopMusic() {
        if (this.musicTimeout) {
            clearTimeout(this.musicTimeout);
            this.musicTimeout = null;
        }
        this.musicOscillators.forEach(osc => {
            try { osc.stop(); } catch(e) {}
        });
        this.musicOscillators = [];
    }

    toggleMute() {
        this.muted = !this.muted;
        if (this.muted) {
            this.stopMusic();
            if (this.musicGain) this.musicGain.gain.value = 0;
            if (this.sfxGain) this.sfxGain.gain.value = 0;
        } else {
            if (this.musicGain) this.musicGain.gain.value = 0.3;
            if (this.sfxGain) this.sfxGain.gain.value = 0.5;
            // Play appropriate music based on game state
            if (gameState === 'menu' || gameState === 'settings') {
                this.startMenuMusic();
            } else {
                this.startMusic();
            }
        }
        return this.muted;
    }

    startScaryMusic() {
        if (!this.initialized) return;
        this.stopMusic();

        // Creepy dissonant drone
        const playDrone = () => {
            if (this.muted) return;

            const now = this.audioContext.currentTime;

            // Low ominous drone
            const drone = this.audioContext.createOscillator();
            const droneGain = this.audioContext.createGain();
            drone.connect(droneGain);
            droneGain.connect(this.musicGain);
            drone.type = 'sawtooth';
            drone.frequency.value = 55; // Low A
            droneGain.gain.setValueAtTime(0.08, now);
            drone.start(now);
            drone.stop(now + 4);
            this.musicOscillators.push(drone);

            // Dissonant high tone
            const high = this.audioContext.createOscillator();
            const highGain = this.audioContext.createGain();
            high.connect(highGain);
            highGain.connect(this.musicGain);
            high.type = 'sine';
            high.frequency.setValueAtTime(440, now);
            high.frequency.linearRampToValueAtTime(466.16, now + 2); // Slide to dissonant
            high.frequency.linearRampToValueAtTime(440, now + 4);
            highGain.gain.setValueAtTime(0.03, now);
            highGain.gain.linearRampToValueAtTime(0.06, now + 2);
            highGain.gain.linearRampToValueAtTime(0.03, now + 4);
            high.start(now);
            high.stop(now + 4);
            this.musicOscillators.push(high);

            // Random creepy stabs
            if (Math.random() > 0.5) {
                const stab = this.audioContext.createOscillator();
                const stabGain = this.audioContext.createGain();
                stab.connect(stabGain);
                stabGain.connect(this.musicGain);
                stab.type = 'square';
                stab.frequency.value = 200 + Math.random() * 100;
                const stabTime = now + Math.random() * 3;
                stabGain.gain.setValueAtTime(0, stabTime);
                stabGain.gain.linearRampToValueAtTime(0.1, stabTime + 0.05);
                stabGain.gain.linearRampToValueAtTime(0, stabTime + 0.2);
                stab.start(stabTime);
                stab.stop(stabTime + 0.3);
                this.musicOscillators.push(stab);
            }

            this.musicTimeout = setTimeout(playDrone, 4000);
        };

        playDrone();
    }

    playWhisper() {
        if (this.muted || !this.initialized) return;

        // Creepy whisper-like sound using filtered noise
        const bufferSize = this.audioContext.sampleRate * 0.5;
        const buffer = this.audioContext.createBuffer(1, bufferSize, this.audioContext.sampleRate);
        const data = buffer.getChannelData(0);

        // Generate noise
        for (let i = 0; i < bufferSize; i++) {
            data[i] = (Math.random() * 2 - 1) * 0.3;
        }

        const noise = this.audioContext.createBufferSource();
        noise.buffer = buffer;

        // Filter to make it sound like whisper
        const filter = this.audioContext.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.value = 800;
        filter.Q.value = 1;

        const gain = this.audioContext.createGain();
        gain.gain.setValueAtTime(0, this.audioContext.currentTime);
        gain.gain.linearRampToValueAtTime(0.15, this.audioContext.currentTime + 0.1);
        gain.gain.linearRampToValueAtTime(0, this.audioContext.currentTime + 0.4);

        noise.connect(filter);
        filter.connect(gain);
        gain.connect(this.sfxGain);

        noise.start();
        noise.stop(this.audioContext.currentTime + 0.5);
    }
}

const sound = new SoundManager();

// ============================================
// Player Class (Mia)
// ============================================
class Player {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.width = 32;
        this.height = 48;
        this.velX = 0;
        this.velY = 0;
        this.isGrounded = false;
        this.color = '#e94560';
        this.eyeColor = '#ffffff';
    }

    update(platforms) {
        // Horizontal movement
        if (keys.left) {
            this.velX = -MOVE_SPEED;
        } else if (keys.right) {
            this.velX = MOVE_SPEED;
        } else {
            this.velX *= FRICTION;
        }

        // Jumping
        if (keys.jump && this.isGrounded) {
            this.velY = JUMP_FORCE;
            this.isGrounded = false;
            sound.playJump();
        }

        // Apply gravity
        this.velY += GRAVITY;

        // Update position
        this.x += this.velX;
        this.y += this.velY;

        // Track previous grounded state for land sound
        const wasGrounded = this.isGrounded;

        // Reset grounded state before collision check
        this.isGrounded = false;

        // Platform collision
        for (const platform of platforms) {
            this.checkCollision(platform);
        }

        // Canvas boundaries
        if (this.x < 0) this.x = 0;
        if (this.x + this.width > canvas.width) this.x = canvas.width - this.width;
        if (this.y + this.height > canvas.height) {
            this.y = canvas.height - this.height;
            this.velY = 0;
            this.isGrounded = true;
        }

        // Play land sound when landing
        if (!wasGrounded && this.isGrounded) {
            sound.playLand();
        }
    }

    checkCollision(platform) {
        // Calculate overlap
        const overlapX = Math.min(this.x + this.width, platform.x + platform.width) -
                         Math.max(this.x, platform.x);
        const overlapY = Math.min(this.y + this.height, platform.y + platform.height) -
                         Math.max(this.y, platform.y);

        if (overlapX > 0 && overlapY > 0) {
            // Collision detected - resolve based on smallest overlap
            const prevBottom = this.y + this.height - this.velY;
            const prevTop = this.y - this.velY;

            // Landing on top of platform
            if (prevBottom <= platform.y && this.velY >= 0) {
                this.y = platform.y - this.height;
                this.velY = 0;
                this.isGrounded = true;
            }
            // Hitting bottom of platform
            else if (prevTop >= platform.y + platform.height && this.velY < 0) {
                this.y = platform.y + platform.height;
                this.velY = 0;
            }
            // Side collision
            else if (overlapX < overlapY) {
                if (this.x < platform.x) {
                    this.x = platform.x - this.width;
                } else {
                    this.x = platform.x + platform.width;
                }
                this.velX = 0;
            }
        }
    }

    draw() {
        // Body
        ctx.fillStyle = this.color;
        ctx.fillRect(this.x, this.y, this.width, this.height);

        // Face direction based on movement
        const faceDir = this.velX >= 0 ? 1 : -1;
        const eyeOffsetX = faceDir === 1 ? 18 : 8;

        // Eyes
        ctx.fillStyle = this.eyeColor;
        ctx.beginPath();
        ctx.arc(this.x + eyeOffsetX, this.y + 15, 4, 0, Math.PI * 2);
        ctx.fill();

        // Pupil
        ctx.fillStyle = '#1a1a2e';
        ctx.beginPath();
        ctx.arc(this.x + eyeOffsetX + (faceDir * 1), this.y + 15, 2, 0, Math.PI * 2);
        ctx.fill();

        // Smile
        ctx.strokeStyle = '#1a1a2e';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(this.x + 16, this.y + 28, 6, 0.1 * Math.PI, 0.9 * Math.PI);
        ctx.stroke();
    }
}

// ============================================
// Platform Class
// ============================================
class Platform {
    constructor(x, y, width, height, color = '#4a90a4', bloody = false) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.color = color;
        this.bloody = bloody;
    }

    draw() {
        // Main platform body
        ctx.fillStyle = this.bloody ? '#2a1a1a' : this.color;
        ctx.fillRect(this.x, this.y, this.width, this.height);

        // Top grass/surface layer (blood-soaked if bloody)
        if (this.bloody) {
            // Dark blood base
            ctx.fillStyle = '#3a0a0a';
            ctx.fillRect(this.x, this.y, this.width, 8);
            // Brighter blood streaks
            ctx.fillStyle = '#6a0000';
            ctx.fillRect(this.x + 5, this.y + 1, this.width - 10, 4);
            // Blood drips
            ctx.fillStyle = '#8b0000';
            for (let i = 0; i < this.width; i += 15) {
                const dripHeight = 3 + Math.sin(i) * 2;
                ctx.fillRect(this.x + i + 5, this.y + 6, 3, dripHeight);
            }
        } else {
            ctx.fillStyle = '#5cb85c';
            ctx.fillRect(this.x, this.y, this.width, 6);
        }

        // Platform edge highlights
        ctx.fillStyle = this.bloody ? 'rgba(139,0,0,0.3)' : 'rgba(255,255,255,0.1)';
        ctx.fillRect(this.x, this.y, this.width, 2);

        // Platform bottom shadow
        ctx.fillStyle = 'rgba(0,0,0,0.3)';
        ctx.fillRect(this.x, this.y + this.height - 3, this.width, 3);
    }
}

// ============================================
// Goal Class (Level Exit)
// ============================================
class Goal {
    constructor(x, y, hasBlood = false) {
        this.x = x;
        this.y = y;
        this.width = 40;
        this.height = 60;
        this.animFrame = 0;
        this.hasBlood = hasBlood;
    }

    update() {
        this.animFrame += 0.05;
    }

    draw() {
        // Glowing effect (dimmer if creepy level)
        const glow = this.hasBlood ? 0.4 : Math.sin(this.animFrame) * 0.3 + 0.7;

        // Outer glow (no glow on creepy level)
        if (!this.hasBlood) {
            ctx.fillStyle = `rgba(255, 215, 0, ${glow * 0.3})`;
            ctx.beginPath();
            ctx.arc(this.x + this.width/2, this.y + this.height/2, 40, 0, Math.PI * 2);
            ctx.fill();
        }

        // Flag pole
        ctx.fillStyle = this.hasBlood ? '#5a3a1a' : '#8B4513';
        ctx.fillRect(this.x + 5, this.y, 6, this.height);

        // Flag (duller on creepy level)
        ctx.fillStyle = this.hasBlood ? `rgba(180, 150, 50, ${glow})` : `rgba(255, 215, 0, ${glow})`;
        ctx.beginPath();
        ctx.moveTo(this.x + 11, this.y + 5);
        ctx.lineTo(this.x + 40, this.y + 20);
        ctx.lineTo(this.x + 11, this.y + 35);
        ctx.closePath();
        ctx.fill();

        // Star on flag
        ctx.fillStyle = this.hasBlood ? '#aaa' : '#fff';
        ctx.font = '14px Arial';
        ctx.fillText('★', this.x + 18, this.y + 25);

        // Blood speck near the flag (soaked into grass)
        if (this.hasBlood) {
            // Blood stain on the grass - positioned at flag base
            ctx.fillStyle = '#5a1a1a'; // Darker blood mixed with grass
            ctx.fillRect(this.x + 15, this.y + this.height - 6, 20, 6);

            // Slightly lighter blood edge
            ctx.fillStyle = '#8b0000';
            ctx.fillRect(this.x + 18, this.y + this.height - 5, 14, 4);
        }
    }

    checkCollision(player) {
        return player.x < this.x + this.width &&
               player.x + player.width > this.x &&
               player.y < this.y + this.height &&
               player.y + player.height > this.y;
    }
}

// ============================================
// Level Definitions
// ============================================
const levels = [
    // Level 1 - Tutorial
    {
        name: "Getting Started",
        playerStart: { x: 50, y: 480 },
        goal: { x: 730, y: 490 },
        platforms: [
            { x: 0, y: 550, w: 800, h: 50 },
            { x: 200, y: 480, w: 120, h: 25 },
            { x: 400, y: 420, w: 120, h: 25 },
            { x: 600, y: 480, w: 120, h: 25 },
        ]
    },
    // Level 2 - Climb Up
    {
        name: "The Ascent",
        playerStart: { x: 50, y: 480 },
        goal: { x: 370, y: 40 },
        platforms: [
            { x: 0, y: 550, w: 200, h: 50 },
            { x: 100, y: 450, w: 150, h: 25 },
            { x: 300, y: 380, w: 150, h: 25 },
            { x: 500, y: 310, w: 150, h: 25 },
            { x: 280, y: 240, w: 150, h: 25 },
            { x: 80, y: 170, w: 150, h: 25 },
            { x: 350, y: 100, w: 150, h: 25 },
        ]
    },
    // Level 3 - Gaps
    {
        name: "Mind the Gap",
        playerStart: { x: 50, y: 480 },
        goal: { x: 720, y: 90 },
        platforms: [
            { x: 0, y: 550, w: 150, h: 50 },
            { x: 220, y: 550, w: 100, h: 50 },
            { x: 400, y: 500, w: 100, h: 25 },
            { x: 550, y: 430, w: 100, h: 25 },
            { x: 350, y: 350, w: 100, h: 25 },
            { x: 150, y: 280, w: 100, h: 25 },
            { x: 350, y: 210, w: 100, h: 25 },
            { x: 550, y: 150, w: 100, h: 25 },
            { x: 700, y: 150, w: 100, h: 25 },
        ]
    },
    // Level 4 - Zigzag
    {
        name: "Zigzag Path",
        playerStart: { x: 50, y: 100 },
        goal: { x: 700, y: 490 },
        platforms: [
            { x: 0, y: 150, w: 180, h: 25 },
            { x: 250, y: 200, w: 150, h: 25 },
            { x: 470, y: 250, w: 150, h: 25 },
            { x: 620, y: 320, w: 180, h: 25 },
            { x: 400, y: 390, w: 150, h: 25 },
            { x: 180, y: 460, w: 150, h: 25 },
            { x: 400, y: 530, w: 150, h: 25 },
            { x: 620, y: 550, w: 180, h: 50 },
        ]
    },
    // Level 5 - Final Challenge
    {
        name: "The Summit",
        playerStart: { x: 400, y: 520 },
        goal: { x: 380, y: 30 },
        platforms: [
            { x: 300, y: 550, w: 200, h: 50 },
            { x: 50, y: 480, w: 120, h: 25 },
            { x: 630, y: 480, w: 120, h: 25 },
            { x: 150, y: 400, w: 120, h: 25 },
            { x: 530, y: 400, w: 120, h: 25 },
            { x: 350, y: 340, w: 100, h: 25 },
            { x: 150, y: 270, w: 100, h: 25 },
            { x: 550, y: 270, w: 100, h: 25 },
            { x: 350, y: 200, w: 100, h: 25 },
            { x: 200, y: 130, w: 100, h: 25 },
            { x: 500, y: 130, w: 100, h: 25 },
            { x: 350, y: 90, w: 100, h: 25 },
        ]
    },
    // Level 6 - Something's Wrong...
    {
        name: "...",
        playerStart: { x: 50, y: 520 },
        goal: { x: 400, y: 290 },
        noMusic: true,
        hasBlood: true,
        platforms: [
            { x: 0, y: 550, w: 150, h: 50 },
            { x: 200, y: 500, w: 80, h: 20 },
            { x: 330, y: 450, w: 80, h: 20 },
            { x: 480, y: 400, w: 80, h: 20 },
            { x: 620, y: 350, w: 80, h: 20 },
            { x: 480, y: 300, w: 80, h: 20 },
            { x: 350, y: 350, w: 150, h: 25 },
        ]
    },
    // Level 7 - IT GETS WORSE
    {
        name: "RUN",
        playerStart: { x: 50, y: 480 },
        goal: { x: 650, y: 140 },
        scaryMusic: true,
        hasBlood: true,
        glitchTitle: true,
        triggerCutscene: true, // Triggers cutscene after completion
        platforms: [
            { x: 0, y: 550, w: 120, h: 50 },
            { x: 180, y: 480, w: 100, h: 20 },
            { x: 350, y: 410, w: 100, h: 20 },
            { x: 520, y: 340, w: 100, h: 20 },
            { x: 350, y: 270, w: 100, h: 20 },
            { x: 520, y: 200, w: 100, h: 20 },
            { x: 600, y: 200, w: 150, h: 25, bloody: true },
        ]
    },
    // Level 8 - Back to Normal
    {
        name: "New Dawn",
        playerStart: { x: 50, y: 480 },
        goal: { x: 720, y: 90 },
        platforms: [
            { x: 0, y: 550, w: 200, h: 50 },
            { x: 250, y: 480, w: 120, h: 25 },
            { x: 450, y: 420, w: 120, h: 25 },
            { x: 250, y: 350, w: 120, h: 25 },
            { x: 50, y: 280, w: 120, h: 25 },
            { x: 250, y: 210, w: 120, h: 25 },
            { x: 500, y: 210, w: 120, h: 25 },
            { x: 650, y: 150, w: 150, h: 25 },
        ]
    }
];

// ============================================
// Game State
// ============================================
let currentLevel = 0;
let platforms = [];
let goal = null;
const player = new Player(100, 300);
let levelComplete = false;
let levelTransitionTimer = 0;
let soundInitialized = false;

// Menu state
let gameState = 'menu'; // 'menu', 'settings', 'playing'
let menuButtons = [];
let settingsButtons = [];
let hoveredButton = null;

// Glitch effect state
let glitchActive = false;
let glitchTimer = 0;
let nextGlitchTime = 0;
let glitchDuration = 0;

// Cutscene state
let cutsceneActive = false;
let cutsceneTimer = 0;
let cutscenePhase = 0;
const cutsceneMessages = [
    { text: "wait...", duration: 120 },
    { text: "its not too late", duration: 150 },
    { text: "log off", duration: 120 },
    { text: "fast", duration: 100 }
];

function loadLevel(levelIndex) {
    if (levelIndex >= levels.length) {
        // Game complete - restart from level 1
        currentLevel = 0;
        levelIndex = 0;
    }

    const level = levels[levelIndex];

    // Create platforms (with bloody flag support)
    platforms = level.platforms.map(p =>
        new Platform(p.x, p.y, p.w, p.h, '#3d5a80', p.bloody || false)
    );

    // Create goal with blood flag
    goal = new Goal(level.goal.x, level.goal.y, level.hasBlood);

    // Reset player position
    player.x = level.playerStart.x;
    player.y = level.playerStart.y;
    player.velX = 0;
    player.velY = 0;

    // Handle music for special levels
    if (level.noMusic) {
        sound.stopMusic();
    } else if (level.scaryMusic && soundInitialized && !sound.muted) {
        sound.startScaryMusic();
    } else if (soundInitialized && !sound.muted) {
        sound.startMusic();
    }

    // Reset glitch state
    glitchActive = false;
    glitchTimer = 0;
    nextGlitchTime = level.glitchTitle ? (120 + Math.random() * 360) : 0; // 2-8 seconds at 60fps
    glitchDuration = 0;

    levelComplete = false;
    levelTransitionTimer = 0;
}

// Add level complete sound to SoundManager
SoundManager.prototype.playLevelComplete = function() {
    if (this.muted || !this.initialized) return;

    const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
    notes.forEach((freq, i) => {
        const osc = this.audioContext.createOscillator();
        const gain = this.audioContext.createGain();

        osc.connect(gain);
        gain.connect(this.sfxGain);

        osc.type = 'sine';
        osc.frequency.value = freq;

        const startTime = this.audioContext.currentTime + i * 0.15;
        gain.gain.setValueAtTime(0.3, startTime);
        gain.gain.exponentialRampToValueAtTime(0.01, startTime + 0.3);

        osc.start(startTime);
        osc.stop(startTime + 0.3);
    });
};

// Don't load level immediately - start in menu state
// loadLevel(0);

// ============================================
// Menu System
// ============================================
class Button {
    constructor(x, y, width, height, text, action) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.text = text;
        this.action = action;
        this.hovered = false;
    }

    draw() {
        // Button background
        if (this.hovered) {
            ctx.fillStyle = '#e94560';
        } else {
            ctx.fillStyle = '#3d5a80';
        }
        ctx.fillRect(this.x, this.y, this.width, this.height);

        // Button border
        ctx.strokeStyle = this.hovered ? '#ffffff' : '#e94560';
        ctx.lineWidth = 3;
        ctx.strokeRect(this.x, this.y, this.width, this.height);

        // Button text
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 24px "Segoe UI", sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(this.text, this.x + this.width / 2, this.y + this.height / 2 + 8);
        ctx.textAlign = 'left';
    }

    isInside(mx, my) {
        return mx >= this.x && mx <= this.x + this.width &&
               my >= this.y && my <= this.y + this.height;
    }
}

// Initialize menu buttons
function initMenuButtons() {
    menuButtons = [
        new Button(canvas.width / 2 - 100, 300, 200, 60, 'PLAY', () => {
            gameState = 'playing';
            loadLevel(0);
            // Start music when game starts
            if (soundInitialized && !sound.muted) {
                sound.startMusic();
            }
        }),
        new Button(canvas.width / 2 - 100, 380, 200, 60, 'SETTINGS', () => {
            gameState = 'settings';
        })
    ];

    settingsButtons = [
        new Button(canvas.width / 2 - 100, 250, 200, 60, sound.muted ? 'SOUND: OFF' : 'SOUND: ON', function() {
            sound.toggleMute();
            this.text = sound.muted ? 'SOUND: OFF' : 'SOUND: ON';
        }),
        new Button(canvas.width / 2 - 100, 330, 200, 60, 'CONTROLS', () => {
            // Just show controls info - no action needed
        }),
        new Button(canvas.width / 2 - 100, 480, 200, 60, 'BACK', () => {
            gameState = 'menu';
            // Menu music continues (already playing in settings)
        })
    ];
}

function drawMainMenu() {
    // Background
    drawBackground();

    // Title
    ctx.fillStyle = '#e94560';
    ctx.font = 'bold 56px "Segoe UI", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText("Mia's Adventure", canvas.width / 2, 150);

    // Subtitle
    ctx.fillStyle = '#a0a0a0';
    ctx.font = '20px "Segoe UI", sans-serif';
    ctx.fillText('A Platformer Game', canvas.width / 2, 190);

    // Draw Mia character as decoration
    ctx.fillStyle = '#e94560';
    ctx.fillRect(canvas.width / 2 - 25, 220, 50, 70);
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(canvas.width / 2 + 10, 240, 8, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#1a1a2e';
    ctx.beginPath();
    ctx.arc(canvas.width / 2 + 12, 240, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#1a1a2e';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(canvas.width / 2, 260, 10, 0.1 * Math.PI, 0.9 * Math.PI);
    ctx.stroke();

    // Draw buttons
    for (const button of menuButtons) {
        button.draw();
    }

    ctx.textAlign = 'left';
}

function drawSettingsMenu() {
    // Background
    drawBackground();

    // Title
    ctx.fillStyle = '#e94560';
    ctx.font = 'bold 48px "Segoe UI", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Settings', canvas.width / 2, 120);

    // Draw buttons
    for (const button of settingsButtons) {
        button.draw();
    }

    // Controls info
    ctx.fillStyle = '#ffffff';
    ctx.font = '16px "Segoe UI", sans-serif';
    ctx.fillText('Movement: A/D or Arrow Keys', canvas.width / 2, 410);
    ctx.fillText('Jump: W, Up Arrow, or Space', canvas.width / 2, 435);
    ctx.fillText('Restart Level: R | Mute: M', canvas.width / 2, 460);

    ctx.textAlign = 'left';
}

// Initialize buttons
initMenuButtons();

// ============================================
// Background Drawing
// ============================================
function drawBackground() {
    // Sky gradient
    const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    gradient.addColorStop(0, '#0f0f23');
    gradient.addColorStop(1, '#1a1a3e');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Stars
    ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
    for (let i = 0; i < 50; i++) {
        const x = (i * 73) % canvas.width;
        const y = (i * 47) % (canvas.height - 100);
        const size = (i % 3) + 1;
        ctx.beginPath();
        ctx.arc(x, y, size, 0, Math.PI * 2);
        ctx.fill();
    }
}

// ============================================
// Game Loop
// ============================================
function gameLoop() {
    // Handle menu states
    if (gameState === 'menu') {
        drawMainMenu();
        requestAnimationFrame(gameLoop);
        return;
    }

    if (gameState === 'settings') {
        drawSettingsMenu();
        requestAnimationFrame(gameLoop);
        return;
    }

    // Handle cutscene
    if (cutsceneActive) {
        drawCutscene();
        requestAnimationFrame(gameLoop);
        return;
    }

    // Clear and draw background
    drawBackground();

    // Update and draw platforms
    for (const platform of platforms) {
        platform.draw();
    }

    // Update and draw goal
    if (goal) {
        goal.update();
        goal.draw();
    }

    // Handle level complete state
    if (levelComplete) {
        levelTransitionTimer++;
        drawLevelComplete();

        if (levelTransitionTimer > 120) { // 2 seconds at 60fps
            const level = levels[currentLevel];
            // Check if this level triggers cutscene
            if (level.triggerCutscene) {
                cutsceneActive = true;
                cutsceneTimer = 0;
                cutscenePhase = 0;
                sound.stopMusic();
                levelComplete = false;
            } else {
                currentLevel++;
                loadLevel(currentLevel);
            }
        }
    } else {
        // Update and draw player
        player.update(platforms);
        player.draw();

        // Check goal collision
        if (goal && goal.checkCollision(player)) {
            levelComplete = true;
            sound.playLevelComplete();
        }
    }

    // Draw UI
    drawUI();

    requestAnimationFrame(gameLoop);
}

function drawLevelComplete() {
    // Darken background
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Level complete text
    ctx.fillStyle = '#ffd700';
    ctx.font = 'bold 48px "Segoe UI", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Level Complete!', canvas.width / 2, canvas.height / 2 - 20);

    ctx.fillStyle = '#ffffff';
    ctx.font = '24px "Segoe UI", sans-serif';
    const nextText = currentLevel + 1 >= levels.length ? 'Restarting...' : 'Next level...';
    ctx.fillText(nextText, canvas.width / 2, canvas.height / 2 + 30);

    ctx.textAlign = 'left'; // Reset alignment
}

function drawCutscene() {
    cutsceneTimer++;

    // Black background
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Calculate total duration for all phases
    let phaseStartTime = 0;
    for (let i = 0; i < cutscenePhase; i++) {
        phaseStartTime += cutsceneMessages[i].duration + 60; // 60 frames gap between messages
    }

    const currentPhaseTime = cutsceneTimer - phaseStartTime;

    // Check if we should move to next phase
    if (cutscenePhase < cutsceneMessages.length) {
        const currentMessage = cutsceneMessages[cutscenePhase];

        // Play whisper at start of each phase
        if (currentPhaseTime === 1) {
            sound.playWhisper();
        }

        // Draw large Mia face in center (creepy close-up)
        const faceX = canvas.width / 2;
        const faceY = canvas.height / 2 - 50;
        const faceScale = 8;

        // Slight shake effect
        const shakeX = Math.sin(cutsceneTimer * 0.1) * 2;
        const shakeY = Math.cos(cutsceneTimer * 0.15) * 1;

        // Large body/face
        ctx.fillStyle = '#e94560';
        ctx.fillRect(faceX - 64 + shakeX, faceY - 96 + shakeY, 128, 192);

        // Large eye (staring)
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(faceX + 24 + shakeX, faceY - 36 + shakeY, 24, 0, Math.PI * 2);
        ctx.fill();

        // Pupil (follows slightly, creepy)
        ctx.fillStyle = '#1a1a2e';
        const pupilOffsetX = Math.sin(cutsceneTimer * 0.05) * 4;
        const pupilOffsetY = Math.cos(cutsceneTimer * 0.07) * 2;
        ctx.beginPath();
        ctx.arc(faceX + 24 + pupilOffsetX + shakeX, faceY - 36 + pupilOffsetY + shakeY, 12, 0, Math.PI * 2);
        ctx.fill();

        // No smile - straight line (serious/creepy)
        ctx.strokeStyle = '#1a1a2e';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(faceX - 24 + shakeX, faceY + 20 + shakeY);
        ctx.lineTo(faceX + 24 + shakeX, faceY + 20 + shakeY);
        ctx.stroke();

        // Caption at bottom
        if (currentPhaseTime > 30) { // Slight delay before text appears
            const fadeIn = Math.min(1, (currentPhaseTime - 30) / 30);
            ctx.fillStyle = `rgba(139, 0, 0, ${fadeIn})`;
            ctx.font = 'italic 32px "Segoe UI", sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText(`"${currentMessage.text}"`, canvas.width / 2, canvas.height - 80);
            ctx.textAlign = 'left';
        }

        // Move to next phase
        if (currentPhaseTime > currentMessage.duration + 60) {
            cutscenePhase++;
        }
    } else {
        // Cutscene complete - fade to black then go to level 8
        const fadeOutTime = cutsceneTimer - phaseStartTime;

        if (fadeOutTime < 60) {
            // Just black screen
            ctx.fillStyle = '#000000';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
        } else {
            // End cutscene and go to level 8
            cutsceneActive = false;
            currentLevel++;
            loadLevel(currentLevel);

            // Reset main title
            mainTitle.textContent = originalTitle;
            mainTitle.style.color = '#e94560';
            mainTitle.style.textShadow = '2px 2px 4px rgba(0,0,0,0.5)';
            mainTitle.style.transform = 'translateX(0)';
        }
    }
}

// Get reference to the main title element
const mainTitle = document.querySelector('h1');
const originalTitle = "Mia's Adventure";
const glitchedTitles = ["M̷i̸a̵'̶s̷ ̴A̶d̸v̷e̸n̴t̷u̸r̵e̶", "MIA'S ADVENTURE", "h̷e̸l̵p̶ ̷m̸e̵", "R̶U̷N̸", "IT SEES YOU", "D̷O̸N̵'̶T̷ ̸L̵O̸O̶K̷"];

function drawUI() {
    const level = levels[currentLevel];

    // Handle glitch timing for glitchTitle levels
    if (level.glitchTitle) {
        glitchTimer++;
        if (!glitchActive && glitchTimer >= nextGlitchTime) {
            glitchActive = true;
            glitchDuration = 45 + Math.random() * 45; // Glitch for 45-90 frames (~0.75-1.5 sec)
            glitchTimer = 0;
        }
        if (glitchActive) {
            glitchDuration--;
            if (glitchDuration <= 0) {
                glitchActive = false;
                glitchTimer = 0;
                nextGlitchTime = 120 + Math.random() * 360; // 2-8 seconds between glitches
            }
        }
    }

    // Glitch the main HTML title too (change text every 15 frames for readability)
    if (level.glitchTitle && glitchActive) {
        if (Math.floor(glitchDuration) % 15 === 0) {
            mainTitle.textContent = glitchedTitles[Math.floor(Math.random() * glitchedTitles.length)];
        }
        mainTitle.style.color = '#ff0000';
        mainTitle.style.textShadow = `${Math.random() * 2 - 1}px 0 #8b0000, ${Math.random() * 2 - 1}px 0 #660000`;
        mainTitle.style.transform = `translateX(${Math.random() * 3 - 1.5}px)`;
    } else if (level.glitchTitle) {
        // Reset to normal when not glitching (but still on scary level)
        mainTitle.textContent = originalTitle;
        mainTitle.style.color = '#e94560';
        mainTitle.style.textShadow = '2px 2px 4px rgba(0,0,0,0.5)';
        mainTitle.style.transform = 'translateX(0)';
    } else {
        // Fully reset on normal levels
        mainTitle.textContent = originalTitle;
        mainTitle.style.color = '#e94560';
        mainTitle.style.textShadow = '2px 2px 4px rgba(0,0,0,0.5)';
        mainTitle.style.transform = 'translateX(0)';
    }

    // Level info with glitch effect
    if (level.glitchTitle && glitchActive) {
        // Glitched bloody title (slower shake)
        const glitchOffset = Math.sin(glitchDuration * 0.5) * 3;
        const titleText = `Level ${currentLevel + 1}: ${level.name}`;

        // Red shadow/ghost
        ctx.fillStyle = '#8b0000';
        ctx.font = 'bold 16px "Segoe UI", sans-serif';
        ctx.fillText(titleText, 10 + glitchOffset + 2, 25 + 1);

        // Main glitched text
        ctx.fillStyle = '#ff0000';
        ctx.fillText(titleText, 10 + glitchOffset, 25);

        // Blood drip effect on letters (static positions)
        ctx.fillStyle = '#8b0000';
        for (let i = 0; i < 5; i++) {
            const dripX = 20 + i * 30;
            const dripH = 4 + Math.sin(i + glitchDuration * 0.1) * 3;
            ctx.fillRect(dripX, 26, 2, dripH);
        }

        // Corrupted subtitle (changes every 15 frames)
        ctx.fillStyle = '#660000';
        ctx.font = '12px "Segoe UI", sans-serif';
        const corruptedTexts = ['GET OUT', 'RUN', 'HELP ME', 'IT SEES YOU', 'DON\'T LOOK'];
        const textIndex = Math.floor(glitchDuration / 15) % corruptedTexts.length;
        ctx.fillText(corruptedTexts[textIndex], 10, 45);
    } else {
        // Normal title
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 16px "Segoe UI", sans-serif';
        ctx.fillText(`Level ${currentLevel + 1}: ${level.name}`, 10, 25);

        ctx.fillStyle = '#a0a0a0';
        ctx.font = '12px "Segoe UI", sans-serif';
        ctx.fillText('Reach the golden flag!', 10, 45);
    }

    // Sound status
    ctx.fillStyle = sound.muted ? '#e94560' : '#5cb85c';
    ctx.font = '12px "Segoe UI", sans-serif';
    const soundStatus = sound.muted ? 'MUTED' : 'SOUND ON';
    ctx.fillText(`[M] ${soundStatus}`, canvas.width - 100, 25);

    // Level progress
    ctx.fillStyle = '#a0a0a0';
    ctx.fillText(`${currentLevel + 1}/${levels.length}`, canvas.width - 100, 45);

    // Mini phone in bottom right corner
    drawMiniPhone();
}

function drawMiniPhone() {
    const phoneX = canvas.width - 55;
    const phoneY = canvas.height - 95;
    const phoneW = 40;
    const phoneH = 75;
    const cornerRadius = 4;

    // Old phone body (yellowish-white cream color)
    const bodyGradient = ctx.createLinearGradient(phoneX, phoneY, phoneX + phoneW, phoneY + phoneH);
    bodyGradient.addColorStop(0, '#f5f0dc'); // Cream white
    bodyGradient.addColorStop(0.5, '#e8e0c8'); // Slightly darker
    bodyGradient.addColorStop(1, '#d9d0b8'); // Aged yellow-white
    ctx.fillStyle = bodyGradient;
    ctx.beginPath();
    ctx.roundRect(phoneX, phoneY, phoneW, phoneH, cornerRadius);
    ctx.fill();

    // Phone border (darker aged edge)
    ctx.strokeStyle = '#b8a880';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(phoneX, phoneY, phoneW, phoneH, cornerRadius);
    ctx.stroke();

    // Small green LCD screen (old Nokia style)
    ctx.fillStyle = '#8bac0f'; // Classic LCD green
    ctx.fillRect(phoneX + 5, phoneY + 8, phoneW - 10, 20);

    // Screen border
    ctx.strokeStyle = '#5a5a4a';
    ctx.lineWidth = 1;
    ctx.strokeRect(phoneX + 5, phoneY + 8, phoneW - 10, 20);

    // Screen content - simple time on LCD
    ctx.fillStyle = '#306230'; // Dark LCD green for text
    ctx.font = 'bold 9px monospace';
    ctx.textAlign = 'center';
    const now = new Date();
    const timeStr = now.getHours().toString().padStart(2, '0') + ':' + now.getMinutes().toString().padStart(2, '0');
    ctx.fillText(timeStr, phoneX + phoneW / 2, phoneY + 21);

    // Battery indicator on screen
    ctx.fillStyle = '#306230';
    ctx.fillRect(phoneX + 22, phoneY + 11, 6, 3);
    ctx.fillRect(phoneX + 28, phoneY + 12, 1, 1);

    // Speaker holes at top
    ctx.fillStyle = '#4a4a3a';
    for (let i = 0; i < 4; i++) {
        ctx.beginPath();
        ctx.arc(phoneX + 12 + i * 5, phoneY + 4, 1, 0, Math.PI * 2);
        ctx.fill();
    }

    // Number pad buttons (3x4 grid)
    ctx.fillStyle = '#c8c0a8'; // Button color
    const btnSize = 6;
    const btnGap = 2;
    const startX = phoneX + 7;
    const startY = phoneY + 32;

    for (let row = 0; row < 4; row++) {
        for (let col = 0; col < 3; col++) {
            const bx = startX + col * (btnSize + btnGap);
            const by = startY + row * (btnSize + btnGap);

            // Button base
            ctx.fillStyle = '#d0c8b0';
            ctx.fillRect(bx, by, btnSize, btnSize);

            // Button highlight (3D effect)
            ctx.fillStyle = '#e8e0c8';
            ctx.fillRect(bx, by, btnSize, 1);
            ctx.fillRect(bx, by, 1, btnSize);

            // Button shadow
            ctx.fillStyle = '#a8a090';
            ctx.fillRect(bx + btnSize - 1, by, 1, btnSize);
            ctx.fillRect(bx, by + btnSize - 1, btnSize, 1);
        }
    }

    // Navigation button at bottom (oval)
    ctx.fillStyle = '#b8b0a0';
    ctx.beginPath();
    ctx.ellipse(phoneX + phoneW / 2, phoneY + phoneH - 6, 8, 4, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#908878';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.ellipse(phoneX + phoneW / 2, phoneY + phoneH - 6, 8, 4, 0, 0, Math.PI * 2);
    ctx.stroke();

    ctx.textAlign = 'left';
}

// ============================================
// Input Event Listeners
// ============================================
// Initialize sound on first interaction (browser autoplay policy)
function initSoundOnInteraction() {
    if (!soundInitialized) {
        sound.init();
        // Play appropriate music based on game state
        if (gameState === 'playing') {
            sound.startMusic();
        } else if (gameState === 'menu' || gameState === 'settings') {
            sound.startMenuMusic();
        }
        soundInitialized = true;
    }
}

// Mouse event handling for menus
canvas.addEventListener('mousemove', (e) => {
    const rect = canvas.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;

    // Update button hover states
    const buttons = gameState === 'menu' ? menuButtons :
                    gameState === 'settings' ? settingsButtons : [];

    let anyHovered = false;
    for (const button of buttons) {
        button.hovered = button.isInside(mx, my);
        if (button.hovered) anyHovered = true;
    }

    // Change cursor style
    canvas.style.cursor = anyHovered ? 'pointer' : 'default';
});

canvas.addEventListener('click', (e) => {
    const rect = canvas.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;

    // Initialize sound on click
    initSoundOnInteraction();

    // Check button clicks
    const buttons = gameState === 'menu' ? menuButtons :
                    gameState === 'settings' ? settingsButtons : [];

    for (const button of buttons) {
        if (button.isInside(mx, my)) {
            button.action();
            break;
        }
    }
});

document.addEventListener('keydown', (e) => {
    initSoundOnInteraction();

    switch(e.key.toLowerCase()) {
        case 'a':
        case 'arrowleft':
            keys.left = true;
            break;
        case 'd':
        case 'arrowright':
            keys.right = true;
            break;
        case 'w':
        case 'arrowup':
        case ' ':
            keys.jump = true;
            e.preventDefault(); // Prevent page scroll on space
            break;
        case 'm':
            sound.toggleMute();
            break;
        case 'r':
            // Restart current level
            if (gameState === 'playing') {
                loadLevel(currentLevel);
            }
            break;
        case 'escape':
            // Return to menu or go back
            if (gameState === 'settings') {
                gameState = 'menu';
            } else if (gameState === 'playing') {
                gameState = 'menu';
                sound.stopMusic();
                // Start menu music
                if (soundInitialized && !sound.muted) {
                    sound.startMenuMusic();
                }
                // Reset game state
                cutsceneActive = false;
                levelComplete = false;
            }
            break;
        // Debug: Number keys to jump to specific levels
        case '1':
        case '2':
        case '3':
        case '4':
        case '5':
        case '6':
        case '7':
        case '8':
        case '9':
            const levelNum = parseInt(e.key) - 1;
            if (levelNum < levels.length) {
                currentLevel = levelNum;
                loadLevel(currentLevel);
            }
            break;
    }
});

document.addEventListener('keyup', (e) => {
    switch(e.key.toLowerCase()) {
        case 'a':
        case 'arrowleft':
            keys.left = false;
            break;
        case 'd':
        case 'arrowright':
            keys.right = false;
            break;
        case 'w':
        case 'arrowup':
        case ' ':
            keys.jump = false;
            break;
    }
});

// ============================================
// Start the Game
// ============================================
console.log('Mia\'s Adventure - Game Started!');
gameLoop();
