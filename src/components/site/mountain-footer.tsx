import Link from "next/link";
import styles from "./mountain-footer.module.css";

const navigation = [
  { label: "Home", href: "/" },
  { label: "Services", href: "/services" },
  { label: "Projects", href: "/projects" },
  { label: "About Us", href: "/about-us" },
];

export default function MountainFooter({ staticView = false }: { staticView?: boolean }) {
  return (
    <footer
      className={`mountain-footer ${styles.footer}`}
      aria-labelledby="mountain-footer-heading"
      inert={!staticView}
    >
      <div className={styles.artwork} aria-hidden="true">
        <div className={styles.landscape} />
        <div className={`${styles.mist} ${styles.mistBehind}`} />
        <div className={`${styles.mist} ${styles.mistInFront}`} />
      </div>

      <div className={styles.foreground}>
        <div className={styles.invitation}>
          <p className={styles.eyebrow}>THE NEXT FRAME IS YOURS</p>
          <h2 id="mountain-footer-heading" className={styles.heading}>
            EVERY STORY<br />
            STARTS SOMEWHERE.
          </h2>
          <Link className={styles.projectLink} href="/services#enquiry">
            START A PROJECT <span aria-hidden="true">↗</span>
          </Link>
        </div>

        <div className={styles.details}>
          <div className={styles.mainRow}>
            <Link className={styles.brand} href="/" aria-label="Star Production House home">
              <span className={styles.monogram} aria-hidden="true">SPH</span>
              <span className={styles.brandName}>
                STAR PRODUCTION HOUSE
                <span>COMMERCIALS &amp; 4K CINEMA</span>
              </span>
            </Link>

            <nav className={styles.navigation} aria-label="Footer navigation">
              {navigation.map(({ label, href }) => (
                <Link key={href} href={href}>{label}</Link>
              ))}
            </nav>
          </div>

          <div className={styles.bottomRow}>
            <span>© {new Date().getFullYear()} STAR PRODUCTION HOUSE</span>
            <span className={styles.signature}>MADE FOR A DIFFERENT POINT OF VIEW.</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
