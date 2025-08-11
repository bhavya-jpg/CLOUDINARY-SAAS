import { NextResponse } from "next/server";
import { PrismaClient } from "../../generated/prisma/index";

const prisma = new PrismaClient();

export async function GET() {
  try {
    // Test database connection
    await prisma.$connect();
    
    // Test a simple query
    const videoCount = await prisma.video.count();
    
    await prisma.$disconnect();
    
    return NextResponse.json({
      message: "Database connection successful",
      videoCount,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error("Database test error:", error);
    
    try {
      await prisma.$disconnect();
    } catch (disconnectError) {
      console.error("Disconnect error:", disconnectError);
    }
    
    return NextResponse.json({
      error: "Database connection failed",
      details: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 });
  }
}
