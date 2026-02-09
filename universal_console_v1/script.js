/**
 * UNIVERSAL CONSOLE SYSTEM
 * Architecture:
 * - ConsoleApp: Main controller, handles UI I/O and routing.
 * - World: Abstract base class for any virtual environment.
 * - Entity: Base class for objects within a world.
 */

// --- UTILS ---
const Utils = {
    getTimestamp: () => new Date().toLocaleTimeString('en-US', { hour12: false }),
    sleep: (ms) => new Promise(r => setTimeout(r, ms)),
    randomId: () => Math.random().toString(36).substr(2, 6).toUpperCase()
};

// --- BASE CLASSES ---

class Entity {
    constructor(id, type) {
        this.id = id || Utils.randomId();
        this.type = type || 'GENERIC';
        this.properties = {};
    }

    setProperty(key, value) {
        this.properties[key] = value;
    }

    getProperty(key) {
        return this.properties[key];
    }

    getDetails() {
        return this.properties;
    }
}

class World {
    constructor(name, id, meta = {}) {
        this.name = name;
        this.id = id;
        this.meta = {
            type: meta.type || 'SIMULATION',
            region: meta.region || 'LOCAL',
            ping: meta.ping || '1ms'
        };
        this.entities = [];
        this.commands = {};
    }

    // Lifecycle
    onConnect(consoleRef) {
        this.console = consoleRef;
        this.console.log(`Connection established to [${this.name}]`, 'success');
        this.console.log(`Kernel v4.2 loaded. System ready.`, 'system');
    }

    onDisconnect() {
        if (this.console) this.console.log(`Terminating connection to [${this.name}]...`, 'warn');
    }

    // Command Handling
    registerCommand(cmd, description, handler) {
        this.commands[cmd] = { description, handler };
    }

    hasCommand(cmd) {
        return !!this.commands[cmd];
    }

    executeCommand(cmd, args) {
        if (this.commands[cmd]) {
            return this.commands[cmd].handler(args);
        }
        return `Command '${cmd}' not recognized by world kernel.`;
    }

    // Entity Management
    addEntity(entity) {
        this.entities.push(entity);
    }

    getEntity(id) {
        return this.entities.find(e => e.id === id);
    }

    getEntities() {
        return this.entities;
    }
}

// --- WORLD 1: DRONE WORLD (Enhanced) ---

class Drone extends Entity {
    constructor(id) {
        super(id, 'DRONE_UNIT');
        this.setProperty('status', 'IDLE');
        this.setProperty('battery', 100);
        this.setProperty('location', 'BASE_STATION');
    }

    flyTo(locationName) {
        if (this.getProperty('status') === 'OFFLINE') return "Unit is OFFLINE.";
        this.setProperty('status', 'IN_FLIGHT');
        this.setProperty('battery', this.getProperty('battery') - 10);

        // Sim travel
        setTimeout(() => {
            this.setProperty('status', 'IDLE');
            this.setProperty('location', locationName);
        }, 1500); // Fake travel time handled conceptually here, UI updates on next check

        return `Unit ${this.id} en route to ${locationName}...`;
    }

    scan() {
        if (this.getProperty('status') === 'OFFLINE') return "Unit is OFFLINE.";
        return `Scan complete. Data uploaded from ${this.getProperty('location')}.`;
    }
}

class DroneWorld extends World {
    constructor() {
        super("SECTOR_7_DRONES", "drone_net", { type: 'TACTICAL', region: 'NA-WEST', ping: '24ms' });

        this.zones = ['BASE_STATION', 'ROOF_TOP', 'RIVER_BANK', 'PERIMETER_WALL'];

        this.addEntity(new Drone('ALPHA-1'));
        this.addEntity(new Drone('BETA-7'));
        this.addEntity(new Drone('OMEGA-X'));

        this.registerCommand('list_zones', 'List available landing zones', () => {
            return "KNOWN ZONES:\n" + this.zones.map(z => ` - ${z}`).join('\n');
        });

        this.registerCommand('status', 'Check status of all units', () => {
            let report = "UNIT STATUS REPORT:\n";
            this.entities.forEach(e => {
                report += `[${e.id}] ${e.getProperty('status')} | ${e.getProperty('location')} | BAT: ${e.getProperty('battery')}%\n`;
            });
            return report;
        });

        this.registerCommand('fly', 'Send unit to zone: fly <id> <zone_name>', (args) => {
            if (args.length < 2) return "Usage: fly <id> <zone_name>";
            const id = args[0];
            const zone = args[1].toUpperCase();

            if (!this.zones.includes(zone)) return `Unknown zone: ${zone}. Use 'list_zones'.`;

            const drone = this.getEntity(id);
            if (!drone) return `Unit ${id} not found.`;

            return drone.flyTo(zone);
        });

        this.registerCommand('scan', 'Perform scan: scan <id>', (args) => {
            if (args.length < 1) return "Usage: scan <id>";
            const drone = this.getEntity(args[0]);
            if (!drone) return `Unit ${args[0]} not found.`;
            return drone.scan();
        });
    }
}

// --- WORLD 2: CITY SIMULATION ---
// Kept simple for specific requests
class TrafficLight extends Entity {
    constructor(id) {
        super(id, 'TRAFFIC_NODE');
        this.setProperty('state', 'RED');
        this.setProperty('congestion', 'LOW');
    }
    setSignal(color) {
        this.setProperty('state', color.toUpperCase());
        return `Node ${this.id} signal set to ${color.toUpperCase()}.`;
    }
}
class CitySimWorld extends World {
    constructor() {
        super("NEO_TOKYO_GRID", "city_sim", { type: 'INFRASTRUCTURE', region: 'ASIA-EAST', ping: '140ms' });
        this.addEntity(new TrafficLight('NODE-A1'));
        this.addEntity(new TrafficLight('NODE-B4'));
        this.registerCommand('set_signal', 'Set light color: set_signal <id> <color>', (args) => {
            if (args.length < 2) return "Usage: set_signal <id> <color>";
            const tl = this.getEntity(args[0]);
            if (!tl) return `Node ${args[0]} not found.`;
            return tl.setSignal(args[1]);
        });
        this.registerCommand('emergency_all_red', 'Set all signals to RED', () => {
            this.entities.forEach(e => e.setSignal('RED'));
            return "EMERGENCY PROTOCOL ACTIVATED.";
        });
    }
}

// --- WORLD 3: ORBITAL STATION (Experimental) ---

class DockingClamp extends Entity {
    constructor(id) {
        super(id, 'MECH_CLAMP');
        this.setProperty('status', 'RETRACTED');
        this.setProperty('pressure', '0 psi');
    }
}

class OrbitalStationWorld extends World {
    constructor() {
        super("KEPLER_STATION", "kepler_dock", { type: 'ORBITAL', region: 'LEO', ping: '850ms' });

        this.addEntity(new DockingClamp('DOCK-A'));
        this.addEntity(new DockingClamp('DOCK-B'));

        this.dockStatus = "EMPTY";

        this.registerCommand('status', 'Station status', () => {
            return `STATION INTEGRITY: 100% | DOCK: ${this.dockStatus}`;
        });

        this.registerCommand('init_docking', 'Start docking procedure', () => {
            if (this.dockStatus !== "EMPTY") return "Dock is obstructed.";
            this.dockStatus = "APPROACHING";
            // Simulate async process with console logs (handled by app)
            this.console.log("RADAR CONTACT. VESSEL APPROACHING...", 'info');
            setTimeout(() => {
                if (this.dockStatus === "APPROACHING") {
                    this.dockStatus = "DOCKED";
                    this.console.log("CONTACT CONFIRMED. HARD SEAl ESTABLISHED.", 'success');
                    this.entities.forEach(e => {
                        e.setProperty('status', 'LOCKED');
                        e.setProperty('pressure', '4500 psi');
                    });
                }
            }, 3000);
            return "Docking sequence initiated. Stand by.";
        });

        this.registerCommand('release', 'Release docked vessel', () => {
            if (this.dockStatus === "EMPTY") return "Nothing to release.";
            this.dockStatus = "EMPTY";
            this.entities.forEach(e => {
                e.setProperty('status', 'RETRACTED');
                e.setProperty('pressure', '0 psi');
            });
            return "Clamps released. Vessel departing.";
        });
    }
}

// --- FILE SYSTEM (Simulated) ---

class FileSystem {
    constructor() {
        this.root = {
            type: 'dir',
            children: {
                'home': {
                    type: 'dir',
                    children: {
                        'user': {
                            type: 'dir',
                            children: {
                                'notes.txt': { type: 'file', content: 'Remember to check the drone batteries.' },
                                'todo.log': { type: 'file', content: '- Fix traffic grid\n- Hack orbital station' }
                            }
                        }
                    }
                },
                'sys': {
                    type: 'dir',
                    children: {
                        'config.sys': { type: 'file', content: 'SYSTEM_VERSION=4.2\nTHEME=INDUSTRIAL_AMBER' },
                        'logs': { type: 'dir', children: {} }
                    }
                }
            }
        };
        this.currentPath = ['home', 'user'];
        this.currentDirName = 'user';
    }

    // Navigation
    cd(path) {
        if (path === '..') {
            if (this.currentPath.length > 0) {
                this.currentPath.pop();
                this.updateCurrentDirName();
                return '';
            }
            return 'Already at root.';
        }
        if (path === '/') {
            this.currentPath = [];
            this.updateCurrentDirName();
            return '';
        }

        const target = this.resolvePath(path);
        if (target && target.type === 'dir') {
            this.currentPath.push(path); // Simplified relative path handling for now
            this.updateCurrentDirName();
            return '';
        }
        return `Directory '${path}' not found.`;
    }

    updateCurrentDirName() {
        this.currentDirName = this.currentPath.length > 0 ? this.currentPath[this.currentPath.length - 1] : '/';
    }

    resolvePath(pathName) {
        // Only redundant relative lookup for current dir children for this sim
        // Real implementation would be recursive.
        let node = this.root;
        for (const p of this.currentPath) {
            node = node.children[p];
        }
        return node.children[pathName];
    }

    getCurrentNode() {
        let node = this.root;
        for (const p of this.currentPath) {
            if (!node.children[p]) return null; // Should not happen
            node = node.children[p];
        }
        return node;
    }

    // Operations
    ls() {
        const node = this.getCurrentNode();
        if (!node || !node.children) return '';

        let out = '';
        for (const [name, item] of Object.entries(node.children)) {
            const typeMark = item.type === 'dir' ? '/' : '';
            out += `${name}${typeMark}\n`;
        }
        return out;
    }

    mkdir(name) {
        const node = this.getCurrentNode();
        if (node.children[name]) return `Error: '${name}' already exists.`;
        node.children[name] = { type: 'dir', children: {} };
        return `Directory '${name}' created.`;
    }

    touch(name) {
        const node = this.getCurrentNode();
        if (node.children[name]) return `Error: '${name}' already exists.`;
        node.children[name] = { type: 'file', content: '' };
        return `File '${name}' created.`;
    }

    cat(name) {
        const target = this.resolvePath(name);
        if (!target) return `File '${name}' not found.`;
        if (target.type === 'dir') return `'${name}' is a directory.`;
        return target.content;
    }

    serialize() {
        return JSON.stringify({
            root: this.root,
            currentPath: this.currentPath
        });
    }

    deserialize(json) {
        try {
            const data = JSON.parse(json);
            this.root = data.root;
            this.currentPath = data.currentPath;
            this.updateCurrentDirName();
            return true;
        } catch (e) {
            console.error("FS Load Failed", e);
            return false;
        }
    }
}

// --- MAIN CONSOLE APP ---

// --- Minigames ---
class SnakeGame {
    constructor(canvasId, scoreId, onClose) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');
        this.scoreEl = document.getElementById(scoreId);
        this.onClose = onClose;
        this.grid = 20;
        this.running = false;

        this.reset();

        document.addEventListener('keydown', (e) => this.handleInput(e));
    }

    reset() {
        this.snake = [{ x: 160, y: 160 }, { x: 140, y: 160 }, { x: 120, y: 160 }];
        this.dx = this.grid;
        this.dy = 0;
        this.food = this.spawnFood();
        this.score = 0;
        this.updateScore();
        this.speed = 100;
        this.lastRender = 0;
        this.gameOver = false;
    }

    start(difficulty = 'medium') {
        if (this.running) return;
        this.running = true;
        this.reset();

        // Set Difficulty Speed
        switch (difficulty.toLowerCase()) {
            case 'easy': this.speed = 150; break;
            case 'hard': this.speed = 50; break;
            case 'insane': this.speed = 25; break;
            default: this.speed = 100; // Medium
        }

        requestAnimationFrame((t) => this.loop(t));
    }

    stop() {
        this.running = false;
        this.onClose();
    }

    updateScore() {
        this.scoreEl.innerText = this.score;
    }

    spawnFood() {
        return {
            x: Math.floor(Math.random() * (this.canvas.width / this.grid)) * this.grid,
            y: Math.floor(Math.random() * (this.canvas.height / this.grid)) * this.grid
        };
    }

    handleInput(e) {
        if (!this.running) return;

        const key = e.key;
        if (key === 'Escape') this.stop();

        // Prevent reversing
        if (key === 'ArrowUp' && this.dy === 0) { this.dx = 0; this.dy = -this.grid; }
        else if (key === 'ArrowDown' && this.dy === 0) { this.dx = 0; this.dy = this.grid; }
        else if (key === 'ArrowLeft' && this.dx === 0) { this.dx = -this.grid; this.dy = 0; }
        else if (key === 'ArrowRight' && this.dx === 0) { this.dx = this.grid; this.dy = 0; }
    }

    loop(timestamp) {
        if (!this.running) return;

        if (timestamp - this.lastRender > this.speed) {
            this.lastRender = timestamp;
            this.update();
            this.draw();
        }

        requestAnimationFrame((t) => this.loop(t));
    }

    update() {
        if (this.gameOver) return;

        const head = { x: this.snake[0].x + this.dx, y: this.snake[0].y + this.dy };

        // Wall collision (Wrap)
        if (head.x < 0) head.x = this.canvas.width - this.grid;
        else if (head.x >= this.canvas.width) head.x = 0;
        if (head.y < 0) head.y = this.canvas.height - this.grid;
        else if (head.y >= this.canvas.height) head.y = 0;

        // Self collision
        for (let i = 0; i < this.snake.length; i++) {
            if (head.x === this.snake[i].x && head.y === this.snake[i].y) {
                this.gameOver = true;
                this.stop(); // Or reset
                return;
            }
        }

        this.snake.unshift(head);

        // Eat food
        if (head.x === this.food.x && head.y === this.food.y) {
            this.score += 10;
            this.updateScore();
            this.food = this.spawnFood();
            if (this.speed > 50) this.speed -= 2; // Speed up
        } else {
            this.snake.pop(); // Remove tail
        }
    }

    draw() {
        // Transparent BG to see console behind? No, opaque for focus.
        this.ctx.fillStyle = '#000';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // Food
        this.ctx.fillStyle = '#ff0000';
        this.ctx.fillRect(this.food.x, this.food.y, this.grid - 1, this.grid - 1);

        // Snake
        this.ctx.fillStyle = '#00ff00';
        this.snake.forEach((segment, index) => {
            if (index === 0) this.ctx.fillStyle = '#ccffcc';
            else this.ctx.fillStyle = '#00ff00';
            this.ctx.fillRect(segment.x, segment.y, this.grid - 1, this.grid - 1);
        });
    }
}


class PongGame {
    constructor(canvasId, pScoreId, cScoreId, onClose) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');
        this.pScoreEl = document.getElementById(pScoreId);
        this.cScoreEl = document.getElementById(cScoreId);
        this.onClose = onClose;
        this.running = false;

        // Config
        this.paddleW = 10;
        this.paddleH = 60;
        this.ballSize = 10;

        this.reset();
        document.addEventListener('keydown', (e) => this.handleInput(e));
        document.addEventListener('keyup', (e) => this.handleUp(e));
    }

    reset() {
        this.ball = { x: 300, y: 200, dx: 4, dy: 4 };
        this.player = { x: 10, y: 170, dy: 0, score: 0 };
        this.cpu = { x: 580, y: 170, dy: 0, score: 0 };
        this.updateScores();
        this.speed = 5; // Paddle speed
    }

    start() {
        if (this.running) return;
        this.running = true;
        this.ball = { x: 300, y: 200, dx: 4 * (Math.random() > .5 ? 1 : -1), dy: 4 * (Math.random() > .5 ? 1 : -1) };
        requestAnimationFrame(() => this.loop());
    }

    stop() {
        this.running = false;
        this.onClose();
    }

    updateScores() {
        this.pScoreEl.innerText = this.player.score;
        this.cScoreEl.innerText = this.cpu.score;
    }

    handleInput(e) {
        if (!this.running) return;
        if (e.key === 'Escape') this.stop();
        if (e.key === 'w' || e.key === 'ArrowUp') this.player.dy = -this.speed;
        if (e.key === 's' || e.key === 'ArrowDown') this.player.dy = this.speed;
    }

    handleUp(e) {
        if (e.key === 'w' || e.key === 'ArrowUp' || e.key === 's' || e.key === 'ArrowDown') {
            this.player.dy = 0;
        }
    }

    loop() {
        if (!this.running) return;
        this.update();
        this.draw();
        requestAnimationFrame(() => this.loop());
    }

    update() {
        // Player Move
        this.player.y += this.player.dy;
        if (this.player.y < 0) this.player.y = 0;
        if (this.player.y > this.canvas.height - this.paddleH) this.player.y = this.canvas.height - this.paddleH;

        // CPU Move (Simple AI)
        const target = this.ball.y - (this.paddleH / 2);
        if (this.cpu.y < target) this.cpu.y += 3;
        if (this.cpu.y > target) this.cpu.y -= 3;
        // Clamp CPU
        if (this.cpu.y < 0) this.cpu.y = 0;
        if (this.cpu.y > this.canvas.height - this.paddleH) this.cpu.y = this.canvas.height - this.paddleH;

        // Ball Move
        this.ball.x += this.ball.dx;
        this.ball.y += this.ball.dy;

        // Bounce Top/Bottom
        if (this.ball.y < 0 || this.ball.y > this.canvas.height - this.ballSize) this.ball.dy *= -1;

        // Score
        if (this.ball.x < 0) {
            this.cpu.score++;
            this.resetBall(1);
        } else if (this.ball.x > this.canvas.width) {
            this.player.score++;
            this.resetBall(-1);
        }
        this.updateScores();

        // Paddle Collision
        // Player
        if (this.ball.x < this.player.x + this.paddleW &&
            this.ball.x + this.ballSize > this.player.x &&
            this.ball.y < this.player.y + this.paddleH &&
            this.ball.y + this.ballSize > this.player.y) {
            this.ball.dx = Math.abs(this.ball.dx) + 0.2; // Speed up
            this.ball.x = this.player.x + this.paddleW;
        }

        // CPU
        if (this.ball.x < this.cpu.x + this.paddleW &&
            this.ball.x + this.ballSize > this.cpu.x &&
            this.ball.y < this.cpu.y + this.paddleH &&
            this.ball.y + this.ballSize > this.cpu.y) {
            this.ball.dx = -(Math.abs(this.ball.dx) + 0.2);
            this.ball.x = this.cpu.x - this.ballSize;
        }
    }

    resetBall(direction) {
        this.ball.x = this.canvas.width / 2;
        this.ball.y = this.canvas.height / 2;
        this.ball.dx = 4 * direction;
        this.ball.dy = 4 * (Math.random() > 0.5 ? 1 : -1);
    }

    draw() {
        this.ctx.fillStyle = '#000';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        this.ctx.fillStyle = '#fff';
        // Net
        for (let i = 0; i < this.canvas.height; i += 30) {
            this.ctx.fillRect(this.canvas.width / 2 - 1, i, 2, 20);
        }

        // Paddles
        this.ctx.fillRect(this.player.x, this.player.y, this.paddleW, this.paddleH);
        this.ctx.fillRect(this.cpu.x, this.cpu.y, this.paddleW, this.paddleH);

        // Ball
        this.ctx.fillRect(this.ball.x, this.ball.y, this.ballSize, this.ballSize);
    }
}

class ConsoleApp {
    constructor() {
        this.activeWorld = null;
        this.worlds = [
            new DroneWorld(),
            new CitySimWorld(),
            new OrbitalStationWorld()
        ];

        this.fs = new FileSystem();

        // UI Refs
        this.termOutput = document.getElementById('terminal-output');
        this.cmdInput = document.getElementById('command-input');

        this.ui = {
            worldName: document.getElementById('current-world-name'),
            entityCount: document.getElementById('entity-count'),
            logFeed: document.getElementById('system-log'),
            clock: document.getElementById('clock'),
            inspector: document.getElementById('inspector-panel'),
            cmdList: document.getElementById('cmd-list-panel'),
            worldList: document.getElementById('world-list-container')
        };

        this.init();
    }

    init() {
        // Load State
        this.loadState();

        // Konami Code Tracking
        this.konamiSeq = [];
        this.konamiCode = ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'b', 'a'];

        document.addEventListener('keydown', (e) => {
            this.konamiSeq.push(e.key);
            if (this.konamiSeq.length > 10) this.konamiSeq.shift();
            if (JSON.stringify(this.konamiSeq) === JSON.stringify(this.konamiCode)) {
                this.activateGodMode();
            }
        });

        // Theme Slider
        this.ui.themeSlider = document.getElementById('theme-slider');
        if (this.ui.themeSlider) {
            this.ui.themeSlider.addEventListener('input', (e) => {
                const themes = ['amber', 'retro', 'cyber', 'ice', 'crimson', 'void', 'royal'];
                this.setTheme(themes[e.target.value]);
            });
        }

        // Event Listeners
        this.cmdInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                const cmd = this.cmdInput.value.trim();
                if (cmd) {
                    this.print(`${this.getPrompt()}`, 'user');
                    this.processCommand(cmd);
                    this.cmdInput.value = '';
                    this.saveState(); // Auto-save on command
                }
            }
        });

        // Clock Update
        setInterval(() => {
            this.ui.clock.textContent = Utils.getTimestamp();
        }, 1000);

        // Begin Network Scan
        this.startNetworkScan();

        // Render available commands initially
        this.updateCmdList(['help', 'ls', 'cd', 'cat', 'disconnect']);

        this.startSimulation();

        this.print("System Ready.", 'system');
        this.print("Mounting File System... [OK]", 'system');
        this.print(`Current Directory: /${this.fs.currentPath.join('/')}`, 'info');
    }

    getPrompt() {
        return `admin@uni-con[${this.fs.currentDirName}]:~$ `;
    }

    log(text, type = 'info') {
        this.print(text, type);
    }

    print(text, type = 'info') {
        const line = document.createElement('div');
        line.className = `msg ${type}`;
        line.innerText = text;
        this.termOutput.appendChild(line);
        this.termOutput.scrollTop = this.termOutput.scrollHeight;

        if (text.length < 60 && type !== 'user') {
            this.logToSidebar(text);
        }
    }

    logToSidebar(text) {
        const entry = document.createElement('div');
        entry.className = 'log-entry';
        entry.textContent = text;
        this.ui.logFeed.prepend(entry);
        if (this.ui.logFeed.children.length > 5) {
            this.ui.logFeed.lastChild.remove();
        }
    }

    // Persistence
    saveState() {
        localStorage.setItem('console_fs', this.fs.serialize());
        if (this.activeWorld) {
            localStorage.setItem('console_world', this.activeWorld.id);
        } else {
            localStorage.removeItem('console_world');
        }
        if (this.currentTheme) {
            localStorage.setItem('console_theme', this.currentTheme);
        }
    }

    loadState() {
        const fsData = localStorage.getItem('console_fs');
        if (fsData) {
            this.fs.deserialize(fsData);
            this.print("File System state restored.", 'system');
        }

        const worldId = localStorage.getItem('console_world');
        if (worldId) {
            const world = this.worlds.find(w => w.id === worldId);
            if (world) setTimeout(() => this.connectToWorld(world), 500);
        }

        const theme = localStorage.getItem('console_theme');
        if (theme) {
            this.setTheme(theme);
        }
    }

    startNetworkScan() {
        this.ui.worldList.innerHTML = '<div class="scan-line" style="color:var(--color-dim); font-size:0.8rem; padding:5px;">SCANNING FREQUENCIES...</div>';

        let foundCount = 0;

        this.worlds.forEach((world, index) => {
            // Random delay between 500ms and 3000ms
            const delay = 800 + (index * 600) + Math.random() * 1000;

            setTimeout(() => {
                // Remove scanner placeholder on first find
                if (foundCount === 0) {
                    this.ui.worldList.innerHTML = '';
                }

                this.addWorldToList(world);
                foundCount++;

                // Optional log
                if (Math.random() > 0.5) {
                    this.logToSidebar(`Signal detected: ${world.id}`);
                }
            }, delay);
        });
    }

    addWorldToList(world) {
        const el = document.createElement('div');
        el.className = 'world-item loaded'; // Add loaded class for animation
        if (this.activeWorld === world) el.classList.add('active');

        // Simulating fluctuating ping for the list view
        const basePing = parseInt(world.meta.ping);
        const currentPing = Math.floor(basePing + (Math.random() * 20 - 10)); // +/- 10ms jitter

        el.innerHTML = `
            <div>${world.name}<br><span class="w-meta">${world.id}</span></div>
            <div class="w-meta w-ping">${currentPing}ms</div>
            <div class="status-indicator" title="${world.meta.type}"></div>
        `;

        el.onclick = () => {
            this.connectToWorld(world);
        };

        this.ui.worldList.appendChild(el);
    }

    processCommand(rawCmd) {
        const args = rawCmd.split(' ');
        const mainCmd = args.shift().toLowerCase();

        // Global Commands
        if (this.hackingState && this.hackingState.active && mainCmd === 'guess') {
            if (args.length > 0) {
                this.processHackingGuess(args[0]);
                return;
            }
        }

        if (this.sequenceActive) {
            if (rawCmd.toUpperCase() === this.sequenceTarget) {
                this.print("SEQUENCE VERIFIED. EXCELLENT.", 'success');
            } else {
                this.print(`SEQUENCE FAILED. EXPECTED: ${this.sequenceTarget}`, 'error');
            }
            this.sequenceActive = false;
            return;
        }

        switch (mainCmd) {
            case 'help':
                let helpText = "";

                const cats = {
                    'SYSTEM': ['help', 'clear', 'theme <name>', 'exit', 'godmode?'],
                    'NETWORK': ['list', 'connect <id>', 'disconnect', 'broadcast <msg>'],
                    'FILESYSTEM': ['ls', 'cd <path>', 'cat <file>', 'mkdir <name>', 'touch <name>', 'rm <file>'],
                    'MINIGAMES': ['snake [diff]', 'pong', 'hack', 'sequence'],
                    'FUN': ['matrix', 'self_destruct', 'coffee', 'sudo']
                };

                for (const [cat, cmds] of Object.entries(cats)) {
                    helpText += `[${cat}]\n`;
                    cmds.forEach(c => helpText += `  + ${c}\n`);
                    helpText += "\n";
                }

                if (this.activeWorld) {
                    helpText += `[CONNECTED: ${this.activeWorld.name}]\n`;
                    for (const [key, val] of Object.entries(this.activeWorld.commands)) {
                        helpText += `  > ${key.padEnd(10)} : ${val.description}\n`;
                    }
                }
                this.print(helpText);
                break;

            // FS Commands
            case 'ls':
                this.print(this.fs.ls());
                break;
            case 'cd':
                if (args.length < 1) { this.print("Usage: cd <path>", 'error'); return; }
                const cdRes = this.fs.cd(args[0]);
                if (cdRes) this.print(cdRes, 'error');
                else this.print(`Changed directory to /${this.fs.currentPath.join('/')}`);
                break;
            case 'mkdir':
                if (args.length < 1) { this.print("Usage: mkdir <name>", 'error'); return; }
                this.print(this.fs.mkdir(args[0]), 'info');
                break;
            case 'touch':
                if (args.length < 1) { this.print("Usage: touch <name>", 'error'); return; }
                this.print(this.fs.touch(args[0]), 'info');
                break;
            case 'cat':
                if (args.length < 1) { this.print("Usage: cat <file>", 'error'); return; }
                this.print(this.fs.cat(args[0]), 'info');
                break;

            case 'list':
                this.print("AVAILABLE WORLDS:", 'info');
                this.worlds.forEach(w => this.print(` - ${w.name} [ID: ${w.id}]`, 'info'));
                break;
            case 'connect':
                if (args.length < 1) {
                    this.print("Usage: connect <world_id>", 'error');
                    return;
                }
                const target = this.worlds.find(w => w.id === args[0]);
                if (target) {
                    this.connectToWorld(target);
                } else {
                    this.print(`World '${args[0]}' not found.`, 'error');
                }
                break;
            case 'disconnect':
                this.disconnect();
                break;
            case 'clear':
                this.termOutput.innerHTML = '';
                break;
                if (!msg) { this.print("Usage: broadcast <message>", 'error'); return; }
                this.print(`BROADCASTING: "${msg.toUpperCase()}"`, 'warn');
                break;

            // EASTER EGGS
            case 'sudo':
                this.print(`User 'admin' is not in the sudoers file. This incident will be reported.`, 'error');
                break;
            case 'coffee':
                this.print(`Error 418: I am a teapot.`, 'warn');
                break;
            case 'rm':
                if (args[0] === '-rf' && args[1] === '/') {
                    this.print(`Deleting root directory...`, 'alert');
                    setTimeout(() => this.print(`Deleting kernel...`, 'alert'), 1000);
                    setTimeout(() => this.print(`Removing safety interlocks...`, 'alert'), 2000);
                    setTimeout(() => this.print(`FATAL ERROR: Permission Denied. Nice try.`, 'error'), 3000);
                } else {
                    this.print(`Usage: rm <file>`, 'info');
                }
                break;
            case 'matrix':
                this.startMatrixEffect();
                break;
            case 'self_destruct':
                this.triggerSelfDestruct();
                break;
            case 'snake':
                this.launchSnake(args[0]);
                break;
            case 'hack':
                this.print("INITIALIZING DECRYPTION PROTOCOL...", 'system');
                setTimeout(() => this.startHackingMinigame(), 1000);
                break;
            case 'pong':
                this.launchPong();
                break;
            case 'sequence':
                this.startSequenceGame();
                break;

            case 'theme':
                if (args.length < 1 || args[0] === 'list') {
                    this.print("AVAILABLE THEMES: amber, retro, cyber, ice, crimson, void, royal", 'info');
                } else {
                    this.setTheme(args[0]);
                }
                break;

            default:
                // If connected, try passing to world
                if (this.activeWorld && this.activeWorld.hasCommand(mainCmd)) {
                    const result = this.activeWorld.executeCommand(mainCmd, args);
                    if (result) this.print(result, 'info');
                    this.updateUI(); // Refresh UI after world cmd
                } else {
                    this.print(`Command '${mainCmd}' not found.`, 'error');
                }
        }
    }

    setTheme(themeName) {
        const themes = ['retro', 'cyber', 'ice', 'crimson', 'void', 'royal'];
        document.body.className = ''; // Reset

        if (themes.includes(themeName)) {
            document.body.classList.add(`theme-${themeName}`);
            this.print(`Theme set to [${themeName.toUpperCase()}].`, 'success');
        } else if (themeName === 'amber' || themeName === 'default') {
            this.print(`Theme set to [AMBER].`, 'success');
        } else {
            this.print(`Unknown theme: ${themeName}. Type 'theme list'.`, 'error');
            return; // Don't save invalid theme
        }

        // Sync Slider
        const sliderThemes = ['amber', 'retro', 'cyber', 'ice', 'crimson', 'void', 'royal'];
        if (this.ui && this.ui.themeSlider) {
            const idx = sliderThemes.indexOf(themeName);
            if (idx >= 0) this.ui.themeSlider.value = idx;
            else if (themeName === 'default') this.ui.themeSlider.value = 0;
        }

        this.currentTheme = themeName;
        this.saveState();
    }

    triggerSelfDestruct() {
        this.print("WARNING: SELF-DESTRUCT SEQUENCE INITIATED.", 'error');
        this.print("CORRUPTION IMMINENT.", 'error');

        let count = 5;
        const body = document.body;
        body.classList.add('red-alert');

        const timer = setInterval(() => {
            if (count > 0) {
                this.print(`DETONATION IN ${count}...`, 'error');
                if (count === 3) body.classList.add('shake');
                count--;
            } else {
                clearInterval(timer);
                this.print("SYSTEM CRITICAL. GOODBYE.", 'error');

                // Crash
                setTimeout(() => {
                    const overlay = document.createElement('div');
                    overlay.className = 'crash-overlay visible';
                    overlay.innerHTML = `<div style="color:red; font-family: monospace;">SYSTEM FAILURE<br>0x0000DEAD000</div>`;
                    document.body.appendChild(overlay);

                    // Reboot
                    setTimeout(() => {
                        window.location.reload();
                    }, 3000);
                }, 1000);
            }
        }, 1000);
    }

    startMatrixEffect() {
        this.print("Wake up, Neo...", 'success');
        const chars = "10";
        const interval = setInterval(() => {
            let line = "";
            for (let i = 0; i < 80; i++) {
                line += chars.charAt(Math.floor(Math.random() * chars.length));
            }
            // By passing 'success' (green) we get the look
            this.print(line, 'success');
        }, 50);

        setTimeout(() => {
            clearInterval(interval);
            this.print("The Matrix has you.", 'system');
        }, 5000);
    }

    startSimulation() {
        // Hardware Simulation State
        let cpuLoad = 30;
        let ramUsage = 16.4; // TB

        const cpuBar = document.querySelector('.bar');
        // Target the text inside the second stat item (MEM)
        // Structure: <div class="stat-item"><span class="label">MEM:</span> 32TB / 64TB</div>
        // We want to change the text node following the span.
        const memItem = document.querySelector('.stat-item:nth-child(2)');

        setInterval(() => {
            // CPU Drift algorithm (Task Manager style)
            // Drift between -5% and +5% but stay within 5-90 range
            const drift = (Math.random() - 0.5) * 10;
            cpuLoad += drift;
            if (cpuLoad < 5) cpuLoad = 5;
            if (cpuLoad > 95) cpuLoad = 95;

            // Update CPU UI
            if (cpuBar) {
                cpuBar.style.width = `${cpuLoad}%`;
                // Color shift based on load
                if (cpuLoad > 85) cpuBar.style.backgroundColor = 'var(--color-alert)';
                else if (cpuLoad > 60) cpuBar.style.backgroundColor = 'var(--color-warn)';
                else cpuBar.style.backgroundColor = 'var(--color-primary)';
            }

            // MEM Drift (Slower)
            if (memItem) {
                ramUsage += (Math.random() - 0.5) * 0.8;
                if (ramUsage < 12) ramUsage = 12;
                if (ramUsage > 58) ramUsage = 58;

                // Keep the label, update the text
                memItem.innerHTML = `<span class="label">MEM:</span> ${ramUsage.toFixed(1)}TB / 64TB`;
            }

        }, 2000); // 2 seconds update (Slower, more realistic)

        // Background System Chatter with COLORS
        const sysMsgs = [
            { text: "Garbage collection routine active...", type: 'debug' },
            { text: "Encrypting data blocks [AES-4096]...", type: 'system' },
            { text: "Ping received from sector 7 (14ms).", type: 'network' },
            { text: "Cooling system nominal.", type: 'success' },
            { text: "Background sync complete.", type: 'success' },
            { text: "Packet loss detected on sub-channel 4.", type: 'warn' },
            { text: "Refreshing V-RAM cache...", type: 'debug' },
            { text: "Analyzing network traffic patterns...", type: 'info' },
            { text: "Handshake established with Proxy Node.", type: 'network' }
        ];

        setInterval(() => {
            if (Math.random() > 0.8) {
                const msg = sysMsgs[Math.floor(Math.random() * sysMsgs.length)];
                // Log to sidebar (simple text)
                this.logToSidebar(`[SYS] ${msg.text}`);
                // Log to main terminal (colored) if idle
                if (Math.random() > 0.7) {
                    this.print(`[BACKGROUND] ${msg.text}`, msg.type);
                }
            }
        }, 4000); // Less frequent

        // Random Grid Shift (Minimap) - Kept same
        const grid = document.querySelector('.grid-bg');
        setInterval(() => {
            if (grid && Math.random() > 0.9) {
                grid.style.filter = `hue-rotate(${Math.floor(Math.random() * 30)}deg)`;
            }
        }, 5000);
    }

    disconnect() {
        if (this.activeWorld) {
            this.activeWorld.onDisconnect();
            this.activeWorld = null;
            this.updateUI();
            this.print("Disconnected.", 'system');
        } else {
            this.print("Not connected to any world.", 'warn');
        }
    }

    async connectToWorld(world) {
        if (this.activeWorld === world) return;
        if (this.isConnecting) return; // Prevent double clicks

        this.isConnecting = true;
        this.termOutput.scrollTop = this.termOutput.scrollHeight;

        // Calculate Latency
        // Base delay + random jitter based on "distance" (simulated by ping)
        const basePing = parseInt(world.meta.ping) || 100;
        const latency = 400 + (basePing * 2) + Math.random() * 1500; // 0.5s to 3s typical

        this.print(`Initiating handshake with [${world.id.toUpperCase()}]...`, 'network');

        // Detailed Connection Simulation
        await Utils.sleep(latency * 0.3);

        if (latency > 1000) {
            this.print(`Negotiating encryption keys (AES-4096)...`, 'debug');
            await Utils.sleep(latency * 0.4);
        }

        if (latency > 2000) {
            this.print(`Rerouting through proxy node...`, 'warn');
            await Utils.sleep(latency * 0.2);
        }

        await Utils.sleep(latency * 0.1);

        // Finalize
        if (this.activeWorld) {
            this.activeWorld.onDisconnect();
        }

        this.activeWorld = world;
        this.activeWorld.onConnect(this);
        this.updateUI();
        this.isConnecting = false;

        // Save state immediately
        this.saveState();
    }

    updateUI() {
        // Refresh World List Active State without scanning
        const items = this.ui.worldList.querySelectorAll('.world-item');
        // We can't easily map back to world objects from DOM without IDs.
        // Let's just clear all active classes and match by text content or something simpler?
        // Better: Re-implement a lightweight render or just iterate.
        // Given the constraints, let's just iterate the current list and toggle active class if we can.
        // Correction: Let's simply NOT rebuild the list in updateUI. The list persists.
        // We just need to update the highlighting.

        Array.from(this.ui.worldList.children).forEach(el => {
            // Very hacky but functional way to find if this element matches activeWorld
            if (this.activeWorld && el.innerHTML.includes(this.activeWorld.id)) {
                el.classList.add('active');
            } else {
                el.classList.remove('active');
            }
        });

        if (this.activeWorld) {
            this.ui.worldName.textContent = this.activeWorld.name;
            this.ui.entityCount.textContent = this.activeWorld.getEntities().length;

            // Update Command List
            const cmds = ['disconnect', 'help', ...Object.keys(this.activeWorld.commands)];
            this.updateCmdList(cmds);

            // Update Inspector
            this.renderInspector(this.activeWorld.getEntities());

            document.querySelector('.map-message').textContent = `UPLINK ESTABLISHED: ${this.activeWorld.meta.region}`;
        } else {
            this.ui.worldName.textContent = "DISCONNECTED";
            this.ui.entityCount.textContent = "0";
            this.updateCmdList(['help', 'connect', 'list']);
            this.ui.inspector.innerHTML = '<div class="empty-state">SELECT AN OBJECT TO INSPECT</div>';
            document.querySelector('.map-message').textContent = "NO SIGNAL";
        }
    }

    updateCmdList(cmds) {
        this.ui.cmdList.innerHTML = '';
        cmds.forEach(cmd => {
            const el = document.createElement('div');
            el.className = 'cmd-item';
            el.textContent = cmd;
            el.onclick = () => {
                this.cmdInput.value = cmd + ' ';
                this.cmdInput.focus();
            };
            this.ui.cmdList.appendChild(el);
        });
    }

    renderInspector(entities) {
        let html = '';
        if (entities.length === 0) {
            html = '<div class="empty-state">NO ENTITIES FOUND</div>';
        } else {
            entities.forEach(ent => {
                html += `
                <div class="object-details" style="margin-bottom: 20px;">
                    <div class="obj-header">
                        <span class="obj-id">#${ent.id}</span>
                        <span class="obj-type">${ent.type}</span>
                    </div>
                    <div class="wireframe-placeholder">[LIVE DATA]</div>
                    <table class="obj-stats-table"><tbody>
                `;
                for (const [key, val] of Object.entries(ent.properties)) {
                    html += `<tr><td>${key.toUpperCase()}</td><td>${val}</td></tr>`;
                }
                html += `</tbody></table></div>`;
            });
        }
        this.ui.inspector.innerHTML = html;
        this.ui.inspector.classList.remove('hidden');
    }

    launchSnake(difficulty = 'medium') {
        const overlay = document.getElementById('snake-overlay');
        overlay.classList.remove('hidden');
        if (!this.snakeGame) {
            this.snakeGame = new SnakeGame('snake-canvas', 'snake-score', () => {
                overlay.classList.add('hidden');
                this.cmdInput.focus();
            });
        }
        this.snakeGame.start(difficulty);
        this.cmdInput.blur();
    }

    launchPong() {
        const overlay = document.getElementById('pong-overlay');
        overlay.classList.remove('hidden');
        if (!this.pongGame) {
            this.pongGame = new PongGame('pong-canvas', 'pong-p-score', 'pong-c-score', () => {
                overlay.classList.add('hidden');
                this.cmdInput.focus();
            });
        }
        this.pongGame.start();
        this.cmdInput.blur();
    }

    startSequenceGame() {
        this.print("--- MEMORY TEST INITIATED ---", 'system');
        this.print("MEMORIZE THE HEX CODES.", 'warn');

        const len = 3;
        const codes = [];
        for (let i = 0; i < len; i++) codes.push(Math.floor(Math.random() * 255).toString(16).toUpperCase().padStart(2, '0'));

        let displayStr = codes.join('  ');
        this.print(displayStr, 'alert');

        this.sequenceTarget = codes.join('');

        setTimeout(() => {
            this.print("--- SIGNAL LOST ---", 'dim');
            // In a real terminal we'd clear lines, but here we just push new ones
            this.print("RE-ENTER SEQUENCE (No Spaces):", 'info');
            this.sequenceActive = true;
        }, 3000);
    }

    startHackingMinigame() {
        const words = ['SYSTEM', 'ACCESS', 'SERVER', 'MATRIX', 'VECTOR', 'CIPHER', 'BINARY', 'KERNEL', 'DAEMON', 'PROXY'];
        const target = words[Math.floor(Math.random() * words.length)];
        let attempts = 4;

        this.print("--- MEMORY DUMP ---", 'info');
        let dump = "";
        words.forEach(w => dump += `0x${Math.floor(Math.random() * 9999)} ${w} `);
        this.print(dump, 'dim');
        this.print("-------------------", 'info');
        this.print(`TARGET PASSWORD REQUIRED. ${attempts} ATTEMPTS REMAINING.`, 'warn');
        this.print("(Type 'guess <word>' to attempt decryption)", 'system');

        this.hackingState = { active: true, target: target, attempts: attempts };
    }

    processHackingGuess(guess) {
        if (!this.hackingState || !this.hackingState.active) return false;

        guess = guess.toUpperCase();
        this.print(`> ${guess}`, 'user');

        if (guess === this.hackingState.target) {
            this.print("ACCESS GRANTED.", 'success');
            this.print("Reward: 500 Credits (Simulated)", 'info');
            this.hackingState.active = false;
            return true;
        } else {
            let like = 0;
            for (let i = 0; i < Math.min(guess.length, this.hackingState.target.length); i++) {
                if (guess[i] === this.hackingState.target[i]) like++;
            }

            this.hackingState.attempts--;
            this.print(`Likeness=${like}. Attempts: ${this.hackingState.attempts}`, 'error');

            if (this.hackingState.attempts <= 0) {
                this.print("TERMINAL LOCKED. INCIDENT REPORTED.", 'alert');
                this.hackingState.active = false;
            }
            return true;
        }
    }

    activateGodMode() {
        this.print("✨ KONAMI CODE DETECTED ✨", 'success');
        this.print("GOD MODE ACTIVATED.", 'system');
        this.print("Unlimited Resources Granted.", 'info');
        this.print("All Access Keys Unlocked.", 'info');

        document.body.style.animation = "shake 0.2s";
        setTimeout(() => document.body.style.animation = "", 200);

        // Add a visible indicator
        const badge = document.createElement('div');
        badge.innerHTML = "GOD_MODE";
        badge.style.position = 'fixed';
        badge.style.bottom = '10px';
        badge.style.left = '50%';
        badge.style.transform = 'translateX(-50%)';
        badge.style.color = 'gold';
        badge.style.fontFamily = 'var(--font-header)';
        badge.style.fontSize = '2rem';
        badge.style.pointerEvents = 'none';
        badge.style.textShadow = '0 0 10px gold';
        badge.style.zIndex = '9999';
        document.body.appendChild(badge);
    }
}

// Bootstrap
document.addEventListener('DOMContentLoaded', () => {
    window.app = new ConsoleApp();
});
