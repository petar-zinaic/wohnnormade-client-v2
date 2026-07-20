import { getApiUrl } from "@/utils/api";
import { AuthService } from "./auth";
import type { ApiResponse } from "@/types/tenant";

export interface CommunicationMessage {
  id: number;
  threadId: string;
  senderId: number;
  recipientId: number;
  tenantId: number;
  subject: string;
  message: string;
  isInitialMessage: boolean;
  createdAt: string;
  sender: {
    id: number;
    name: string;
    surname: string;
    email: string;
  };
  recipient: {
    id: number;
    name: string;
    surname: string;
    email: string;
  };
  tenant: {
    id: number;
    name: string;
    surname: string;
  };
}

export interface ThreadResponse {
  threadId: string;
  tenant: {
    id: number;
    name: string;
    surname: string;
  };
  communications: CommunicationMessage[];
}

export interface ContactReporterData {
  tenantId: number;
  recipientId: number;
  message: string;
}

export interface ReplyData {
  threadId: string;
  message: string;
}

class CommunicationService {
  static async contactReporter(
    data: ContactReporterData
  ): Promise<ApiResponse<{ threadId: string; message: CommunicationMessage }>> {
    const response = await fetch(
      getApiUrl("/communications/contact-reporter"),
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...AuthService.getAuthHeaders(),
        },
        body: JSON.stringify(data),
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData?.error?.message || "Failed to send message");
    }

    return response.json();
  }

  static async reply(
    data: ReplyData
  ): Promise<ApiResponse<CommunicationMessage>> {
    const response = await fetch(getApiUrl("/communications/reply"), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...AuthService.getAuthHeaders(),
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData?.error?.message || "Failed to send reply");
    }

    return response.json();
  }

  static async getThread(
    threadId: string
  ): Promise<ApiResponse<ThreadResponse>> {
    const response = await fetch(
      getApiUrl(`/communications/thread/${threadId}`),
      {
        headers: {
          "Content-Type": "application/json",
          ...AuthService.getAuthHeaders(),
        },
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        errorData?.error?.message || "Failed to load conversation"
      );
    }

    return response.json();
  }

  static async getMyConversations(): Promise<ApiResponse<ThreadResponse[]>> {
    const response = await fetch(
      getApiUrl("/communications/my-conversations"),
      {
        headers: {
          "Content-Type": "application/json",
          ...AuthService.getAuthHeaders(),
        },
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        errorData?.error?.message || "Failed to load conversations"
      );
    }

    return response.json();
  }
}

export default CommunicationService;
