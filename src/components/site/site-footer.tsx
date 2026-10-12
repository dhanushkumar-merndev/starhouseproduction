import Link from "next/link";
import { contact } from "./studio-content";
import styles from "./studio-sections.module.css";

export default function SiteFooter() {
  return (
    <footer className={styles.footer}>
        <Link className={styles.footerBrand} href="/">SPH<span>STAR PRODUCTION HOUSE<br />FILM / CREATE / BELONG</span></Link>
        <nav aria-label="Footer"><Link href="/">Home</Link><Link href="/projects">Projects</Link><Link href="/services">Services</Link><Link href="/about-us">About Us</Link><Link href="/contact">Contact</Link></nav>
        <div className={styles.footerContact}><a href={contact.phoneHref}>{contact.phone}</a><a href={contact.emailHref}>{contact.email}</a></div>
        <Link className={styles.backToTop} href="#top">BACK TO TOP ↑</Link>
        <div className={styles.footerBottom}><span>© {new Date().getFullYear()} STAR PRODUCTION HOUSE</span><span>MADE FOR A DIFFERENT POINT OF VIEW.</span></div>
      </footer>
  );
}
