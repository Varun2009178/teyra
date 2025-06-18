import { LoginPage } from "@/lib/components/login-page";
import { Suspense } from "react";

export default function Page() {
  return (
    <Suspense>
      <LoginPage />
    </Suspense>
  );
} 