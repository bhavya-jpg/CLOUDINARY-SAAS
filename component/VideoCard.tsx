import React,{useState,useEffect,useCallback} from 'react'

import {getCldImageUrl,getCldVideoUrl} from "next-cloudinary";

import {Download,Clock,FileDown,FileUp} from "lucide-react"

import dayjs from 'dayjs';
import realtiveTime from 'dayjs/plugin/relativeTime';
import { filesize } from 'filesize'
import { Video } from "@/types";

dayjs.extend(realtiveTime);


interface VideoCardProps{
    video: Video;
    onDownload:(url:string,title:string)=>void;


}
const VideoCard: React.FC<VideoCardProps> = ({ video, onDownload }) => {
  const [isHovered, setIsHovered] = useState(false);
  const [previewError, setPreviewError] = useState(false);

  const getThumbnailUrl = useCallback((publicId: string) => {
    return getCldImageUrl({
      src: publicId,
      width: 400,
      height: 225,
      crop: "fill",
      gravity: "auto",
      format: "jpg",
      quality: "auto",
      assetType: "video",
    });
  }, []);

  const getFullVideoUrl = useCallback((publicId: string) => {
    return getCldVideoUrl({
      src: publicId,
      width: 1920,
      height: 1080,
      assetType: "video",
    });
  }, []);

  const getPreviewVideoUrl = useCallback((publicId: string) => {
    // Use AI-generated preview if available, otherwise fallback to basic preview
    if (video.aiPreviewUrl) {
      console.log("Using AI preview URL:", video.aiPreviewUrl);
      return video.aiPreviewUrl;
    }
    
    // Generate a simple preview URL - just the video with basic quality
    const previewUrl = getCldVideoUrl({
      src: publicId,
      width: 400,
      height: 225,
      quality: "auto:low",
      assetType: "video",
    });
    console.log("Generated preview URL:", previewUrl);
    return previewUrl;
  }, [video.aiPreviewUrl]);

  const formatSize = useCallback((size: number) => {
    return filesize(size);
  }, []);

  const formatDuration = useCallback((seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.round(seconds % 60);
    return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
  }, []);

  const compressionPercentage = Math.round(
    (1 - Number(video.compressedSize) / Number(video.originalSize)) * 100
  );

  // Reset error state when hover changes
  useEffect(() => {
    if (isHovered) {
      setPreviewError(false);
    }
  }, [isHovered]);

  const handleVideoError = () => {
    console.log("Preview failed for video:", video.publicId);
    setPreviewError(true);
  };

  const handleVideoLoad = () => {
    console.log("Video loaded successfully for:", video.publicId);
  };

  const handleVideoCanPlay = () => {
    console.log("Video can play for:", video.publicId);
  };

  return (
    <div
      className="card bg-neutral-900 border border-neutral-800 shadow-sm hover:shadow-md transition-shadow"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <figure className="aspect-video relative">
        {isHovered ? (
          previewError ? (
            <div className="w-full h-full flex items-center justify-center bg-neutral-800">
              <div className="text-center">
                <p className="text-neutral-400 text-sm mb-2">Preview not available</p>
                <button 
                  className="btn btn-xs btn-outline"
                  onClick={() => {
                    setPreviewError(false);
                  }}
                >
                  Retry Preview
                </button>
              </div>
            </div>
          ) : (
            <video
              src={getPreviewVideoUrl(video.publicId)}
              autoPlay
              muted
              loop
              playsInline
              className="w-full h-full object-cover"
              onError={handleVideoError}
              onLoad={handleVideoLoad}
              onCanPlay={handleVideoCanPlay}
              onLoadedData={() => console.log("Video data loaded successfully for:", video.publicId)}
              onAbort={() => console.log("Video load aborted for:", video.publicId)}
              onStalled={() => console.log("Video stalled for:", video.publicId)}
            />
          )
        ) : (
          <img
            src={getThumbnailUrl(video.publicId)}
            alt={video.title}
            className="w-full h-full object-cover"
          />
        )}
        <div className="absolute bottom-2 right-2 bg-neutral-900/80 px-2 py-1 rounded-md text-xs flex items-center border border-neutral-700">
          <Clock size={16} className="mr-1" />
          {formatDuration(video.duration)}
        </div>
        {video.aiPreviewUrl && (
          <div className="absolute top-2 left-2 bg-violet-600/90 px-2 py-1 rounded-md text-xs text-white font-medium">
            AI Preview
          </div>
        )}
      </figure>
      <div className="card-body p-4 gap-2">
        <h2 className="card-title text-base sm:text-lg font-semibold leading-tight">
          {video.title}
        </h2>
        <p className="text-sm text-neutral-300">
          {video.description}
        </p>
        <p className="text-xs text-neutral-400">
          Uploaded {dayjs(video.createdAt).fromNow()}
        </p>
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div className="flex items-center">
            <FileUp size={18} className="mr-2 text-primary" />
            <div>
              <div className="font-semibold">Original</div>
              <div>{formatSize(Number(video.originalSize))}</div>
            </div>
          </div>
          <div className="flex items-center">
            <FileDown size={18} className="mr-2 text-secondary" />
            <div>
              <div className="font-semibold">Compressed</div>
              <div>{formatSize(Number(video.compressedSize))}</div>
            </div>
          </div>
        </div>
        
        {/* AI Features Display */}
        {video.compressionRatio && (
          <div className="text-xs text-neutral-400">
            <div className="flex items-center gap-2">
              <span>Compression Ratio: {(video.compressionRatio * 100).toFixed(1)}%</span>
              {video.previewDuration && (
                <span>• AI Preview: {video.previewDuration}s</span>
              )}
            </div>
          </div>
        )}
        
        {video.keyMoments && video.keyMoments.length > 0 && (
          <div className="text-xs text-neutral-400">
            <div className="font-medium mb-1">Key Moments:</div>
            <div className="flex flex-wrap gap-1">
              {video.keyMoments.slice(0, 3).map((moment, index) => (
                <span key={index} className="badge badge-xs badge-outline">
                  {moment}
                </span>
              ))}
              {video.keyMoments.length > 3 && (
                <span className="badge badge-xs badge-outline">
                  +{video.keyMoments.length - 3} more
                </span>
              )}
            </div>
          </div>
        )}
        <div className="flex justify-between items-center mt-2">
          <div className="text-sm font-medium">
            Compression:{" "}
            <span className="badge badge-secondary ml-1">{compressionPercentage}%</span>
          </div>
          <div className="flex gap-2">
            <button
              className="btn btn-outline btn-primary btn-sm"
              onClick={() => onDownload(getFullVideoUrl(video.publicId), video.title)}
            >
              Download Original
            </button>
            {video.highQualityUrl && (
              <button
                className="btn btn-outline btn-secondary btn-sm"
                onClick={() => onDownload(video.highQualityUrl!, video.title)}
              >
                Download Compressed
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default VideoCard;