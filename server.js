const express = require('express');
const http = require('http');
const socketIO = require('socket.io');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const sqlite3 = require('sqlite3').verbose();

const app = express();
const server = http.createServer(app);
const io = socketIO(server, {
  cors: { origin: '*' }
});

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Database setup
const db = new sqlite3.Database(':memory:');

db.serialize(() => {
  db.run(`
    CREATE TABLE IF NOT EXISTS players (
      id TEXT PRIMARY KEY,
      name TEXT,
      x REAL,
      y REAL,
      health INTEGER,
      maxHealth INTEGER,
      stamina INTEGER,
      maxStamina INTEGER,
      lastUpdated INTEGER
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS monsters (
      id TEXT PRIMARY KEY,
      type TEXT,
      x REAL,
      y REAL,
      health INTEGER,
      maxHealth INTEGER,
      lastUpdated INTEGER
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS combat_log (
      id TEXT PRIMARY KEY,
      attacker TEXT,
      defender TEXT,
      damage INTEGER,
      timestamp INTEGER
    )
  `);
});

// World generation constants
const WORLD_SIZE = 2000;
const CHUNK_SIZE = 200;
const TOWN_RADIUS = 150;
const MAX_MONSTERS = 300;

// Monster types with enhanced stats
const MONSTER_TYPES = {
  SLIME: { name: 'Slime', health: 20, damage: 3, color: '#00FF00', ring: 1, exp: 10 },
  GOBLIN: { name: 'Goblin', health: 35, damage: 8, color: '#228B22', ring: 2, exp: 25 },
  SKELETON: { name: 'Skeleton', health: 50, damage: 12, color: '#CCCCCC', ring: 3, exp: 40 },
  GOLEM: { name: 'Golem', health: 80, damage: 15, color: '#8B7355', ring: 4, exp: 60 },
  OGRE: { name: 'Ogre', health: 100, damage: 20, color: '#FF6347', ring: 5, exp: 80 },
  DEMON: { name: 'Demon', health: 150, damage: 28, color: '#FF0000', ring: 6, exp: 120 },
  DRAGON: { name: 'Dragon', health: 300, damage: 40, color: '#FFD700', ring: 7, exp: 250 }
};

// Game state
const players = new Map();
const monsters = new Map();
const activeCombat = new Map();

// Seeded random function for consistent world generation
function seededRandom(seed) {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
}

// Get monster ring based on distance from town
function getMonsterRing(x, y) {
  const distance = Math.sqrt(x * x + y * y);
  const ring = Math.floor(distance / 200);
  return Math.min(ring, 7);
}

// Get monster type for ring (skill-based spawning)
function getMonsterTypeForRing(ring, playerSkill = 1) {
  const availableTypes = Object.entries(MONSTER_TYPES)
    .filter(([_, data]) => {
      // Dragons can spawn if player has high enough skill (chance-based)
      if (data.ring === 7) return playerSkill >= 10 && Math.random() < 0.1;
      return data.ring <= ring;
    })
    .map(([key, _]) => key);
  
  if (availableTypes.length === 0) return 'SLIME';
  return availableTypes[Math.floor(seededRandom(ring * 1000) * availableTypes.length)];
}

// Procedurally generate monsters for chunk
function generateMonstersForChunk(chunkX, chunkY, playerSkill = 1) {
  const seed = chunkX * 73856093 ^ chunkY * 19349663;
  const monstersInChunk = [];
  
  // Skip if in town
  const centerX = chunkX * CHUNK_SIZE;
  const centerY = chunkY * CHUNK_SIZE;
  if (Math.sqrt(centerX * centerX + centerY * centerY) < TOWN_RADIUS) {
    return monstersInChunk;
  }

  // Generate 2-5 monsters per chunk with random spawning
  const count = 2 + Math.floor(seededRandom(seed) * 4);
  for (let i = 0; i < count; i++) {
    const x = centerX + seededRandom(seed + i * 100) * CHUNK_SIZE;
    const y = centerY + seededRandom(seed + i * 100 + 50) * CHUNK_SIZE;
    const ring = getMonsterRing(x, y);
    const typeKey = getMonsterTypeForRing(ring, playerSkill);
    const monsterType = MONSTER_TYPES[typeKey];

    const monster = {
      id: `${chunkX}_${chunkY}_${i}_${Date.now()}`,
      type: typeKey,
      x: x,
      y: y,
      health: monsterType.health,
      maxHealth: monsterType.health,
      targetPlayerId: null,
      lastAttackTime: Date.now()
    };

    monstersInChunk.push(monster);
    monsters.set(monster.id, monster);
  }

  return monstersInChunk;
}

// Get chunks around player
function getChunksAroundPlayer(playerX, playerY, radius = 3) {
  const chunks = [];
  const centerChunkX = Math.floor(playerX / CHUNK_SIZE);
  const centerChunkY = Math.floor(playerY / CHUNK_SIZE);

  for (let dx = -radius; dx <= radius; dx++) {
    for (let dy = -radius; dy <= radius; dy++) {
      chunks.push({ x: centerChunkX + dx, y: centerChunkY + dy });
    }
  }
  return chunks;
}

// Monster AI and combat game loop
setInterval(() => {
  const now = Date.now();

  // Update monster behavior and combat
  monsters.forEach((monster, monsterId) => {
    if (!monster) return;

    // Find nearest player
    let nearestPlayer = null;
    let nearestDist = 400;

    players.forEach((player) => {
      const dist = Math.sqrt(Math.pow(player.x - monster.x, 2) + Math.pow(player.y - monster.y, 2));
      if (dist < nearestDist) {
        nearestDist = dist;
        nearestPlayer = player;
      }
    });

    // Attack nearest player if in range
    if (nearestPlayer && now - monster.lastAttackTime > 1500) {
      const monsterDamage = MONSTER_TYPES[monster.type].damage;
      const damageVariation = Math.floor(monsterDamage * 0.7 + Math.random() * monsterDamage * 0.6);
      const newHealth = Math.max(0, nearestPlayer.health - damageVariation);
      
      players.forEach((p) => {
        if (p.id === nearestPlayer.id) {
          p.health = newHealth;
        }
      });

      monster.lastAttackTime = now;

      io.emit('combat-event', {
        type: 'monster-attack',
        attacker: { id: monsterId, type: monster.type, name: MONSTER_TYPES[monster.type].name },
        defender: { id: nearestPlayer.id, name: nearestPlayer.name },
        damage: damageVariation,
        targetHealth: newHealth
      });
    }

    // Remove dead monsters
    if (monster.health <= 0) {
      monsters.delete(monsterId);
      io.emit('monster-died', { id: monsterId, x: monster.x, y: monster.y, reward: MONSTER_TYPES[monster.type].exp });
    }
  });

  // Respawn dead players
  players.forEach((player) => {
    if (player.health <= 0) {
      player.health = player.maxHealth;
      player.x = 0;
      player.y = 0;
      io.emit('player-respawned', { id: player.id, x: 0, y: 0 });
    }
  });
}, 1000);

// Socket.io connection handlers
io.on('connection', (socket) => {
  console.log(`🎮 Player connected: ${socket.id}`);

  socket.on('player-join', (data) => {
    const player = {
      id: socket.id,
      name: data.name || `Player_${socket.id.substring(0, 5)}`,
      x: 0,
      y: 0,
      health: 100,
      maxHealth: 100,
      stamina: 100,
      maxStamina: 100,
      skills: { attack: 1.0, defense: 1.0, dodge: 1.0 },
      experience: 0,
      lastUpdated: Date.now()
    };

    players.set(socket.id, player);

    // Generate initial monsters around player
    const nearbyMonsters = [];
    getChunksAroundPlayer(player.x, player.y).forEach(chunk => {
      const generated = generateMonstersForChunk(chunk.x, chunk.y, player.skills.attack);
      generated.forEach(m => nearbyMonsters.push(m));
    });

    // Send game initialization
    socket.emit('game-init', {
      playerId: socket.id,
      player: player,
      monsters: Array.from(monsters.values()),
      players: Array.from(players.values())
    });

    // Notify others
    socket.broadcast.emit('player-joined', player);
    console.log(`✅ ${player.name} joined the world!`);
  });

  socket.on('player-move', (data) => {
    const player = players.get(socket.id);
    if (player) {
      player.x = Math.max(-WORLD_SIZE / 2, Math.min(WORLD_SIZE / 2, data.x));
      player.y = Math.max(-WORLD_SIZE / 2, Math.min(WORLD_SIZE / 2, data.y));

      // Generate monsters for new chunks as player explores
      getChunksAroundPlayer(player.x, player.y).forEach(chunk => {
        const chunkKey = `${chunk.x}_${chunk.y}`;
        let hasMonsters = false;
        monsters.forEach((m) => {
          if (m.id.startsWith(chunkKey)) hasMonsters = true;
        });
        if (!hasMonsters && monsters.size < MAX_MONSTERS) {
          generateMonstersForChunk(chunk.x, chunk.y, player.skills.attack);
        }
      });

      io.emit('player-moved', { id: socket.id, x: player.x, y: player.y });
    }
  });

  socket.on('attack-monster', (data) => {
    const player = players.get(socket.id);
    const monster = monsters.get(data.monsterId);

    if (player && monster) {
      // Skill-based damage calculation
      const skillLevel = player.skills.attack || 1.0;
      const baseDamage = 10 + skillLevel * 5;
      const variance = 0.7 + Math.random() * 0.6;
      const damage = Math.floor(baseDamage * variance);

      monster.health = Math.max(0, monster.health - damage);

      // Reward for kill with skill progression
      if (monster.health === 0) {
        const reward = MONSTER_TYPES[monster.type].exp;
        player.experience += reward;
        player.skills.attack += 0.01 * (1 + MONSTER_TYPES[monster.type].ring / 10);
        
        // Dragon kill chance based on skill
        if (monster.type === 'DRAGON') {
          const killChance = Math.min(0.9, (player.skills.attack / 20));
          const succeeded = Math.random() < killChance;
          if (succeeded) {
            player.experience += 500; // Bonus for dragon
            console.log(`🐉 ${player.name} defeated a DRAGON! (${Math.floor(killChance * 100)}% chance)`);
          }
        }

        io.emit('monster-died', {
          id: data.monsterId,
          killedBy: socket.id,
          reward: reward,
          x: monster.x,
          y: monster.y
        });
        monsters.delete(data.monsterId);
      } else {
        io.emit('combat-event', {
          type: 'player-attack',
          attacker: { id: socket.id, name: player.name },
          defender: { id: data.monsterId, type: monster.type },
          damage: damage,
          targetHealth: monster.health
        });
      }
    }
  });

  socket.on('disconnect', () => {
    const player = players.get(socket.id);
    if (player) {
      console.log(`🔴 ${player.name} disconnected`);
      players.delete(socket.id);
      io.emit('player-left', { id: socket.id });
    }
  });
});

// Start server
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`\n🎮 ==========================================");
  console.log(`🎮 MMO RPG - Genga in Another World`);
  console.log(`🎮 Server running on http://localhost:${PORT}`);
  console.log(`🎮 ========================================"\n`);
});
