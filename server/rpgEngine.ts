export interface LevelProgression {
  level: number;
  currentXp: number;
  nextLevelXp: number;
  leveledUp: boolean;
  levelsGained: number;
  newHp: number;
  newMaxHp: number;
  newMana: number;
  newMaxMana: number;
}

/**
 * Non-linear leveling progression formula.
 * Each subsequent level requires progressively more XP.
 * Level 1: 170
 * Level 2: 377
 * Level 3: 637
 * Level 4: 943
 * Level 5: 1289
 * Level 6: 1673
 */
export function calculateNextLevelXp(level: number): number {
  return Math.floor(120 * Math.pow(level, 1.45) + 50);
}

export function calculateTaskRewards(
  difficulty: string,
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

  // Streak multiplier: +5% per active streak day up to +50% max
  const streakBonus = Math.min(0.5, (streakDays || 0) * 0.05);
  const finalXp = Math.round(baseXP * (1 + streakBonus));
  const finalGold = Math.round(baseGold * (1 + streakBonus));

  return { xp: finalXp, gold: finalGold };
}

export function processXpGain(
  currentLevel: number,
  currentXp: number,
  xpGained: number,
  currentHp: number,
  currentMaxHp: number,
  currentMana: number,
  currentMaxMana: number
): LevelProgression {
  let level = currentLevel;
  let xp = currentXp + xpGained;
  let nextLevelXp = calculateNextLevelXp(level);
  let leveledUp = false;
  let levelsGained = 0;
  let maxHp = currentMaxHp;
  let maxMana = currentMaxMana;
  let hp = currentHp;
  let mana = currentMana;

  while (xp >= nextLevelXp) {
    xp -= nextLevelXp;
    level += 1;
    leveledUp = true;
    levelsGained += 1;
    nextLevelXp = calculateNextLevelXp(level);
    // Increase max stats on level up and fully heal
    maxHp += 15;
    maxMana += 10;
    hp = maxHp;
    mana = maxMana;
  }

  return {
    level,
    currentXp: xp,
    nextLevelXp,
    leveledUp,
    levelsGained,
    newHp: hp,
    newMaxHp: maxHp,
    newMana: mana,
    newMaxMana: maxMana,
  };
}

export const CATALOG_SHOP_ITEMS = [
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
