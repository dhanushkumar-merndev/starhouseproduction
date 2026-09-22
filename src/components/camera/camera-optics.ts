import * as THREE from "three";

/** Convex optical surface with coating reflections instead of a flat colored disc. */
export function createOpticalElement(centerY: number, brandTexture: THREE.Texture): THREE.Mesh {
  const positions: number[] = [];
  const uv: number[] = [];
  const indices: number[] = [];
  const radialSegments = 42;
  const angularSegments = 128;
  const radius = 0.452;
  for (let ring = 0; ring <= radialSegments; ring += 1) {
    const r = ring / radialSegments;
    for (let segment = 0; segment <= angularSegments; segment += 1) {
      const angle = (segment / angularSegments) * Math.PI * 2;
      const y = Math.sin(angle) * r;
      const z = Math.cos(angle) * r;
      positions.push(-2.702 - 0.047 * (1 - r * r), centerY + y * radius, z * radius);
      uv.push(z * 0.5 + 0.5, y * 0.5 + 0.5);
      if (ring < radialSegments && segment < angularSegments) {
        const a = ring * (angularSegments + 1) + segment;
        const b = a + angularSegments + 1;
        indices.push(a, b, a + 1, b, b + 1, a + 1);
      }
    }
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  const glass = new THREE.ShaderMaterial({
    side: THREE.DoubleSide,
    uniforms: {
      brandTexture: { value: brandTexture },
      brandOpacity: { value: 0 },
    },
    vertexShader: `
      varying vec2 opticalUv;
      varying vec3 surfaceNormal;
      varying vec3 viewDirection;
      void main() {
        opticalUv = uv;
        vec4 mv = modelViewMatrix * vec4(position, 1.0);
        surfaceNormal = normalize(normalMatrix * normal);
        viewDirection = normalize(-mv.xyz);
        gl_Position = projectionMatrix * mv;
      }
    `,
    fragmentShader: `
      uniform sampler2D brandTexture;
      uniform float brandOpacity;
      varying vec2 opticalUv;
      varying vec3 surfaceNormal;
      varying vec3 viewDirection;
      float glow(vec2 p, vec2 center, vec2 size) {
        vec2 q = (p - center) / size;
        return exp(-dot(q, q) * 2.0);
      }
      void main() {
        vec2 p = opticalUv * 2.0 - 1.0;
        float r = length(p);
        float angle = atan(p.y, p.x);
        float facing = abs(dot(normalize(surfaceNormal), normalize(viewDirection)));
        float edge = pow(1.0 - facing, 2.0);
        // Absorbing dark glass, with a recessed nearly black optical center.
        vec3 color = vec3(0.0018, 0.0036, 0.0031);
        color += vec3(0.0025, 0.0055, 0.0040) * smoothstep(0.23, 0.9, r);
        float pupil = 1.0 - smoothstep(0.13, 0.32, length(p - vec2(-0.015, 0.015)));
        color *= 1.0 - pupil * 0.8;

        // Weak nested coating arcs are directional, never uniform bright rings.
        float lobes = pow(max(0.0, cos(angle - 2.3)), 5.0)
          + 0.62 * pow(max(0.0, cos(angle + 0.85)), 7.0);
        float coating = pow(0.5 + 0.5 * sin(r * 97.0 + r * r * 16.0), 10.0);
        coating *= smoothstep(0.19, 0.3, r) * (1.0 - smoothstep(0.71, 0.94, r));
        color += vec3(0.008, 0.019, 0.009) * coating * lobes;
        float broadArc = exp(-pow((r - 0.62) / 0.19, 2.0));
        color += vec3(0.013, 0.027, 0.012) * broadArc * lobes;

        // Offset green and amber reflected softboxes suggest multiple internal
        // elements; their highlights are soft and taper into the black pupil.
        vec2 shift = vec2(viewDirection.x, viewDirection.y) * 0.05;
        float upper = glow(p, vec2(-0.26, 0.25) + shift, vec2(0.16, 0.22));
        float upperCore = glow(p, vec2(-0.235, 0.28) + shift, vec2(0.065, 0.115));
        float lower = glow(p, vec2(0.30, -0.25) + shift * 0.5, vec2(0.17, 0.21));
        float amber = glow(p, vec2(0.38, -0.19), vec2(0.09, 0.25));
        color += vec3(0.054, 0.107, 0.024) * upper;
        color += vec3(0.095, 0.135, 0.058) * upperCore;
        color += vec3(0.054, 0.10, 0.031) * lower;
        color += vec3(0.038, 0.027, 0.007) * amber;
        color += vec3(0.016, 0.036, 0.011) * glow(p, vec2(0.105, -0.045), vec2(0.028, 0.048));
        color += vec3(0.018, 0.022, 0.026) * glow(p, vec2(-0.61, 0.49), vec2(0.09, 0.35));
        color += vec3(0.017, 0.02, 0.021) * edge * smoothstep(0.72, 0.95, r);
        color *= 1.0 - smoothstep(0.93, 1.0, r) * 0.78;

        // The identity is reflected in the curved glass, not overlaid on the page.
        float identity = clamp(brandOpacity, 0.0, 1.0);
        vec2 reflectionUv = 0.5 + p * (1.0 + 0.035 * r * r) * (0.5 / 1.12);
        reflectionUv.y -= 0.014 * pow(1.0 - identity, 2.0);
        vec4 brand = texture2D(brandTexture, reflectionUv);
        float visibility = smoothstep(0.16, 0.78, facing);
        // The emblem resolves first, then the lettering, as light crosses the
        // element. Reversing the same value dissolves it during the pullback.
        float revealEdge = 1.12 - identity * 1.44;
        float reveal = smoothstep(-0.16, 0.16, reflectionUv.y - revealEdge);
        float reflectionAlpha = brand.a * smoothstep(0.0, 0.86, identity) * visibility * reveal * 0.62;
        float lightPass = exp(-pow((reflectionUv.y - revealEdge) / 0.11, 2.0));

        // Neutral strokes pick up the optical coating instead of retaining the
        // flat beige of a printed mark. Keep the red brush recognisable, muted
        // by that same glass, without shifting its edges or the small lettering.
        float inkLuminance = dot(brand.rgb, vec3(0.2126, 0.7152, 0.0722));
        vec3 coatedSilver = vec3(inkLuminance) * vec3(0.80, 0.91, 0.84);
        float redInk = smoothstep(0.10, 0.32, brand.r - brand.g);
        vec3 reflectedInk = mix(coatedSilver, brand.rgb * vec3(0.85, 0.77, 0.72), redInk * 0.82);

        // A broad reflection falls across the emblem; the recessed pupil and
        // directional highlights remain visible through every stroke.
        float reflectedLight = 0.28
          + 0.18 * glow(p, vec2(-0.22, 0.32) + shift, vec2(0.65, 0.80))
          + 0.20 * upper + 0.10 * lower
          + 0.025 * coating * lobes + 0.10 * lightPass;
        reflectedLight *= 1.0 - pupil * 0.12;
        // Keep the small wordmark readable while the emblem retains the softer
        // optical reflection. Both still transmit the underlying glass detail.
        float lettering = 1.0 - smoothstep(0.44, 0.50, reflectionUv.y);
        reflectedLight = mix(reflectedLight, 0.68, lettering * 0.9);
        reflectedInk *= reflectedLight;
        color += reflectedInk * reflectionAlpha * (1.0 - color);
        gl_FragColor = vec4(color, 1.0);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }
    `,
  });
  const optic = new THREE.Mesh(geometry, glass);
  optic.name = "Curved multicoated optical element";
  return optic;
}
