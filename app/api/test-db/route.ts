import { NextResponse } from "next/server";

export async function GET() {
  try {
    // Just check if we can access environment variables
    const hasDatabaseUrl = !!process.env.DATABASE_URL;
    
    return NextResponse.json({
      message: "Database test endpoint",
      hasDatabaseUrl,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error("Database test error:", error);
    
    return NextResponse.json({
      error: "Database test failed",
      details: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 });
  }
}
