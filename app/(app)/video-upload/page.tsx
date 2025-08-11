"use client";
import React, { useState } from "react";
import axios from "axios";
import { useRouter } from "next/navigation";

function VideoUpload() {
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [isUploading, setIsUploading] = useState(false);

  const router = useRouter();

  //max file size of 1 GB
  const MAX_FILE_SIZE = 1 * 1024 * 1024 * 1024;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      alert("Please select a video file");
      return;
    }

    if (!title.trim()) {
      alert("Please enter a title for your video");
      return;
    }

    if (file.size > MAX_FILE_SIZE) {
      alert("File size too large. Maximum size is 1GB.");
      return;
    }

    setIsUploading(true);
    const formData = new FormData();
    formData.append("file", file);
    formData.append("title", title);
    formData.append("description", description);
    formData.append("originalSize", file.size.toString());

    try {
      const response = await axios.post("/api/video-upload", formData);
      
      if (response.status === 200) {
        const { compressionPercentage, originalSizeBytes, compressedSizeBytes, compressionInfo } = response.data;
        const originalMB = (originalSizeBytes / (1024 * 1024)).toFixed(2);
        const compressedMB = (compressedSizeBytes / (1024 * 1024)).toFixed(2);
        
        alert(`🎉 Video uploaded successfully with AI features!\n\n` +
              `📹 Smart Compression: ${compressionPercentage}%\n` +
              `📊 Original: ${originalMB}MB → Compressed: ${compressedMB}MB\n` +
              `🤖 AI Preview: Generated with key moments\n` +
              `⚡ Multiple quality versions available\n\n` +
              `Redirecting to your video library...`);
        router.push("/home");
      }
    } catch (error: any) {
      let errorMessage = "Error uploading video. Please try again later.";
      
      if (error.response?.data?.error) {
        errorMessage = error.response.data.error;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      alert(errorMessage);
      console.error("Error uploading video:", error);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto w-full p-6">
      <div className="card bg-base-100 border border-base-300 shadow-sm">
        <div className="card-body">
          <h1 className="text-2xl sm:text-3xl font-extrabold mb-2">Upload Video</h1>
          <p className="text-base-content/70 mb-4">Share your video by filling the details below. Max size: 1GB.</p>
          
          {/* AI Features Info */}
          <div className="alert alert-info mb-4">
            <div>
              <h3 className="font-bold">AI-Powered Features</h3>
              <div className="text-sm">
                <p>• <strong>Smart Compression:</strong> Automatically compresses videos for storage efficiency</p>
                <p>• <strong>AI Preview:</strong> Generates intelligent previews showing key moments</p>
                <p>• <strong>Multiple Qualities:</strong> Download compressed or original quality versions</p>
                <p>• <strong>Key Moments:</strong> AI detects and highlights important video segments</p>
              </div>
            </div>
          </div>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="form-control">
              <label className="label"><span className="label-text">Title</span></label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="input input-bordered w-full"
                required
              />
            </div>
            <div className="form-control">
              <label className="label"><span className="label-text">Description</span></label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="textarea textarea-bordered w-full"
                rows={4}
              />
            </div>
            <div className="form-control">
              <label className="label"><span className="label-text">Video file</span></label>
              <input
                type="file"
                accept="video/*"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
                className="file-input file-input-bordered w-full"
                required
              />
              {file && (
                <div className="mt-2 text-sm text-base-content/70">
                  <p>Selected: {file.name}</p>
                  <p>Size: {(file.size / (1024 * 1024)).toFixed(2)} MB</p>
                  <p>Type: {file.type}</p>
                </div>
              )}
            </div>
            <div className="flex justify-end">
              <button
                type="submit"
                className="btn btn-primary"
                disabled={isUploading}
              >
                {isUploading ? "Uploading..." : "Upload Video"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default VideoUpload;
