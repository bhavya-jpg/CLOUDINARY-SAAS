import {NextResponse,NextRequest} from "next/server"
import { PrismaClient } from "../../generated/prisma"

const prisma = new PrismaClient()

export async function GET(request: NextRequest){
    try {
        const videos=await prisma.video.findMany({
            orderBy:{createdAt:"desc"}
        })
        return NextResponse.json(videos)
    } catch (error:any) {
        return NextResponse.json({
            error:"Error fetching videos"
        },{status:500})
    }finally{
        await prisma.$disconnect()
    }
 }