# Chronocraft: Life RPG

An immersive Life RPG converting daily productivity, habits, and tasks into an engaging virtual progression system with non-linear leveling, character stats, boss battles, shop economy, and real SQLite relational database persistence.

---

## ⚔️ The Core Problem Solved

Traditional habit trackers and to-do lists suffer from a "delayed gratification" bottleneck: going to the gym, writing code, or meditating takes months to show real-world progress. Video games solve this by providing instant dopamine, tangible progression, and tactile feedback.

**Chronocraft** bridges this chasm by transforming everyday tasks into heroic virtual victories. It couples a responsive client interface with a **secure server-side RPG progression engine** that prevents stat tampering, maintains historical logs in an SQLite database, and enforces strict user authentication.

---

## 🌟 Key Features

### 1. 🛡️ User Authentication & Security
- **Bcrypt Password Hashing & JWT Authentication**: Secure user registration and session verification.
- **Tenant Isolation**: Users can only read and mutate their own tasks, character attributes, and inventory items.
- **Instant Demo Champion**: A dedicated one-click demo login option allowing evaluators to immediately experience the app as **Sir Alden (Level 3 Iron Paladin)** with active quests, boss encounters, and equipment.

### 2. 🗄️ Relational Database & Full CRUD (SQLite)
- Backed by an atomic, file-persisted SQLite relational database (`data/chronorpg.sqlite`).
- **Complete Task CRUD**: Create, Read, Update, and Delete quests smoothly.
- **Historical Audit Logs**: Every completed quest is permanently inscribed in `task_history_logs` with timestamps, XP earned, and gold awarded.
- **Guaranteed Persistence**: Refreshes, reloads, and multi-device sessions retain all character progress and data.

### 3. 📈 Non-Linear Progression Engine (Anti-Cheat)
- **Exponential Level Thresholds**:
  $$\text{Next Level XP} = \lfloor 120 \times \text{Level}^{1.45} + 50 \rfloor$$
  Each level requires non-linearly more effort to conquer.
- **Server-Side Validation**: All XP, Gold, streak bonuses, and level-up milestones are calculated and validated strictly on the Express backend to prevent client-side cheating.
- **Stat Point Allocation**: Leveling up awards +3 unallocated training points that players can distribute across their attributes.

### 4. 🎮 Gamified RPG Elements
- **5 Core Discipline Attributes**:
  - 🧠 **Intellect**: Leveled by coding, reading, and problem solving.
  - ⚔️ **Strength**: Leveled by workouts, resistance training, and sports.
  - ❤️ **Vitality**: Leveled by sleep hygiene, hydration, and nutrition.
  - ✨ **Spirit**: Leveled by meditation, mindfulness, and journaling.
  - ⚡ **Agility**: Leveled by quick chores, errands, and inbox zero.
- **Consecutive Day Streaks**: Tracks daily consistency with a compounding reward multiplier (+5% per day, up to +50% max).
- **The Arcane Bazaar & Economy**: Earn gold coins from completed tasks to purchase weapons, armor, streak-freeze shields (*Chrono Shield*), health elixirs, and vanity badges.
- **Equipment System**: Equipping acquired gear immediately applies stat boosts to your character.

### 5. 🐉 Dungeon Boss Raids (World Encounters)
- Face titanic embodiments of procrastination (e.g. *The Procrastination Behemoth*, *The Distraction Gorgon*).
- **Real-World Kinetic Damage**: Completing tasks channels physical and magical damage equal to the XP earned directly into the active boss's health bar!
- Defeating a boss yields massive gold bounties, bonus XP, and vanity titles.

### 6. 🔊 Tactile Sound Synthesis & Particle Physics
- **Zero-Latency Web Audio API Synthesizer**: Custom sound designer (`soundEngine.ts`) synthesizing fanfare arpeggios, coin clinks, equipment whooshes, and boss hit thuds without relying on external media files. Includes persistent mute and volume controls.
- **Canvas Confetti Particle Bursts**: Celebratory particle fireworks erupt on quest completions and level-ups.

### 7. ⌨️ Accessibility & Keyboard Navigation
- Full keyboard navigation across all interactive elements.
- **Hotkeys**:
  - `N`: Inscribe new quest
  - `1`: Switch to Quest Grimoire
  - `2`: Switch to Hero Character
  - `3`: Switch to Arcane Bazaar
  - `4`: Switch to Dungeon Raid
  - `5`: Switch to Chronicles Log
  - `M`: Toggle Sound Mute
  - `Esc`: Close any open modal

---

## 🛠️ Technology Architecture

| Layer | Technology |
| :--- | :--- |
| **Frontend UI** | React 19, TypeScript, Tailwind CSS, Lucide Icons, Canvas Confetti |
| **Animation & Audio** | Motion, Web Audio API Custom Synthesizer |
| **Backend API** | Node.js, Express, tsx, esbuild |
| **Relational Database** | SQLite (via `sql.js` WASM engine with atomic file persistence) |
| **Security & Auth** | JSON Web Tokens (JWT), bcryptjs |

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ or 20+
- npm

### Installation
```bash
# 1. Install dependencies
npm install

# 2. Start development server (boots Express server with Vite middleware on port 3000)
npm run dev

# 3. Production build (compiles client bundle and bundles backend with esbuild)
npm run build

# 4. Launch production server
npm start
```

### Environment Variables
Declare required configuration in `.env`:
```env
# Port for reverse proxy (hardcoded to 3000 in AI Studio)
PORT=3000

# Secret key used to sign and verify JSON Web Tokens
JWT_SECRET=chronocraft_super_secret_jwt_key_rpg_progression_2026
```

---

## 📡 API Endpoints

- `POST /api/auth/register` — Create a new hero account
- `POST /api/auth/login` — Authenticate existing champion
- `POST /api/auth/demo` — 1-click login as Demo Champion
- `GET /api/auth/me` — Retrieve active player state, stats, and gear
- `GET /api/tasks` — List tasks with category and type filtering
- `POST /api/tasks` — Inscribe a new quest
- `PUT /api/tasks/:id` — Update quest details
- `DELETE /api/tasks/:id` — Remove a quest
- `POST /api/tasks/:id/complete` — Complete quest, award XP/Gold, damage boss, check level up
- `POST /api/character/allocate-stats` — Allocate unassigned attribute points
- `GET /api/shop/items` — Fetch bazaar catalog and player inventory
- `POST /api/shop/buy` — Purchase an item with earned gold
- `POST /api/inventory/equip` — Equip or unequip gear
- `POST /api/inventory/use` — Consume potion or streak ward
- `GET /api/boss` — Get active dungeon boss stats and health
- `GET /api/logs` — Fetch SQLite task completion chronicle logs
