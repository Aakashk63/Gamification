import React, { useState, useEffect } from 'react';
import { STORE_CATALOG, type StoreItem, type ItemCategory } from '../data/storeCatalog';
import { apiGetProfile, apiPurchaseItem, apiUpdateAvatarState, type ApiProfile } from '../lib/api';
import { ArrowLeft, Coins, Lock, Loader2, Undo, ShoppingCart, User, HelpCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import * as Icons from 'lucide-react';

export const AvatarStorePage: React.FC = () => {
  const navigate = useNavigate();
  const [profile, setProfile] = useState<ApiProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  // Local state
  const [activeCategory, setActiveCategory] = useState<ItemCategory>('head');
  const [baseCharacter, setBaseCharacter] = useState<'boy_base' | 'girl_base'>('boy_base');
  const [equippedItems, setEquippedItems] = useState<string[]>([]);
  
  const [purchasingId, setPurchasingId] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const p = await apiGetProfile();
      setProfile(p);
      setBaseCharacter((p.base_character as any) || 'boy_base');
      setEquippedItems(p.equipped_items || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!profile) return;
    setSaving(true);
    setErrorMsg('');
    try {
      await apiUpdateAvatarState(baseCharacter, equippedItems);
      navigate('/profile');
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to save avatar');
      setSaving(false);
    }
  };

  const handleReset = () => {
    if (profile) {
      setBaseCharacter((profile.base_character as any) || 'boy_base');
      setEquippedItems(profile.equipped_items || []);
    }
  };

  const handlePurchase = async (item: StoreItem) => {
    if (!profile) return;
    
    const level = profile.level || 1;
    const coins = profile.coins || 0;

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
      await fetchProfile(); // Reload profile to get new coins/inventory
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to purchase item');
    } finally {
      setPurchasingId(null);
    }
  };

  const toggleEquip = (item: StoreItem) => {
    setEquippedItems((prev) => {
      if (prev.includes(item.id)) {
        return prev.filter((id) => id !== item.id);
      }
      const otherCategories = prev.filter((id) => {
        const i = STORE_CATALOG.find((x) => x.id === id);
        return i?.category !== item.category;
      });
      return [...otherCategories, item.id];
    });
  };

  if (loading || !profile) {
    return <div className="h-screen w-screen flex items-center justify-center bg-[#070b14]"><Loader2 className="w-8 h-8 text-emerald-400 animate-spin" /></div>;
  }

  const level = profile.level || 1;
  const coins = profile.coins || 0;
  const unlockedItems = profile.unlocked_items || [];

  const CATEGORIES = [
    { id: 'head', label: 'Hats', icon: User },
    { id: 'torso', label: 'Shirts', icon: ShoppingCart },
    { id: 'accessory', label: 'Accessories', icon: HelpCircle },
    { id: 'pet', label: 'Pets', icon: HelpCircle }
  ] as const;

  const equippedDetails = equippedItems.map(id => STORE_CATALOG.find(i => i.id === id)).filter(Boolean) as StoreItem[];

  return (
    <div className="fixed inset-0 bg-[#070b14] flex flex-col font-sans overflow-hidden">
      {/* Top Header */}
      <header className="h-14 border-b border-white/5 flex items-center justify-between px-6 bg-slate-900/40">
        <button 
          onClick={() => navigate('/profile')}
          className="flex items-center gap-2 text-slate-300 hover:text-white font-semibold transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Exit
        </button>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 bg-amber-500/10 border border-amber-500/20 px-3 py-1 rounded-full">
            <span className="text-xs font-black text-amber-400">LVL {level}</span>
          </div>
          <div className="flex items-center gap-2 bg-yellow-500/10 border border-yellow-500/20 px-3 py-1 rounded-full">
            <Coins className="w-4 h-4 text-yellow-400" />
            <span className="text-sm font-black text-yellow-400">{coins}</span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex h-[calc(100vh-3.5rem)]">
        
        {/* Left Sidebar (Categories) */}
        <aside className="w-20 border-r border-white/5 bg-slate-900/20 flex flex-col items-center py-4 gap-2 overflow-y-auto custom-scrollbar">
          {CATEGORIES.map(cat => {
            const Icon = cat.icon;
            const isActive = activeCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id as ItemCategory)}
                className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all ${isActive ? 'bg-white text-slate-900 shadow-lg shadow-white/20' : 'text-slate-400 hover:bg-white/5 hover:text-white'}`}
                title={cat.label}
              >
                <Icon className="w-5 h-5" />
              </button>
            )
          })}
        </aside>

        {/* Center Item Grid */}
        <div className="flex-1 bg-slate-900/10 border-r border-white/5 flex flex-col relative">
          <div className="p-6 border-b border-white/5 flex items-center justify-between">
            <h2 className="text-lg font-bold text-white capitalize">{activeCategory}</h2>
            <span className="text-xs font-semibold text-slate-500">{STORE_CATALOG.filter(i => i.category === activeCategory).length} items</span>
          </div>
          
          <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
            {errorMsg && (
              <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm font-bold flex items-center justify-between">
                <span>{errorMsg}</span>
                <button onClick={() => setErrorMsg('')} className="text-red-400 hover:text-red-300">&times;</button>
              </div>
            )}
            
            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
              {STORE_CATALOG.filter(i => i.category === activeCategory).map(item => {
                const isUnlocked = unlockedItems.includes(item.id);
                const isEquipped = equippedItems.includes(item.id);
                const isLockedByLevel = level < item.requiredLevel;
                const IconComp = (Icons as any)[item.icon || 'Circle'];

                return (
                  <div 
                    key={item.id} 
                    className={`relative rounded-2xl border p-4 flex flex-col items-center gap-3 transition-all ${isEquipped ? 'bg-emerald-500/10 border-emerald-500/50 shadow-[0_0_15px_rgba(16,185,129,0.1)]' : 'bg-white/5 border-white/5 hover:bg-white/10 hover:border-white/10'}`}
                  >
                    {/* Rare Tag (Example logic: > 2000 price is rare) */}
                    {item.price >= 2000 && (
                      <div className="absolute -top-2 -right-2 bg-fuchsia-500 text-white text-[9px] font-black uppercase px-2 py-0.5 rounded-full shadow-lg">
                        Rare
                      </div>
                    )}
                    
                    <div className={`w-20 h-20 rounded-xl ${item.color || 'bg-slate-800'} flex items-center justify-center shrink-0 shadow-inner`}>
                      {IconComp && <IconComp className="w-10 h-10 text-white/90" />}
                    </div>
                    
                    <div className="text-center w-full">
                      <div className="text-sm font-bold text-slate-200 truncate">{item.name}</div>
                    </div>

                    <div className="w-full mt-auto">
                      {isUnlocked ? (
                        <button
                          onClick={() => toggleEquip(item)}
                          className={`w-full py-2 rounded-xl text-xs font-black uppercase transition-all ${isEquipped ? 'bg-emerald-500 text-slate-950' : 'bg-slate-700 hover:bg-slate-600 text-white'}`}
                        >
                          {isEquipped ? 'Equipped' : 'Equip'}
                        </button>
                      ) : (
                        <button
                          onClick={() => handlePurchase(item)}
                          disabled={isLockedByLevel || purchasingId === item.id || coins < item.price}
                          className={`w-full py-2 rounded-xl flex items-center justify-center gap-1.5 text-xs font-black uppercase transition-all ${
                            isLockedByLevel 
                              ? 'bg-slate-800/50 text-slate-500 cursor-not-allowed border border-white/5' 
                              : coins < item.price 
                                ? 'bg-red-500/10 text-red-400 border border-red-500/20 cursor-not-allowed'
                                : 'bg-slate-100 hover:bg-white text-slate-900 shadow-md'
                          }`}
                        >
                          {purchasingId === item.id ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : isLockedByLevel ? (
                            <>
                              <Lock className="w-3.5 h-3.5" /> Lv {item.requiredLevel}
                            </>
                          ) : (
                            <>
                              <Coins className="w-3.5 h-3.5" /> {item.price}
                            </>
                          )}
                        </button>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        {/* Right Panel (Avatar Preview Room) */}
        <div className="w-80 lg:w-[450px] relative flex flex-col bg-[#0b0f19]">
          <div className="absolute inset-0 z-0">
             <img src="/scifi_lab.jpg" alt="Sci-fi Room" className="w-full h-full object-cover opacity-80" />
             <div className="absolute inset-0 bg-gradient-to-t from-[#0b0f19] via-transparent to-transparent"></div>
          </div>
          
          <div className="relative z-10 flex-1 flex flex-col p-6">
            <div className="flex items-center justify-between">
              <h2 className="text-white font-bold tracking-wide">My Qbit</h2>
              <span className="text-[10px] text-slate-400 bg-black/40 px-2 py-1 rounded-md">Changes saved on exit</span>
            </div>

            {/* Render Character and Equipped Items overlay */}
            <div className="flex-1 flex items-center justify-center relative mt-8">
              <div className="relative w-48 h-64 lg:w-64 lg:h-80 drop-shadow-2xl flex items-center justify-center">
                 <img src="/avatar_white.png" alt="Base Avatar" className="max-w-full max-h-full object-contain drop-shadow-2xl" onError={(e) => { e.currentTarget.src = 'https://i.imgur.com/8Qj8M4Z.png'; }} />
                 
                 {/* Visual list of equipped items over the character for context */}
                 <div className="absolute -right-4 top-4 flex flex-col gap-2">
                   {equippedDetails.map(item => {
                     const IconComp = (Icons as any)[item.icon || 'Circle'];
                     return (
                       <div key={item.id} className="w-8 h-8 rounded-full bg-white text-slate-900 flex items-center justify-center shadow-lg border-2 border-white/20" title={item.name}>
                          {IconComp && <IconComp className="w-4 h-4" />}
                       </div>
                     )
                   })}
                 </div>
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="mt-auto space-y-3 pt-6">
              <button
                onClick={handleSave}
                disabled={saving}
                className="w-full py-4 rounded-xl bg-white hover:bg-slate-100 text-slate-900 font-black tracking-wide shadow-[0_0_20px_rgba(255,255,255,0.2)] transition-all flex items-center justify-center gap-2"
              >
                {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Save my Qbit'}
              </button>
              
              <div className="flex gap-2">
                <button
                  onClick={() => navigate('/task')}
                  className="flex-1 py-2.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-500 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors border border-amber-500/20"
                >
                  <Coins className="w-3.5 h-3.5" /> Earn more coins
                </button>
                <button
                  onClick={handleReset}
                  className="py-2.5 px-4 rounded-xl text-slate-400 hover:text-white hover:bg-white/5 text-xs font-bold flex items-center gap-1.5 transition-colors"
                >
                  <Undo className="w-3.5 h-3.5" /> Reset
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
