import initSqlJs, { Database } from 'sql.js';
import fs from 'fs';
import path from 'path';

let dbInstance: Database | null = null;
const DATA_DIR = path.join(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'chronorpg.sqlite');

export async function getDb(): Promise<Database> {
  if (dbInstance) {
    return dbInstance;
  }

  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }

  const SQL = await initSqlJs();

  if (fs.existsSync(DB_FILE)) {
    try {
      const fileBuffer = fs.readFileSync(DB_FILE);
      dbInstance = new SQL.Database(fileBuffer);
      initSchema(dbInstance);
      return dbInstance;
    } catch (err) {
      console.error('Error loading existing SQLite file, creating new:', err);
      dbInstance = new SQL.Database();
      initSchema(dbInstance);
      saveDb();
      return dbInstance;
    }
  } else {
    dbInstance = new SQL.Database();
    initSchema(dbInstance);
    saveDb();
    return dbInstance;
  }
}

export function saveDb(): void {
  if (!dbInstance) return;
  try {
    const data = dbInstance.export();
    const buffer = Buffer.from(data);
    fs.writeFileSync(DB_FILE, buffer);
  } catch (err) {
    console.error('Failed to save SQLite database to disk:', err);
  }
}

function initSchema(db: Database): void {
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      username TEXT UNIQUE NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS characters (
      id TEXT PRIMARY KEY,
      user_id TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      class TEXT NOT NULL,
      level INTEGER NOT NULL DEFAULT 1,
      current_xp INTEGER NOT NULL DEFAULT 0,
      next_level_xp INTEGER NOT NULL DEFAULT 170,
      hp INTEGER NOT NULL DEFAULT 100,
      max_hp INTEGER NOT NULL DEFAULT 100,
      mana INTEGER NOT NULL DEFAULT 50,
      max_mana INTEGER NOT NULL DEFAULT 50,
      gold INTEGER NOT NULL DEFAULT 150,
      gems INTEGER NOT NULL DEFAULT 15,
      streak_days INTEGER NOT NULL DEFAULT 1,
      last_active_date TEXT NOT NULL,
      theme TEXT NOT NULL DEFAULT 'obsidian',
      avatar_badge TEXT NOT NULL DEFAULT 'Novice Seeker',
      avatar_icon TEXT NOT NULL DEFAULT 'sword',
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS character_stats (
      character_id TEXT PRIMARY KEY,
      strength INTEGER NOT NULL DEFAULT 10,
      intellect INTEGER NOT NULL DEFAULT 10,
      vitality INTEGER NOT NULL DEFAULT 10,
      spirit INTEGER NOT NULL DEFAULT 10,
      agility INTEGER NOT NULL DEFAULT 10,
      stat_points_available INTEGER NOT NULL DEFAULT 0,
      FOREIGN KEY (character_id) REFERENCES characters(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS tasks (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      title TEXT NOT NULL,
      description TEXT,
      category TEXT NOT NULL,
      type TEXT NOT NULL,
      difficulty TEXT NOT NULL,
      xp_reward INTEGER NOT NULL,
      gold_reward INTEGER NOT NULL,
      completed INTEGER NOT NULL DEFAULT 0,
      streak_count INTEGER NOT NULL DEFAULT 0,
      due_date TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      requires_proof INTEGER DEFAULT 0,
      proof_type TEXT DEFAULT 'none',
      proof_criteria TEXT,
      last_proof TEXT,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS task_history_logs (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      task_id TEXT,
      task_title TEXT NOT NULL,
      category TEXT NOT NULL,
      xp_earned INTEGER NOT NULL,
      gold_earned INTEGER NOT NULL,
      completed_at TEXT NOT NULL,
      proof_verified INTEGER DEFAULT 0,
      proof_feedback TEXT,
      proof_type TEXT,
      before_image_url TEXT,
      after_image_url TEXT,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS inventory (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      item_id TEXT NOT NULL,
      name TEXT NOT NULL,
      type TEXT NOT NULL,
      icon TEXT NOT NULL,
      description TEXT NOT NULL,
      stat_boost_type TEXT,
      stat_boost_val INTEGER NOT NULL DEFAULT 0,
      equipped INTEGER NOT NULL DEFAULT 0,
      quantity INTEGER NOT NULL DEFAULT 1,
      acquired_at TEXT NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS boss_encounters (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      boss_name TEXT NOT NULL,
      boss_title TEXT NOT NULL,
      current_hp INTEGER NOT NULL,
      max_hp INTEGER NOT NULL,
      level INTEGER NOT NULL,
      reward_xp INTEGER NOT NULL,
      reward_gold INTEGER NOT NULL,
      reward_badge TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'active',
      avatar TEXT NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_tasks_user_id ON tasks(user_id);
    CREATE INDEX IF NOT EXISTS idx_task_logs_user_id ON task_history_logs(user_id);
    CREATE INDEX IF NOT EXISTS idx_inventory_user_id ON inventory(user_id);
  `);

  // Safe migrations for existing databases
  const taskCols = [
    { name: 'requires_proof', type: 'INTEGER DEFAULT 0' },
    { name: 'proof_type', type: "TEXT DEFAULT 'none'" },
    { name: 'proof_criteria', type: 'TEXT' },
    { name: 'last_proof', type: 'TEXT' },
  ];
  for (const col of taskCols) {
    try {
      db.run(`ALTER TABLE tasks ADD COLUMN ${col.name} ${col.type};`);
    } catch {
      // column already exists
    }
  }

  const logCols = [
    { name: 'proof_verified', type: 'INTEGER DEFAULT 0' },
    { name: 'proof_feedback', type: 'TEXT' },
    { name: 'proof_type', type: 'TEXT' },
    { name: 'before_image_url', type: 'TEXT' },
    { name: 'after_image_url', type: 'TEXT' },
  ];
  for (const col of logCols) {
    try {
      db.run(`ALTER TABLE task_history_logs ADD COLUMN ${col.name} ${col.type};`);
    } catch {
      // column already exists
    }
  }
}
