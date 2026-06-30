import { NextRequest, NextResponse } from "next/server";
import { db } from "@/server/db";
import { schema } from "@refref/coredb";
import { createId } from "@refref/id";
import { generateGlobalCode } from "@refref/utils";

const { participant, refcode, program, productSecrets } = schema;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { productId, refcode: refcodeParam, token } = body;

    if (!productId) {
      return NextResponse.json(
        { error: "Bad Request", message: "productId is required" },
        { status: 400 }
      );
    }

    // Find the active program for this product
    const activeProgram = await db.query.program.findFirst({
      where: (program, { eq, and }) =>
        and(eq(program.productId, productId), eq(program.status, "active")),
      orderBy: (program, { asc }) => [asc(program.createdAt)],
    });

    if (!activeProgram) {
      return NextResponse.json(
        { error: "Bad Request", message: "No active program found" },
        { status: 400 }
      );
    }

    // Use token sub or externalId if provided
    // For now, create an anonymous participant if no externalId
    const externalId = token ? "authenticated" : "anonymous-" + Date.now();

    // Upsert participant
    const [participantRecord] = await db
      .insert(participant)
      .values({
        externalId,
        productId,
      })
      .onConflictDoUpdate({
        target: [participant.productId, participant.externalId],
        set: {},
      })
      .returning();

    if (!participantRecord) {
      return NextResponse.json(
        { error: "Internal Server Error" },
        { status: 500 }
      );
    }

    // Get or create refcode
    let refcodeRecord = await db.query.refcode.findFirst({
      where: (refcode, { eq, and }) =>
        and(
          eq(refcode.participantId, participantRecord.id),
          eq(refcode.programId, activeProgram.id),
        ),
      orderBy: (refcode, { desc }) => [desc(refcode.createdAt)],
    });

    if (!refcodeRecord) {
      const code = generateGlobalCode(5);
      if (!code) {
        return NextResponse.json(
          { error: "Internal Server Error", message: "Failed to generate refcode" },
          { status: 500 }
        );
      }
      const [newRefcode] = await db
        .insert(refcode)
        .values({
          id: createId("refcode"),
          code,
          participantId: participantRecord.id,
          programId: activeProgram.id,
          productId,
        })
        .returning();
      refcodeRecord = newRefcode;
    }

    if (!refcodeRecord) {
      return NextResponse.json(
        { error: "Internal Server Error" },
        { status: 500 }
      );
    }

    // Get widget config from program
    const widgetConfig = activeProgram.config?.widgetConfig || {};

    // Build referral link
    const referralHostUrl =
      process.env.REFERRAL_HOST_URL || "https://staging-refref-refer.strtgy.design";
    const referralLink = `${referralHostUrl}/${refcodeRecord.code}`;

    return NextResponse.json({
      ...widgetConfig,
      referralLink,
    });
  } catch (error) {
    console.error("Widget init error:", error);
    return NextResponse.json(
      { error: "Internal Server Error", message: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}
