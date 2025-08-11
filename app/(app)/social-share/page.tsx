"use client";
import React, { useState, useEffect, useRef } from "react";
import { CldImage } from "next-cloudinary";

const socialFormats = {
  "Instagram Square (1:1)": { width: 1080, height: 1080, aspectRatio: "1:1" },

  "Instagram Portrait (4:5)": { width: 1080, height: 1350, aspectRatio: "4:5" },

  "Twitter Post (16:9)": { width: 1200, height: 675, aspectRatio: "16:9" },

  "Twitter Header (3:1)": { width: 1500, height: 500, aspectRatio: "3:1" },

  "Facebook Cover (205:78)": { width: 820, height: 312, aspectRatio: "205:78" },
};
type SocialFormat = keyof typeof socialFormats;

export default function Socialshare() {
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [selectedFormat, setSelectedFormat] = useState<SocialFormat>(
    "Instagram Square (1:1)"
  );
  const [isUploading, setIsUploading] = useState(false);
  const [isTransforming, setIsTransforming] = useState(false);
  const imageRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    if (uploadedImage) {
      setIsTransforming(true);
    }
  }, [selectedFormat, uploadedImage]);

  //method which handles the upload part of the image

  const handleFileUpload = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setIsUploading(true);
    const formData = new FormData();
    formData.append("file", file);
    try {
      const response = await fetch("/api/image-upload", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) throw new Error("Failed to upload image");

      const data = await response.json();
      setUploadedImage(data.publicId);
    } catch (error) {
      console.log(error);
      alert("Failed to upload image");
    } finally {
      setIsUploading(false);
    }
  };

  const handleDownload = () => {
    if (!imageRef.current) return;
    fetch(imageRef.current.src)
      .then((response) => response.blob())
      .then((blob) => {
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `${selectedFormat
          .replace(/\s+/g,"_")
        .toLowerCase()}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
        document.body.removeChild(link);
      });
  };

  return (
    <div className="max-w-7xl mx-auto w-full p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">Social Share</h1>
          <p className="text-base-content/70">Create on-brand assets for Instagram, X, Facebook and more.</p>
        </div>
        <a className="btn btn-outline" href="/home">Back to Library</a>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <div className="card bg-base-100 border border-base-300 shadow-sm">
            <div className="card-body gap-4">
              <div>
                <h2 className="card-title">Upload an image</h2>
                <p className="text-base-content/70 text-sm">PNG or JPG. Max 1GB.</p>
              </div>
              <input
                type="file"
                onChange={handleFileUpload}
                className="file-input file-input-bordered w-full"
              />
              {isUploading && <progress className="progress w-full"></progress>}

              {uploadedImage && (
                <div className="form-control">
                  <label className="label"><span className="label-text">Format</span></label>
                  <select
                    className="select select-bordered w-full"
                    value={selectedFormat}
                    onChange={(e) => setSelectedFormat(e.target.value as SocialFormat)}
                  >
                    {Object.keys(socialFormats).map((format) => (
                      <option key={format} value={format}>
                        {format}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="lg:col-span-2">
          <div className="card bg-base-100 border border-base-300 shadow-sm">
            <div className="card-body">
              <h2 className="card-title mb-2">Preview</h2>
              {!uploadedImage ? (
                <div className="h-72 sm:h-96 flex items-center justify-center text-base-content/60">
                  Upload an image to see the preview
                </div>
              ) : (
                <div className="relative overflow-hidden rounded-lg border border-base-300">
                  {isTransforming && (
                    <div className="absolute inset-0 flex items-center justify-center bg-base-100/70 z-10">
                      <span className="loading loading-spinner loading-lg"></span>
                    </div>
                  )}
                  <div className="flex justify-center p-4 bg-base-200">
                    <CldImage
                      width={socialFormats[selectedFormat].width}
                      height={socialFormats[selectedFormat].height}
                      src={uploadedImage}
                      sizes="100vw"
                      alt="transformed image"
                      crop="fill"
                      aspectRatio={socialFormats[selectedFormat].aspectRatio}
                      gravity="auto"
                      ref={imageRef}
                      onLoad={() => setIsTransforming(false)}
                    />
                  </div>
                </div>
              )}

              <div className="card-actions justify-end mt-4">
                <button className="btn btn-primary" onClick={handleDownload} disabled={!uploadedImage}>
                  Download for {selectedFormat}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
