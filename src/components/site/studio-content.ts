export const services = [
  ["Films", "Stories made for the screen.", "Short films, independent stories, and original content — developed with a strong point of view, thoughtful visuals, and a clear narrative. We handle everything from scripting and casting to final delivery, ensuring your vision is fully realized on screen."],
  ["Commercials", "Make your brand impossible to forget.", "From campaign concepts to the final cut, we shape commercials around an idea, an audience, and the feeling you want to leave behind. Our team brings cinematic quality to projects of all scales, helping you connect deeply with consumers."],
  ["Reels", "Small screens. Big possibilities.", "Short-form stories, social edits, and vertical films designed to hold attention and make every second count. We craft high-energy, engaging content optimized for the fast-paced scrolling environments of TikTok, Reels, and Shorts."],
  ["Brand stories", "Find the human story behind the brand.", "People, places, and purpose brought together through interviews, documentary approaches, and cinematic brand storytelling. We dig past the corporate messaging to find the authentic voices and real-world impact that define who you are."],
  ["Post-production", "Where the story finds its final shape.", "Editing, colour, sound, and finishing — bringing every image and every beat together into one considered film. Our in-house suites offer industry-leading color grading, meticulous sound design, and seamless visual effects integration."],
];

/**
 * The reel wall's cards. Most are a column of the four-frame contact sheet
 * (public/images/visual-directions.webp); the rest carry their own file, so
 * each card names its image, how it is sized and which part of it is shown.
 */
export const reels = [
  {
    title: "Fashion film",
    kicker: "STYLE / PEOPLE",
    tagline: "STYLE / PEOPLE / PERSPECTIVE",
    image: "/images/visual-directions.webp",
    size: "400% auto",
    frame: "0% center",
    headline: "Movement, fabric,\nand the light between",
    detail: "A study in movement, fabric, and light — a fashion story imagined against an open mountain landscape, shot to feel like weather rather than a catalogue.",
    facts: ["Concept, styling direction and shot list", "Location scouting across two days", "Grade built around late-afternoon light"],
  },
  {
    title: "Food commercial",
    kicker: "TASTE / CRAFT",
    tagline: "TASTE / STORY / EMOTION",
    image: "/images/visual-directions.webp",
    size: "400% auto",
    frame: "33.333% center",
    headline: "The second before\nthe first bite",
    detail: "Close-up craft, tactile detail, and anticipation. A visual direction for a food campaign where the hero shot is a texture, not a logo.",
    facts: ["Macro package and motion control", "Food styling on set, shot in sequence", "Sound design built from the room"],
  },
  {
    title: "Brand film",
    kicker: "PLACE / PEOPLE",
    tagline: "BRANDS / PEOPLE / CULTURE",
    image: "/images/visual-directions.webp",
    size: "400% auto",
    frame: "66.667% center",
    headline: "A story grounded\nin where it happens",
    detail: "Built around the people who give a place meaning. Documentary interviews cut against observed footage, so the brand arrives last and earns it.",
    facts: ["Interview-led, two-camera set-up", "Cut for a 90-second and a 30-second", "Delivered in four regional languages"],
  },
  {
    title: "Product film",
    kicker: "DESIGN / DESIRE",
    tagline: "DETAILS / DESIGN / DESIRE",
    image: "/images/visual-directions.webp",
    size: "400% auto",
    frame: "100% center",
    headline: "Precision, texture,\nand purposeful light",
    detail: "A cinematic direction for bringing a product into focus — deliberate light, controlled motion, and a rhythm that lets the object speak for itself.",
    facts: ["Studio build with a turntable rig", "Every move keyframed and repeatable", "Stills pulled from the same set-up"],
  },
  {
    title: "On location",
    kicker: "CREW / PLACE",
    tagline: "CREW / SCALE / WEATHER",
    image: "/images/film-crew.webp",
    size: "cover",
    frame: "center",
    headline: "Built for the day\nthe weather turns",
    detail: "Location work where the schedule bends around the light. A crew sized to move, and a plan that survives contact with the mountain.",
    facts: ["Unit moves planned around the light", "Weather cover written into the schedule", "Stills and film captured on the same day"],
  },
  {
    title: "The landscape",
    kicker: "SCALE / LIGHT",
    tagline: "SCALE / SILENCE / LIGHT",
    image: "/images/mountain-landscape.webp",
    size: "cover",
    frame: "center",
    headline: "Where the frame\ngets its scale",
    detail: "Wide country, long lenses, and the patience to wait for the one hour that makes the shot. Landscape used as a character, not a backdrop.",
    facts: ["Scouted for a single hour of light", "Long-lens compression, locked off", "Graded for depth rather than contrast"],
  },
] as const;
