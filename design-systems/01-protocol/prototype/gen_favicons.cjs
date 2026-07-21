const fs = require('fs');
const sharp = require('sharp');

async function generateFavicons() {
  try {
    // Read brand.svg
    const svgContent = fs.readFileSync('../../../public/images/brand.svg', 'utf8');
    const match = svgContent.match(/data:image\/png;base64,([A-Za-z0-9+/=]+)/);
    if (!match) {
      console.error('Base64 not found in SVG');
      process.exit(1);
    }
    
    // Decode base64 PNG (this is the SV icon with transparency)
    const logoBuffer = Buffer.from(match[1], 'base64');
    
    // Apple Touch Icon (180x180) - usually solid background
    // The SV icon is white, we'll put it on a #333 background
    const appleTouchIconBg = await sharp({
      create: { width: 180, height: 180, channels: 4, background: { r: 51, g: 51, b: 51, alpha: 1 } }
    }).png().toBuffer();
    
    const resizedForApple = await sharp(logoBuffer).resize({ height: 120 }).toBuffer();
    await sharp(appleTouchIconBg)
      .composite([{ input: resizedForApple, gravity: 'center' }])
      .png()
      .toFile('./public/apple-touch-icon.png');
      
    // Default Favicon (32x32) - transparent background
    await sharp(logoBuffer)
      .resize(32, 32, { fit: 'contain' })
      .png()
      .toFile('./public/favicon.png'); // Modern browsers prefer PNG over ICO

    // Web Manifest Icons
    for (const size of [192, 512]) {
      const bg = await sharp({
        create: { width: size, height: size, channels: 4, background: { r: 51, g: 51, b: 51, alpha: 1 } }
      }).png().toBuffer();
      const resized = await sharp(logoBuffer).resize({ height: Math.floor(size * 0.6) }).toBuffer();
      
      await sharp(bg)
        .composite([{ input: resized, gravity: 'center' }])
        .png()
        .toFile(`./public/icon-${size}x${size}.png`);
    }

    // Write site.webmanifest
    const manifest = {
      name: "T Salon",
      short_name: "T Salon",
      icons: [
        { src: "/icon-192x192.png", sizes: "192x192", type: "image/png" },
        { src: "/icon-512x512.png", sizes: "512x512", type: "image/png" }
      ],
      theme_color: "#333333",
      background_color: "#333333",
      display: "standalone"
    };
    fs.writeFileSync('./public/site.webmanifest', JSON.stringify(manifest, null, 2));

    console.log('Successfully generated favicons');
  } catch (err) {
    console.error('Error generating image:', err);
    process.exit(1);
  }
}

generateFavicons();
