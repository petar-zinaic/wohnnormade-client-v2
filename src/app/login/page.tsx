import type { Metadata } from "next";
import LoginForm from "@/components/forms/LoginForm";

export const metadata: Metadata = {
  title: "Anmelden",
  description: "Melden Sie sich bei Ihrem Wohnnomade-Konto an.",
  robots: { index: false, follow: false },
};

interface Props {
  searchParams: { sessionExpired?: string };
}

export default function LoginPage({ searchParams }: Props) {
  return <LoginForm sessionExpired={searchParams.sessionExpired === "1"} />;
}
