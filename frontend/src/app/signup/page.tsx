import AuthForm from "@/components/auth/AuthForm";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sign Up | Vantage AI",
};

export default function SignupPage() {
  return <AuthForm initialMode="signup" />;
}
