"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useId, useRef, useState } from "react";
import styles from "./site-header.module.css";

const navigation = [
  { label: "Home", href: "/" },
  { label: "Services", href: "/services" },
  { label: "Projects", href: "/projects" },
  { label: "About Us", href: "/about-us" },
];

export default function SiteHeader({ revealed, tone = "light" }: { revealed: boolean; tone?: "light" | "dark" }) {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuButton = useRef<HTMLButtonElement>(null);
  const navigationId = useId();
  const visible = revealed || scrolled;

  useEffect(() => {
    const updateScroll = () => setScrolled(window.scrollY >= 24);
    const initialFrame = window.requestAnimationFrame(updateScroll);
    window.addEventListener("scroll", updateScroll, { passive: true });
    return () => {
      window.cancelAnimationFrame(initialFrame);
      window.removeEventListener("scroll", updateScroll);
    };
  }, []);

  useEffect(() => {
    if (!menuOpen) return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      setMenuOpen(false);
      menuButton.current?.focus();
    };
    const desktop = window.matchMedia("(min-width: 900px)");
    const closeOnDesktop = (event: MediaQueryListEvent) => {
      if (event.matches) setMenuOpen(false);
    };
    window.addEventListener("keydown", closeOnEscape);
    desktop.addEventListener("change", closeOnDesktop);
    return () => {
      window.removeEventListener("keydown", closeOnEscape);
      desktop.removeEventListener("change", closeOnDesktop);
    };
  }, [menuOpen]);

  return (
    <header
      className={styles.header}
      data-tone={tone}
      data-revealed={visible}
      data-scrolled={scrolled}
      data-menu-open={menuOpen}
      aria-hidden={!visible}
      inert={!visible}
    >
      <div className={styles.inner}>
        <Link
          className={styles.brand}
          href="/"
          aria-label="Star Production House home"
          onClick={() => setMenuOpen(false)}
        >
          <Image
            className={styles.logo}
            src="/logo.png"
            alt=""
            width={44}
            height={44}
          />
          <span className={styles.wordmark} aria-hidden="true">
            <span className={styles.brandName}>Star <span className={styles.brandAccent}>Production</span> House</span>
            <span className={styles.brandDescriptor}>Commercials &amp; 4K Cinema</span>
          </span>
        </Link>

        <nav className={styles.navigation} id={navigationId} aria-label="Main navigation">
          {navigation.map(({ label, href }) => (
            <Link className={styles.navLink} key={href} href={href} aria-current={pathname === href ? "page" : undefined} onClick={() => setMenuOpen(false)}>
              {label}
            </Link>
          ))}
        </nav>

        <div className={styles.actions}>
          <button className={styles.login} type="button">Login</button>
          <button
            className={styles.menuButton}
            type="button"
            ref={menuButton}
            aria-label={menuOpen ? "Close navigation" : "Open navigation"}
            aria-expanded={menuOpen}
            aria-controls={navigationId}
            onClick={() => setMenuOpen((open) => !open)}
          >
            <span />
            <span />
          </button>
        </div>
      </div>
    </header>
  );
}
