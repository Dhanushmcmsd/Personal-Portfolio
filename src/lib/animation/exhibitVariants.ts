export interface ExhibitTransform {
  x: number;
  y: number;
  z: number;
  rotX: number;
  rotY: number;
  rotZ: number;
  scale: number;
  depth: number;
}

export {
  computeScrollExhibitTransform,
  computeScrollOverlayTransform,
  sectionLocalProgress,
} from "@/lib/scroll/timeline";
