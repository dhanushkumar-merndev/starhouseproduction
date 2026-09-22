import Link from "next/link";
import styles from "./studio-sections.module.css";

export default function AboutSection() {
  return (
    <section id="about-us" className={`${styles.section} ${styles.editSection}`}>
        <div className={styles.editorScene} data-parallax="0.06">
          <div className={styles.editorWindow}>
            <div className={styles.editorTop}><span>THE STORY, TAKING SHAPE</span><span>SPH / EDIT SUITE</span></div>
            <div className={styles.editPreview} role="img" aria-label="Film crew on a cinematic mountain location" />
            <div className={styles.timeline} aria-hidden="true">
              <div className={styles.timecode}><span>00:00</span><span>00:15</span><span>00:30</span><span>00:45</span></div>
              <div className={styles.videoTrack}><i /><i /><i /><i /><i /></div>
              <div className={styles.soundTrack}><i /><i /><i /></div>
              <div className={styles.playhead} />
            </div>
          </div>
        </div>
        <div className={styles.editCopy}>
          <p className={styles.eyebrow}>ABOUT US / THE STUDIO</p>
          <h1>GIVE IT<br /><em>A HEARTBEAT.</em></h1>
          <p>Images find their rhythm. Colour sets the mood. Sound makes it felt.</p>
          <p>We shape every detail until the story becomes something you remember.</p>
          <Link className="text-link" href="/projects">SEE WHAT COMES NEXT <span aria-hidden="true">↗</span></Link>
        </div>
      </section>
  );
}
