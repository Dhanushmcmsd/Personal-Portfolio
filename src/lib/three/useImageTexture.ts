import { useEffect, useState } from "react";
import * as THREE from "three";

export function useImageTexture(url: string) {
  const [texture, setTexture] = useState<THREE.Texture | null>(null);

  useEffect(() => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      const tex = new THREE.Texture(img);
      tex.colorSpace = THREE.SRGBColorSpace;
      tex.needsUpdate = true;
      setTexture(tex);
    };
    img.onerror = () => {
      const canvas = document.createElement("canvas");
      canvas.width = 512;
      canvas.height = 320;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.fillStyle = "#0D1117";
        ctx.fillRect(0, 0, 512, 320);
        ctx.fillStyle = "#00E5FF";
        ctx.font = "24px system-ui";
        ctx.fillText("Project", 40, 160);
      }
      const tex = new THREE.CanvasTexture(canvas);
      tex.colorSpace = THREE.SRGBColorSpace;
      setTexture(tex);
    };
    img.src = url;

    return () => {
      setTexture((prev) => {
        prev?.dispose();
        return null;
      });
    };
  }, [url]);

  return texture;
}
