"use client";

import { useState } from "react";
import Link from "next/link";
import { useTranslation } from "react-i18next";
import { getErrorMessage } from "@/utils/api";
import { AuthService } from "@/services/auth";
import { Button } from "@/components/common";

export default function ForgotPasswordForm() {
  const { t } = useTranslation();
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    setMessage("");

    try {
      await AuthService.forgotPassword(email);
      // The API answers the same whether or not the email exists
      setMessage(t("forgotPassword.sent"));
    } catch (err) {
      setError(getErrorMessage(err, t, "forgotPassword.sendFailed"));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="w-full max-w-md mx-auto bg-white rounded-lg shadow-md">
        <div className="bg-orange text-white rounded-t-lg">
          <h1 className="text-xl text-center font-bold mb-6 py-4">
            {t("forgotPassword.title")}
          </h1>
        </div>
        <form className="p-6" onSubmit={handleSubmit}>
          {error && (
            <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
              {error}
            </div>
          )}

          {message && (
            <div className="mb-4 p-3 bg-green-100 border border-green text-green rounded">
              {message}
            </div>
          )}

          <div className="mb-6">
            <label
              className="block text-gray-700 text-sm font-bold mb-2"
              htmlFor="email"
            >
              {t("forgotPassword.emailLabel")}
            </label>
            <input
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              id="email"
              type="email"
              placeholder={t("forgotPassword.emailPlaceholder")}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <p className="text-sm text-gray-600 mt-2">
              {t("forgotPassword.helpText")}
            </p>
          </div>

          <div className="flex items-center justify-between">
            <Button
              type="submit"
              isLoading={isLoading}
              disabled={isLoading}
              text={
                isLoading
                  ? t("forgotPassword.sending")
                  : t("forgotPassword.sendResetLink")
              }
            />
          </div>

          <div className="mt-6 text-center">
            <Link
              href="/login"
              className="text-orange hover:text-orangeDark text-sm"
            >
              {t("forgotPassword.backToLogin")}
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
