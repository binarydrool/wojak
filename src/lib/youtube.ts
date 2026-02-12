const YOUTUBE_API_KEY = process.env.NEXT_PUBLIC_YOUTUBE_API_KEY || "";

// Hardcoded channel IDs (resolved from handles)
const CHANNELS = {
  lowBudgetStories: {
    id: "UCqM1Yw5XfJ5rVwCntLy0KxA",
    name: "Low Budget Stories",
    url: "https://www.youtube.com/@LowBudgetStories",
  },
  lordWojak: {
    id: "UCULzpwL5TRDydBF_bWfJjrw",
    name: "Lord Wojak",
    url: "https://www.youtube.com/@lordwojak4034",
  },
} as const;

export interface YouTubeVideo {
  videoId: string;
  title: string;
  thumbnail: string;
  publishedAt: string;
}

export interface ChannelData {
  channelId: string;
  channelName: string;
  channelUrl: string;
  videos: YouTubeVideo[];
}

// In-memory cache
const cache: Record<string, { data: YouTubeVideo[]; timestamp: number }> = {};
const CACHE_DURATION = 10 * 60 * 1000; // 10 minutes

async function fetchChannelVideos(channelId: string): Promise<YouTubeVideo[]> {
  // Check cache
  const cached = cache[channelId];
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return cached.data;
  }

  const url = `https://www.googleapis.com/youtube/v3/search?part=snippet&channelId=${channelId}&maxResults=12&order=date&type=video&key=${YOUTUBE_API_KEY}`;

  const res = await fetch(url);
  if (!res.ok) {
    console.error(`YouTube API error: ${res.status}`);
    return cached?.data || [];
  }

  const json = await res.json();

  const videos: YouTubeVideo[] = (json.items || []).map(
    (item: {
      id: { videoId: string };
      snippet: {
        title: string;
        thumbnails: { high?: { url: string }; medium?: { url: string }; default?: { url: string } };
        publishedAt: string;
      };
    }) => ({
      videoId: item.id.videoId,
      title: item.snippet.title,
      thumbnail:
        item.snippet.thumbnails.high?.url ||
        item.snippet.thumbnails.medium?.url ||
        item.snippet.thumbnails.default?.url ||
        "",
      publishedAt: item.snippet.publishedAt,
    })
  );

  // Update cache
  cache[channelId] = { data: videos, timestamp: Date.now() };

  return videos;
}

export async function fetchAllChannels(): Promise<ChannelData[]> {
  const [lowBudget, lordWojak] = await Promise.all([
    fetchChannelVideos(CHANNELS.lowBudgetStories.id),
    fetchChannelVideos(CHANNELS.lordWojak.id),
  ]);

  return [
    {
      channelId: CHANNELS.lowBudgetStories.id,
      channelName: CHANNELS.lowBudgetStories.name,
      channelUrl: CHANNELS.lowBudgetStories.url,
      videos: lowBudget,
    },
    {
      channelId: CHANNELS.lordWojak.id,
      channelName: CHANNELS.lordWojak.name,
      channelUrl: CHANNELS.lordWojak.url,
      videos: lordWojak,
    },
  ];
}
