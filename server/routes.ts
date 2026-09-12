import { Router, Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { getDb, saveDb } from './db.js';
import {
  calculateNextLevelXp,
  calculateTaskRewards,
  processXpGain,
  CATALOG_SHOP_ITEMS,
  WORLD_BOSS_TEMPLATES,
} from './rpgEngine.js';
import {
  suggestTaskProofRequirements,
  verifyQuestProofWithAi,
} from './gemini.js';

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || 'chronocraft_super_secret_jwt_key_rpg_progression_2026';

export interface AuthRequest extends Request {
  userId?: string;
  userEmail?: string;
}

// Authentication middleware
export function requireAuth(req: AuthRequest, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Authentication token required' });
    return;
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string; email: string };
    req.userId = decoded.userId;
    req.userEmail = decoded.email;
    next();
  } catch (err) {
    res.status(401).json({ error: 'Invalid or expired token' });
  }
}

// Helper: Run SQL query and return objects
function queryAll<T = any>(db: any, sql: string, params: any[] = []): T[] {
  const stmt = db.prepare(sql);
  stmt.bind(params);
  const results: T[] = [];
  while (stmt.step()) {
    results.push(stmt.getAsObject() as T);
  }
  stmt.free();
  return results;
}

function queryOne<T = any>(db: any, sql: string, params: any[] = []): T | null {
  const rows = queryAll<T>(db, sql, params);
  return rows.length > 0 ? rows[0] : null;
}

// Helper: Seed demo hero with rich initial data
export async function seedDemoHero(db: any): Promise<string> {
  const demoUserId = 'user_demo_hero_999';
  const existingUser = queryOne(db, 'SELECT id FROM users WHERE id = ?', [demoUserId]);
  
  if (existingUser) {
    return demoUserId;
  }

  const passwordHash = await bcrypt.hash('rpghero2026', 10);
  const now = new Date().toISOString();
  const todayDate = now.split('T')[0];

  // 1. Insert User
  db.run(
    `INSERT INTO users (id, username, email, password_hash, created_at) VALUES (?, ?, ?, ?, ?)`,
    [demoUserId, 'ChronosKnight', 'hero@chronocraft.io', passwordHash, now]
  );

  // 2. Insert Character (Level 3 Iron Paladin)
  const charId = 'char_demo_hero_999';
  db.run(
    `INSERT INTO characters (id, user_id, name, class, level, current_xp, next_level_xp, hp, max_hp, mana, max_mana, gold, gems, streak_days, last_active_date, theme, avatar_badge, avatar_icon)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      charId,
      demoUserId,
      'Sir Alden the Focused',
      'Iron Paladin',
      3,
      240,
      calculateNextLevelXp(3),
      120,
      130,
      65,
      70,
      320,
      25,
      5,
      todayDate,
      'obsidian',
      'Knight of Deep Focus',
      'shield',
    ]
  );

  // 3. Insert Stats
  db.run(
    `INSERT INTO character_stats (character_id, strength, intellect, vitality, spirit, agility, stat_points_available)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [charId, 18, 14, 16, 12, 11, 4]
  );

  // 4. Insert Starter Tasks
  const starterTasks = [
    {
      id: 'task_demo_1',
      title: 'Complete 45-min Deep Coding Session',
      description: 'Zero distractions, complete the algorithm refactoring module without checking feeds.',
      category: 'intellect',
      type: 'daily',
      difficulty: 'hard',
      xp_reward: 120,
      gold_reward: 90,
      completed: 0,
      streak_count: 5,
      due_date: todayDate,
    },
    {
      id: 'task_demo_2',
      title: 'Full Body Iron Resistance Workout',
      description: 'Squats, bench press, deadlifts, and 10 minutes stretching.',
      category: 'strength',
      type: 'daily',
      difficulty: 'hard',
      xp_reward: 120,
      gold_reward: 90,
      completed: 1,
      streak_count: 3,
      due_date: todayDate,
    },
    {
      id: 'task_demo_3',
      title: 'Hydrate 2.5 Liters of Water',
      description: 'Keep fluid levels high throughout the working day for cognitive resilience.',
      category: 'vitality',
      type: 'habit',
      difficulty: 'easy',
      xp_reward: 30,
      gold_reward: 20,
      completed: 0,
      streak_count: 7,
      due_date: todayDate,
      requires_proof: 1,
      proof_type: 'before_after_photo',
      proof_criteria: 'Upload a photo of your full water bottle before drinking, and a photo of your empty bottle after finishing it!',
    },
    {
      id: 'task_demo_4',
      title: '15 Minutes Mindful Breathwork & Reflection',
      description: 'Box breathing and evening journal gratitude entry.',
      category: 'spirit',
      type: 'habit',
      difficulty: 'easy',
      xp_reward: 30,
      gold_reward: 20,
      completed: 0,
      streak_count: 4,
      due_date: todayDate,
      requires_proof: 0,
      proof_type: 'none',
      proof_criteria: '',
    },
    {
      id: 'task_demo_5',
      title: 'Inbox Zero & Clean Physical Desk',
      description: 'Process all pending triage items and declutter keyboard surface.',
      category: 'agility',
      type: 'daily',
      difficulty: 'medium',
      xp_reward: 60,
      gold_reward: 45,
      completed: 0,
      streak_count: 2,
      due_date: todayDate,
      requires_proof: 1,
      proof_type: 'before_after_photo',
      proof_criteria: 'Upload a before photo of your workspace, and an after photo showing it tidy and organized!',
    },
    {
      id: 'task_demo_6',
      title: 'Read 25 Pages of Systems Architecture Book',
      description: 'Study chapter on distributed caching and event streaming patterns.',
      category: 'intellect',
      type: 'epic_quest',
      difficulty: 'medium',
      xp_reward: 60,
      gold_reward: 45,
      completed: 0,
      streak_count: 1,
      due_date: todayDate,
      requires_proof: 1,
      proof_type: 'single_photo',
      proof_criteria: 'Upload a photo showing the open book or summary notes you completed.',
    },
  ];

  for (const t of starterTasks) {
    db.run(
      `INSERT INTO tasks (id, user_id, title, description, category, type, difficulty, xp_reward, gold_reward, completed, streak_count, due_date, created_at, updated_at, requires_proof, proof_type, proof_criteria)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        t.id,
        demoUserId,
        t.title,
        t.description,
        t.category,
        t.type,
        t.difficulty,
        t.xp_reward,
        t.gold_reward,
        t.completed,
        t.streak_count,
        t.due_date,
        now,
        now,
        (t as any).requires_proof || 0,
        (t as any).proof_type || 'none',
        (t as any).proof_criteria || '',
      ]
    );
  }

  // 5. Insert History Log for Workout
  db.run(
    `INSERT INTO task_history_logs (id, user_id, task_id, task_title, category, xp_earned, gold_earned, completed_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    ['log_demo_1', demoUserId, 'task_demo_2', 'Full Body Iron Resistance Workout', 'strength', 135, 101, now]
  );

  // 6. Insert Starter Inventory (Equipped Aegis + 1 Elixir)
  db.run(
    `INSERT INTO inventory (id, user_id, item_id, name, type, icon, description, stat_boost_type, stat_boost_val, equipped, quantity, acquired_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      'inv_demo_1',
      demoUserId,
      'armor_aegis_discipline',
      'Aegis of Iron Discipline',
      'armor',
      'shield',
      'Hefty cuirass worn by legendary athletes. +10 Strength, +6 Vitality.',
      'strength',
      10,
      1,
      1,
      now,
    ]
  );
  db.run(
    `INSERT INTO inventory (id, user_id, item_id, name, type, icon, description, stat_boost_type, stat_boost_val, equipped, quantity, acquired_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      'inv_demo_2',
      demoUserId,
      'potion_vitality_elixir',
      'Elixir of Vitality',
      'consumable',
      'heart',
      'Instantly restores 50 HP and cleanses exhaustion.',
      'hp_heal',
      50,
      0,
      2,
      now,
    ]
  );

  // 7. Insert Active Boss Encounter
  const boss = WORLD_BOSS_TEMPLATES[0];
  db.run(
    `INSERT INTO boss_encounters (id, user_id, boss_name, boss_title, current_hp, max_hp, level, reward_xp, reward_gold, reward_badge, status, avatar)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      'boss_demo_1',
      demoUserId,
      boss.name,
      boss.title,
      365, // took some damage already
      boss.max_hp,
      boss.level,
      boss.reward_xp,
      boss.reward_gold,
      boss.reward_badge,
      'active',
      boss.avatar,
    ]
  );

  saveDb();
  return demoUserId;
}

// ----------------------------------------------------
// AUTH ROUTES
// ----------------------------------------------------

// Register new user
router.post('/auth/register', async (req: Request, res: Response) => {
  try {
    const { username, email, password, characterName, characterClass } = req.body;

    if (!username || !email || !password) {
      res.status(400).json({ error: 'Username, email, and password are required' });
      return;
    }

    if (username.trim().length < 3) {
      res.status(400).json({ error: 'Username must be at least 3 characters' });
      return;
    }

    if (password.length < 6) {
      res.status(400).json({ error: 'Password must be at least 6 characters' });
      return;
    }

    const db = await getDb();
    const existing = queryOne(
      db,
      'SELECT id FROM users WHERE username = ? OR email = ?',
      [username.trim(), email.trim().toLowerCase()]
    );

    if (existing) {
      res.status(400).json({ error: 'A hero with this username or email already exists in the realm' });
      return;
    }

    const userId = 'user_' + Date.now() + '_' + Math.random().toString(36).substring(2, 8);
    const passwordHash = await bcrypt.hash(password, 10);
    const now = new Date().toISOString();
    const todayDate = now.split('T')[0];

    db.run(
      `INSERT INTO users (id, username, email, password_hash, created_at) VALUES (?, ?, ?, ?, ?)`,
      [userId, username.trim(), email.trim().toLowerCase(), passwordHash, now]
    );

    // Create character
    const charId = 'char_' + userId;
    const charName = characterName && characterName.trim() ? characterName.trim() : username.trim();
    const charClass = characterClass || 'Arcane Scholar';

    db.run(
      `INSERT INTO characters (id, user_id, name, class, level, current_xp, next_level_xp, hp, max_hp, mana, max_mana, gold, gems, streak_days, last_active_date, theme, avatar_badge, avatar_icon)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        charId,
        userId,
        charName,
        charClass,
        1,
        0,
        calculateNextLevelXp(1),
        100,
        100,
        50,
        50,
        100,
        10,
        1,
        todayDate,
        'obsidian',
        'Novice Seeker',
        'sword',
      ]
    );

    // Character stats based on class
    let str = 10, intl = 10, vit = 10, spi = 10, agi = 10;
    if (charClass === 'Iron Paladin') { str += 4; vit += 3; }
    else if (charClass === 'Arcane Scholar') { intl += 5; spi += 2; }
    else if (charClass === 'Shadow Rogue') { agi += 5; intl += 2; }
    else if (charClass === 'Verdant Druid') { spi += 4; vit += 3; }
    else if (charClass === 'Chronomancer') { intl += 4; agi += 3; }

    db.run(
      `INSERT INTO character_stats (character_id, strength, intellect, vitality, spirit, agility, stat_points_available)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [charId, str, intl, vit, spi, agi, 3]
    );

    // Default starter quests
    const defaultQuests = [
      {
        title: 'Dawn Focus: 30 Mins Learning / Deep Work',
        desc: 'Dedicate undivided attention to reading documentation, coding, or studying.',
        cat: 'intellect',
        type: 'daily',
        diff: 'medium',
      },
      {
        title: 'Physical Vitality: 30 Mins Movement or Gym',
        desc: 'Engage muscles, cardio, or mobility work.',
        cat: 'strength',
        type: 'daily',
        diff: 'medium',
      },
      {
        title: 'Drink 2L Pure Water',
        desc: 'Replenish bodily mana and physical stamina.',
        cat: 'vitality',
        type: 'habit',
        diff: 'easy',
      },
      {
        title: 'Night Meditation & Reflection',
        desc: 'Review daily triumphs and quiet the mind.',
        cat: 'spirit',
        type: 'habit',
        diff: 'easy',
      },
    ];

    for (const q of defaultQuests) {
      const rewards = calculateTaskRewards(q.diff, 1);
      const taskId = 'task_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7);
      db.run(
        `INSERT INTO tasks (id, user_id, title, description, category, type, difficulty, xp_reward, gold_reward, completed, streak_count, due_date, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [taskId, userId, q.title, q.desc, q.cat, q.type, q.diff, rewards.xp, rewards.gold, 0, 0, todayDate, now, now]
      );
    }

    // Assign starter boss
    const firstBoss = WORLD_BOSS_TEMPLATES[0];
    db.run(
      `INSERT INTO boss_encounters (id, user_id, boss_name, boss_title, current_hp, max_hp, level, reward_xp, reward_gold, reward_badge, status, avatar)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        'boss_' + userId,
        userId,
        firstBoss.name,
        firstBoss.title,
        firstBoss.max_hp,
        firstBoss.max_hp,
        firstBoss.level,
        firstBoss.reward_xp,
        firstBoss.reward_gold,
        firstBoss.reward_badge,
        'active',
        firstBoss.avatar,
      ]
    );

    saveDb();

    const token = jwt.sign({ userId, email: email.trim().toLowerCase() }, JWT_SECRET, { expiresIn: '7d' });

    res.json({
      token,
      user: { id: userId, username: username.trim(), email: email.trim().toLowerCase() },
      message: 'Welcome to the Realm of Chronocraft!',
    });
  } catch (err: any) {
    console.error('Register error:', err);
    res.status(500).json({ error: 'Registration failed. Please try again.' });
  }
});

// Login
router.post('/auth/login', async (req: Request, res: Response) => {
  try {
    const { login, password } = req.body;
    if (!login || !password) {
      res.status(400).json({ error: 'Username/email and password required' });
      return;
    }

    const db = await getDb();
    const user = queryOne(
      db,
      'SELECT * FROM users WHERE username = ? OR email = ?',
      [login.trim(), login.trim().toLowerCase()]
    );

    if (!user) {
      res.status(401).json({ error: 'Invalid credentials. Hero not found.' });
      return;
    }

    const isValid = await bcrypt.compare(password, user.password_hash);
    if (!isValid) {
      res.status(401).json({ error: 'Invalid credentials. Password incorrect.' });
      return;
    }

    const token = jwt.sign({ userId: user.id, email: user.email }, JWT_SECRET, { expiresIn: '7d' });

    res.json({
      token,
      user: { id: user.id, username: user.username, email: user.email },
      message: 'Welcome back, Champion!',
    });
  } catch (err: any) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Authentication failed' });
  }
});

// 1-Click Demo Login (for evaluators / judges)
router.post('/auth/demo', async (_req: Request, res: Response) => {
  try {
    const db = await getDb();
    const demoUserId = await seedDemoHero(db);
    const user = queryOne(db, 'SELECT * FROM users WHERE id = ?', [demoUserId]);

    const token = jwt.sign({ userId: user.id, email: user.email }, JWT_SECRET, { expiresIn: '7d' });

    res.json({
      token,
      user: { id: user.id, username: user.username, email: user.email },
      message: 'Logged in as Demo Champion: Sir Alden the Focused',
    });
  } catch (err: any) {
    console.error('Demo login error:', err);
    res.status(500).json({ error: 'Failed to initialize demo player' });
  }
});

// Get current user profile and character state
router.get('/auth/me', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const db = await getDb();
    const user = queryOne(db, 'SELECT id, username, email, created_at FROM users WHERE id = ?', [req.userId]);
    if (!user) {
      res.status(404).json({ error: 'Hero not found' });
      return;
    }

    const character = queryOne(db, 'SELECT * FROM characters WHERE user_id = ?', [req.userId]);
    let stats = null;
    if (character) {
      stats = queryOne(db, 'SELECT * FROM character_stats WHERE character_id = ?', [character.id]);
    }

    // Check equipped items for stat bonuses
    const equippedItems = queryAll(db, 'SELECT * FROM inventory WHERE user_id = ? AND equipped = 1', [req.userId]);

    res.json({
      user,
      character,
      stats,
      equippedItems,
    });
  } catch (err: any) {
    console.error('Get me error:', err);
    res.status(500).json({ error: 'Failed to fetch hero state' });
  }
});

// ----------------------------------------------------
// CHARACTER & PROGRESSION ROUTES
// ----------------------------------------------------

// Allocate stat points
router.post('/character/allocate-stats', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const { strength = 0, intellect = 0, vitality = 0, spirit = 0, agility = 0 } = req.body;
    const totalToAllocate = strength + intellect + vitality + spirit + agility;

    if (totalToAllocate <= 0) {
      res.status(400).json({ error: 'No stat points requested' });
      return;
    }

    const db = await getDb();
    const character = queryOne(db, 'SELECT id FROM characters WHERE user_id = ?', [req.userId]);
    if (!character) {
      res.status(404).json({ error: 'Character not found' });
      return;
    }

    const stats = queryOne(db, 'SELECT * FROM character_stats WHERE character_id = ?', [character.id]);
    if (!stats || stats.stat_points_available < totalToAllocate) {
      res.status(400).json({ error: 'Not enough available stat points' });
      return;
    }

    const newStr = stats.strength + strength;
    const newInt = stats.intellect + intellect;
    const newVit = stats.vitality + vitality;
    const newSpi = stats.spirit + spirit;
    const newAgi = stats.agility + agility;
    const newAvailable = stats.stat_points_available - totalToAllocate;

    db.run(
      `UPDATE character_stats SET strength = ?, intellect = ?, vitality = ?, spirit = ?, agility = ?, stat_points_available = ? WHERE character_id = ?`,
      [newStr, newInt, newVit, newSpi, newAgi, newAvailable, character.id]
    );

    // If vitality increased, boost max HP
    if (vitality > 0) {
      db.run(
        `UPDATE characters SET max_hp = max_hp + ?, hp = hp + ? WHERE id = ?`,
        [vitality * 5, vitality * 5, character.id]
      );
    }
    // If spirit/intellect increased, boost max Mana
    if (intellect > 0 || spirit > 0) {
      const manaBoost = (intellect + spirit) * 3;
      db.run(
        `UPDATE characters SET max_mana = max_mana + ?, mana = mana + ? WHERE id = ?`,
        [manaBoost, manaBoost, character.id]
      );
    }

    saveDb();

    const updatedCharacter = queryOne(db, 'SELECT * FROM characters WHERE id = ?', [character.id]);
    const updatedStats = queryOne(db, 'SELECT * FROM character_stats WHERE character_id = ?', [character.id]);

    res.json({
      message: 'Attributes successfully reinforced!',
      character: updatedCharacter,
      stats: updatedStats,
    });
  } catch (err: any) {
    console.error('Stat allocate error:', err);
    res.status(500).json({ error: 'Failed to allocate stat points' });
  }
});

// Update character cosmetic theme / icon
router.patch('/character/settings', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const { theme, avatar_icon, name } = req.body;
    const db = await getDb();
    
    if (theme) {
      db.run('UPDATE characters SET theme = ? WHERE user_id = ?', [theme, req.userId]);
    }
    if (avatar_icon) {
      db.run('UPDATE characters SET avatar_icon = ? WHERE user_id = ?', [avatar_icon, req.userId]);
    }
    if (name && name.trim()) {
      db.run('UPDATE characters SET name = ? WHERE user_id = ?', [name.trim(), req.userId]);
    }

    saveDb();
    const character = queryOne(db, 'SELECT * FROM characters WHERE user_id = ?', [req.userId]);
    res.json({ character });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to update character settings' });
  }
});

// ----------------------------------------------------
// TASK CRUD & RPG COMPLETION ENGINE
// ----------------------------------------------------

// List all tasks for user
router.get('/tasks', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const db = await getDb();
    const { type, category } = req.query;

    let sql = 'SELECT * FROM tasks WHERE user_id = ?';
    const params: any[] = [req.userId];

    if (type) {
      sql += ' AND type = ?';
      params.push(type);
    }
    if (category) {
      sql += ' AND category = ?';
      params.push(category);
    }

    sql += ' ORDER BY completed ASC, created_at DESC';

    const rawTasks = queryAll(db, sql, params);
    const tasks = rawTasks.map((t: any) => {
      let last_proof = undefined;
      if (t.last_proof) {
        try {
          last_proof = typeof t.last_proof === 'string' ? JSON.parse(t.last_proof) : t.last_proof;
        } catch {
          last_proof = undefined;
        }
      }
      return {
        ...t,
        requires_proof: Boolean(t.requires_proof),
        proof_type: t.proof_type || 'none',
        proof_criteria: t.proof_criteria || '',
        last_proof,
      };
    });
    res.json({ tasks });
  } catch (err: any) {
    console.error('Fetch tasks error:', err);
    res.status(500).json({ error: 'Failed to load quests' });
  }
});

// Create task
router.post('/tasks', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const {
      title,
      description,
      category,
      type = 'daily',
      difficulty = 'medium',
      due_date,
      requires_proof = false,
      proof_type = 'none',
      proof_criteria = '',
    } = req.body;

    if (!title || !title.trim()) {
      res.status(400).json({ error: 'Quest title is required' });
      return;
    }

    const validCategories = ['intellect', 'strength', 'vitality', 'spirit', 'agility'];
    const validCategory = validCategories.includes(category) ? category : 'intellect';
    const validDifficulty = ['trivial', 'easy', 'medium', 'hard', 'legendary'].includes(difficulty)
      ? difficulty
      : 'medium';

    const db = await getDb();
    const character = queryOne(db, 'SELECT streak_days FROM characters WHERE user_id = ?', [req.userId]);
    const streak = character ? character.streak_days : 0;

    const { xp, gold } = calculateTaskRewards(validDifficulty, streak);
    const taskId = 'task_' + Date.now() + '_' + Math.random().toString(36).substring(2, 8);
    const now = new Date().toISOString();
    const today = now.split('T')[0];

    db.run(
      `INSERT INTO tasks (id, user_id, title, description, category, type, difficulty, xp_reward, gold_reward, completed, streak_count, due_date, created_at, updated_at, requires_proof, proof_type, proof_criteria)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        taskId,
        req.userId,
        title.trim(),
        description ? description.trim() : '',
        validCategory,
        type,
        validDifficulty,
        xp,
        gold,
        0,
        0,
        due_date || today,
        now,
        now,
        requires_proof ? 1 : 0,
        proof_type,
        proof_criteria ? proof_criteria.trim() : '',
      ]
    );

    saveDb();
    const createdTask = queryOne(db, 'SELECT * FROM tasks WHERE id = ?', [taskId]);
    if (createdTask) {
      createdTask.requires_proof = Boolean(createdTask.requires_proof);
    }

    res.status(201).json({
      message: 'Quest inscribed into your grimoire!',
      task: createdTask,
    });
  } catch (err: any) {
    console.error('Create task error:', err);
    res.status(500).json({ error: 'Failed to create quest' });
  }
});

// Update task
router.put('/tasks/:id', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const {
      title,
      description,
      category,
      type,
      difficulty,
      due_date,
      requires_proof,
      proof_type,
      proof_criteria,
    } = req.body;

    const db = await getDb();
    const existing = queryOne(db, 'SELECT * FROM tasks WHERE id = ? AND user_id = ?', [id, req.userId]);
    if (!existing) {
      res.status(404).json({ error: 'Quest not found or unauthorized' });
      return;
    }

    const updatedTitle = title !== undefined ? title.trim() : existing.title;
    const updatedDesc = description !== undefined ? description.trim() : existing.description;
    const updatedCat = category || existing.category;
    const updatedType = type || existing.type;
    const updatedDiff = difficulty || existing.difficulty;
    const updatedReqProof = requires_proof !== undefined ? (requires_proof ? 1 : 0) : existing.requires_proof;
    const updatedProofType = proof_type !== undefined ? proof_type : (existing.proof_type || 'none');
    const updatedProofCrit = proof_criteria !== undefined ? proof_criteria.trim() : (existing.proof_criteria || '');

    // Recalculate rewards if difficulty changed
    const character = queryOne(db, 'SELECT streak_days FROM characters WHERE user_id = ?', [req.userId]);
    const { xp, gold } = calculateTaskRewards(updatedDiff, character?.streak_days || 0);
    const now = new Date().toISOString();

    db.run(
      `UPDATE tasks SET title = ?, description = ?, category = ?, type = ?, difficulty = ?, xp_reward = ?, gold_reward = ?, due_date = ?, requires_proof = ?, proof_type = ?, proof_criteria = ?, updated_at = ? WHERE id = ?`,
      [
        updatedTitle,
        updatedDesc,
        updatedCat,
        updatedType,
        updatedDiff,
        xp,
        gold,
        due_date || existing.due_date,
        updatedReqProof,
        updatedProofType,
        updatedProofCrit,
        now,
        id,
      ]
    );

    saveDb();
    const updated = queryOne(db, 'SELECT * FROM tasks WHERE id = ?', [id]);
    if (updated) {
      updated.requires_proof = Boolean(updated.requires_proof);
      if (updated.last_proof) {
        try {
          updated.last_proof = JSON.parse(updated.last_proof);
        } catch {}
      }
    }
    res.json({ message: 'Quest updated', task: updated });
  } catch (err: any) {
    console.error('Update task error:', err);
    res.status(500).json({ error: 'Failed to update quest' });
  }
});

// Delete task
router.delete('/tasks/:id', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const db = await getDb();

    const existing = queryOne(db, 'SELECT id FROM tasks WHERE id = ? AND user_id = ?', [id, req.userId]);
    if (!existing) {
      res.status(404).json({ error: 'Quest not found or unauthorized' });
      return;
    }

    db.run('DELETE FROM tasks WHERE id = ?', [id]);
    saveDb();

    res.json({ message: 'Quest vanished into the ether', id });
  } catch (err: any) {
    console.error('Delete task error:', err);
    res.status(500).json({ error: 'Failed to delete quest' });
  }
});

// Complete Task (RPG Logic Engine)
router.post('/tasks/:id/complete', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const {
      proof_verified = false,
      proof_feedback = '',
      proof_type = '',
      before_image_url = '',
      after_image_url = '',
      user_note = '',
      confidence = 90,
    } = req.body || {};

    const db = await getDb();

    const task = queryOne(db, 'SELECT * FROM tasks WHERE id = ? AND user_id = ?', [id, req.userId]);
    if (!task) {
      res.status(404).json({ error: 'Quest not found' });
      return;
    }

    if (task.completed === 1) {
      res.status(400).json({ error: 'Quest has already been conquered today' });
      return;
    }

    const character = queryOne(db, 'SELECT * FROM characters WHERE user_id = ?', [req.userId]);
    if (!character) {
      res.status(404).json({ error: 'Hero not found' });
      return;
    }

    const now = new Date().toISOString();
    const today = now.split('T')[0];

    // Calculate XP and Gold with streak bonuses
    const { xp: earnedXp, gold: earnedGold } = calculateTaskRewards(task.difficulty, character.streak_days);

    // Update streak if active on a new calendar date
    let newStreak = character.streak_days;
    if (character.last_active_date !== today) {
      const lastDate = new Date(character.last_active_date);
      const currentDate = new Date(today);
      const diffDays = Math.floor((currentDate.getTime() - lastDate.getTime()) / (1000 * 3600 * 24));

      if (diffDays === 1) {
        newStreak += 1;
      } else if (diffDays > 1) {
        // Check if user owns a streak shield
        const shield = queryOne(
          db,
          `SELECT * FROM inventory WHERE user_id = ? AND item_id = 'item_streak_chronosphere' AND quantity > 0`,
          [req.userId]
        );
        if (shield) {
          // Consume shield to preserve streak
          if (shield.quantity > 1) {
            db.run(`UPDATE inventory SET quantity = quantity - 1 WHERE id = ?`, [shield.id]);
          } else {
            db.run(`DELETE FROM inventory WHERE id = ?`, [shield.id]);
          }
          newStreak += 1;
        } else {
          newStreak = 1;
        }
      }
    }

    // Process Level Progression
    const progression = processXpGain(
      character.level,
      character.current_xp,
      earnedXp,
      character.hp,
      character.max_hp,
      character.mana,
      character.max_mana
    );

    const newGold = character.gold + earnedGold;

    // Update Character
    db.run(
      `UPDATE characters SET
        level = ?,
        current_xp = ?,
        next_level_xp = ?,
        hp = ?,
        max_hp = ?,
        mana = ?,
        max_mana = ?,
        gold = ?,
        streak_days = ?,
        last_active_date = ?
       WHERE id = ?`,
      [
        progression.level,
        progression.currentXp,
        progression.nextLevelXp,
        progression.newHp,
        progression.newMaxHp,
        progression.newMana,
        progression.newMaxMana,
        newGold,
        newStreak,
        today,
        character.id,
      ]
    );

    // If leveled up, grant stat points (+3 per level)
    if (progression.leveledUp) {
      db.run(
        `UPDATE character_stats SET stat_points_available = stat_points_available + ? WHERE character_id = ?`,
        [progression.levelsGained * 3, character.id]
      );
    }

    // Increment corresponding attribute stat progress or stat directly
    const categoryToStat: Record<string, string> = {
      intellect: 'intellect',
      strength: 'strength',
      vitality: 'vitality',
      spirit: 'spirit',
      agility: 'agility',
    };
    const targetStat = categoryToStat[task.category] || 'intellect';
    // Every completion also adds +1 directly to the related attribute!
    db.run(`UPDATE character_stats SET ${targetStat} = ${targetStat} + 1 WHERE character_id = ?`, [character.id]);

    // Prepare proof object if provided
    let lastProofJson: string | null = null;
    if (proof_feedback || before_image_url || after_image_url || user_note) {
      lastProofJson = JSON.stringify({
        verified: Boolean(proof_verified),
        feedback: proof_feedback || 'Quest proof successfully verified!',
        confidence,
        verified_at: now,
        before_image_url,
        after_image_url,
        user_note,
      });
    }

    // Mark task completed and increment streak
    db.run(
      `UPDATE tasks SET completed = 1, streak_count = streak_count + 1, last_proof = ?, updated_at = ? WHERE id = ?`,
      [lastProofJson || task.last_proof, now, id]
    );

    // Write to audit log
    const logId = 'log_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7);
    db.run(
      `INSERT INTO task_history_logs (id, user_id, task_id, task_title, category, xp_earned, gold_earned, completed_at, proof_verified, proof_feedback, proof_type, before_image_url, after_image_url)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        logId,
        req.userId,
        task.id,
        task.title,
        task.category,
        earnedXp,
        earnedGold,
        now,
        proof_verified ? 1 : 0,
        proof_feedback || '',
        proof_type || task.proof_type || 'none',
        before_image_url || '',
        after_image_url || '',
      ]
    );

    // Deal damage to active world boss
    let bossResult: any = null;
    const activeBoss = queryOne(db, 'SELECT * FROM boss_encounters WHERE user_id = ? AND status = "active"', [req.userId]);
    if (activeBoss) {
      const damageDealt = earnedXp;
      const remainingHp = Math.max(0, activeBoss.current_hp - damageDealt);
      let defeated = false;

      if (remainingHp <= 0) {
        defeated = true;
        // Mark boss defeated
        db.run('UPDATE boss_encounters SET current_hp = 0, status = "defeated" WHERE id = ?', [activeBoss.id]);
        // Award boss rewards
        db.run('UPDATE characters SET gold = gold + ?, current_xp = current_xp + ? WHERE id = ?', [
          activeBoss.reward_gold,
          activeBoss.reward_xp,
          character.id,
        ]);

        // Spawn next boss from templates
        const nextBossIndex = activeBoss.level % WORLD_BOSS_TEMPLATES.length;
        const nextBossTemplate = WORLD_BOSS_TEMPLATES[nextBossIndex];
        const nextBossId = 'boss_' + Date.now();
        db.run(
          `INSERT INTO boss_encounters (id, user_id, boss_name, boss_title, current_hp, max_hp, level, reward_xp, reward_gold, reward_badge, status, avatar)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            nextBossId,
            req.userId,
            nextBossTemplate.name,
            nextBossTemplate.title,
            nextBossTemplate.max_hp,
            nextBossTemplate.max_hp,
            activeBoss.level + 1,
            nextBossTemplate.reward_xp,
            nextBossTemplate.reward_gold,
            nextBossTemplate.reward_badge,
            'active',
            nextBossTemplate.avatar,
          ]
        );

        bossResult = {
          defeated: true,
          bossName: activeBoss.boss_name,
          rewardXp: activeBoss.reward_xp,
          rewardGold: activeBoss.reward_gold,
          rewardBadge: activeBoss.reward_badge,
          damageDealt,
        };
      } else {
        db.run('UPDATE boss_encounters SET current_hp = ? WHERE id = ?', [remainingHp, activeBoss.id]);
        bossResult = {
          defeated: false,
          bossName: activeBoss.boss_name,
          damageDealt,
          remainingHp,
          maxHp: activeBoss.max_hp,
        };
      }
    }

    saveDb();

    // Fetch refreshed states
    const updatedCharacter = queryOne(db, 'SELECT * FROM characters WHERE id = ?', [character.id]);
    const updatedStats = queryOne(db, 'SELECT * FROM character_stats WHERE character_id = ?', [character.id]);
    const updatedTask = queryOne(db, 'SELECT * FROM tasks WHERE id = ?', [id]);

    res.json({
      success: true,
      earnedXp,
      earnedGold,
      leveledUp: progression.leveledUp,
      levelsGained: progression.levelsGained,
      newLevel: progression.level,
      streakDays: newStreak,
      statBoosted: targetStat,
      bossResult,
      character: updatedCharacter,
      stats: updatedStats,
      task: updatedTask,
    });
  } catch (err: any) {
    console.error('Complete task error:', err);
    res.status(500).json({ error: 'Failed to complete quest' });
  }
});

// ----------------------------------------------------
// SHOP & INVENTORY ROUTES
// ----------------------------------------------------

// Get shop items & user inventory
router.get('/shop/items', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const db = await getDb();
    const inventory = queryAll(db, 'SELECT * FROM inventory WHERE user_id = ?', [req.userId]);
    const character = queryOne(db, 'SELECT gold, level FROM characters WHERE user_id = ?', [req.userId]);

    res.json({
      catalog: CATALOG_SHOP_ITEMS,
      inventory,
      playerGold: character ? character.gold : 0,
      playerLevel: character ? character.level : 1,
    });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to fetch bazaar catalog' });
  }
});

// Buy item
router.post('/shop/buy', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const { itemId } = req.body;
    const item = CATALOG_SHOP_ITEMS.find((i) => i.id === itemId);

    if (!item) {
      res.status(404).json({ error: 'Artifact not found in bazaar' });
      return;
    }

    const db = await getDb();
    const character = queryOne(db, 'SELECT * FROM characters WHERE user_id = ?', [req.userId]);

    if (!character || character.gold < item.cost) {
      res.status(400).json({ error: 'Insufficient gold coins to purchase this artifact' });
      return;
    }

    // Deduct gold
    db.run('UPDATE characters SET gold = gold - ? WHERE id = ?', [item.cost, character.id]);

    const now = new Date().toISOString();

    // Check if user already owns non-consumable item
    if (item.type !== 'consumable') {
      const existing = queryOne(
        db,
        'SELECT id FROM inventory WHERE user_id = ? AND item_id = ?',
        [req.userId, item.id]
      );
      if (existing) {
        res.status(400).json({ error: 'You already possess this unique artifact' });
        return;
      }

      const invId = 'inv_' + Date.now();
      db.run(
        `INSERT INTO inventory (id, user_id, item_id, name, type, icon, description, stat_boost_type, stat_boost_val, equipped, quantity, acquired_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          invId,
          req.userId,
          item.id,
          item.name,
          item.type,
          item.icon,
          item.description,
          item.stat_boost_type,
          item.stat_boost_val,
          0,
          1,
          now,
        ]
      );
    } else {
      // Consumable items can stack
      const existing = queryOne(
        db,
        'SELECT id, quantity FROM inventory WHERE user_id = ? AND item_id = ?',
        [req.userId, item.id]
      );
      if (existing) {
        db.run('UPDATE inventory SET quantity = quantity + 1 WHERE id = ?', [existing.id]);
      } else {
        const invId = 'inv_' + Date.now();
        db.run(
          `INSERT INTO inventory (id, user_id, item_id, name, type, icon, description, stat_boost_type, stat_boost_val, equipped, quantity, acquired_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            invId,
            req.userId,
            item.id,
            item.name,
            item.type,
            item.icon,
            item.description,
            item.stat_boost_type,
            item.stat_boost_val,
            0,
            1,
            now,
          ]
        );
      }
    }

    saveDb();

    const updatedCharacter = queryOne(db, 'SELECT * FROM characters WHERE id = ?', [character.id]);
    const inventory = queryAll(db, 'SELECT * FROM inventory WHERE user_id = ?', [req.userId]);

    res.json({
      message: `${item.name} acquired!`,
      character: updatedCharacter,
      inventory,
    });
  } catch (err: any) {
    console.error('Shop buy error:', err);
    res.status(500).json({ error: 'Purchase transaction failed' });
  }
});

// Equip or Unequip Item
router.post('/inventory/equip', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const { inventoryId } = req.body;
    const db = await getDb();

    const item = queryOne(db, 'SELECT * FROM inventory WHERE id = ? AND user_id = ?', [inventoryId, req.userId]);
    if (!item) {
      res.status(404).json({ error: 'Item not found in your inventory' });
      return;
    }

    if (item.type === 'consumable') {
      res.status(400).json({ error: 'Consumables must be consumed, not equipped' });
      return;
    }

    const newEquipped = item.equipped === 1 ? 0 : 1;

    // If equipping, unequip any other item of the same slot type (e.g. only 1 weapon, 1 armor)
    if (newEquipped === 1) {
      db.run('UPDATE inventory SET equipped = 0 WHERE user_id = ? AND type = ?', [req.userId, item.type]);
    }

    db.run('UPDATE inventory SET equipped = ? WHERE id = ?', [newEquipped, inventoryId]);
    saveDb();

    const inventory = queryAll(db, 'SELECT * FROM inventory WHERE user_id = ?', [req.userId]);
    res.json({
      message: newEquipped ? `${item.name} donned!` : `${item.name} unequipped`,
      inventory,
    });
  } catch (err: any) {
    console.error('Equip error:', err);
    res.status(500).json({ error: 'Failed to adjust equipment' });
  }
});

// Use consumable item (Potion / Elixir)
router.post('/inventory/use', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const { inventoryId } = req.body;
    const db = await getDb();

    const item = queryOne(db, 'SELECT * FROM inventory WHERE id = ? AND user_id = ?', [inventoryId, req.userId]);
    if (!item || item.quantity <= 0) {
      res.status(404).json({ error: 'Consumable item depleted or missing' });
      return;
    }

    const character = queryOne(db, 'SELECT * FROM characters WHERE user_id = ?', [req.userId]);
    let appliedEffect = '';

    if (item.stat_boost_type === 'hp_heal') {
      const restored = Math.min(character.max_hp, character.hp + item.stat_boost_val);
      db.run('UPDATE characters SET hp = ? WHERE id = ?', [restored, character.id]);
      appliedEffect = `Restored HP to ${restored}/${character.max_hp}!`;
    } else if (item.stat_boost_type === 'mana_heal') {
      const restored = Math.min(character.max_mana, character.mana + item.stat_boost_val);
      db.run('UPDATE characters SET mana = ? WHERE id = ?', [restored, character.id]);
      appliedEffect = `Restored Mana to ${restored}/${character.max_mana}!`;
    } else if (item.stat_boost_type === 'streak_shield') {
      appliedEffect = 'Chrono Shield active! Your streak is shielded from any missed days.';
    }

    // Decrement quantity
    if (item.quantity > 1) {
      db.run('UPDATE inventory SET quantity = quantity - 1 WHERE id = ?', [item.id]);
    } else {
      db.run('DELETE FROM inventory WHERE id = ?', [item.id]);
    }

    saveDb();

    const updatedChar = queryOne(db, 'SELECT * FROM characters WHERE id = ?', [character.id]);
    const inventory = queryAll(db, 'SELECT * FROM inventory WHERE user_id = ?', [req.userId]);

    res.json({
      message: appliedEffect,
      character: updatedChar,
      inventory,
    });
  } catch (err: any) {
    console.error('Consume error:', err);
    res.status(500).json({ error: 'Failed to use consumable item' });
  }
});

// ----------------------------------------------------
// BOSS ENCOUNTER & HISTORY LOGS
// ----------------------------------------------------

// Get current active boss
router.get('/boss', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const db = await getDb();
    let boss = queryOne(db, 'SELECT * FROM boss_encounters WHERE user_id = ? AND status = "active"', [req.userId]);
    
    if (!boss) {
      // Spawn level 1 boss if none exists
      const template = WORLD_BOSS_TEMPLATES[0];
      const bossId = 'boss_' + Date.now();
      db.run(
        `INSERT INTO boss_encounters (id, user_id, boss_name, boss_title, current_hp, max_hp, level, reward_xp, reward_gold, reward_badge, status, avatar)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [bossId, req.userId, template.name, template.title, template.max_hp, template.max_hp, template.level, template.reward_xp, template.reward_gold, template.reward_badge, 'active', template.avatar]
      );
      saveDb();
      boss = queryOne(db, 'SELECT * FROM boss_encounters WHERE id = ?', [bossId]);
    }

    const defeatedCount = queryOne(db, 'SELECT COUNT(*) as count FROM boss_encounters WHERE user_id = ? AND status = "defeated"', [req.userId]);

    res.json({ boss, defeatedBossesCount: defeatedCount ? defeatedCount.count : 0 });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to load boss encounter' });
  }
});

// Get task completion history logs
router.get('/logs', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const db = await getDb();
    const logs = queryAll(
      db,
      'SELECT * FROM task_history_logs WHERE user_id = ? ORDER BY completed_at DESC LIMIT 50',
      [req.userId]
    );
    res.json({ logs });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to load chronicles' });
  }
});

// ----------------------------------------------------
// AI QUEST & PROOF ENGINE (Powered by Gemini 3.8 Flash)
// ----------------------------------------------------

// Suggest proof requirements for a quest
router.post('/ai/suggest-proof', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const { title, category, description } = req.body;
    if (!title || !title.trim()) {
      res.status(400).json({ error: 'Quest title is required' });
      return;
    }

    const suggestion = await suggestTaskProofRequirements(title.trim(), category, description);
    res.json(suggestion);
  } catch (err: any) {
    console.error('AI suggest proof error:', err);
    res.status(500).json({ error: 'Failed to generate AI proof suggestion' });
  }
});

// Verify quest proof photos with multimodal AI
router.post('/ai/verify-proof', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const {
      taskTitle,
      taskDescription,
      proofCriteria,
      proofType = 'single_photo',
      beforeImageBase64,
      afterImageBase64,
      userNote,
    } = req.body;

    if (!taskTitle) {
      res.status(400).json({ error: 'Task title is required for verification' });
      return;
    }

    const result = await verifyQuestProofWithAi({
      taskTitle,
      taskDescription,
      proofCriteria: proofCriteria || 'Show proof that the quest was completed',
      proofType,
      beforeImageBase64,
      afterImageBase64,
      userNote,
    });

    res.json(result);
  } catch (err: any) {
    console.error('AI verify proof error:', err);
    res.status(500).json({ error: 'Failed to verify quest proof' });
  }
});

export default router;
