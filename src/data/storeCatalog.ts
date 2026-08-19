export type ItemCategory = 'character';

export interface StoreItem {
  id: string;
  name: string;
  category: ItemCategory;
  price: number;
  requiredLevel: number;
  imagePath: string; // The path to the transparent PNG character render
  icon?: string; // lucide icon name
  color?: string; // fallback
}

export const STORE_CATALOG: StoreItem[] = [
  { 
    id: 'char_batman', 
    name: 'Batman', 
    category: 'character', 
    price: 500, 
    requiredLevel: 1, 
    imagePath: 'https://i.pinimg.com/736x/52/85/9c/52859c699bcfc296971839f5586cb1e2.jpg',
    icon: 'User', 
    color: 'bg-zinc-800' 
  },
  { 
    id: 'char_superman', 
    name: 'Superman', 
    category: 'character', 
    price: 600, 
    requiredLevel: 2, 
    imagePath: 'https://i.pinimg.com/736x/de/e9/0e/dee90e09fe4cd89faed2f0678d990bac.jpg',
    icon: 'User', 
    color: 'bg-blue-600' 
  },
  { 
    id: 'char_ironman', 
    name: 'Iron Man', 
    category: 'character', 
    price: 800, 
    requiredLevel: 3, 
    imagePath: 'https://images.unsplash.com/photo-1608889175123-8ee362201f81?w=500&auto=format&fit=crop&q=80',
    icon: 'User', 
    color: 'bg-red-500' 
  },
  { 
    id: 'char_spiderman', 
    name: 'Spider-Man', 
    category: 'character', 
    price: 1000, 
    requiredLevel: 5, 
    imagePath: 'https://images.unsplash.com/photo-1635805737707-575885ab0820?w=500&auto=format&fit=crop&q=80',
    icon: 'User', 
    color: 'bg-red-600' 
  },
  { 
    id: 'char_aizen', 
    name: 'Sosuke Aizen', 
    category: 'character', 
    price: 1500, 
    requiredLevel: 7, 
    imagePath: 'https://images.unsplash.com/photo-1578632767115-351597cf2477?w=500&auto=format&fit=crop&q=80',
    icon: 'User', 
    color: 'bg-purple-600' 
  },
  { 
    id: 'char_luffy', 
    name: 'Monkey D. Luffy', 
    category: 'character', 
    price: 2000, 
    requiredLevel: 10, 
    imagePath: 'https://images.unsplash.com/photo-1606606774391-729f213df839?w=500&auto=format&fit=crop&q=80',
    icon: 'User', 
    color: 'bg-yellow-500' 
  },
  { 
    id: 'char_rengoku', 
    name: 'Kyojuro Rengoku', 
    category: 'character', 
    price: 2500, 
    requiredLevel: 12, 
    imagePath: 'https://images.unsplash.com/photo-1618336753974-aae8e04506aa?w=500&auto=format&fit=crop&q=80',
    icon: 'User', 
    color: 'bg-orange-500' 
  }
];
