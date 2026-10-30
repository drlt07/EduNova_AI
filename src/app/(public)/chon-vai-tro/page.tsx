import type { Metadata } from "next";
import { ChooseRoleClient } from "./choose-role-client";

export const metadata: Metadata = { title: "Chọn vai trò" };

export default function ChooseRolePage() {
  return <ChooseRoleClient />;
}
