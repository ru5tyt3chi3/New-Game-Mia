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
            this.startMusic();
        }
        return this.muted;
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
    constructor(x, y, width, height, color = '#4a90a4') {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.color = color;
    }

    draw() {
        // Main platform body
        ctx.fillStyle = this.color;
        ctx.fillRect(this.x, this.y, this.width, this.height);

        // Top grass/surface layer
        ctx.fillStyle = '#5cb85c';
        ctx.fillRect(this.x, this.y, this.width, 6);

        // Platform edge highlights
        ctx.fillStyle = 'rgba(255,255,255,0.1)';
        ctx.fillRect(this.x, this.y, this.width, 2);

        // Platform bottom shadow
        ctx.fillStyle = 'rgba(0,0,0,0.3)';
        ctx.fillRect(this.x, this.y + this.height - 3, this.width, 3);
    }
}

// ============================================
// Game State
// ============================================
const player = new Player(100, 300);

const platforms = [
    // Ground platform
    new Platform(0, 550, 800, 50, '#3d5a80'),

    // Floating platforms - create a path upward
    new Platform(50, 450, 150, 25, '#3d5a80'),
    new Platform(280, 380, 150, 25, '#3d5a80'),
    new Platform(500, 320, 150, 25, '#3d5a80'),
    new Platform(300, 250, 200, 25, '#3d5a80'),
    new Platform(50, 180, 150, 25, '#3d5a80'),
    new Platform(600, 180, 180, 25, '#3d5a80'),
    new Platform(300, 100, 200, 25, '#3d5a80'),
];

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
    // Clear and draw background
    drawBackground();

    // Update and draw platforms
    for (const platform of platforms) {
        platform.draw();
    }

    // Update and draw player
    player.update(platforms);
    player.draw();

    // Draw UI
    drawUI();

    requestAnimationFrame(gameLoop);
}

function drawUI() {
    ctx.fillStyle = '#ffffff';
    ctx.font = '14px "Segoe UI", sans-serif';
    ctx.fillText('Welcome to Mia\'s Adventure!', 10, 25);

    ctx.fillStyle = '#a0a0a0';
    ctx.font = '12px "Segoe UI", sans-serif';
    ctx.fillText('Jump on the platforms and explore!', 10, 45);

    // Sound status
    ctx.fillStyle = sound.muted ? '#e94560' : '#5cb85c';
    ctx.font = '12px "Segoe UI", sans-serif';
    const soundStatus = sound.muted ? 'MUTED' : 'SOUND ON';
    ctx.fillText(`[M] ${soundStatus}`, canvas.width - 100, 25);
}

// ============================================
// Input Event Listeners
// ============================================
// Initialize sound on first interaction (browser autoplay policy)
let soundInitialized = false;
function initSoundOnInteraction() {
    if (!soundInitialized) {
        sound.init();
        sound.startMusic();
        soundInitialized = true;
    }
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
