import fs from 'fs';
import path from 'path';
import https from 'https';

const images = [
  { name: 'batman.png', url: 'https://static.wikia.nocookie.net/injusticegodsamongus/images/e/e0/Batman.png/revision/latest' },
  { name: 'superman.png', url: 'https://static.wikia.nocookie.net/injusticegodsamongus/images/d/d3/Superman.png/revision/latest' },
  { name: 'ironman.png', url: 'https://static.wikia.nocookie.net/marveldatabase/images/1/12/Iron_Man_Armor_Model_42_from_Marvel_Avengers_Alliance_001.png/revision/latest' },
  { name: 'spiderman.png', url: 'https://static.wikia.nocookie.net/marveldatabase/images/3/3d/Peter_Parker_%28Earth-1048%29_from_Marvel%27s_Spider-Man_2_render_001.png/revision/latest' },
  { name: 'aizen.png', url: 'https://static.wikia.nocookie.net/bleach/images/6/69/Sosuke_Aizen_Ep_293.png/revision/latest' },
  { name: 'luffy.png', url: 'https://static.wikia.nocookie.net/onepiece/images/a/af/Monkey_D._Luffy_Anime_Post_Timeskip_Infobox.png/revision/latest' },
  { name: 'rengoku.png', url: 'https://static.wikia.nocookie.net/kimetsu-no-yaiba/images/8/88/Kyojuro_Rengoku_anime.png/revision/latest' }
];

const dir = path.join(process.cwd(), 'public', 'characters');
if (!fs.existsSync(dir)) {
  fs.mkdirSync(dir, { recursive: true });
}

async function download() {
  for (const img of images) {
    const dest = path.join(dir, img.name);
    console.log(`Downloading ${img.url} to ${dest}...`);
    
    try {
        const response = await fetch(img.url, {
            headers: {
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
                "Accept": "image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8",
                "Referer": "https://google.com"
            }
        });
        
        if (!response.ok) {
            console.error(`Failed to download ${img.url}: ${response.status} ${response.statusText}`);
            continue;
        }
        
        const arrayBuffer = await response.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        
        fs.writeFileSync(dest, buffer);
        console.log(`Successfully saved ${img.name} (${buffer.length} bytes)`);
    } catch (e) {
        console.error(`Error downloading ${img.name}:`, e);
    }
  }
}

download();
