import sharp from 'sharp';
import fs from 'fs';
import { join } from 'path';

const sizes = [16, 32, 48, 64, 128, 256, 512];
const outputDir = join(process.cwd(), 'assets');

async function convertSvgToPng() {
  try {
    const inputSvg = join(outputDir, 'icon.svg');

    if (!fs.existsSync(inputSvg)) {
      console.error('Input SVG file not found:', inputSvg);
      return;
    }

    console.log('Converting SVG to PNG at various sizes...');

    // Process each size
    for (const size of sizes) {
      const outputFile = join(outputDir, `icon-${size}.png`);

      await sharp(inputSvg)
        .resize(size, size)
        .png()
        .toFile(outputFile);

      console.log(`Created: ${outputFile}`);
    }

    // Create the main icon.png (512x512)
    await sharp(inputSvg)
      .resize(512, 512)
      .png()
      .toFile(join(outputDir, 'icon.png'));

    console.log('Conversion completed successfully!');
  } catch (error) {
    console.error('Error converting SVG to PNG:', error);
  }
}

// Run the conversion
convertSvgToPng();
