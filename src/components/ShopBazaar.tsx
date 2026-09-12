import React, { useState, useEffect } from 'react';
import {
  Coins,
  Shield,
  Sword,
  Sparkles,
  Heart,
  Droplet,
  Hourglass,
  Award,
  Shirt,
  Wand,
  Check,
  Zap,
} from 'lucide-react';
import { ShopItem, InventoryItem, Character } from '../types.js';
import { api } from '../utils/api.js';
import { soundEngine } from '../utils/soundEngine.js';

interface ShopBazaarProps {
  character: Character;
  onRefreshCharacter: () => Promise<void>;
}

const ICON_MAP: Record<string, any> = {
  sword: Sword,
  wand: Wand,
  shield: Shield,
  shirt: Shirt,
  sparkles: Sparkles,
  heart: Heart,
  droplet: Droplet,
  hourglass: Hourglass,
  award: Award,
};

export const ShopBazaar: React.FC<ShopBazaarProps> = ({ character, onRefreshCharacter }) => {
  const [activeTab, setActiveTab] = useState<'catalog' | 'vault'>('catalog');
  const [catalog, setCatalog] = useState<ShopItem[]>([]);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const loadShopData = async () => {
    try {
      setLoading(true);
      const data = await api.getShopItems();
      setCatalog(data.catalog);
      setInventory(data.inventory);
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadShopData();
  }, []);

  const handleBuy = async (item: ShopItem) => {
    if (character.gold < item.cost) {
      soundEngine.playClick();
      setMessage(`Not enough gold! You need ${item.cost - character.gold} more gold.`);
      setTimeout(() => setMessage(null), 3000);
      return;
    }

    setActionLoading(item.id);
    soundEngine.playCoin();
    try {
      const res = await api.buyItem(item.id);
      setMessage(res.message);
      setInventory(res.inventory);
      await onRefreshCharacter();
      setTimeout(() => setMessage(null), 3000);
    } catch (err: any) {
      setMessage(err.message || 'Transaction failed');
      setTimeout(() => setMessage(null), 3000);
    } finally {
      setActionLoading(null);
    }
  };

  const handleEquip = async (item: InventoryItem) => {
    setActionLoading(item.id);
    soundEngine.playEquip();
    try {
      const res = await api.equipItem(item.id);
      setInventory(res.inventory);
      await onRefreshCharacter();
      setMessage(res.message);
      setTimeout(() => setMessage(null), 2500);
    } catch (err: any) {
      setMessage(err.message || 'Equip error');
      setTimeout(() => setMessage(null), 2500);
    } finally {
      setActionLoading(null);
    }
  };

  const handleUseConsumable = async (item: InventoryItem) => {
    setActionLoading(item.id);
    soundEngine.playQuestComplete();
    try {
      const res = await api.useItem(item.id);
      setInventory(res.inventory);
      await onRefreshCharacter();
      setMessage(res.message);
      setTimeout(() => setMessage(null), 3000);
    } catch (err: any) {
      setMessage(err.message || 'Consume error');
      setTimeout(() => setMessage(null), 3000);
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Bazaar Banner */}
      <div className="bg-[#0f172a]/95 border border-amber-500/30 rounded-2xl p-5 shadow-xl flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
            <Coins className="w-6 h-6" />
          </div>
          <div>
            <h2
              className="text-xl font-bold font-serif text-amber-100"
              style={{ fontFamily: 'Cinzel, serif' }}
            >
              The Arcane Bazaar & Hero Vault
            </h2>
            <p className="text-xs text-slate-400">
              Exchange your task-earned gold for legendary armor, elixir buffs, and streak wards.
            </p>
          </div>
        </div>

        {/* Currency Pill */}
        <div className="flex items-center gap-4 bg-slate-900 px-4 py-2 rounded-xl border border-slate-800">
          <div className="flex items-center gap-1.5 text-amber-300 font-mono font-bold text-sm">
            <Coins className="w-4 h-4 text-amber-400" />
            <span>{character.gold} Gold</span>
          </div>
          <div className="w-px h-4 bg-slate-800" />
          <div className="flex items-center gap-1.5 text-purple-300 font-mono font-bold text-sm">
            <Sparkles className="w-4 h-4 text-purple-400" />
            <span>{character.gems} Gems</span>
          </div>
        </div>
      </div>

      {/* Message notification banner */}
      {message && (
        <div className="p-3 rounded-xl bg-amber-500/15 border border-amber-500/40 text-amber-300 text-xs font-mono animate-fadeIn flex items-center justify-between">
          <span>{message}</span>
          <button onClick={() => setMessage(null)} className="text-slate-400 hover:text-slate-200">
            ✕
          </button>
        </div>
      )}

      {/* Tabs */}
      <div className="flex border-b border-slate-800">
        <button
          onClick={() => {
            soundEngine.playClick();
            setActiveTab('catalog');
          }}
          className={`px-6 py-3 text-sm font-semibold transition-all border-b-2 flex items-center gap-2 ${
            activeTab === 'catalog'
              ? 'border-amber-500 text-amber-300 bg-amber-500/5'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Sparkles className="w-4 h-4" />
          <span>Artifact Catalog ({catalog.length})</span>
        </button>
        <button
          onClick={() => {
            soundEngine.playClick();
            setActiveTab('vault');
          }}
          className={`px-6 py-3 text-sm font-semibold transition-all border-b-2 flex items-center gap-2 ${
            activeTab === 'vault'
              ? 'border-amber-500 text-amber-300 bg-amber-500/5'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Shield className="w-4 h-4" />
          <span>My Equipped Vault ({inventory.length})</span>
        </button>
      </div>

      {/* Content */}
      {activeTab === 'catalog' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {catalog.map((item) => {
            const Icon = ICON_MAP[item.icon] || Sparkles;
            const alreadyOwned =
              item.type !== 'consumable' && inventory.some((inv) => inv.item_id === item.id);
            const canAfford = character.gold >= item.cost;

            return (
              <div
                key={item.id}
                className="p-4 rounded-2xl bg-[#0e1424] border border-slate-800 flex flex-col justify-between hover:border-slate-700 transition-all shadow-md"
              >
                <div>
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
                      <Icon className="w-5 h-5" />
                    </div>
                    <span
                      className={`text-[10px] font-mono uppercase px-2 py-0.5 rounded border ${
                        item.rarity === 'legendary'
                          ? 'border-amber-500/50 text-amber-300 bg-amber-500/10'
                          : item.rarity === 'epic'
                          ? 'border-purple-500/50 text-purple-300 bg-purple-500/10'
                          : item.rarity === 'rare'
                          ? 'border-cyan-500/50 text-cyan-300 bg-cyan-500/10'
                          : 'border-slate-700 text-slate-400 bg-slate-800/40'
                      }`}
                    >
                      {item.rarity}
                    </span>
                  </div>

                  <h3 className="text-sm font-bold text-slate-100">{item.name}</h3>
                  <p className="text-xs text-slate-400 mt-1 leading-relaxed">{item.description}</p>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between">
                  <div className="flex items-center gap-1 font-mono text-sm font-bold text-amber-300">
                    <Coins className="w-4 h-4 text-amber-400" />
                    <span>{item.cost} Gold</span>
                  </div>

                  <button
                    onClick={() => handleBuy(item)}
                    disabled={alreadyOwned || actionLoading === item.id || !canAfford}
                    className={`px-3 py-1.5 rounded-xl font-bold text-xs transition-all ${
                      alreadyOwned
                        ? 'bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed'
                        : canAfford
                        ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-md shadow-amber-950/40'
                        : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                    }`}
                  >
                    {alreadyOwned
                      ? 'Possessed'
                      : actionLoading === item.id
                      ? 'Acquiring...'
                      : canAfford
                      ? 'Acquire'
                      : 'Need Gold'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Inventory Vault */
        <div>
          {inventory.length === 0 ? (
            <div className="text-center py-12 rounded-2xl bg-slate-900/40 border border-dashed border-slate-800">
              <Shield className="w-8 h-8 text-slate-600 mx-auto mb-2" />
              <p className="text-xs text-slate-400">Your vault is empty. Visit the catalog to equip your hero!</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {inventory.map((inv) => {
                const Icon = ICON_MAP[inv.icon] || Sparkles;
                const isEquipped = inv.equipped === 1;

                return (
                  <div
                    key={inv.id}
                    className={`p-4 rounded-2xl border transition-all ${
                      isEquipped
                        ? 'bg-amber-950/20 border-amber-500/60 shadow-[0_0_15px_rgba(245,158,11,0.15)]'
                        : 'bg-[#0e1424] border-slate-800'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="w-10 h-10 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-amber-400">
                        <Icon className="w-5 h-5" />
                      </div>
                      {isEquipped && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40 font-bold">
                          <Check className="w-3 h-3" /> Equipped
                        </span>
                      )}
                      {inv.type === 'consumable' && (
                        <span className="text-xs font-mono font-bold text-amber-400 bg-slate-800 px-2 py-0.5 rounded border border-slate-700">
                          Qty: {inv.quantity}
                        </span>
                      )}
                    </div>

                    <h4 className="text-sm font-bold text-slate-100">{inv.name}</h4>
                    <p className="text-xs text-slate-400 mt-1">{inv.description}</p>

                    <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between">
                      <span className="text-[10px] font-mono uppercase text-slate-400">
                        {inv.type}
                      </span>

                      {inv.type === 'consumable' ? (
                        <button
                          onClick={() => handleUseConsumable(inv)}
                          disabled={actionLoading === inv.id}
                          className="px-3 py-1 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md"
                        >
                          Use Consumable
                        </button>
                      ) : (
                        <button
                          onClick={() => handleEquip(inv)}
                          disabled={actionLoading === inv.id}
                          className={`px-3 py-1 rounded-xl font-bold text-xs transition-all ${
                            isEquipped
                              ? 'bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700'
                              : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-md'
                          }`}
                        >
                          {isEquipped ? 'Unequip' : 'Equip Gear'}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
