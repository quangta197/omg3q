import { NextResponse } from "next/server";
import { getNations } from "@/lib/accounts";

export async function GET() {
  try {
    const nations = await getNations();

    return NextResponse.json({
      success: true,
      data: nations,
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "Không thể lấy danh sách quốc gia.",
      },
      { status: 500 }
    );
  }
}
