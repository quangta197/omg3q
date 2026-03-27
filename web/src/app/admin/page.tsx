import { redirect } from "next/navigation";
import { requireAdminPageSession } from "@/lib/admin-auth";

export default async function AdminIndexPage() {
  await requireAdminPageSession("/admin/accounts");
  redirect("/admin/accounts");
}
