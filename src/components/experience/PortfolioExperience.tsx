"use client";

import dynamic from "next/dynamic";
import ScrollDriver from "./ScrollDriver";
import OverlayUI from "./overlay/OverlayUI";
import Navigation from "./Navigation";
import LoadingOverlay from "./LoadingOverlay";
import ProjectSheet from "./ProjectSheet";
import CustomCursor from "./CustomCursor";

const ExperienceCanvas = dynamic(() => import("./ExperienceCanvas"), {
  ssr: false,
  loading: () => <div className="fixed inset-0 bg-[#06080B]" />,
});

export default function PortfolioExperience() {
  return (
    <>
      <LoadingOverlay />
      <CustomCursor />
      <Navigation />
      <ExperienceCanvas />
      <OverlayUI />
      <ScrollDriver />
      <ProjectSheet />
    </>
  );
}
