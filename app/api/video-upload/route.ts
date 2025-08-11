import { NextResponse, NextRequest } from "next/server";
import { v2 as cloudinary } from "cloudinary";
import { auth } from "@clerk/nextjs/server";
import { PrismaClient } from "../../generated/prisma";

const prisma = new PrismaClient();

// Configuration
cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

interface CloudinaryUploadResult {
  public_id: string;
  bytes: number;
  duration?: number;
  [key: string]: any;
}

export async function POST(request: NextRequest) {
  try {
    // Check user authentication
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check Cloudinary credentials
    if (
      !process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME ||
      !process.env.CLOUDINARY_API_KEY ||
      !process.env.CLOUDINARY_API_SECRET
    ) {
      console.error("Missing Cloudinary credentials:", {
        cloud_name: !!process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
        api_key: !!process.env.CLOUDINARY_API_KEY,
        api_secret: !!process.env.CLOUDINARY_API_SECRET
      });
      return NextResponse.json(
        { error: "Cloudinary credentials not found" },
        { status: 500 }
      );
    }

    console.log("Cloudinary config:", {
      cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY ? "***" : "missing",
      api_secret: process.env.CLOUDINARY_API_SECRET ? "***" : "missing"
    });

    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const title = formData.get("title") as string;
    const description = formData.get("description") as string;
    const originalSize = formData.get("originalSize") as string;

    if (!file) {
      return NextResponse.json({ error: "File not found" }, { status: 400 });
    }

    // Validate file type
    if (!file.type.startsWith('video/')) {
      return NextResponse.json({ 
        error: "Invalid file type. Please upload a video file." 
      }, { status: 400 });
    }

    // Check file size (1GB limit)
    const MAX_FILE_SIZE = 1 * 1024 * 1024 * 1024;
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ 
        error: "File size too large. Maximum size is 1GB." 
      }, { status: 400 });
    }

    console.log("Processing video upload:", {
      fileName: file.name,
      fileType: file.type,
      fileSize: file.size,
      userId: userId
    });

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Upload with AI-powered preview generation and smart compression
    const result = await Promise.race([
      new Promise<CloudinaryUploadResult>((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          {
            resource_type: "video",
            folder: "video-uploads",
            // Smart compression during upload
            transformation: [
              {
                quality: "auto:low",
                fetch_format: "mp4",
                video_codec: "auto",
                bit_rate: "auto"
              }
            ],
            // Generate compressed, preview, and thumbnail derivatives
            eager: [
              // Compressed streaming/download version
              {
                quality: "auto:low",
                fetch_format: "mp4",
                video_codec: "auto",
                bit_rate: "auto",
                audio_codec: "aac",
                audio_quality: "low"
              },
              // Short preview (like hover preview)
              {
                quality: "auto:low",
                fetch_format: "mp4",
                video_codec: "auto",
                effect: "preview:duration_10"
              },
              // Thumbnail image
              {
                fetch_format: "jpg",
                crop: "fill",
                gravity: "auto",
                width: 400,
                height: 225,
                quality: "auto:low"
              }
            ],
            eager_async: false,
            // Generate AI-powered preview
            eager_transformation: true
          },
          (error, result) => {
            if (error) {
              console.error("Cloudinary upload error:", error);
              reject(error);
            } else {
              console.log("Cloudinary upload success with AI previews:", result);
              console.log("Eager transformations:", result?.eager);
              console.log("Result keys:", result ? Object.keys(result) : []);
              resolve(result as CloudinaryUploadResult);
            }
          }
        );
        uploadStream.end(buffer);
      }),
      new Promise<never>((_, reject) => 
        setTimeout(() => reject(new Error("Upload timeout after 120 seconds")), 120000)
      )
    ]);

    // Extract URLs from eager transformations (index-based)
    const eagerResults = result?.eager || [];
    const highQualityUrl = eagerResults[0]?.secure_url || null;
    const aiPreviewUrl = eagerResults[1]?.secure_url || null;
    const thumbnailUrl = eagerResults[2]?.secure_url || null;

    console.log("Extracted URLs:", { aiPreviewUrl, thumbnailUrl, highQualityUrl });

    // Calculate actual compression percentage
    const originalSizeBytes = parseInt(originalSize);
    const compressedSizeBytes = result.bytes;
    
    let compressionPercentage = 0;
    if (originalSizeBytes > compressedSizeBytes) {
      compressionPercentage = Math.round(
        ((originalSizeBytes - compressedSizeBytes) / originalSizeBytes) * 100
      );
    } else {
      // If file got larger, show negative compression
      compressionPercentage = Math.round(
        ((compressedSizeBytes - originalSizeBytes) / originalSizeBytes) * 100
      );
    }

    console.log("Upload result:", {
      originalSize: originalSizeBytes,
      compressedSize: compressedSizeBytes,
      compressionPercentage,
      publicId: result.public_id
    });

    // Save to database with error handling
    let video;
    try {
      video = await prisma.video.create({
        data: {
          title,
          description,
          originalSize,
          publicId: result.public_id,
          compressedSize: String(result.bytes),
          duration: result.duration || 0,
          userId: userId,
          // AI-powered preview and quality URLs
          aiPreviewUrl: aiPreviewUrl || null,
          thumbnailUrl: thumbnailUrl || null,
          highQualityUrl: highQualityUrl || null,
          originalQualityUrl: result.secure_url || null,
          keyMoments: [], // Will be populated by AI analysis
          compressionRatio: compressedSizeBytes / originalSizeBytes,
          previewDuration: 15 // AI preview duration
        },
      });
      console.log("Video saved to database with AI features:", video.id);
    } catch (dbError) {
      console.error("Database error:", dbError);
      return NextResponse.json({ 
        error: "Failed to save video to database",
        details: dbError instanceof Error ? dbError.message : "Unknown database error"
      }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true, 
      video: video,
      compressionPercentage,
      originalSizeBytes,
      compressedSizeBytes,
      message: "Video uploaded successfully with compression applied",
      compressionInfo: {
        originalSizeMB: (originalSizeBytes / (1024 * 1024)).toFixed(2),
        compressedSizeMB: (compressedSizeBytes / (1024 * 1024)).toFixed(2),
        savingsMB: ((originalSizeBytes - compressedSizeBytes) / (1024 * 1024)).toFixed(2)
      }
    }, { status: 200 });

  } catch (error) {
    console.error("Upload video failed:", error);
    
    // Handle specific error types
    let errorMessage = "Upload video failed";
    let statusCode = 500;
    
    if (error instanceof Error) {
      if (error.message.includes("timeout")) {
        errorMessage = "Upload timed out. Please try again with a smaller file.";
        statusCode = 408;
      } else if (error.message.includes("credentials")) {
        errorMessage = "Cloudinary authentication failed. Please check configuration.";
        statusCode = 500;
      } else if (error.message.includes("file")) {
        errorMessage = "Invalid file format or corrupted file.";
        statusCode = 400;
      } else {
        errorMessage = error.message;
      }
    }
    
    return NextResponse.json({ 
      error: errorMessage,
      details: error instanceof Error ? error.message : "Unknown error"
    }, { status: statusCode });
  } finally {
    await prisma.$disconnect();
  }
}

export async function GET(request: NextRequest) {
  try {
    // Test endpoint to check Cloudinary configuration
    const config = {
      cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY ? "***" : "missing",
      api_secret: process.env.CLOUDINARY_API_SECRET ? "***" : "missing"
    };
    
    return NextResponse.json({ 
      message: "Video upload API is running",
      config,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    return NextResponse.json({ error: "Test failed" }, { status: 500 });
  }
}
