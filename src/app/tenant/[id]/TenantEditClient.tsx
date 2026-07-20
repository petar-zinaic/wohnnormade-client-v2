"use client";

import { useParams } from "next/navigation";
import { TenantEditForm } from "@/components/forms";

export default function TenantEditPage() {
  const params = useParams();
  const idParam = (params?.id ?? "").toString();
  const id = Number(idParam);
  if (!id || Number.isNaN(id)) return null;
  return <TenantEditForm tenantId={id} />;
}
