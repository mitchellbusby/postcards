#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import slugify from 'slugify';
import readline from 'readline';
import { fileURLToPath } from 'url';
import os from 'os';

// Get __dirname equivalent in ES modules
const __dirname = path.dirname(fileURLToPath(import.meta.url));

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const question = (query) => new Promise((resolve) => rl.question(query, resolve));

// Helper to expand tilde and normalize path
function normalizePath(filepath) {
  // Remove any surrounding quotes
  filepath = filepath.trim().replace(/^['"]|['"]$/g, '');
  
  if (filepath.startsWith('~')) {
    filepath = path.join(os.homedir(), filepath.slice(1));
  }
  return path.normalize(filepath);
}

// Helper to check if file exists
function checkFileExists(filepath) {
  try {
    const stats = fs.statSync(filepath);
    return stats.isFile();
  } catch (err) {
    if (err.code === 'ENOENT') {
      return false;
    }
    throw err; // Re-throw other errors
  }
}

async function main() {
  try {
    // Get image path
    const rawImagePath = await question('Path to your postcard image: ');
    const imagePath = normalizePath(rawImagePath);
    
    console.log(`Checking for image at: ${imagePath}`);
    
    if (!checkFileExists(imagePath)) {
      console.error(`Image not found at: ${imagePath}`);
      console.error('Please make sure:');
      console.error('1. The file path is correct');
      console.error('2. There are no extra spaces or quotes in the path');
      console.error('3. The file extension matches exactly (JPG vs jpg matters on some systems)');
      process.exit(1);
    }

    console.log('Found image file successfully!');

    // Get other details
    const title = await question('Title for the postcard: ');
    const location = await question('Location (e.g., "Kyoto, Japan"): ');
    const date = await question('Date received (e.g., "May 2024"): ');
    const altText = await question('Alt text for the image (press Enter for default): ') || 
      `A postcard from ${location}`;

    // Convert date to slug format (e.g., "May 2024" -> "may-2024")
    const dateSlug = slugify(date, { lower: true });

    // Create a filename base (e.g., "japan-may-2024")
    const locationSlug = slugify(location.split(',')[0], { lower: true });
    const fileBase = `${locationSlug}-${dateSlug}`;

    // Set up paths
    const contentDir = path.join(__dirname, '..', 'src', 'content', 'postcards');
    const imageExt = path.extname(imagePath).toLowerCase(); // Normalize extension to lowercase
    const newImagePath = path.join(contentDir, `${fileBase}${imageExt}`);
    const mdPath = path.join(contentDir, `${fileBase}.md`);

    // Create the markdown content
    const mdContent = `---
title: "${title}"
image: "./${fileBase}${imageExt}"
imageAltText: "${altText}"
location: "${location}"
dateReceived: ${date}
publishDate: ${Math.floor(Date.now() / 1000)}
---
`;

    // Copy the image
    fs.copyFileSync(imagePath, newImagePath);

    // Write the markdown file
    fs.writeFileSync(mdPath, mdContent);

    console.log(`\nCreated new postcard entry:
- Markdown: ${mdPath}
- Image: ${newImagePath}`);

  } catch (error) {
    console.error('Error:', error.message);
    if (error.code) {
      console.error('Error code:', error.code);
    }
    process.exit(1);
  } finally {
    rl.close();
  }
}

main(); 