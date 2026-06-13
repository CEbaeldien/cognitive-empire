import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export function GET() {
  return NextResponse.json({
    signalsV2: process.env.SIGNALS_V2,
    hasSignalsV2: Boolean(process.env.SIGNALS_V2),
    nextPublicSignalsV2: process.env.NEXT_PUBLIC_SIGNALS_V2,
    nodeEnv: process.env.NODE_ENV,
    vercelEnv: process.env.VERCEL_ENV,
    vercelGitCommitSha: process.env.VERCEL_GIT_COMMIT_SHA,
  });
}
