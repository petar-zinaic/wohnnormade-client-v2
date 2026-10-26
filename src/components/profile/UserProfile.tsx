"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/context/AuthContext";
import { AiOutlineEye, AiOutlineEyeInvisible } from "react-icons/ai";
import { Button, LocationAutocomplete } from "@/components/common";
import { AuthService, UserService, UpdateUserData } from "@/services";
import type { Tenant } from "@/types";
import type { UserProfile as UserProfileType } from "@/services";
import {
  ValidationErrors,
  validateName,
  validateSurname,
  validateCity,
  validateCountry,
} from "@/utils/validation";
import { formatDateDMY } from "@/utils/date";
import { ApiError, getErrorMessage } from "@/utils/api";
import { translateViolationType } from "@/utils/violationTypeTranslation";

export default function UserProfile() {
  const { t } = useTranslation();
  const { user, logout } = useAuth();
  const router = useRouter();

  // Profile edit states
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState("");
  const [surname, setSurname] = useState("");
  const [city, setCity] = useState("");
  const [country, setCountry] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [validationErrors, setValidationErrors] = useState<ValidationErrors>(
    {}
  );

  // Reported tenants
  const [reportedTenants, setReportedTenants] = useState<Tenant[]>([]);
  const [isTenantsLoading, setIsTenantsLoading] = useState(false);
  const [tenantsError, setTenantsError] = useState("");

  // API user profile (authoritative)
  const [profile, setProfile] = useState<UserProfileType | null>(null);
  const [isProfileLoading, setIsProfileLoading] = useState(false);

  // Password change states
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmNewPassword, setShowConfirmNewPassword] = useState(false);
  const [isPasswordLoading, setIsPasswordLoading] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState("");
  const [passwordError, setPasswordError] = useState("");

  // Initialize form data when user data is available
  useEffect(() => {
    const loadProfile = async () => {
      if (!user?.id) return;
      setIsProfileLoading(true);
      try {
        const p = await UserService.getUserProfile(user.id);
        setProfile(p);
        setReportedTenants(p.tenants || []);
        setName(p.name || "");
        setSurname(p.surname || "");
        setCity(p.city || "");
        setCountry(p.country || "");
      } catch (e) {
        // fallback to cookie user
        if (user) {
          setName(user.name || "");
          setSurname(user.surname || "");
          setCity(user.city || "");
          setCountry(user.country || "");
        }
      } finally {
        setIsProfileLoading(false);
      }
    };
    loadProfile();
  }, [user?.id]);

  // If profile is separately requested for tenants
  useEffect(() => {
    if (reportedTenants.length > 0 || !user?.id) return;
    const fetchTenants = async () => {
      setIsTenantsLoading(true);
      setTenantsError("");
      try {
        const p = await UserService.getUserProfile(user.id!);
        setReportedTenants(p.tenants || []);
      } catch (err) {
        setTenantsError(getErrorMessage(err, t, "profile.loadTenantsFailed"));
      } finally {
        setIsTenantsLoading(false);
      }
    };
    fetchTenants();
  }, [user?.id]);

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setMessage("");
    setValidationErrors({});

    // Validate form data
    const errors: ValidationErrors = {};
    errors.name = validateName(name, t);
    errors.surname = validateSurname(surname, t);
    errors.city = validateCity(city, t);
    errors.country = validateCountry(country, t);

    setValidationErrors(errors);

    if (Object.values(errors).some((error) => error !== undefined)) {
      return;
    }

    if (!user?.id) {
      setError(t("profile.userIdNotFound"));
      return;
    }

    setIsLoading(true);

    try {
      // Only these fields are accepted by PUT /users/:id
      const updateData: UpdateUserData = {
        name,
        surname,
        city,
        country,
      };

      const updatedUser = await UserService.updateProfile(user.id, updateData);
      setMessage(t("profile.profileUpdated"));
      setIsEditing(false);

      // Update the user context with new data
      // Note: You might need to add a method to update user context
    } catch (err) {
      // Covers email_already_exists (409) and request_body_validation (400)
      setError(getErrorMessage(err, t, "profile.updateFailed"));
    } finally {
      setIsLoading(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError("");
    setPasswordMessage("");

    if (newPassword !== confirmPassword) {
      setPasswordError(t("profile.passwordsNotMatch"));
      return;
    }

    if (newPassword.length < 8) {
      setPasswordError(t("profile.passwordTooShort"));
      return;
    }

    setIsPasswordLoading(true);

    try {
      await AuthService.changePassword(currentPassword, newPassword);
      setPasswordMessage(t("profile.passwordChanged"));
      setShowChangePassword(false);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err) {
      // A wrong current password is a 401 invalid_credentials; it must not end the session
      if (err instanceof ApiError && err.code === "invalid_credentials") {
        setPasswordError(t("profile.currentPasswordIncorrect"));
      } else {
        setPasswordError(
          getErrorMessage(err, t, "profile.changePasswordFailed")
        );
      }
    } finally {
      setIsPasswordLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    router.push("/");
  };

  const handleDeleteAccount = async () => {
    if (!user?.id) return;

    if (!confirm(t("profile.deleteAccountConfirm"))) {
      return;
    }

    try {
      await UserService.deleteAccount(user.id);
      logout();
      router.push("/");
    } catch (err) {
      setError(getErrorMessage(err, t, "profile.deleteAccountFailed"));
    }
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-700 mb-4">
            {t("profile.userNotFound")}
          </h1>
          <Button text={t("profile.goHome")} onClick={() => router.push("/")} />
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100 pt-32">
      <div className="w-full max-w-4xl mx-auto bg-white rounded-lg shadow-md">
        <div className="bg-orange text-white rounded-t-lg">
          <h1 className="text-xl text-center font-bold mb-6 py-4">
            {t("profile.title")}
          </h1>
        </div>

        <div className="p-6">
          {isProfileLoading && (
            <div className="mb-4 p-3 bg-gray-50 border border-gray-200 text-gray-600 rounded">
              {t("profile.loadingProfile")}
            </div>
          )}
          {message && (
            <div className="mb-4 p-3 bg-green-100 border border-green-400 text-green-700 rounded">
              {message}
            </div>
          )}

          {error && (
            <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
              {error}
            </div>
          )}

          {passwordMessage && (
            <div className="mb-4 p-3 bg-green-100 border border-green-400 text-green-700 rounded">
              {passwordMessage}
            </div>
          )}

          {passwordError && (
            <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
              {passwordError}
            </div>
          )}

          {/* Profile Information */}
          <div className="mb-8">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold">
                {t("profile.profileInformation")}
              </h2>
              <Button
                text={
                  isEditing ? t("profile.cancel") : t("profile.editProfile")
                }
                onClick={() => setIsEditing(!isEditing)}
                variant={isEditing ? "secondary" : "primary"}
              />
            </div>

            {!isEditing ? (
              // Display mode
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-gray-700 text-sm font-bold mb-2">
                    {t("profile.emailAddress")}
                  </label>
                  <p className="text-gray-900 bg-orange-50 border border-orange-200 p-2 rounded">
                    {profile?.email || user.email}
                  </p>
                </div>
                <div>
                  <label className="block text-gray-700 text-sm font-bold mb-2">
                    {t("profile.memberSince")}
                  </label>
                  <p className="text-gray-900 bg-sky-50 border border-sky-200 p-2 rounded">
                    {formatDateDMY(
                      profile?.createdAt || (user.createdAt as any)
                    ) || t("profile.notAvailable")}
                  </p>
                </div>
                <div>
                  <label className="block text-gray-700 text-sm font-bold mb-2">
                    {t("profile.name")}
                  </label>
                  <p className="text-gray-900 bg-emerald-50 border border-emerald-200 p-2 rounded">
                    {profile?.name || user.name || "-"}
                  </p>
                </div>
                <div>
                  <label className="block text-gray-700 text-sm font-bold mb-2">
                    {t("profile.surname")}
                  </label>
                  <p className="text-gray-900 bg-violet-50 border border-violet-200 p-2 rounded">
                    {profile?.surname || user.surname || "-"}
                  </p>
                </div>
                <div>
                  <label className="block text-gray-700 text-sm font-bold mb-2">
                    {t("profile.city")}
                  </label>
                  <p className="text-gray-900 bg-amber-50 border border-amber-200 p-2 rounded">
                    {profile?.city || user.city || "-"}
                  </p>
                </div>
                <div>
                  <label className="block text-gray-700 text-sm font-bold mb-2">
                    {t("profile.country")}
                  </label>
                  <p className="text-gray-900 bg-rose-50 border border-rose-200 p-2 rounded">
                    {profile?.country || user.country || "-"}
                  </p>
                </div>
              </div>
            ) : (
              // Edit mode
              <form onSubmit={handleProfileUpdate}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-gray-700 text-sm font-bold mb-2">
                      {t("profile.name")}
                    </label>
                    <input
                      className={`shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline ${
                        validationErrors.name ? "border-red-500" : ""
                      }`}
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                    />
                    {validationErrors.name && (
                      <p className="text-red-500 text-xs mt-1">
                        {validationErrors.name}
                      </p>
                    )}
                  </div>
                  <div>
                    <label className="block text-gray-700 text-sm font-bold mb-2">
                      {t("profile.surname")}
                    </label>
                    <input
                      className={`shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline ${
                        validationErrors.surname ? "border-red-500" : ""
                      }`}
                      type="text"
                      value={surname}
                      onChange={(e) => setSurname(e.target.value)}
                      required
                    />
                    {validationErrors.surname && (
                      <p className="text-red-500 text-xs mt-1">
                        {validationErrors.surname}
                      </p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                  <LocationAutocomplete
                    value={city}
                    onChange={setCity}
                    placeholder={t("profile.enterCity")}
                    label={t("profile.city")}
                    error={validationErrors.city}
                  />
                  <LocationAutocomplete
                    value={country}
                    onChange={setCountry}
                    placeholder={t("profile.enterCountry")}
                    label={t("profile.country")}
                    error={validationErrors.country}
                  />
                </div>

                <div className="flex gap-2">
                  <Button
                    type="submit"
                    isLoading={isLoading}
                    disabled={isLoading}
                    text={
                      isLoading ? t("profile.saving") : t("profile.saveChanges")
                    }
                  />
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => setIsEditing(false)}
                    text={t("profile.cancel")}
                  />
                </div>
              </form>
            )}
          </div>

          {/* Reported Tenants */}
          <div className="mb-8">
            <h2 className="text-lg font-semibold mb-4">
              {t("profile.reportedTenants")}
            </h2>
            {isTenantsLoading && (
              <div className="text-gray-500 text-sm">
                {t("profile.loadingTenants")}
              </div>
            )}
            {tenantsError && (
              <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
                {tenantsError}
              </div>
            )}
            {!isTenantsLoading && !tenantsError && (
              <div className="overflow-hidden rounded-lg ring-1 ring-gray-200">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        {t("profile.name")}
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        {t("profile.dateOfBirth")}
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        {t("profile.city")}
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        {t("profile.country")}
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        {t("profile.violation")}
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        {t("profile.reportedAt")}
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white">
                    {reportedTenants.length === 0 ? (
                      <tr>
                        <td
                          className="px-4 py-3 text-gray-500 text-sm"
                          colSpan={6}
                        >
                          {t("profile.noTenantsReported")}
                        </td>
                      </tr>
                    ) : (
                      reportedTenants.map((tenant) => (
                        <tr
                          key={tenant.id}
                          className="group hover:bg-orange hover:outline hover:outline-2 hover:outline-orange border-b border-gray-200 hover:border-orange cursor-pointer transition-colors"
                          onClick={() => router.push(`/tenant/${tenant.id}`)}
                        >
                          <td className="px-4 py-3 text-sm text-gray-900 group-hover:text-white">
                            {tenant.name} {tenant.surname}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-700 group-hover:text-white">
                            {formatDateDMY(tenant.dateOfBirth as any) || "-"}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-700 group-hover:text-white">
                            {tenant.city}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-700 group-hover:text-white">
                            {tenant.country}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-700 group-hover:text-white">
                            {translateViolationType(tenant.violationType, t)}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-500 group-hover:text-white">
                            {formatDateDMY((tenant as any).createdAt) || "-"}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Security Section */}
          <div className="mb-8">
            <h2 className="text-lg font-semibold mb-4">
              {t("profile.security")}
            </h2>
            <Button
              onClick={() => setShowChangePassword(!showChangePassword)}
              text={
                showChangePassword
                  ? t("profile.cancel")
                  : t("profile.changePassword")
              }
            />

            {showChangePassword && (
              <form onSubmit={handleChangePassword} className="mt-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-gray-700 text-sm font-bold mb-2">
                      {t("profile.currentPassword")}
                    </label>
                    <div className="relative">
                      <input
                        className="shadow appearance-none border rounded w-full py-2 px-3 pr-10 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                        type={showCurrentPassword ? "text" : "password"}
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        required
                      />
                      <Button
                        type="button"
                        variant="icon"
                        className="absolute inset-y-0 right-0 flex items-center px-3"
                        onClick={() =>
                          setShowCurrentPassword(!showCurrentPassword)
                        }
                      >
                        {showCurrentPassword ? (
                          <AiOutlineEyeInvisible size={20} />
                        ) : (
                          <AiOutlineEye size={20} />
                        )}
                      </Button>
                    </div>
                  </div>
                  <div>
                    <label className="block text-gray-700 text-sm font-bold mb-2">
                      {t("profile.newPassword")}
                    </label>
                    <div className="relative">
                      <input
                        className="shadow appearance-none border rounded w-full py-2 px-3 pr-10 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                        type={showNewPassword ? "text" : "password"}
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        required
                      />
                      <Button
                        type="button"
                        variant="icon"
                        className="absolute inset-y-0 right-0 flex items-center px-3"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                      >
                        {showNewPassword ? (
                          <AiOutlineEyeInvisible size={20} />
                        ) : (
                          <AiOutlineEye size={20} />
                        )}
                      </Button>
                    </div>
                  </div>
                </div>

                <div className="mt-4">
                  <label className="block text-gray-700 text-sm font-bold mb-2">
                    {t("profile.confirmNewPassword")}
                  </label>
                  <div className="relative">
                    <input
                      className="shadow appearance-none border rounded w-full py-2 px-3 pr-10 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                      type={showConfirmNewPassword ? "text" : "password"}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                    />
                    <Button
                      type="button"
                      variant="icon"
                      className="absolute inset-y-0 right-0 flex items-center px-3"
                      onClick={() =>
                        setShowConfirmNewPassword(!showConfirmNewPassword)
                      }
                    >
                      {showConfirmNewPassword ? (
                        <AiOutlineEyeInvisible size={20} />
                      ) : (
                        <AiOutlineEye size={20} />
                      )}
                    </Button>
                  </div>
                </div>

                <div className="mt-4">
                  <Button
                    type="submit"
                    isLoading={isPasswordLoading}
                    disabled={isPasswordLoading}
                    text={
                      isPasswordLoading
                        ? t("profile.changingPassword")
                        : t("profile.changePassword")
                    }
                  />
                </div>
              </form>
            )}
          </div>

          {/* Account Actions */}
          <div className="border-t pt-6">
            <h2 className="text-lg font-semibold mb-4">
              {t("profile.accountActions")}
            </h2>
            <div className="flex flex-col sm:flex-row gap-2">
              <Button
                onClick={handleLogout}
                text={t("profile.logout")}
                buttonType="warning"
              />
              <Button
                onClick={handleDeleteAccount}
                text={t("profile.deleteAccount")}
                buttonType="danger"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
