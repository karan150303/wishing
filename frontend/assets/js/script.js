function triggerHaptic(pattern) {
    if (navigator.vibrate) {
        navigator.vibrate(pattern);
    }
}

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
        url: 'assets/images/moana_moana.png',
        caption: 'Sorry no more pics'
    }
];

const personalMessage = `Hey Mankirat,

I wanted to wish you a very happy birthday.

I’ve thought about the past, and I realise there were moments I didn’t handle as well as I should have. I’m sorry for that. It was never my intention to make things uncomfortable and awkward.

I’m wishing you well and hoping the year ahead brings you peace, happiness, and good things.

Take care ; )`;


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
let toastTimeout;

function showToast(message) {
    const toast = document.getElementById('nav-toast');
    const toastMessage = document.getElementById('toast-message');

    toastMessage.textContent = message;

    // Reset state
    toast.classList.remove('show');
    clearTimeout(toastTimeout);

    // Force reflow so animation always restarts
    void toast.offsetHeight;

    toast.classList.add('show');

    toastTimeout = setTimeout(() => {
        toast.classList.remove('show');
    }, 2600);
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
            initStarMap();
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
    const birdLeft = document.querySelector('.bird-left');
    const birdRight = document.querySelector('.bird-right');
    const scroll = document.querySelector('.scroll-banner');
    const text = document.querySelector('.scroll-text');
    const specialText = document.querySelector('.special-text');

    gsap.set([birdLeft, birdRight], { y: 0 });

    const tl = gsap.timeline();

    // Birds fly in
    tl.fromTo(birdLeft,
        { x: -200 },
        { x: 120, duration: 1.2, ease: "power3.out" }
    )
    .fromTo(birdRight,
        { x: 200 },
        { x: -120, duration: 1.2, ease: "power3.out" },
        "<"
    )

    // Scroll opens
    .to(scroll, {
        scaleX: 1,
        duration: 0.9,
        ease: "power4.out"
    })

    // Date reveal
    .to(text, {
        opacity: 1,
        duration: 0.5
    })

    // Birds fly away
    .to([birdLeft, birdRight], {
        y: -120,
        opacity: 0,
        duration: 1,
        delay: 0.5,
        ease: "power2.in"
    })

    // Subtitle
    .fromTo(specialText,
        { opacity: 0, y: 20 },
        { opacity: 1, y: 0, duration: 0.8 },
        "-=0.4"
    );
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


window.addEventListener('load', () => {
    
    const initialPopup = document.getElementById('initial-popup');
    let popupClosed = false;
    
    function closePopup() {
        if (popupClosed) return;
        popupClosed = true;
        
        initialPopup.classList.remove('active');
        
        const loading = document.getElementById('loading-screen');
        loading.classList.add('active');
        
        updateProgress(0);
        startBalloons();
        animateGiftBox();
    }
    
    // HARD FAILSAFE — popup always exits after 2 seconds
    const failsafeTimer = setTimeout(() => {
        closePopup();
    }, 3000);
    
    // Multiple ways to close for better mobile support
    initialPopup.addEventListener('click', () => {
        clearTimeout(failsafeTimer);
        closePopup();
    });
    
    initialPopup.addEventListener('touchstart', (e) => {
        e.preventDefault();
        clearTimeout(failsafeTimer);
        closePopup();
    }, { passive: false });
    
    // Also close on any tap/click on the popup content
    const popupContent = initialPopup.querySelector('.popup-content');
    if (popupContent) {
        popupContent.addEventListener('touchend', (e) => {
            e.stopPropagation();
            clearTimeout(failsafeTimer);
            closePopup();
        }, { passive: true });
    }

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
        showToast('Take your time here. Blow all the candles! 🕯️');
    }, 5000);
});

// Candle blowing
const candles = document.querySelectorAll('.candle');
candles.forEach(candle => {
    candle.addEventListener('click', function() {
    if (!this.classList.contains('blown')) {
        this.classList.add('blown');
        candlesBlown++;

        // 🔔 HAPTIC: candle pop (short & crisp)
        triggerHaptic(30);

        // GSAP animation for blown candle
        gsap.to(this, {
            scale: 0.92,
            filter: 'grayscale(0.9) brightness(0.6)',
            duration: 0.4
        });

        createSmoke(this);

        if (candlesBlown === candles.length) {
            setTimeout(() => {

                // 🎉 HAPTIC: celebration (pattern)
                triggerHaptic([60, 40, 60]);

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
    showToast('Loading something special');
    
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
            showToast('We can keep this light for a moment.');
        }, 500);
    }
}

// Navigate to minigame
document.getElementById('next-to-minigame').addEventListener('click', () => {
    showSection('minigame-screen');
    showToast('✨ Just a quiet moment ✨');
});


// ============ INTERACTIVE STAR MAP ============
let stars = [];
let meteors = [];
let galaxies = [];
let starMapRunning = false;

function initStarMap() {
    const canvas = document.getElementById('starmap-canvas');
    const ctx = canvas.getContext('2d');
    
    // Set canvas to fullscreen
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    
    // Reset state
    stars = [];
    meteors = [];
    galaxies = [];
    starMapRunning = true;
    
    // Create way more stars (800 instead of 300)
    for (let i = 0; i < 800; i++) {
        stars.push({
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height,
            radius: Math.random() * 2 + 0.3,
            opacity: Math.random(),
            twinkleSpeed: Math.random() * 0.02 + 0.005,
            brightness: Math.random()
        });
    }
    
    // Create more galaxies (8 instead of 3)
    for (let i = 0; i < 8; i++) {
        galaxies.push({
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height,
            radius: Math.random() * 150 + 80,
            hue: Math.random() * 80 + 180, // Blues and purples
            opacity: Math.random() * 0.15 + 0.08,
            rotation: Math.random() * Math.PI * 2,
            rotationSpeed: (Math.random() - 0.5) * 0.0005
        });
    }
    
    // Spawn meteors periodically
    const meteorInterval = setInterval(() => {
        if (!starMapRunning) {
            clearInterval(meteorInterval);
            return;
        }
        
        if (Math.random() > 0.6) {
            meteors.push({
                x: Math.random() * canvas.width,
                y: -20,
                vx: (Math.random() - 0.5) * 3,
                vy: Math.random() * 4 + 4,
                length: Math.random() * 80 + 50,
                opacity: 1,
                brightness: Math.random() * 0.5 + 0.5
            });
        }
    }, 600);
    
    // Handle window resize
    const handleResize = () => {
        if (!starMapRunning) return;
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        
        // Redistribute stars and galaxies
        stars.forEach(star => {
            if (star.x > canvas.width) star.x = Math.random() * canvas.width;
            if (star.y > canvas.height) star.y = Math.random() * canvas.height;
        });
        
        galaxies.forEach(galaxy => {
            if (galaxy.x > canvas.width) galaxy.x = Math.random() * canvas.width;
            if (galaxy.y > canvas.height) galaxy.y = Math.random() * canvas.height;
        });
    };
    
    window.addEventListener('resize', handleResize);
    
    // Animation loop
    function animate() {
        if (!starMapRunning) return;
        
        // Clear canvas with fade effect for trails
        ctx.fillStyle = 'rgba(2, 3, 8, 0.25)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Draw and animate galaxies
        galaxies.forEach(galaxy => {
            galaxy.rotation += galaxy.rotationSpeed;
            
            // Create spiral galaxy effect
            ctx.save();
            ctx.translate(galaxy.x, galaxy.y);
            ctx.rotate(galaxy.rotation);
            
            // Multiple layers for depth
            for (let layer = 0; layer < 3; layer++) {
                const layerRadius = galaxy.radius * (1 - layer * 0.2);
                const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, layerRadius);
                
                const hueShift = layer * 10;
                gradient.addColorStop(0, `hsla(${galaxy.hue + hueShift}, 80%, 60%, ${galaxy.opacity * 0.8})`);
                gradient.addColorStop(0.3, `hsla(${galaxy.hue + hueShift}, 70%, 50%, ${galaxy.opacity * 0.5})`);
                gradient.addColorStop(0.6, `hsla(${galaxy.hue + hueShift}, 60%, 40%, ${galaxy.opacity * 0.3})`);
                gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
                
                ctx.fillStyle = gradient;
                ctx.fillRect(-layerRadius, -layerRadius, layerRadius * 2, layerRadius * 2);
            }
            
            ctx.restore();
        });
        
        // Draw and update stars with varying brightness
        stars.forEach(star => {
            // Twinkling effect
            star.opacity += star.twinkleSpeed;
            if (star.opacity > 1 || star.opacity < 0.2) {
                star.twinkleSpeed *= -1;
            }
            
            const finalOpacity = star.opacity * star.brightness;
            
            ctx.beginPath();
            ctx.arc(star.x, star.y, star.radius, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(255, 255, 255, ${finalOpacity})`;
            ctx.fill();
            
            // Add glow to brighter stars
            if (star.radius > 1.2 && finalOpacity > 0.6) {
                ctx.shadowBlur = 6;
                ctx.shadowColor = `rgba(255, 255, 255, ${finalOpacity * 0.6})`;
                ctx.fill();
                ctx.shadowBlur = 0;
            }
            
            // Extra bright stars get a cross-flare effect
            if (star.radius > 1.5 && finalOpacity > 0.8) {
                ctx.strokeStyle = `rgba(255, 255, 255, ${finalOpacity * 0.4})`;
                ctx.lineWidth = 0.5;
                ctx.beginPath();
                ctx.moveTo(star.x - 4, star.y);
                ctx.lineTo(star.x + 4, star.y);
                ctx.moveTo(star.x, star.y - 4);
                ctx.lineTo(star.x, star.y + 4);
                ctx.stroke();
            }
        });
        
        // Draw and update meteors
        for (let i = meteors.length - 1; i >= 0; i--) {
            const meteor = meteors[i];
            
            meteor.x += meteor.vx;
            meteor.y += meteor.vy;
            
            // Draw meteor trail with gradient
            const gradient = ctx.createLinearGradient(
                meteor.x, meteor.y,
                meteor.x - meteor.vx * 15, meteor.y - meteor.vy * 15
            );
            gradient.addColorStop(0, `rgba(255, 255, 255, ${meteor.opacity * meteor.brightness})`);
            gradient.addColorStop(0.3, `rgba(255, 220, 150, ${meteor.opacity * meteor.brightness * 0.7})`);
            gradient.addColorStop(0.6, `rgba(255, 200, 100, ${meteor.opacity * meteor.brightness * 0.4})`);
            gradient.addColorStop(1, 'rgba(255, 180, 80, 0)');
            
            ctx.strokeStyle = gradient;
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.moveTo(meteor.x, meteor.y);
            ctx.lineTo(
                meteor.x - meteor.vx * meteor.length / meteor.vy,
                meteor.y - meteor.length
            );
            ctx.stroke();
            
            // Draw meteor head with glow
            ctx.beginPath();
            ctx.arc(meteor.x, meteor.y, 4, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(255, 255, 255, ${meteor.opacity})`;
            ctx.shadowBlur = 15;
            ctx.shadowColor = `rgba(255, 220, 150, ${meteor.brightness})`;
            ctx.fill();
            ctx.shadowBlur = 0;
            
            // Add sparkles around meteor head
            for (let j = 0; j < 3; j++) {
                const sparkleX = meteor.x + (Math.random() - 0.5) * 10;
                const sparkleY = meteor.y + (Math.random() - 0.5) * 10;
                ctx.beginPath();
                ctx.arc(sparkleX, sparkleY, 1, 0, Math.PI * 2);
                ctx.fillStyle = `rgba(255, 220, 150, ${meteor.opacity * 0.6})`;
                ctx.fill();
            }
            
            // Remove if off screen
            if (meteor.y > canvas.height + 100 || meteor.x < -100 || meteor.x > canvas.width + 100) {
                meteors.splice(i, 1);
            }
        }
        
        requestAnimationFrame(animate);
    }
    
    animate();
    
    // Show continue button after some time
    setTimeout(() => {
        document.getElementById('continue-after-starmap').style.display = 'block';
        gsap.fromTo('#continue-after-starmap',
            { opacity: 0, y: 20 },
            { opacity: 1, y: 0, duration: 0.8, ease: 'power2.out' }
        );
    }, 8000);
}

// Continue after star map
document.getElementById('continue-after-starmap').addEventListener('click', () => {
    starMapRunning = false;
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

const scratchCanvas = document.getElementById("scratch-canvas");

if (scratchCanvas) {
    scratchCanvas.addEventListener("touchmove", function (e) {
        e.preventDefault();
    }, { passive: false });
}

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