"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/context/AuthContext";
import { AiOutlineEye, AiOutlineEyeInvisible } from "react-icons/ai";
import { Button, LocationAutocomplete } from "@/components/common";
import {
  ValidationErrors,
  validateRegisterForm,
  hasValidationErrors,
} from "@/utils/validation";
import { getErrorMessage } from "@/utils/api";

interface RegisterFormProps {
  onSuccess?: () => void;
}

export default function RegisterForm({ onSuccess }: RegisterFormProps) {
  const { t } = useTranslation();
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [surname, setSurname] = useState("");
  const [city, setCity] = useState("");
  const [country, setCountry] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [acceptedPrivacy, setAcceptedPrivacy] = useState(false);
  const [validationErrors, setValidationErrors] = useState<ValidationErrors>(
    {}
  );
  const router = useRouter();
  const { register } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setValidationErrors({});

    if (!acceptedTerms) {
      setError(t("register.acceptTerms") + " " + t("register.termsOfUse"));
      return;
    }

    if (!acceptedPrivacy) {
      setError(t("register.acceptPrivacy") + " " + t("register.privacyPolicy"));
      return;
    }

    const errors = validateRegisterForm(
      {
        email,
        name,
        surname,
        city,
        country,
        password,
        confirmPassword,
      },
      t
    );

    setValidationErrors(errors);

    if (hasValidationErrors(errors)) {
      return;
    }

    setIsLoading(true);

    try {
      await register(email, password, { name, surname, city, country });
      if (onSuccess) {
        onSuccess();
      } else {
        router.push("/");
      }
    } catch (err) {
      setError(
        getErrorMessage(err, t, "register.registrationFailed")
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleFieldChange = (field: keyof ValidationErrors, value: string) => {
    // Clear validation error when user starts typing
    if (validationErrors[field]) {
      setValidationErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  const isFormValid =
    email &&
    name &&
    surname &&
    city &&
    country &&
    password &&
    confirmPassword &&
    password === confirmPassword &&
    acceptedTerms &&
    acceptedPrivacy;

  const isSubmitDisabled = isLoading || !isFormValid;

  return (
    <div className="flex items-center justify-center min-h-screen mt-10 bg-gray-100">
      <div className="w-full max-w-4xl mx-auto bg-white rounded-lg shadow-md">
        <div className="bg-orange text-white rounded-t-lg">
          <h1 className="text-xl text-center font-bold mb-6 py-4">
            {t("register.title")}
          </h1>
        </div>
        <form className="p-6" onSubmit={handleSubmit}>
          {error && (
            <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
              {error}
            </div>
          )}

          <div className="mb-4">
            <label
              className="block text-gray-700 text-sm font-bold mb-2"
              htmlFor="email"
            >
              {t("register.emailLabel")}
            </label>
            <input
              className={`shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline ${
                validationErrors.email ? "border-red-500" : ""
              }`}
              id="email"
              type="email"
              placeholder={t("register.emailPlaceholder")}
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                handleFieldChange("email", e.target.value);
              }}
              required
            />
            {validationErrors.email && (
              <p className="text-red-500 text-xs mt-1">
                {validationErrors.email}
              </p>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label
                className="block text-gray-700 text-sm font-bold mb-2"
                htmlFor="name"
              >
                {t("register.nameLabel")}
              </label>
              <input
                className={`shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline ${
                  validationErrors.name ? "border-red-500" : ""
                }`}
                id="name"
                type="text"
                placeholder={t("register.namePlaceholder")}
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  handleFieldChange("name", e.target.value);
                }}
                required
              />
              {validationErrors.name && (
                <p className="text-red-500 text-xs mt-1">
                  {validationErrors.name}
                </p>
              )}
            </div>
            <div>
              <label
                className="block text-gray-700 text-sm font-bold mb-2"
                htmlFor="surname"
              >
                {t("register.surnameLabel")}
              </label>
              <input
                className={`shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline ${
                  validationErrors.surname ? "border-red-500" : ""
                }`}
                id="surname"
                type="text"
                placeholder={t("register.surnamePlaceholder")}
                value={surname}
                onChange={(e) => {
                  setSurname(e.target.value);
                  handleFieldChange("surname", e.target.value);
                }}
                required
              />
              {validationErrors.surname && (
                <p className="text-red-500 text-xs mt-1">
                  {validationErrors.surname}
                </p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <LocationAutocomplete
              value={city}
              onChange={(value) => {
                setCity(value);
                handleFieldChange("city", value);
              }}
              placeholder={t("register.cityPlaceholder")}
              label={t("register.cityLabel")}
              error={validationErrors.city}
            />
            <LocationAutocomplete
              value={country}
              onChange={(value) => {
                setCountry(value);
                handleFieldChange("country", value);
              }}
              placeholder={t("register.countryPlaceholder")}
              label={t("register.countryLabel")}
              error={validationErrors.country}
            />
          </div>

          <div className="mb-4">
            <label
              className="block text-gray-700 text-sm font-bold mb-2"
              htmlFor="password"
            >
              {t("register.passwordLabel")}
            </label>
            <div className="relative">
              <input
                className={`shadow appearance-none border rounded w-full py-2 px-3 pr-10 text-gray-700 leading-tight focus:outline-none focus:shadow-outline ${
                  validationErrors.password ? "border-red-500" : ""
                }`}
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder={t("register.passwordPlaceholder")}
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  handleFieldChange("password", e.target.value);
                }}
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
            <p className="text-gray-600 text-xs mt-1">
              {t("register.passwordHint")}
            </p>
          </div>

          <div className="mb-6">
            <label
              className="block text-gray-700 text-sm font-bold mb-2"
              htmlFor="confirmPassword"
            >
              {t("register.confirmPasswordLabel")}
            </label>
            <div className="relative">
              <input
                className={`shadow appearance-none border rounded w-full py-2 px-3 pr-10 text-gray-700 leading-tight focus:outline-none focus:shadow-outline ${
                  validationErrors.confirmPassword ? "border-red-500" : ""
                }`}
                id="confirmPassword"
                type={showConfirmPassword ? "text" : "password"}
                placeholder={t("register.confirmPasswordPlaceholder")}
                value={confirmPassword}
                onChange={(e) => {
                  setConfirmPassword(e.target.value);
                  handleFieldChange("confirmPassword", e.target.value);
                }}
                required
              />
              <Button
                type="button"
                variant="icon"
                className="absolute inset-y-0 right-0 flex items-center px-3"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              >
                {showConfirmPassword ? (
                  <AiOutlineEyeInvisible size={20} />
                ) : (
                  <AiOutlineEye size={20} />
                )}
              </Button>
            </div>
            {validationErrors.confirmPassword && (
              <p className="text-red-500 text-xs mt-1">
                {validationErrors.confirmPassword}
              </p>
            )}
          </div>

          <div className="mb-4">
            <label className="flex items-start">
              <input
                type="checkbox"
                className="mt-1 mr-2"
                checked={acceptedTerms}
                onChange={(e) => setAcceptedTerms(e.target.checked)}
              />
              <span className="text-sm text-gray-700">
                {t("register.acceptTerms")}{" "}
                <Link
                  href="/terms-of-use"
                  target="_blank"
                  className="text-orange hover:text-orangeDark font-semibold"
                >
                  {t("register.termsOfUse")}
                </Link>
              </span>
            </label>
          </div>

          <div className="mb-6">
            <label className="flex items-start">
              <input
                type="checkbox"
                className="mt-1 mr-2"
                checked={acceptedPrivacy}
                onChange={(e) => setAcceptedPrivacy(e.target.checked)}
              />
              <span className="text-sm text-gray-700">
                {t("register.acceptPrivacy")}{" "}
                <Link
                  href="/privacy-policy"
                  target="_blank"
                  className="text-orange hover:text-orangeDark font-semibold"
                >
                  {t("register.privacyPolicy")}
                </Link>
              </span>
            </label>
          </div>

          <div className="flex items-center justify-between">
            <Button
              type="submit"
              isLoading={isLoading}
              disabled={isSubmitDisabled}
              text={
                isLoading
                  ? t("register.creatingAccount")
                  : t("register.createAccount")
              }
            />
          </div>

          <div className="mt-6 text-center">
            <span className="text-gray-600 text-sm">
              {t("register.haveAccount")}{" "}
            </span>
            <Link
              href="/login"
              className="text-orange hover:text-orangeDark text-sm font-semibold"
            >
              {t("register.signInHere")}
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
