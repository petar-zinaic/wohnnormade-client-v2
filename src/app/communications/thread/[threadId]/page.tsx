"use client";

import { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/context/AuthContext";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import CommunicationService from "@/services/communication";
import Button from "@/components/common/Button";
import type {
  ThreadResponse,
  CommunicationMessage,
} from "@/services/communication";
import { getErrorMessage } from "@/utils/api";

export default function ThreadPage() {
  return (
    <ProtectedRoute>
      <ThreadPageContent />
    </ProtectedRoute>
  );
}

function ThreadPageContent() {
  const params = useParams();
  const router = useRouter();
  const { t } = useTranslation();
  const { user } = useAuth();
  const [thread, setThread] = useState<ThreadResponse | null>(null);
  const [newMessage, setNewMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [isLoadingThread, setIsLoadingThread] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const threadId = params.threadId as string;

  useEffect(() => {
    if (threadId) {
      fetchThread();
    }
  }, [threadId]);

  useEffect(() => {
    // Scroll to bottom when messages change
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [thread?.communications]);

  const fetchThread = async () => {
    try {
      setIsLoadingThread(true);
      setError("");
      const result = await CommunicationService.getThread(threadId);

      // Check if current user is a participant in this thread
      const isParticipant = result.communications.some(
        (comm: CommunicationMessage) =>
          comm.senderId === user?.id || comm.recipientId === user?.id
      );

      if (!isParticipant) {
        setError(t("communications.accessDenied"));
        setThread(null);
        return;
      }

      setThread(result);
    } catch (err) {
      setError(getErrorMessage(err, t, "communications.failedToLoad"));
    } finally {
      setIsLoadingThread(false);
    }
  };

  const sendReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || newMessage.trim().length < 20) {
      setError(t("contactReporter.minLength"));
      return;
    }

    setIsSubmitting(true);
    setError("");

    try {
      await CommunicationService.reply({
        threadId,
        message: newMessage.trim(),
      });

      setNewMessage("");
      await fetchThread(); // Refresh thread
    } catch (err) {
      setError(getErrorMessage(err, t, "communications.failedToSend"));
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoadingThread) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <p className="text-gray-600">{t("communications.loadingThread")}</p>
      </div>
    );
  }

  if (!thread) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50 px-4">
        <div className="text-center max-w-md">
          <div className="mb-6">
            <div className="text-6xl mb-4">🔒</div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              {error === t("communications.accessDenied")
                ? t("communications.accessDenied")
                : t("communications.failedToLoad")}
            </h2>
            <p className="text-gray-600">
              {error === t("communications.accessDenied")
                ? t("communications.accessDeniedMessage")
                : error || t("communications.failedToLoadMessage")}
            </p>
          </div>
          <Button
            variant="primary"
            onClick={() => router.push("/communications")}
          >
            {t("navigation.communications")}
          </Button>
        </div>
      </div>
    );
  }

  // Get the other participant (not the current user)
  const getOtherParticipant = () => {
    const firstMessage = thread.communications[0];
    if (firstMessage.senderId === user?.id) {
      return firstMessage.recipient;
    }
    return firstMessage.sender;
  };

  const otherParticipant = getOtherParticipant();

  return (
    <div className="min-h-screen bg-gray-50 pt-24 sm:pt-28 pb-10">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-6">
          <Button
            variant="outline"
            size="md"
            onClick={() => router.push("/communications")}
            className="mb-4 border-blueLight text-blueLight hover:bg-blueLight hover:text-white hover:border-blueLight transition-colors"
          >
            <span className="text-lg mr-2">←</span>
            {t("navigation.communications")}
          </Button>
          <div className="bg-white rounded-lg shadow-md p-6 border-t-4 border-orange">
            <div className="flex items-center gap-4 mb-3">
              <div className="h-14 w-14 flex items-center justify-center rounded-full bg-blueLight text-white font-bold text-xl">
                {otherParticipant.name[0]}
                {otherParticipant.surname[0]}
              </div>
              <div className="flex-1">
                <div
                  onClick={() =>
                    router.push(`/landlord/${otherParticipant.id}`)
                  }
                  className="text-xl sm:text-2xl font-bold text-blueLight hover:text-orange cursor-pointer hover:underline transition-colors inline-block"
                >
                  {otherParticipant.name} {otherParticipant.surname}
                </div>
                <p className="text-sm text-gray-600">
                  {otherParticipant.email}
                </p>
              </div>
            </div>
            <div className="border-t pt-4 mt-4">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-sm text-gray-600 font-medium">
                  {t("communications.conversationAbout")}
                </span>
                <span className="inline-flex items-center px-3 py-1.5 rounded-lg bg-gradient-to-r from-orange/10 to-orangeLight/20 border border-orange/30 text-orangeDark font-semibold text-sm shadow-sm">
                  {thread.tenant.name} {thread.tenant.surname}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Messages */}
        <div className="space-y-4 mb-6" ref={messagesEndRef}>
          {thread.communications.map((comm: CommunicationMessage) => {
            const isSentByMe = comm.senderId === user?.id;
            return (
              <div
                key={comm.id}
                className={`rounded-lg shadow-sm p-4 ${
                  isSentByMe
                    ? "ml-8 bg-orangeLight border-l-4 border-orange"
                    : "mr-8 bg-[rgba(69,90,100,0.08)] border-l-4 border-blueLight"
                }`}
              >
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      {isSentByMe ? (
                        <strong className="text-orangeDark">
                          {comm.sender.name} {comm.sender.surname}
                        </strong>
                      ) : (
                        <strong
                          onClick={() =>
                            router.push(`/landlord/${comm.sender.id}`)
                          }
                          className="text-blueLight hover:text-orange cursor-pointer hover:underline transition-colors"
                        >
                          {comm.sender.name} {comm.sender.surname}
                        </strong>
                      )}
                    </div>
                    <span className="text-sm text-gray">
                      {new Date(comm.createdAt).toLocaleString()}
                    </span>
                  </div>
                </div>
                <p
                  className={`whitespace-pre-wrap leading-relaxed ${
                    isSentByMe ? "text-gray-900" : "text-gray-800"
                  }`}
                >
                  {comm.message}
                </p>
              </div>
            );
          })}
        </div>

        {/* Reply Form */}
        <div className="bg-white rounded-lg shadow-md p-6 sm:p-8 border border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            {t("communications.typeReply")}
          </h2>
          <form onSubmit={sendReply} className="space-y-5">
            <div>
              <textarea
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder={t("communications.typeReply")}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-orange focus:border-orange resize-none transition-colors text-gray-900 placeholder:text-gray-400"
                rows={5}
                required
                minLength={20}
              />
              <div className="flex justify-between items-center mt-2">
                <p className="text-xs text-gray-500">
                  {t("contactReporter.minLength")}
                </p>
                <p
                  className={`text-sm font-medium ${
                    newMessage.length >= 20 ? "text-green-600" : "text-gray-500"
                  }`}
                >
                  {newMessage.length} / 20
                </p>
              </div>
            </div>

            {error && (
              <div className="p-4 bg-red-50 text-red-600 rounded-lg text-sm border border-red-100 flex items-start gap-2">
                <span className="text-red-500 font-bold">⚠</span>
                <span>{error}</span>
              </div>
            )}

            <div className="flex justify-end pt-2">
              <Button
                type="submit"
                variant="primary"
                size="lg"
                disabled={isSubmitting || newMessage.trim().length < 20}
                isLoading={isSubmitting}
              >
                {isSubmitting
                  ? t("communications.replying")
                  : t("communications.reply")}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
