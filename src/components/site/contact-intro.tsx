import styles from "./contact-page.module.css";

/**
 * The ways to reach the studio. The addresses are placeholders until the real
 * ones are supplied — they are kept here, in one list, so swapping them is a
 * single edit rather than a hunt through the markup.
 */
const channels = [
  { label: "WRITE TO US", value: "hello@starproductionhouse.com", href: "mailto:hello@starproductionhouse.com", note: "We reply within two working days." },
  { label: "CALL THE STUDIO", value: "+91 00000 00000", href: "tel:+910000000000", note: "Mon–Sat, 10:00 – 19:00 IST." },
  { label: "THE STUDIO", value: "Chennai, Tamil Nadu", note: "Shoots across India, on request." },
  { label: "ELSEWHERE", value: "Instagram · YouTube", href: "https://instagram.com", note: "Work in progress, most days." },
];

const steps = [
  { index: "01", title: "You tell us the idea", copy: "A line is enough. Budget and dates help, but they can wait." },
  { index: "02", title: "We come back with a shape", copy: "An approach, a rough scope, and what it would take to make it." },
  { index: "03", title: "We put it on a schedule", copy: "Crew, locations, and a cut you can actually plan around." },
];

export default function ContactIntro() {
  return (
    <section id="contact-intro" className={styles.page}>
      <div className={styles.lede}>
        <div>
          <p className={styles.eyebrow}><b />CONTACT / START HERE</p>
          <h1>TELL US<br />THE <em>STORY.</em></h1>
        </div>
        <p className={styles.standfirst}>
          Whether it is a film with a point of view, a campaign that has to land, or
          an idea you cannot quite describe yet — start here and we will take it
          from a sentence to a schedule.
        </p>
      </div>

      <dl className={styles.channels}>
        {channels.map(({ label, value, href, note }) => (
          <div className={styles.channel} key={label}>
            <dt>{label}</dt>
            <dd>{href ? <a href={href}>{value}</a> : value}</dd>
            <small>{note}</small>
          </div>
        ))}
      </dl>

      <div className={styles.next}>
        <h2>What happens next.</h2>
        {steps.map(({ index, title, copy }) => (
          <div className={styles.step} key={index}>
            <span>{index}</span>
            <h3>{title}</h3>
            <p>{copy}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
