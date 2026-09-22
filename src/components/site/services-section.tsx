import ServicesWheel from "./services-wheel";
import styles from "./studio-sections.module.css";

export default function ServicesSection() {
  return (
    <section id="services" className={`${styles.section} ${styles.servicesSection}`}>
        <div className={styles.sectionHeader}><h1>OUR <em>SERVICES.</em></h1><p className={styles.eyebrow}>IDEAS TO IMPACT.</p></div>
        <ServicesWheel />
      </section>
  );
}
