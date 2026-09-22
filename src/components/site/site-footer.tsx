import Link from "next/link";
import styles from "./studio-sections.module.css";

export default function SiteFooter() {
  return (
    <footer className={styles.footer}>
        <Link className={styles.footerBrand} href="/">SPH<span>STAR PRODUCTION HOUSE<br />FILM / CREATE / BELONG</span></Link>
        <nav aria-label="Footer"><Link href="/">Home</Link><Link href="/projects">Projects</Link><Link href="/services">Services</Link><Link href="/about-us">About Us</Link><Link href="/contact">Contact</Link></nav>
        <Link className={styles.backToTop} href="#top">BACK TO TOP ↑</Link>
        <div className={styles.footerBottom}><span>© {new Date().getFullYear()} STAR PRODUCTION HOUSE</span><span>MADE FOR A DIFFERENT POINT OF VIEW.</span></div>
      </footer>
  );
}
