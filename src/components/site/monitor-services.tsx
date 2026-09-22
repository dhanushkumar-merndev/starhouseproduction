"use client";

import Link from "next/link";
import ReactBitsMasonry, { type MasonryItem } from "./reactbits-masonry";
import { services } from "./studio-content";
import styles from "./monitor-services.module.css";

const imagery = [
  { src: "/images/film-crew.webp", position: "58% 50%", size: "cover", ratio: 1.08 },
  { src: "/images/visual-directions.webp", position: "33.333% 60%", size: "400% auto", ratio: 0.82 },
  { src: "/images/visual-directions.webp", position: "0% 58%", size: "400% auto", ratio: 1.35 },
  { src: "/images/visual-directions.webp", position: "66.667% 55%", size: "400% auto", ratio: 0.95 },
  { src: "/images/visual-directions.webp", position: "100% 45%", size: "400% auto", ratio: 0.86 },
];

const cards: MasonryItem[] = services.map(([title, description], index) => {
  const slug = title.toLowerCase().replaceAll(" ", "-");
  const photo = imagery[index];
  return {
    id: slug,
    imageRatio: photo.ratio,
    content: (
      <Link className={styles.card} href="/services" data-service-card={slug}>
        <div className={styles.imageFrame}>
          <div
            className={styles.image}
            aria-hidden="true"
            style={{ backgroundImage: `url('${photo.src}')`, backgroundPosition: photo.position, backgroundSize: photo.size }}
          />
          <span className={styles.number} aria-hidden="true">0{index + 1}</span>
        </div>
        <div className={styles.cardCaption}>
          <div className={styles.cardTitle}><h3>{title}</h3><span aria-hidden="true">↗</span></div>
          <p>{description}</p>
        </div>
      </Link>
    ),
  };
});

export default function MonitorServices() {
  return (
    <section className={styles.board} aria-labelledby="monitor-services-heading">
      <div className={styles.content} data-monitor-content>
        <header className={styles.header}>
          <p className={styles.eyebrow}><span aria-hidden="true" />OUR SERVICES</p>
          <div className={styles.headingRow}>
            <h2 id="monitor-services-heading">What we bring<br />to the frame.</h2>
            <p>From the first idea<br />to the final cut.</p>
          </div>
        </header>
        <ReactBitsMasonry items={cards} />
        <footer className={styles.footer}>
          <Link href="/services">Explore our services <span aria-hidden="true">↗</span></Link>
          <Link href="/projects">View our work <span aria-hidden="true">↗</span></Link>
        </footer>
      </div>
    </section>
  );
}
