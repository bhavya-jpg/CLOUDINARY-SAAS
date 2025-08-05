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

  //max file size of 70 mb
  const MAX_FILE_SIZE = 70 * 1024 * 1024;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;

    if (file.size > MAX_FILE_SIZE) {
      //TODO : add notification
      alert("File size too large");
      return;
    }

    setIsUploading(true);
    const formData = new FormData();
    formData.append("file", file);
    formData.append("title", title);
    formData.append("description", description);
    formData.append("originalSize", file.size.toString());

    try {
      await axios
        .post("/api/video-upload", formData)
        //check for 200 response
        .then((response) => {
          if (response.status === 200) {
            // Video uploaded successfully
            console.log("Video uploaded successfully:", response.data);
            // Redirect to the home page to see uploaded videos
            router.push("/home");
          }
        });
    } catch (error) {
      //error notification
      alert("Error uploading video. Please try again later.");
      console.error("Error uploading video:", error);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 bg-black ">
      <h1 className="text-3xl font-extrabold mb-6 text-amber-50">
        Upload Video
      </h1>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-gray-400 text-lg mb-2">Title</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full px-4 py-2 bg-gray-800 text-white rounded-md shadow-md focus:outline-none focus:ring-2 focus:ring-purple-600"
            required
          />
        </div>
        <div>
          <label className="block text-gray-400 text-lg mb-2">
            Description
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full px-4 py-2 bg-gray-800 text-white rounded-md shadow-md focus:outline-none focus:ring-2 focus:ring-purple-600"
          />
        </div>
        <div>
          <label className="block text-gray-400 text-lg mb-2">Video File</label>
          <input
            type="file"
            accept="video/*"
            onChange={(e) => setFile(e.target.files?.[0] || null)}
            className="file-input w-full bg-gray-800 border-purple-400 text-white h-12 min-h-12 font-medium rounded-lg file:bg-purple-400 file:text-black file:border-0 file:h-12 file:min-h-12 file:font-medium file:rounded-lg file:px-4 file:cursor-pointer"
            required
          />
        </div>
        <button
          type="submit"
          className="p-4 py-3 bg-purple-600 text-white font-semibold rounded-md hover:bg-purple-700 disabled:opacity-50"
          disabled={isUploading}
        >
          {isUploading ? "Uploading..." : "Upload Video"}
        </button>
      </form>
    </div>
  );
}

export default VideoUpload;
