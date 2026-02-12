"use client";

import { useState, useEffect } from "react";
import { fetchAllChannels, ChannelData, YouTubeVideo } from "@/lib/youtube";
import VideoModal from "./VideoModal";

// Decode HTML entities like &#39; &amp; &quot; etc.
function decodeHTMLEntities(text: string): string {
  const textarea = document.createElement("textarea");
  textarea.innerHTML = text;
  return textarea.value;
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function VideoCard({
  video,
  onClick,
  channelUrl,
  showChannelBadge = false,
}: {
  video: YouTubeVideo;
  onClick: () => void;
  channelUrl?: string;
  showChannelBadge?: boolean;
}) {
  const decodedTitle = decodeHTMLEntities(video.title);

  return (
    <button
      onClick={onClick}
      className="group text-left bg-wojak-card border border-wojak-border rounded-xl overflow-hidden hover:border-wojak-green/40 transition-colors"
    >
      <div className="relative aspect-video overflow-hidden">
        <img
          src={video.thumbnail}
          alt={decodedTitle}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        />
        {/* Play button overlay */}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/30">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="white" className="drop-shadow-lg">
            <polygon points="5 3 19 12 5 21 5 3" />
          </svg>
        </div>
        {/* View Channel badge on first video */}
        {showChannelBadge && channelUrl && (
          <a
            href={channelUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="absolute top-2 right-2 z-10 px-2.5 py-1 bg-black/60 hover:bg-black/80 text-white text-xs font-medium rounded-full backdrop-blur-sm transition-colors flex items-center gap-1"
          >
            View Channel
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
              <polyline points="15 3 21 3 21 9" />
              <line x1="10" y1="14" x2="21" y2="3" />
            </svg>
          </a>
        )}
      </div>
      <div className="p-3">
        <h3 className="text-sm font-medium text-white line-clamp-2 leading-snug mb-1">
          {decodedTitle}
        </h3>
        <p className="text-xs text-gray-500">{formatDate(video.publishedAt)}</p>
      </div>
    </button>
  );
}

function SkeletonCard() {
  return (
    <div className="bg-wojak-card border border-wojak-border rounded-xl overflow-hidden">
      <div className="aspect-video bg-white/5 animate-pulse" />
      <div className="p-3 space-y-2">
        <div className="h-4 bg-white/5 rounded animate-pulse w-full" />
        <div className="h-4 bg-white/5 rounded animate-pulse w-2/3" />
        <div className="h-3 bg-white/5 rounded animate-pulse w-1/3" />
      </div>
    </div>
  );
}

function ChannelHeader({ channel }: { channel: ChannelData }) {
  return (
    <div className="mb-4">
      <h2 className="text-xl sm:text-2xl font-bold text-white">{channel.channelName}</h2>
    </div>
  );
}

export default function WojakTV() {
  const [channels, setChannels] = useState<ChannelData[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeVideo, setActiveVideo] = useState<YouTubeVideo | null>(null);

  useEffect(() => {
    fetchAllChannels()
      .then(setChannels)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  // For mobile alternating layout
  const getAlternatingVideos = (): { video: YouTubeVideo; channelName: string; channelUrl: string; isFirst: boolean }[] => {
    if (channels.length < 2) return [];
    const ch1 = channels[0];
    const ch2 = channels[1];
    const maxLen = Math.max(ch1.videos.length, ch2.videos.length);
    const result: { video: YouTubeVideo; channelName: string; channelUrl: string; isFirst: boolean }[] = [];
    for (let i = 0; i < maxLen; i++) {
      if (i < ch1.videos.length) result.push({ video: ch1.videos[i], channelName: ch1.channelName, channelUrl: ch1.channelUrl, isFirst: i === 0 });
      if (i < ch2.videos.length) result.push({ video: ch2.videos[i], channelName: ch2.channelName, channelUrl: ch2.channelUrl, isFirst: i === 0 });
    }
    return result;
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      {/* Page Header */}
      <div className="text-center mb-10">
        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-3">
          Wojak TV
        </h1>
        <p className="text-gray-400 text-lg">The best Wojak content on YouTube</p>
      </div>

      {loading ? (
        /* Loading skeletons — two columns on desktop */
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {[0, 1].map((i) => (
            <div key={i}>
              <div className="h-8 bg-white/5 rounded animate-pulse w-48 mb-4" />
              <div className="space-y-4">
                {Array.from({ length: 6 }).map((_, j) => (
                  <SkeletonCard key={j} />
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <>
          {/* Desktop: Two-column side by side layout */}
          <div className="hidden lg:grid lg:grid-cols-2 gap-8">
            {channels.map((channel) => (
              <div key={channel.channelId}>
                <ChannelHeader channel={channel} />
                <div className="space-y-4">
                  {channel.videos.map((video, idx) => (
                    <VideoCard
                      key={video.videoId}
                      video={video}
                      onClick={() => setActiveVideo(video)}
                      channelUrl={channel.channelUrl}
                      showChannelBadge={idx === 0}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Mobile/Tablet: Alternating videos from both channels */}
          <div className="lg:hidden">
            {/* Channel names at top */}
            <div className="grid grid-cols-2 gap-4 mb-6">
              {channels.map((channel) => (
                <div key={channel.channelId} className="bg-wojak-card border border-wojak-border rounded-xl p-3 text-center">
                  <h2 className="text-sm sm:text-base font-bold text-white">{channel.channelName}</h2>
                </div>
              ))}
            </div>

            {/* Alternating video grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {getAlternatingVideos().map(({ video, channelName, channelUrl, isFirst }) => (
                <div key={video.videoId}>
                  <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-1 px-1">{channelName}</p>
                  <VideoCard
                    video={video}
                    onClick={() => setActiveVideo(video)}
                    channelUrl={channelUrl}
                    showChannelBadge={isFirst}
                  />
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {/* Video Modal */}
      {activeVideo && (
        <VideoModal
          videoId={activeVideo.videoId}
          title={decodeHTMLEntities(activeVideo.title)}
          onClose={() => setActiveVideo(null)}
        />
      )}
    </div>
  );
}
