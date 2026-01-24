/* ================= ANALYTICS ENGINE ================= */
let controlsBound = false;

// Persistent per device
let visitorId = localStorage.getItem("visitorId");
if (!visitorId) {
  visitorId = crypto.randomUUID();
  localStorage.setItem("visitorId", visitorId);
}

// Per tab/session
const sessionId = crypto.randomUUID();
const pageInstanceId = crypto.randomUUID();
const pageLoadTime = Date.now();

const ANALYTICS_ENDPOINT = "/api/analytics/track";
const referrer = document.referrer || "direct";
const userAgent = navigator.userAgent;
const screenInfo = {
  w: window.innerWidth,
  h: window.innerHeight,
  dpr: window.devicePixelRatio
};
const pageUrl = window.location.href;
const navEntry = performance.getEntriesByType("navigation")[0];
const entryType = navEntry?.type || "unknown";

function track(event, meta = {}) {
  const payload = {
    visitorId,
    sessionId,
    pageInstanceId,
    referrer,  
    entryType,
    userAgent,
    screen: screenInfo,
    event,
    meta,
    url: pageUrl,
    timestamp: Date.now()
  };

  navigator.sendBeacon
    ? navigator.sendBeacon(
        ANALYTICS_ENDPOINT,
        new Blob([JSON.stringify(payload)], { type: "application/json" })
      )
    : fetch(ANALYTICS_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      }).catch(() => {});
}

// Page lifecycle
track("page_opened");

window.addEventListener("beforeunload", () => {
  track("page_closed", {
    totalTime: Date.now() - pageLoadTime
  });
});

const hasVisitedBefore = localStorage.getItem("hasVisited");
if (hasVisitedBefore) {
  track("revisit");
}
localStorage.setItem("hasVisited", "true");

function sendGiftResponse(payload) {
  fetch("/api/gift/respond", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      visitorId,
      sessionId,
      ...payload
    })
  }).catch(() => {});
}

/* ==================================================== */

// Global state
let currentSection = 0;
let candlesBlown = 0;
let currentPage = 1;
let isScratching = false;
let scratchPercentage = 0;

// Section mapping for progress indicator (updated with minigame)
const sections = [
    'loading-screen',      // 1
    'date-screen',         // 2
    'main-screen',         // 3
    'gallery-screen',      // 4
    'princess-loading',    // 5
    'message-screen',      // 6
    'minigame-screen',     // 7
    'gift-screen',         // 8
    'outro-screen'         // 9
];

// Gallery images (4 photos for collage)
const galleryImages = [
    {
        url: 'assets/images/mankirat.jpg',
        caption: '.'
    },
    {
        url: 'assets/images/rr.jpg',
        caption: '.'
    },
    {
        url: 'assets/images/nn.jpg',
        caption: 'Sorry no more pics'
    },
    {
        url: 'assets/images/sm.png',
        caption: 'Sorry no more pics'
    }
];

const personalMessage = `Hey Mankirat,

Just wanted to wish you a very happy birthday.

I’ve thought about the past, and I know I wasn’t always my best self back then. I’m sorry for that. It was never my intention to make things awkward or uncomfortable.

This isn’t about expectations or revisiting anything just a simple wish for you. I hope this year brings you peace, good health, and moments that genuinely make you happy.

Take care.`;

// Update progress indicator
function updateProgress(sectionIndex) {
    const progressBar = document.getElementById('progress-bar');
    const progressSteps = document.querySelectorAll('.progress-step');
    
    // Update progress bar
    const percentage = ((sectionIndex + 1) / sections.length) * 100;
    progressBar.style.width = percentage + '%';
    
    // Update step indicators
    progressSteps.forEach((step, index) => {
        if (index < sectionIndex) {
            step.classList.add('completed');
            step.classList.remove('active');
        } else if (index === sectionIndex) {
            step.classList.add('active');
            step.classList.remove('completed');
        } else {
            step.classList.remove('active', 'completed');
        }
    });
}

// Show navigation toast
function showToast(message) {
    const toast = document.getElementById('nav-toast');
    const toastMessage = document.getElementById('toast-message');
    toastMessage.textContent = message;
    toast.classList.add('show');
    
    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}

function showSection(sectionId) {
    const currentActive = document.querySelector('.section.active');
    
    if (currentActive) {
        // GSAP fade out current section
        gsap.to(currentActive, {
            opacity: 0,
            duration: 0.3,
            onComplete: () => {
                currentActive.classList.remove('active');
                
                const newSection = document.getElementById(sectionId);
                newSection.classList.add('active');
                
                // GSAP fade in new section
                gsap.fromTo(newSection, 
                    { opacity: 0, y: 20 },
                    { opacity: 1, y: 0, duration: 0.8, ease: "power2.out" }
                );
                
                // Trigger section-specific animations
                triggerSectionAnimations(sectionId);
                
                // Update progress
                const sectionIndex = sections.indexOf(sectionId);
                if (sectionIndex !== -1) {
                    updateProgress(sectionIndex);
                }
            }
        });
    } else {
        const newSection = document.getElementById(sectionId);
        newSection.classList.add('active');
        
        gsap.fromTo(newSection, 
            { opacity: 0, y: 20 },
            { opacity: 1, y: 0, duration: 0.8, ease: "power2.out" }
        );
        
        triggerSectionAnimations(sectionId);
        
        const sectionIndex = sections.indexOf(sectionId);
        if (sectionIndex !== -1) {
            updateProgress(sectionIndex);
        }
    }
}

// Trigger section-specific GSAP animations
function triggerSectionAnimations(sectionId) {
    switch(sectionId) {
        case 'loading-screen':
            animateGiftBox();
            break;
        case 'date-screen':
            animateDateReveal();
            break;
        case 'main-screen':
            animateBirthdayTitle();
            break;
        case 'gallery-screen':
            animateCollage();
            break;
        case 'princess-screen':
            animatePrincessMirror();
            break;
        case 'message-screen':
            // Typewriter handles its own animation
            break;
        case 'minigame-screen':
            initMiniGame();
            break;
    }
}

// GSAP Animations for different sections
function animateGiftBox() {
    const giftBox = document.querySelector('.gift-box');
    const loadingText = document.querySelector('.loading-text');
    const openBtn = document.querySelector('.open-btn');
    
    gsap.fromTo(giftBox,
        { scale: 0, rotation: -180 },
        { scale: 1, rotation: 0, duration: 1, ease: "elastic.out(1, 0.5)" }
    );
    
    gsap.fromTo(loadingText,
        { opacity: 0, y: 30 },
        { opacity: 1, y: 0, duration: 0.8, delay: 0.5 }
    );
    
    gsap.fromTo(openBtn,
        { opacity: 0, scale: 0.5 },
        { opacity: 1, scale: 1, duration: 0.6, delay: 1, ease: "back.out(1.7)" }
    );
}

function animateDateReveal() {
    const dateText = document.querySelector('.date-text');
    const specialText = document.querySelector('.special-text');
    const sparkles = document.querySelectorAll('.sparkle');
    
    gsap.fromTo(dateText,
        { scale: 0, rotation: 360 },
        { scale: 1, rotation: 0, duration: 1.2, ease: "back.out(1.7)" }
    );
    
    gsap.fromTo(specialText,
        { opacity: 0, y: 20 },
        { opacity: 1, y: 0, duration: 0.8, delay: 0.6 }
    );
    
    sparkles.forEach((sparkle, index) => {
        gsap.fromTo(sparkle,
            { scale: 0, rotation: 0 },
            { 
                scale: 1, 
                rotation: 360, 
                duration: 0.8, 
                delay: 0.3 + index * 0.1,
                ease: "back.out(1.7)"
            }
        );
    });
}

function animateBirthdayTitle() {
    const birthdayTitle = document.querySelector('.birthday-title');
    const nameTitle = document.querySelector('.name-title');
    const photoFrame = document.querySelector('.photo-frame');
    const cake = document.querySelector('.cake');
    
    gsap.fromTo(birthdayTitle,
        { opacity: 0, y: -50 },
        { opacity: 1, y: 0, duration: 1, ease: "power3.out" }
    );
    
    gsap.fromTo(nameTitle,
        { opacity: 0, scale: 0.5 },
        { opacity: 1, scale: 1, duration: 1, delay: 0.3, ease: "elastic.out(1, 0.5)" }
    );
    
    gsap.fromTo(photoFrame,
        { opacity: 0, scale: 0, rotation: -180 },
        { opacity: 1, scale: 1, rotation: 0, duration: 1.2, delay: 0.6, ease: "back.out(1.7)" }
    );
    
    gsap.fromTo(cake,
        { opacity: 0, y: 100 },
        { opacity: 1, y: 0, duration: 1, delay: 1, ease: "bounce.out" }
    );
}

function animateCollage() {
    const photos = document.querySelectorAll('.collage-photo');
    
    // Animate photos gathering from edges to center
    photos.forEach((photo, index) => {
        const angle = (index / photos.length) * Math.PI * 2;
        const distance = 800;
        const startX = Math.cos(angle) * distance;
        const startY = Math.sin(angle) * distance;
        const startRotation = Math.random() * 720 - 360;
        
        gsap.fromTo(photo,
            {
                x: startX,
                y: startY,
                scale: 0,
                rotation: startRotation,
                opacity: 0
            },
            {
                x: 0,
                y: 0,
                scale: 1,
                rotation: 0,
                opacity: 1,
                duration: 1.5,
                delay: index * 0.2,
                ease: "power3.out"
            }
        );
    });
}

function animatePrincessMirror() {
    const mirrorBorder = document.querySelector('.mirror-border');
    const mirrorOverlay = document.querySelector('.mirror-overlay');
    const caption = document.querySelector('.princess-caption');
    
    gsap.fromTo(mirrorBorder,
        { scale: 0, rotation: 180 },
        { scale: 1, rotation: 0, duration: 1.5, ease: "elastic.out(1, 0.5)" }
    );
    
    // Crown appears after border
    gsap.fromTo(mirrorOverlay,
        { opacity: 0, scale: 0, rotation: -360 },
        { 
            opacity: 0.9, 
            scale: 1, 
            rotation: 0, 
            duration: 1.5, 
            delay: 2,
            ease: "back.out(1.7)"
        }
    );
    
    // Caption appears last
    gsap.fromTo(caption,
        { opacity: 0, y: 30 },
        { opacity: 1, y: 0, duration: 0.8, delay: 4 }
    );
    
    // Show continue button
    setTimeout(() => {
        const continueBtn = document.getElementById('next-from-princess');
        gsap.fromTo(continueBtn,
            { opacity: 0, scale: 0.5 },
            { 
                opacity: 1, 
                scale: 1, 
                duration: 0.6, 
                ease: "back.out(1.7)",
                onStart: () => {
                    continueBtn.style.display = 'inline-block';
                }
            }
        );
    }, 6000);
}


// Initial popup auto-dismiss
window.addEventListener('load', () => {
    setTimeout(() => {
        document.getElementById('initial-popup').classList.remove('active');
        document.getElementById('loading-screen').classList.add('active');
        updateProgress(0);
        startBalloons();
        animateGiftBox();
    }, 3000);
    
    // Preload gallery images
    galleryImages.forEach(img => {
        const image = new Image();
        image.src = img.url;
    });
});

// Start balloon animations
function startBalloons() {
    const balloons = document.querySelectorAll('.balloon');
    balloons.forEach((balloon, index) => {
        balloon.style.setProperty('--random', Math.random());
        setInterval(() => {
            balloon.style.opacity = '0';
            setTimeout(() => {
                balloon.style.left = Math.random() * 90 + 5 + '%';
                balloon.style.opacity = '1';
            }, 100);
        }, 8000 + index * 2000);
    });
}

function stopBalloons() {
    document.querySelectorAll('.balloon').forEach(balloon => {
        balloon.style.animationPlayState = 'paused';
        balloon.style.opacity = '0';
    });
}

function resumeBalloons() {
    document.querySelectorAll('.balloon').forEach(balloon => {
        balloon.style.animationPlayState = 'running';
        balloon.style.opacity = '1';
    });
}

// Loading Screen
document.getElementById('open-gift-btn').addEventListener('click', () => {
    showSection('date-screen');
    showToast('🎊 Let\'s celebrate! 🎊');
    
    setTimeout(() => {
        showSection('main-screen');
        showToast('💝 Make a wish and blow the candles! 💝');
    }, 3000);
});

// Candle blowing
const candles = document.querySelectorAll('.candle');
candles.forEach(candle => {
    candle.addEventListener('click', function() {
        if (!this.classList.contains('blown')) {
            this.classList.add('blown');
            candlesBlown++;
            
            // GSAP animation for blown candle
            gsap.to(this, {
                scale: 0.92,
                filter: 'grayscale(0.9) brightness(0.6)',
                duration: 0.4
            });
            
            // Play blow sound effect
            // playBlowSound();
            
            // Add smoke effect
            createSmoke(this);
            
            if (candlesBlown === candles.length) {
                setTimeout(() => {
                    createConfetti();
                    const nextBtn = document.getElementById('next-to-gallery');
                    nextBtn.style.display = 'inline-block';
                    gsap.fromTo(nextBtn,
                        { opacity: 0, scale: 0.5, y: 20 },
                        { opacity: 1, scale: 1, y: 0, duration: 0.6, ease: "back.out(1.7)" }
                    );
                    showToast('🎉 All candles blown! You can continue when ready 🎉');
                }, 500);
            }
        }
    });
});

// Create smoke effect when candle is blown
function createSmoke(candle) {
    const smoke = document.createElement('div');
    smoke.style.position = 'absolute';
    smoke.style.top = '-40px';
    smoke.style.left = '50%';
    smoke.style.transform = 'translateX(-50%)';
    smoke.style.fontSize = '20px';
    smoke.textContent = '💨';
    candle.appendChild(smoke);
    
    gsap.to(smoke, {
        y: -30,
        opacity: 0,
        duration: 1,
        onComplete: () => smoke.remove()
    });
}

// Confetti effect
function createConfetti() {
    const container = document.getElementById('confetti-container');
    const colors = ['#FF69B4', '#FFD700', '#FFED4E', '#FF1493', '#FF8FAB', '#4A90E2'];
    
    for (let i = 0; i < 150; i++) {
        setTimeout(() => {
            const confetti = document.createElement('div');
            confetti.className = 'confetti';
            confetti.style.left = Math.random() * 100 + '%';
            confetti.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
            confetti.style.animationDelay = Math.random() * 0.5 + 's';
            confetti.style.animationDuration = (Math.random() * 2 + 2) + 's';
            container.appendChild(confetti);
            
            setTimeout(() => {
                confetti.remove();
            }, 4000);
        }, i * 30);
    }
}

// Blow sound effect
function playBlowSound() {
    try {
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        oscillator.frequency.value = 400;
        oscillator.type = 'sine';
        
        gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
        
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.3);
    } catch (e) {
        console.log('Audio not supported');
    }
}

// Gallery navigation
document.getElementById('next-to-gallery').addEventListener('click', () => {
    showSection('gallery-screen');
    showToast('📸 Beautiful moments captured 📸');
});

// Princess screen navigation with loading
document.getElementById('next-to-princess').addEventListener('click', () => {
    stopBalloons();
    
    showSection('princess-loading');
    showToast('👑 Loading something special... 👑');
    
    setTimeout(() => {
        showSection('princess-screen');
    }, 3000);
});

// Continue from princess screen
document.getElementById('next-from-princess').addEventListener('click', () => {
    resumeBalloons();
    showSection('message-screen');
    showToast('💌 A note for you 💌');
    
    const el = document.getElementById('typewriter-text');
    el.textContent = '';
    
    typeWriter(personalMessage, 0);
});

// Typewriter effect
function typeWriter(text, index) {
    const element = document.getElementById('typewriter-text');
    
    if (index < text.length) {
        element.textContent += text.charAt(index);
        setTimeout(() => {
            typeWriter(text, index + 1);
        }, 50);
    } else {
        setTimeout(() => {
            const nextBtn = document.getElementById('next-to-minigame');
            nextBtn.style.display = 'inline-block';
            gsap.fromTo(nextBtn,
                { opacity: 0, y: 20 },
                { opacity: 1, y: 0, duration: 0.6 }
            );
            showToast('🎮 Ready for a fun game? 🎮');
        }, 500);
    }
}

// Navigate to minigame
document.getElementById('next-to-minigame').addEventListener('click', () => {
    showSection('minigame-screen');
    showToast('🎁 Catch the gifts before time runs out! 🎁');
});

// ============ MINI GAME: CATCH THE GIFT ============
let gameScore = 0;
let gameTime = 30;
let gameRunning = false;
let gameInterval;
let spawnInterval;
let fallingItems = [];

function initMiniGame() {
    const canvas = document.getElementById('game-canvas');
    const ctx = canvas.getContext('2d');
    
    // Set canvas size
    const containerWidth = Math.min(600, window.innerWidth * 0.95);
    canvas.width = containerWidth;
    canvas.height = 400;
    
    // Game objects
    const bucket = {
        x: canvas.width / 2 - 40,
        y: canvas.height - 60,
        width: 80,
        height: 50,
        speed: 8
    };
    
    const keys = {};
    
    // Reset game state
    gameScore = 0;
    gameTime = 30;
    gameRunning = true;
    fallingItems = [];
    
    document.getElementById('game-score').textContent = gameScore;
    document.getElementById('game-timer').textContent = gameTime;
    document.getElementById('game-over').style.display = 'none';
    
    // Spawn falling items
    spawnInterval = setInterval(() => {
        if (!gameRunning) return;
        
        const rand = Math.random();

        let itemType = "gift";
        let emoji = "🎁";

        if (rand < 0.2) {
            itemType = "bomb";
            emoji = "💣";
        } else if (rand < 0.45) {
            itemType = "balloon";
            emoji = "🎈";
        }

        const item = {
            x: Math.random() * (canvas.width - 30),
            y: -30,
            width: 30,
            height: 30,
            speed: itemType === "bomb" ? 4 : 2 + Math.random() * 2,
            emoji,
            type: itemType
        };

        fallingItems.push(item);
    }, 800);
    
    // Game timer
    gameInterval = setInterval(() => {
        if (!gameRunning) return;
        
        gameTime--;
        document.getElementById('game-timer').textContent = gameTime;
        
        if (gameTime <= 0) {
            gameOver();
        }
    }, 1000);
    
    // Input handling
    if (!controlsBound) {
        window.addEventListener('keydown', e => keys[e.key] = true);
        window.addEventListener('keyup', e => keys[e.key] = false);
        controlsBound = true;
    }

    
    // Touch controls for mobile
    let touchStartX = 0;
    canvas.addEventListener('touchstart', (e) => {
        touchStartX = e.touches[0].clientX;
    });
    
    canvas.addEventListener('touchmove', (e) => {
        e.preventDefault();
        const touchX = e.touches[0].clientX;
        const diff = touchX - touchStartX;
        bucket.x += diff * 0.5;
        touchStartX = touchX;
        
        // Keep bucket in bounds
        bucket.x = Math.max(0, Math.min(canvas.width - bucket.width, bucket.x));
    });
    
    // Game loop
    function gameLoop() {
        if (!gameRunning) return;
        
        // Clear canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // Update bucket position
        if (keys['ArrowLeft'] || keys['a'] || keys['A']) {
            bucket.x -= bucket.speed;
        }
        if (keys['ArrowRight'] || keys['d'] || keys['D']) {
            bucket.x += bucket.speed;
        }
        
        // Keep bucket in bounds
        bucket.x = Math.max(0, Math.min(canvas.width - bucket.width, bucket.x));
        
        // Draw bucket
        ctx.font = '50px Arial';
        ctx.fillText('🧺', bucket.x, bucket.y + bucket.height);
        
        // Update and draw falling items
        for (let i = fallingItems.length - 1; i >= 0; i--) {
            const item = fallingItems[i];
            item.y += item.speed;
            
            // Draw item
            ctx.font = '30px Arial';
            ctx.fillText(item.emoji, item.x, item.y + item.height);
            
            // Check collision with bucket
            if (item.y + item.height > bucket.y &&
                item.y < bucket.y + bucket.height &&
                item.x + item.width > bucket.x &&
                item.x < bucket.x + bucket.width) {
                
                if (item.type === "bomb") {
                    gameOver("💥 Boom! You caught a bomb");
                    return;
                }

                if (item.type === "gift") {
                    gameScore += 10;
                    document.getElementById('game-score').textContent = gameScore;
                    playCollectSound();
                }
                
                fallingItems.splice(i, 1);
                continue;
            }
            
            // Remove if out of bounds
            if (item.y > canvas.height) {
                fallingItems.splice(i, 1);
            }
        }
        
        requestAnimationFrame(gameLoop);
    }
    
    gameLoop();
}

function gameOver(reason = "⏱ Time’s up!") {
    gameRunning = false;
    clearInterval(gameInterval);
    clearInterval(spawnInterval);

    document.getElementById('final-score').textContent = gameScore;

    const gameOverScreen = document.getElementById('game-over');
    gameOverScreen.querySelector("h3").textContent = reason;
    gameOverScreen.style.display = "flex";

    gsap.fromTo(gameOverScreen,
        { scale: 0, opacity: 0 },
        { scale: 1, opacity: 1, duration: 0.6, ease: "back.out(1.7)" }
    );

    createConfetti();
}

function playCollectSound() {
    try {
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        oscillator.frequency.value = 800;
        oscillator.type = 'sine';
        
        gainNode.gain.setValueAtTime(0.2, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);
        
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.1);
    } catch (e) {
        console.log('Audio not supported');
    }
}

// Continue after game
document.getElementById('continue-after-game').addEventListener('click', () => {
    showSection('gift-screen');
    showToast('✨ Scratch to reveal your surprise! ✨');
    initScratchCard();
});

// Skip game button
document.getElementById('skip-game').addEventListener('click', () => {
    if (gameRunning) {
        gameOver("⏭ Skipped the game");
    }
    showSection('gift-screen');
    showToast('✨ Scratch to reveal your surprise! ✨');
    initScratchCard();
});


// Scratch card
function initScratchCard() {
    const canvas = document.getElementById('scratch-canvas');
    const ctx = canvas.getContext('2d');
    
    // Set canvas size for mobile
    const isMobile = window.innerWidth <= 768;
    if (isMobile) {
        canvas.width = Math.min(350, window.innerWidth * 0.9);
        canvas.height = 250;
    }
    
    // Draw scratch surface with gradient
    const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
    gradient.addColorStop(0, '#9370DB');
    gradient.addColorStop(0.5, '#C0C0C0');
    gradient.addColorStop(1, '#9370DB');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Add text
    ctx.fillStyle = '#333';
    ctx.font = 'bold 30px Playfair Display';
    ctx.textAlign = 'center';
    ctx.fillText('Scratch Here', canvas.width / 2, canvas.height / 2 - 20);
    ctx.font = '20px Playfair Display';
    ctx.fillText('to reveal your gift!', canvas.width / 2, canvas.height / 2 + 20);
    
    // Add sparkles
    ctx.fillStyle = '#FFD700';
    ctx.font = '40px Arial';
    ctx.fillText('✨', 60, 60);
    ctx.fillText('✨', canvas.width - 60, 60);
    ctx.fillText('✨', 60, canvas.height - 40);
    ctx.fillText('✨', canvas.width - 60, canvas.height - 40);
    
    // Scratch functionality
    let isDrawing = false;
    
    function scratch(e) {
        if (!isDrawing) return;
        
        const rect = canvas.getBoundingClientRect();
        let x, y;
        
        if (e.touches) {
            x = e.touches[0].clientX - rect.left;
            y = e.touches[0].clientY - rect.top;
        } else {
            x = e.clientX - rect.left;
            y = e.clientY - rect.top;
        }
        
        ctx.globalCompositeOperation = 'destination-out';
        ctx.beginPath();
        ctx.arc(x, y, 30, 0, Math.PI * 2);
        ctx.fill();
        
        checkScratchPercentage(ctx, canvas);
    }
    
    // Mouse events
    canvas.addEventListener('mousedown', (e) => {
        isDrawing = true;
        scratch(e);
    });
    
    canvas.addEventListener('mousemove', scratch);
    
    canvas.addEventListener('mouseup', () => {
        isDrawing = false;
    });
    
    canvas.addEventListener('mouseleave', () => {
        isDrawing = false;
    });
    
    // Touch events
    canvas.addEventListener('touchstart', (e) => {
        e.preventDefault();
        isDrawing = true;
        scratch(e);
    });
    
    canvas.addEventListener('touchmove', (e) => {
        e.preventDefault();
        scratch(e);
    });
    
    canvas.addEventListener('touchend', () => {
        isDrawing = false;
    });
}

function checkScratchPercentage(ctx, canvas) {
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const pixels = imageData.data;
    let transparent = 0;
    
    for (let i = 3; i < pixels.length; i += 4) {
        if (pixels[i] < 128) {
            transparent++;
        }
    }
    
    const percentage = (transparent / (pixels.length / 4)) * 100;

    if (percentage > 60 && !document.getElementById('gift-modal').classList.contains('active')) {
        const skipBtn = document.getElementById('skip-voucher');
        skipBtn.style.display = 'inline-block';
        gsap.fromTo(skipBtn,
            { opacity: 0, y: 20 },
            { opacity: 1, y: 0, duration: 0.6 }
        );
        
        document.getElementById('gift-modal').classList.add('active');
        createConfetti();
        showToast('🎊 Congratulations! You won! 🎊');
    }
}

// Skip voucher button
document.getElementById('skip-voucher').addEventListener('click', () => {
    showSection('outro-screen');
    showToast('✨ Thank you for being here ✨');
    createConfetti();
});

// Skip modal button
document.getElementById('skip-modal').addEventListener('click', () => {
    document.getElementById('gift-modal').classList.remove('active');
    setTimeout(() => {
        showSection('outro-screen');
        createConfetti();
        showToast('✨ Thank you for being here ✨');
    }, 500);
});

// Form handling
document.getElementById('contact-method').addEventListener('change', function() {
    const emailGroup = document.getElementById('email-group');
    const phoneGroup = document.getElementById('phone-group');
    
    if (this.value === 'email') {
        emailGroup.style.display = 'block';
        phoneGroup.style.display = 'none';
        document.getElementById('email').required = true;
        document.getElementById('phone').required = false;
    } else if (this.value === 'phone') {
        phoneGroup.style.display = 'block';
        emailGroup.style.display = 'none';
        document.getElementById('phone').required = true;
        document.getElementById('email').required = false;
    }
});

document.getElementById('voucher-form').addEventListener('submit', (e) => {
    e.preventDefault();
    
    const voucherType = document.getElementById('voucher-type').value;
    const contactMethod = document.getElementById('contact-method').value;
    const email = document.getElementById('email').value;
    const phone = document.getElementById('phone').value;
    
    const contact = contactMethod === 'email' ? email : phone;
    sendGiftResponse({
        coffeeResponse: "yes",
        coupon: {
            code: voucherType,
            description: `Contact via ${contactMethod}`,
            value: 0,
            contactMethod,
            contact
        }
    });

    alert(`Thanks! If you chose to receive it, the food coupon will be shared with you soon. Take care 🙂`);
    
    document.getElementById('gift-modal').classList.remove('active');
    setTimeout(() => {
        showSection('outro-screen');
        createConfetti();
        showToast('✨ Thank you for being here ✨');
    }, 500);
});

// Replay button
document.getElementById('replay-btn').addEventListener('click', () => {
    // Reset all states
    candlesBlown = 0;
    currentPage = 1;
    scratchPercentage = 0;
    gameScore = 0;
    gameTime = 30;
    gameRunning = false;
    
    // Reset candles
    document.querySelectorAll('.candle').forEach(candle => {
        candle.classList.remove('blown');
        gsap.set(candle, { scale: 1, filter: 'none' });
    });
    
    // Reset typewriter
    document.getElementById('typewriter-text').textContent = '';
    
    // Hide buttons
    document.getElementById('next-to-gallery').style.display = 'none';
    document.getElementById('next-from-princess').style.display = 'none';
    document.getElementById('next-to-minigame').style.display = 'none';
    document.getElementById('skip-voucher').style.display = 'none';
    
    // Reset progress
    updateProgress(0);
    
    // Go back to start
    showSection('loading-screen');
    showToast('🎁 Starting over... 🎁');
});

// Share button
document.getElementById('share-btn').addEventListener('click', async () => {
    const shareData = {
        title: 'Happy Birthday Mankirat! 🎉',
        text: 'Check out this beautiful birthday experience!',
        url: window.location.href
    };
    track("shared", {
        method: navigator.share ? "native" : "copy"
    });

    try {
        if (navigator.share) {
            await navigator.share(shareData);
            showToast('📤 Thanks for sharing! 📤');
        } else {
            await navigator.clipboard.writeText(window.location.href);
            showToast('🔗 Link copied to clipboard! 🔗');
        }
    } catch (err) {
        alert('Share this link:\n' + window.location.href);
    }
});

// Prevent right-click on images
document.addEventListener('contextmenu', (e) => {
    if (e.target.tagName === 'IMG') {
        e.preventDefault();
    }
});

// Handle window resize for scratch canvas
window.addEventListener('resize', () => {
    const canvas = document.getElementById('scratch-canvas');
    if (canvas && window.innerWidth <= 768) {
        const wasActive = document.getElementById('gift-screen').classList.contains('active');
        if (wasActive && !document.getElementById('gift-modal').classList.contains('active')) {
            initScratchCard();
        }
    }
});

// Add smooth scroll behavior
document.documentElement.style.scrollBehavior = 'smooth';

// Easter egg: Double tap on name for extra confetti
let tapCount = 0;
let tapTimer = null;

document.querySelector('.name-title')?.addEventListener('click', function() {
    tapCount++;
    
    if (tapCount === 1) {
        tapTimer = setTimeout(() => {
            tapCount = 0;
        }, 300);
    } else if (tapCount === 2) {
        clearTimeout(tapTimer);
        tapCount = 0;
        createConfetti();
        showToast('🎉 Extra celebration! 🎉');
    }
});

// Disable pinch-to-zoom on mobile for better game experience
document.addEventListener('touchmove', function(event) {
    if (event.scale !== 1) {
        event.preventDefault();
    }
}, { passive: false });

// Performance optimization: Pause animations when tab is not visible
document.addEventListener('visibilitychange', () => {
    const balloons = document.querySelectorAll('.balloon');
    if (document.hidden) {
        balloons.forEach(balloon => {
            balloon.style.animationPlayState = 'paused';
        });
    } else {
        balloons.forEach(balloon => {
            balloon.style.animationPlayState = 'running';
        });
    }
});

console.log('✨ Birthday card loaded successfully! ✨');