import { NextRequest, NextResponse } from "next/server";
import { db } from "@/server/db";
import { schema } from "@refref/coredb";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;

    // Find refcode
    const refcode = await db.query.refcode.findFirst({
      where: (refcode, { eq }) => eq(refcode.code, slug),
      with: {
        program: true,
      },
    });

    if (!refcode) {
      return NextResponse.redirect(new URL("/", request.url));
    }

    // Get landing page URL from program config
    const landingPageUrl =
      refcode.program?.config?.brandConfig?.landingPageUrl ||
      refcode.program?.config?.widgetConfig?.referralLink ||
      "/";

    // Build redirect URL with refcode parameter
    const targetUrl = new URL(landingPageUrl);
    targetUrl.searchParams.set("refcode", slug);

    return NextResponse.redirect(targetUrl);
  } catch (error) {
    console.error("Referral redirect error:", error);
    return NextResponse.redirect(new URL("/", request.url));
  }
}
