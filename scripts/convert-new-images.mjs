import sharp from 'sharp';
import path from 'node:path';
import fs from 'node:fs/promises';

const ROOT = path.resolve(process.cwd(), 'public/images');
const NEW = path.join(ROOT, 'new');

// [sourceJpeg, destWebp] — paths relative to public/images
const map = [
  // Compound-level
  ['Moulin a Reve 5 bedrooms/Moulin a Reves estate with river.jpeg', 'hero-compound.webp'],
  ['gardens moulin/put your feet up and rest dusk.jpeg', 'evening-compound.webp'],
  ['gardens moulin/the giverny bridge.jpeg', 'bridge-garden.webp'],
  ['Moulin a Reve 5 bedrooms/Moulin a reve master ext  welcome to the compound.jpeg', 'homes/all-three.webp'],

  // Le Moulin
  ['Moulin a Reve 5 bedrooms/moulin a reves ext.jpeg', 'homes/le-moulin-hero.webp'],
  ['Moulin a Reve 5 bedrooms/living room.jpeg', 'homes/le-moulin-living.webp'],
  ['Moulin a Reve 5 bedrooms/river room 2 twins.jpeg', 'homes/le-moulin-river-room.webp'],
  ['Moulin a Reve 5 bedrooms/suite romantique best.jpeg', 'homes/le-moulin-suite-romantique.webp'],
  ['Moulin a Reve 5 bedrooms/cherries 2.jpeg', 'homes/le-moulin-cerises.webp'],
  ['Moulin a Reve 5 bedrooms/The rose bedroom.jpeg', 'homes/le-moulin-roses.webp'],
  ['Moulin a Reve 5 bedrooms/le loft bedroom master.jpeg', 'homes/le-moulin-loft.webp'],
  ['Moulin a Reve 5 bedrooms/ kitchen table 2 moulin.jpeg', 'homes/le-moulin-kitchen.webp'],
  ['Moulin a Reve 5 bedrooms/dining room le moulin great.jpeg', 'homes/le-moulin-dining.webp'],

  // Hollywood Hideaway (legacy "la-grange-*" paths)
  ['Hollywood Hideaway/ext hollywood hideaway 1 patio facing home.jpeg', 'homes/la-grange-hero.webp'],
  ['Hollywood Hideaway/dining and living room HH.jpeg', 'homes/la-grange-living.webp'],
  ['Hollywood Hideaway/through the looking glass.jpeg', 'homes/hh-looking-glass.webp'],
  ['Hollywood Hideaway/sitting room suite - the secret garden.jpeg', 'homes/hh-secret-garden.webp'],
  ['Hollywood Hideaway/American in Paris lead photo.jpeg', 'homes/hh-american-in-paris.webp'],
  ['Hollywood Hideaway/sleeping beauty 1 loft facing beds.jpeg', 'homes/hh-sleeping-beauty.webp'],
  ['Hollywood Hideaway/kitchen hollywood hideawy.jpeg', 'homes/hh-kitchen.webp'],
  ['Hollywood Hideaway/gazeebo HH.jpeg', 'homes/hh-gazebo.webp'],

  // Maison de la Rivière (legacy "le-jardin-*" path)
  ['River House New/maison de la riviere with the river.jpeg', 'homes/le-jardin-hero.webp'],
  ['River House New/chambre des artistes wide.jpeg', 'homes/maison-artistes.webp'],
  ['River House New/La chambre des ecriteurs.jpeg', 'homes/maison-ecrivains.webp'],
  ['River House New/living room trunk.jpeg', 'homes/maison-living.webp'],
  ['River House New/dining room 3 board table angle.jpeg', 'homes/maison-dining.webp'],
  ['River House New/eat in kitchen Maison sur la Riviere.jpeg', 'homes/maison-kitchen.webp'],

  // Grange + amenities (existing slot replacements)
  ['the grange new/the gym mirror.jpeg', 'gym.webp'],
  ['the grange new/the screening room.jpeg', 'screening-room.webp'],
  ['the grange new/grange 1 dinner is served GREAT.jpeg', 'barn-events.webp'],
  ['Hollywood Hideaway/gazeebo HH.jpeg', 'gazebo-dining.webp'],
  ['Moulin a Reve 5 bedrooms/marie antoinette patio croissants.jpeg', 'outdoor-dining.webp'],
  ['gardens moulin/breakfast in garden.jpeg', 'catering-table.webp'],
  ['the grange new/grange 1 dinner is served GREAT.jpeg', 'group-dinner.webp'],
  ['gardens moulin/lovely garden no jetson.jpeg', 'yoga-lawn.webp'],
];

const HERO_WIDTH = 2400; // for full-bleed heroes
const STD_WIDTH = 1800;  // for everything else
const QUALITY = 82;

const heroes = new Set([
  'hero-compound.webp',
  'evening-compound.webp',
  'bridge-garden.webp',
  'homes/all-three.webp',
  'homes/le-moulin-hero.webp',
  'homes/la-grange-hero.webp',
  'homes/le-jardin-hero.webp',
]);

let ok = 0, fail = 0;
for (const [src, dst] of map) {
  const srcPath = path.join(NEW, src);
  const dstPath = path.join(ROOT, dst);
  try {
    await fs.mkdir(path.dirname(dstPath), { recursive: true });
    const width = heroes.has(dst) ? HERO_WIDTH : STD_WIDTH;
    await sharp(srcPath)
      .rotate() // honor EXIF orientation
      .resize({ width, withoutEnlargement: true })
      .webp({ quality: QUALITY })
      .toFile(dstPath);
    const { size } = await fs.stat(dstPath);
    console.log(`OK  ${dst}  (${(size / 1024).toFixed(0)}KB)`);
    ok++;
  } catch (e) {
    console.error(`ERR ${dst}: ${e.message}`);
    fail++;
  }
}
console.log(`\nDone. ${ok} ok, ${fail} failed.`);
