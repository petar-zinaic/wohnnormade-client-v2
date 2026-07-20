"use client";

import { useTranslation } from "react-i18next";
import { SearchTenant } from "@/components/common";
import ProtectedRoute from "@/components/auth/ProtectedRoute";

export default function Search() {
  const { t } = useTranslation();

  return (
    <ProtectedRoute message={t("search.authMessage")}>
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 px-4 pt-20">
        <h1 className="text-3xl sm:text-4xl font-bold mb-1 text-center">
          {t("search.title")}{" "}
          <span className="text-orange">{t("search.titleSpan")}</span>
        </h1>
        <SearchTenant />
      </div>
    </ProtectedRoute>
  );
}
