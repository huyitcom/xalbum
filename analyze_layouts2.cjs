const fs = require('fs');
const https = require('https');
const { PNG } = require('pngjs');

const urls = [
  'https://www.photobookvietnam.net/images/layout/lay01/07-08.png',
  'https://www.photobookvietnam.net/images/layout/lay01/09-10.png'
];

async function downloadAndAnalyze(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      const chunks = [];
      res.on('data', (c) => chunks.push(c));
      res.on('end', () => {
        const buffer = Buffer.concat(chunks);
        const png = PNG.sync.read(buffer);
        const width = png.width;
        const height = png.height;
        console.log(`\nAnalyzed ${url.split('/').pop()} (${width}x${height}):`);
        
        const pixels = png.data;
        const visited = new Uint8Array(width * height);
        const transparentRegions = [];

        for (let y = 0; y < height; y++) {
          for (let x = 0; x < width; x++) {
            const idx = (y * width + x) * 4;
            const alpha = pixels[idx + 3];

            if (alpha < 10 && !visited[y * width + x]) {
              let minX = x, maxX = x, minY = y, maxY = y;
              const queue = [[x, y]];
              visited[y * width + x] = 1;

              while (queue.length > 0) {
                const [cx, cy] = queue.shift();
                if (cx < minX) minX = cx;
                if (cx > maxX) maxX = cx;
                if (cy < minY) minY = cy;
                if (cy > maxY) maxY = cy;

                const neighbors = [
                  [cx + 1, cy], [cx - 1, cy], [cx, cy + 1], [cx, cy - 1]
                ];

                for (const [nx, ny] of neighbors) {
                  if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
                    const nIdx = (ny * width + nx) * 4;
                    const nAlpha = pixels[nIdx + 3];
                    if (nAlpha < 10 && !visited[ny * width + nx]) {
                      visited[ny * width + nx] = 1;
                      queue.push([nx, ny]);
                    }
                  }
                }
              }

              const w = maxX - minX + 1;
              const h = maxY - minY + 1;
              if (w > 50 && h > 50) {
                transparentRegions.push({
                  x: ((minX / width) * 100).toFixed(1),
                  y: ((minY / height) * 100).toFixed(1),
                  w: ((w / width) * 100).toFixed(1),
                  h: ((h / height) * 100).toFixed(1),
                  pixelCoords: { minX, minY, w, h }
                });
              }
            }
          }
        }

        console.log(`Found ${transparentRegions.length} valid transparent regions:`);
        transparentRegions.forEach((r, i) => {
          console.log(`  Slot ${i + 1}: x=${r.x}%, y=${r.y}%, w=${r.w}%, h=${r.h}% (Pixels: ${r.pixelCoords.w}x${r.pixelCoords.h} at ${r.pixelCoords.minX},${r.pixelCoords.minY})`);
        });
        resolve();
      });
    });
  });
}

async function main() {
  for (const url of urls) {
    await downloadAndAnalyze(url);
  }
}

main().catch(console.error);
