"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/context/AuthContext";
import UserAvatarIcon from "@/components/icons/UserAvatarIcon";
import { translateViolationType } from "@/utils/violationTypeTranslation";
import { ContactReporterModal } from "@/components/forms";
import { downloadTenantPdf } from "@/utils/tenantPdf";

export default function TenantPreview() {
  const { t } = useTranslation();
  const router = useRouter();
  const { user } = useAuth();
  const [tenant, setTenant] = useState<any>(null);
  const [isContactModalOpen, setIsContactModalOpen] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const tenantDataString = params.get("tenant");

    if (tenantDataString) {
      try {
        const tenantData = JSON.parse(decodeURIComponent(tenantDataString));
        setTenant(tenantData);
      } catch (error) {
        console.error("Failed to parse tenant data:", error);
      }
    }
  }, []);

  if (!tenant) return <p>{t("tenantPreview.loading")}</p>;

  const name = tenant.name || tenant.tenantName;
  const surname = tenant.surname || tenant.tenantSurname;
  const city = tenant.city;
  const country = tenant.country;
  const dateOfBirth = tenant.dateOfBirth
    ? new Date(tenant.dateOfBirth).toLocaleDateString()
    : undefined;
  const violationType = tenant.violationType;
  const description = tenant.description;
  const createdAt = tenant.createdAt
    ? new Date(tenant.createdAt).toLocaleString()
    : undefined;
  const reporter = tenant.createdBy || null;
  const reporterName = reporter
    ? `${(reporter.name || "").trim()} ${reporter.surname || ""}`.trim()
    : undefined;
  const reporterEmail = reporter?.email;
  const reporterInitials = reporterName
    ? `${reporter.name?.[0] || ""}${reporter.surname?.[0] || ""}`.toUpperCase()
    : "?";

  const isCurrentUserReporter = user && reporter && user.id === reporter.id;

  const getBadgeClasses = (type: string) => {
    const normalized = (type || "").toLowerCase();
    if (normalized.includes("rent"))
      return "bg-yellow-100 text-yellow-800 ring-yellow-200";
    return "bg-rose-100 text-rose-800 ring-rose-200";
  };

  const handleDownloadPdf = () => {
    downloadTenantPdf(
      {
        fullName: `${name || ""} ${surname || ""}`.trim(),
        dateOfBirth,
        city,
        country,
        violationType: violationType
          ? translateViolationType(violationType, t)
          : undefined,
        description,
        reportedAt: createdAt,
        reporterName,
        reporterEmail,
        fileName: `tenant-${(name || "unknown").toLowerCase()}-${(surname || "").toLowerCase()}.pdf`,
      },
      {
        title: t("tenantPreview.title"),
        reportedAt: t("tenantPreview.reportedAt"),
        fullName: t("tenantPreview.fullName"),
        dateOfBirth: t("tenantPreview.dateOfBirth"),
        city: t("tenantPreview.city"),
        country: t("tenantPreview.country"),
        violationType: t("tenantPreview.violationType"),
        description: t("tenantPreview.description"),
        reporter: t("tenantPreview.reporter"),
        email: t("tenantPreview.email"),
        generatedOn: t("tenantPreview.generatedOn"),
      }
    );
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <div className="relative w-full max-w-3xl mx-auto overflow-hidden rounded-2xl bg-white/90 shadow-xl ring-1 ring-gray-100 backdrop-blur">
        <div className="px-8 py-8">
          <div className="mb-6 flex items-center gap-4">
            <div className="h-12 w-12 flex items-center justify-center rounded-full bg-orange text-white shadow-md">
              <UserAvatarIcon className="h-7 w-7" />
            </div>
            <div className="flex-1">
              <h1 className="text-2xl md:text-3xl font-extrabold text-gray-900 tracking-tight">
                {t("tenantPreview.title")}
              </h1>
              {createdAt && (
                <p className="text-sm text-gray-500">
                  {t("tenantPreview.reportedAt")} {createdAt}
                </p>
              )}
            </div>
            {violationType && (
              <span
                className={`inline-flex items-center rounded-full px-3 py-1 text-sm font-medium ring-1 ${getBadgeClasses(
                  violationType
                )}`}
              >
                {translateViolationType(violationType, t)}
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <div className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                {t("tenantPreview.fullName")}
              </div>
              <div className="mt-1 text-gray-900">
                {name} {surname}
              </div>
            </div>
            <div>
              <div className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                {t("tenantPreview.dateOfBirth")}
              </div>
              <div className="mt-1 text-gray-900">{dateOfBirth || "-"}</div>
            </div>
            <div>
              <div className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                {t("tenantPreview.city")}
              </div>
              <div className="mt-1 text-gray-900">{city}</div>
            </div>
            <div>
              <div className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                {t("tenantPreview.country")}
              </div>
              <div className="mt-1 text-gray-900">{country}</div>
            </div>
            <div className="md:col-span-2">
              <div className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                {t("tenantPreview.description")}
              </div>
              <div className="mt-1 text-gray-900 leading-relaxed">
                {description}
              </div>
            </div>
          </div>

          <div className="mt-8 border-t pt-6">
            <div className="flex items-center gap-4 justify-between flex-wrap">
              <div className="flex items-center gap-4">
                <div className="h-10 w-10 flex items-center justify-center rounded-full bg-gray-100 text-gray-700 font-semibold">
                  {reporterInitials}
                </div>
                <div>
                  <div className="text-sm font-medium text-gray-900 flex items-center gap-2">
                    {reporter && reporter.id ? (
                      <button
                        onClick={() => router.push(`/landlord/${reporter.id}`)}
                        className="text-blueLight hover:text-orange font-semibold hover:underline transition-colors"
                      >
                        {reporterName || t("tenantPreview.unknownReporter")}
                      </button>
                    ) : (
                      <span>
                        {reporterName || t("tenantPreview.unknownReporter")}
                      </span>
                    )}
                    {reporter && (
                      <span className="inline-flex items-center rounded-full border border-gray-300 px-2 py-0.5 text-[11px] font-medium text-gray-700">
                        {t("tenantPreview.landlord")}
                      </span>
                    )}
                  </div>
                  {reporterEmail && (
                    <div className="text-sm text-gray-500">{reporterEmail}</div>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleDownloadPdf}
                  className="px-4 py-2 bg-blueLight text-white rounded-lg hover:bg-blueDark transition-colors text-sm font-medium shadow-sm"
                >
                  {t("tenantPreview.downloadPdf")}
                </button>
                {reporter && !isCurrentUserReporter && (
                  <button
                    onClick={() => setIsContactModalOpen(true)}
                    className="px-4 py-2 bg-orange text-white rounded-lg hover:bg-orange-600 transition-colors text-sm font-medium shadow-sm"
                  >
                    {t("tenantPreview.contactReporter")}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {isContactModalOpen && reporter && (
        <ContactReporterModal
          tenant={tenant}
          reporter={reporter}
          onClose={() => setIsContactModalOpen(false)}
        />
      )}
    </div>
  );
}
