import { Suspense } from "react";
import { AuthConfirmClient } from "./AuthConfirmClient";

export const dynamic = "force-dynamic";

export default function AuthConfirmPage() {
  return (
    <Suspense>
      <AuthConfirmClient />
    </Suspense>
  );
}
