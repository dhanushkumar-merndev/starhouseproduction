"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { gsap } from "gsap";
import Link from "next/link";
import MonitorServices from "@/components/site/monitor-services";
import MountainFooter from "@/components/site/mountain-footer";
import SiteHeader from "@/components/site/site-header";
import { setScrollLock } from "@/components/site/scroll-lock";
import type { SceneState } from "./studio-scene";

type SceneActions = { replay: () => void; skip: () => void };

/**
 * Module scope, so the intro plays once per page load: it survives client-side
 * navigation back to the homepage and only resets on a hard refresh.
 */
let introPlayed = false;

/** Never hold the page longer than this, however slowly the scene comes up. */
const INTRO_LOCK_LIMIT = 9000;

function subscribeToMotion(callback: () => void) {
  const preference = window.matchMedia("(prefers-reduced-motion: reduce)");
  preference.addEventListener("change", callback);
  return () => preference.removeEventListener("change", callback);
}

export default function CameraScene() {
  const reducedMotion = useSyncExternalStore(subscribeToMotion, () => window.matchMedia("(prefers-reduced-motion: reduce)").matches, () => false);
  const hostRef = useRef<HTMLDivElement>(null);
  const heroRef = useRef<HTMLDivElement>(null);
  const actionsRef = useRef<SceneActions | null>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [view, setView] = useState<SceneState>({ phase: "intro", progress: 0 });
  const revealed = view.progress > 0.8 || status === "error";
  const staticView = reducedMotion || status === "error";
  // view.progress is the intro's own progress, so this is true for the whole
  // run of it, including the hold before the reveal begins.
  const introRunning = status === "ready" && view.phase !== "ready" && !staticView;

  // Hold the page still for the length of the intro, so a scroll during it
  // cannot leave the page part-way down when it finishes.
  const [lockExpired, setLockExpired] = useState(false);
  useEffect(() => {
    const failsafe = setTimeout(() => setLockExpired(true), INTRO_LOCK_LIMIT);
    return () => clearTimeout(failsafe);
  }, []);

  useEffect(() => {
    if (!introRunning || lockExpired) return;
    const root = document.documentElement;
    const previous = root.style.overflow;
    // A hard refresh restores the old scroll position, which would show the
    // header over the intro and start the story part-way through.
    if ("scrollRestoration" in history) history.scrollRestoration = "manual";
    window.scrollTo(0, 0);
    root.style.overflow = "hidden";
    setScrollLock(true);
    return () => {
      root.style.overflow = previous;
      setScrollLock(false);
    };
  }, [introRunning, lockExpired]);

  // The hero lands on a GSAP timeline: each headline line rises out of its own
  // mask, with the supporting copy following just behind it.
  useEffect(() => {
    if (!revealed || staticView || !heroRef.current) return;
    const context = gsap.context(() => {
      // The start pose lives here rather than in CSS, so if this never runs the
      // headline is simply visible instead of stranded off-screen.
      gsap.set(".hero-line > span", { yPercent: 110 });
      const timeline = gsap.timeline({ defaults: { ease: "power3.out" } });
      timeline
        .to(".hero-eyebrow", { autoAlpha: 1, y: 0, duration: 0.55 }, 0)
        .to(".hero-line > span", { yPercent: 0, duration: 1.1, stagger: 0.09 }, 0.06)
        .to(".hero-description", { autoAlpha: 1, y: 0, duration: 0.7 }, 0.48)
        .to(".hero-work-link", { autoAlpha: 1, y: 0, duration: 0.7 }, 0.6);
    }, heroRef);
    return () => context.revert();
  }, [revealed, staticView]);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    let cancelled = false;
    const abort = new AbortController();
    let teardown: (() => void) | undefined;

    async function initialize() {
      const { mountCameraScene } = await import("./studio-scene");
      if (cancelled) return;
      const scene = await mountCameraScene(host!, setView, abort.signal);
      if (cancelled) { scene.dispose(); return; }
      teardown = scene.dispose;
      actionsRef.current = scene.actions;
      if (introPlayed) scene.actions.skip();
      else introPlayed = true;
      setStatus("ready");
    }
    initialize().catch((error: unknown) => {
      if (cancelled) return;
      console.error("Unable to initialize the camera scene:", error);
      host.parentElement?.style.setProperty("--studio-light", "1");
      setStatus("error");
    });
    return () => {
      cancelled = true;
      abort.abort();
      actionsRef.current = null;
      teardown?.();
    };
  }, []);

  return (
    <>
      <SiteHeader revealed={revealed} tone={view.surface === "monitor" ? "dark" : "light"} />
      <section id="home" className="camera-scroll-track">
      <span id="inside-services" className="story-anchor" aria-hidden="true" />
      <div className="camera-studio" data-phase={view.phase} data-revealed={revealed} data-static={staticView} aria-label="Star Production House">
        <div ref={hostRef} className={`camera-viewport${status === "ready" ? " is-ready" : ""}`} aria-hidden="true" />
        <div className="hero-copy" ref={heroRef} inert={!revealed}>
          <p className="hero-eyebrow">STAR PRODUCTION HOUSE <span>/</span> FILMS &amp; STORIES</p>
          <h1>
            <span className="hero-line"><span>STORIES</span></span>
            <span className="hero-line"><span>THAT <em>STAY.</em></span></span>
          </h1>
          <p className="hero-description">A moment becomes a frame.<br />A frame becomes a feeling.</p>
          <Link className="hero-work-link" href="/projects"><span aria-hidden="true">↗</span> EXPLORE THE WORK</Link>
        </div>
        <div className="hero-second-copy" inert>
          <p className="hero-eyebrow">01 <span>/</span> SHOOT</p>
          <h2>FIND THE<br /><em>FEELING.</em></h2>
          <p>The light. The people. The unrepeatable moment. We bring a story into focus, one frame at a time.</p>
          <Link className="text-link" href="/about-us">THEN, THE EDIT <span aria-hidden="true">↗</span></Link>
        </div>
        <div id="monitor-portal" className="monitor-portal" inert={!staticView} style={{ "--services-active": 0 } as React.CSSProperties}>
          <MonitorServices />
        </div>
        <section className="camera-parts" inert={!staticView} aria-labelledby="camera-parts-title">
          <div className="camera-parts-heading"><p className="hero-eyebrow">EVERY PART HAS A PURPOSE</p><h2 id="camera-parts-title">One story.<br /><em>Every capability.</em></h2></div>
          <svg className="part-connectors" aria-hidden="true"><polyline data-part-connector="lens" /><polyline data-part-connector="body" /><polyline data-part-connector="battery" /><circle data-part-dot="lens" r="3" /><circle data-part-dot="body" r="3" /><circle data-part-dot="battery" r="3" /></svg>
          <Link className="part-label" data-part-label="lens" href="/services"><span>01 / THE LENS</span><strong>Films &amp; cinematography</strong><small>Perspective, light, and the shot.</small></Link>
          <Link className="part-label" data-part-label="body" href="/services"><span>02 / THE CAMERA</span><strong>Commercials &amp; brand stories</strong><small>Ideas made real, frame by frame.</small></Link>
          <Link className="part-label" data-part-label="battery" href="/services"><span>03 / THE POWER</span><strong>Reels &amp; post-production</strong><small>Energy, rhythm, and the final cut.</small></Link>
        </section>
        <MountainFooter staticView={staticView} />
        {status === "loading" && <div className="scene-loading" role="status" aria-label="Loading cinematic introduction"><span /></div>}
        {status === "error" && <p className="scene-fallback">Star Production House<br /><span>Commercials &amp; 4K cinema</span></p>}
      </div>
      </section>
    </>
  );
}
