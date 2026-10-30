import type { Metadata } from "next";
import { AdventureHub } from "@/components/nova/adventures";
import { NOVA_PATH } from "@/lib/data/nova-adventure";

export const metadata: Metadata = { title: "Phiêu lưu Nova" };

/** Phiêu lưu Nova (công khai): các kịch bản trò chơi 3D ôn Tin học, chơi ngay không cần tài khoản. */
export default function Page() {
  return <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6"><AdventureHub base={NOVA_PATH} /></div>;
}
