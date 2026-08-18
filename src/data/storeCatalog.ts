export type ItemCategory = 'character';

export interface StoreItem {
  id: string;
  name: string;
  category: ItemCategory;
  price: number;
  requiredLevel: number;
  modelPath: string; // The path to the 3D GLB file
  icon?: string; // lucide icon name
  color?: string; // fallback
}

export const STORE_CATALOG: StoreItem[] = [
  { 
    id: 'char_batman', 
    name: 'Lego Batman', 
    category: 'character', 
    price: 500, 
    requiredLevel: 2, 
    modelPath: '/models/lego_batman.glb',
    icon: 'User', 
    color: 'bg-zinc-800' 
  },
  { 
    id: 'char_spiderman', 
    name: 'Spider-Man', 
    category: 'character', 
    price: 1000, 
    requiredLevel: 5, 
    modelPath: '/models/spider-man_brand_new_day.glb',
    icon: 'User', 
    color: 'bg-red-600' 
  }
];
