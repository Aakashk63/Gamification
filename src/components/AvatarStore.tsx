import React, { useState } from 'react';
import { STORE_CATALOG, type StoreItem, type ItemCategory } from '../data/storeCatalog';
import { apiPurchaseItem, apiUpdateAvatarState, type ApiProfile } from '../lib/api';
import { ShoppingCart, Star, Coins, Lock, Check, Loader2, Sparkles, Wand2, ArrowRight, Save } from 'lucide-react';
import * as Icons from 'lucide-react';

interface AvatarStoreProps {
  profile: ApiProfile;
  onUpdate: () => void;
}

export const AvatarStore: React.FC<AvatarStoreProps> = ({ profile, onUpdate }) => {
  const [activeTab, setActiveTab] = useState<'avatar' | 'shop'>('avatar');
  const [activeCategory, setActiveCategory] = useState<ItemCategory>('head');
  
  // Local state for instant UI feedback
  const [coins, setCoins] = useState(profile.coins || 0);
  const [level] = useState(profile.level || 1);
  const [unlockedItems, setUnlockedItems] = useState<string[]>(profile.unlocked_items || []);
  
  const [baseCharacter, setBaseCharacter] = useState<'boy_base' | 'girl_base'>(
    (profile.base_character as 'boy_base' | 'girl_base') || 'boy_base'
  );
  
  const [equippedItems, setEquippedItems] = useState<string[]>(profile.equipped_items || []);
  
  const [saving, setSaving] = useState(false);
  const [purchasingId, setPurchasingId] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState('');

  // Handle Save Avatar
  const handleSaveAvatar = async () => {
    setSaving(true);
    setErrorMsg('');
    try {
      await apiUpdateAvatarState(baseCharacter, equippedItems);
      onUpdate();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to save avatar state');
    } finally {
      setSaving(false);
    }
  };

  // Handle Purchase
  const handlePurchase = async (item: StoreItem) => {
    if (level < item.requiredLevel) {
      setErrorMsg(`Level ${item.requiredLevel} required to purchase this item.`);
      return;
    }
    if (coins < item.price) {
      setErrorMsg(`Not enough coins! You need ${item.price - coins} more.`);
      return;
    }

    setPurchasingId(item.id);
    setErrorMsg('');
    try {
      await apiPurchaseItem(item.id, item.price);
      setCoins((prev) => prev - item.price);
      setUnlockedItems((prev) => [...prev, item.id]);
      onUpdate();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to purchase item');
    } finally {
      setPurchasingId(null);
    }
  };

  // Toggle Equip
  const toggleEquip = (item: StoreItem) => {
    setEquippedItems((prev) => {
      // If already equipped, unequip
      if (prev.includes(item.id)) {
        return prev.filter((id) => id !== item.id);
      }
      // Otherwise, equip (and remove any other item of the same category)
      const otherCategories = prev.filter((id) => {
        const i = STORE_CATALOG.find((x) => x.id === id);
        return i?.category !== item.category;
      });
      return [...otherCategories, item.id];
    });
  };

  const equippedDetails = equippedItems.map(id => STORE_CATALOG.find(i => i.id === id)).filter(Boolean) as StoreItem[];

  return (
    <div className="rounded-3xl bg-[#111622]/90 border border-white/[0.08] shadow-xl overflow-hidden flex flex-col min-h-[600px] h-full">
      {/* Header Tabs & Stats */}
      <div className="p-4 border-b border-white/10 flex items-center justify-between bg-slate-900/50">
        <div className="flex bg-black/40 p-1 rounded-xl">
          <button 
            onClick={() => setActiveTab('avatar')}
            className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${activeTab === 'avatar' ? 'bg-emerald-500 text-white shadow-md' : 'text-slate-400 hover:text-white'}`}
          >
            My Avatar
          </button>
          <button 
            onClick={() => setActiveTab('shop')}
            className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${activeTab === 'shop' ? 'bg-indigo-500 text-white shadow-md' : 'text-slate-400 hover:text-white'}`}
          >
            <ShoppingCart className="w-3.5 h-3.5" /> Shop
          </button>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 bg-amber-500/10 border border-amber-500/20 px-3 py-1 rounded-full">
            <Star className="w-3.5 h-3.5 text-amber-400" />
            <span className="text-xs font-black text-amber-400">LVL {level}</span>
          </div>
          <div className="flex items-center gap-1.5 bg-yellow-500/10 border border-yellow-500/20 px-3 py-1 rounded-full">
            <Coins className="w-3.5 h-3.5 text-yellow-400" />
            <span className="text-xs font-black text-yellow-400">{coins}</span>
          </div>
        </div>
      </div>

      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden relative">
        {/* Error overlay */}
        {errorMsg && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50 bg-red-500/90 backdrop-blur-md text-white text-xs font-bold px-4 py-2 rounded-xl shadow-2xl flex items-center gap-2 animate-in slide-in-from-top-4">
            <span>{errorMsg}</span>
            <button onClick={() => setErrorMsg('')} className="ml-2 bg-black/20 rounded-full w-5 h-5 flex items-center justify-center hover:bg-black/40">&times;</button>
          </div>
        )}

        {/* Avatar Display Area (Always visible on large, top on mobile) */}
        <div className="w-full lg:w-1/2 border-b lg:border-b-0 lg:border-r border-white/10 relative bg-gradient-to-b from-[#1a2333] to-[#0c101a] flex flex-col">
          <div className="absolute inset-0 z-0">
             <img src={`/avatar_${baseCharacter.split('_')[0]}.jpg`} alt="Base Avatar" className="w-full h-full object-cover opacity-90 transition-all duration-500" />
             <div className="absolute inset-0 bg-gradient-to-t from-[#0c101a] via-transparent to-transparent"></div>
          </div>
          
          <div className="relative z-10 flex-1 flex flex-col justify-end p-6">
            {/* Equipped Items Overlay UI */}
            <div className="bg-black/60 backdrop-blur-md border border-white/10 p-4 rounded-2xl mb-4">
              <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-3">Equipped</h3>
              {equippedDetails.length === 0 ? (
                <p className="text-xs text-slate-500 italic">No items equipped.</p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {equippedDetails.map(item => {
                    const IconComp = (Icons as any)[item.icon || 'Circle'];
                    return (
                      <div key={item.id} className="flex items-center gap-1.5 bg-white/10 px-2.5 py-1.5 rounded-lg border border-white/5">
                        {IconComp && <IconComp className="w-3.5 h-3.5 text-emerald-400" />}
                        <span className="text-[10px] font-bold text-white">{item.name}</span>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

            <button
              onClick={handleSaveAvatar}
              disabled={saving}
              className="w-full flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black py-3 rounded-xl transition-all shadow-lg shadow-emerald-500/20 disabled:opacity-50"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              {saving ? 'SAVING...' : 'SAVE APPEARANCE'}
            </button>
          </div>
        </div>

        {/* Content Area (Avatar Options OR Shop) */}
        <div className="w-full lg:w-1/2 flex flex-col bg-[#111622] overflow-hidden">
          {activeTab === 'avatar' && (
            <div className="p-6 overflow-y-auto custom-scrollbar flex-1 space-y-8">
              {/* Base Character Selection */}
              <div className="space-y-3">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Wand2 className="w-4 h-4 text-emerald-400" /> Select Base
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  <button 
                    onClick={() => setBaseCharacter('boy_base')}
                    className={`relative aspect-[4/3] rounded-xl overflow-hidden border-2 transition-all ${baseCharacter === 'boy_base' ? 'border-emerald-500 shadow-lg shadow-emerald-500/20' : 'border-transparent opacity-50 hover:opacity-100'}`}
                  >
                    <img src="/avatar_boy.jpg" className="w-full h-full object-cover" alt="Boy" />
                    {baseCharacter === 'boy_base' && <div className="absolute top-2 right-2 bg-emerald-500 rounded-full p-1"><Check className="w-3 h-3 text-white" /></div>}
                  </button>
                  <button 
                    onClick={() => setBaseCharacter('girl_base')}
                    className={`relative aspect-[4/3] rounded-xl overflow-hidden border-2 transition-all ${baseCharacter === 'girl_base' ? 'border-emerald-500 shadow-lg shadow-emerald-500/20' : 'border-transparent opacity-50 hover:opacity-100'}`}
                  >
                    <img src="/avatar_girl.jpg" className="w-full h-full object-cover" alt="Girl" />
                    {baseCharacter === 'girl_base' && <div className="absolute top-2 right-2 bg-emerald-500 rounded-full p-1"><Check className="w-3 h-3 text-white" /></div>}
                  </button>
                </div>
              </div>

              {/* Inventory (Unlocked Items) */}
              <div className="space-y-3">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-emerald-400" /> Your Inventory
                </h3>
                {unlockedItems.length === 0 ? (
                  <div className="p-8 text-center bg-white/5 border border-white/10 rounded-2xl border-dashed">
                    <p className="text-xs text-slate-400 font-medium">Your inventory is empty.</p>
                    <button onClick={() => setActiveTab('shop')} className="mt-3 text-xs text-emerald-400 font-bold flex items-center justify-center gap-1 w-full hover:text-emerald-300">
                      Visit Shop <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {unlockedItems.map(id => {
                      const item = STORE_CATALOG.find(i => i.id === id);
                      if (!item) return null;
                      const isEquipped = equippedItems.includes(item.id);
                      const IconComp = (Icons as any)[item.icon || 'Circle'];

                      return (
                        <button
                          key={item.id}
                          onClick={() => toggleEquip(item)}
                          className={`relative p-3 rounded-xl border transition-all text-left flex flex-col items-center justify-center gap-2 aspect-square ${isEquipped ? 'bg-emerald-500/10 border-emerald-500 shadow-md shadow-emerald-500/10' : 'bg-white/5 border-white/10 hover:bg-white/10'}`}
                        >
                          <div className={`w-10 h-10 rounded-full ${item.color || 'bg-slate-700'} flex items-center justify-center shadow-inner`}>
                             {IconComp && <IconComp className="w-5 h-5 text-white shadow-sm" />}
                          </div>
                          <span className="text-[10px] font-bold text-slate-200 text-center leading-tight">{item.name}</span>
                          {isEquipped && <div className="absolute top-1.5 right-1.5 bg-emerald-500 w-2 h-2 rounded-full"></div>}
                        </button>
                      )
                    })}
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'shop' && (
            <div className="flex flex-col h-full">
              {/* Category Filter */}
              <div className="flex overflow-x-auto custom-scrollbar gap-2 p-4 border-b border-white/5 bg-slate-900/30">
                {(['head', 'torso', 'accessory', 'pet'] as ItemCategory[]).map(cat => (
                  <button 
                    key={cat}
                    onClick={() => setActiveCategory(cat)}
                    className={`px-3 py-1.5 rounded-lg text-[11px] font-bold uppercase tracking-wider whitespace-nowrap transition-colors ${activeCategory === cat ? 'bg-indigo-500 text-white' : 'bg-white/5 text-slate-400 hover:bg-white/10'}`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
              
              <div className="p-4 overflow-y-auto custom-scrollbar flex-1">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {STORE_CATALOG.filter(i => i.category === activeCategory).map(item => {
                    const isUnlocked = unlockedItems.includes(item.id);
                    const isLockedByLevel = level < item.requiredLevel;
                    const IconComp = (Icons as any)[item.icon || 'Circle'];

                    return (
                      <div key={item.id} className={`p-3 rounded-xl border flex flex-col gap-3 transition-all ${isUnlocked ? 'bg-white/5 border-white/10' : 'bg-slate-900 border-white/5'}`}>
                        <div className="flex items-start gap-3">
                          <div className={`w-12 h-12 rounded-xl ${item.color || 'bg-slate-700'} flex items-center justify-center shrink-0`}>
                            {IconComp && <IconComp className="w-6 h-6 text-white opacity-90" />}
                          </div>
                          <div className="flex-1">
                            <h4 className="text-sm font-bold text-white leading-tight">{item.name}</h4>
                            <div className="mt-1 flex items-center gap-1.5">
                              <Star className={`w-3 h-3 ${isLockedByLevel ? 'text-red-400' : 'text-amber-400'}`} />
                              <span className={`text-[10px] font-bold ${isLockedByLevel ? 'text-red-400' : 'text-slate-400'}`}>Req. Lv {item.requiredLevel}</span>
                            </div>
                          </div>
                        </div>

                        {isUnlocked ? (
                          <div className="w-full py-2 rounded-lg bg-emerald-500/10 text-emerald-400 text-[11px] font-black uppercase text-center border border-emerald-500/20">
                            Purchased
                          </div>
                        ) : (
                          <button
                            onClick={() => handlePurchase(item)}
                            disabled={isLockedByLevel || purchasingId === item.id || coins < item.price}
                            className={`w-full py-2 rounded-lg flex items-center justify-center gap-1.5 text-[11px] font-black uppercase transition-all ${
                              isLockedByLevel 
                                ? 'bg-slate-800 text-slate-500 cursor-not-allowed' 
                                : coins < item.price 
                                  ? 'bg-red-500/10 text-red-400 border border-red-500/20 cursor-not-allowed'
                                  : 'bg-indigo-500 hover:bg-indigo-400 text-white shadow-md shadow-indigo-500/20'
                            }`}
                          >
                            {purchasingId === item.id ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : isLockedByLevel ? (
                              <>
                                <Lock className="w-3.5 h-3.5" /> Locked
                              </>
                            ) : (
                              <>
                                <Coins className="w-3.5 h-3.5" /> {item.price}
                              </>
                            )}
                          </button>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
