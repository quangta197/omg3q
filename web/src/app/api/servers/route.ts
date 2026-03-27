import { NextResponse } from "next/server";
import { getServers } from "@/lib/accounts";

export async function GET() {
  try {
    const servers = await getServers();

    return NextResponse.json({
      success: true,
      data: servers,
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "Không thể lấy danh sách server.",
      },
      { status: 500 }
    );
  }
}
