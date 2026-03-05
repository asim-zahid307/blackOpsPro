import { NextResponse } from "next/server";
import { query } from "@/lib/db";

export async function GET() {
    const result = await query("SELECT id, name FROM organizations ORDER BY name");
    return NextResponse.json(result.rows);
}