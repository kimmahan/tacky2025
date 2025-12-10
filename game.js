// Tacky 90s Holiday DOOM - Raycasting Engine
// Inspired by classic DOOM (1993) for the Tack-a-Thon 2025

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const startScreen = document.getElementById('start-screen');
const gameOverScreen = document.getElementById('game-over');
const startBtn = document.getElementById('start-btn');
const restartBtn = document.getElementById('restart-btn');

// Set canvas size
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

// Game state
let gameStarted = false;
let gameOver = false;
let health = 100;
let ammo = 50;
let score = 0;

// Player state
const player = {
    x: 1.5,
    y: 1.5,
    angle: 0,
    speed: 0.05,
    turnSpeed: 0.03
};

// Map (1 = wall, 0 = empty space)
// Holiday-themed map layout
const map = [
    [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
    [1,0,1,1,0,0,0,0,0,0,0,0,1,1,0,1],
    [1,0,1,0,0,0,0,0,0,0,0,0,0,1,0,1],
    [1,0,0,0,0,1,1,0,0,1,1,0,0,0,0,1],
    [1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1],
    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
    [1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1],
    [1,0,0,0,0,1,1,0,0,1,1,0,0,0,0,1],
    [1,0,1,0,0,0,0,0,0,0,0,0,0,1,0,1],
    [1,0,1,1,0,0,0,0,0,0,0,0,1,1,0,1],
    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
    [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1]
];

const mapWidth = map[0].length;
const mapHeight = map.length;

// Textures (simple color-based for now)
const wallColors = {
    1: '#8B4513', // Brown walls (tacky wood paneling)
    2: '#FF6347', // Red walls (holiday theme)
    3: '#228B22'  // Green walls (holiday theme)
};

// Raycasting settings
const FOV = Math.PI / 3; // 60 degrees
const NUM_RAYS = canvas.width;
const MAX_DEPTH = 20;
const DELTA_ANGLE = FOV / NUM_RAYS;

// Input handling
const keys = {};
let mouseX = 0;
let mouseSensitivity = 0.002;

document.addEventListener('keydown', (e) => {
    keys[e.key.toLowerCase()] = true;
});

document.addEventListener('keyup', (e) => {
    keys[e.key.toLowerCase()] = false;
});

document.addEventListener('mousemove', (e) => {
    if (!gameStarted || gameOver) return;
    mouseX = e.movementX || 0;
    player.angle += mouseX * mouseSensitivity;
});

document.addEventListener('click', (e) => {
    if (!gameStarted || gameOver) return;
    if (ammo > 0) {
        shoot();
    }
});

// Lock pointer for mouse look
canvas.addEventListener('click', () => {
    if (gameStarted && !gameOver) {
        canvas.requestPointerLock();
    }
});

// Raycasting function
function castRay(angle) {
    const sin = Math.sin(angle);
    const cos = Math.cos(angle);
    
    let x = player.x;
    let y = player.y;
    
    const dx = cos;
    const dy = sin;
    
    const deltaDistX = Math.abs(1 / dx);
    const deltaDistY = Math.abs(1 / dy);
    
    let mapX = Math.floor(x);
    let mapY = Math.floor(y);
    
    let sideDistX, sideDistY;
    let stepX, stepY;
    
    if (dx < 0) {
        stepX = -1;
        sideDistX = (x - mapX) * deltaDistX;
    } else {
        stepX = 1;
        sideDistX = (mapX + 1 - x) * deltaDistX;
    }
    
    if (dy < 0) {
        stepY = -1;
        sideDistY = (y - mapY) * deltaDistY;
    } else {
        stepY = 1;
        sideDistY = (mapY + 1 - y) * deltaDistY;
    }
    
    let hit = false;
    let side = 0;
    
    while (!hit) {
        if (sideDistX < sideDistY) {
            sideDistX += deltaDistX;
            mapX += stepX;
            side = 0;
        } else {
            sideDistY += deltaDistY;
            mapY += stepY;
            side = 1;
        }
        
        if (mapX < 0 || mapX >= mapWidth || mapY < 0 || mapY >= mapHeight) {
            break;
        }
        
        if (map[mapY][mapX] > 0) {
            hit = true;
        }
    }
    
    let perpWallDist;
    if (side === 0) {
        perpWallDist = (mapX - x + (1 - stepX) / 2) / dx;
    } else {
        perpWallDist = (mapY - y + (1 - stepY) / 2) / dy;
    }
    
    return {
        distance: perpWallDist,
        wallType: hit ? map[mapY][mapX] : 0,
        side: side
    };
}

// Render function
function render() {
    // Clear screen
    ctx.fillStyle = '#1a1a2e';
    ctx.fillRect(0, 0, canvas.width, canvas.height / 2);
    
    ctx.fillStyle = '#16213e';
    ctx.fillRect(0, canvas.height / 2, canvas.width, canvas.height / 2);
    
    // Cast rays and draw walls
    for (let i = 0; i < NUM_RAYS; i++) {
        const rayAngle = player.angle - FOV / 2 + i * DELTA_ANGLE;
        const ray = castRay(rayAngle);
        
        const distance = ray.distance;
        const correctedDistance = distance * Math.cos(rayAngle - player.angle);
        
        const wallHeight = (canvas.height / correctedDistance) * 0.5;
        const wallTop = (canvas.height - wallHeight) / 2;
        
        // Draw wall
        let color = wallColors[ray.wallType] || '#8B4513';
        if (ray.side === 1) {
            // Darker shade for north/south walls
            color = adjustBrightness(color, 0.7);
        }
        
        ctx.fillStyle = color;
        ctx.fillRect(i, wallTop, 1, wallHeight);
        
        // Draw ceiling and floor
        ctx.fillStyle = '#2a2a4e';
        ctx.fillRect(i, 0, 1, wallTop);
        
        ctx.fillStyle = '#0a0a1e';
        ctx.fillRect(i, wallTop + wallHeight, 1, canvas.height - (wallTop + wallHeight));
    }
}

// Helper function to adjust color brightness
function adjustBrightness(color, factor) {
    const hex = color.replace('#', '');
    const r = Math.floor(parseInt(hex.substr(0, 2), 16) * factor);
    const g = Math.floor(parseInt(hex.substr(2, 2), 16) * factor);
    const b = Math.floor(parseInt(hex.substr(4, 2), 16) * factor);
    return `rgb(${r},${g},${b})`;
}

// Player movement
function movePlayer() {
    const sin = Math.sin(player.angle);
    const cos = Math.cos(player.angle);
    
    let newX = player.x;
    let newY = player.y;
    
    if (keys['w']) {
        newX += cos * player.speed;
        newY += sin * player.speed;
    }
    if (keys['s']) {
        newX -= cos * player.speed;
        newY -= sin * player.speed;
    }
    if (keys['a']) {
        newX += sin * player.speed;
        newY -= cos * player.speed;
    }
    if (keys['d']) {
        newX -= sin * player.speed;
        newY += cos * player.speed;
    }
    if (keys['arrowleft'] || keys['q']) {
        player.angle -= player.turnSpeed;
    }
    if (keys['arrowright'] || keys['e']) {
        player.angle += player.turnSpeed;
    }
    
    // Collision detection
    if (newX >= 0 && newX < mapWidth && newY >= 0 && newY < mapHeight) {
        if (map[Math.floor(newY)][Math.floor(newX)] === 0) {
            player.x = newX;
            player.y = newY;
        }
    }
}

// Shooting function
function shoot() {
    ammo--;
    updateHUD();
    
    // Add shooting effects here (muzzle flash, sound, etc.)
    // For now, just update ammo
    
    if (ammo <= 0) {
        ammo = 0;
    }
}

// Update HUD
function updateHUD() {
    document.getElementById('health-fill').style.width = health + '%';
    document.getElementById('health-text').textContent = health + '%';
    document.getElementById('ammo-count').textContent = ammo;
}

// Game loop
function gameLoop() {
    if (!gameStarted || gameOver) return;
    
    movePlayer();
    render();
    updateHUD();
    
    requestAnimationFrame(gameLoop);
}

// Start game
startBtn.addEventListener('click', () => {
    startScreen.style.display = 'none';
    gameStarted = true;
    canvas.requestPointerLock();
    gameLoop();
});

// Restart game
restartBtn.addEventListener('click', () => {
    gameOverScreen.classList.add('hidden');
    health = 100;
    ammo = 50;
    score = 0;
    player.x = 1.5;
    player.y = 1.5;
    player.angle = 0;
    gameOver = false;
    gameStarted = true;
    updateHUD();
    canvas.requestPointerLock();
    gameLoop();
});

// Handle window resize
window.addEventListener('resize', () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
});

// Initialize
updateHUD();

