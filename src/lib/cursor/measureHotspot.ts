export type CursorHotspot = {
  x: number;
  y: number;
  imageWidth: number;
};

export const CURSOR_DISPLAY_WIDTH = 22;

export async function measureCursorHotspot(src: string): Promise<CursorHotspot> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        reject(new Error("Canvas context unavailable"));
        return;
      }

      ctx.drawImage(img, 0, 0);
      const { width, height, data } = ctx.getImageData(0, 0, canvas.width, canvas.height);

      let minX = width;
      let minY = height;
      let found = false;

      for (let y = 0; y < height; y += 1) {
        for (let x = 0; x < width; x += 1) {
          const alpha = data[(y * width + x) * 4 + 3];
          if (alpha > 12) {
            found = true;
            if (x < minX) minX = x;
            if (y < minY) minY = y;
          }
        }
      }

      if (!found) {
        resolve({ x: 0, y: 0, imageWidth: width });
        return;
      }

      resolve({ x: minX, y: minY, imageWidth: width });
    };
    img.onerror = () => reject(new Error(`Failed to load cursor image: ${src}`));
    img.src = src;
  });
}

export function hotspotToOffset(hotspot: CursorHotspot) {
  const scale = CURSOR_DISPLAY_WIDTH / hotspot.imageWidth;
  return {
    x: hotspot.x * scale,
    y: hotspot.y * scale,
  };
}
