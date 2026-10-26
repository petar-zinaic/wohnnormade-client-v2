"use client";

import { useParams } from "next/navigation";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import { TenantEditForm } from "@/components/forms";

export default function TenantEditPage() {
  const params = useParams();
  const idParam = (params?.id ?? "").toString();
  const id = Number(idParam);
  if (!id || Number.isNaN(id)) return null;
  return (
    <ProtectedRoute>
      <TenantEditForm tenantId={id} />
    </ProtectedRoute>
  );
}
