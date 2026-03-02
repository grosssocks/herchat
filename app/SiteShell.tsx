"use client";

import { usePathname } from "next/navigation";
import type React from "react";

export function SiteShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const showFooter = pathname !== "/support";

  return (
    <div className="min-h-screen flex flex-col">
      <div className="flex-1">{children}</div>
      {showFooter && (
        <footer className="border-t border-pink-100/80 bg-gradient-to-r from-[#fdf2f8]/90 to-[#faf5ff]/90 px-6 py-3 text-center text-[0.75rem] text-[#7a6d7a]">
          <p>
            Made with care by Sujita Roy ·{" "}
            <a
              href="/support"
              className="font-medium text-[#be185d] underline decoration-[#f9a8d4]/80 underline-offset-4 hover:text-[#9d174d]"
            >
              Support me
            </a>
          </p>
        </footer>
      )}
    </div>
  );
}

