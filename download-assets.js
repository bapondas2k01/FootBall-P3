import fs from 'fs';
import path from 'path';
import https from 'https';
import http from 'http';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Configuration
const ASSET_PACK_PATH = path.join(__dirname, 'public', 'assets', 'asset-pack.json');
const OUTPUT_DIR = path.join(__dirname, 'public', 'assets');
const IMAGES_DIR = path.join(OUTPUT_DIR, 'images');
const AUDIO_DIR = path.join(OUTPUT_DIR, 'audio');
const FONTS_DIR = path.join(OUTPUT_DIR, 'fonts');

// Create directories if they don't exist
[IMAGES_DIR, AUDIO_DIR, FONTS_DIR].forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
    console.log(`📁 Created directory: ${dir}`);
  }
});

// Read original asset pack
console.log('\n📖 Reading asset-pack.json...');
const assetPack = JSON.parse(fs.readFileSync(ASSET_PACK_PATH, 'utf8'));

// Download file with retry logic
async function downloadFile(url, filePath) {
  return new Promise((resolve, reject) => {
    const protocol = url.startsWith('https') ? https : http;
    const maxRetries = 3;
    let retries = 0;

    const attemptDownload = () => {
      protocol.get(url, (response) => {
        if (response.statusCode === 302 || response.statusCode === 301) {
          // Handle redirects
          downloadFile(response.headers.location, filePath).then(resolve).catch(reject);
          return;
        }

        if (response.statusCode !== 200) {
          reject(new Error(`Failed to download: ${url} (Status: ${response.statusCode})`));
          return;
        }

        const file = fs.createWriteStream(filePath);
        response.pipe(file);
        
        file.on('finish', () => {
          file.close();
          resolve();
        });
        
        file.on('error', (err) => {
          fs.unlink(filePath, () => {});
          reject(err);
        });
      }).on('error', (err) => {
        if (retries < maxRetries) {
          retries++;
          console.log(`  ⚠️  Retry ${retries}/${maxRetries} for ${path.basename(filePath)}`);
          attemptDownload();
        } else {
          reject(err);
        }
      });
    };

    attemptDownload();
  });
}

// Process and download all assets
async function downloadAllAssets() {
  let downloaded = 0;
  let failed = 0;
  const failedAssets = [];

  for (const category in assetPack) {
    if (category === 'meta') continue;
    
    const categoryData = assetPack[category];
    if (!categoryData.files) continue;

    console.log(`\n📦 Category: ${category}`);
    
    for (const file of categoryData.files) {
      const url = file.url;
      if (!url) {
        console.log(`  ⚠️  No URL for key: ${file.key}`);
        continue;
      }

      // Determine destination directory and filename
      let destDir = OUTPUT_DIR;
      let filename = null;
      let relativeUrl = null;

      if (file.type === 'font') {
        destDir = FONTS_DIR;
        // Extract filename from URL
        filename = new URL(url).pathname.split('/').pop();
        relativeUrl = `fonts/${filename}`;
      } else if (file.type === 'image') {
        destDir = IMAGES_DIR;
        // Keep meaningful names: use key as filename with extension
        filename = `${file.key}.png`;
        relativeUrl = `images/${filename}`;
      } else if (file.type === 'audio') {
        destDir = AUDIO_DIR;
        // Extract extension from URL
        const urlPath = new URL(url).pathname;
        const ext = path.extname(urlPath) || '.mp3';
        filename = `${file.key}${ext}`;
        relativeUrl = `audio/${filename}`;
      }

      if (!filename) {
        console.log(`  ⚠️  Could not determine filename for ${file.key}`);
        continue;
      }

      const filePath = path.join(destDir, filename);

      // Check if file already exists
      if (fs.existsSync(filePath)) {
        const stats = fs.statSync(filePath);
        console.log(`  ✅ Already exists: ${filename} (${stats.size} bytes)`);
        
        // Update asset pack with local path
        file.url = relativeUrl;
        downloaded++;
        continue;
      }

      try {
        console.log(`  ⏳ Downloading: ${filename}`);
        await downloadFile(url, filePath);
        
        const stats = fs.statSync(filePath);
        console.log(`  ✅ Downloaded: ${filename} (${stats.size} bytes)`);
        
        // Update asset pack with local path
        file.url = relativeUrl;
        downloaded++;
      } catch (error) {
        console.error(`  ❌ Failed: ${filename} - ${error.message}`);
        failed++;
        failedAssets.push({ key: file.key, url, error: error.message });
      }
    }
  }

  // Save updated asset pack
  console.log(`\n💾 Saving updated asset-pack.json...`);
  fs.writeFileSync(ASSET_PACK_PATH, JSON.stringify(assetPack, null, 2), 'utf8');

  // Print summary
  console.log(`\n${'='.repeat(60)}`);
  console.log(`📊 DOWNLOAD SUMMARY`);
  console.log(`${'='.repeat(60)}`);
  console.log(`✅ Successfully processed: ${downloaded}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`📁 Location: ${OUTPUT_DIR}`);
  
  if (failedAssets.length > 0) {
    console.log(`\n⚠️  Failed Assets:`);
    failedAssets.forEach(asset => {
      console.log(`  - ${asset.key}: ${asset.error}`);
    });
    console.log(`\n💡 Tip: You can manually download these from the URLs above`);
  }

  console.log(`${'='.repeat(60)}\n`);
}

// Run the download
downloadAllAssets().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
