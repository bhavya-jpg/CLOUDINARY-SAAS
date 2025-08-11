import { NextResponse, NextRequest } from "next/server";
import { v2 as cloudinary } from "cloudinary";
import { auth } from "@clerk/nextjs/server";
import { PrismaClient } from "../../generated/prisma/index";

// Create a single Prisma client instance
let prisma: PrismaClient;

if (process.env.NODE_ENV === 'production') {
  prisma = new PrismaClient();
} else {
  // In development, use a global variable to prevent multiple instances
  if (!(global as { prisma?: PrismaClient }).prisma) {
    (global as { prisma?: PrismaClient }).prisma = new PrismaClient();
  }
  prisma = (global as { prisma?: PrismaClient }).prisma!;
}

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
  secure_url?: string;
  [key: string]: unknown;
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

    // Simple upload without complex transformations
    const result = await new Promise<CloudinaryUploadResult>((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          resource_type: "video",
          folder: "video-uploads",
          quality: "auto:low",
          fetch_format: "mp4"
        },
        (error, result) => {
          if (error) {
            console.error("Cloudinary upload error:", error);
            reject(error);
          } else {
            console.log("Cloudinary upload success:", result);
            resolve(result as CloudinaryUploadResult);
          }
        }
      );
      uploadStream.end(buffer);
    });

    // Calculate compression percentage
    const originalSizeBytes = parseInt(originalSize);
    const compressedSizeBytes = result.bytes;
    
    let compressionPercentage = 0;
    if (originalSizeBytes > compressedSizeBytes) {
      compressionPercentage = Math.round(
        ((originalSizeBytes - compressedSizeBytes) / originalSizeBytes) * 100
      );
    } else {
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

    // Test database connection first
    try {
      await prisma.$connect();
      console.log("Database connected successfully");
    } catch (dbConnectError) {
      console.error("Database connection failed:", dbConnectError);
      return NextResponse.json({ 
        error: "Database connection failed",
        details: dbConnectError instanceof Error ? dbConnectError.message : "Unknown database error"
      }, { status: 500 });
    }

    // Save to database
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
          // Simplified URLs
          aiPreviewUrl: null,
          thumbnailUrl: null,
          highQualityUrl: null,
          originalQualityUrl: result.secure_url || null,
          keyMoments: [],
          compressionRatio: compressedSizeBytes / originalSizeBytes,
          previewDuration: 15
        },
      });
      console.log("Video saved to database:", video.id);
    } catch (dbError) {
      console.error("Database error:", dbError);
      return NextResponse.json({ 
        error: "Failed to save video to database",
        details: dbError instanceof Error ? dbError.message : "Unknown database error"
      }, { status: 500 });
    } finally {
      await prisma.$disconnect();
    }

    return NextResponse.json({ 
      success: true, 
      video: video,
      compressionPercentage,
      originalSizeBytes,
      compressedSizeBytes,
      message: "Video uploaded successfully"
    }, { status: 200 });

  } catch (error) {
    console.error("Upload video failed:", error);
    
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
  }
}

export async function GET() {
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
  } catch {
    return NextResponse.json({ error: "Test failed" }, { status: 500 });
  }
}
