"use client";

import { useState } from "react";
import styles from "./studio-sections.module.css";

const directions = [
  { title: "Fashion film", category: "Films", caption: "STYLE / PEOPLE / PERSPECTIVE", position: "0%", description: "A study in movement, fabric, and light. A fashion story imagined against an open mountain landscape." },
  { title: "Food commercial", category: "Commercials", caption: "TASTE / STORY / EMOTION", position: "33.333%", description: "Close-up craft, tactile details, and the anticipation of a first bite. A visual direction for a food campaign." },
  { title: "Brand film", category: "Brand stories", caption: "BRANDS / PEOPLE / CULTURE", position: "66.667%", description: "A story grounded in place and the people who give it meaning. An exploration of cultural storytelling." },
  { title: "Product film", category: "Commercials", caption: "DETAILS / DESIGN / DESIRE", position: "100%", description: "Precision, texture, and purposeful light. A cinematic direction for bringing a product into focus." },
];

export default function ProjectsSection() {
  const [filter, setFilter] = useState("All");
  return (
    <section id="projects" className={styles.section}>
        <div className={styles.sectionHeader}>
          <div><p className={styles.eyebrow}>03 / THE RESULT</p><h1>MADE TO<br /><em>MOVE YOU.</em></h1></div>
          <div className={styles.filters} aria-label="Filter visual directions">
            {["All", "Commercials", "Films", "Brand stories"].map(category => <button key={category} type="button" aria-pressed={filter === category} onClick={() => setFilter(category)}>{category}</button>)}
          </div>
        </div>
        <div className={styles.projects}>
          {directions.filter(project => filter === "All" || project.category === filter).map(project => (
            <article className={styles.project} key={project.title}>
              <div className={styles.projectPhoto} style={{ backgroundPosition: `${project.position} center` }} role="img" aria-label={`${project.title} concept artwork`}><span>0{directions.indexOf(project) + 1}</span></div>
              <div className={styles.projectCopy}><h3>{project.title}</h3><p>{project.caption}</p>
                <details><summary>EXPLORE THE IDEA <span aria-hidden="true">↗</span></summary><p>{project.description}</p></details>
              </div>
            </article>
          ))}
        </div>
        <p className={styles.collectionNote}>A glimpse of what’s possible. Concept imagery for creative direction; project films will be added here.</p>
      </section>
  );
}
