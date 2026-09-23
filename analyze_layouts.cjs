const fs = require('fs');
const { PNG } = require('pngjs');

function analyzePNG(filePath) {
  return new Promise((resolve, reject) => {
    const data = fs.readFileSync(filePath);
    const png = new PNG();
    png.parse(data, (err, parsed) => {
      if (err) return reject(err);
      
      const { width, height, data: pixels } = parsed;
      console.log(`\n========================================`);
      console.log(`Analyzing: ${filePath} (${width}x${height})`);

      // Sample grid of transparency to find connected transparent regions
      // Downsample by 10 or 20 for fast component labeling
      const step = 8;
      const gridW = Math.floor(width / step);
      const gridH = Math.floor(height / step);
      const isTransparent = new Uint8Array(gridW * gridH);

      for (let gy = 0; gy < gridH; gy++) {
        for (let gx = 0; gx < gridW; gx++) {
          const px = gx * step;
          const py = gy * step;
          const idx = (py * width + px) * 4;
          const alpha = pixels[idx + 3];
          if (alpha < 50) {
            isTransparent[gy * gridW + gx] = 1;
          }
        }
      }

      // Simple flood-fill component labeling
      const visited = new Uint8Array(gridW * gridH);
      const components = [];

      for (let gy = 0; gy < gridH; gy++) {
        for (let gx = 0; gx < gridW; gx++) {
          const gIdx = gy * gridW + gx;
          if (isTransparent[gIdx] && !visited[gIdx]) {
            let minX = gx, maxX = gx, minY = gy, maxY = gy;
            let count = 0;
            const queue = [gx, gy];
            visited[gIdx] = 1;

            let head = 0;
            while (head < queue.length) {
              const qx = queue[head++];
              const qy = queue[head++];
              count++;

              if (qx < minX) minX = qx;
              if (qx > maxX) maxX = qx;
              if (qy < minY) minY = qy;
              if (qy > maxY) maxY = qy;

              const neighbors = [
                [qx + 1, qy],
                [qx - 1, qy],
                [qx, qy + 1],
                [qx, qy - 1]
              ];

              for (const [nx, ny] of neighbors) {
                if (nx >= 0 && nx < gridW && ny >= 0 && ny < gridH) {
                  const nIdx = ny * gridW + nx;
                  if (isTransparent[nIdx] && !visited[nIdx]) {
                    visited[nIdx] = 1;
                    queue.push(nx, ny);
                  }
                }
              }
            }

            // Only keep sizable regions (> 100 cells)
            if (count > 100) {
              const pixelMinX = minX * step;
              const pixelMaxX = Math.min(width, (maxX + 1) * step);
              const pixelMinY = minY * step;
              const pixelMaxY = Math.min(height, (maxY + 1) * step);
              const boxW = pixelMaxX - pixelMinX;
              const boxH = pixelMaxY - pixelMinY;

              const xPct = ((pixelMinX / width) * 100).toFixed(2);
              const yPct = ((pixelMinY / height) * 100).toFixed(2);
              const wPct = ((boxW / width) * 100).toFixed(2);
              const hPct = ((boxH / height) * 100).toFixed(2);

              components.push({
                count,
                pixelBox: { x: pixelMinX, y: pixelMinY, w: boxW, h: boxH },
                percentages: { x: parseFloat(xPct), y: parseFloat(yPct), width: parseFloat(wPct), height: parseFloat(hPct) }
              });
            }
          }
        }
      }

      // Sort by X position (left to right)
      components.sort((a, b) => a.percentages.x - b.percentages.x);
      console.log(`Found ${components.length} transparent slots:`);
      components.forEach((c, i) => {
        console.log(`Slot ${i + 1}: x=${c.percentages.x}%, y=${c.percentages.y}%, width=${c.percentages.width}%, height=${c.percentages.height}% (pixels: x=${c.pixelBox.x}, y=${c.pixelBox.y}, w=${c.pixelBox.w}, h=${c.pixelBox.h})`);
      });

      resolve(components);
    });
  });
}

async function run() {
  await analyzePNG('public/images/layout/lay01/01-02.png');
  await analyzePNG('public/images/layout/lay01/03-04.png');
  await analyzePNG('public/images/layout/lay01/05-06.png');
}

run();
