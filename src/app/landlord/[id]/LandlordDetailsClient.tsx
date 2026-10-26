"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import UserService, { UserProfile } from "@/services/user";
import { Tenant } from "@/types/tenant";
import Button from "@/components/common/Button";
import UserAvatarIcon from "@/components/icons/UserAvatarIcon";
import { translateViolationType } from "@/utils/violationTypeTranslation";
import { getErrorMessage } from "@/utils/api";

export default function LandlordDetailsPage() {
  return (
    <ProtectedRoute>
      <LandlordDetailsContent />
    </ProtectedRoute>
  );
}

function LandlordDetailsContent() {
  const params = useParams();
  const router = useRouter();
  const { t } = useTranslation();
  const [landlord, setLandlord] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const landlordId = Number(params.id);

  useEffect(() => {
    if (!landlordId || isNaN(landlordId)) {
      setError(t("landlordDetails.invalidId"));
      setIsLoading(false);
      return;
    }

    fetchLandlordDetails();
  }, [landlordId]);

  const fetchLandlordDetails = async () => {
    try {
      setIsLoading(true);
      setError("");
      const data = await UserService.getUserProfile(landlordId);
      setLandlord(data);
    } catch (err) {
      setError(getErrorMessage(err, t, "landlordDetails.loadError"));
    } finally {
      setIsLoading(false);
    }
  };

  const getBadgeClasses = (type: string) => {
    const t = (type || "").toLowerCase();
    if (t.includes("rent"))
      return "bg-yellow-100 text-yellow-800 ring-yellow-200";
    return "bg-rose-100 text-rose-800 ring-rose-200";
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <p className="text-gray-600">{t("landlordDetails.loading")}</p>
      </div>
    );
  }

  if (error || !landlord) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50 px-4">
        <div className="text-center max-w-md">
          <div className="mb-6">
            <div className="text-6xl mb-4">❌</div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              {t("landlordDetails.errorTitle")}
            </h2>
            <p className="text-gray-600">
              {error || t("landlordDetails.loadError")}
            </p>
          </div>
          <Button variant="primary" onClick={() => router.back()}>
            {t("landlordDetails.goBack")}
          </Button>
        </div>
      </div>
    );
  }

  const landlordInitials = `${landlord.name?.[0] || ""}${
    landlord.surname?.[0] || ""
  }`.toUpperCase();
  const memberSince = landlord.createdAt
    ? new Date(landlord.createdAt).toLocaleDateString()
    : "-";

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50 pt-32 pb-20 px-4">
      <div className="relative w-full max-w-4xl mx-auto overflow-hidden rounded-2xl bg-white shadow-xl">
        {/* Header */}
        <div className="bg-gradient-to-r from-blueLight to-blueDark text-white px-8 py-8">
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.back()}
            className="mb-4 bg-white/10 hover:bg-white/20 text-white border-white/30"
          >
            <span className="mr-2">←</span>
            {t("landlordDetails.goBack")}
          </Button>
          <div className="flex items-center gap-6">
            <div className="h-20 w-20 flex items-center justify-center rounded-full bg-white/20 backdrop-blur text-white shadow-lg text-2xl font-bold">
              {landlordInitials}
            </div>
            <div className="flex-1">
              <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight">
                {landlord.name} {landlord.surname}
              </h1>
              <p className="text-white/80 mt-1">
                {t("landlordDetails.landlord")}
              </p>
            </div>
          </div>
        </div>

        {/* Details */}
        <div className="px-8 py-8">
          <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
            <span className="text-orange">📋</span>
            {t("landlordDetails.information")}
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div className="p-4 bg-gray-50 rounded-lg">
              <div className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-2">
                {t("landlordDetails.email")}
              </div>
              <div className="text-gray-900 font-medium">{landlord.email}</div>
            </div>
            <div className="p-4 bg-gray-50 rounded-lg">
              <div className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-2">
                {t("landlordDetails.memberSince")}
              </div>
              <div className="text-gray-900 font-medium">{memberSince}</div>
            </div>
            <div className="p-4 bg-gray-50 rounded-lg">
              <div className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-2">
                {t("landlordDetails.city")}
              </div>
              <div className="text-gray-900 font-medium">
                {landlord.city || "-"}
              </div>
            </div>
            <div className="p-4 bg-gray-50 rounded-lg">
              <div className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-2">
                {t("landlordDetails.country")}
              </div>
              <div className="text-gray-900 font-medium">
                {landlord.country || "-"}
              </div>
            </div>
          </div>

          {/* Reported Tenants */}
          {landlord.tenants && landlord.tenants.length > 0 && (
            <div className="border-t pt-8">
              <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                <span className="text-orange">👥</span>
                {t("landlordDetails.reportedTenants")} (
                {landlord.tenants.length})
              </h2>
              <div className="grid grid-cols-1 gap-4">
                {landlord.tenants.map((tenant: Tenant) => (
                  <div
                    key={tenant.id}
                    onClick={() => {
                      const tenantData = {
                        ...tenant,
                        createdBy: {
                          id: landlord.id,
                          name: landlord.name,
                          surname: landlord.surname,
                          email: landlord.email,
                        },
                      };
                      const queryString = `tenant=${encodeURIComponent(
                        JSON.stringify(tenantData)
                      )}`;
                      router.push(`/tenant-preview?${queryString}`);
                    }}
                    className="p-4 border border-gray-200 rounded-lg hover:shadow-lg hover:border-orange transition-all bg-white cursor-pointer"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-4 flex-1">
                        <div className="h-12 w-12 flex items-center justify-center rounded-full bg-orange/10 text-orange shadow-sm">
                          <UserAvatarIcon className="h-6 w-6" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="font-bold text-gray-900 text-lg group-hover:text-orange transition-colors">
                              {tenant.name} {tenant.surname}
                            </h3>
                            {tenant.violationType && (
                              <span
                                className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ring-1 ${getBadgeClasses(
                                  tenant.violationType
                                )}`}
                              >
                                {translateViolationType(
                                  tenant.violationType,
                                  t
                                )}
                              </span>
                            )}
                          </div>
                          <div className="mt-2 text-sm text-gray-600">
                            <span className="font-medium">
                              {tenant.city}, {tenant.country}
                            </span>
                          </div>
                          {tenant.description && (
                            <p className="mt-2 text-sm text-gray-700 line-clamp-2">
                              {tenant.description}
                            </p>
                          )}
                          {tenant.createdAt && (
                            <p className="mt-2 text-xs text-gray-500">
                              {t("landlordDetails.reportedAt")}{" "}
                              {new Date(tenant.createdAt).toLocaleDateString()}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="text-orange text-xl">→</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {(!landlord.tenants || landlord.tenants.length === 0) && (
            <div className="border-t pt-8">
              <div className="text-center py-8">
                <div className="text-5xl mb-4">📭</div>
                <p className="text-gray-600">
                  {t("landlordDetails.noReportedTenants")}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
