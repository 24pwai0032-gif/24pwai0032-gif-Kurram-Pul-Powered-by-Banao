"use client";

import { X } from "lucide-react";
import { useEffect, useRef } from "react";
import { SidebarContent } from "@/components/sidebar/SidebarContent";
import { useT } from "@/lib/useT";

/**
 * The sidebar as a drawer on phones and tablets. A native <dialog> gives focus trapping,
 * Escape to close and a backdrop; it slides in from the reading start edge (right in Urdu/Pashto).
 */
export function MobileDrawer({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { t } = useT();
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      aria-label={t("nav.label")}
      onClose={onClose}
      // A click on the backdrop lands on the dialog element itself.
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="m-0 h-dvh max-h-none w-[min(84vw,19rem)] border-e border-border bg-surface-raised p-0 text-text-primary backdrop:bg-background/80 lg:hidden"
      style={{ insetInlineStart: 0, insetInlineEnd: "auto" }}
    >
      <div className="flex h-full flex-col">
        <div className="flex justify-end px-2 pt-2">
          <button
            type="button"
            onClick={onClose}
            aria-label={t("nav.close")}
            className="grid size-10 place-items-center rounded-md text-text-secondary hover:bg-surface hover:text-text-primary"
          >
            <X aria-hidden />
          </button>
        </div>
        <div className="min-h-0 flex-1">
          <SidebarContent onNavigate={onClose} />
        </div>
      </div>
    </dialog>
  );
}
