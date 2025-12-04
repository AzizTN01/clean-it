import fs from 'fs';
import path from 'path';

// Ensure dist/icons directory exists
if (!fs.existsSync('dist/icons')) {
  fs.mkdirSync('dist/icons', { recursive: true });
}

// Copy static files
const filesToCopy = [
  'manifest.json',
  'content.js',
  'content.css',
  'background.js'
];

filesToCopy.forEach(file => {
  if (fs.existsSync(file)) {
    fs.copyFileSync(file, path.join('dist', file));
    console.log(`Copied ${file}`);
  }
});

// Copy icon files
const iconSizes = [16, 48, 128];
iconSizes.forEach(size => {
  const iconPath = `icons/icon-${size}.png`;
  const distIconPath = `dist/icons/icon-${size}.png`;

  if (fs.existsSync(iconPath)) {
    fs.copyFileSync(iconPath, distIconPath);
    console.log(`Copied ${iconPath} to dist`);
  } else {
    console.error(`Warning: Icon file ${iconPath} not found!`);
  }
});

