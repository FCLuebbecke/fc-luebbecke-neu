/**
 * Instagram-Posts über die Behold.so-API.
 * Portiert aus dem Next.js-Prototyp (src/lib/instagram.ts).
 * Unterschied zu dort: kein `next: { revalidate }` – in diesem statischen
 * Astro-Projekt läuft der Fetch zur BUILD-ZEIT. Für neue Posts neu bauen.
 *
 * Feed-ID per Env überschreibbar: BEHOLD_FEED_ID (sonst Default des Vereins).
 */
export type BeholdSize = { mediaUrl: string; height: number; width: number };

export type InstagramPost = {
  id: string;
  timestamp: string;
  permalink: string;
  mediaType: "IMAGE" | "VIDEO" | "CAROUSEL_ALBUM";
  mediaUrl: string;
  thumbnailUrl?: string;
  isReel?: boolean;
  caption?: string;
  prunedCaption?: string;
  sizes: {
    small:  BeholdSize;
    medium: BeholdSize;
    large:  BeholdSize;
    full:   BeholdSize;
  };
};

type BeholdFeed = {
  followersCount?: number;
  posts: InstagramPost[];
};

const FEED_ID = import.meta.env.BEHOLD_FEED_ID ?? "tjfnKyaIhwWpibDIEiuZ";

export async function getInstagramPosts(limit = 6): Promise<InstagramPost[]> {
  try {
    const res = await fetch(`https://feeds.behold.so/${FEED_ID}`);
    if (!res.ok) return [];
    const json: BeholdFeed = await res.json();
    return (json.posts ?? [])
      .filter((p) => p.mediaType === "IMAGE" || p.mediaType === "CAROUSEL_ALBUM" || p.mediaType === "VIDEO")
      .slice(0, limit);
  } catch {
    return [];
  }
}
