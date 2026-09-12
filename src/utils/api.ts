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
  ProofRequirementType,
} from '../types.js';

import {
  initLocalStore,
  localDemoLogin,
  localLogin,
  localRegister,
  localGetMe,
  localGetTasks,
  localCreateTask,
  localUpdateTask,
  localDeleteTask,
  localCompleteTask,
  localAllocateStats,
  localUpdateCharacterSettings,
  localGetShopItems,
  localBuyItem,
  localEquipItem,
  localUseItem,
  localGetBoss,
  localGetLogs,
  localAiSuggestProof,
  localAiVerifyProof,
  setCurrentUserId,
} from './localStore.js';

const TOKEN_KEY = 'chronocraft_token';

// Pre-initialize local store cache on load
if (typeof window !== 'undefined') {
  initLocalStore();
}

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
    setCurrentUserId(null);
  }
}

function isNetworkOrRedirectError(err: any): boolean {
  if (!err) return false;
  const msg = String(err.message || err).toLowerCase();
  return (
    msg.includes('failed to fetch') ||
    msg.includes('network') ||
    msg.includes('redirect') ||
    msg.includes('load failed') ||
    msg.includes('html') ||
    msg.includes('cookie_check') ||
    msg.includes('502') ||
    msg.includes('503') ||
    msg.includes('504')
  );
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = getStoredToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token && !token.startsWith('local_token_')) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(`/api${endpoint}`, {
    ...options,
    headers,
    credentials: 'include',
  });

  // If redirected to an HTML page (such as AI Studio cookie check or login)
  const contentType = res.headers.get('content-type') || '';
  if (res.redirected || contentType.includes('text/html')) {
    throw new Error('Redirect detected; falling back to local store');
  }

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
    try {
      const res = await request<{ token: string; user: User; message: string }>('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ login, password }),
      });
      setStoredToken(res.token);
      setCurrentUserId(res.user.id);
      return res;
    } catch (err: any) {
      if (isNetworkOrRedirectError(err)) {
        console.warn('Network unreachable or redirected, activating local persistence engine:', err.message);
        const localRes = localLogin(login, password);
        setStoredToken(localRes.token);
        return localRes;
      }
      throw err;
    }
  },

  async register(
    username: string,
    email: string,
    password: string,
    characterName?: string,
    characterClass?: string
  ): Promise<{ token: string; user: User; message: string }> {
    try {
      const res = await request<{ token: string; user: User; message: string }>('/auth/register', {
        method: 'POST',
        body: JSON.stringify({ username, email, password, characterName, characterClass }),
      });
      setStoredToken(res.token);
      setCurrentUserId(res.user.id);
      return res;
    } catch (err: any) {
      if (isNetworkOrRedirectError(err)) {
        console.warn('Network unreachable or redirected, registering via local persistence engine:', err.message);
        const localRes = localRegister(username, email, password, characterName, characterClass);
        setStoredToken(localRes.token);
        return localRes;
      }
      throw err;
    }
  },

  async demoLogin(): Promise<{ token: string; user: User; message: string }> {
    try {
      const res = await request<{ token: string; user: User; message: string }>('/auth/demo', {
        method: 'POST',
      });
      setStoredToken(res.token);
      setCurrentUserId(res.user.id);
      return res;
    } catch (err: any) {
      if (isNetworkOrRedirectError(err)) {
        console.warn('Activating instant demo hero in local persistence mode:', err.message);
        const localRes = localDemoLogin();
        setStoredToken(localRes.token);
        return localRes;
      }
      throw err;
    }
  },

  async getMe(): Promise<{
    user: User;
    character: Character;
    stats: CharacterStats;
    equippedItems: InventoryItem[];
  }> {
    const token = getStoredToken();
    if (token?.startsWith('local_token_')) {
      return localGetMe();
    }
    try {
      return await request('/auth/me');
    } catch (err: any) {
      if (isNetworkOrRedirectError(err)) {
        return localGetMe();
      }
      throw err;
    }
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
    const token = getStoredToken();
    if (token?.startsWith('local_token_')) {
      return localAllocateStats(points);
    }
    try {
      return await request('/character/allocate-stats', {
        method: 'POST',
        body: JSON.stringify(points),
      });
    } catch (err: any) {
      if (isNetworkOrRedirectError(err)) {
        return localAllocateStats(points);
      }
      throw err;
    }
  },

  async updateCharacterSettings(data: {
    theme?: string;
    avatar_icon?: string;
    name?: string;
  }): Promise<{ character: Character }> {
    const token = getStoredToken();
    if (token?.startsWith('local_token_')) {
      return localUpdateCharacterSettings(data);
    }
    try {
      return await request('/character/settings', {
        method: 'PATCH',
        body: JSON.stringify(data),
      });
    } catch (err: any) {
      if (isNetworkOrRedirectError(err)) {
        return localUpdateCharacterSettings(data);
      }
      throw err;
    }
  },

  // Tasks
  async getTasks(params?: { type?: TaskType; category?: TaskCategory }): Promise<{ tasks: Task[] }> {
    const token = getStoredToken();
    if (token?.startsWith('local_token_')) {
      return localGetTasks(params);
    }
    try {
      const searchParams = new URLSearchParams();
      if (params?.type) searchParams.set('type', params.type);
      if (params?.category) searchParams.set('category', params.category);
      const query = searchParams.toString() ? `?${searchParams.toString()}` : '';
      return await request(`/tasks${query}`);
    } catch (err: any) {
      if (isNetworkOrRedirectError(err)) {
        return localGetTasks(params);
      }
      throw err;
    }
  },

  async createTask(data: {
    title: string;
    description?: string;
    category: TaskCategory;
    type: TaskType;
    difficulty: TaskDifficulty;
    due_date?: string;
    requires_proof?: boolean;
    proof_type?: ProofRequirementType;
    proof_criteria?: string;
  }): Promise<{ message: string; task: Task }> {
    const token = getStoredToken();
    if (token?.startsWith('local_token_')) {
      return localCreateTask(data);
    }
    try {
      return await request('/tasks', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    } catch (err: any) {
      if (isNetworkOrRedirectError(err)) {
        return localCreateTask(data);
      }
      throw err;
    }
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
      requires_proof: boolean;
      proof_type: ProofRequirementType;
      proof_criteria: string;
    }>
  ): Promise<{ message: string; task: Task }> {
    const token = getStoredToken();
    if (token?.startsWith('local_token_')) {
      return localUpdateTask(id, data as any);
    }
    try {
      return await request(`/tasks/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      });
    } catch (err: any) {
      if (isNetworkOrRedirectError(err)) {
        return localUpdateTask(id, data as any);
      }
      throw err;
    }
  },

  async deleteTask(id: string): Promise<{ message: string; id: string }> {
    const token = getStoredToken();
    if (token?.startsWith('local_token_')) {
      return localDeleteTask(id);
    }
    try {
      return await request(`/tasks/${id}`, {
        method: 'DELETE',
      });
    } catch (err: any) {
      if (isNetworkOrRedirectError(err)) {
        return localDeleteTask(id);
      }
      throw err;
    }
  },

  async completeTask(
    id: string,
    proofData?: {
      proof_verified?: boolean;
      proof_feedback?: string;
      proof_type?: ProofRequirementType;
      before_image_url?: string;
      after_image_url?: string;
      user_note?: string;
      confidence?: number;
    }
  ): Promise<CompleteTaskResponse> {
    const token = getStoredToken();
    if (token?.startsWith('local_token_')) {
      return localCompleteTask(id, proofData);
    }
    try {
      return await request(`/tasks/${id}/complete`, {
        method: 'POST',
        body: JSON.stringify(proofData || {}),
      });
    } catch (err: any) {
      if (isNetworkOrRedirectError(err)) {
        return localCompleteTask(id, proofData);
      }
      throw err;
    }
  },

  // AI Proof & Quest Helpers (Powered by Gemini 3.8 Flash)
  async aiSuggestProof(
    title: string,
    category?: string,
    description?: string
  ): Promise<{
    proof_type: ProofRequirementType;
    proof_criteria: string;
    recommended_difficulty: TaskDifficulty;
    encouraging_note: string;
  }> {
    const token = getStoredToken();
    if (token?.startsWith('local_token_')) {
      return localAiSuggestProof(title, category);
    }
    try {
      return await request('/ai/suggest-proof', {
        method: 'POST',
        body: JSON.stringify({ title, category, description }),
      });
    } catch (err: any) {
      console.warn('Network error calling AI suggest proof, using local heuristic:', err.message);
      return localAiSuggestProof(title, category);
    }
  },

  async aiVerifyProof(params: {
    taskTitle: string;
    taskDescription?: string;
    proofCriteria: string;
    proofType: ProofRequirementType;
    beforeImageBase64?: string;
    afterImageBase64?: string;
    userNote?: string;
  }): Promise<{
    verified: boolean;
    confidence: number;
    feedback: string;
    analysis: string;
  }> {
    const token = getStoredToken();
    if (token?.startsWith('local_token_')) {
      return localAiVerifyProof({
        proofType: params.proofType,
        hasBefore: !!params.beforeImageBase64,
        hasAfter: !!params.afterImageBase64,
        userNote: params.userNote,
      });
    }
    try {
      return await request('/ai/verify-proof', {
        method: 'POST',
        body: JSON.stringify(params),
      });
    } catch (err: any) {
      console.warn('Network error calling AI verify proof, using local validation engine:', err.message);
      return localAiVerifyProof({
        proofType: params.proofType,
        hasBefore: !!params.beforeImageBase64,
        hasAfter: !!params.afterImageBase64,
        userNote: params.userNote,
      });
    }
  },

  // Shop & Inventory
  async getShopItems(): Promise<{
    catalog: ShopItem[];
    inventory: InventoryItem[];
    playerGold: number;
    playerLevel: number;
  }> {
    const token = getStoredToken();
    if (token?.startsWith('local_token_')) {
      return localGetShopItems();
    }
    try {
      return await request('/shop/items');
    } catch (err: any) {
      if (isNetworkOrRedirectError(err)) {
        return localGetShopItems();
      }
      throw err;
    }
  },

  async buyItem(itemId: string): Promise<{
    message: string;
    character: Character;
    inventory: InventoryItem[];
  }> {
    const token = getStoredToken();
    if (token?.startsWith('local_token_')) {
      return localBuyItem(itemId);
    }
    try {
      return await request('/shop/buy', {
        method: 'POST',
        body: JSON.stringify({ itemId }),
      });
    } catch (err: any) {
      if (isNetworkOrRedirectError(err)) {
        return localBuyItem(itemId);
      }
      throw err;
    }
  },

  async equipItem(inventoryId: string): Promise<{
    message: string;
    inventory: InventoryItem[];
  }> {
    const token = getStoredToken();
    if (token?.startsWith('local_token_')) {
      return localEquipItem(inventoryId);
    }
    try {
      return await request('/inventory/equip', {
        method: 'POST',
        body: JSON.stringify({ inventoryId }),
      });
    } catch (err: any) {
      if (isNetworkOrRedirectError(err)) {
        return localEquipItem(inventoryId);
      }
      throw err;
    }
  },

  async useItem(inventoryId: string): Promise<{
    message: string;
    character: Character;
    inventory: InventoryItem[];
  }> {
    const token = getStoredToken();
    if (token?.startsWith('local_token_')) {
      return localUseItem(inventoryId);
    }
    try {
      return await request('/inventory/use', {
        method: 'POST',
        body: JSON.stringify({ inventoryId }),
      });
    } catch (err: any) {
      if (isNetworkOrRedirectError(err)) {
        return localUseItem(inventoryId);
      }
      throw err;
    }
  },

  // Boss & Logs
  async getBoss(): Promise<{ boss: BossEncounter; defeatedBossesCount: number }> {
    const token = getStoredToken();
    if (token?.startsWith('local_token_')) {
      return localGetBoss();
    }
    try {
      return await request('/boss');
    } catch (err: any) {
      if (isNetworkOrRedirectError(err)) {
        return localGetBoss();
      }
      throw err;
    }
  },

  async getLogs(): Promise<{ logs: TaskHistoryLog[] }> {
    const token = getStoredToken();
    if (token?.startsWith('local_token_')) {
      return localGetLogs();
    }
    try {
      return await request('/logs');
    } catch (err: any) {
      if (isNetworkOrRedirectError(err)) {
        return localGetLogs();
      }
      throw err;
    }
  },
};
