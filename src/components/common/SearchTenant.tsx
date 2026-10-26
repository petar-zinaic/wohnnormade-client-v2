"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";
import DatePicker from "react-datepicker";
import { TenantService } from "@/services";
import type { Tenant } from "@/types";
import { translateViolationType } from "@/utils/violationTypeTranslation";
import { getErrorMessage } from "@/utils/api";

export default function SearchTenant() {
  const { t } = useTranslation();
  const [searchTerm, setSearchTerm] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState<Date | null>(null);
  const [suggestions, setSuggestions] = useState<Tenant[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [hasSearched, setHasSearched] = useState(false);
  const router = useRouter();

  const formatDateToYYYYMMDD = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const handleSearch = async () => {
    if (searchTerm.trim().length < 2) {
      setError(t("search.placeholder"));
      return;
    }

    if (!dateOfBirth) {
      setError(t("search.dateOfBirthLabel") + " is required");
      return;
    }

    setIsLoading(true);
    setError("");
    setHasSearched(true);
    try {
      const formattedDate = formatDateToYYYYMMDD(dateOfBirth);
      const list = await TenantService.searchTenants(searchTerm, formattedDate);
      setSuggestions(Array.isArray(list) ? list : []);
    } catch (err) {
      setError(getErrorMessage(err, t, "search.searchError"));
      setSuggestions([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };

  const handleSelectTenant = (tenant: Tenant) => {
    router.push(
      `/tenant-preview?tenant=${encodeURIComponent(JSON.stringify(tenant))}`
    );
  };

  return (
    <div className="w-full max-w-xl p-4">
      <div className="space-y-3">
        <div className="relative">
          <input
            type="text"
            placeholder={t("search.placeholder")}
            className="w-full p-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-orange focus:border-orange"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyPress={handleKeyPress}
          />
        </div>
        <div className="relative">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {t("search.dateOfBirthLabel")} <span className="text-red-500">*</span>
          </label>
          <DatePicker
            selected={dateOfBirth}
            onChange={(d) => setDateOfBirth(d)}
            dateFormat="dd/MM/yyyy"
            placeholderText={t("search.dateOfBirthPlaceholder")}
            className="w-full p-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-orange focus:border-orange"
            maxDate={new Date()}
            showMonthDropdown
            showYearDropdown
            dropdownMode="select"
            isClearable
          />
        </div>
        <button
          onClick={handleSearch}
          disabled={isLoading}
          className="w-full p-3 bg-orange text-white rounded-lg shadow-sm hover:bg-orange-600 focus:outline-none focus:ring-2 focus:ring-orange focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isLoading ? t("search.loading") : t("search.searchButton")}
        </button>
      </div>
      {error && (
        <div className="mt-2 p-2 text-sm bg-red-50 border border-red-200 text-red-700 rounded">
          {error}
        </div>
      )}
      {suggestions.length > 0 && (
        <ul className="bg-white border mt-2 w-full rounded-lg shadow-lg max-h-72 overflow-y-auto">
          {suggestions.map((tenant) => (
            <li
              key={tenant.id}
              className="p-3 cursor-pointer hover:bg-orange hover:text-white transition-colors flex items-center justify-between"
              onClick={() => handleSelectTenant(tenant)}
            >
              <div>
                <div className="font-medium">
                  {tenant.name} {tenant.surname}
                </div>
                <div className="text-xs text-gray-500">
                  {tenant.city}, {tenant.country}
                </div>
              </div>
              <span className="text-xs text-gray-400">
                {translateViolationType(tenant.violationType, t)}
              </span>
            </li>
          ))}
        </ul>
      )}
      {!isLoading &&
        !error &&
        hasSearched &&
        suggestions.length === 0 && (
          <div className="bg-white border mt-2 w-full rounded-lg shadow-lg">
            <div className="p-3 flex items-center justify-center text-gray-500">
              {t("search.noResults")}
            </div>
          </div>
        )}
    </div>
  );
}
