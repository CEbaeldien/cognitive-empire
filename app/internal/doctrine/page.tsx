import { cookies } from "next/headers";
import type { Metadata } from "next";
import "./doctrine.css";
import { DOCTRINE_COOKIE_NAME, isValidSession } from "@/lib/doctrine/auth";
import { PasswordGate } from "./_components/PasswordGate";
import { DoctrineConsole } from "./_components/DoctrineConsole";

export const metadata: Metadata = {
  title: "CE Doctrine OS — Internal",
  robots: {
    index: false,
    follow: false,
  },
};

export const dynamic = "force-dynamic";

export default async function DoctrineOSPage() {
  const cookieStore = await cookies();
  const session = cookieStore.get(DOCTRINE_COOKIE_NAME)?.value;
  const authorized = isValidSession(session);

  if (!authorized) {
    return <PasswordGate />;
  }

  return <DoctrineConsole />;
}
