# 🎮 MMO RPG - Genga in Another World

A complete 2D anime-style multiplayer RPG with procedural world generation, skill-based combat, and real-time multiplayer support.

## ✨ Features

- **2D Anime-Style Rendering**: Beautiful 3rd-person view with anime character sprites
- **Procedural World Generation**: Infinite world with procedurally generated chunks
- **7 Monster Types**: Slime, Goblin, Skeleton, Golem, Ogre, Demon, Dragon
- **Skill-Based Combat**: Combat damage based on player attack skill progression
- **Dragon Encounter**: Special mechanic - chance to defeat dragons increases with skill level
- **Real-time Multiplayer**: Multiple players exploring and fighting together
- **Procedural Spawning**: Random monster spawning with difficulty zones
- **Minimap**: Real-time minimap showing players and monsters
- **Combat Log**: Real-time combat events and notifications
- **World Zones**: Town hub → Forest rings with increasing difficulty

## 🚀 Quick Start

### Prerequisites
- Node.js (v14+)
- npm

### Installation

```bash
git clone https://github.com/keru-bit/mmo-rpg-genga-in-another-world.git
cd mmo-rpg-genga-in-another-world
npm install
```

### Running the Server

```bash
npm start
```

The server will start on `http://localhost:3000`

Open your browser and enjoy the game!

## 🎮 How to Play

1. Open `http://localhost:3000` in your browser
2. Enter your character name
3. Use **W/A/S/D** or **Arrow Keys** to move
4. **Click on monsters** to select and attack them
5. Defeat monsters to gain skill experience
6. Explore the world - difficulty increases with distance from town
7. Encounter dragons in the far reaches of the world!

## 🌍 World Generation

### Zones
- **Town Hub** (center): Safe zone at coordinates (0, 0)
- **Ring 1** (200-400 units): Slimes - Easy practice
- **Ring 2** (400-600 units): Goblins - Early game
- **Ring 3** (600-800 units): Skeletons - Intermediate
- **Ring 4** (800-1000 units): Golems - Advanced
- **Ring 5** (1000-1200 units): Ogres - Hard
- **Ring 6** (1200-1400 units): Demons - Very Hard
- **Ring 7** (1400+ units): Dragons - Extreme (Skill-based encounter)

### Procedural Features
- Seeded random generation for consistent world
- Dynamic chunk-based monster spawning
- Random monster count per chunk (2-5)
- Monster types limited by distance/skill

## 🎯 Combat System

### Skill-Based Mechanics
- **Attack Skill**: Increases damage dealt to monsters
- **Defense Skill**: Reduces incoming damage
- **Dodge Skill**: Chance to avoid attacks
- **Progression**: Skills improve as you fight

### Dragon Encounters
- Special Dragon spawning in Ring 7
- Kill chance = Player Attack Skill / 20 (max 90%)
- Defeating a dragon grants +500 bonus XP
- Dragons have 300 health and high damage output

### Monster Stats

| Type | Health | Damage | Ring | XP |
|------|--------|--------|------|----|
| Slime | 20 | 3 | 1 | 10 |
| Goblin | 35 | 8 | 2 | 25 |
| Skeleton | 50 | 12 | 3 | 40 |
| Golem | 80 | 15 | 4 | 60 |
| Ogre | 100 | 20 | 5 | 80 |
| Demon | 150 | 28 | 6 | 120 |
| Dragon | 300 | 40 | 7 | 250 |

## 🎨 UI Components

- **Minimap**: Shows player (gold), monsters (colored), other players (blue)
- **Player Stats**: Health, skills, position, experience
- **Combat Log**: Real-time combat events
- **Online Players**: List of connected players
- **Performance**: FPS counter and ping display

## 📊 Server Architecture

```
├── server.js              # Express/Socket.io backend
├── public/
│   └── index.html         # Game client with 2D canvas rendering
├── package.json           # Dependencies
└── README.md              # Documentation
```

## 🔧 Technical Details

### Rendering
- HTML5 Canvas 2D rendering
- Anime-style character sprites
- 3rd-person camera following player
- Real-time health bars above entities
- Grid-based world visualization

### Networking
- Socket.IO for real-time communication
- Chunk-based monster generation
- Server-side damage calculation (anti-cheat)
- Spatial hashing for performance

### Performance
- In-memory SQLite database
- Maximum 300 monsters on server
- Client-side render distance culling
- Optimized network data transfer

## 🎮 Controls

| Key | Action |
|-----|--------|
| W / Up Arrow | Move Up |
| A / Left Arrow | Move Left |
| S / Down Arrow | Move Down |
| D / Right Arrow | Move Right |
| Click | Select/Attack Monster |

## 🔮 Future Enhancements

- [ ] Persistent database (MongoDB/PostgreSQL)
- [ ] Guilds and parties
- [ ] Equipment and loot system
- [ ] Dungeons and bosses
- [ ] Trading system
- [ ] Leaderboards
- [ ] Quests and achievements
- [ ] PvP arenas
- [ ] More animations and effects
- [ ] Sound effects and music
- [ ] Mobile support

## 📝 Notes

- Data is stored in-memory and lost on server restart
- Supports up to 300 concurrent monsters
- Skill system allows any player to defeat any monster with enough skill
- All damage calculations are server-side for security

## 🤝 Contributing

Contributions are welcome! Feel free to open issues or submit pull requests.

## 📄 License

MIT License - Feel free to use this project for your own purposes!

---

**Made with ❤️ for anime RPG fans**

🎮 Happy Gaming! ⚔️
