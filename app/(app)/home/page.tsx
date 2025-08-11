"use client";
import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import VideoCard from "@/component/VideoCard";
import { Video } from "@/types";
import { useRouter } from "next/navigation";

function Home() {
  const router = useRouter();
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchVideos = useCallback(async () => {
    try {
      const response = await axios.get("/api/videos");
      if (Array.isArray(response.data)) {
        setVideos(response.data);
      } else {
        throw new Error(" Unexpected response format");
      }
    } catch (error) {
      console.log(error);
      setError("Failed to fetch videos");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchVideos();
  }, [fetchVideos]);

  const handleDownload = useCallback((url: string, title: string) => {
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `${title}.mp4`);
    link.setAttribute("target", "_blank");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }, []);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto w-full p-6">
        <div className="skeleton h-8 w-48 mb-6"></div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="card bg-base-100 shadow-sm">
              <div className="skeleton aspect-video"></div>
              <div className="card-body">
                <div className="skeleton h-5 w-2/3"></div>
                <div className="skeleton h-4 w-1/2"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto w-full p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-neutral-100">Your Videos</h1>
        <a href="/video-upload" className="btn btn-secondary btn-sm sm:btn-md">Upload New</a>
      </div>

      {videos.length === 0 ? (
        <div className="card bg-neutral-900 border border-neutral-800 shadow-sm">
          <div className="card-body items-center text-center">
            <h2 className="card-title">No videos yet</h2>
            <p className="text-neutral-300">Upload your first video to get started.</p>
            <a href="/video-upload" className="btn btn-secondary">Upload Video</a>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {videos.map((video) => (
            <VideoCard
              key={video.id}
              video={video}
              onDownload={handleDownload}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default Home;
