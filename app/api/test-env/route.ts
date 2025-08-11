import { NextResponse } from "next/server";

export async function GET() {
  try {
    const envCheck = {
      cloudinary_cloud_name: !!process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
      cloudinary_api_key: !!process.env.CLOUDINARY_API_KEY,
      cloudinary_api_secret: !!process.env.CLOUDINARY_API_SECRET,
      database_url: !!process.env.DATABASE_URL,
      clerk_publishable_key: !!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY,
      clerk_secret_key: !!process.env.CLERK_SECRET_KEY,
    };

    return NextResponse.json({
      message: "Environment variables check",
      envCheck,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    return NextResponse.json({
      error: "Failed to check environment variables",
      details: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 });
  }
}
