import { Suspense } from "react";
import type { Metadata } from "next";
import ResetPasswordForm from "@/components/forms/ResetPasswordForm";

export const metadata: Metadata = {
  title: "Neues Passwort festlegen",
  description: "Legen Sie ein neues Passwort für Ihr Wohnnomade-Konto fest.",
  robots: { index: false, follow: false },
};

export default function ResetPasswordPage() {
  // ResetPasswordForm reads the token with useSearchParams, which needs a Suspense boundary
  return (
    <Suspense>
      <ResetPasswordForm />
    </Suspense>
  );
}
