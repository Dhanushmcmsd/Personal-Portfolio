import type { Metadata } from "next";
import Link from "next/link";
import { SITE_URL } from "@/lib/site";

const VIDEO_PATH = "/loading/approach-earth.mp4";
const THUMBNAIL_PATH = "/loading/earth.png";

const title = "Approach Earth — portfolio opening sequence";
const description =
  "Cinematic Earth approach clip from the Dhanush Raghav M portfolio loading experience — full-stack AI engineering work and immersive 3D product design.";

export const metadata: Metadata = {
  title,
  description,
  alternates: {
    canonical: "/videos/approach-earth",
  },
  openGraph: {
    type: "video.other",
    url: `${SITE_URL}/videos/approach-earth`,
    title,
    description,
    images: [{ url: THUMBNAIL_PATH }],
    videos: [
      {
        url: VIDEO_PATH,
        type: "video/mp4",
      },
    ],
  },
};

const videoJsonLd = {
  "@context": "https://schema.org",
  "@type": "VideoObject",
  name: title,
  description,
  thumbnailUrl: `${SITE_URL}${THUMBNAIL_PATH}`,
  contentUrl: `${SITE_URL}${VIDEO_PATH}`,
  uploadDate: "2025-09-15",
  inLanguage: "en",
  isFamilyFriendly: true,
  publisher: {
    "@type": "Person",
    name: "Dhanush Raghav M",
  },
};

export default function ApproachEarthVideoPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(videoJsonLd) }}
      />
      <main className="mx-auto flex min-h-dvh max-w-3xl flex-col gap-6 px-6 py-12 text-[#101010]">
        <div>
          <p className="font-mono text-[11px] uppercase tracking-[0.2em] opacity-60">
            Portfolio video
          </p>
          <h1 className="mt-2 font-[family-name:var(--font-display)] text-3xl leading-tight md:text-4xl">
            {title}
          </h1>
          <p className="mt-4 max-w-prose text-base leading-relaxed opacity-80">
            {description}
          </p>
        </div>

        <div className="overflow-hidden rounded-lg border border-black/10 bg-black shadow-lg">
          <video
            className="aspect-video w-full bg-black object-cover"
            src={VIDEO_PATH}
            poster={THUMBNAIL_PATH}
            controls
            playsInline
            preload="metadata"
            title={title}
          />
        </div>

        <p className="text-sm opacity-70">
          <Link href="/" className="underline underline-offset-4 hover:opacity-100">
            ← Back to portfolio
          </Link>
        </p>
      </main>
    </>
  );
}
