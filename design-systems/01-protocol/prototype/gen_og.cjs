const fs = require('fs');
const sharp = require('sharp');

async function generateOG() {
  try {
    // Read brand.svg
    const svgContent = fs.readFileSync('../../../public/images/brand.svg', 'utf8');
    const match = svgContent.match(/data:image\/png;base64,([A-Za-z0-9+/=]+)/);
    if (!match) {
      console.error('Base64 not found in SVG');
      process.exit(1);
    }
    
    // Decode base64 PNG
    const logoBuffer = Buffer.from(match[1], 'base64');
    
    // Resize logo so it fits beautifully (e.g. height 400)
    const resizedLogo = await sharp(logoBuffer)
      .resize({ height: 400 })
      .toBuffer();
    
    // Create 1200x630 dark background image
    await sharp({
      create: {
        width: 1200,
        height: 630,
        channels: 4,
        background: { r: 51, g: 51, b: 51, alpha: 1 } // #333333
      }
    })
    .composite([
      { input: resizedLogo, gravity: 'center' }
    ])
    .jpeg({ quality: 95 })
    .toFile('./public/images/share-logo.jpg');
    
    console.log('Successfully generated share-logo.jpg');
  } catch (err) {
    console.error('Error generating image:', err);
    process.exit(1);
  }
}

generateOG();
