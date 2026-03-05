import { NextRequest, NextResponse } from "next/server";
import { signupUser } from "@/lib/auth";

export async function POST(req: NextRequest) {
    try {
        const { email, password, orgId } = await req.json();
        await signupUser(email, password, orgId);
        return NextResponse.json({ success: true });
    } catch (err) {
        return NextResponse.json({ error: (err as Error).message }, { status: 400 });
    }
}