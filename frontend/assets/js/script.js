/* ================= ANALYTICS ENGINE ================= */
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

// Section mapping for progress indicator
const sections = [
    'loading-screen',      // 1
    'date-screen',         // 2
    'main-screen',         // 3
    'gallery-screen',      // 4
    'princess-loading',    // 5
    'message-screen',      // 6
    'gift-screen',         // 7
    'outro-screen'         // 8
];

// Gallery images (4 photos for album)
const galleryImages = [
    {
        url: 'assets/images/mankirat.jpg',
        caption: '.'
    },
    {
        url: 'assets/images/rr.jpeg',
        caption: '.'
    },
    {
        url: 'assets/images/sm.png',
        caption: 'Sorry no more pics'
    },
    {
        url: 'assets/images/sm.png',
        caption: 'Sorry no more pics'
    }
];

const personalMessage = `Hey Mankirat,

Just wanted to wish you a very happy birthday.

I've thought about the past, and I realise I didn't handle things maturely back then. I'm sorry for that. I never meant to make things uncomfortable for you.

No expectations at all — just wishing you well and hoping this year brings you peace, happiness, and good things ahead.

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
        currentActive.style.opacity = '0';
        setTimeout(() => {
            currentActive.classList.remove('active');
            
            const newSection = document.getElementById(sectionId);
            newSection.classList.add('active');
            setTimeout(() => {
                newSection.style.opacity = '1';
            }, 50);
            
            // Update progress
            const sectionIndex = sections.indexOf(sectionId);
            if (sectionIndex !== -1) {
                updateProgress(sectionIndex);
            }
        }, 300);
    } else {
        const newSection = document.getElementById(sectionId);
        newSection.classList.add('active');
        setTimeout(() => {
            newSection.style.opacity = '1';
        }, 50);
        
        // Update progress
        const sectionIndex = sections.indexOf(sectionId);
        if (sectionIndex !== -1) {
            updateProgress(sectionIndex);
        }
    }
}

// Initial popup auto-dismiss
window.addEventListener('load', () => {
    setTimeout(() => {
        document.getElementById('initial-popup').classList.remove('active');
        document.getElementById('loading-screen').classList.add('active');
        updateProgress(0);
        startBalloons();
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
            
            // Play blow sound effect
            playBlowSound();
            
            // Add smoke effect
            createSmoke(this);
            
            if (candlesBlown === candles.length) {
                setTimeout(() => {
                    createConfetti();
                    document.getElementById('next-to-gallery').style.display = 'inline-block';
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
    smoke.style.animation = 'smokeRise 1s ease-out forwards';
    candle.appendChild(smoke);
    
    setTimeout(() => smoke.remove(), 1000);
}

// Add smoke animation to CSS dynamically
const style = document.createElement('style');
style.textContent = `
    @keyframes smokeRise {
        to {
            transform: translateX(-50%) translateY(-30px);
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);

// Confetti effect
function createConfetti() {
    const container = document.getElementById('confetti-container');
    const colors = ['#FF69B4', '#FFD700', '#FFED4E', '#FF1493', '#FF8FAB'];
    
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
    showToast('📸 A few moments from the past 📸');

    currentPage = 1;

    document.querySelectorAll('.album-page').forEach(page => {
        page.classList.remove('flipped');
    });

    updateAlbumPages();
});

// Album page navigation
const totalPages = 4;

function updateAlbumPages() {
    document.getElementById('current-page').textContent = currentPage;
    document.getElementById('prev-page').disabled = currentPage === 1;
    document.getElementById('next-page').disabled = currentPage === totalPages;
    
    // Update page visibility based on current page
    const page1 = document.getElementById('page-1');
    const page3 = document.getElementById('page-3');
    
    // Remove all flipped states first
    page1.classList.remove('flipped');
    page3.classList.remove('flipped');
    
    // Apply correct state based on current page
    if (currentPage === 2) {
        page1.classList.add('flipped');
    } else if (currentPage === 3) {
        page1.classList.add('flipped');
    } else if (currentPage === 4) {
        page1.classList.add('flipped');
        page3.classList.add('flipped');
    }
}

document.getElementById('next-page').addEventListener('click', () => {
    if (currentPage < totalPages) {
        currentPage++;
        updateAlbumPages();
        playPageFlipSound();
    }
});

document.getElementById('prev-page').addEventListener('click', () => {
    if (currentPage > 1) {
        currentPage--;
        updateAlbumPages();
        playPageFlipSound();
    }
});

function playPageFlipSound() {
    try {
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        oscillator.frequency.value = 200;
        oscillator.type = 'sine';
        
        gainNode.gain.setValueAtTime(0.2, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.15);
        
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.15);
    } catch (e) {
        console.log('Audio not supported');
    }
}

// Princess screen navigation with loading
document.getElementById('next-to-princess').addEventListener('click', () => {
    // Stop balloons before princess screen
    stopBalloons();
    
    showSection('princess-loading');
    showToast('👑 Loading something special... 👑');
    
    // Show loading screen for 3 seconds
    setTimeout(() => {
        showSection('princess-screen');
        // No toast, just silence for the mirror effect
        
        // Show continue button after 10 seconds (5s delay for text + 5s more)
        setTimeout(() => {
            document.getElementById('next-from-princess').style.display = 'inline-block';
        }, 10000);
    }, 3000);
});

// Continue from princess screen
document.getElementById('next-from-princess').addEventListener('click', () => {
    resumeBalloons();

    showSection('message-screen');
    showToast('💌 A note for you 💌');

    // 🔥 RESET TEXT BEFORE TYPING
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
            document.getElementById('next-to-gift').style.display = 'inline-block';
            showToast('🎁 A small gift is waiting 🎁');
        }, 500);
    }
}

document.getElementById('next-to-gift').addEventListener('click', () => {
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
    gradient.addColorStop(0, '#C0C0C0');
    gradient.addColorStop(0.5, '#E8E8E8');
    gradient.addColorStop(1, '#C0C0C0');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Add text
    ctx.fillStyle = '#666';
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
    document.getElementById('skip-voucher').style.display = 'inline-block';
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
    
    // Show final popup after 3 seconds
    setTimeout(() => {

    }, 3000);
});

// Skip modal button
document.getElementById('skip-modal').addEventListener('click', () => {
    document.getElementById('gift-modal').classList.remove('active');
    setTimeout(() => {
        showSection('outro-screen');
        createConfetti();
        showToast('✨ Thank you for being here ✨');
        
        // Show final popup after 3 seconds
        setTimeout(() => {

        }, 3000);
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
        code: voucherType,                // ✅ REQUIRED
        description: `Contact via ${contactMethod}`,
        value: 0,                         // or amount if you want
        contactMethod,
        contact
    }
    });

    // Show success message
    alert(`Thanks! If you chose to receive it, the food coupon will be shared with you soon. Take care 🙂`);
    
    // Close modal and show outro
    document.getElementById('gift-modal').classList.remove('active');
    setTimeout(() => {
        showSection('outro-screen');
        createConfetti();
        showToast('✨ Thank you for being here ✨');
        
        // Show final popup after 3 seconds
        setTimeout(() => {
        }, 3000);
    }, 500);
});

// Replay button
document.getElementById('replay-btn').addEventListener('click', () => {
    // Reset all states
    candlesBlown = 0;
    currentPage = 1;
    scratchPercentage = 0;
    
    // Reset candles
    document.querySelectorAll('.candle').forEach(candle => {
        candle.classList.remove('blown');
    });
    
    // Reset album pages
    document.querySelectorAll('.album-page').forEach(page => {
        page.classList.remove('flipped');
    });
    
    // Reset typewriter
    document.getElementById('typewriter-text').textContent = '';
    
    // Hide buttons
    document.getElementById('next-to-gallery').style.display = 'none';
    document.getElementById('next-from-princess').style.display = 'none';
    document.getElementById('next-to-gift').style.display = 'none';
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
            // Use native share API for mobile
            await navigator.share(shareData);
            showToast('📤 Thanks for sharing! 📤');
        } else {
            // Fallback: Copy link to clipboard
            await navigator.clipboard.writeText(window.location.href);
            showToast('🔗 Link copied to clipboard! 🔗');
        }
    } catch (err) {
        // If both fail, show the URL in an alert
        alert('Share this link:\n' + window.location.href);
    }
});



// Keyboard navigation for album
document.addEventListener('keydown', (e) => {
    if (document.getElementById('gallery-screen').classList.contains('active')) {
        if (e.key === 'ArrowLeft') {
            document.getElementById('prev-page')?.click();
        } else if (e.key === 'ArrowRight') {
            document.getElementById('next-page')?.click();
        }
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
        // Reinitialize scratch card on resize for mobile
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