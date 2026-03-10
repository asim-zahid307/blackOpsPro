// src/app/api/org/switch/route.ts
import {NextResponse} from "next/server";
import {queryOne} from "@/lib/db";
import {requireAuth} from "@/lib/auth";

export async function POST(req: Request) {
    const user = await requireAuth();

    const body = await req.json();
    const {orgId} = body;

    const orgMembership = await queryOne(
        `SELECT *
         FROM user_organizations
         WHERE user_id = $1
           AND org_id = $2`,
        [user.userId, orgId]
    );

    if (!orgMembership) {
        return NextResponse.json(
            {error: "You are not a member of this organization"},
            {status: 403}
        );
    }

    // Create a NextResponse to set cookie
    const res = NextResponse.json({success: true});
    res.cookies.set("current_org_id", orgId, {path: "/"}); // ✅ correct usage

    return res;
}