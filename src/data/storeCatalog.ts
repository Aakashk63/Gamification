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
    imagePath: 'https://static.wikia.nocookie.net/injusticegodsamongus/images/e/e0/Batman.png',
    icon: 'User', 
    color: 'bg-zinc-800' 
  },
  { 
    id: 'char_superman', 
    name: 'Superman', 
    category: 'character', 
    price: 600, 
    requiredLevel: 2, 
    imagePath: 'https://static.wikia.nocookie.net/injusticegodsamongus/images/d/d3/Superman.png',
    icon: 'User', 
    color: 'bg-blue-600' 
  },
  { 
    id: 'char_ironman', 
    name: 'Iron Man', 
    category: 'character', 
    price: 800, 
    requiredLevel: 3, 
    imagePath: 'https://static.wikia.nocookie.net/marveldatabase/images/1/12/Iron_Man_Armor_Model_42_from_Marvel_Avengers_Alliance_001.png',
    icon: 'User', 
    color: 'bg-red-500' 
  },
  { 
    id: 'char_spiderman', 
    name: 'Spider-Man', 
    category: 'character', 
    price: 1000, 
    requiredLevel: 5, 
    imagePath: 'https://static.wikia.nocookie.net/marveldatabase/images/3/3d/Peter_Parker_%28Earth-1048%29_from_Marvel%27s_Spider-Man_2_render_001.png',
    icon: 'User', 
    color: 'bg-red-600' 
  },
  { 
    id: 'char_aizen', 
    name: 'Sosuke Aizen', 
    category: 'character', 
    price: 1500, 
    requiredLevel: 7, 
    imagePath: 'https://static.wikia.nocookie.net/bleach/images/6/69/Sosuke_Aizen_Ep_293.png',
    icon: 'User', 
    color: 'bg-purple-600' 
  },
  { 
    id: 'char_luffy', 
    name: 'Monkey D. Luffy', 
    category: 'character', 
    price: 2000, 
    requiredLevel: 10, 
    imagePath: 'https://static.wikia.nocookie.net/onepiece/images/a/af/Monkey_D._Luffy_Anime_Post_Timeskip_Infobox.png',
    icon: 'User', 
    color: 'bg-yellow-500' 
  },
  { 
    id: 'char_rengoku', 
    name: 'Kyojuro Rengoku', 
    category: 'character', 
    price: 2500, 
    requiredLevel: 12, 
    imagePath: 'https://static.wikia.nocookie.net/kimetsu-no-yaiba/images/8/88/Kyojuro_Rengoku_anime.png',
    icon: 'User', 
    color: 'bg-orange-500' 
  }
];
