"use client";

import { useRef, useState } from "react";
import { services } from "./studio-content";
import styles from "./studio-sections.module.css";

export default function ContactSection() {
  const [copied, setCopied] = useState(false);
  const briefText = useRef<HTMLTextAreaElement>(null);
  const [brief, setBrief] = useState("");

  function prepareBrief(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    setCopied(false);
    setBrief(`PROJECT BRIEF\nName: ${data.get("name")}\nEmail: ${data.get("email")}\nProject: ${data.get("type")}\n\n${data.get("idea")}`);
  }
  async function copyBrief() {
    try { await navigator.clipboard.writeText(brief); setCopied(true); }
    catch { briefText.current?.focus(); briefText.current?.select(); }
  }

  return (
    <section id="contact" className={`${styles.sections} ${styles.section} ${styles.contact}`}>
        <div><p className={styles.eyebrow}>YOUR STORY COULD BE NEXT.</p><h2>LET’S MAKE<br /><em>SOMETHING MATTER.</em></h2></div>
        <details className={styles.briefPanel}>
          <summary>START A PROJECT <span aria-hidden="true">↗</span></summary>
          <div className={styles.briefContent}>
            <h3>LET’S FIND YOUR STORY.</h3><p>Prepare a project brief to save or share. This form creates a draft on your device.</p>
            <form onSubmit={prepareBrief}>
              <label>Your name<input name="name" required autoComplete="name" /></label>
              <label>Email<input name="email" type="email" required autoComplete="email" /></label>
              <label>Project type<select name="type">{services.map(([title])=><option key={title}>{title}</option>)}</select></label>
              <label className={styles.ideaField}>Tell us your idea<textarea name="idea" rows={3} required /></label>
              <button type="submit">PREPARE MY BRIEF <span aria-hidden="true">↗</span></button>
            </form>
            {brief && <div className={styles.preparedBrief}><label>Your draft<textarea ref={briefText} value={brief} readOnly rows={7} /></label><button type="button" onClick={copyBrief}>{copied ? "COPIED" : "COPY BRIEF"}</button><p role="status">{copied ? "Your brief has been copied." : "Ready to save or share. Nothing has been sent."}</p></div>}
          </div>
        </details>
      </section>
  );
}
