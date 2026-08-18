export type ItemCategory = 'head' | 'torso' | 'legs' | 'accessory' | 'pet';

export interface StoreItem {
  id: string;
  name: string;
  category: ItemCategory;
  price: number;
  requiredLevel: number;
  imageUrl?: string;
  color?: string; // fallback if no image
  icon?: string; // lucide icon name
}

export const STORE_CATALOG: StoreItem[] = [
  // Head
  { id: 'h_cap_basic', name: 'Freshman Cap', category: 'head', price: 100, requiredLevel: 1, icon: 'GraduationCap', color: 'bg-blue-500' },
  { id: 'h_headphones', name: 'Gamer Headphones', category: 'head', price: 500, requiredLevel: 3, icon: 'Headphones', color: 'bg-purple-500' },
  { id: 'h_crown', name: 'King Crown', category: 'head', price: 2500, requiredLevel: 10, icon: 'Crown', color: 'bg-amber-400' },
  { id: 'h_frog', name: 'Frog Hat', category: 'head', price: 1200, requiredLevel: 5, icon: 'Smile', color: 'bg-emerald-500' },

  // Torso
  { id: 't_hoodie', name: 'Campus Hoodie', category: 'torso', price: 300, requiredLevel: 2, icon: 'Shirt', color: 'bg-slate-800' },
  { id: 't_jacket', name: 'Varsity Jacket', category: 'torso', price: 800, requiredLevel: 4, icon: 'Shirt', color: 'bg-red-500' },
  { id: 't_suit', name: 'Executive Suit', category: 'torso', price: 3000, requiredLevel: 8, icon: 'Briefcase', color: 'bg-zinc-900' },
  { id: 't_tribal', name: 'Tribal Vest', category: 'torso', price: 1500, requiredLevel: 6, icon: 'Shirt', color: 'bg-orange-700' },

  // Accessories
  { id: 'a_glasses', name: 'Nerd Glasses', category: 'accessory', price: 200, requiredLevel: 1, icon: 'Glasses', color: 'bg-slate-300' },
  { id: 'a_watch', name: 'Smart Watch', category: 'accessory', price: 600, requiredLevel: 3, icon: 'Watch', color: 'bg-indigo-400' },
  { id: 'a_staff', name: 'Magic Staff', category: 'accessory', price: 2000, requiredLevel: 7, icon: 'Wand2', color: 'bg-amber-700' },
  { id: 'a_wings', name: 'Fairy Wings', category: 'accessory', price: 4000, requiredLevel: 12, icon: 'Feather', color: 'bg-pink-300' },

  // Pets
  { id: 'p_cat', name: 'Cyber Kitty', category: 'pet', price: 1000, requiredLevel: 5, icon: 'Cat', color: 'bg-fuchsia-500' },
  { id: 'p_dog', name: 'Robo Dog', category: 'pet', price: 1000, requiredLevel: 5, icon: 'Dog', color: 'bg-blue-400' },
  { id: 'p_dragon', name: 'Mini Dragon', category: 'pet', price: 5000, requiredLevel: 15, icon: 'Flame', color: 'bg-red-600' },
];
