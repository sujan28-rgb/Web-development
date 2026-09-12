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

const TOKEN_KEY = 'chronocraft_token';

export function getStoredToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(TOKEN_KEY);
}

export function setStoredToken(token: string | null): void {
  if (typeof window === 'undefined') return;
  if (token) {
    localStorage.setItem(TOKEN_KEY, token);
  } else {
    localStorage.removeItem(TOKEN_KEY);
  }
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = getStoredToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(`/api${endpoint}`, {
    ...options,
    headers,
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    const errorMsg = data.error || `Error ${res.status}: ${res.statusText}`;
    throw new Error(errorMsg);
  }

  return data as T;
}

export const api = {
  // Auth
  async login(login: string, password: string): Promise<{ token: string; user: User; message: string }> {
    const res = await request<{ token: string; user: User; message: string }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ login, password }),
    });
    setStoredToken(res.token);
    return res;
  },

  async register(
    username: string,
    email: string,
    password: string,
    characterName?: string,
    characterClass?: string
  ): Promise<{ token: string; user: User; message: string }> {
    const res = await request<{ token: string; user: User; message: string }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ username, email, password, characterName, characterClass }),
    });
    setStoredToken(res.token);
    return res;
  },

  async demoLogin(): Promise<{ token: string; user: User; message: string }> {
    const res = await request<{ token: string; user: User; message: string }>('/auth/demo', {
      method: 'POST',
    });
    setStoredToken(res.token);
    return res;
  },

  async getMe(): Promise<{
    user: User;
    character: Character;
    stats: CharacterStats;
    equippedItems: InventoryItem[];
  }> {
    return request('/auth/me');
  },

  logout(): void {
    setStoredToken(null);
  },

  // Character
  async allocateStats(points: {
    strength?: number;
    intellect?: number;
    vitality?: number;
    spirit?: number;
    agility?: number;
  }): Promise<{ message: string; character: Character; stats: CharacterStats }> {
    return request('/character/allocate-stats', {
      method: 'POST',
      body: JSON.stringify(points),
    });
  },

  async updateCharacterSettings(data: {
    theme?: string;
    avatar_icon?: string;
    name?: string;
  }): Promise<{ character: Character }> {
    return request('/character/settings', {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },

  // Tasks
  async getTasks(params?: { type?: TaskType; category?: TaskCategory }): Promise<{ tasks: Task[] }> {
    const searchParams = new URLSearchParams();
    if (params?.type) searchParams.set('type', params.type);
    if (params?.category) searchParams.set('category', params.category);
    const query = searchParams.toString() ? `?${searchParams.toString()}` : '';
    return request(`/tasks${query}`);
  },

  async createTask(data: {
    title: string;
    description?: string;
    category: TaskCategory;
    type: TaskType;
    difficulty: TaskDifficulty;
    due_date?: string;
  }): Promise<{ message: string; task: Task }> {
    return request('/tasks', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async updateTask(
    id: string,
    data: Partial<{
      title: string;
      description: string;
      category: TaskCategory;
      type: TaskType;
      difficulty: TaskDifficulty;
      due_date: string;
    }>
  ): Promise<{ message: string; task: Task }> {
    return request(`/tasks/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  async deleteTask(id: string): Promise<{ message: string; id: string }> {
    return request(`/tasks/${id}`, {
      method: 'DELETE',
    });
  },

  async completeTask(id: string): Promise<CompleteTaskResponse> {
    return request(`/tasks/${id}/complete`, {
      method: 'POST',
    });
  },

  // Shop & Inventory
  async getShopItems(): Promise<{
    catalog: ShopItem[];
    inventory: InventoryItem[];
    playerGold: number;
    playerLevel: number;
  }> {
    return request('/shop/items');
  },

  async buyItem(itemId: string): Promise<{
    message: string;
    character: Character;
    inventory: InventoryItem[];
  }> {
    return request('/shop/buy', {
      method: 'POST',
      body: JSON.stringify({ itemId }),
    });
  },

  async equipItem(inventoryId: string): Promise<{
    message: string;
    inventory: InventoryItem[];
  }> {
    return request('/inventory/equip', {
      method: 'POST',
      body: JSON.stringify({ inventoryId }),
    });
  },

  async useItem(inventoryId: string): Promise<{
    message: string;
    character: Character;
    inventory: InventoryItem[];
  }> {
    return request('/inventory/use', {
      method: 'POST',
      body: JSON.stringify({ inventoryId }),
    });
  },

  // Boss & Logs
  async getBoss(): Promise<{ boss: BossEncounter; defeatedBossesCount: number }> {
    return request('/boss');
  },

  async getLogs(): Promise<{ logs: TaskHistoryLog[] }> {
    return request('/logs');
  },
};
