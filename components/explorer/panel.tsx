"use client";

import { useEffect, useRef } from "react";
import { Icon } from "./icons";

/** Title bar of a panel view. Takes focus when the view was opened by the user, for keyboard and screen readers. */
export function PanelHeader({ title, note, back, focus = false }: { title: string; note?: string; back?: { label: string; onClick: () => void }; focus?: boolean }) {
  const heading = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    if (focus) heading.current?.focus({ preventScroll: true });
  }, [focus]);

  return (
    <div className="flex items-center gap-3 px-5 py-4">
      {back && (
        <button
          type="button"
          onClick={back.onClick}
          aria-label={back.label}
          title={back.label}
          className="-ml-2 grid h-9 w-9 place-items-center rounded-full hover:bg-zinc-100"
        >
          <Icon name="back" />
        </button>
      )}
      <h2 ref={heading} tabIndex={-1} className="text-xl font-black outline-none">
        {title}
      </h2>
      {note && <span className="ml-auto text-sm text-zinc-600">{note}</span>}
    </div>
  );
}

/** Fixed action bar at the bottom of the panel. */
export function ActionBar({ children }: { children: React.ReactNode }) {
  return <div className="space-y-2 border-t border-zinc-200 bg-white p-5 shadow-[0_-4px_12px_rgb(0_0_0/0.06)]">{children}</div>;
}

export function ActionButton({ variant = "primary", ...props }: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "primary" | "danger" | "quiet" }) {
  const style = {
    primary: "bg-[#024bde] text-white hover:bg-[#0139a8]",
    danger: "bg-[#d7263d] text-white hover:bg-[#b01c30]",
    quiet: "text-[#024bde] hover:underline",
  }[variant];
  return (
    <button
      type="button"
      {...props}
      className={`w-full rounded px-5 font-bold transition disabled:cursor-not-allowed disabled:opacity-50 ${variant === "quiet" ? "py-2" : "py-3.5"} ${style}`}
    />
  );
}
