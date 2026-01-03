// ============================================
// Mia's Adventure - Platform Game Foundation
// ============================================

// Build Info (for debugging - set DEBUG_MODE to false for release)
const BUILD_VERSION = "0.1.0";
const BUILD_NUMBER = 17;
const BUILD_DATE = "2026-01-02";
const DEBUG_MODE = true;

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

    playRing() {
        if (this.muted || !this.initialized) return;

        const now = this.audioContext.currentTime;

        // Classic phone ring - two-tone bell sound
        const playTone = (freq, startTime, duration) => {
            const osc = this.audioContext.createOscillator();
            const gain = this.audioContext.createGain();

            osc.connect(gain);
            gain.connect(this.sfxGain);

            osc.type = 'sine';
            osc.frequency.value = freq;

            gain.gain.setValueAtTime(0, startTime);
            gain.gain.linearRampToValueAtTime(0.2, startTime + 0.02);
            gain.gain.setValueAtTime(0.2, startTime + duration - 0.02);
            gain.gain.linearRampToValueAtTime(0, startTime + duration);

            osc.start(startTime);
            osc.stop(startTime + duration);
        };

        // Ring pattern: two quick tones
        playTone(440, now, 0.1);
        playTone(480, now + 0.1, 0.1);
        playTone(440, now + 0.25, 0.1);
        playTone(480, now + 0.35, 0.1);
    }

    playNarratorVoice() {
        if (this.muted || !this.initialized) return;

        // Typewriter-like click for narrator text
        const osc = this.audioContext.createOscillator();
        const gain = this.audioContext.createGain();

        osc.connect(gain);
        gain.connect(this.sfxGain);

        osc.type = 'square';
        osc.frequency.value = 800 + Math.random() * 200;

        const now = this.audioContext.currentTime;
        gain.gain.setValueAtTime(0.08, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.05);

        osc.start(now);
        osc.stop(now + 0.05);
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
// Key Class (Collectible)
// ============================================
class Key {
    constructor(x, y, ropeLength = 60) {
        this.x = x;
        this.y = y;
        this.width = 20;
        this.height = 30;
        this.ropeLength = ropeLength;
        this.collected = false;
        this.swingAngle = 0;
        this.swingSpeed = 0.001; // Much slower for smoother swing
        this.swingPhase = Math.random() * Math.PI * 2; // Random start phase
    }

    update() {
        if (!this.collected) {
            // Smooth, gentle swinging motion using continuous time
            this.swingAngle = Math.sin(Date.now() * this.swingSpeed + this.swingPhase) * 0.15;
        }
    }

    draw() {
        if (this.collected) return;

        const swingOffsetX = Math.sin(this.swingAngle) * 10;

        // Rope/string from ceiling
        ctx.strokeStyle = '#8B4513';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(this.x + this.width / 2, this.y - this.ropeLength);
        ctx.quadraticCurveTo(
            this.x + this.width / 2 + swingOffsetX / 2,
            this.y - this.ropeLength / 2,
            this.x + this.width / 2 + swingOffsetX,
            this.y
        );
        ctx.stroke();

        // Key position with swing
        const keyX = this.x + swingOffsetX;
        const keyY = this.y;

        // Key glow
        const glow = (Math.sin(Date.now() * 0.005) + 1) / 2;
        ctx.fillStyle = `rgba(255, 215, 0, ${glow * 0.3})`;
        ctx.beginPath();
        ctx.arc(keyX + this.width / 2, keyY + this.height / 2, 25, 0, Math.PI * 2);
        ctx.fill();

        // Key head (circle)
        ctx.fillStyle = '#ffd700';
        ctx.strokeStyle = '#b8860b';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(keyX + this.width / 2, keyY + 8, 8, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // Key hole in head
        ctx.fillStyle = '#1a1a2e';
        ctx.beginPath();
        ctx.arc(keyX + this.width / 2, keyY + 8, 3, 0, Math.PI * 2);
        ctx.fill();

        // Key shaft
        ctx.fillStyle = '#ffd700';
        ctx.fillRect(keyX + this.width / 2 - 2, keyY + 12, 4, 15);

        // Key teeth
        ctx.fillRect(keyX + this.width / 2, keyY + 20, 6, 3);
        ctx.fillRect(keyX + this.width / 2, keyY + 24, 4, 3);
    }

    checkCollision(player) {
        if (this.collected) return false;

        const swingOffsetX = Math.sin(this.swingAngle) * 10;
        const keyX = this.x + swingOffsetX;

        const collected = player.x < keyX + this.width &&
                         player.x + player.width > keyX &&
                         player.y < this.y + this.height &&
                         player.y + player.height > this.y;

        if (collected) {
            this.collected = true;
            sound.playLevelComplete(); // Use level complete sound for now
        }

        return collected;
    }
}

// ============================================
// Door Class (Locked/Unlocked/Open)
// ============================================
class Door {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.width = 50;
        this.height = 80;
        this.state = 'locked'; // 'locked', 'unlocked', 'open', 'entered'
        this.openProgress = 0; // 0 to 1 for opening animation
        this.enterProgress = 0; // 0 to 1 for enter animation
    }

    update() {
        if (this.state === 'open' && this.openProgress < 1) {
            this.openProgress += 0.05;
            if (this.openProgress > 1) this.openProgress = 1;
        }
        if (this.state === 'entered' && this.enterProgress < 1) {
            this.enterProgress += 0.03;
            if (this.enterProgress > 1) this.enterProgress = 1;
        }
    }

    isFullyOpen() {
        return this.state === 'open' && this.openProgress >= 1;
    }

    enter() {
        if (this.isFullyOpen()) {
            this.state = 'entered';
            return true;
        }
        return false;
    }

    draw() {
        // Door frame
        ctx.fillStyle = '#4a3728';
        ctx.fillRect(this.x - 5, this.y - 5, this.width + 10, this.height + 5);

        // Door (slides or swings based on open progress)
        if (this.state === 'open') {
            // Door opening animation - slides to the side
            const slideOffset = this.openProgress * (this.width - 5);
            ctx.fillStyle = '#6b4423';
            ctx.fillRect(this.x + slideOffset, this.y, this.width - slideOffset, this.height);

            // Open doorway (dark inside)
            ctx.fillStyle = '#0a0a15';
            ctx.fillRect(this.x, this.y, slideOffset, this.height);
        } else {
            // Closed door
            ctx.fillStyle = this.state === 'locked' ? '#5a3d2b' : '#6b4423';
            ctx.fillRect(this.x, this.y, this.width, this.height);

            // Door panels
            ctx.strokeStyle = '#3d2817';
            ctx.lineWidth = 2;
            ctx.strokeRect(this.x + 5, this.y + 5, this.width - 10, 30);
            ctx.strokeRect(this.x + 5, this.y + 40, this.width - 10, 35);

            // Lock/handle
            if (this.state === 'locked') {
                // Locked - show padlock
                ctx.fillStyle = '#888';
                ctx.fillRect(this.x + this.width - 18, this.y + 38, 12, 14);
                ctx.beginPath();
                ctx.arc(this.x + this.width - 12, this.y + 38, 6, Math.PI, 0);
                ctx.strokeStyle = '#888';
                ctx.lineWidth = 3;
                ctx.stroke();

                // Keyhole
                ctx.fillStyle = '#1a1a2e';
                ctx.beginPath();
                ctx.arc(this.x + this.width - 12, this.y + 43, 2, 0, Math.PI * 2);
                ctx.fill();
                ctx.fillRect(this.x + this.width - 13, this.y + 43, 2, 4);

                // "Locked" indicator glow
                ctx.fillStyle = 'rgba(255, 0, 0, 0.3)';
                ctx.beginPath();
                ctx.arc(this.x + this.width - 12, this.y + 45, 15, 0, Math.PI * 2);
                ctx.fill();
            } else {
                // Unlocked - show handle
                ctx.fillStyle = '#b8860b';
                ctx.beginPath();
                ctx.arc(this.x + this.width - 12, this.y + 45, 5, 0, Math.PI * 2);
                ctx.fill();

                // "Ready to open" indicator glow
                ctx.fillStyle = 'rgba(0, 255, 0, 0.3)';
                ctx.beginPath();
                ctx.arc(this.x + this.width - 12, this.y + 45, 15, 0, Math.PI * 2);
                ctx.fill();
            }
        }
    }

    isPlayerNear(player) {
        const interactionRange = 20;
        return player.x < this.x + this.width + interactionRange &&
               player.x + player.width > this.x - interactionRange &&
               player.y < this.y + this.height &&
               player.y + player.height > this.y;
    }

    blocksPlayer(player) {
        // Only block if door is not fully open
        if (this.state === 'open' && this.openProgress >= 1) return false;

        return player.x + player.width > this.x &&
               player.x < this.x + this.width &&
               player.y + player.height > this.y &&
               player.y < this.y + this.height;
    }

    unlock() {
        if (this.state === 'locked') {
            this.state = 'unlocked';
            return true;
        }
        return false;
    }

    open() {
        if (this.state === 'unlocked') {
            this.state = 'open';
            return true;
        }
        return false;
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
    },
    // Level 9 - Key and Door (two stages)
    {
        name: "Lock & Key",
        playerStart: { x: 50, y: 480 },
        hasKey: true,
        hasDoor: true,
        keyPosition: { x: 400, y: 150 },
        doorPosition: { x: 700, y: 470 },
        hasStages: true,
        // Stage 1 - get the key and unlock door
        stage1: {
            platforms: [
                // Continuous ground
                { x: 0, y: 550, w: 800, h: 50 },
                // Climbing platforms to reach key
                { x: 100, y: 470, w: 100, h: 25 },
                { x: 250, y: 400, w: 100, h: 25 },
                { x: 100, y: 330, w: 100, h: 25 },
                { x: 280, y: 260, w: 120, h: 25 },
                // Platform near key
                { x: 380, y: 200, w: 80, h: 25 },
                // Platform to jump back down
                { x: 520, y: 300, w: 100, h: 25 },
            ]
        },
        // Stage 2 - after entering door, reach the flag
        stage2: {
            playerStart: { x: 50, y: 480 },
            goal: { x: 720, y: 470 },
            platforms: [
                // Ground
                { x: 0, y: 550, w: 800, h: 50 },
                // Some platforming
                { x: 150, y: 470, w: 100, h: 25 },
                { x: 320, y: 400, w: 100, h: 25 },
                { x: 500, y: 340, w: 100, h: 25 },
                { x: 650, y: 400, w: 100, h: 25 },
            ]
        },
        // Legacy platforms for initial load (stage 1)
        platforms: [
            { x: 0, y: 550, w: 800, h: 50 },
            { x: 100, y: 470, w: 100, h: 25 },
            { x: 250, y: 400, w: 100, h: 25 },
            { x: 100, y: 330, w: 100, h: 25 },
            { x: 280, y: 260, w: 120, h: 25 },
            { x: 380, y: 200, w: 80, h: 25 },
            { x: 520, y: 300, w: 100, h: 25 },
        ]
    }
];

// ============================================
// Game State
// ============================================
let currentLevel = 0;
let currentStage = 1; // For levels with multiple stages
let platforms = [];
let goal = null;
let levelKey = null;
let levelDoor = null;
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

// Phone ringing / Narrator state
let phoneRinging = false;
let phoneAnswered = false;
let narratorActive = false;
let narratorTimer = 0;
let narratorPhase = 0;
let phoneRingTimer = 0;
let firstGameStart = true; // Track if this is the first time playing
let dialogueChoiceActive = false;
let selectedChoice = 0; // 0 = first option, 1 = second option
let choiceMessagePhase = 0;
let choiceMessageTimer = 0;

const narratorMessages = [
    { text: "Ahem...", duration: 90 },
    { text: "Hello?", duration: 80 },
    { text: "Is it working?", duration: 100 },
    { text: "Ah yes. It's you!", duration: 110 },
    { text: "Lets see... player... 34899277?", duration: 150 }
];

const dialogueChoices = [
    { text: "...", key: "1" },
    { text: "Who are you?", key: "2" }
];

// Response messages for choice 1: "..."
const choice1Responses = [
    { text: "Okaaaayyyyyyy...", speaker: "???" },
    { text: "Not much of a talker!", speaker: "???" },
    { text: "That's fine...", speaker: "???" },
    { text: "I'm the Narrator!", speaker: "Narrator" },
    { text: "I'll be here whenever you need a chat!", speaker: "Narrator" }
];

// Response messages for choice 2: "Who are you?"
const choice2Responses = [
    { text: "Me?", speaker: "???" },
    { text: "Well I'm the Narrator!", speaker: "Narrator" },
    { text: "I'm here for a chat if you're stuck or anything!", speaker: "Narrator" },
    { text: "Not that you'll need help...", speaker: "Narrator" },
    { text: "You seem capable enough!", speaker: "Narrator" }
];

// Level 8 phone call messages (after cutscene)
let level8PhoneTriggered = false;
const level8NarratorMessages = [
    { text: "Sorry 'bout that...", speaker: "Narrator" },
    { text: "That's a bug.", speaker: "Narrator" },
    { text: "We're still tryna sort that out.", speaker: "Narrator" },
    { text: "You know...", speaker: "Narrator" },
    { text: "Bugs 'n all that 're in demos, right?", speaker: "Narrator" }
];
let level8MessagePhase = 0;
let level8MessageTimer = 0;
let level8NarratorActive = false;

// Level 9 intro dialogue (key and door tutorial)
let level9IntroTriggered = false;
const level9NarratorMessages = [
    { text: "Okay.", speaker: "Narrator" },
    { text: "So this level is a teensy bit harder.", speaker: "Narrator" },
    { text: "All you have to do is grab the key, open the door, and touch the flag!", speaker: "Narrator" },
    { text: "Easy as- oh...", speaker: "Narrator" },
    { text: "Sorry... gotta take this call.", speaker: "Narrator" },
    { text: "...", speaker: "Narrator" },
    { text: "See ya' in a bit!", speaker: "Narrator" }
];
let level9MessagePhase = 0;
let level9MessageTimer = 0;
let level9NarratorActive = false;

function loadLevel(levelIndex) {
    if (levelIndex >= levels.length) {
        // Game complete - restart from level 1
        currentLevel = 0;
        levelIndex = 0;
    }

    const level = levels[levelIndex];

    // Reset stage counter for multi-stage levels
    currentStage = 1;

    // Create platforms (with bloody flag support)
    // For multi-stage levels, use stage1 platforms
    const platformData = level.hasStages ? level.stage1.platforms : level.platforms;
    platforms = platformData.map(p =>
        new Platform(p.x, p.y, p.w, p.h, '#3d5a80', p.bloody || false)
    );

    // Create goal with blood flag
    // For multi-stage levels, no goal in stage 1 (goal is in stage 2)
    if (level.hasStages) {
        goal = null;
    } else {
        goal = new Goal(level.goal.x, level.goal.y, level.hasBlood);
    }

    // Create key if level has one
    if (level.hasKey && level.keyPosition) {
        levelKey = new Key(level.keyPosition.x, level.keyPosition.y);
    } else {
        levelKey = null;
    }

    // Create door if level has one
    if (level.hasDoor && level.doorPosition) {
        levelDoor = new Door(level.doorPosition.x, level.doorPosition.y);
    } else {
        levelDoor = null;
    }

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

    // Trigger Level 8 phone call after cutscene
    if (levelIndex === 7 && !level8PhoneTriggered) {
        level8PhoneTriggered = true;
        phoneRinging = true;
        phoneAnswered = false;
        phoneRingTimer = 0;
    }

    // Trigger Level 9 phone call (key and door tutorial)
    if (levelIndex === 8 && !level9IntroTriggered) {
        level9IntroTriggered = true;
        phoneRinging = true;
        phoneAnswered = false;
        phoneRingTimer = 0;
    }

    levelComplete = false;
    levelTransitionTimer = 0;
}

// Load stage 2 of a multi-stage level
function loadStage2() {
    const level = levels[currentLevel];

    if (!level.hasStages || !level.stage2) return;

    currentStage = 2;

    // Load stage 2 platforms
    platforms = level.stage2.platforms.map(p =>
        new Platform(p.x, p.y, p.w, p.h, '#3d5a80', p.bloody || false)
    );

    // Create the goal in stage 2
    goal = new Goal(level.stage2.goal.x, level.stage2.goal.y, level.hasBlood);

    // Clear key and door (no longer needed)
    levelKey = null;
    levelDoor = null;

    // Reset player position to stage 2 start
    player.x = level.stage2.playerStart.x;
    player.y = level.stage2.playerStart.y;
    player.velX = 0;
    player.velY = 0;
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
            // Initialize sound if not already done, then start game music
            if (!soundInitialized) {
                sound.init();
                soundInitialized = true;
            }
            if (!sound.muted) {
                sound.startMusic();
            }
            // Trigger phone ringing on first game start
            if (firstGameStart) {
                phoneRinging = true;
                phoneRingTimer = 0;
                firstGameStart = false;
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
function drawBuildInfo() {
    if (!DEBUG_MODE) return;

    ctx.save();
    ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.font = '10px monospace';
    ctx.textAlign = 'left';
    ctx.fillText(`v${BUILD_VERSION} build ${BUILD_NUMBER} (${BUILD_DATE})`, 10, canvas.height - 10);
    ctx.restore();
}

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
        drawBuildInfo();
        requestAnimationFrame(gameLoop);
        return;
    }

    if (gameState === 'settings') {
        drawSettingsMenu();
        drawBuildInfo();
        requestAnimationFrame(gameLoop);
        return;
    }

    // Handle cutscene
    if (cutsceneActive) {
        drawCutscene();
        drawBuildInfo();
        requestAnimationFrame(gameLoop);
        return;
    }

    // Handle phone ringing
    if (phoneRinging && !phoneAnswered) {
        phoneRingTimer++;
        // Play ring sound every 60 frames (1 second)
        if (phoneRingTimer % 60 === 1 && soundInitialized) {
            sound.playRing();
        }
    }

    // Handle narrator dialogue
    if (narratorActive) {
        narratorTimer++;
    }

    // Handle choice response dialogue
    if (choiceMessagePhase > 0) {
        choiceMessageTimer++;
    }

    // Handle Level 8 narrator dialogue
    if (level8NarratorActive) {
        level8MessageTimer++;
    }

    // Handle Level 9 narrator dialogue
    if (level9NarratorActive) {
        level9MessageTimer++;
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

    // Update and draw key
    if (levelKey) {
        levelKey.update();
        levelKey.draw();
    }

    // Update and draw door
    if (levelDoor) {
        levelDoor.update();
        levelDoor.draw();
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
        // Update and draw player (freeze during narrator dialogue)
        const isInDialogue = narratorActive || dialogueChoiceActive || choiceMessagePhase > 0 || level8NarratorActive || level9NarratorActive;
        if (!isInDialogue) {
            player.update(platforms);

            // Check door collision (block player if door not open)
            if (levelDoor && levelDoor.blocksPlayer(player)) {
                // Push player back
                if (player.x + player.width / 2 < levelDoor.x + levelDoor.width / 2) {
                    player.x = levelDoor.x - player.width;
                } else {
                    player.x = levelDoor.x + levelDoor.width;
                }
                player.velX = 0;
            }
        }
        player.draw();

        // Check key collision
        if (levelKey && !levelKey.collected) {
            levelKey.checkCollision(player);
        }

        // Check goal collision (only if not in dialogue and door is open or no door)
        const canReachGoal = !levelDoor || (levelDoor.state === 'open' && levelDoor.openProgress >= 1);
        if (!isInDialogue && goal && canReachGoal && goal.checkCollision(player)) {
            levelComplete = true;
            sound.playLevelComplete();
        }
    }

    // Draw UI
    drawUI();

    // Draw phone interaction prompt and narrator dialogue
    drawPhoneInteraction();

    // Draw build info (debug mode only)
    drawBuildInfo();

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

    // Key indicator (if level has key)
    if (levelKey) {
        ctx.font = '14px "Segoe UI", sans-serif';
        if (levelKey.collected) {
            ctx.fillStyle = '#ffd700';
            ctx.fillText('🔑 Key collected!', 10, 70);
        } else {
            ctx.fillStyle = '#888888';
            ctx.fillText('🔑 Find the key', 10, 70);
        }
    }

    // Door interaction prompt
    if (levelDoor && levelDoor.isPlayerNear(player)) {
        const promptX = levelDoor.x + levelDoor.width / 2;
        const promptY = levelDoor.y - 20;

        ctx.textAlign = 'center';
        ctx.font = 'bold 14px "Segoe UI", sans-serif';

        if (levelDoor.state === 'locked') {
            if (levelKey && levelKey.collected) {
                ctx.fillStyle = '#ffd700';
                ctx.fillText("Press 'E' to unlock", promptX, promptY);
            } else {
                ctx.fillStyle = '#ff6666';
                ctx.fillText('Locked - Need key', promptX, promptY);
            }
        } else if (levelDoor.state === 'unlocked') {
            ctx.fillStyle = '#66ff66';
            ctx.fillText("Press 'E' to open", promptX, promptY);
        } else if (levelDoor.isFullyOpen() && levelDoor.state !== 'entered') {
            ctx.fillStyle = '#88ddff';
            ctx.fillText("Press 'E' to enter", promptX, promptY);
        } else if (levelDoor.state === 'entered') {
            ctx.fillStyle = '#aaaaaa';
            ctx.fillText("Entering...", promptX, promptY);
        }
        ctx.textAlign = 'left';
    }

    // Mini phone in bottom right corner
    drawMiniPhone();
}

function drawMiniPhone() {
    const cornerX = canvas.width - 70;
    const cornerY = canvas.height - 75;
    const centerX = canvas.width / 2 - 27;
    const centerY = canvas.height / 2 - 40;
    const baseW = 55;
    const baseH = 35;

    let phoneX = cornerX;
    let phoneY = cornerY;
    let scale = 1;

    // Ringing animation - pop up in center then shrink to corner
    if (phoneRinging && !phoneAnswered) {
        // Animation phases:
        // 0-30 frames: pop up to center and scale up
        // 30-180 frames: stay in center, shake
        // 180+ frames: shrink back to corner
        const popUpDuration = 30;
        const stayDuration = 150;
        const shrinkStart = popUpDuration + stayDuration;
        const shrinkDuration = 60;

        if (phoneRingTimer < popUpDuration) {
            // Pop up phase - ease out
            const t = phoneRingTimer / popUpDuration;
            const easeOut = 1 - Math.pow(1 - t, 3);
            phoneX = cornerX + (centerX - cornerX) * easeOut;
            phoneY = cornerY + (centerY - cornerY) * easeOut;
            scale = 1 + 1.5 * easeOut;
        } else if (phoneRingTimer < shrinkStart) {
            // Stay in center phase
            phoneX = centerX;
            phoneY = centerY;
            scale = 2.5;
            // Shake effect
            const shakeIntensity = Math.sin(phoneRingTimer * 0.5) * 4;
            phoneX += shakeIntensity;
            phoneY += Math.cos(phoneRingTimer * 0.7) * 2;
        } else {
            // Shrink back to corner
            const t = Math.min((phoneRingTimer - shrinkStart) / shrinkDuration, 1);
            const easeIn = t * t;
            phoneX = centerX + (cornerX - centerX) * easeIn;
            phoneY = centerY + (cornerY - centerY) * easeIn;
            scale = 2.5 - 1.5 * easeIn;
            // Gentle shake
            const shakeIntensity = Math.sin(phoneRingTimer * 0.5) * 2 * (1 - t);
            phoneX += shakeIntensity;
        }

        // Glowing ring indicator (larger when phone is bigger)
        const glowPulse = (Math.sin(phoneRingTimer * 0.2) + 1) / 2;
        ctx.fillStyle = `rgba(255, 200, 100, ${glowPulse * 0.5})`;
        ctx.beginPath();
        ctx.arc(phoneX + (baseW * scale) / 2, phoneY + 25 * scale, 40 * scale, 0, Math.PI * 2);
        ctx.fill();

        // Dark overlay behind phone when in center
        if (phoneRingTimer >= popUpDuration && phoneRingTimer < shrinkStart) {
            ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
        }
    }

    // Apply scale transformation
    ctx.save();
    ctx.translate(phoneX, phoneY);
    ctx.scale(scale, scale);
    ctx.translate(-phoneX, -phoneY);

    // Phone base (yellowish-cream vintage color)
    const baseGradient = ctx.createLinearGradient(phoneX, phoneY, phoneX, phoneY + baseH);
    baseGradient.addColorStop(0, '#f5ecd5');
    baseGradient.addColorStop(0.5, '#e8dcc0');
    baseGradient.addColorStop(1, '#d4c8a8');
    ctx.fillStyle = baseGradient;
    ctx.beginPath();
    ctx.roundRect(phoneX, phoneY + 15, baseW, baseH, 6);
    ctx.fill();

    // Base shadow
    ctx.fillStyle = 'rgba(0,0,0,0.2)';
    ctx.beginPath();
    ctx.roundRect(phoneX + 2, phoneY + 48, baseW - 4, 4, 2);
    ctx.fill();

    // Base border
    ctx.strokeStyle = '#a89870';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.roundRect(phoneX, phoneY + 15, baseW, baseH, 6);
    ctx.stroke();

    // Rotary dial circle
    const dialX = phoneX + baseW / 2;
    const dialY = phoneY + 32;
    const dialR = 12;

    // Dial base (darker)
    ctx.fillStyle = '#c8b890';
    ctx.beginPath();
    ctx.arc(dialX, dialY, dialR, 0, Math.PI * 2);
    ctx.fill();

    // Dial inner circle (finger wheel area)
    ctx.fillStyle = '#1a1a1a';
    ctx.beginPath();
    ctx.arc(dialX, dialY, dialR - 3, 0, Math.PI * 2);
    ctx.fill();

    // Dial finger holes (10 holes for 0-9)
    ctx.fillStyle = '#e8dcc0';
    for (let i = 0; i < 10; i++) {
        const angle = (i * Math.PI * 2 / 10) - Math.PI / 2;
        const holeX = dialX + Math.cos(angle) * 6;
        const holeY = dialY + Math.sin(angle) * 6;
        ctx.beginPath();
        ctx.arc(holeX, holeY, 1.5, 0, Math.PI * 2);
        ctx.fill();
    }

    // Center of dial
    ctx.fillStyle = '#2a2a2a';
    ctx.beginPath();
    ctx.arc(dialX, dialY, 2, 0, Math.PI * 2);
    ctx.fill();

    // Handset cradle bumps
    ctx.fillStyle = '#b8a878';
    ctx.beginPath();
    ctx.arc(phoneX + 8, phoneY + 20, 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(phoneX + baseW - 8, phoneY + 20, 3, 0, Math.PI * 2);
    ctx.fill();

    // Handset (resting on cradle)
    const handsetGradient = ctx.createLinearGradient(phoneX + 5, phoneY, phoneX + 5, phoneY + 18);
    handsetGradient.addColorStop(0, '#f0e8d0');
    handsetGradient.addColorStop(1, '#d8ccb0');
    ctx.fillStyle = handsetGradient;

    // Handset body (curved shape)
    ctx.beginPath();
    ctx.moveTo(phoneX + 5, phoneY + 12);
    ctx.quadraticCurveTo(phoneX + baseW / 2, phoneY + 5, phoneX + baseW - 5, phoneY + 12);
    ctx.lineTo(phoneX + baseW - 5, phoneY + 18);
    ctx.quadraticCurveTo(phoneX + baseW / 2, phoneY + 14, phoneX + 5, phoneY + 18);
    ctx.closePath();
    ctx.fill();

    // Handset border
    ctx.strokeStyle = '#a89870';
    ctx.lineWidth = 1;
    ctx.stroke();

    // Earpiece (left end)
    ctx.fillStyle = '#3a3a3a';
    ctx.beginPath();
    ctx.ellipse(phoneX + 8, phoneY + 14, 4, 5, 0, 0, Math.PI * 2);
    ctx.fill();

    // Mouthpiece (right end)
    ctx.beginPath();
    ctx.ellipse(phoneX + baseW - 8, phoneY + 14, 4, 5, 0, 0, Math.PI * 2);
    ctx.fill();

    // Speaker holes on earpiece
    ctx.fillStyle = '#1a1a1a';
    for (let i = 0; i < 3; i++) {
        ctx.beginPath();
        ctx.arc(phoneX + 7 + i * 2, phoneY + 14, 0.5, 0, Math.PI * 2);
        ctx.fill();
    }

    // Mouthpiece holes
    for (let row = 0; row < 2; row++) {
        for (let col = 0; col < 3; col++) {
            ctx.beginPath();
            ctx.arc(phoneX + baseW - 10 + col * 2, phoneY + 13 + row * 2, 0.5, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    // Coiled cord coming from base
    ctx.strokeStyle = '#3a3a3a';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(phoneX + baseW - 5, phoneY + 45);
    for (let i = 0; i < 4; i++) {
        ctx.quadraticCurveTo(
            phoneX + baseW + 3, phoneY + 50 + i * 4,
            phoneX + baseW - 2, phoneY + 52 + i * 4
        );
    }
    ctx.stroke();

    // Restore canvas state after scale transformation
    ctx.restore();
}

function drawPhoneInteraction() {
    // Show "Press E to interact" prompt when phone is ringing
    if (phoneRinging && !phoneAnswered) {
        // Position prompt based on phone animation phase
        const popUpDuration = 30;
        const stayDuration = 150;
        const shrinkStart = popUpDuration + stayDuration;

        let promptX, promptY;
        if (phoneRingTimer >= popUpDuration && phoneRingTimer < shrinkStart) {
            // Phone is in center - show prompt below it
            promptX = canvas.width / 2;
            promptY = canvas.height / 2 + 80;
        } else {
            // Phone is in corner or transitioning
            promptX = canvas.width - 48;
            promptY = canvas.height - 100;
        }

        // Background box for prompt
        const boxWidth = 130;
        ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
        ctx.beginPath();
        ctx.roundRect(promptX - boxWidth/2, promptY - 15, boxWidth, 28, 4);
        ctx.fill();

        // Pulsing text effect
        const pulse = (Math.sin(phoneRingTimer * 0.1) + 1) / 2;
        ctx.fillStyle = `rgba(255, 255, 255, ${0.7 + pulse * 0.3})`;
        ctx.font = 'bold 14px "Segoe UI", sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText("Press 'E' to answer", promptX, promptY);
        ctx.textAlign = 'left';
    }

    // Draw narrator dialogue box
    if (narratorActive && narratorPhase < narratorMessages.length) {
        // Calculate which message to show and how much of it
        let totalTime = 0;
        let currentMessage = null;
        let messageStartTime = 0;

        for (let i = 0; i <= narratorPhase && i < narratorMessages.length; i++) {
            if (i === narratorPhase) {
                currentMessage = narratorMessages[i];
                messageStartTime = totalTime;
                break;
            }
            totalTime += narratorMessages[i].duration + 30; // 30 frame gap between messages
        }

        if (currentMessage) {
            const timeInMessage = narratorTimer - messageStartTime;

            // Check if we should move to next message
            if (timeInMessage > currentMessage.duration + 30) {
                narratorPhase++;
                if (narratorPhase >= narratorMessages.length) {
                    narratorActive = false;
                    // Show dialogue choices after initial messages
                    dialogueChoiceActive = true;
                }
            } else if (timeInMessage > 0 && timeInMessage <= currentMessage.duration) {
                drawDialogueBox('???', currentMessage.text, timeInMessage);
            }
        }
    }

    // Draw dialogue choices
    if (dialogueChoiceActive && choiceMessagePhase === 0) {
        const boxWidth = 500;
        const boxHeight = 120;
        const boxX = (canvas.width - boxWidth) / 2;
        const boxY = canvas.height - boxHeight - 20;

        // Semi-transparent background
        ctx.fillStyle = 'rgba(20, 20, 40, 0.9)';
        ctx.beginPath();
        ctx.roundRect(boxX, boxY, boxWidth, boxHeight, 8);
        ctx.fill();

        // Border
        ctx.strokeStyle = '#e94560';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.roundRect(boxX, boxY, boxWidth, boxHeight, 8);
        ctx.stroke();

        // "Choose your response" label
        ctx.fillStyle = '#a0a0a0';
        ctx.font = '14px "Segoe UI", sans-serif';
        ctx.fillText('Choose your response:', boxX + 20, boxY + 25);

        // Draw choice options
        for (let i = 0; i < dialogueChoices.length; i++) {
            const choiceY = boxY + 50 + i * 30;
            const isHovered = selectedChoice === i;

            // Choice background
            if (isHovered) {
                ctx.fillStyle = 'rgba(233, 69, 96, 0.3)';
                ctx.beginPath();
                ctx.roundRect(boxX + 15, choiceY - 18, boxWidth - 30, 28, 4);
                ctx.fill();
            }

            // Key indicator
            ctx.fillStyle = '#e94560';
            ctx.font = 'bold 16px "Segoe UI", sans-serif';
            ctx.fillText(`[${dialogueChoices[i].key}]`, boxX + 25, choiceY);

            // Choice text
            ctx.fillStyle = isHovered ? '#ffffff' : '#cccccc';
            ctx.font = '18px "Segoe UI", sans-serif';
            ctx.fillText(dialogueChoices[i].text, boxX + 70, choiceY);
        }

        // Hint text
        ctx.fillStyle = '#666666';
        ctx.font = '12px "Segoe UI", sans-serif';
        ctx.fillText('Press 1 or 2 to choose, or use ↑↓ and Enter', boxX + 20, boxY + boxHeight - 10);
    }

    // Draw choice response messages
    if (choiceMessagePhase > 0) {
        const responses = selectedChoice === 0 ? choice1Responses : choice2Responses;
        const responseIndex = choiceMessagePhase - 1;

        if (responseIndex < responses.length) {
            const response = responses[responseIndex];
            const messageDuration = 100 + response.text.length * 2;

            // Check if we should move to next message
            if (choiceMessageTimer > messageDuration + 20) {
                choiceMessagePhase++;
                choiceMessageTimer = 0;
                if (choiceMessagePhase > responses.length) {
                    // All responses done
                    choiceMessagePhase = 0;
                    dialogueChoiceActive = false;
                }
            } else {
                drawDialogueBox(response.speaker, response.text, choiceMessageTimer);
            }
        }
    }

    // Draw Level 8 narrator messages
    if (level8NarratorActive && level8MessagePhase < level8NarratorMessages.length) {
        const message = level8NarratorMessages[level8MessagePhase];
        const messageDuration = 100 + message.text.length * 2;

        // Check if we should move to next message
        if (level8MessageTimer > messageDuration + 20) {
            level8MessagePhase++;
            level8MessageTimer = 0;
            if (level8MessagePhase >= level8NarratorMessages.length) {
                level8NarratorActive = false;
            }
        } else {
            drawDialogueBox(message.speaker, message.text, level8MessageTimer);
        }
    }

    // Draw Level 9 narrator messages (key and door tutorial)
    if (level9NarratorActive && level9MessagePhase < level9NarratorMessages.length) {
        const message = level9NarratorMessages[level9MessagePhase];
        const messageDuration = 100 + message.text.length * 2;

        // Check if we should move to next message
        if (level9MessageTimer > messageDuration + 20) {
            level9MessagePhase++;
            level9MessageTimer = 0;
            if (level9MessagePhase >= level9NarratorMessages.length) {
                level9NarratorActive = false;
            }
        } else {
            drawDialogueBox(message.speaker, message.text, level9MessageTimer);
        }
    }
}

function drawDialogueBox(speaker, text, timeInMessage) {
    const boxWidth = 600;
    const maxTextWidth = boxWidth - 40; // Padding on both sides
    const lineHeight = 24;

    // Set font for measuring
    ctx.font = '18px "Segoe UI", sans-serif';

    // Word wrap the text
    const words = text.split(' ');
    const lines = [];
    let currentLine = '';

    for (const word of words) {
        const testLine = currentLine ? currentLine + ' ' + word : word;
        const testWidth = ctx.measureText(testLine).width;

        if (testWidth > maxTextWidth && currentLine) {
            lines.push(currentLine);
            currentLine = word;
        } else {
            currentLine = testLine;
        }
    }
    if (currentLine) {
        lines.push(currentLine);
    }

    // Calculate box height based on number of lines
    const boxHeight = 60 + (lines.length * lineHeight);
    const boxX = (canvas.width - boxWidth) / 2;
    const boxY = canvas.height - boxHeight - 20;

    // Semi-transparent background
    ctx.fillStyle = 'rgba(20, 20, 40, 0.95)';
    ctx.beginPath();
    ctx.roundRect(boxX, boxY, boxWidth, boxHeight, 8);
    ctx.fill();

    // Border
    ctx.strokeStyle = '#e94560';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(boxX, boxY, boxWidth, boxHeight, 8);
    ctx.stroke();

    // Speaker label
    ctx.fillStyle = speaker === 'Narrator' ? '#4a90d9' : '#e94560';
    ctx.font = 'bold 14px "Segoe UI", sans-serif';
    ctx.fillText(speaker, boxX + 20, boxY + 22);

    // Typewriter effect for the message
    const charsToShow = Math.floor(timeInMessage / 2); // Slightly faster typing
    const displayText = text.substring(0, charsToShow);

    // Play sound for each new character
    if (charsToShow > 0 && charsToShow <= text.length && timeInMessage % 3 === 1) {
        sound.playNarratorVoice();
    }

    // Draw wrapped text with typewriter effect
    ctx.fillStyle = '#ffffff';
    ctx.font = '18px "Segoe UI", sans-serif';

    let charsDrawn = 0;
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const lineStart = charsDrawn;
        const lineEnd = charsDrawn + line.length;

        if (charsToShow > lineStart) {
            const visibleChars = Math.min(charsToShow - lineStart, line.length);
            const visibleText = line.substring(0, visibleChars);
            ctx.fillText(visibleText, boxX + 20, boxY + 45 + (i * lineHeight));

            // Draw cursor at end of current line being typed
            if (charsToShow < lineEnd && charsToShow >= lineStart) {
                if (Math.floor(timeInMessage / 15) % 2 === 0) {
                    const cursorX = boxX + 20 + ctx.measureText(visibleText).width;
                    ctx.fillRect(cursorX + 2, boxY + 30 + (i * lineHeight), 2, 18);
                }
            }
        }
        charsDrawn += line.length + 1; // +1 for the space between words
    }

    // "Press Enter to skip" hint (shown when text is complete)
    if (charsToShow >= text.length) {
        ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
        ctx.font = '12px "Segoe UI", sans-serif';
        ctx.textAlign = 'right';
        ctx.fillText('Press Enter to continue', boxX + boxWidth - 15, boxY + boxHeight - 8);
        ctx.textAlign = 'left';
    }
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
        case 'e':
            // Answer the phone
            if (phoneRinging && !phoneAnswered && gameState === 'playing') {
                phoneAnswered = true;
                phoneRinging = false;

                // Check which level's phone call this is
                if (currentLevel === 7 && level8PhoneTriggered) {
                    // Level 8 phone call
                    level8NarratorActive = true;
                    level8MessagePhase = 0;
                    level8MessageTimer = 0;
                } else if (currentLevel === 8 && level9IntroTriggered) {
                    // Level 9 phone call
                    level9NarratorActive = true;
                    level9MessagePhase = 0;
                    level9MessageTimer = 0;
                } else {
                    // Initial game phone call
                    narratorActive = true;
                    narratorTimer = 0;
                    narratorPhase = 0;
                }
            }
            // Interact with door
            else if (levelDoor && levelDoor.isPlayerNear(player) && gameState === 'playing') {
                if (levelDoor.state === 'locked' && levelKey && levelKey.collected) {
                    // Unlock the door with the key
                    levelDoor.unlock();
                    sound.playLevelComplete(); // Play a sound
                } else if (levelDoor.state === 'unlocked') {
                    // Open the unlocked door
                    levelDoor.open();
                } else if (levelDoor.isFullyOpen()) {
                    // Enter through the open door - transition to stage 2
                    levelDoor.enter();
                    // Short delay then load stage 2
                    setTimeout(() => {
                        loadStage2();
                    }, 500);
                }
            }
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
        case 'enter':
            // Skip dialogue / advance to next message
            if (gameState === 'playing') {
                if (narratorActive) {
                    narratorPhase++;
                    narratorTimer = 0;
                    if (narratorPhase >= narratorMessages.length) {
                        narratorActive = false;
                        dialogueChoiceActive = true;
                        selectedChoice = 0;
                    }
                } else if (choiceMessagePhase > 0) {
                    // Skip choice response messages
                    const responses = selectedChoice === 0 ? choice1Responses : choice2Responses;
                    choiceMessagePhase++;
                    choiceMessageTimer = 0;
                    if (choiceMessagePhase > responses.length) {
                        choiceMessagePhase = 0;
                        dialogueChoiceActive = false;
                    }
                } else if (level8NarratorActive) {
                    level8MessagePhase++;
                    level8MessageTimer = 0;
                    if (level8MessagePhase >= level8NarratorMessages.length) {
                        level8NarratorActive = false;
                    }
                } else if (level9NarratorActive) {
                    level9MessagePhase++;
                    level9MessageTimer = 0;
                    if (level9MessagePhase >= level9NarratorMessages.length) {
                        level9NarratorActive = false;
                    }
                }
            }
            break;
        // Arrow keys for dialogue choice selection
        case 'arrowup':
            if (dialogueChoiceActive && choiceMessagePhase === 0) {
                selectedChoice = 0;
                e.preventDefault();
            }
            break;
        case 'arrowdown':
            if (dialogueChoiceActive && choiceMessagePhase === 0) {
                selectedChoice = 1;
                e.preventDefault();
            }
            break;
        case 'enter':
            // Confirm dialogue choice
            if (dialogueChoiceActive && choiceMessagePhase === 0) {
                choiceMessagePhase = 1;
                choiceMessageTimer = 0;
                e.preventDefault();
            }
            break;
        // Number keys - dialogue choices take priority, then level select
        case '1':
            if (dialogueChoiceActive && choiceMessagePhase === 0) {
                selectedChoice = 0;
                choiceMessagePhase = 1;
                choiceMessageTimer = 0;
            } else if (gameState === 'playing' && !dialogueChoiceActive) {
                currentLevel = 0;
                loadLevel(currentLevel);
            }
            break;
        case '2':
            if (dialogueChoiceActive && choiceMessagePhase === 0) {
                selectedChoice = 1;
                choiceMessagePhase = 1;
                choiceMessageTimer = 0;
            } else if (gameState === 'playing' && !dialogueChoiceActive) {
                currentLevel = 1;
                loadLevel(currentLevel);
            }
            break;
        case '3':
        case '4':
        case '5':
        case '6':
        case '7':
        case '8':
        case '9':
            if (gameState === 'playing' && !dialogueChoiceActive) {
                const levelNum = parseInt(e.key) - 1;
                if (levelNum < levels.length) {
                    currentLevel = levelNum;
                    loadLevel(currentLevel);
                }
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
