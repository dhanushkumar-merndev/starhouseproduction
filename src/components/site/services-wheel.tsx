"use client";

import { useEffect, useRef, useState } from "react";
import OptionWheel, { type OptionWheelHandle } from "@/components/ui/option-wheel/option-wheel";
import { services } from "./studio-content";
import styles from "./studio-sections.module.css";

/** Gap enforced between wheel steps, so a fast flick still advances one at a time. */
const STEP_INTERVAL = 140;

export default function ServicesWheel() {
  const [selected, setSelected] = useState(0);
  const [compact, setCompact] = useState(false);
  const wheel = useRef<OptionWheelHandle>(null);
  const block = useRef<HTMLDivElement>(null);
  const selectedRef = useRef(0);

  // The wheel derives its row spacing from fontSize, so the two have to change
  // together rather than scaling the type in CSS alone.
  useEffect(() => {
    const narrow = window.matchMedia("(max-width: 700px)");
    const apply = () => setCompact(narrow.matches);
    apply();
    narrow.addEventListener("change", apply);
    return () => narrow.removeEventListener("change", apply);
  }, []);

  // While the wheel sits across the middle of the viewport, scrolling turns it
  // instead of moving the page. Once it runs out of options in that direction
  // the event is left alone and the page carries on scrolling.
  useEffect(() => {
    if (compact) return;
    let lastStep = 0;
    function takeOver(event: WheelEvent) {
      const element = block.current;
      if (!element || event.ctrlKey) return;
      const direction = Math.sign(event.deltaY);
      if (!direction) return;

      const rect = element.getBoundingClientRect();
      const middle = window.innerHeight / 2;
      if (rect.top > middle || rect.bottom < middle) return;

      const next = selectedRef.current + direction;
      if (next < 0 || next > services.length - 1) return;

      // The wheel's own handler is off, so preventDefault alone is enough to
      // hold the page still; running out of options above leaves the event
      // untouched and the page scrolls on.
      event.preventDefault();
      if (event.timeStamp - lastStep < STEP_INTERVAL) return;
      lastStep = event.timeStamp;
      wheel.current?.step(direction);
    }
    window.addEventListener("wheel", takeOver, { passive: false, capture: true });
    return () => window.removeEventListener("wheel", takeOver, { capture: true });
  }, [compact]);

  function select(index: number) {
    selectedRef.current = index;
    setSelected(index);
  }

  return (
    <div className={styles.serviceWheelLayout} ref={block}>
      <div className={styles.serviceWheel}>
        <OptionWheel
          ref={wheel}
          className={styles.serviceWheelSkin}
          items={services.map(([title]) => title)}
          defaultSelected={0}
          onChange={select}
          textColor="#585b54"
          activeColor="#f3f2ee"
          side="left"
          fontSize={compact ? 2 : 3}
          spacing={1.35}
          curve={1}
          tilt={6}
          blur={1.2}
          fade={0.22}
          smoothing={200}
          inset={compact ? 26 : 58}
          loop={false}
          draggable={!compact}
          wheelInput={compact}
        />
      </div>

      <div className={styles.serviceDetail} aria-live="polite">
        {services.map(([title, tagline, detail], index) => (
          <article key={title} hidden={index !== selected}>
            <p className={styles.eyebrow}>0{index + 1} <span>/</span> {title.toUpperCase()}</p>
            <h2>{tagline}</h2>
            <p>{detail}</p>
            <a className="text-link" href="#enquiry">START A PROJECT <span aria-hidden="true">↗</span></a>
          </article>
        ))}
      </div>

      <p className={styles.wheelHint} aria-hidden="true">
        {String(selected + 1).padStart(2, "0")} / {String(services.length).padStart(2, "0")}
        <i /> SCROLL TO MOVE THROUGH THE WORK
      </p>
    </div>
  );
}
