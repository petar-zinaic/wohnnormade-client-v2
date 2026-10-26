"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/context/AuthContext";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import CommunicationService from "@/services/communication";
import type { ThreadResponse } from "@/services/communication";
import { getErrorMessage } from "@/utils/api";

export default function ConversationsPage() {
  return (
    <ProtectedRoute>
      <ConversationsPageContent />
    </ProtectedRoute>
  );
}

function ConversationsPageContent() {
  const router = useRouter();
  const { t } = useTranslation();
  const { user } = useAuth();
  const [conversations, setConversations] = useState<ThreadResponse[]>([]);
  const [error, setError] = useState("");
  const [isLoadingConversations, setIsLoadingConversations] = useState(true);

  useEffect(() => {
    fetchConversations();
  }, []);

  const fetchConversations = async () => {
    try {
      setIsLoadingConversations(true);
      setError("");
      setConversations(await CommunicationService.getMyConversations());
    } catch (err) {
      setError(getErrorMessage(err, t, "communications.failedToLoad"));
    } finally {
      setIsLoadingConversations(false);
    }
  };

  if (isLoadingConversations) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <p className="text-gray-600">
          {t("communications.loadingConversations")}
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pt-24 sm:pt-28 pb-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            {t("communications.title")}
          </h1>
          <p className="text-gray-600 mt-2">
            {t("communications.aboutTenant")} {conversations.length}{" "}
            {conversations.length === 1 ? "conversation" : "conversations"}
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 text-red-600 rounded-lg">
            {error}
          </div>
        )}

        {/* Conversations List */}
        {conversations.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm p-12 text-center">
            <div className="text-gray-400 text-5xl mb-4">💬</div>
            <p className="text-gray-600 text-lg mb-2">
              {t("communications.noConversations")}
            </p>
            <p className="text-gray-500 text-sm mb-6">
              Start a conversation by contacting a landlord from a tenant
              report.
            </p>
            <Link
              href="/search"
              className="inline-block px-6 py-2 bg-orange text-white rounded-lg hover:bg-orange-600 transition-colors font-medium"
            >
              {t("navigation.search")}
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {conversations.map((conv: ThreadResponse) => {
              const lastMessage =
                conv.communications[conv.communications.length - 1];
              const otherParticipant =
                lastMessage.senderId === user?.id
                  ? lastMessage.recipient
                  : lastMessage.sender;

              return (
                <Link
                  key={conv.threadId}
                  href={`/communications/thread/${conv.threadId}`}
                  className="block bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow border border-gray-100 hover:border-orange"
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="h-10 w-10 flex items-center justify-center rounded-full bg-orange text-white font-semibold">
                          {otherParticipant.name[0]}
                          {otherParticipant.surname[0]}
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-900">
                            {otherParticipant.name} {otherParticipant.surname}
                          </h3>
                          <p className="text-sm text-gray-600">
                            {t("communications.aboutTenant")} {conv.tenant.name}{" "}
                            {conv.tenant.surname}
                          </p>
                        </div>
                      </div>
                      <p className="text-sm text-gray-600 mt-3 line-clamp-2">
                        <span className="font-medium">
                          {t("communications.lastMessage")}:
                        </span>{" "}
                        {lastMessage.message}
                      </p>
                    </div>
                    <div className="text-right ml-4">
                      <span className="text-sm text-gray-500">
                        {new Date(lastMessage.createdAt).toLocaleDateString()}
                      </span>
                      <div className="mt-2">
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
                          {conv.communications.length}{" "}
                          {conv.communications.length === 1
                            ? "message"
                            : "messages"}
                        </span>
                      </div>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
