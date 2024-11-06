import { NextResponse, NextRequest } from "next/server";
import { WebhookEventSchema } from "@/schemas/strava-webhook-events";
import processWebhookEvent from "@/lib/strava-webhook";
import { baseLogger } from "@/lib/logger";
const STRAVA_DOMAIN = "www.strava.com";

function isStravaOrigin(request: NextRequest): boolean {
  const origin = request.headers.get("origin");
  const referer = request.headers.get("referer");

  // Allow localhost in development
  if (process.env.NODE_ENV === "development") {
    if (origin?.includes("localhost") || referer?.includes("localhost")) {
      return true;
    }
  }

  if (origin && new URL(origin).hostname === STRAVA_DOMAIN) {
    return true;
  }

  if (referer && new URL(referer).hostname === STRAVA_DOMAIN) {
    return true;
  }

  return false;
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const hub_mode = searchParams.get("hub.mode");
  const hub_verify_token = searchParams.get("hub.verify_token");
  const hub_challenge = searchParams.get("hub.challenge");
  baseLogger.info(`Received Strava webhook GET request with params: ${hub_mode}, ${hub_verify_token}, ${hub_challenge}`);

  // if (!isStravaOrigin(request) && hub_verify_token == process.env.STRAVA_WEBHOOK_VERIFY_TOKEN) {
  //   return new NextResponse(null, { status: 403 });
  // }

  if (hub_mode === "subscribe" && hub_verify_token === process.env.STRAVA_WEBHOOK_VERIFY_TOKEN) {
    return NextResponse.json({ "hub.challenge": hub_challenge });
  } else {
    return new NextResponse(null, { status: 403 });
  }
}

export async function POST(request: NextRequest) {
  // if (!isStravaOrigin(request)) {
  //   return new NextResponse(null, { status: 403 });
  // }

  try {
    const requestJson = await request.json();
    baseLogger.info(`requestJson: ${JSON.stringify(requestJson, null, 2)}`);
    const validationResult = WebhookEventSchema.safeParse(requestJson);

    if (!validationResult.success) {
      baseLogger.error(`Invalid webhook event data: ${JSON.stringify(validationResult.error, null, 2)}`);
      throw new Error("Invalid webhook event data");
    } else {
      processWebhookEvent(validationResult.data).catch(console.error);
    }

    return new NextResponse(null, { status: 200 });
  } catch (error) {
    baseLogger.error(`Webhook processing error: ${error}`);
    return new NextResponse(null, { status: 400 });
  }
}