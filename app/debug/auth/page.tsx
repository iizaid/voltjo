import { AuthDebugClient } from "./AuthDebugClient";

export const dynamic = "force-dynamic";

export default function AuthDebugPage() {
  const enabled = process.env.NEXT_PUBLIC_AUTH_DEBUG === "true";

  if (!enabled) {
    return (
      <main
        className="grid min-h-dvh place-items-center bg-white p-8"
        dir="ltr"
      >
        <p className="font-mono text-sm text-gray-500">Auth debug is disabled.</p>
      </main>
    );
  }

  return <AuthDebugClient />;
}
