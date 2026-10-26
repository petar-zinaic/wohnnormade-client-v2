"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useTranslation } from "react-i18next";
import { AiOutlineEye, AiOutlineEyeInvisible } from "react-icons/ai";
import { Button } from "@/components/common";
import { AuthService } from "@/services/auth";
import { ApiError, getErrorMessage } from "@/utils/api";
import {
  ValidationErrors,
  validatePassword,
  validateConfirmPassword,
} from "@/utils/validation";

const RESET_TOKEN_PATTERN = /^[0-9a-f]{64}$/;

export default function ResetPasswordForm() {
  const { t } = useTranslation();
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";
  const isTokenValid = RESET_TOKEN_PATTERN.test(token);

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [validationErrors, setValidationErrors] = useState<ValidationErrors>(
    {}
  );
  const [isLinkExpired, setIsLinkExpired] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  // Redirect to login shortly after a successful reset
  useEffect(() => {
    if (!isSuccess) return;
    const timer = setTimeout(() => router.push("/login"), 2000);
    return () => clearTimeout(timer);
  }, [isSuccess, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const errors: ValidationErrors = {
      password: validatePassword(password, t),
      confirmPassword: validateConfirmPassword(confirmPassword, password, t),
    };
    setValidationErrors(errors);
    if (errors.password || errors.confirmPassword) return;

    setIsLoading(true);

    try {
      await AuthService.resetPassword(token, password);
      setIsSuccess(true);
    } catch (err) {
      if (err instanceof ApiError && err.code === "invalid_reset_token") {
        setIsLinkExpired(true);
      } else {
        setError(getErrorMessage(err, t, "resetPassword.failed"));
      }
    } finally {
      setIsLoading(false);
    }
  };

  const renderNotice = (text: string) => (
    <div className="p-6">
      <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
        {text}
      </div>
      <div className="text-center">
        <Link
          href="/forgot-password"
          className="text-orange hover:text-orangeDark text-sm font-semibold"
        >
          {t("resetPassword.requestNewLink")}
        </Link>
      </div>
    </div>
  );

  const passwordInputClass = (hasError: boolean) =>
    `shadow appearance-none border rounded w-full py-2 px-3 pr-10 text-gray-700 leading-tight focus:outline-none focus:shadow-outline ${
      hasError ? "border-red-500" : ""
    }`;

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="w-full max-w-md mx-auto bg-white rounded-lg shadow-md">
        <div className="bg-orange text-white rounded-t-lg">
          <h1 className="text-xl text-center font-bold mb-6 py-4">
            {t("resetPassword.title")}
          </h1>
        </div>

        {!isTokenValid ? (
          renderNotice(t("resetPassword.invalidLink"))
        ) : isLinkExpired ? (
          renderNotice(t("resetPassword.expiredLink"))
        ) : isSuccess ? (
          <div className="p-6">
            <div className="p-3 bg-green-100 border border-green text-green rounded">
              {t("resetPassword.success")}
            </div>
          </div>
        ) : (
          <form className="p-6" onSubmit={handleSubmit}>
            {error && (
              <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
                {error}
              </div>
            )}

            <div className="mb-4">
              <label
                className="block text-gray-700 text-sm font-bold mb-2"
                htmlFor="newPassword"
              >
                {t("resetPassword.newPasswordLabel")}
              </label>
              <div className="relative">
                <input
                  className={passwordInputClass(!!validationErrors.password)}
                  id="newPassword"
                  type={showPassword ? "text" : "password"}
                  autoComplete="new-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <Button
                  type="button"
                  variant="icon"
                  className="absolute inset-y-0 right-0 flex items-center px-3"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <AiOutlineEyeInvisible size={20} />
                  ) : (
                    <AiOutlineEye size={20} />
                  )}
                </Button>
              </div>
              {validationErrors.password && (
                <p className="text-red-500 text-xs mt-1">
                  {validationErrors.password}
                </p>
              )}
            </div>

            <div className="mb-6">
              <label
                className="block text-gray-700 text-sm font-bold mb-2"
                htmlFor="confirmPassword"
              >
                {t("resetPassword.confirmPasswordLabel")}
              </label>
              <input
                className={passwordInputClass(
                  !!validationErrors.confirmPassword
                )}
                id="confirmPassword"
                type={showPassword ? "text" : "password"}
                autoComplete="new-password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
              {validationErrors.confirmPassword && (
                <p className="text-red-500 text-xs mt-1">
                  {validationErrors.confirmPassword}
                </p>
              )}
            </div>

            <div className="flex items-center justify-between">
              <Button
                type="submit"
                isLoading={isLoading}
                disabled={isLoading}
                text={
                  isLoading
                    ? t("resetPassword.submitting")
                    : t("resetPassword.submit")
                }
              />
            </div>
          </form>
        )}

        <div className="pb-6 text-center">
          <Link
            href="/login"
            className="text-orange hover:text-orangeDark text-sm"
          >
            {t("resetPassword.backToLogin")}
          </Link>
        </div>
      </div>
    </div>
  );
}
