# Monitor story implementation plan

Goal: Extend the current home camera story into a real monitor zoom, React Bits masonry services, an exploded lens/body/battery service breakdown, and photographic crew and moving fog in the mountain footer.

Architecture: Keep one Three.js canvas and a single Lenis/native scroll position. Preserve named monitor and battery nodes while batching static geometry. Project the actual monitor glass corners into CSS with a homography so one live services component remains attached to the glass and becomes full-screen without swapping designs. Pure timeline functions define travel, entry, browsing, exit, exploded view, and footer stages.

Constraints: Maintain the existing dark intro, current white background, opaque rig, separate routes, current Inter typography and 9:16 project artwork. No drag controls. Reduced-motion and failed-WebGL users get readable, normal-flow services and footer. Footer imagery alone restores the earlier mountains.

- [x] Preserve monitor/battery groups and cover timeline/homography corner mapping with Node tests.
- [x] Adapt the requested React Bits Masonry with its attribution; make service cards responsive and link to the services page.
- [x] Align the camera to the physical monitor normal, push in to a viewport-shaped region, and project the same HTML into the glass throughout entry and exit.
- [x] Explode actual lens/body/battery groups, project service callouts then move the dismantled rig out. Replace the footer figures with a grounded photographic crew scene, a slow full-scene pan and drifting fog, following the user’s final correction.
- [x] Integrate mountain footer links and normal-flow accessibility fallbacks. Keep route navigation and enquiry working.
- [x] Run lint/build, pure geometry tests, and desktop/mobile forward/reverse browser checks including reduced-motion.

Review focus: monitor world transforms survive batching; reverse scroll has no flashes; labels don't collide on mobile; hidden interfaces aren't focusable; scene teardown frees render resources and scroll state.

Validation: production build, ESLint and all three geometry/timeline tests pass. Browser checks cover desktop1440×900 and mobile390×844 forward and reverse scrolling, exact monitor viewport alignment, reduced motion and browser/WebGL errors. Keyboard focus advances the main timeline rather than scrolling the monitor internally. Grounded crew backgrounds and transparent fog asset are documented in `docs/homepage-assets.md`.
