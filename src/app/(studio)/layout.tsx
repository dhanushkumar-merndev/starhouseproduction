"use client";

import { usePathname } from "next/navigation";
import SiteHeader from "@/components/site/site-header";
import SiteFooter from "@/components/site/site-footer";
import SmoothScroll from "@/components/site/smooth-scroll";
import styles from "@/components/site/studio-sections.module.css";

/** Routes that render on black; the shell redefines the palette for them. */
const DARK_ROUTES = ["/services", "/projects"];

export default function StudioLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const dark = DARK_ROUTES.some(route => pathname === route || pathname.startsWith(`${route}/`));

  return (
    <div className={styles.studioShell} data-theme={dark ? "dark" : "light"}>
      <SiteHeader revealed />
      <main id="top" className={`${styles.sections} ${styles.page}`}>
        <SmoothScroll />
        {children}
      </main>
      <SiteFooter />
    </div>
  );
}
