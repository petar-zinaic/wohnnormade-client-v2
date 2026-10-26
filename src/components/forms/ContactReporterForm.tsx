"use client";

import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/context/AuthContext";
import CommunicationService from "@/services/communication";
import { getErrorMessage } from "@/utils/api";

interface ContactReporterModalProps {
  tenant: any;
  reporter: any;
  onClose: () => void;
}

export default function ContactReporterModal({
  tenant,
  reporter,
  onClose,
}: ContactReporterModalProps) {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) {
      setError(t("common.mustBeLoggedIn"));
      return;
    }

    if (message.trim().length < 20) {
      setError(t("contactReporter.minLength"));
      return;
    }

    setIsSubmitting(true);
    setError("");

    try {
      const { threadId } = await CommunicationService.contactReporter({
        tenantId: tenant.id,
        recipientId: reporter.id,
        message: message.trim(),
      });

      setSuccess(true);

      // Redirect to conversation thread after 2 seconds
      setTimeout(() => {
        window.location.href = `/communications/thread/${threadId}`;
      }, 2000);
    } catch (err) {
      setError(getErrorMessage(err, t, "common.errorSendingMessage"));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 p-6">
        <h2 className="text-xl font-bold mb-4 text-gray-900">
          {t("contactReporter.title")}
        </h2>

        {success ? (
          <div className="text-center py-8">
            <div className="text-green-600 text-5xl mb-4">✓</div>
            <p className="text-lg font-medium text-gray-900">
              {t("contactReporter.success")}
            </p>
            <p className="text-sm text-gray-500 mt-2">
              {t("contactReporter.redirecting")}
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <p className="text-sm text-gray-600 mb-2">
                <strong>{t("contactReporter.to")}:</strong> {reporter.name}{" "}
                {reporter.surname}
              </p>
              <p className="text-sm text-gray-600 mb-4">
                <strong>{t("contactReporter.regarding")}:</strong> {tenant.name}{" "}
                {tenant.surname}
              </p>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t("contactReporter.message")}
              </label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={6}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange focus:border-transparent resize-none"
                placeholder={t("contactReporter.messagePlaceholder")}
                required
                minLength={20}
              />
              <p className="text-xs text-gray-500 mt-1">
                {message.length} / 20 {t("contactReporter.minLength")}
              </p>
            </div>

            {error && (
              <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-lg text-sm">
                {error}
              </div>
            )}

            <div className="flex gap-3">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-gray-700 font-medium"
                disabled={isSubmitting}
              >
                {t("common.cancel")}
              </button>
              <button
                type="submit"
                className="flex-1 px-4 py-2 bg-orange text-white rounded-lg hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
                disabled={isSubmitting || message.trim().length < 20}
              >
                {isSubmitting ? t("common.sending") : t("common.send")}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
