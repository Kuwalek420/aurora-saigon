"use client";

import { useStore } from "@/lib/store";
import { useT } from "@/lib/use-t";

/** Opens the private-viewing dialog (demo form) from server-rendered pages. */
export default function BookViewingButton({ children, className = "" }: { children?: React.ReactNode; className?: string }) {
  const openViewing = useStore((s) => s.openViewing);
  const t = useT();
  return (
    <button onClick={() => openViewing(null)} className={className}>
      {children ?? t("Book Private Viewing in Thảo Điền")}
    </button>
  );
}
