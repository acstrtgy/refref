import { NextRequest, NextResponse } from "next/server";
import { buildReferralRedirectUrl } from "@/lib/referral-redirect";
import { db } from "@/server/db";
import { schema } from "@refref/coredb";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
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

    // Build redirect URL with refcode parameter and resolve configured placeholders.
    const targetUrl = buildReferralRedirectUrl({
      destinationUrl: landingPageUrl,
      refcode: slug,
      requestUrl: request.url,
    });

    return NextResponse.redirect(targetUrl);
  } catch (error) {
    console.error("Referral redirect error:", error);
    return NextResponse.redirect(new URL("/", request.url));
  }
}
