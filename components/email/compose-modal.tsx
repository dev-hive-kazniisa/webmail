"use client";

import { Maximize2, Minimize2, Minus, PenLine, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ComposeModalProps {
  minimized: boolean;
  maximized: boolean;
  /** Window title: reply/forward subject or the localized "New message". */
  title: string;
  onMinimize: () => void;
  onRestore: () => void;
  onToggleMaximize: () => void;
  /** Dirty-aware close — routes through the composer's own save/discard guard. */
  onRequestClose: () => void;
  children: React.ReactNode;
}

/**
 * Centered modal window hosting the email composer (mail.ru-style).
 * The composer stays MOUNTED while minimized (hidden via CSS) so draft
 * autosave and in-flight attachment uploads keep running; the minimized
 * bottom bar restores it. On <md the panel is full-screen with no backdrop,
 * matching the previous in-pane mobile behavior. Clicking the backdrop
 * minimizes (never closes) so the draft is safe.
 */
export function ComposeModal({
  minimized,
  maximized,
  title,
  onMinimize,
  onRestore,
  onToggleMaximize,
  onRequestClose,
  children,
}: ComposeModalProps) {
  const t = useTranslations("email_composer");

  return (
    <>
      <div
        className={cn(
          "fixed inset-0 z-50",
          minimized && "invisible pointer-events-none"
        )}
        role="dialog"
        aria-modal={!minimized}
        aria-label={title}
        aria-hidden={minimized}
      >
        <div
          className="absolute inset-0 bg-black/40 max-md:hidden"
          onClick={onMinimize}
          data-testid="compose-modal-backdrop"
        />
        <div
          className={cn(
            "absolute flex flex-col bg-background overflow-hidden",
            "max-md:inset-0",
            "md:shadow-2xl md:border md:border-border md:rounded-lg",
            maximized
              ? "md:inset-4"
              : "md:left-1/2 md:top-1/2 md:-translate-x-1/2 md:-translate-y-1/2 md:h-[85vh] md:w-[calc(100vw-4rem)] md:max-w-[880px]"
          )}
        >
          {/* Window controls sit over the free right side of the composer's
              own header (desktop-only; the composer's own X keeps closing). */}
          <div className="absolute right-3 top-3 z-10 hidden md:flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={onMinimize}
              aria-label={t("minimize")}
              title={t("minimize")}
            >
              <Minus className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={onToggleMaximize}
              aria-label={maximized ? t("restore_size") : t("maximize")}
              title={maximized ? t("restore_size") : t("maximize")}
            >
              {maximized ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </Button>
          </div>
          <div className="flex-1 min-h-0 flex flex-col">{children}</div>
        </div>
      </div>

      {minimized && (
        <div className="fixed right-4 bottom-20 md:bottom-4 z-40 flex items-center rounded-lg border border-border bg-background shadow-lg">
          <button
            type="button"
            onClick={onRestore}
            className="flex items-center gap-2 pl-3 pr-1 py-2 hover:bg-accent rounded-l-lg min-w-0"
          >
            <PenLine className="w-4 h-4 text-primary shrink-0" />
            <span className="text-sm max-w-[200px] truncate">{title}</span>
          </button>
          <button
            type="button"
            onClick={onRequestClose}
            className="p-2 text-muted-foreground hover:text-foreground hover:bg-accent rounded-r-lg"
            aria-label={t("close")}
            title={t("close")}
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}
    </>
  );
}
