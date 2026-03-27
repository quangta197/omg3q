import { NextResponse } from "next/server";
import { getFilterStats } from "@/lib/accounts";

export async function GET() {
  try {
    const stats = await getFilterStats();

    return NextResponse.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "Không thể lấy thống kê bộ lọc.",
      },
      { status: 500 }
    );
  }
}
