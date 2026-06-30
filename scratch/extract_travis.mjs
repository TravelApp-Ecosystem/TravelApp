import fs from 'fs';
import path from 'path';

const assetsDir = path.resolve(process.cwd(), 'assets');
const files = fs.readdirSync(assetsDir);

files.forEach(file => {
  if (file.startsWith('travis_') && file.endsWith('.svg')) {
    const filePath = path.join(assetsDir, file);
    const content = fs.readFileSync(filePath, 'utf-8');
    
    // Buscar la expresión data:image/png;base64,
    const base64Regex = /data:image\/png;base64,([a-zA-Z0-9+/=]+)/;
    const match = content.match(base64Regex);
    
    if (match && match[1]) {
      const pngName = file.replace('.svg', '.png');
      const pngPath = path.join(assetsDir, pngName);
      
      const buffer = Buffer.from(match[1], 'base64');
      fs.writeFileSync(pngPath, buffer);
      console.log(`✅ Extraído: ${file} -> ${pngName}`);
    } else {
      console.log(`❌ No se encontró base64 en: ${file}`);
    }
  }
});
