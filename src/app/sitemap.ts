import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";

const approachEarthWatchUrl = `${SITE_URL}/videos/approach-earth`;
const approachEarthVideoUrl = `${SITE_URL}/loading/approach-earth.mp4`;
const approachEarthThumbnailUrl = `${SITE_URL}/loading/earth.png`;

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: SITE_URL,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 1,
    },
    {
      url: approachEarthWatchUrl,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.8,
      videos: [
        {
          title: "Approach Earth — portfolio opening sequence",
          description:
            "Cinematic Earth approach clip from the Dhanush Raghav M portfolio loading experience.",
          thumbnail_loc: approachEarthThumbnailUrl,
          content_loc: approachEarthVideoUrl,
        },
      ],
    },
  ];
}
