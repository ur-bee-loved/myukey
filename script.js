const cup = document.querySelector('.cup');
const bears = document.querySelectorAll('.bear'); // Select all bears
const starButton = document.getElementById('star-button'); // Star button

// Wait for images to load before initializing positions
window.addEventListener('load', () => {
    initializeBears();
});

function initializeBears() {
    // Initialize positions and velocities for all bears
    window.bearPositions = Array.from(bears).map((bear, index) => {
        // Position bears at different starting points to avoid overlap
        return {
            x: 20 + (index * 80) % (cup.offsetWidth - 80),
            y: 30 + (index * 60) % (cup.offsetHeight - 80),
            vx: 0, // Horizontal velocity
            vy: 0, // Vertical velocity
        };
    });

    // Assign unique images to each bear
    const bearImages = [
        'images/bichinhos/abelha.png',
        'images/bichinhos/anomolocaris.png',
        'images/bichinhos/bart.png',
        'images/bichinhos/coelho.png',      
        'images/bichinhos/gato.png', 
        'images/bichinhos/mariposa.png', 
        'images/bichinhos/morango.png', 
        'images/bichinhos/ovelinha.png', 
        'images/bichinhos/pombo.png', 
        'images/bichinhos/rabanete.png', 
        'images/bichinhos/rato.png', 
        'images/bichinhos/regaleco.png', 
        'images/bichinhos/snail.png', 
        'images/bichinhos/tubaraoduende.png', 
        'images/bichinhos/viado.png', 
    ];

    bears.forEach((bear, index) => {
        bear.style.backgroundImage = `url('${bearImages[index]}')`;
        // Set initial positions
        bear.style.left = `${window.bearPositions[index].x}px`;
        bear.style.top = `${window.bearPositions[index].y}px`;
    });

    // Initialize touch events for bears
    initializeTouchEvents();
}

// Sensitivity adjustment
const sensitivity = 0.5;
// Velocity threshold for bouncing
const bounceThreshold = 5; 
// Damping factor to reduce velocity over time
const damping = 0.95; 

// Function to handle device motion
function handleMotion(event) {
    if (!window.bearPositions) return; // Safety check
    
    const acceleration = event.accelerationIncludingGravity;
    const tiltX = acceleration.x; // Left-to-right tilt
    const tiltY = acceleration.y; // Front-to-back tilt

    bears.forEach((bear, index) => {
        // Update velocity based on tilt
        window.bearPositions[index].vx -= tiltX * sensitivity;
        window.bearPositions[index].vy += tiltY * sensitivity;

        // Apply damping to reduce velocity over time
        window.bearPositions[index].vx *= damping;
        window.bearPositions[index].vy *= damping;

        // Update position based on velocity
        window.bearPositions[index].x += window.bearPositions[index].vx;
        window.bearPositions[index].y += window.bearPositions[index].vy;

        // Keep the bear inside the cup and bounce off walls
        if (window.bearPositions[index].x < 0 || window.bearPositions[index].x > cup.offsetWidth - bear.offsetWidth) {
            window.bearPositions[index].vx *= -1; // Reverse horizontal velocity
            window.bearPositions[index].x = Math.max(0, Math.min(cup.offsetWidth - bear.offsetWidth, window.bearPositions[index].x));
            if (Math.abs(window.bearPositions[index].vx) > bounceThreshold) {
                bear.classList.add('bounce');
                setTimeout(() => bear.classList.remove('bounce'), 300);
            }
        }
        if (window.bearPositions[index].y < 0 || window.bearPositions[index].y > cup.offsetHeight - bear.offsetHeight) {
            window.bearPositions[index].vy *= -1; // Reverse vertical velocity
            window.bearPositions[index].y = Math.max(0, Math.min(cup.offsetHeight - bear.offsetHeight, window.bearPositions[index].y));
            if (Math.abs(window.bearPositions[index].vy) > bounceThreshold) {
                bear.classList.add('bounce');
                setTimeout(() => bear.classList.remove('bounce'), 300);
            }
        }

        // Update bear position
        bear.style.left = `${window.bearPositions[index].x}px`;
        bear.style.top = `${window.bearPositions[index].y}px`;
    });

    // Check for collisions between bears
    checkCollisions();
    
    // Check if device is flipped upside down
    checkDeviceFlip(acceleration);
}

let lastCheckTime = 0;
let isUpsideDown = false;
let selectedPlushie = null;

function checkDeviceFlip(acceleration) {
    const now = Date.now();
    // Limit checks to reduce performance impact
    if (now - lastCheckTime < 500) return;
    lastCheckTime = now;
    
    // Check if device is flipped upside down (y-axis acceleration strongly negative)
    const isFlipped = acceleration.y < -8; // Threshold for upside down
    
    if (isFlipped && !isUpsideDown) {
        isUpsideDown = true;
        
        // Find the plushie that's closest to the bottom of the cup
        let bottomMostIndex = 0;
        let maxY = -1;
        
        bears.forEach((bear, index) => {
            if (window.bearPositions[index].y > maxY) {
                maxY = window.bearPositions[index].y;
                bottomMostIndex = index;
            }
        });
        
        // "Drop" this plushie
        selectedPlushie = bottomMostIndex;
        dropPlushie(bottomMostIndex);
    } else if (!isFlipped) {
        isUpsideDown = false;
    }
}

function dropPlushie(index) {
    const bear = bears[index];
    
    // Animate the plushie falling out
    bear.style.transition = "top 1s ease-in";
    bear.style.top = `${cup.offsetHeight + 50}px`;
    
    setTimeout(() => {
        // Extract just the filename without the path and extension
        const fullPath = bear.style.backgroundImage;
        // Extract plushie name from the URL
        const filename = fullPath.split('/').pop().split('.')[0];
        
        // Redirect to loading page
        window.location.href = `loading.html?plushie=${filename}`;
    }, 1000);
}

function checkCollisions() {
    for (let i = 0; i < bears.length; i++) {
        for (let j = i + 1; j < bears.length; j++) {
            const bear1 = bears[i];
            const bear2 = bears[j];

            const rect1 = bear1.getBoundingClientRect();
            const rect2 = bear2.getBoundingClientRect();

            if (
                rect1.left < rect2.right &&
                rect1.right > rect2.left &&
                rect1.top < rect2.bottom &&
                rect1.bottom > rect2.top
            ) {
                // Collision detected! Apply bounce effect and separate bears
                handleCollision(bear1, bear2);
                separateBears(bear1, bear2);
            }
        }
    }
}

function handleCollision(bear1, bear2) {
    const index1 = Array.from(bears).indexOf(bear1);
    const index2 = Array.from(bears).indexOf(bear2);

    // Calculate relative velocity
    const relativeVelocityX = Math.abs(window.bearPositions[index1].vx - window.bearPositions[index2].vx);
    const relativeVelocityY = Math.abs(window.bearPositions[index1].vy - window.bearPositions[index2].vy);

    // Only bounce if relative velocity exceeds the threshold
    if (relativeVelocityX > bounceThreshold || relativeVelocityY > bounceThreshold) {
        // Swap velocities for a simple bounce effect
        const tempVx = window.bearPositions[index1].vx;
        const tempVy = window.bearPositions[index1].vy;

        window.bearPositions[index1].vx = window.bearPositions[index2].vx;
        window.bearPositions[index1].vy = window.bearPositions[index2].vy;

        window.bearPositions[index2].vx = tempVx;
        window.bearPositions[index2].vy = tempVy;

        // Add bounce animation
        bear1.classList.add('bounce');
        bear2.classList.add('bounce');
        setTimeout(() => {
            bear1.classList.remove('bounce');
            bear2.classList.remove('bounce');
        }, 300);
    } else {
        // Minimal collision effect (e.g., slight push)
        window.bearPositions[index1].vx *= 0.5;
        window.bearPositions[index1].vy *= 0.5;
        window.bearPositions[index2].vx *= 0.5;
        window.bearPositions[index2].vy *= 0.5;
    }
}

function separateBears(bear1, bear2) {
    const index1 = Array.from(bears).indexOf(bear1);
    const index2 = Array.from(bears).indexOf(bear2);

    // Calculate the center positions of the bears
    const center1 = {
        x: window.bearPositions[index1].x + bear1.offsetWidth / 2,
        y: window.bearPositions[index1].y + bear1.offsetHeight / 2,
    };
    const center2 = {
        x: window.bearPositions[index2].x + bear2.offsetWidth / 2,
        y: window.bearPositions[index2].y + bear2.offsetHeight / 2,
    };

    // Calculate the distance between centers
    const dx = center2.x - center1.x;
    const dy = center2.y - center1.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    // Minimum distance required to prevent overlap
    const minDistance = (bear1.offsetWidth + bear2.offsetWidth) / 2;

    if (distance < minDistance) {
        // Calculate overlap
        const overlap = minDistance - distance;

        // Normalize the direction vector
        const directionX = dx / distance;
        const directionY = dy / distance;

        // Move bears apart
        window.bearPositions[index1].x -= overlap * directionX / 2;
        window.bearPositions[index1].y -= overlap * directionY / 2;
        window.bearPositions[index2].x += overlap * directionX / 2;
        window.bearPositions[index2].y += overlap * directionY / 2;

        // Update bear positions
        bear1.style.left = `${window.bearPositions[index1].x}px`;
        bear1.style.top = `${window.bearPositions[index1].y}px`;
        bear2.style.left = `${window.bearPositions[index2].x}px`;
        bear2.style.top = `${window.bearPositions[index2].y}px`;
    }
}

// Request permission for motion sensors (required on iOS)
function requestGyroscopePermission() {
    if (typeof DeviceMotionEvent.requestPermission === 'function') {
        DeviceMotionEvent.requestPermission()
            .then(permissionState => {
                if (permissionState === 'granted') {
                    window.addEventListener('devicemotion', handleMotion);
                    starButton.classList.add('active');
                    setTimeout(() => {
                        starButton.style.display = 'none'; // Hide the star button after animation
                    }, 300);
                } else {
                    alert('Permission denied. Motion controls will not work.');
                }
            })
            .catch(console.error);
    } else {
        // Fallback for non-iOS devices
        window.addEventListener('devicemotion', handleMotion);
        starButton.classList.add('active');
        setTimeout(() => {
            starButton.style.display = 'none'; // Hide the star button
        }, 300);
    }
}

// Add click event listener to the star button
starButton.addEventListener('click', requestGyroscopePermission);

function initializeTouchEvents() {
    // Add touch event listeners to all bears
    bears.forEach(bear => {
        let isDragging = false;

        bear.addEventListener('touchstart', (event) => {
            isDragging = true;
            event.preventDefault(); // Prevent default touch behavior
        });

        bear.addEventListener('touchmove', (event) => {
            if (isDragging) {
                const touch = event.touches[0];
                const rect = cup.getBoundingClientRect();

                // Calculate new position based on touch coordinates
                const index = Array.from(bears).indexOf(bear);
                window.bearPositions[index].x = touch.clientX - rect.left - bear.offsetWidth / 2;
                window.bearPositions[index].y = touch.clientY - rect.top - bear.offsetHeight / 2;

                // Keep the bear inside the cup
                window.bearPositions[index].x = Math.max(0, Math.min(cup.offsetWidth - bear.offsetWidth, window.bearPositions[index].x));
                window.bearPositions[index].y = Math.max(0, Math.min(cup.offsetHeight - bear.offsetHeight, window.bearPositions[index].y));

                // Update bear position
                bear.style.left = `${window.bearPositions[index].x}px`;
                bear.style.top = `${window.bearPositions[index].y}px`;

                // Reset velocities when manually moved
                window.bearPositions[index].vx = 0;
                window.bearPositions[index].vy = 0;
            }
        });

        bear.addEventListener('touchend', () => {
            isDragging = false;
        });
    });
}