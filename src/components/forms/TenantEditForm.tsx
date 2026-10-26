"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useTranslation } from "react-i18next";
import { Button, LocationAutocomplete } from "@/components/common";
import DatePicker from "react-datepicker";
import { useTenant } from "@/context/TenantContext";
import { useAuth } from "@/context/AuthContext";
import type { CreateTenantData, Tenant } from "@/types";
import { ViolationType } from "@/types";
import { formatDateDMY } from "@/utils/date";
import { translateViolationType } from "@/utils/violationTypeTranslation";
import { getErrorMessage } from "@/utils/api";

interface Props {
  tenantId: number;
}

export default function TenantEditForm({ tenantId }: Props) {
  const router = useRouter();
  const { t } = useTranslation();
  const { getTenantById, updateTenant, deleteTenant, isLoading } = useTenant();
  const { user } = useAuth();

  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [name, setName] = useState("");
  const [surname, setSurname] = useState("");
  const [city, setCity] = useState("");
  const [country, setCountry] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState<Date | null>(null);
  const [violationType, setViolationType] = useState<ViolationType | "">("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState("");
  const [loadError, setLoadError] = useState("");
  const [message, setMessage] = useState("");
  const [hasChanges, setHasChanges] = useState(false);
  const [showSaveButton, setShowSaveButton] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const loaded = await getTenantById(tenantId);
        setTenant(loaded);
        setName(loaded.name || "");
        setSurname(loaded.surname || "");
        setCity(loaded.city || "");
        setCountry(loaded.country || "");
        setViolationType((loaded.violationType as ViolationType) || "");
        setDescription(loaded.description || "");
        setDateOfBirth(loaded.dateOfBirth ? new Date(loaded.dateOfBirth) : null);
        setHasChanges(false);
        setShowSaveButton(false);
      } catch (err) {
        setLoadError(getErrorMessage(err, t, "editTenant.loadError"));
      }
    };
    load();
  }, [tenantId]);

  // Track changes to detect if form has been modified
  useEffect(() => {
    if (!tenant) return;

    const originalDate = tenant.dateOfBirth
      ? new Date(tenant.dateOfBirth)
      : null;
    const hasDateChanged =
      dateOfBirth && originalDate
        ? dateOfBirth.getTime() !== originalDate.getTime()
        : dateOfBirth !== originalDate;

    const hasChanges =
      name !== (tenant.name || "") ||
      surname !== (tenant.surname || "") ||
      city !== (tenant.city || "") ||
      country !== (tenant.country || "") ||
      violationType !== (tenant.violationType || "") ||
      description !== (tenant.description || "") ||
      hasDateChanged;

    setHasChanges(hasChanges);

    if (hasChanges) {
      setShowSaveButton(true);
    } else {
      setShowSaveButton(false);
    }
  }, [
    name,
    surname,
    city,
    country,
    violationType,
    description,
    dateOfBirth,
    tenant,
  ]);

  const toUtcMidnightIso = (d: Date | null): string | undefined => {
    if (!d) return undefined;
    const utc = new Date(
      Date.UTC(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0, 0)
    );
    return utc.toISOString();
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setMessage("");
    try {
      const payload: Partial<CreateTenantData> = {
        name,
        surname,
        city,
        country,
        violationType: violationType as ViolationType,
        description,
        dateOfBirth: toUtcMidnightIso(dateOfBirth),
      };
      await updateTenant(tenantId, payload);
      setMessage(t("editTenant.updateSuccess"));
      // Redirect to profile after successful update
      setTimeout(() => {
        router.push("/profile");
      }, 1500);
    } catch (err) {
      setError(getErrorMessage(err, t, "editTenant.updateError"));
    }
  };

  const handleDelete = async () => {
    if (!confirm(t("editTenant.deleteConfirm"))) return;
    setError("");
    try {
      await deleteTenant(tenantId);
      router.push("/profile");
    } catch (err) {
      setError(getErrorMessage(err, t, "editTenant.deleteError"));
    }
  };

  // Only the reporter may edit or delete a tenant (the API answers 403 otherwise)
  const notice = loadError
    ? loadError
    : tenant && user && tenant.createdById !== user.id
      ? t("editTenant.notOwner")
      : "";

  if (notice) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100 pt-32 pb-8">
        <div className="w-full max-w-3xl mx-auto bg-white rounded-lg shadow-md">
          <div className="bg-orange text-white rounded-t-lg">
            <h1 className="text-xl text-center font-bold mb-6 py-2">
              {t("editTenant.title")}
            </h1>
          </div>
          <div className="p-6">
            <div className="mb-4 p-2 bg-red-100 border border-red-300 text-red-800 rounded">
              {notice}
            </div>
            <Link
              href="/profile"
              className="text-orange hover:text-orangeDark text-sm font-semibold"
            >
              {t("editTenant.backToProfile")}
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100 pt-32 pb-8">
      <div className="w-full max-w-3xl mx-auto bg-white rounded-lg shadow-md">
        <div className="bg-orange text-white rounded-t-lg">
          <h1 className="text-xl text-center font-bold mb-6 py-2">
            {t("editTenant.title")}
          </h1>
        </div>
        <form className="p-6" onSubmit={handleUpdate}>
          {message && (
            <div className="mb-3 p-2 bg-green-100 border border-green-300 text-green-800 rounded">
              {message}
            </div>
          )}
          {error && (
            <div className="mb-3 p-2 bg-red-100 border border-red-300 text-red-800 rounded">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-bold mb-2">
                {t("editTenant.tenantName")}
              </label>
              <input
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-bold mb-2">
                {t("editTenant.tenantSurname")}
              </label>
              <input
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                type="text"
                value={surname}
                onChange={(e) => setSurname(e.target.value)}
              />
            </div>

            <LocationAutocomplete
              value={city}
              onChange={setCity}
              placeholder={t("editTenant.enterCity")}
              label={t("editTenant.city")}
            />
            <LocationAutocomplete
              value={country}
              onChange={setCountry}
              placeholder={t("editTenant.enterCountry")}
              label={t("editTenant.country")}
            />

            <div className="mb-4 col-span-1">
              <label className="block text-gray-700 text-sm font-bold mb-2">
                {t("editTenant.dateOfBirth")}
              </label>
              <DatePicker
                selected={dateOfBirth}
                onChange={(d) => setDateOfBirth(d)}
                dateFormat="dd/MM/yyyy"
                placeholderText={t("editTenant.selectDateOfBirth")}
                className="shadow appearance-none border rounded w-full h-10 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                maxDate={new Date()}
                showMonthDropdown
                showYearDropdown
                dropdownMode="select"
                isClearable
              />
            </div>

            <div className="mb-4 col-span-1">
              <label className="block text-gray-700 text-sm font-bold mb-2">
                {t("editTenant.violationType")}
              </label>
              <select
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                value={violationType}
                onChange={(e) =>
                  setViolationType(e.target.value as ViolationType)
                }
              >
                <option value="" disabled>
                  {t("editTenant.selectViolationType")}
                </option>
                <option value={ViolationType.RentNotPaid}>
                  {translateViolationType(ViolationType.RentNotPaid, t)}
                </option>
                <option value={ViolationType.PropertyWrecked}>
                  {translateViolationType(ViolationType.PropertyWrecked, t)}
                </option>
              </select>
            </div>

            <div className="mb-4 col-span-1 md:col-span-2">
              <label className="block text-gray-700 text-sm font-bold mb-2">
                {t("editTenant.description")}
              </label>
              <textarea
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>
          </div>

          <div className="flex items-center justify-between gap-2 mt-6">
            <Button
              type="button"
              variant="secondary"
              className="hover:bg-orange hover:text-white transition-colors"
              onClick={() => router.push("/profile")}
              text={t("editTenant.backToProfile")}
            />
            <div className="flex gap-2">
              {showSaveButton && (
                <Button
                  type="submit"
                  isLoading={isLoading}
                  disabled={isLoading}
                  text={
                    isLoading ? t("editTenant.saving") : t("editTenant.save")
                  }
                />
              )}
              <Button
                buttonType="danger"
                type="button"
                onClick={handleDelete}
                text={t("editTenant.delete")}
              />
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
