import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Configuration
const ASSET_PACK_PATH = path.join(__dirname, 'public', 'assets', 'asset-pack.json');
const OUTPUT_DIR = path.join(__dirname, 'public', 'assets');
const IMAGES_DIR = path.join(OUTPUT_DIR, 'images');
const AUDIO_DIR = path.join(OUTPUT_DIR, 'audio');
const FONTS_DIR = path.join(OUTPUT_DIR, 'fonts');
const ANIMATIONS_DIR = path.join(OUTPUT_DIR, 'animations');

// Source directories
const SRC_IMAGES = path.join(__dirname, 'images');
const SRC_ANIMATIONS = path.join(__dirname, 'amimation'); // Note: original folder name typo
const SRC_AUDIO = path.join(__dirname, 'given-audio');

// Create all required directories
[IMAGES_DIR, AUDIO_DIR, FONTS_DIR, ANIMATIONS_DIR].forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
    console.log(`📁 Created directory: ${dir}`);
  }
});

function copyFileSync(source, destination) {
  fs.copyFileSync(source, destination);
}

function copyDirectory(src, dest, pattern = null) {
  if (!fs.existsSync(src)) {
    console.log(`⚠️  Source directory not found: ${src}`);
    return 0;
  }

  const files = fs.readdirSync(src);
  let copied = 0;

  files.forEach(file => {
    if (pattern && !file.match(pattern)) return;

    const srcFile = path.join(src, file);
    const destFile = path.join(dest, file);
    const stats = fs.statSync(srcFile);

    if (stats.isFile()) {
      if (!fs.existsSync(destFile)) {
        copyFileSync(srcFile, destFile);
        copied++;
      }
    }
  });

  return copied;
}

// Load existing asset pack
console.log('\n📖 Loading existing asset-pack.json...');
const assetPack = JSON.parse(fs.readFileSync(ASSET_PACK_PATH, 'utf8'));

// Copy and organize assets
console.log('\n📦 Copying assets from source directories...\n');

// Copy images
console.log('🎨 Images:');
const imagesCopied = copyDirectory(SRC_IMAGES, IMAGES_DIR);
console.log(`  ✅ Copied ${imagesCopied} new image files`);

// Copy audio
console.log('\n🔊 Audio:');
const audioCopied = copyDirectory(SRC_AUDIO, AUDIO_DIR);
console.log(`  ✅ Copied ${audioCopied} new audio files`);

// Copy and organize animations
console.log('\n🎬 Animations:');
let animationsCopied = 0;

// Copy sequence frames
const frame1Files = fs.readdirSync(SRC_ANIMATIONS).filter(f => f.match(/^frame_1_\d+\.png$/));
const frame2Files = fs.readdirSync(SRC_ANIMATIONS).filter(f => f.match(/^frame_2_\d+\.png$/));

frame1Files.forEach(file => {
  const srcFile = path.join(SRC_ANIMATIONS, file);
  const destFile = path.join(ANIMATIONS_DIR, file);
  if (!fs.existsSync(destFile)) {
    copyFileSync(srcFile, destFile);
    animationsCopied++;
  }
});

frame2Files.forEach(file => {
  const srcFile = path.join(SRC_ANIMATIONS, file);
  const destFile = path.join(ANIMATIONS_DIR, file);
  if (!fs.existsSync(destFile)) {
    copyFileSync(srcFile, destFile);
    animationsCopied++;
  }
});

// Copy tileset
const tilesetSrc = path.join(SRC_ANIMATIONS, 'soccer_field_tileset.png');
const tilesetDest = path.join(ANIMATIONS_DIR, 'soccer_field_tileset.png');
if (fs.existsSync(tilesetSrc) && !fs.existsSync(tilesetDest)) {
  copyFileSync(tilesetSrc, tilesetDest);
  animationsCopied++;
}

console.log(`  ✅ Copied ${animationsCopied} animation/tileset files`);

// Add animation sequences to asset pack
console.log('\n🎞️  Creating animation sequence entries...');
let animationEntriesAdded = 0;

// Add sequence 1 (frames 1-37)
if (!assetPack.animation_sequences) {
  assetPack.animation_sequences = { files: [] };
}

const seq1Key = 'player_animation_sequence_1';
if (!assetPack.animation_sequences.files.find(f => f.key === seq1Key)) {
  const frames1 = [];
  for (let i = 1; i <= 37; i++) {
    frames1.push(`animations/frame_1_${i}.png`);
  }
  assetPack.animation_sequences.files.push({
    type: 'animation_sequence',
    key: seq1Key,
    frames: frames1,
    frameRate: 10,
    repeat: -1,
    description: 'Player animation sequence 1 (37 frames)'
  });
  animationEntriesAdded++;
  console.log(`  ✅ Added: ${seq1Key}`);
}

// Add sequence 2 (frames 1-37)
const seq2Key = 'player_animation_sequence_2';
if (!assetPack.animation_sequences.files.find(f => f.key === seq2Key)) {
  const frames2 = [];
  for (let i = 1; i <= 37; i++) {
    frames2.push(`animations/frame_2_${i}.png`);
  }
  assetPack.animation_sequences.files.push({
    type: 'animation_sequence',
    key: seq2Key,
    frames: frames2,
    frameRate: 10,
    repeat: -1,
    description: 'Player animation sequence 2 (37 frames)'
  });
  animationEntriesAdded++;
  console.log(`  ✅ Added: ${seq2Key}`);
}

// Add tileset
if (!assetPack.tilesets) {
  assetPack.tilesets = { files: [] };
}

if (!assetPack.tilesets.files.find(f => f.key === 'soccer_field_tileset')) {
  assetPack.tilesets.files.push({
    type: 'image',
    key: 'soccer_field_tileset',
    url: 'animations/soccer_field_tileset.png'
  });
  console.log(`  ✅ Added: soccer_field_tileset`);
}

// Add new player variants to UI images
console.log('\n👥 Adding player variants...');
let variantsAdded = 0;

const playerVariants = [
  { key: 'player_blue_back', file: 'player_blue_back_view.png' },
  { key: 'player_blue_front', file: 'player_blue_front_view.png' },
  { key: 'player_blue_side', file: 'player_blue_side_view.png' },
  { key: 'player_blue_three', file: 'player_blue_three_views.png' },
  { key: 'player_red_back', file: 'player_red_back_view.png' },
  { key: 'player_red_front', file: 'player_red_front_view.png' },
  { key: 'player_red_side', file: 'player_red_side_view.png' },
  { key: 'player_red_three', file: 'player_red_three_views.png' },
  { key: 'player_messi_back', file: '梅西风格球员_back_view.png' },
  { key: 'player_messi_front', file: '梅西风格球员_front_view.png' },
  { key: 'player_messi_side', file: '梅西风格球员_side_view.png' },
  { key: 'player_messi_three', file: '梅西风格球员_three_views.png' },
  { key: 'player_ronaldo_back', file: 'C罗风格球员_back_view.png' },
  { key: 'player_ronaldo_front', file: 'C罗风格球员_front_view.png' },
  { key: 'player_ronaldo_side', file: 'C罗风格球员_side_view.png' },
  { key: 'player_ronaldo_three', file: 'C罗风格球员_three_views.png' }
];

if (!assetPack.player_variants) {
  assetPack.player_variants = { files: [] };
}

playerVariants.forEach(variant => {
  if (!assetPack.player_variants.files.find(f => f.key === variant.key)) {
    assetPack.player_variants.files.push({
      type: 'image',
      key: variant.key,
      url: `images/${variant.file}`
    });
    variantsAdded++;
  }
});

console.log(`  ✅ Added ${variantsAdded} player variants`);

// Add goal variants
console.log('\n🥅 Adding goal variants...');
let goalsAdded = 0;

const goalVariants = [
  { key: 'goal_cartoon_left', file: 'cartoon_goal_left.png' },
  { key: 'goal_cartoon_right', file: 'cartoon_goal_right.png' },
  { key: 'goal_fixed_left', file: 'fixed_goal_left.png' },
  { key: 'goal_fixed_right', file: 'fixed_goal_right.png' },
  { key: 'goal_post_left', file: 'left_goal_post.png' },
  { key: 'goal_post_right', file: 'right_goal_post.png' }
];

if (!assetPack.goal_variants) {
  assetPack.goal_variants = { files: [] };
}

goalVariants.forEach(goal => {
  if (!assetPack.goal_variants.files.find(f => f.key === goal.key)) {
    assetPack.goal_variants.files.push({
      type: 'image',
      key: goal.key,
      url: `images/${goal.file}`
    });
    goalsAdded++;
  }
});

console.log(`  ✅ Added ${goalsAdded} goal variants`);

// Update audio references
console.log('\n🔊 Updating audio references...');

const audioUpdates = [
  { key: 'button_click', newFile: 'button_click_3.mp3' },
  { key: 'slide_tackle', newFile: 'slide_tackle_2.mp3' },
  { key: 'whistle', newFile: 'whistle_2.mp3' },
  { key: 'soccer_match_theme', newFile: 'soccer_match_theme_2.wav' }
];

let audioUpdated = 0;
audioUpdates.forEach(update => {
  const categoryKey = Object.keys(assetPack).find(cat => 
    assetPack[cat].files && assetPack[cat].files.find(f => f.key === update.key)
  );
  
  if (categoryKey) {
    const file = assetPack[categoryKey].files.find(f => f.key === update.key);
    if (file && fs.existsSync(path.join(AUDIO_DIR, update.newFile))) {
      file.url = `audio/${update.newFile}`;
      audioUpdated++;
      console.log(`  ✅ Updated: ${update.key} → ${update.newFile}`);
    }
  }
});

// Save updated asset pack
console.log(`\n💾 Saving updated asset-pack.json...`);
fs.writeFileSync(ASSET_PACK_PATH, JSON.stringify(assetPack, null, 2), 'utf8');

// Print summary
console.log(`\n${'='.repeat(70)}`);
console.log(`📊 ASSET INTEGRATION SUMMARY`);
console.log(`${'='.repeat(70)}`);
console.log(`✅ Images copied: ${imagesCopied}`);
console.log(`✅ Audio files copied: ${audioCopied}`);
console.log(`✅ Animation frames copied: ${animationsCopied}`);
console.log(`✅ Animation sequences added: ${animationEntriesAdded}`);
console.log(`✅ Player variants added: ${variantsAdded}`);
console.log(`✅ Goal variants added: ${goalsAdded}`);
console.log(`✅ Audio references updated: ${audioUpdated}`);
console.log(`${'='.repeat(70)}`);
console.log(`\n📁 All assets organized in: ${OUTPUT_DIR}`);
console.log(`\n🎮 Game is now complete with:`);
console.log(`   - Multiple player character styles (Messi, Ronaldo, Blue, Red)`);
console.log(`   - Multiple goal variants (standard, cartoon, fixed)`);
console.log(`   - Full animation sequences (74 frames total)`);
console.log(`   - Complete audio set (music + sound effects)`);
console.log(`   - UI elements and special effects`);
console.log(`\n✨ Ready to build and test!`);
console.log(`${'='.repeat(70)}\n`);
