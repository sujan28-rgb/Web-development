import {
  User,
  Character,
  CharacterStats,
  Task,
  TaskCategory,
  TaskType,
  TaskDifficulty,
  InventoryItem,
  ShopItem,
  BossEncounter,
  TaskHistoryLog,
  CompleteTaskResponse,
} from '../types.js';

const STORAGE_KEYS = {
  CURRENT_USER_ID: 'realms_current_user_id',
  USERS: 'realms_users',
  CHARACTERS: 'realms_characters',
  STATS: 'realms_stats',
  TASKS: 'realms_tasks',
  INVENTORY: 'realms_inventory',
  BOSS: 'realms_boss',
  LOGS: 'realms_logs',
};

export const CATALOG_SHOP_ITEMS: ShopItem[] = [
  {
    id: 'weapon_blade_focus',
    name: 'Blade of Hyperfocus',
    type: 'weapon',
    icon: 'sword',
    cost: 150,
    description: 'Forged in the fires of deep uninterrupted work. Grants +8 Intellect and +4 Agility.',
    stat_boost_type: 'intellect',
    stat_boost_val: 8,
    rarity: 'rare',
  },
  {
    id: 'weapon_staff_clarity',
    name: 'Staff of Cognitive Clarity',
    type: 'weapon',
    icon: 'wand',
    cost: 220,
    description: 'A glowing staff that illuminates complex algorithms and mental riddles. +12 Intellect.',
    stat_boost_type: 'intellect',
    stat_boost_val: 12,
    rarity: 'epic',
  },
  {
    id: 'armor_aegis_discipline',
    name: 'Aegis of Iron Discipline',
    type: 'armor',
    icon: 'shield',
    cost: 180,
    description: 'Hefty cuirass worn by legendary athletes and lifters. +10 Strength, +6 Vitality.',
    stat_boost_type: 'strength',
    stat_boost_val: 10,
    rarity: 'rare',
  },
  {
    id: 'armor_cloak_zenith',
    name: 'Cloak of Zenith Serenity',
    type: 'armor',
    icon: 'shirt',
    cost: 160,
    description: 'Silken woven mantlet radiating mindful peace. +10 Spirit, +5 Vitality.',
    stat_boost_type: 'spirit',
    stat_boost_val: 10,
    rarity: 'rare',
  },
  {
    id: 'acc_ring_flow',
    name: 'Signet Ring of Flow State',
    type: 'accessory',
    icon: 'sparkles',
    cost: 200,
    description: 'Locks the mind into effortless rhythm. +6 Agility, +6 Intellect.',
    stat_boost_type: 'agility',
    stat_boost_val: 6,
    rarity: 'epic',
  },
  {
    id: 'potion_vitality_elixir',
    name: 'Elixir of Vitality',
    type: 'consumable',
    icon: 'heart',
    cost: 40,
    description: 'Instantly restores 50 HP and cleanses exhaustion.',
    stat_boost_type: 'hp_heal',
    stat_boost_val: 50,
    rarity: 'common',
  },
  {
    id: 'potion_arcane_brew',
    name: 'Mana Draft of Insight',
    type: 'consumable',
    icon: 'droplet',
    cost: 35,
    description: 'Restores 40 Mana to fuel special abilities.',
    stat_boost_type: 'mana_heal',
    stat_boost_val: 40,
    rarity: 'common',
  },
  {
    id: 'item_streak_chronosphere',
    name: 'Chrono Shield (Streak Freeze)',
    type: 'consumable',
    icon: 'hourglass',
    cost: 120,
    description: 'An ethereal ward that protects your streak from breaking if you miss a day.',
    stat_boost_type: 'streak_shield',
    stat_boost_val: 1,
    rarity: 'rare',
  },
  {
    id: 'badge_grimoire_master',
    name: 'Badge: Grand Chronomancer',
    type: 'badge',
    icon: 'award',
    cost: 300,
    description: 'A distinguished prestige sigil commemorating mastery over time and distraction.',
    stat_boost_type: 'spirit',
    stat_boost_val: 5,
    rarity: 'legendary',
  },
];

export const WORLD_BOSS_TEMPLATES = [
  {
    name: 'The Procrastination Behemoth',
    title: 'Lord of Tomorrow & Eater of Hours',
    max_hp: 500,
    level: 1,
    reward_xp: 300,
    reward_gold: 250,
    reward_badge: 'Vanquisher of Delay',
    avatar: 'behemoth',
  },
  {
    name: 'The Distraction Gorgon',
    title: 'Siren of Infinite Feeds',
    max_hp: 900,
    level: 2,
    reward_xp: 550,
    reward_gold: 450,
    reward_badge: 'Unblinking Focus',
    avatar: 'gorgon',
  },
  {
    name: 'The Imposter Phantom',
    title: 'Shadow of Self-Doubt',
    max_hp: 1500,
    level: 3,
    reward_xp: 900,
    reward_gold: 750,
    reward_badge: 'True Adept',
    avatar: 'phantom',
  },
];

export function calculateNextLevelXp(level: number): number {
  return Math.floor(120 * Math.pow(level, 1.45) + 50);
}

export function calculateTaskRewards(
  difficulty: TaskDifficulty,
  streakDays: number = 0
): { xp: number; gold: number } {
  let baseXP = 30;
  let baseGold = 20;

  switch (difficulty) {
    case 'trivial':
      baseXP = 15;
      baseGold = 10;
      break;
    case 'easy':
      baseXP = 30;
      baseGold = 20;
      break;
    case 'medium':
      baseXP = 60;
      baseGold = 45;
      break;
    case 'hard':
      baseXP = 120;
      baseGold = 90;
      break;
    case 'legendary':
      baseXP = 250;
      baseGold = 200;
      break;
    default:
      baseXP = 30;
      baseGold = 20;
  }

  const streakBonus = Math.min(0.5, (streakDays || 0) * 0.05);
  return {
    xp: Math.round(baseXP * (1 + streakBonus)),
    gold: Math.round(baseGold * (1 + streakBonus)),
  };
}

function getStored<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback;
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function setStored<T>(key: string, value: T): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (err) {
    console.warn('localStorage write failed:', err);
  }
}

export function initLocalStore(): void {
  const users = getStored<Record<string, User & { password?: string }>>(STORAGE_KEYS.USERS, {});
  const demoUserId = 'user_demo_hero_999';

  if (!users[demoUserId]) {
    const now = new Date().toISOString();
    const todayDate = now.split('T')[0];

    // Demo User
    users[demoUserId] = {
      id: demoUserId,
      username: 'ChronosKnight',
      email: 'hero@chronocraft.io',
      password: 'rpghero2026',
      created_at: now,
    };
    setStored(STORAGE_KEYS.USERS, users);

    // Characters
    const characters = getStored<Record<string, Character>>(STORAGE_KEYS.CHARACTERS, {});
    characters[demoUserId] = {
      id: 'char_demo_hero_999',
      user_id: demoUserId,
      name: 'Sir Alden the Focused',
      class: 'Iron Paladin',
      level: 3,
      current_xp: 240,
      next_level_xp: calculateNextLevelXp(3),
      hp: 120,
      max_hp: 130,
      mana: 65,
      max_mana: 70,
      gold: 320,
      gems: 25,
      streak_days: 5,
      last_active_date: todayDate,
      theme: 'obsidian',
      avatar_badge: 'Knight of Deep Focus',
      avatar_icon: 'shield',
    };
    setStored(STORAGE_KEYS.CHARACTERS, characters);

    // Stats
    const stats = getStored<Record<string, CharacterStats>>(STORAGE_KEYS.STATS, {});
    stats[demoUserId] = {
      character_id: 'char_demo_hero_999',
      strength: 18,
      intellect: 14,
      vitality: 16,
      spirit: 12,
      agility: 11,
      stat_points_available: 4,
    };
    setStored(STORAGE_KEYS.STATS, stats);

    // Tasks
    const allTasks = getStored<Record<string, Task[]>>(STORAGE_KEYS.TASKS, {});
    allTasks[demoUserId] = [
      {
        id: 'task_demo_1',
        user_id: demoUserId,
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
        created_at: now,
        updated_at: now,
      },
      {
        id: 'task_demo_2',
        user_id: demoUserId,
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
        created_at: now,
        updated_at: now,
      },
      {
        id: 'task_demo_3',
        user_id: demoUserId,
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
        created_at: now,
        updated_at: now,
        requires_proof: true,
        proof_type: 'before_after_photo',
        proof_criteria: 'Upload a photo of your full water bottle before drinking, and a photo of your empty bottle after finishing it!',
      },
      {
        id: 'task_demo_4',
        user_id: demoUserId,
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
        created_at: now,
        updated_at: now,
        requires_proof: false,
        proof_type: 'none',
        proof_criteria: '',
      },
      {
        id: 'task_demo_5',
        user_id: demoUserId,
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
        created_at: now,
        updated_at: now,
        requires_proof: true,
        proof_type: 'before_after_photo',
        proof_criteria: 'Upload a before photo of your workspace, and an after photo showing it tidy and organized!',
      },
      {
        id: 'task_demo_6',
        user_id: demoUserId,
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
        created_at: now,
        updated_at: now,
        requires_proof: true,
        proof_type: 'single_photo',
        proof_criteria: 'Upload a photo showing the open book page or notes.',
      },
    ];
    setStored(STORAGE_KEYS.TASKS, allTasks);

    // Inventory
    const allInv = getStored<Record<string, InventoryItem[]>>(STORAGE_KEYS.INVENTORY, {});
    allInv[demoUserId] = [
      {
        id: 'inv_demo_1',
        user_id: demoUserId,
        item_id: 'armor_aegis_discipline',
        name: 'Aegis of Iron Discipline',
        type: 'armor',
        icon: 'shield',
        description: 'Hefty cuirass worn by legendary athletes and lifters. +10 Strength, +6 Vitality.',
        stat_boost_type: 'strength',
        stat_boost_val: 10,
        equipped: 1,
        quantity: 1,
        acquired_at: now,
      },
      {
        id: 'inv_demo_2',
        user_id: demoUserId,
        item_id: 'potion_vitality_elixir',
        name: 'Elixir of Vitality',
        type: 'consumable',
        icon: 'heart',
        description: 'Instantly restores 50 HP and cleanses exhaustion.',
        stat_boost_type: 'hp_heal',
        stat_boost_val: 50,
        equipped: 0,
        quantity: 2,
        acquired_at: now,
      },
    ];
    setStored(STORAGE_KEYS.INVENTORY, allInv);

    // Boss
    const allBoss = getStored<Record<string, BossEncounter>>(STORAGE_KEYS.BOSS, {});
    const b = WORLD_BOSS_TEMPLATES[0];
    allBoss[demoUserId] = {
      id: 'boss_demo_1',
      user_id: demoUserId,
      boss_name: b.name,
      boss_title: b.title,
      current_hp: 365,
      max_hp: b.max_hp,
      level: b.level,
      reward_xp: b.reward_xp,
      reward_gold: b.reward_gold,
      reward_badge: b.reward_badge,
      status: 'active',
      avatar: b.avatar,
    };
    setStored(STORAGE_KEYS.BOSS, allBoss);

    // Logs
    const allLogs = getStored<Record<string, TaskHistoryLog[]>>(STORAGE_KEYS.LOGS, {});
    allLogs[demoUserId] = [
      {
        id: 'log_demo_1',
        user_id: demoUserId,
        task_id: 'task_demo_2',
        task_title: 'Full Body Iron Resistance Workout',
        category: 'strength',
        xp_earned: 135,
        gold_earned: 101,
        completed_at: now,
      },
    ];
    setStored(STORAGE_KEYS.LOGS, allLogs);
  }
}

export function getCurrentUserId(): string {
  initLocalStore();
  const storedId = localStorage.getItem(STORAGE_KEYS.CURRENT_USER_ID);
  return storedId || 'user_demo_hero_999';
}

export function setCurrentUserId(userId: string | null): void {
  if (userId) {
    localStorage.setItem(STORAGE_KEYS.CURRENT_USER_ID, userId);
  } else {
    localStorage.removeItem(STORAGE_KEYS.CURRENT_USER_ID);
  }
}

export function localDemoLogin(): { token: string; user: User; message: string } {
  initLocalStore();
  const demoUserId = 'user_demo_hero_999';
  setCurrentUserId(demoUserId);
  const users = getStored<Record<string, User>>(STORAGE_KEYS.USERS, {});
  const user = users[demoUserId] || {
    id: demoUserId,
    username: 'ChronosKnight',
    email: 'hero@chronocraft.io',
  };
  return {
    token: `local_token_${demoUserId}`,
    user,
    message: 'Welcome Champion Sir Alden!',
  };
}

export function localLogin(login: string, _pass: string): { token: string; user: User; message: string } {
  initLocalStore();
  const users = getStored<Record<string, User & { password?: string }>>(STORAGE_KEYS.USERS, {});
  const clean = login.trim().toLowerCase();

  let matchedUser = Object.values(users).find(
    (u) => u.username.toLowerCase() === clean || u.email.toLowerCase() === clean
  );

  // If logging in as demo or any default hero, match demo hero
  if (!matchedUser && (clean.includes('hero') || clean.includes('chronocraft') || clean.includes('realms'))) {
    matchedUser = users['user_demo_hero_999'];
  }

  if (!matchedUser) {
    // If user enters any identifier, automatically create or log in so they are never blocked!
    const newId = 'user_' + Date.now();
    matchedUser = {
      id: newId,
      username: login.includes('@') ? login.split('@')[0] : login,
      email: login.includes('@') ? login : `${login}@realm.io`,
    };
    users[newId] = matchedUser;
    setStored(STORAGE_KEYS.USERS, users);

    // Copy demo character setup for instant play
    const chars = getStored<Record<string, Character>>(STORAGE_KEYS.CHARACTERS, {});
    const demoChar = chars['user_demo_hero_999'];
    chars[newId] = {
      ...demoChar,
      id: 'char_' + newId,
      user_id: newId,
      name: matchedUser.username,
    };
    setStored(STORAGE_KEYS.CHARACTERS, chars);

    const stats = getStored<Record<string, CharacterStats>>(STORAGE_KEYS.STATS, {});
    stats[newId] = { ...stats['user_demo_hero_999'], character_id: 'char_' + newId };
    setStored(STORAGE_KEYS.STATS, stats);

    const tasks = getStored<Record<string, Task[]>>(STORAGE_KEYS.TASKS, {});
    tasks[newId] = (tasks['user_demo_hero_999'] || []).map((t) => ({ ...t, user_id: newId, id: 't_' + Math.random() }));
    setStored(STORAGE_KEYS.TASKS, tasks);
  }

  setCurrentUserId(matchedUser.id);
  return {
    token: `local_token_${matchedUser.id}`,
    user: matchedUser,
    message: 'Welcome back, Champion!',
  };
}

export function localRegister(
  username: string,
  email: string,
  _pass: string,
  charName?: string,
  charClass: string = 'Arcane Scholar'
): { token: string; user: User; message: string } {
  initLocalStore();
  const userId = 'user_' + Date.now();
  const now = new Date().toISOString();
  const todayDate = now.split('T')[0];

  const user: User = {
    id: userId,
    username: username.trim(),
    email: email.trim().toLowerCase(),
    created_at: now,
  };

  const users = getStored<Record<string, User>>(STORAGE_KEYS.USERS, {});
  users[userId] = user;
  setStored(STORAGE_KEYS.USERS, users);

  const charId = 'char_' + userId;
  const character: Character = {
    id: charId,
    user_id: userId,
    name: charName?.trim() || username.trim(),
    class: charClass,
    level: 1,
    current_xp: 0,
    next_level_xp: calculateNextLevelXp(1),
    hp: 100,
    max_hp: 100,
    mana: 50,
    max_mana: 50,
    gold: 100,
    gems: 10,
    streak_days: 1,
    last_active_date: todayDate,
    theme: 'obsidian',
    avatar_badge: 'Novice Seeker',
    avatar_icon: 'sword',
  };

  const chars = getStored<Record<string, Character>>(STORAGE_KEYS.CHARACTERS, {});
  chars[userId] = character;
  setStored(STORAGE_KEYS.CHARACTERS, chars);

  let str = 10, intl = 10, vit = 10, spi = 10, agi = 10;
  if (charClass === 'Iron Paladin') { str += 4; vit += 3; }
  else if (charClass === 'Arcane Scholar') { intl += 5; spi += 2; }
  else if (charClass === 'Shadow Rogue') { agi += 5; intl += 2; }
  else if (charClass === 'Verdant Druid') { spi += 4; vit += 3; }
  else if (charClass === 'Chronomancer') { intl += 4; agi += 3; }

  const stats: CharacterStats = {
    character_id: charId,
    strength: str,
    intellect: intl,
    vitality: vit,
    spirit: spi,
    agility: agi,
    stat_points_available: 3,
  };
  const allStats = getStored<Record<string, CharacterStats>>(STORAGE_KEYS.STATS, {});
  allStats[userId] = stats;
  setStored(STORAGE_KEYS.STATS, allStats);

  // Copy starter tasks
  const allTasks = getStored<Record<string, Task[]>>(STORAGE_KEYS.TASKS, {});
  allTasks[userId] = (allTasks['user_demo_hero_999'] || []).map((t) => ({
    ...t,
    id: 'task_' + Math.random().toString(36).substring(2, 9),
    user_id: userId,
    completed: 0,
  }));
  setStored(STORAGE_KEYS.TASKS, allTasks);

  // Boss
  const allBoss = getStored<Record<string, BossEncounter>>(STORAGE_KEYS.BOSS, {});
  const b = WORLD_BOSS_TEMPLATES[0];
  allBoss[userId] = {
    id: 'boss_' + userId,
    user_id: userId,
    boss_name: b.name,
    boss_title: b.title,
    current_hp: b.max_hp,
    max_hp: b.max_hp,
    level: b.level,
    reward_xp: b.reward_xp,
    reward_gold: b.reward_gold,
    reward_badge: b.reward_badge,
    status: 'active',
    avatar: b.avatar,
  };
  setStored(STORAGE_KEYS.BOSS, allBoss);

  setCurrentUserId(userId);
  return {
    token: `local_token_${userId}`,
    user,
    message: 'Welcome to LifeQuest!',
  };
}

export function localGetMe(): {
  user: User;
  character: Character;
  stats: CharacterStats;
  equippedItems: InventoryItem[];
} {
  initLocalStore();
  const userId = getCurrentUserId();
  const users = getStored<Record<string, User>>(STORAGE_KEYS.USERS, {});
  const chars = getStored<Record<string, Character>>(STORAGE_KEYS.CHARACTERS, {});
  const allStats = getStored<Record<string, CharacterStats>>(STORAGE_KEYS.STATS, {});
  const allInv = getStored<Record<string, InventoryItem[]>>(STORAGE_KEYS.INVENTORY, {});

  const user = users[userId] || users['user_demo_hero_999'];
  const character = chars[userId] || chars['user_demo_hero_999'];
  const stats = allStats[userId] || allStats['user_demo_hero_999'];
  const inventory = allInv[userId] || allInv['user_demo_hero_999'] || [];

  return {
    user,
    character,
    stats,
    equippedItems: inventory.filter((i) => i.equipped === 1),
  };
}

export function localGetTasks(params?: { type?: TaskType; category?: TaskCategory }): { tasks: Task[] } {
  initLocalStore();
  const userId = getCurrentUserId();
  const allTasks = getStored<Record<string, Task[]>>(STORAGE_KEYS.TASKS, {});
  let list = allTasks[userId] || allTasks['user_demo_hero_999'] || [];

  if (params?.type) list = list.filter((t) => t.type === params.type);
  if (params?.category) list = list.filter((t) => t.category === params.category);

  return { tasks: list };
}

export function localCreateTask(data: {
  title: string;
  description?: string;
  category: TaskCategory;
  type: TaskType;
  difficulty: TaskDifficulty;
  due_date?: string;
  requires_proof?: boolean;
  proof_type?: ProofRequirementType;
  proof_criteria?: string;
}): { message: string; task: Task } {
  initLocalStore();
  const userId = getCurrentUserId();
  const allTasks = getStored<Record<string, Task[]>>(STORAGE_KEYS.TASKS, {});
  const list = allTasks[userId] || allTasks['user_demo_hero_999'] || [];

  const now = new Date().toISOString();
  const todayDate = now.split('T')[0];
  const rewards = calculateTaskRewards(data.difficulty, 0);

  const newTask: Task = {
    id: 'task_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
    user_id: userId,
    title: data.title.trim(),
    description: data.description?.trim() || '',
    category: data.category,
    type: data.type,
    difficulty: data.difficulty,
    xp_reward: rewards.xp,
    gold_reward: rewards.gold,
    completed: 0,
    streak_count: 0,
    due_date: data.due_date || todayDate,
    created_at: now,
    updated_at: now,
    requires_proof: data.requires_proof || false,
    proof_type: data.proof_type || 'none',
    proof_criteria: data.proof_criteria || '',
  };

  const updated = [newTask, ...list];
  allTasks[userId] = updated;
  setStored(STORAGE_KEYS.TASKS, allTasks);

  return { message: 'Quest inscribed into Grimoire', task: newTask };
}

export function localUpdateTask(
  id: string,
  data: Partial<Task>
): { message: string; task: Task } {
  initLocalStore();
  const userId = getCurrentUserId();
  const allTasks = getStored<Record<string, Task[]>>(STORAGE_KEYS.TASKS, {});
  const list = allTasks[userId] || allTasks['user_demo_hero_999'] || [];

  let updatedTask: Task | null = null;
  const nextList = list.map((t) => {
    if (t.id === id) {
      updatedTask = { ...t, ...data, updated_at: new Date().toISOString() };
      return updatedTask;
    }
    return t;
  });

  allTasks[userId] = nextList;
  setStored(STORAGE_KEYS.TASKS, allTasks);

  return { message: 'Quest updated', task: updatedTask || list[0] };
}

export function localDeleteTask(id: string): { message: string; id: string } {
  initLocalStore();
  const userId = getCurrentUserId();
  const allTasks = getStored<Record<string, Task[]>>(STORAGE_KEYS.TASKS, {});
  const list = allTasks[userId] || allTasks['user_demo_hero_999'] || [];

  allTasks[userId] = list.filter((t) => t.id !== id);
  setStored(STORAGE_KEYS.TASKS, allTasks);

  return { message: 'Quest excised from grimoire', id };
}

export function localCompleteTask(
  id: string,
  proofData?: {
    proof_verified?: boolean;
    proof_feedback?: string;
    proof_type?: ProofRequirementType;
    before_image_url?: string;
    after_image_url?: string;
    user_note?: string;
  }
): CompleteTaskResponse {
  initLocalStore();
  const userId = getCurrentUserId();
  const allTasks = getStored<Record<string, Task[]>>(STORAGE_KEYS.TASKS, {});
  const list = allTasks[userId] || allTasks['user_demo_hero_999'] || [];
  const chars = getStored<Record<string, Character>>(STORAGE_KEYS.CHARACTERS, {});
  const allStats = getStored<Record<string, CharacterStats>>(STORAGE_KEYS.STATS, {});
  const allBoss = getStored<Record<string, BossEncounter>>(STORAGE_KEYS.BOSS, {});
  const allLogs = getStored<Record<string, TaskHistoryLog[]>>(STORAGE_KEYS.LOGS, {});

  const task = list.find((t) => t.id === id);
  if (!task) throw new Error('Task not found');

  const char = chars[userId] || chars['user_demo_hero_999'];
  const stats = allStats[userId] || allStats['user_demo_hero_999'];
  const boss = allBoss[userId] || allBoss['user_demo_hero_999'];

  const rewards = calculateTaskRewards(task.difficulty, task.streak_count);
  const now = new Date().toISOString();

  // Mark task completed and attach last_proof
  const updatedTask: Task = {
    ...task,
    completed: 1,
    streak_count: task.streak_count + 1,
    updated_at: now,
    last_proof: proofData
      ? {
          verified: Boolean(proofData.proof_verified),
          feedback: proofData.proof_feedback || 'Quest proof successfully confirmed!',
          confidence: 95,
          verified_at: now,
          before_image_url: proofData.before_image_url,
          after_image_url: proofData.after_image_url,
          user_note: proofData.user_note,
        }
      : task.last_proof,
  };
  allTasks[userId] = list.map((t) => (t.id === id ? updatedTask : t));
  setStored(STORAGE_KEYS.TASKS, allTasks);

  // Level progression
  let level = char.level;
  let xp = char.current_xp + rewards.xp;
  let nextXp = char.next_level_xp;
  let leveledUp = false;
  let levelsGained = 0;
  let maxHp = char.max_hp;
  let maxMana = char.max_mana;
  let hp = char.hp;
  let mana = char.mana;

  while (xp >= nextXp) {
    xp -= nextXp;
    level += 1;
    leveledUp = true;
    levelsGained += 1;
    nextXp = calculateNextLevelXp(level);
    maxHp += 15;
    maxMana += 10;
    hp = maxHp;
    mana = maxMana;
  }

  // Update Character
  const updatedChar: Character = {
    ...char,
    level,
    current_xp: xp,
    next_level_xp: nextXp,
    gold: char.gold + rewards.gold,
    hp,
    max_hp: maxHp,
    mana,
    max_mana: maxMana,
    streak_days: char.streak_days + 1,
    last_active_date: now.split('T')[0],
  };
  chars[userId] = updatedChar;
  setStored(STORAGE_KEYS.CHARACTERS, chars);

  // Update stats points if leveled up
  const updatedStats: CharacterStats = {
    ...stats,
    stat_points_available: stats.stat_points_available + (levelsGained * 3),
  };
  allStats[userId] = updatedStats;
  setStored(STORAGE_KEYS.STATS, allStats);

  // History log with proof fields
  const log: TaskHistoryLog = {
    id: 'log_' + Date.now(),
    user_id: userId,
    task_id: task.id,
    task_title: task.title,
    category: task.category,
    xp_earned: rewards.xp,
    gold_earned: rewards.gold,
    completed_at: now,
    proof_verified: proofData ? Boolean(proofData.proof_verified) : false,
    proof_feedback: proofData?.proof_feedback,
    proof_type: proofData?.proof_type || task.proof_type,
    before_image_url: proofData?.before_image_url,
    after_image_url: proofData?.after_image_url,
  };
  const logs = allLogs[userId] || [];
  allLogs[userId] = [log, ...logs];
  setStored(STORAGE_KEYS.LOGS, allLogs);

  // Boss damage
  let bossResult: CompleteTaskResponse['bossResult'] = undefined;
  if (boss && boss.status === 'active') {
    const damage = Math.floor(rewards.xp * 0.8) + 15;
    const remainingHp = Math.max(0, boss.current_hp - damage);
    const defeated = remainingHp <= 0;

    boss.current_hp = remainingHp;
    if (defeated) {
      boss.status = 'defeated';
      updatedChar.gold += boss.reward_gold;
      chars[userId] = updatedChar;
      setStored(STORAGE_KEYS.CHARACTERS, chars);
    }
    allBoss[userId] = boss;
    setStored(STORAGE_KEYS.BOSS, allBoss);

    bossResult = {
      defeated,
      bossName: boss.boss_name,
      damageDealt: damage,
      remainingHp,
      maxHp: boss.max_hp,
      rewardGold: boss.reward_gold,
      rewardXp: boss.reward_xp,
      rewardBadge: boss.reward_badge,
    };
  }

  return {
    success: true,
    earnedXp: rewards.xp,
    earnedGold: rewards.gold,
    leveledUp,
    levelsGained,
    newLevel: level,
    streakDays: updatedChar.streak_days,
    statBoosted: task.category,
    bossResult,
    character: updatedChar,
    stats: updatedStats,
    task: updatedTask,
  };
}

export function localAllocateStats(points: {
  strength?: number;
  intellect?: number;
  vitality?: number;
  spirit?: number;
  agility?: number;
}): { message: string; character: Character; stats: CharacterStats } {
  initLocalStore();
  const userId = getCurrentUserId();
  const allStats = getStored<Record<string, CharacterStats>>(STORAGE_KEYS.STATS, {});
  const chars = getStored<Record<string, Character>>(STORAGE_KEYS.CHARACTERS, {});
  const stats = allStats[userId] || allStats['user_demo_hero_999'];
  const char = chars[userId] || chars['user_demo_hero_999'];

  const strAdd = Math.max(0, points.strength || 0);
  const intAdd = Math.max(0, points.intellect || 0);
  const vitAdd = Math.max(0, points.vitality || 0);
  const spiAdd = Math.max(0, points.spirit || 0);
  const agiAdd = Math.max(0, points.agility || 0);
  const total = strAdd + intAdd + vitAdd + spiAdd + agiAdd;

  const updatedStats: CharacterStats = {
    ...stats,
    strength: stats.strength + strAdd,
    intellect: stats.intellect + intAdd,
    vitality: stats.vitality + vitAdd,
    spirit: stats.spirit + spiAdd,
    agility: stats.agility + agiAdd,
    stat_points_available: Math.max(0, stats.stat_points_available - total),
  };
  allStats[userId] = updatedStats;
  setStored(STORAGE_KEYS.STATS, allStats);

  return { message: 'Attributes inscribed into memory', character: char, stats: updatedStats };
}

export function localUpdateCharacterSettings(data: {
  theme?: string;
  avatar_icon?: string;
  name?: string;
}): { character: Character } {
  initLocalStore();
  const userId = getCurrentUserId();
  const chars = getStored<Record<string, Character>>(STORAGE_KEYS.CHARACTERS, {});
  const char = chars[userId] || chars['user_demo_hero_999'];

  const updated: Character = {
    ...char,
    ...(data.name ? { name: data.name.trim() } : {}),
    ...(data.theme ? { theme: data.theme } : {}),
    ...(data.avatar_icon ? { avatar_icon: data.avatar_icon } : {}),
  };
  chars[userId] = updated;
  setStored(STORAGE_KEYS.CHARACTERS, chars);

  return { character: updated };
}

export function localGetShopItems(): {
  catalog: ShopItem[];
  inventory: InventoryItem[];
  playerGold: number;
  playerLevel: number;
} {
  initLocalStore();
  const userId = getCurrentUserId();
  const chars = getStored<Record<string, Character>>(STORAGE_KEYS.CHARACTERS, {});
  const allInv = getStored<Record<string, InventoryItem[]>>(STORAGE_KEYS.INVENTORY, {});
  const char = chars[userId] || chars['user_demo_hero_999'];
  const inventory = allInv[userId] || allInv['user_demo_hero_999'] || [];

  return {
    catalog: CATALOG_SHOP_ITEMS,
    inventory,
    playerGold: char.gold,
    playerLevel: char.level,
  };
}

export function localBuyItem(itemId: string): {
  message: string;
  character: Character;
  inventory: InventoryItem[];
} {
  initLocalStore();
  const userId = getCurrentUserId();
  const chars = getStored<Record<string, Character>>(STORAGE_KEYS.CHARACTERS, {});
  const allInv = getStored<Record<string, InventoryItem[]>>(STORAGE_KEYS.INVENTORY, {});
  const char = chars[userId] || chars['user_demo_hero_999'];
  const inventory = allInv[userId] || allInv['user_demo_hero_999'] || [];

  const item = CATALOG_SHOP_ITEMS.find((i) => i.id === itemId);
  if (!item) throw new Error('Item not found in shop catalog');
  if (char.gold < item.cost) throw new Error('Insufficient gold');

  char.gold -= item.cost;
  chars[userId] = char;
  setStored(STORAGE_KEYS.CHARACTERS, chars);

  const existing = inventory.find((i) => i.item_id === itemId);
  let updatedInv: InventoryItem[];
  if (existing && item.type === 'consumable') {
    updatedInv = inventory.map((i) => (i.item_id === itemId ? { ...i, quantity: i.quantity + 1 } : i));
  } else {
    const newInvItem: InventoryItem = {
      id: 'inv_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
      user_id: userId,
      item_id: item.id,
      name: item.name,
      type: item.type,
      icon: item.icon,
      description: item.description,
      stat_boost_type: item.stat_boost_type,
      stat_boost_val: item.stat_boost_val,
      equipped: 0,
      quantity: 1,
      acquired_at: new Date().toISOString(),
    };
    updatedInv = [newInvItem, ...inventory];
  }

  allInv[userId] = updatedInv;
  setStored(STORAGE_KEYS.INVENTORY, allInv);

  return { message: `Acquired ${item.name}!`, character: char, inventory: updatedInv };
}

export function localEquipItem(inventoryId: string): {
  message: string;
  inventory: InventoryItem[];
} {
  initLocalStore();
  const userId = getCurrentUserId();
  const allInv = getStored<Record<string, InventoryItem[]>>(STORAGE_KEYS.INVENTORY, {});
  const inventory = allInv[userId] || allInv['user_demo_hero_999'] || [];

  const target = inventory.find((i) => i.id === inventoryId);
  if (!target) throw new Error('Item not in inventory');

  const willEquip = target.equipped ? 0 : 1;
  const updated = inventory.map((i) => {
    if (i.id === inventoryId) {
      return { ...i, equipped: willEquip };
    }
    // Unequip any item of the same equipment type if equipping
    if (willEquip && i.type === target.type && i.type !== 'consumable' && i.type !== 'badge') {
      return { ...i, equipped: 0 };
    }
    return i;
  });

  allInv[userId] = updated;
  setStored(STORAGE_KEYS.INVENTORY, allInv);

  return {
    message: willEquip ? `Equipped ${target.name}` : `Unequipped ${target.name}`,
    inventory: updated,
  };
}

export function localUseItem(inventoryId: string): {
  message: string;
  character: Character;
  inventory: InventoryItem[];
} {
  initLocalStore();
  const userId = getCurrentUserId();
  const chars = getStored<Record<string, Character>>(STORAGE_KEYS.CHARACTERS, {});
  const allInv = getStored<Record<string, InventoryItem[]>>(STORAGE_KEYS.INVENTORY, {});
  const char = chars[userId] || chars['user_demo_hero_999'];
  const inventory = allInv[userId] || allInv['user_demo_hero_999'] || [];

  const target = inventory.find((i) => i.id === inventoryId);
  if (!target || target.quantity <= 0) throw new Error('Consumable item depleted');

  if (target.stat_boost_type === 'hp_heal') {
    char.hp = Math.min(char.max_hp, char.hp + target.stat_boost_val);
  } else if (target.stat_boost_type === 'mana_heal') {
    char.mana = Math.min(char.max_mana, char.mana + target.stat_boost_val);
  } else if (target.stat_boost_type === 'streak_shield') {
    char.gems = (char.gems || 0) + 1;
  }

  chars[userId] = char;
  setStored(STORAGE_KEYS.CHARACTERS, chars);

  const updatedInv = inventory
    .map((i) => (i.id === inventoryId ? { ...i, quantity: i.quantity - 1 } : i))
    .filter((i) => i.quantity > 0);

  allInv[userId] = updatedInv;
  setStored(STORAGE_KEYS.INVENTORY, allInv);

  return { message: `Used ${target.name}!`, character: char, inventory: updatedInv };
}

export function localGetBoss(): { boss: BossEncounter; defeatedBossesCount: number } {
  initLocalStore();
  const userId = getCurrentUserId();
  const allBoss = getStored<Record<string, BossEncounter>>(STORAGE_KEYS.BOSS, {});
  const boss = allBoss[userId] || allBoss['user_demo_hero_999'];

  return {
    boss,
    defeatedBossesCount: boss?.status === 'defeated' ? 1 : 0,
  };
}

export function localGetLogs(): { logs: TaskHistoryLog[] } {
  initLocalStore();
  const userId = getCurrentUserId();
  const allLogs = getStored<Record<string, TaskHistoryLog[]>>(STORAGE_KEYS.LOGS, {});
  return { logs: allLogs[userId] || allLogs['user_demo_hero_999'] || [] };
}

export function localAiSuggestProof(title: string, category?: string) {
  const lower = title.toLowerCase();
  if (lower.includes('water') || lower.includes('hydrate') || lower.includes('drink')) {
    return {
      proof_type: 'before_after_photo' as const,
      proof_criteria: 'Take a photo of your full water bottle before drinking, and a photo of your empty bottle after finishing it!',
      recommended_difficulty: 'easy' as const,
      encouraging_note: 'Proper hydration powers up your vitality and focus stats!',
    };
  }

  if (lower.includes('clean') || lower.includes('organize') || lower.includes('desk') || lower.includes('room')) {
    return {
      proof_type: 'before_after_photo' as const,
      proof_criteria: 'Upload a before photo of your workspace/room, and an after photo showing it tidy and organized!',
      recommended_difficulty: 'medium' as const,
      encouraging_note: 'A clean space clears mental clutter and boosts intellect!',
    };
  }

  if (lower.includes('workout') || lower.includes('gym') || lower.includes('run') || lower.includes('pushup')) {
    return {
      proof_type: 'single_photo' as const,
      proof_criteria: 'Upload a photo of your fitness tracker stats, gym station, or running route summary.',
      recommended_difficulty: 'medium' as const,
      encouraging_note: 'Strength and agility growth unlocked through real effort!',
    };
  }

  if (lower.includes('read') || lower.includes('book') || lower.includes('study')) {
    return {
      proof_type: 'single_photo' as const,
      proof_criteria: 'Take a photo of the book chapter or study notes you completed today.',
      recommended_difficulty: 'medium' as const,
      encouraging_note: 'Every page read fuels your hero intellect and wisdom!',
    };
  }

  return {
    proof_type: 'single_photo' as const,
    proof_criteria: 'Upload a photo showing your completed work or final result.',
    recommended_difficulty: 'easy' as const,
    encouraging_note: 'Every quest completed builds an unstoppable hero streak!',
  };
}

export function localAiVerifyProof(params: {
  proofType: string;
  hasBefore: boolean;
  hasAfter: boolean;
  userNote?: string;
}) {
  if (params.proofType === 'before_after_photo') {
    if (params.hasBefore && params.hasAfter) {
      return {
        verified: true,
        confidence: 96,
        feedback: 'Both before and after photos confirmed! Outstanding commitment to your hydration and quest completion.',
        analysis: 'Detected valid dual photo submission matching before-and-after criteria.',
      };
    } else {
      return {
        verified: false,
        confidence: 35,
        feedback: 'Please provide both the Before photo and the After photo to complete this quest verification.',
        analysis: 'Missing one or both required verification photos.',
      };
    }
  }

  if (params.hasBefore || params.hasAfter || (params.userNote && params.userNote.length > 5)) {
    return {
      verified: true,
      confidence: 94,
      feedback: 'Proof of completion confirmed! Great work following through on your quest.',
      analysis: 'Provided valid proof photo submission.',
    };
  }

  return {
    verified: false,
    confidence: 20,
    feedback: 'Please upload a photo or write a completion note to verify your quest.',
    analysis: 'Insufficient proof provided.',
  };
}
