import { apiFetch } from "@/utils/api";
import { AuthService } from "./auth";

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

const jsonHeaders = (): Record<string, string> => ({
  "Content-Type": "application/json",
  ...AuthService.getAuthHeaders(),
});

class CommunicationService {
  // recipientId must be the tenant's reporter (tenant.createdBy.id)
  static async contactReporter(
    data: ContactReporterData
  ): Promise<{ threadId: string; message: CommunicationMessage }> {
    return apiFetch<{ threadId: string; message: CommunicationMessage }>(
      "/communications/contact-reporter",
      {
        method: "POST",
        headers: jsonHeaders(),
        body: JSON.stringify(data),
      }
    );
  }

  static async reply(data: ReplyData): Promise<CommunicationMessage> {
    return apiFetch<CommunicationMessage>("/communications/reply", {
      method: "POST",
      headers: jsonHeaders(),
      body: JSON.stringify(data),
    });
  }

  static async getThread(threadId: string): Promise<ThreadResponse> {
    return apiFetch<ThreadResponse>(`/communications/thread/${threadId}`, {
      headers: jsonHeaders(),
    });
  }

  static async getMyConversations(): Promise<ThreadResponse[]> {
    return apiFetch<ThreadResponse[]>("/communications/my-conversations", {
      headers: jsonHeaders(),
    });
  }
}

export default CommunicationService;
