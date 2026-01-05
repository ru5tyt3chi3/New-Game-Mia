// ============================================
// Ping's Adventure - Platform Game Foundation
// ============================================

// Build Info (for debugging - set DEBUG_MODE to false for release)
const BUILD_VERSION = "0.1.0";
const BUILD_NUMBER = 37;
const BUILD_DATE = "2026-01-03";
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

    playNarratorVoice(speaker = 'Narrator') {
        if (this.muted || !this.initialized) return;

        // "You" speaker is silent
        if (speaker === 'You') return;

        const osc = this.audioContext.createOscillator();
        const gain = this.audioContext.createGain();
        const now = this.audioContext.currentTime;

        osc.connect(gain);
        gain.connect(this.sfxGain);

        // Different voice characteristics per speaker
        if (speaker === '???') {
            // Mysterious/distorted - low, glitchy
            osc.type = 'sawtooth';
            osc.frequency.value = 200 + Math.random() * 150;
            gain.gain.setValueAtTime(0.06, now);
            gain.gain.exponentialRampToValueAtTime(0.01, now + 0.08);
            osc.start(now);
            osc.stop(now + 0.08);
        } else if (speaker === 'Narrator') {
            // Clear, authoritative - higher pitch
            osc.type = 'square';
            osc.frequency.value = 800 + Math.random() * 200;
            gain.gain.setValueAtTime(0.08, now);
            gain.gain.exponentialRampToValueAtTime(0.01, now + 0.05);
            osc.start(now);
            osc.stop(now + 0.05);
        } else if (speaker === 'Worker 1' || speaker === 'Worker 2') {
            // Office workers - mid-range, slightly muffled
            osc.type = 'triangle';
            const basePitch = speaker === 'Worker 1' ? 400 : 350;
            osc.frequency.value = basePitch + Math.random() * 100;
            gain.gain.setValueAtTime(0.07, now);
            gain.gain.exponentialRampToValueAtTime(0.01, now + 0.06);
            osc.start(now);
            osc.stop(now + 0.06);
        } else if (speaker === 'Tech 1' || speaker === 'Tech 2') {
            // Tech workers - slightly robotic/digital
            osc.type = 'square';
            const basePitch = speaker === 'Tech 1' ? 600 : 550;
            osc.frequency.value = basePitch + Math.random() * 80;
            gain.gain.setValueAtTime(0.05, now);
            gain.gain.exponentialRampToValueAtTime(0.01, now + 0.04);
            osc.start(now);
            osc.stop(now + 0.04);
        } else if (speaker === 'Exec 1' || speaker === 'Exec 2') {
            // Executives - deep, authoritative, slower
            osc.type = 'sawtooth';
            const basePitch = speaker === 'Exec 1' ? 280 : 250;
            osc.frequency.value = basePitch + Math.random() * 60;
            gain.gain.setValueAtTime(0.07, now);
            gain.gain.exponentialRampToValueAtTime(0.01, now + 0.08);
            osc.start(now);
            osc.stop(now + 0.08);
        } else if (speaker === 'HR') {
            // HR - clinical, cold, precise
            osc.type = 'triangle';
            osc.frequency.value = 450 + Math.random() * 50;
            gain.gain.setValueAtTime(0.06, now);
            gain.gain.exponentialRampToValueAtTime(0.01, now + 0.045);
            osc.start(now);
            osc.stop(now + 0.045);
        } else if (speaker === 'Archivist 1' || speaker === 'Archivist 2') {
            // Archivists - hushed, whispered, quiet
            osc.type = 'sine';
            const basePitch = speaker === 'Archivist 1' ? 380 : 340;
            osc.frequency.value = basePitch + Math.random() * 80;
            gain.gain.setValueAtTime(0.04, now);
            gain.gain.exponentialRampToValueAtTime(0.005, now + 0.06);
            osc.start(now);
            osc.stop(now + 0.06);
        } else if (speaker === 'Worker') {
            // Solo worker - same as Worker 1/2 but consistent
            osc.type = 'triangle';
            osc.frequency.value = 375 + Math.random() * 100;
            gain.gain.setValueAtTime(0.07, now);
            gain.gain.exponentialRampToValueAtTime(0.01, now + 0.06);
            osc.start(now);
            osc.stop(now + 0.06);
        } else if (speaker === 'Ping') {
            // Player character when named - soft, warm
            osc.type = 'sine';
            osc.frequency.value = 500 + Math.random() * 150;
            gain.gain.setValueAtTime(0.06, now);
            gain.gain.exponentialRampToValueAtTime(0.01, now + 0.05);
            osc.start(now);
            osc.stop(now + 0.05);
        } else {
            // Default fallback - standard typewriter
            osc.type = 'square';
            osc.frequency.value = 700 + Math.random() * 200;
            gain.gain.setValueAtTime(0.07, now);
            gain.gain.exponentialRampToValueAtTime(0.01, now + 0.05);
            osc.start(now);
            osc.stop(now + 0.05);
        }
    }
}

const sound = new SoundManager();

// ============================================
// Player Class (Ping)
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
        this.isTalking = false;
        this.talkFrame = 0;
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

        // Mouth - animated when talking
        if (this.isTalking) {
            this.talkFrame += 0.3;
            const mouthOpen = Math.abs(Math.sin(this.talkFrame)) * 5 + 2;

            // Open mouth (dark inside)
            ctx.fillStyle = '#1a1a2e';
            ctx.beginPath();
            ctx.ellipse(this.x + 16, this.y + 28, 5, mouthOpen, 0, 0, Math.PI * 2);
            ctx.fill();

            // Mouth outline
            ctx.strokeStyle = '#1a1a2e';
            ctx.lineWidth = 1;
            ctx.stroke();
        } else {
            // Normal smile
            ctx.strokeStyle = '#1a1a2e';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(this.x + 16, this.y + 28, 6, 0.1 * Math.PI, 0.9 * Math.PI);
            ctx.stroke();
        }
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
    constructor(x, y, initialState = 'locked') {
        this.x = x;
        this.y = y;
        this.width = 50;
        this.height = 80;
        this.state = initialState; // 'locked', 'unlocked', 'open', 'entered'
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
// Distorted Figure Class (Level 10 entity)
// ============================================
class DistortedFigure {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.width = 40;
        this.height = 60;
        this.tentacles = [];
        this.animFrame = 0;
        this.typingFrame = 0;

        // Generate tentacle positions
        for (let i = 0; i < 6; i++) {
            this.tentacles.push({
                angle: (Math.PI / 6) * i - Math.PI / 2,
                length: 30 + Math.random() * 20,
                speed: 0.02 + Math.random() * 0.02,
                phase: Math.random() * Math.PI * 2
            });
        }
    }

    update() {
        this.animFrame += 0.02;
        this.typingFrame += 0.15;
    }

    draw(ctx) {
        // Office chair
        ctx.fillStyle = '#1a1a1a';
        ctx.fillRect(this.x - 15, this.y + 40, 30, 10);
        ctx.fillRect(this.x - 5, this.y + 50, 10, 20);
        // Chair wheels
        ctx.fillStyle = '#0a0a0a';
        ctx.beginPath();
        ctx.arc(this.x - 10, this.y + 70, 4, 0, Math.PI * 2);
        ctx.arc(this.x + 10, this.y + 70, 4, 0, Math.PI * 2);
        ctx.fill();

        // Tentacles (coming from the figure)
        for (const t of this.tentacles) {
            const wave = Math.sin(this.animFrame * t.speed * 50 + t.phase) * 10;
            ctx.strokeStyle = '#0a0a0a';
            ctx.lineWidth = 4;
            ctx.beginPath();
            ctx.moveTo(this.x, this.y + 20);

            const endX = this.x + Math.cos(t.angle + wave * 0.02) * t.length;
            const endY = this.y + 20 + Math.sin(t.angle + wave * 0.02) * t.length * 0.5;

            ctx.quadraticCurveTo(
                this.x + Math.cos(t.angle) * t.length * 0.5,
                this.y + 20 + wave * 0.3,
                endX, endY
            );
            ctx.stroke();

            // Tentacle tip
            ctx.fillStyle = '#050505';
            ctx.beginPath();
            ctx.arc(endX, endY, 3, 0, Math.PI * 2);
            ctx.fill();
        }

        // Distorted body (back view - facing computer)
        ctx.fillStyle = '#0a0a0a';
        ctx.fillRect(this.x - 15, this.y, 30, 45);

        // Head (slightly misshapen)
        ctx.beginPath();
        ctx.ellipse(this.x, this.y - 5, 12, 15, 0, 0, Math.PI * 2);
        ctx.fill();

        // Glitch effect on the figure
        if (Math.random() < 0.05) {
            ctx.fillStyle = 'rgba(255, 0, 0, 0.3)';
            ctx.fillRect(this.x - 20 + Math.random() * 10, this.y + Math.random() * 40, 40, 3);
        }

        // Arms reaching to keyboard (animated typing)
        const typeOffset = Math.sin(this.typingFrame) * 2;
        ctx.strokeStyle = '#0a0a0a';
        ctx.lineWidth = 5;
        ctx.beginPath();
        ctx.moveTo(this.x - 10, this.y + 25);
        ctx.lineTo(this.x - 25, this.y + 45 + typeOffset);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(this.x + 10, this.y + 25);
        ctx.lineTo(this.x + 25, this.y + 45 - typeOffset);
        ctx.stroke();
    }
}

// ============================================
// Vent Peek Point Class
// ============================================
class VentPeekPoint {
    constructor(data) {
        this.id = data.id;
        this.x = data.x;
        this.y = data.y;
        this.width = 40;
        this.height = 30;
        this.roomName = data.roomName;
        this.npcs = data.npcs;
        this.dialogue = data.dialogue;
        this.isActive = false;
        this.dialoguePhase = 0;
        this.dialogueTimer = 0;
    }

    draw(ctx) {
        // Vent grate appearance
        ctx.fillStyle = '#2a2a2a';
        ctx.fillRect(this.x, this.y, this.width, this.height);

        // Grate lines
        ctx.strokeStyle = '#1a1a1a';
        ctx.lineWidth = 2;
        for (let i = 0; i < 5; i++) {
            ctx.beginPath();
            ctx.moveTo(this.x + 5 + i * 8, this.y);
            ctx.lineTo(this.x + 5 + i * 8, this.y + this.height);
            ctx.stroke();
        }

        // Light coming through (indicating room below)
        ctx.fillStyle = 'rgba(255, 200, 100, 0.2)';
        ctx.fillRect(this.x + 2, this.y + 2, this.width - 4, this.height - 4);

        // Interaction prompt if player is near
        if (this.isActive) {
            ctx.fillStyle = '#ffcc00';
            ctx.font = 'bold 12px "Segoe UI", sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText("Press 'E' to peek", this.x + this.width / 2, this.y - 10);
            ctx.textAlign = 'left';
        }
    }

    isPlayerNear(player) {
        const range = 30;
        return player.x + player.width > this.x - range &&
               player.x < this.x + this.width + range &&
               player.y + player.height > this.y - range &&
               player.y < this.y + this.height + range;
    }

    drawPeekView(ctx, dialoguePhase, dialogueTimer) {
        // Dark overlay
        ctx.fillStyle = 'rgba(0, 0, 0, 0.9)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Vent frame (looking through slats)
        const viewX = 100;
        const viewY = 80;
        const viewW = 600;
        const viewH = 350;

        // Room background
        ctx.fillStyle = '#1a1a1a';
        ctx.fillRect(viewX, viewY, viewW, viewH);

        // Room name
        ctx.fillStyle = '#666666';
        ctx.font = 'bold 16px "Segoe UI", sans-serif';
        ctx.fillText(this.roomName, viewX + 20, viewY + 30);

        // Floor
        ctx.fillStyle = '#252525';
        ctx.fillRect(viewX, viewY + viewH - 80, viewW, 80);

        // Draw NPCs
        for (const npc of this.npcs) {
            this.drawOfficeNPC(ctx, viewX + npc.x * 3, viewY + npc.y * 2, npc.color);
        }

        // Vent slat overlay
        ctx.strokeStyle = '#0a0a0a';
        ctx.lineWidth = 8;
        for (let i = 0; i < 8; i++) {
            ctx.beginPath();
            ctx.moveTo(viewX + i * 85, viewY);
            ctx.lineTo(viewX + i * 85, viewY + viewH);
            ctx.stroke();
        }

        // Current dialogue
        if (dialoguePhase < this.dialogue.length) {
            const msg = this.dialogue[dialoguePhase];
            drawDialogueBox(msg.speaker, msg.text, dialogueTimer);
        }

        // Exit prompt
        ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
        ctx.font = '14px "Segoe UI", sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText("Press 'E' or 'Escape' to stop peeking", canvas.width / 2, canvas.height - 30);
        ctx.textAlign = 'left';
    }

    drawOfficeNPC(ctx, x, y, color) {
        // Simple office worker sprite
        // Body
        ctx.fillStyle = color;
        ctx.fillRect(x, y, 24, 40);

        // Head
        ctx.fillStyle = '#3a3a3a';
        ctx.beginPath();
        ctx.arc(x + 12, y - 8, 10, 0, Math.PI * 2);
        ctx.fill();

        // Subtle face features
        ctx.fillStyle = '#2a2a2a';
        ctx.beginPath();
        ctx.arc(x + 8, y - 10, 2, 0, Math.PI * 2);
        ctx.arc(x + 16, y - 10, 2, 0, Math.PI * 2);
        ctx.fill();
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
    // Level 2 - Zigzag
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
    // Level 3 - Final Challenge
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
    // Level 4 - Something's Wrong...
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
    // Level 5 - IT GETS WORSE
    {
        name: "RUN",
        playerStart: { x: 50, y: 480 },
        goal: { x: 650, y: 140 },
        noMusic: true,
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
    // Level 6 - Back to Normal
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
    // Level 7 - Key and Door (two stages)
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
    },
    // Level 8 - Dark Office / Vent Crawl (two stages)
    {
        name: "The Office",
        playerStart: { x: 50, y: 480 },
        isOfficeLevel: true,
        isDark: true,
        noMusic: true,
        hasVentSystem: true,
        hasStages: true,
        // Intro dialogue from player character
        introDialogue: [
            { text: "...", speaker: "???" },
            { text: "It's so dark...", speaker: "???" },
            { text: "The hell...?", speaker: "???" },
            { text: "Crap-", speaker: "???" },
            { text: "Move me! Move us! Move! Put us in the vent before he sees!", speaker: "???" },
            { text: "What...? Okay...", speaker: "You" }
        ],
        // Stage 1: Ascending through vents - Executive area (Ping dialogue triggers after all vents)
        stage1: {
            ventPeeks: [
                {
                    id: 'room4',
                    x: 120, y: 440,
                    roomName: "Executive Lounge",
                    npcs: [
                        { x: 60, y: 75, color: '#2a2a2a' },
                        { x: 140, y: 80, color: '#333333' }
                    ],
                    dialogue: [
                        { speaker: "Exec 1", text: "The contract is almost finalized." },
                        { speaker: "Exec 2", text: "Good. The red one has been... cooperative." },
                        { speaker: "Exec 1", text: "Ping doesn't even know what it's doing." },
                        { speaker: "Exec 2", text: "That's the beauty of it. Complete automation." }
                    ]
                },
                {
                    id: 'room5',
                    x: 380, y: 300,
                    roomName: "HR Office",
                    npcs: [
                        { x: 90, y: 80, color: '#484848' }
                    ],
                    dialogue: [
                        { speaker: "HR", text: "Employee file: Ping." },
                        { speaker: "HR", text: "Status: Active. Classification: Asset." },
                        { speaker: "HR", text: "Notes: Subject unaware of true purpose." },
                        { speaker: "HR", text: "Contract binding upon... completion." }
                    ]
                },
                {
                    id: 'room6',
                    x: 580, y: 160,
                    roomName: "Archive Room",
                    npcs: [
                        { x: 70, y: 70, color: '#3d3d3d' },
                        { x: 130, y: 85, color: '#4f4f4f' }
                    ],
                    dialogue: [
                        { speaker: "Archivist 1", text: "Why do they keep files on the red one?" },
                        { speaker: "Archivist 2", text: "Ping? It's been here longer than any of us." },
                        { speaker: "Archivist 1", text: "But what IS it exactly?" },
                        { speaker: "Archivist 2", text: "Don't ask. Just... don't." }
                    ]
                }
            ],
            ventPlatforms: [
                // Ground level start
                { x: 0, y: 550, w: 250, h: 50, isVent: true },
                // Jump up to first peek area (Executive Lounge)
                { x: 80, y: 470, w: 140, h: 20, isVent: true },
                // Climbing platforms - staggered for reachability
                { x: 220, y: 400, w: 120, h: 20, isVent: true },
                // Second peek area (HR Office)
                { x: 350, y: 330, w: 140, h: 20, isVent: true },
                // More climbing
                { x: 480, y: 260, w: 120, h: 20, isVent: true },
                // Third peek area (Archive Room)
                { x: 550, y: 190, w: 140, h: 20, isVent: true },
                // Final climb to door area
                { x: 650, y: 120, w: 150, h: 20, isVent: true },
            ]
        },
        // Stage 2: Straight drop - top platform to bottom
        stage2: {
            playerStart: { x: 380, y: 70 },
            goal: { x: 700, y: 520 },
            ventPeeks: [],
            ventPlatforms: [
                // Starting platform at top (player spawns on this)
                { x: 300, y: 120, w: 200, h: 20, isVent: true },
                // Bottom platform with goal (long drop down)
                { x: 200, y: 560, w: 600, h: 40, isVent: true },
            ]
        },
        // Legacy vent peeks (for stage 1 initial load - Executive area)
        ventPeeks: [
            {
                id: 'room4',
                x: 120, y: 440,
                roomName: "Executive Lounge",
                npcs: [
                    { x: 60, y: 75, color: '#2a2a2a' },
                    { x: 140, y: 80, color: '#333333' }
                ],
                dialogue: [
                    { speaker: "Exec 1", text: "The contract is almost finalized." },
                    { speaker: "Exec 2", text: "Good. The red one has been... cooperative." },
                    { speaker: "Exec 1", text: "Ping doesn't even know what it's doing." },
                    { speaker: "Exec 2", text: "That's the beauty of it. Complete automation." }
                ]
            },
            {
                id: 'room5',
                x: 380, y: 300,
                roomName: "HR Office",
                npcs: [
                    { x: 90, y: 80, color: '#484848' }
                ],
                dialogue: [
                    { speaker: "HR", text: "Employee file: Ping." },
                    { speaker: "HR", text: "Status: Active. Classification: Asset." },
                    { speaker: "HR", text: "Notes: Subject unaware of true purpose." },
                    { speaker: "HR", text: "Contract binding upon... completion." }
                ]
            },
            {
                id: 'room6',
                x: 580, y: 160,
                roomName: "Archive Room",
                npcs: [
                    { x: 70, y: 70, color: '#3d3d3d' },
                    { x: 130, y: 85, color: '#4f4f4f' }
                ],
                dialogue: [
                    { speaker: "Archivist 1", text: "Why do they keep files on the red one?" },
                    { speaker: "Archivist 2", text: "Ping? It's been here longer than any of us." },
                    { speaker: "Archivist 1", text: "But what IS it exactly?" },
                    { speaker: "Archivist 2", text: "Don't ask. Just... don't." }
                ]
            }
        ],
        // Legacy vent platforms (for stage 1 initial load - Executive area)
        ventPlatforms: [
            // Ground level start
            { x: 0, y: 550, w: 250, h: 50, isVent: true },
            // Jump up to first peek area (Executive Lounge)
            { x: 80, y: 470, w: 140, h: 20, isVent: true },
            // Climbing platforms - staggered for reachability
            { x: 220, y: 400, w: 120, h: 20, isVent: true },
            // Second peek area (HR Office)
            { x: 350, y: 330, w: 140, h: 20, isVent: true },
            // More climbing
            { x: 480, y: 260, w: 120, h: 20, isVent: true },
            // Third peek area (Archive Room)
            { x: 550, y: 190, w: 140, h: 20, isVent: true },
            // Final climb to door area (door sits on this platform)
            { x: 650, y: 120, w: 150, h: 20, isVent: true },
        ],
        // Regular platforms (initial office view before entering vent)
        platforms: [
            { x: 0, y: 550, w: 800, h: 50 }
        ],
        // Door at the top of stage 1 (triggers stage 2) - on final platform
        hasDoor: true,
        doorPosition: { x: 700, y: 40 },
        doorUnlocked: true
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

// Level 9 player character dialogue (after narrator leaves)
let level9PlayerDialogueActive = false;
let level9PlayerPhase = 0;
let level9PlayerTimer = 0;
const level9PlayerMessages = [
    { text: "*Sigh-*", speaker: "???" },
    { text: "He's gone...", speaker: "???" },
    { text: "Phew!", speaker: "???" },
    { text: "Okay...", speaker: "???" },
    { text: "...", speaker: "???" },
    { text: "This place isn't-", speaker: "???" }
];

// Level 9 second phone call (narrator returns)
let level9SecondCallTriggered = false;
let level9SecondCallActive = false;
let level9SecondPhase = 0;
let level9SecondTimer = 0;
const level9NarratorReturnMessages = [
    { text: "Okayyy!", speaker: "Narrator" },
    { text: "I'm back!", speaker: "Narrator" },
    { text: "Soooo yeah!", speaker: "Narrator" },
    { text: "Easy as pie!", speaker: "Narrator" },
    { text: "...", speaker: "Narrator" },
    { text: "Are you okay?", speaker: "Narrator" }
];

// Level 9 dialogue choices (3 options)
let level9ChoiceActive = false;
let level9SelectedChoice = 0;
let level9ChoiceResponsePhase = 0;
let level9ChoiceResponseTimer = 0;

const level9Choices = [
    { text: "...", key: "1" },
    { text: "The little red guy just talked to me...", key: "2" },
    { text: "Who's that?", key: "3" }
];

const level9Choice1Responses = [
    { text: "...", speaker: "Narrator" },
    { text: "... I see...", speaker: "Narrator" }
];

const level9Choice2Responses = [
    { text: "Oh-", speaker: "Narrator" },
    { text: "Must be another bug...", speaker: "Narrator" }
];

const level9Choice3Responses = [
    { text: "Who?", speaker: "Narrator" },
    { text: "The red guy?", speaker: "Narrator" },
    { text: "Oh, he's a bot.", speaker: "Narrator" }
];

// Level 10 - Office/Vent state
let level10IntroTriggered = false;
let level10IntroActive = false;
let level10IntroPhase = 0;
let level10IntroTimer = 0;
let isInVent = false;
let distortedFigure = null;
let ventPeekPoints = [];
let currentPeekPoint = null;
let isPeeking = false;
let peekDialoguePhase = 0;
let peekDialogueTimer = 0;

// Level 8 Stage 2 - Ping dialogue state
let stage2IntroTriggered = false;
let stage2IntroActive = false;
let stage2IntroPhase = 0;
let stage2IntroTimer = 0;
let stage2ChoiceActive = false;
let stage2SelectedChoice = 0;
let stage2ChoicesUsed = [false, false, false]; // Track which choices have been used (3 choices)
let stage2ResponseActive = false;
let stage2ResponsePhase = 0;
let stage2ResponseTimer = 0;
let stage2VentsViewed = {}; // Track which Stage 2 vents have been viewed (by id)

// Level 8 Stage 2 - Landing event state (when Ping lands on bottom platform)
let stage2LandingTriggered = false;
let stage2LandingActive = false;
let stage2LandingPhase = 0;
let stage2LandingTimer = 0;
let stage2WasInAir = false; // Track if player was in the air before landing

// Stage 2 landing confused chatter messages
const stage2LandingMessages = [
    { speaker: "???", text: "*THUMP*" },
    { speaker: "Worker 1", text: "What the hell was that?!" },
    { speaker: "Worker 2", text: "Did something fall?" },
    { speaker: "Worker 1", text: "It came from the vents..." },
    { speaker: "Worker 2", text: "Should we call HR?" },
    { speaker: "Worker 1", text: "I'm not going up there. You call them." },
    { speaker: "Worker 2", text: "...Maybe it was nothing." }
];

// Level 8 Stage 2 - Alarm sequence state (after landing dialogue)
let stage2AlarmActive = false;
let stage2AlarmTimer = 0;
let stage2Countdown = 10;
let stage2RedFlashTimer = 0;
let stage2HideObjectiveActive = false;
let stage2HideObjectiveTimer = 0;
let stage2HideObjectivePhase = 0; // 0 = center popup, 1 = shrinking to top
let stage2ChaserActive = false;
let stage2Chaser = null;
let stage2CaughtActive = false;
let stage2CaughtTimer = 0;
let stage2FaintPhase = 0;
let stage2FadeToBlack = 0; // 0 to 1 for fade progress

// Stage 2 intro messages
const stage2IntroMessages = [
    { speaker: "You", text: "Ping...?" },
    { speaker: "You", text: "Is that your name?" },
    { speaker: "Ping", text: "..." },
    { speaker: "Ping", text: "Yeah..." },
    { speaker: "Ping", text: "That's the name of the title..." }
];

// Stage 2 choice options (3 choices)
const stage2Choices = [
    { text: "What's the contract all about?", key: "1" },
    { text: "You don't know your true purpose?", key: "2" },
    { text: "What did they mean by what you are?", key: "3" }
];

// Stage 2 choice responses
const stage2Choice1Responses = [
    { speaker: "Ping", text: "..." },
    { speaker: "Ping", text: "The contract...?" },
    { speaker: "Ping", text: "..." },
    { speaker: "Ping", text: "I... can't say." },
    { speaker: "You", text: "..." }
];

const stage2Choice2Responses = [
    { speaker: "Ping", text: "..." },
    { speaker: "You", text: "..." }
];

const stage2Choice3Responses = [
    { speaker: "Ping", text: "..." },
    { speaker: "Ping", text: "I've... never seen them before." },
    { speaker: "Ping", text: "..." },
    { speaker: "You", text: "You must've! You've been here the longest!" },
    { speaker: "Ping", text: "..." },
    { speaker: "Ping", text: "You're right." },
    { speaker: "Ping", text: "I should." },
    { speaker: "Ping", text: "But I don't." }
];

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
    // For office levels, start with regular platforms (office view), vent platforms load when entering vent
    let platformData;
    if (level.isOfficeLevel && level.platforms) {
        // Office level: start with office view platforms, not vent platforms
        platformData = level.platforms;
    } else if (level.hasStages) {
        // Other staged levels: use stage1 platforms
        platformData = level.stage1.platforms;
    } else {
        platformData = level.platforms;
    }
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
    // For office levels, door is in the vent - don't create until player enters vent
    if (level.hasDoor && level.doorPosition && !level.isOfficeLevel) {
        const doorState = level.doorUnlocked ? 'unlocked' : 'locked';
        levelDoor = new Door(level.doorPosition.x, level.doorPosition.y, doorState);
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

    // Trigger Level 6 phone call after cutscene (was Level 8)
    if (levelIndex === 5 && !level8PhoneTriggered) {
        level8PhoneTriggered = true;
        phoneRinging = true;
        phoneAnswered = false;
        phoneRingTimer = 0;
    }

    // Trigger Level 7 phone call (key and door tutorial, was Level 9)
    if (levelIndex === 6 && !level9IntroTriggered) {
        level9IntroTriggered = true;
        phoneRinging = true;
        phoneAnswered = false;
        phoneRingTimer = 0;
    }

    // Initialize Level 10 (Office level)
    if (level.isOfficeLevel) {
        // Create distorted figure
        distortedFigure = new DistortedFigure(600, 400);

        // Create vent peek points
        ventPeekPoints = level.ventPeeks.map(vp => new VentPeekPoint(vp));

        // Reset vent state
        isInVent = false;
        isPeeking = false;
        currentPeekPoint = null;

        // Trigger intro dialogue
        if (!level10IntroTriggered) {
            level10IntroTriggered = true;
            level10IntroActive = true;
            level10IntroPhase = 0;
            level10IntroTimer = 0;
        }
    } else {
        distortedFigure = null;
        ventPeekPoints = [];
        isInVent = false;
    }

    levelComplete = false;
    levelTransitionTimer = 0;
}

// Load stage 2 of a multi-stage level
function loadStage2() {
    const level = levels[currentLevel];

    if (!level.hasStages || !level.stage2) return;

    currentStage = 2;

    // Handle office levels with vent systems
    if (level.isOfficeLevel && level.stage2.ventPlatforms) {
        // Load vent platforms for stage 2
        platforms = level.stage2.ventPlatforms.map(p =>
            new Platform(p.x, p.y, p.w, p.h, '#2a3a4a', false)
        );

        // Load new vent peek points for stage 2
        if (level.stage2.ventPeeks) {
            ventPeekPoints = level.stage2.ventPeeks.map(vp => new VentPeekPoint(vp));
        }

        // Reset peek state
        isPeeking = false;
        currentPeekPoint = null;
        peekDialoguePhase = 0;
        peekDialogueTimer = 0;

        // Stay in vent mode
        isInVent = true;
    } else {
        // Normal stage 2 platforms
        platforms = level.stage2.platforms.map(p =>
            new Platform(p.x, p.y, p.w, p.h, '#3d5a80', p.bloody || false)
        );
    }

    // Create the goal in stage 2 (except Level 8 which has no goal)
    if (currentLevel === 7) {
        // Level 8 has no goal - landing triggers dialogue instead
        goal = null;
        // Reset landing event state
        stage2LandingTriggered = false;
        stage2LandingActive = false;
        stage2LandingPhase = 0;
        stage2LandingTimer = 0;
        stage2WasInAir = true; // Player starts in the air (will fall)
        // Reset alarm sequence state
        stage2AlarmActive = false;
        stage2AlarmTimer = 0;
        stage2Countdown = 10;
        stage2RedFlashTimer = 0;
        stage2HideObjectiveActive = false;
        stage2HideObjectiveTimer = 0;
        stage2HideObjectivePhase = 0;
        stage2ChaserActive = false;
        stage2Chaser = null;
        stage2CaughtActive = false;
        stage2CaughtTimer = 0;
        stage2FaintPhase = 0;
        stage2FadeToBlack = 0;
    } else {
        goal = new Goal(level.stage2.goal.x, level.stage2.goal.y, level.hasBlood);
    }

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

// Heavy thump sound for landing
SoundManager.prototype.playThump = function() {
    if (this.muted || !this.initialized) return;

    // Deep bass thump
    const osc = this.audioContext.createOscillator();
    const gain = this.audioContext.createGain();

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.type = 'sine';
    osc.frequency.setValueAtTime(80, this.audioContext.currentTime);
    osc.frequency.exponentialRampToValueAtTime(30, this.audioContext.currentTime + 0.2);

    gain.gain.setValueAtTime(0.6, this.audioContext.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.3);

    osc.start(this.audioContext.currentTime);
    osc.stop(this.audioContext.currentTime + 0.3);

    // Add some noise for impact
    const noiseLength = 0.1;
    const bufferSize = this.audioContext.sampleRate * noiseLength;
    const noiseBuffer = this.audioContext.createBuffer(1, bufferSize, this.audioContext.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
        output[i] = Math.random() * 2 - 1;
    }

    const noise = this.audioContext.createBufferSource();
    const noiseGain = this.audioContext.createGain();
    noise.buffer = noiseBuffer;
    noise.connect(noiseGain);
    noiseGain.connect(this.sfxGain);

    noiseGain.gain.setValueAtTime(0.3, this.audioContext.currentTime);
    noiseGain.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + noiseLength);

    noise.start(this.audioContext.currentTime);
};

// Alarm sound for Level 8 chase sequence - siren style
SoundManager.prototype.playAlarm = function() {
    if (this.muted || !this.initialized) return;

    // Store oscillator reference so we can stop it later
    if (this.alarmOsc) {
        this.alarmOsc.stop();
    }

    const osc = this.audioContext.createOscillator();
    const gain = this.audioContext.createGain();

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.type = 'sine';

    // Siren effect - smooth frequency sweeps up and down
    const sirenDuration = 1.5; // Time for one up-down cycle
    for (let i = 0; i < 20; i++) { // 30 seconds of siren
        const t = this.audioContext.currentTime + i * sirenDuration;
        // Sweep up
        osc.frequency.setValueAtTime(400, t);
        osc.frequency.linearRampToValueAtTime(800, t + sirenDuration / 2);
        // Sweep down
        osc.frequency.linearRampToValueAtTime(400, t + sirenDuration);
    }

    gain.gain.setValueAtTime(0.2, this.audioContext.currentTime);

    osc.start(this.audioContext.currentTime);
    osc.stop(this.audioContext.currentTime + 30);
    this.alarmOsc = osc;
};

// Stop alarm sound
SoundManager.prototype.stopAlarm = function() {
    if (this.alarmOsc) {
        try {
            this.alarmOsc.stop();
        } catch (e) {}
        this.alarmOsc = null;
    }
};

// Countdown beep
SoundManager.prototype.playCountdownBeep = function(isLast = false) {
    if (this.muted || !this.initialized) return;

    const osc = this.audioContext.createOscillator();
    const gain = this.audioContext.createGain();

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.type = 'sine';
    osc.frequency.value = isLast ? 880 : 440;

    gain.gain.setValueAtTime(0.4, this.audioContext.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.15);

    osc.start(this.audioContext.currentTime);
    osc.stop(this.audioContext.currentTime + 0.15);
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
    ctx.fillText("Ping's Adventure", canvas.width / 2, 150);

    // Subtitle
    ctx.fillStyle = '#a0a0a0';
    ctx.font = '20px "Segoe UI", sans-serif';
    ctx.fillText('A Platformer Game', canvas.width / 2, 190);

    // Draw Ping character as decoration
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

function drawOfficeBackground() {
    // Very dark office background
    ctx.fillStyle = '#0a0a0f';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    if (!isInVent) {
        // Initial office view - player sees the distorted figure
        // Dim ambient lighting
        const gradient = ctx.createRadialGradient(600, 350, 50, 600, 350, 300);
        gradient.addColorStop(0, 'rgba(30, 25, 20, 0.3)');
        gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Old computer monitor glow
        ctx.fillStyle = 'rgba(100, 200, 100, 0.1)';
        ctx.fillRect(550, 320, 100, 80);

        // Monitor
        ctx.fillStyle = '#1a1a1a';
        ctx.fillRect(560, 330, 80, 60);
        // Screen
        ctx.fillStyle = '#0a2a0a';
        ctx.fillRect(565, 335, 70, 50);
        // Screen text (green terminal style)
        ctx.fillStyle = '#00ff00';
        ctx.font = '8px monospace';
        for (let i = 0; i < 4; i++) {
            ctx.fillText('> ........', 570, 345 + i * 10);
        }

        // Desk
        ctx.fillStyle = '#2a2015';
        ctx.fillRect(500, 400, 200, 15);

        // Landline phone on desk
        ctx.fillStyle = '#f5f5dc';
        ctx.fillRect(520, 385, 30, 15);
        // Phone receiver
        ctx.fillStyle = '#f0f0d0';
        ctx.beginPath();
        ctx.ellipse(535, 380, 12, 5, 0, 0, Math.PI * 2);
        ctx.fill();

        // Draw the distorted figure
        if (distortedFigure) {
            distortedFigure.update();
            distortedFigure.draw(ctx);
        }

        // Vent entrance hint (on the left wall)
        ctx.fillStyle = '#1a1a1a';
        ctx.fillRect(20, 420, 60, 40);
        ctx.strokeStyle = '#0a0a0a';
        ctx.lineWidth = 2;
        for (let i = 0; i < 6; i++) {
            ctx.beginPath();
            ctx.moveTo(25 + i * 10, 420);
            ctx.lineTo(25 + i * 10, 460);
            ctx.stroke();
        }

        // "Press E to enter vent" prompt if near
        if (player.x < 100 && player.y > 400) {
            ctx.fillStyle = '#ffcc00';
            ctx.font = 'bold 14px "Segoe UI", sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText("Press 'E' to enter vent", 50, 410);
            ctx.textAlign = 'left';
        }
    } else {
        // Inside the vent system - darker, claustrophobic
        ctx.fillStyle = '#0f0f0f';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Vent walls texture
        ctx.strokeStyle = '#1a1a1a';
        ctx.lineWidth = 3;
        for (let i = 0; i < 20; i++) {
            ctx.beginPath();
            ctx.moveTo(i * 45, 0);
            ctx.lineTo(i * 45, canvas.height);
            ctx.stroke();
        }

        // Draw vent peek points
        for (const vp of ventPeekPoints) {
            vp.isActive = vp.isPlayerNear(player);
            vp.draw(ctx);
        }
    }

    // Dark vignette overlay
    const vignette = ctx.createRadialGradient(
        canvas.width / 2, canvas.height / 2, 100,
        canvas.width / 2, canvas.height / 2, 500
    );
    vignette.addColorStop(0, 'rgba(0, 0, 0, 0)');
    vignette.addColorStop(1, 'rgba(0, 0, 0, 0.7)');
    ctx.fillStyle = vignette;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
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

    // Handle Level 9 player character dialogue
    if (level9PlayerDialogueActive) {
        level9PlayerTimer++;
    }

    // Handle Level 9 second call dialogue
    if (level9SecondCallActive) {
        level9SecondTimer++;
    }

    // Handle Level 9 choice response dialogue
    if (level9ChoiceResponsePhase > 0) {
        level9ChoiceResponseTimer++;
    }

    // Handle Level 10 intro dialogue
    if (level10IntroActive) {
        level10IntroTimer++;
    }

    // Handle Stage 2 Ping dialogue
    if (stage2IntroActive) {
        stage2IntroTimer++;
    }
    if (stage2ResponseActive) {
        stage2ResponseTimer++;
    }
    if (stage2LandingActive) {
        stage2LandingTimer++;
    }

    // Handle Level 8 Stage 2 alarm sequence
    if (stage2AlarmActive) {
        stage2AlarmTimer++;
        stage2RedFlashTimer++;

        // Countdown every 60 frames (1 second)
        if (stage2AlarmTimer % 60 === 0 && stage2Countdown > 0) {
            stage2Countdown--;

            // When countdown reaches 0, spawn chaser
            if (stage2Countdown === 0) {
                stage2ChaserActive = true;
                stage2Chaser = {
                    x: 380, // Spawn on top platform
                    y: 70,
                    width: 30,
                    height: 50,
                    velY: 0,
                    speed: 3.5, // Slightly faster than player (player is ~3)
                    isGrounded: false
                };
            }
        }

        // Update chaser movement
        if (stage2ChaserActive && stage2Chaser && !stage2CaughtActive) {
            // Apply gravity
            stage2Chaser.velY += 0.5;
            stage2Chaser.y += stage2Chaser.velY;

            // Check platform collisions
            stage2Chaser.isGrounded = false;
            for (const platform of platforms) {
                if (stage2Chaser.velY >= 0 &&
                    stage2Chaser.x + stage2Chaser.width > platform.x &&
                    stage2Chaser.x < platform.x + platform.width &&
                    stage2Chaser.y + stage2Chaser.height >= platform.y &&
                    stage2Chaser.y + stage2Chaser.height <= platform.y + platform.height + stage2Chaser.velY) {
                    stage2Chaser.y = platform.y - stage2Chaser.height;
                    stage2Chaser.velY = 0;
                    stage2Chaser.isGrounded = true;
                }
            }

            // Move towards player horizontally
            if (stage2Chaser.isGrounded) {
                if (player.x > stage2Chaser.x) {
                    stage2Chaser.x += stage2Chaser.speed;
                } else if (player.x < stage2Chaser.x) {
                    stage2Chaser.x -= stage2Chaser.speed;
                }
            }

            // Check if caught player
            if (stage2Chaser.x + stage2Chaser.width > player.x &&
                stage2Chaser.x < player.x + player.width &&
                stage2Chaser.y + stage2Chaser.height > player.y &&
                stage2Chaser.y < player.y + player.height) {
                // Caught!
                stage2CaughtActive = true;
                stage2CaughtTimer = 0;
                stage2FaintPhase = 0;
                sound.stopAlarm();
            }
        }
    }

    // Handle caught/faint sequence
    if (stage2CaughtActive) {
        stage2CaughtTimer++;

        // Faint animation phases
        if (stage2FaintPhase === 0 && stage2CaughtTimer > 60) {
            stage2FaintPhase = 1; // Start fade to black
        }

        // Fade to black
        if (stage2FaintPhase === 1) {
            stage2FadeToBlack += 0.02;
            if (stage2FadeToBlack >= 1) {
                stage2FadeToBlack = 1;
                stage2FaintPhase = 2;
                stage2CaughtTimer = 0;
            }
        }

        // After fully black, complete level
        if (stage2FaintPhase === 2 && stage2CaughtTimer > 60) {
            stage2CaughtActive = false;
            stage2AlarmActive = false;
            levelComplete = true;
            sound.playLevelComplete();
        }
    }

    // Handle Level 10 peek dialogue
    if (isPeeking && currentPeekPoint) {
        peekDialogueTimer++;
    }

    // Clear and draw background (or office for level 10)
    const level = levels[currentLevel];
    if (level && level.isOfficeLevel) {
        drawOfficeBackground();
    } else {
        drawBackground();
    }

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
        const isInDialogue = narratorActive || dialogueChoiceActive || choiceMessagePhase > 0 ||
            level8NarratorActive || level9NarratorActive || level9PlayerDialogueActive ||
            level9SecondCallActive || level9ChoiceActive || level9ChoiceResponsePhase > 0 ||
            level10IntroActive || isPeeking ||
            stage2IntroActive || stage2ChoiceActive || stage2ResponseActive || stage2LandingActive ||
            stage2CaughtActive;
        if (!isInDialogue) {
            player.update(platforms);

            // Check door collision (block player if door not open, but not in vent system)
            if (levelDoor && !isInVent && levelDoor.blocksPlayer(player)) {
                // Push player back
                if (player.x + player.width / 2 < levelDoor.x + levelDoor.width / 2) {
                    player.x = levelDoor.x - player.width;
                } else {
                    player.x = levelDoor.x + levelDoor.width;
                }
                player.velX = 0;
            }

            // Level 8 Stage 2 landing detection (only on bottom platform at y: 560)
            if (currentLevel === 7 && currentStage === 2 && !stage2LandingTriggered) {
                // Check if player was in the air and landed on the bottom platform
                // Bottom platform is at y: 560, so player y should be around 520+ when standing on it
                const onBottomPlatform = player.y > 480;
                if (stage2WasInAir && player.isGrounded && onBottomPlatform) {
                    // Player just landed on bottom platform - trigger thump and dialogue
                    stage2LandingTriggered = true;
                    stage2LandingActive = true;
                    stage2LandingPhase = 0;
                    stage2LandingTimer = 0;
                    sound.playThump();
                }
                // Track if player is in the air
                stage2WasInAir = !player.isGrounded;
            }
        }

        // Set talking state for player character (Ping/???) dialogue
        // Check all dialogue states where ??? speaks
        let pingIsTalking = false;

        // NOTE: Level 1 first phone call and choice responses intentionally have NO talking animation
        // (Ping is mysterious at this point, we don't show them talking yet)

        // Level 9 player dialogue (all ??? speaker)
        if (level9PlayerDialogueActive) {
            pingIsTalking = true;
        }

        // Level 9 "Oh crap-!" reaction
        if (level9SecondCallTriggered && phoneRinging && !phoneAnswered && !level9SecondCallActive) {
            pingIsTalking = true;
        }

        // Level 9 second call dialogue (check if current message is ???)
        if (level9SecondCallActive && level9SecondPhase < level9NarratorReturnMessages.length) {
            if (level9NarratorReturnMessages[level9SecondPhase].speaker === '???') {
                pingIsTalking = true;
            }
        }

        // Level 9 choice responses (check if current message is ???)
        if (level9ChoiceResponsePhase > 0) {
            const responses = level9SelectedChoice === 0 ? level9Choice1Responses :
                             level9SelectedChoice === 1 ? level9Choice2Responses :
                             level9Choice3Responses;
            const responseIndex = level9ChoiceResponsePhase - 1;
            if (responses && responseIndex < responses.length && responses[responseIndex].speaker === '???') {
                pingIsTalking = true;
            }
        }

        // Level 10 intro dialogue (check if current message is ???)
        if (level10IntroActive && level10IntroPhase < levels[currentLevel]?.introDialogue?.length) {
            const message = levels[currentLevel].introDialogue[level10IntroPhase];
            if (message && message.speaker === '???') {
                pingIsTalking = true;
            }
        }

        // Stage 2 intro dialogue (check if current message is Ping)
        if (stage2IntroActive && stage2IntroPhase < stage2IntroMessages.length) {
            if (stage2IntroMessages[stage2IntroPhase].speaker === 'Ping') {
                pingIsTalking = true;
            }
        }

        // Stage 2 choice responses (check if current message is Ping)
        if (stage2ResponseActive && stage2ResponsePhase > 0) {
            const responses = stage2SelectedChoice === 0 ? stage2Choice1Responses :
                             stage2SelectedChoice === 1 ? stage2Choice2Responses :
                             stage2Choice3Responses;
            const responseIndex = stage2ResponsePhase - 1;
            if (responses && responseIndex < responses.length && responses[responseIndex].speaker === 'Ping') {
                pingIsTalking = true;
            }
        }

        player.isTalking = pingIsTalking;

        player.draw();

        // Check key collision
        if (levelKey && !levelKey.collected) {
            levelKey.checkCollision(player);
        }

        // Door blocks player until opened with 'E' key (handled in key events)

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

        // Draw large Ping face in center (creepy close-up)
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
const originalTitle = "Ping's Adventure";
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

    // Draw narrator dialogue box (first phone call)
    if (narratorActive && narratorPhase < narratorMessages.length) {
        const message = narratorMessages[narratorPhase];
        // Draw dialogue - player must press Enter/E to advance
        drawDialogueBox('???', message.text, narratorTimer, 'Narrator', '#4a90d9');
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
            // Draw dialogue - player must press Enter/E to advance
            if (response.speaker === '???') {
                drawDialogueBox(response.speaker, response.text, choiceMessageTimer, 'Narrator', '#4a90d9');
            } else {
                drawDialogueBox(response.speaker, response.text, choiceMessageTimer);
            }
        }
    }

    // Draw Level 8 narrator messages
    if (level8NarratorActive && level8MessagePhase < level8NarratorMessages.length) {
        const message = level8NarratorMessages[level8MessagePhase];
        // Draw dialogue - player must press Enter/E to advance
        drawDialogueBox(message.speaker, message.text, level8MessageTimer);
    }

    // Draw Level 9 narrator messages (key and door tutorial)
    if (level9NarratorActive && level9MessagePhase < level9NarratorMessages.length) {
        const message = level9NarratorMessages[level9MessagePhase];
        // Draw dialogue - player must press Enter/E to advance
        drawDialogueBox(message.speaker, message.text, level9MessageTimer);
    }

    // Draw Level 9 player character dialogue (after narrator leaves)
    if (level9PlayerDialogueActive && level9PlayerPhase < level9PlayerMessages.length) {
        const message = level9PlayerMessages[level9PlayerPhase];
        const isLastMessage = level9PlayerPhase === level9PlayerMessages.length - 1;

        // Draw dialogue - player must press Enter/E to advance
        drawDialogueBox(message.speaker, message.text, level9PlayerTimer);

        // On the last message "This place isn't-", phone rings to interrupt (story event)
        if (isLastMessage && level9PlayerTimer > 50 && !level9SecondCallTriggered) {
            level9SecondCallTriggered = true;
            phoneRinging = true;
            phoneAnswered = false;
            phoneRingTimer = 0;
            // Immediately end player dialogue and show reaction
            level9PlayerDialogueActive = false;
            level9PlayerPhase = level9PlayerMessages.length;
        }
    }

    // Draw player's reaction to phone ring ("Oh crap-!")
    if (level9SecondCallTriggered && phoneRinging && !phoneAnswered && !level9SecondCallActive) {
        // Show the player's startled reaction while phone rings
        drawDialogueBox("???", "Oh crap-!", phoneRingTimer);
    }

    // Draw Level 9 narrator return messages (second call)
    if (level9SecondCallActive && level9SecondPhase < level9NarratorReturnMessages.length) {
        const message = level9NarratorReturnMessages[level9SecondPhase];
        // Draw dialogue - player must press Enter/E to advance
        drawDialogueBox(message.speaker, message.text, level9SecondTimer);
    }

    // Draw Level 9 choice selection (3 options)
    if (level9ChoiceActive && level9ChoiceResponsePhase === 0) {
        drawLevel9Choices();
    }

    // Draw Level 9 choice responses
    if (level9ChoiceResponsePhase > 0) {
        const responses = level9SelectedChoice === 0 ? level9Choice1Responses :
                         level9SelectedChoice === 1 ? level9Choice2Responses :
                         level9Choice3Responses;

        if (level9ChoiceResponsePhase <= responses.length) {
            const response = responses[level9ChoiceResponsePhase - 1];
            // Draw dialogue - player must press Enter/E to advance
            drawDialogueBox(response.speaker, response.text, level9ChoiceResponseTimer);
        }
    }

    // Draw Level 10 intro dialogue
    const level = levels[currentLevel];
    if (level && level.isOfficeLevel && level10IntroActive) {
        const introMessages = level.introDialogue;
        if (level10IntroPhase < introMessages.length) {
            const message = introMessages[level10IntroPhase];
            // Draw dialogue - player must press Enter/E to advance
            drawDialogueBox(message.speaker, message.text, level10IntroTimer);
        }
    }

    // Draw Stage 2 Ping intro dialogue
    if (stage2IntroActive && stage2IntroPhase < stage2IntroMessages.length) {
        const message = stage2IntroMessages[stage2IntroPhase];
        drawDialogueBox(message.speaker, message.text, stage2IntroTimer);
    }

    // Draw Stage 2 choice selection (4 options, show remaining)
    if (stage2ChoiceActive) {
        drawStage2Choices();
    }

    // Draw Stage 2 choice responses
    if (stage2ResponseActive && stage2ResponsePhase > 0) {
        const responses = stage2SelectedChoice === 0 ? stage2Choice1Responses :
                         stage2SelectedChoice === 1 ? stage2Choice2Responses :
                         stage2Choice3Responses;

        if (stage2ResponsePhase <= responses.length) {
            const response = responses[stage2ResponsePhase - 1];
            drawDialogueBox(response.speaker, response.text, stage2ResponseTimer);
        }
    }

    // Draw Stage 2 landing confused chatter
    if (stage2LandingActive && stage2LandingPhase < stage2LandingMessages.length) {
        const message = stage2LandingMessages[stage2LandingPhase];
        drawDialogueBox(message.speaker, message.text, stage2LandingTimer);
    }

    // Draw Level 8 Stage 2 alarm sequence effects
    if (stage2AlarmActive) {
        // Flashing red lights overlay
        const flashIntensity = Math.sin(stage2RedFlashTimer * 0.15) * 0.5 + 0.5;
        ctx.fillStyle = `rgba(255, 0, 0, ${flashIntensity * 0.3})`;
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Countdown display
        if (stage2Countdown > 0) {
            ctx.fillStyle = '#ff0000';
            ctx.font = 'bold 72px "Segoe UI", sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText(stage2Countdown.toString(), canvas.width / 2, canvas.height / 2 - 80);
            ctx.textAlign = 'left';
        }

        // Draw chaser entity (office sprite)
        if (stage2ChaserActive && stage2Chaser) {
            // Body (dark office suit)
            ctx.fillStyle = '#1a1a2e';
            ctx.fillRect(stage2Chaser.x, stage2Chaser.y, stage2Chaser.width, stage2Chaser.height);

            // Head
            ctx.fillStyle = '#d4a574';
            ctx.fillRect(stage2Chaser.x + 5, stage2Chaser.y - 15, 20, 20);

            // Angry eyes
            ctx.fillStyle = '#ff0000';
            ctx.fillRect(stage2Chaser.x + 8, stage2Chaser.y - 10, 5, 4);
            ctx.fillRect(stage2Chaser.x + 17, stage2Chaser.y - 10, 5, 4);
        }
    }

    // Draw caught/faint effect
    if (stage2CaughtActive) {
        // Draw faint animation - player collapses
        if (stage2FaintPhase === 0) {
            // Wobble and collapse animation
            const wobbleAmount = Math.sin(stage2CaughtTimer * 0.5) * 10;
            const collapseProgress = Math.min(stage2CaughtTimer / 60, 1);

            ctx.save();
            ctx.translate(player.x + player.width / 2, player.y + player.height);
            ctx.rotate((wobbleAmount + collapseProgress * 90) * Math.PI / 180);

            // Draw collapsed player (Ping)
            ctx.fillStyle = '#e94560';
            ctx.fillRect(-player.width / 2, -player.height, player.width, player.height);

            // Eye (closing as fainting)
            const eyeOpen = 1 - collapseProgress;
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(-player.width / 2 + 15, -player.height + 8, 10, 6 * eyeOpen);
            if (eyeOpen > 0.1) {
                ctx.fillStyle = '#1a1a2e';
                ctx.fillRect(-player.width / 2 + 18, -player.height + 9, 4, 3 * eyeOpen);
            }

            ctx.restore();
        }

        // Fade to black overlay
        if (stage2FadeToBlack > 0) {
            ctx.fillStyle = `rgba(0, 0, 0, ${stage2FadeToBlack})`;
            ctx.fillRect(0, 0, canvas.width, canvas.height);
        }
    }

    // Draw Level 10 peek view (overlays everything)
    // Player must press Enter/E to advance peek dialogue
    if (isPeeking && currentPeekPoint) {
        currentPeekPoint.drawPeekView(ctx, peekDialoguePhase, peekDialogueTimer);
    }
}

// Draw Level 9 three-choice dialogue
function drawLevel9Choices() {
    const boxWidth = 600;
    const boxHeight = 140;
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

    // Title
    ctx.fillStyle = '#888888';
    ctx.font = 'bold 14px "Segoe UI", sans-serif';
    ctx.fillText('Choose your response:', boxX + 20, boxY + 25);

    // Draw choices
    for (let i = 0; i < level9Choices.length; i++) {
        const choice = level9Choices[i];
        const choiceY = boxY + 50 + (i * 28);
        const isSelected = i === level9SelectedChoice;

        // Selection indicator
        if (isSelected) {
            ctx.fillStyle = 'rgba(233, 69, 96, 0.3)';
            ctx.fillRect(boxX + 15, choiceY - 18, boxWidth - 30, 26);
        }

        // Choice text
        ctx.fillStyle = isSelected ? '#e94560' : '#ffffff';
        ctx.font = isSelected ? 'bold 16px "Segoe UI", sans-serif' : '16px "Segoe UI", sans-serif';
        ctx.fillText(`${choice.key}. ${choice.text}`, boxX + 25, choiceY);
    }

    // Instructions
    ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
    ctx.font = '12px "Segoe UI", sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText('Use 1/2/3 or Arrow keys, Enter to select', boxX + boxWidth - 15, boxY + boxHeight - 8);
    ctx.textAlign = 'left';
}

// Draw Stage 2 four-choice dialogue (with used choices grayed out)
function drawStage2Choices() {
    const boxWidth = 620;
    const boxHeight = 170;
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

    // Title
    ctx.fillStyle = '#888888';
    ctx.font = 'bold 14px "Segoe UI", sans-serif';
    ctx.fillText('Choose your response:', boxX + 20, boxY + 25);

    // Count remaining choices
    const remainingCount = stage2ChoicesUsed.filter(used => !used).length;

    // Draw choices
    for (let i = 0; i < stage2Choices.length; i++) {
        const choice = stage2Choices[i];
        const choiceY = boxY + 50 + (i * 28);
        const isUsed = stage2ChoicesUsed[i];
        const isSelected = i === stage2SelectedChoice;

        // Selection indicator (only for unused choices)
        if (isSelected && !isUsed) {
            ctx.fillStyle = 'rgba(233, 69, 96, 0.3)';
            ctx.fillRect(boxX + 15, choiceY - 18, boxWidth - 30, 26);
        }

        // Choice text
        if (isUsed) {
            ctx.fillStyle = '#444444'; // Gray out used choices
            ctx.font = '16px "Segoe UI", sans-serif';
            ctx.fillText(`${choice.key}. ${choice.text} ✓`, boxX + 25, choiceY);
        } else {
            ctx.fillStyle = isSelected ? '#e94560' : '#ffffff';
            ctx.font = isSelected ? 'bold 16px "Segoe UI", sans-serif' : '16px "Segoe UI", sans-serif';
            ctx.fillText(`${choice.key}. ${choice.text}`, boxX + 25, choiceY);
        }
    }

    // Instructions
    ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
    ctx.font = '12px "Segoe UI", sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText(`${remainingCount} remaining - Use 1/2/3/4 or Arrow keys, Enter to select`, boxX + boxWidth - 15, boxY + boxHeight - 8);
    ctx.textAlign = 'left';
}

function drawDialogueBox(speaker, text, timeInMessage, voiceOverride = null, colorOverride = null) {
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

    // Speaker label (with optional color override)
    ctx.fillStyle = colorOverride || (speaker === 'Narrator' ? '#4a90d9' : '#e94560');
    ctx.font = 'bold 14px "Segoe UI", sans-serif';
    ctx.fillText(speaker, boxX + 20, boxY + 22);

    // Typewriter effect for the message
    const charsToShow = Math.floor(timeInMessage / 2); // Slightly faster typing
    const displayText = text.substring(0, charsToShow);

    // Play sound for each new character (different voice per speaker, with optional override)
    if (charsToShow > 0 && charsToShow <= text.length && timeInMessage % 3 === 1) {
        sound.playNarratorVoice(voiceOverride || speaker);
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

    // "Press Enter/E to continue" hint (shown when text is complete)
    if (charsToShow >= text.length) {
        ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
        ctx.font = '12px "Segoe UI", sans-serif';
        ctx.textAlign = 'right';
        ctx.fillText('Press Enter/E to continue', boxX + boxWidth - 15, boxY + boxHeight - 8);
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

// Helper function to advance dialogue (used by Enter and E keys)
function advanceDialogue() {
    if (gameState !== 'playing') return false;

    if (narratorActive) {
        narratorPhase++;
        narratorTimer = 0;
        if (narratorPhase >= narratorMessages.length) {
            narratorActive = false;
            dialogueChoiceActive = true;
            selectedChoice = 0;
        }
        return true;
    } else if (choiceMessagePhase > 0) {
        const responses = selectedChoice === 0 ? choice1Responses : choice2Responses;
        choiceMessagePhase++;
        choiceMessageTimer = 0;
        if (choiceMessagePhase > responses.length) {
            choiceMessagePhase = 0;
            dialogueChoiceActive = false;
        }
        return true;
    } else if (level8NarratorActive) {
        level8MessagePhase++;
        level8MessageTimer = 0;
        if (level8MessagePhase >= level8NarratorMessages.length) {
            level8NarratorActive = false;
        }
        return true;
    } else if (level9NarratorActive) {
        level9MessagePhase++;
        level9MessageTimer = 0;
        if (level9MessagePhase >= level9NarratorMessages.length) {
            level9NarratorActive = false;
            level9PlayerDialogueActive = true;
            level9PlayerPhase = 0;
            level9PlayerTimer = 0;
        }
        return true;
    } else if (level9PlayerDialogueActive) {
        level9PlayerPhase++;
        level9PlayerTimer = 0;
        if (level9PlayerPhase >= level9PlayerMessages.length) {
            level9PlayerDialogueActive = false;
        }
        return true;
    } else if (level9SecondCallActive) {
        level9SecondPhase++;
        level9SecondTimer = 0;
        if (level9SecondPhase >= level9NarratorReturnMessages.length) {
            level9SecondCallActive = false;
            level9ChoiceActive = true;
            level9SelectedChoice = 0;
        }
        return true;
    } else if (level9ChoiceResponsePhase > 0) {
        const responses = level9SelectedChoice === 0 ? level9Choice1Responses :
                         level9SelectedChoice === 1 ? level9Choice2Responses :
                         level9Choice3Responses;
        level9ChoiceResponsePhase++;
        level9ChoiceResponseTimer = 0;
        if (level9ChoiceResponsePhase > responses.length) {
            level9ChoiceResponsePhase = 0;
            level9ChoiceActive = false;
        }
        return true;
    } else if (level10IntroActive) {
        const level = levels[currentLevel];
        if (level && level.introDialogue) {
            level10IntroPhase++;
            level10IntroTimer = 0;
            if (level10IntroPhase >= level.introDialogue.length) {
                level10IntroActive = false;
            }
        }
        return true;
    } else if (stage2IntroActive) {
        stage2IntroPhase++;
        stage2IntroTimer = 0;
        if (stage2IntroPhase >= stage2IntroMessages.length) {
            stage2IntroActive = false;
            stage2ChoiceActive = true;
            stage2SelectedChoice = 0;
            // Find first unused choice
            for (let i = 0; i < 3; i++) {
                if (!stage2ChoicesUsed[i]) {
                    stage2SelectedChoice = i;
                    break;
                }
            }
        }
        return true;
    } else if (stage2ResponseActive) {
        const responses = stage2SelectedChoice === 0 ? stage2Choice1Responses :
                         stage2SelectedChoice === 1 ? stage2Choice2Responses :
                         stage2Choice3Responses;
        stage2ResponsePhase++;
        stage2ResponseTimer = 0;
        if (stage2ResponsePhase > responses.length) {
            stage2ResponsePhase = 0;
            stage2ResponseActive = false;
            // Check if all choices have been used
            const allUsed = stage2ChoicesUsed.every(used => used);
            if (allUsed) {
                // Dialogue complete, player can continue
                stage2ChoiceActive = false;
            } else {
                // Show choices again
                stage2ChoiceActive = true;
                // Find first unused choice
                for (let i = 0; i < 3; i++) {
                    if (!stage2ChoicesUsed[i]) {
                        stage2SelectedChoice = i;
                        break;
                    }
                }
            }
        }
        return true;
    } else if (stage2LandingActive) {
        stage2LandingPhase++;
        stage2LandingTimer = 0;
        if (stage2LandingPhase >= stage2LandingMessages.length) {
            stage2LandingActive = false;
            // Trigger alarm sequence
            stage2AlarmActive = true;
            stage2AlarmTimer = 0;
            stage2Countdown = 10;
            sound.playAlarm();
        }
        return true;
    } else if (isPeeking && currentPeekPoint) {
        if (peekDialoguePhase < currentPeekPoint.dialogue.length) {
            peekDialoguePhase++;
            peekDialogueTimer = 0;
        } else {
            // Mark this vent as viewed (for Stage 1 Ping dialogue tracking)
            const level = levels[currentLevel];
            if (level && level.isOfficeLevel && currentStage === 1 && currentPeekPoint.id) {
                stage2VentsViewed[currentPeekPoint.id] = true;

                // Check if all Stage 1 vents have been viewed
                if (level.stage1 && level.stage1.ventPeeks && !stage2IntroTriggered) {
                    const allViewed = level.stage1.ventPeeks.every(vp => stage2VentsViewed[vp.id]);
                    if (allViewed) {
                        // Trigger the Ping dialogue
                        stage2IntroTriggered = true;
                        stage2IntroActive = true;
                        stage2IntroPhase = 0;
                        stage2IntroTimer = 0;
                    }
                }
            }

            isPeeking = false;
            currentPeekPoint = null;
        }
        return true;
    }
    return false;
}

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
            // First, try to advance dialogue
            if (advanceDialogue()) break;

            // Answer the phone
            if (phoneRinging && !phoneAnswered && gameState === 'playing') {
                phoneAnswered = true;
                phoneRinging = false;

                // Check which level's phone call this is
                if (currentLevel === 5 && level8PhoneTriggered) {
                    // Level 8 phone call
                    level8NarratorActive = true;
                    level8MessagePhase = 0;
                    level8MessageTimer = 0;
                } else if (currentLevel === 6 && level9SecondCallTriggered && !level9NarratorActive) {
                    // Level 9 second phone call (narrator returns)
                    level9SecondCallActive = true;
                    level9SecondPhase = 0;
                    level9SecondTimer = 0;
                } else if (currentLevel === 6 && level9IntroTriggered) {
                    // Level 9 first phone call
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
            // Level 10 - Vent interactions
            else if (gameState === 'playing' && levels[currentLevel] && levels[currentLevel].isOfficeLevel) {
                // Exit peek view
                if (isPeeking) {
                    isPeeking = false;
                    currentPeekPoint = null;
                    peekDialoguePhase = 0;
                    peekDialogueTimer = 0;
                }
                // Enter vent (from initial office view)
                else if (!isInVent && !level10IntroActive && player.x < 100 && player.y > 400) {
                    isInVent = true;
                    // Load vent platforms
                    const level = levels[currentLevel];
                    platforms = level.ventPlatforms.map(p =>
                        new Platform(p.x, p.y, p.w, p.h, '#2a2a2a', false)
                    );
                    // Create door in vent (for office levels)
                    if (level.hasDoor && level.doorPosition) {
                        const doorState = level.doorUnlocked ? 'unlocked' : 'locked';
                        levelDoor = new Door(level.doorPosition.x, level.doorPosition.y, doorState);
                    }
                    // Reset Stage 1 vent tracking (Ping dialogue triggers after all vents viewed)
                    stage2VentsViewed = {};
                    stage2IntroTriggered = false;
                    stage2IntroActive = false;
                    stage2ChoiceActive = false;
                    stage2ResponseActive = false;
                    stage2ChoicesUsed = [false, false, false];

                    player.x = 50;
                    player.y = 480;
                }
                // Peek through vent grate
                else if (isInVent) {
                    for (const vp of ventPeekPoints) {
                        if (vp.isPlayerNear(player)) {
                            isPeeking = true;
                            currentPeekPoint = vp;
                            peekDialoguePhase = 0;
                            peekDialogueTimer = 0;
                            break;
                        }
                    }
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
                // First check if we're peeking - exit peek view
                if (isPeeking) {
                    isPeeking = false;
                    currentPeekPoint = null;
                    peekDialoguePhase = 0;
                    peekDialogueTimer = 0;
                } else {
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
            }
            break;
        case 'enter':
            // Advance dialogue (uses helper function)
            advanceDialogue();
            break;
        // Arrow keys for dialogue choice selection
        case 'arrowup':
            if (dialogueChoiceActive && choiceMessagePhase === 0) {
                selectedChoice = 0;
                e.preventDefault();
            } else if (level9ChoiceActive && level9ChoiceResponsePhase === 0) {
                level9SelectedChoice = Math.max(0, level9SelectedChoice - 1);
                e.preventDefault();
            } else if (stage2ChoiceActive && !stage2ResponseActive) {
                // Find previous unused choice
                for (let i = stage2SelectedChoice - 1; i >= 0; i--) {
                    if (!stage2ChoicesUsed[i]) {
                        stage2SelectedChoice = i;
                        break;
                    }
                }
                e.preventDefault();
            }
            break;
        case 'arrowdown':
            if (dialogueChoiceActive && choiceMessagePhase === 0) {
                selectedChoice = 1;
                e.preventDefault();
            } else if (level9ChoiceActive && level9ChoiceResponsePhase === 0) {
                level9SelectedChoice = Math.min(2, level9SelectedChoice + 1);
                e.preventDefault();
            } else if (stage2ChoiceActive && !stage2ResponseActive) {
                // Find next unused choice
                for (let i = stage2SelectedChoice + 1; i < 3; i++) {
                    if (!stage2ChoicesUsed[i]) {
                        stage2SelectedChoice = i;
                        break;
                    }
                }
                e.preventDefault();
            }
            break;
        case 'enter':
            // Confirm dialogue choice
            if (dialogueChoiceActive && choiceMessagePhase === 0) {
                choiceMessagePhase = 1;
                choiceMessageTimer = 0;
                e.preventDefault();
            } else if (level9ChoiceActive && level9ChoiceResponsePhase === 0) {
                level9ChoiceResponsePhase = 1;
                level9ChoiceResponseTimer = 0;
                e.preventDefault();
            } else if (stage2ChoiceActive && !stage2ResponseActive && !stage2ChoicesUsed[stage2SelectedChoice]) {
                // Select this choice
                stage2ChoicesUsed[stage2SelectedChoice] = true;
                stage2ResponseActive = true;
                stage2ResponsePhase = 1;
                stage2ResponseTimer = 0;
                e.preventDefault();
            }
            break;
        // Number keys - dialogue choices take priority, then level select
        case '1':
            if (dialogueChoiceActive && choiceMessagePhase === 0) {
                selectedChoice = 0;
                choiceMessagePhase = 1;
                choiceMessageTimer = 0;
            } else if (level9ChoiceActive && level9ChoiceResponsePhase === 0) {
                level9SelectedChoice = 0;
                level9ChoiceResponsePhase = 1;
                level9ChoiceResponseTimer = 0;
            } else if (stage2ChoiceActive && !stage2ResponseActive && !stage2ChoicesUsed[0]) {
                stage2SelectedChoice = 0;
                stage2ChoicesUsed[0] = true;
                stage2ResponseActive = true;
                stage2ResponsePhase = 1;
                stage2ResponseTimer = 0;
            } else if (gameState === 'playing' && !dialogueChoiceActive && !level9ChoiceActive && !stage2ChoiceActive) {
                currentLevel = 0;
                loadLevel(currentLevel);
            }
            break;
        case '2':
            if (dialogueChoiceActive && choiceMessagePhase === 0) {
                selectedChoice = 1;
                choiceMessagePhase = 1;
                choiceMessageTimer = 0;
            } else if (level9ChoiceActive && level9ChoiceResponsePhase === 0) {
                level9SelectedChoice = 1;
                level9ChoiceResponsePhase = 1;
                level9ChoiceResponseTimer = 0;
            } else if (stage2ChoiceActive && !stage2ResponseActive && !stage2ChoicesUsed[1]) {
                stage2SelectedChoice = 1;
                stage2ChoicesUsed[1] = true;
                stage2ResponseActive = true;
                stage2ResponsePhase = 1;
                stage2ResponseTimer = 0;
            } else if (gameState === 'playing' && !dialogueChoiceActive && !level9ChoiceActive && !stage2ChoiceActive) {
                currentLevel = 1;
                loadLevel(currentLevel);
            }
            break;
        case '3':
            if (level9ChoiceActive && level9ChoiceResponsePhase === 0) {
                level9SelectedChoice = 2;
                level9ChoiceResponsePhase = 1;
                level9ChoiceResponseTimer = 0;
            } else if (stage2ChoiceActive && !stage2ResponseActive && !stage2ChoicesUsed[2]) {
                stage2SelectedChoice = 2;
                stage2ChoicesUsed[2] = true;
                stage2ResponseActive = true;
                stage2ResponsePhase = 1;
                stage2ResponseTimer = 0;
            } else if (gameState === 'playing' && !dialogueChoiceActive && !level9ChoiceActive && !stage2ChoiceActive) {
                currentLevel = 2;
                loadLevel(currentLevel);
            }
            break;
        case '4':
            if (gameState === 'playing' && !dialogueChoiceActive && !level9ChoiceActive && !stage2ChoiceActive) {
                currentLevel = 3;
                loadLevel(currentLevel);
            }
            break;
        case '5':
        case '6':
        case '7':
        case '8':
        case '9':
            if (gameState === 'playing' && !dialogueChoiceActive && !level9ChoiceActive && !stage2ChoiceActive) {
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
console.log('Ping\'s Adventure - Game Started!');
gameLoop();
