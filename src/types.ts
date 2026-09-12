export type TaskCategory = 'intellect' | 'strength' | 'vitality' | 'spirit' | 'agility';
export type TaskType = 'daily' | 'habit' | 'epic_quest';
export type TaskDifficulty = 'trivial' | 'easy' | 'medium' | 'hard' | 'legendary';

export interface User {
  id: string;
  username: string;
  email: string;
  created_at?: string;
}

export interface Character {
  id: string;
  user_id: string;
  name: string;
  class: string;
  level: number;
  current_xp: number;
  next_level_xp: number;
  hp: number;
  max_hp: number;
  mana: number;
  max_mana: number;
  gold: number;
  gems: number;
  streak_days: number;
  last_active_date: string;
  theme: string;
  avatar_badge: string;
  avatar_icon: string;
}

export interface CharacterStats {
  character_id: string;
  strength: number;
  intellect: number;
  vitality: number;
  spirit: number;
  agility: number;
  stat_points_available: number;
}

export interface Task {
  id: string;
  user_id: string;
  title: string;
  description: string;
  category: TaskCategory;
  type: TaskType;
  difficulty: TaskDifficulty;
  xp_reward: number;
  gold_reward: number;
  completed: number;
  streak_count: number;
  due_date: string;
  created_at: string;
  updated_at: string;
}

export interface TaskHistoryLog {
  id: string;
  user_id: string;
  task_id: string;
  task_title: string;
  category: TaskCategory;
  xp_earned: number;
  gold_earned: number;
  completed_at: string;
}

export interface InventoryItem {
  id: string;
  user_id: string;
  item_id: string;
  name: string;
  type: 'weapon' | 'armor' | 'accessory' | 'consumable' | 'badge' | 'theme';
  icon: string;
  description: string;
  stat_boost_type?: string;
  stat_boost_val: number;
  equipped: number;
  quantity: number;
  acquired_at: string;
}

export interface ShopItem {
  id: string;
  name: string;
  type: 'weapon' | 'armor' | 'accessory' | 'consumable' | 'badge' | 'theme';
  icon: string;
  cost: number;
  description: string;
  stat_boost_type: string;
  stat_boost_val: number;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
}

export interface BossEncounter {
  id: string;
  user_id: string;
  boss_name: string;
  boss_title: string;
  current_hp: number;
  max_hp: number;
  level: number;
  reward_xp: number;
  reward_gold: number;
  reward_badge: string;
  status: 'active' | 'defeated';
  avatar: string;
}

export interface CompleteTaskResponse {
  success: boolean;
  earnedXp: number;
  earnedGold: number;
  leveledUp: boolean;
  levelsGained: number;
  newLevel: number;
  streakDays: number;
  statBoosted: string;
  bossResult?: {
    defeated: boolean;
    bossName: string;
    damageDealt: number;
    remainingHp?: number;
    maxHp?: number;
    rewardXp?: number;
    rewardGold?: number;
    rewardBadge?: string;
  };
  character: Character;
  stats: CharacterStats;
  task: Task;
}
