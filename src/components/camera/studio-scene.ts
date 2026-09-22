import * as THREE from "three";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";
import { createCameraBase } from "./camera-base";
import { createCameraBody } from "./camera-body";
import { createCameraLens } from "./camera-lens";
import { createLensBrandTexture } from "./lens-brand";
import { configureModelQuality } from "./model-utils";
import { storyTimeline } from "./scroll-story";
import { monitorRegion, projectScreenPortal } from "./screen-portal";

export type SceneState = { phase: "intro" | "reveal" | "ready"; progress: number; surface?: "hero" | "monitor" | "parts" | "footer" };

// Batch static parts by material instead of issuing one draw call per bolt.
function batchStaticMeshes(model: THREE.Group) {
  model.updateWorldMatrix(true, true);
  const inverseRoot = model.matrixWorld.clone().invert();
  const batches = new Map<THREE.Material, { geometry: THREE.BufferGeometry; mesh: THREE.Mesh }[]>();
  model.traverse((object) => {
    if (!(object instanceof THREE.Mesh) || object instanceof THREE.InstancedMesh || Array.isArray(object.material) || object.material.transparent) return;
    let ancestor: THREE.Object3D | null = object;
    while (ancestor && ancestor !== model) {
      if (ancestor.userData.keepSeparate) return;
      ancestor = ancestor.parent;
    }
    const geometry = object.geometry.index ? object.geometry.toNonIndexed() : object.geometry.clone();
    for (const attribute of Object.keys(geometry.attributes)) {
      if (!["position", "normal", "uv"].includes(attribute)) geometry.deleteAttribute(attribute);
    }
    if (!geometry.getAttribute("normal")) geometry.computeVertexNormals();
    if (!geometry.getAttribute("uv")) geometry.setAttribute("uv", new THREE.Float32BufferAttribute(new Float32Array(geometry.getAttribute("position").count * 2), 2));
    geometry.applyMatrix4(new THREE.Matrix4().multiplyMatrices(inverseRoot, object.matrixWorld));
    const batch = batches.get(object.material) ?? [];
    batch.push({ geometry, mesh: object });
    batches.set(object.material, batch);
  });
  const disposed = new Set<THREE.BufferGeometry>();
  for (const [material, parts] of batches) {
    const geometry = mergeGeometries(parts.map((part) => part.geometry), false);
    if (geometry) {
      const mesh = new THREE.Mesh(geometry, material);
      mesh.castShadow = mesh.receiveShadow = true;
      model.add(mesh);
      for (const part of parts) {
        part.mesh.removeFromParent();
        if (!disposed.has(part.mesh.geometry)) {
          part.mesh.geometry.dispose();
          disposed.add(part.mesh.geometry);
        }
      }
    }
    parts.forEach((part) => part.geometry.dispose());
  }
}

export async function mountCameraScene(
  host: HTMLDivElement,
  onStateChange: (state: SceneState) => void,
  signal: AbortSignal,
) {
  const brandTexture = await createLensBrandTexture(signal);
  if (signal.aborted) {
    brandTexture.dispose();
    signal.throwIfAborted();
  }
  let renderer: THREE.WebGLRenderer;
  try {
    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: "high-performance" });
  } catch (error) {
    brandTexture.dispose();
    throw error;
  }
  const compactDevice = window.matchMedia("(pointer: coarse)").matches || window.innerWidth < 768;
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, compactDevice ? 1.25 : 1.75));
  renderer.setClearColor(0x000000, 0);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.18;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFShadowMap;
  renderer.shadowMap.autoUpdate = false;
  renderer.domElement.setAttribute("aria-hidden", "true");
  host.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(28, 1, 0.05, 150);
  const motionPreference = window.matchMedia("(prefers-reduced-motion: reduce)");

  const studio = new RoomEnvironment();
  const pmrem = new THREE.PMREMGenerator(renderer);
  const environment = pmrem.fromScene(studio, 0.045);
  scene.environment = environment.texture;
  scene.environmentIntensity = 0.85;
  studio.dispose();
  pmrem.dispose();

  const key = new THREE.DirectionalLight(0xfff5e7, 3.2);
  key.position.set(-3.5, 7, 5);
  key.target.position.set(0, 1.6, 0);
  scene.add(key, key.target);
  key.castShadow = true;
  key.shadow.mapSize.set(compactDevice ? 512 : 1024, compactDevice ? 512 : 1024);
  Object.assign(key.shadow.camera, { left: -7, right: 7, top: 7, bottom: -7, near: 0.1, far: 30 });
  key.shadow.bias = -0.001;
  key.shadow.normalBias = 0.03;
  const fill = new THREE.DirectionalLight(0xeaf1ff, 1.5);
  fill.position.set(5, 3, -5);
  scene.add(fill);
  const rim = new THREE.DirectionalLight(0xffffff, 2);
  rim.position.set(1, 6, -2);
  scene.add(rim, new THREE.HemisphereLight(0xffffff, 0x8d8a82, 0.75));

  const model = new THREE.Group();
  model.name = "Cinema camera rig";
  configureModelQuality(compactDevice);
  const body = createCameraBody();
  const lens = createCameraLens(brandTexture);
  const monitor = body.getObjectByName("Camera monitor") as THREE.Group;
  const display = body.getObjectByName("Monitor services display") as THREE.Mesh<THREE.PlaneGeometry, THREE.MeshBasicMaterial>;
  const battery = body.getObjectByName("Camera battery assembly") as THREE.Group;
  display.material.map?.dispose();
  display.material.map = null;
  display.material.color.set("#101112");
  display.material.needsUpdate = true;
  batchStaticMeshes(monitor);
  batchStaticMeshes(battery);
  const opticalMaterial = (lens.getObjectByName("Curved multicoated optical element") as THREE.Mesh<THREE.BufferGeometry, THREE.ShaderMaterial>).material;
  opticalMaterial.uniforms.brandOpacity.value = 0;
  // Keep the complete rig solid. The camera path reveals its shape naturally.
  const matteBox = lens.getObjectByName("Open carbon fiber matte box") as THREE.Group;
  matteBox.removeFromParent();
  const revealedRig = new THREE.Group();
  body.position.y = 0.2;
  revealedRig.add(createCameraBase(), body);
  batchStaticMeshes(revealedRig);
  batchStaticMeshes(lens);
  batchStaticMeshes(matteBox);
  lens.position.y = 0.2;
  matteBox.position.y = 0.2;
  model.add(lens);
  model.add(revealedRig, matteBox);
  scene.add(model);
  model.traverse(object => { if (object instanceof THREE.Mesh) object.castShadow = true; });

  let disposed = false;
  let width = 0;
  let height = 0;
  let introDistance = 3;
  let overviewDistance = 15;
  let storyTime = 0;
  let playing = !motionPreference.matches;
  let progress = motionPreference.matches ? 1 : 0;
  let previousTime = 0;
  let lastState = "";
  let scrollProgress = 0;
  let desiredScroll = 0;
  let frame: number | null = null;
  let shadowPose = "";
  const lensTarget = new THREE.Vector3(-2.72, 2.23, 0);
  const overviewTarget = new THREE.Vector3(-0.25, 2.5, 0);
  const frontOrbit = new THREE.Spherical().setFromVector3(new THREE.Vector3(-1, 0, 0));
  const finalOrbit = new THREE.Spherical().setFromVector3(new THREE.Vector3(-0.62, 0.12, 1).normalize());
  const orbit = new THREE.Spherical();
  const target = new THREE.Vector3();
  const studioElement = host.parentElement;
  const scrollTrack = studioElement?.parentElement;
  const portal = studioElement?.querySelector<HTMLElement>("#monitor-portal");
  const serviceContent = portal?.querySelector<HTMLElement>("[data-monitor-content]");
  const partsPanel = studioElement?.querySelector<HTMLElement>(".camera-parts");
  const footer = studioElement?.querySelector<HTMLElement>(".mountain-footer");
  const callouts = [...(studioElement?.querySelectorAll<HTMLElement>("[data-part-label]") ?? [])];
  const connectorPaths = [...(studioElement?.querySelectorAll<SVGPolylineElement>("[data-part-connector]") ?? [])];
  const connectorDots = [...(studioElement?.querySelectorAll<SVGCircleElement>("[data-part-dot]") ?? [])];
  const firstCopy = studioElement?.querySelector<HTMLElement>(".hero-copy");
  const secondCopy = studioElement?.querySelector<HTMLElement>(".hero-second-copy");
  const footnote = studioElement?.querySelector<HTMLElement>(".hero-footnote");
  const monitorCenter = new THREE.Vector3();
  const monitorNormal = new THREE.Vector3();
  const monitorUp = new THREE.Vector3();
  const destination = new THREE.Vector3();
  const defaultUp = new THREE.Vector3(0, 1, 0);
  const exitDirection = new THREE.Vector3(-0.6, 0.18, 1).normalize();
  const worldPoint = new THREE.Vector3();

  function requestRender() {
    if (frame === null && !disposed && !document.hidden) frame = requestAnimationFrame(render);
  }

  function updateShot() {
    const shot = storyTimeline(scrollProgress);
    const eased = THREE.MathUtils.smootherstep(progress, 0, 1);
    const turn = THREE.MathUtils.smootherstep(progress, 0.02, 0.92);
    const stacked = width < 900 && height > width * 0.85;
    const shortLandscape = height < 620 && !stacked;
    const tangent = Math.tan(THREE.MathUtils.degToRad(camera.fov / 2));

    lens.position.x = matteBox.position.x = -1.35 * shot.explode;
    battery.position.x = 1.65 * shot.explode;
    battery.position.y = 0.18 * shot.explode;
    model.position.x = -24 * shot.footer;
    model.visible = shot.footer < 0.95;
    model.updateMatrixWorld(true);

    target.copy(lensTarget).lerp(overviewTarget, eased);
    orbit.set(
      THREE.MathUtils.lerp(introDistance, overviewDistance * (1 - shot.travel * 0.04), eased),
      THREE.MathUtils.lerp(frontOrbit.phi, finalOrbit.phi - Math.sin(shot.travel * Math.PI) * 0.14, turn),
      THREE.MathUtils.lerp(frontOrbit.theta, finalOrbit.theta - shot.travel * 1.85, turn),
    );
    camera.position.setFromSpherical(orbit).add(target);
    camera.up.copy(defaultUp);
    let horizontal = (stacked ? THREE.MathUtils.lerp(0.015, -0.035, shot.travel) : THREE.MathUtils.lerp(0.21, -0.225, shot.travel)) * eased;
    let vertical = (stacked ? 0.225 : 0.015) * eased;

    display.getWorldPosition(monitorCenter);
    monitorNormal.set(0, 0, 1).transformDirection(display.matrixWorld);
    monitorUp.set(0, 1, 0).transformDirection(display.matrixWorld);
    const region = monitorRegion(width / height);
    const screenDistance = region.height / (2 * tangent);
    destination.copy(monitorCenter).addScaledVector(monitorNormal, THREE.MathUtils.lerp(4.8, screenDistance, shot.enter));
    camera.position.lerp(destination, shot.approach);
    target.lerp(monitorCenter, shot.approach);
    camera.up.lerp(monitorUp, shot.approach).normalize();
    horizontal *= 1 - shot.approach;
    vertical *= 1 - shot.approach;

    const partsDistance = Math.max(5.6 / (2 * tangent * (stacked ? 0.38 : shortLandscape ? 0.42 : 0.58)), 9.5 / (2 * tangent * camera.aspect * 0.86));
    destination.copy(overviewTarget).addScaledVector(exitDirection, partsDistance);
    camera.position.lerp(destination, shot.exit);
    target.lerp(overviewTarget, shot.exit);
    camera.up.lerp(defaultUp, shot.exit).normalize();
    vertical = THREE.MathUtils.lerp(vertical, shortLandscape ? 0.03 : stacked ? -0.015 : -0.035, shot.exit);

    camera.lookAt(target);
    camera.setViewOffset(width, height, -width * horizontal, -height * vertical, width, height);
    camera.updateMatrixWorld(true);

    const first = 1 - THREE.MathUtils.smoothstep(scrollProgress, 0.015, 0.085);
    const second = THREE.MathUtils.smoothstep(scrollProgress, 0.09, 0.16) * (1 - THREE.MathUtils.smoothstep(scrollProgress, 0.2, 0.25));
    const light = THREE.MathUtils.smootherstep(progress, 0.12, 0.92);
    studioElement?.style.setProperty("--studio-light", light.toFixed(4));
    studioElement?.style.setProperty("--journey", scrollProgress.toFixed(4));
    studioElement?.style.setProperty("--first-copy", first.toFixed(4));
    studioElement?.style.setProperty("--second-copy", second.toFixed(4));
    studioElement?.style.setProperty("--footnote-reveal", (1 - shot.approach).toFixed(4));
    const partsReveal = shot.explode * (1 - THREE.MathUtils.smoothstep(shot.footer, 0, 0.35));
    studioElement?.style.setProperty("--parts-reveal", partsReveal.toFixed(4));
    studioElement?.style.setProperty("--footer-reveal", shot.footer.toFixed(4));
    firstCopy?.toggleAttribute("inert", progress < 0.8 || first < 0.6);
    secondCopy?.toggleAttribute("inert", progress < 0.8 || second < 0.6);
    footnote?.toggleAttribute("inert", progress < 0.8 || shot.approach > 0.4);
    partsPanel?.toggleAttribute("inert", !motionPreference.matches && partsReveal < 0.9);
    footer?.toggleAttribute("inert", !motionPreference.matches && shot.footer < 0.9);

    if (portal && !motionPreference.matches) {
      portal.style.width = `${width}px`;
      portal.style.height = `${height}px`;
      portal.style.setProperty("--services-active", scrollProgress > 0.21 ? "1" : "0");
      const overflow = Math.max(0, (serviceContent?.scrollHeight ?? height) - height + 24);
      portal.style.setProperty("--service-content-y", `${-overflow * shot.browse}px`);
      portal.style.opacity = scrollProgress < 0.2 || scrollProgress > 0.74 ? "0" : "1";
      portal.toggleAttribute("inert", !shot.servicesActive);
      portal.style.pointerEvents = shot.servicesActive ? "auto" : "none";
      projectScreenPortal(display, camera, portal, width, height);
    }

    const labelPoints = [
      [-3.1 - 1.35 * shot.explode, 2.35, 0],
      [0.1, 2.6, 0.65],
      [1.75 + 1.65 * shot.explode, 2.4, 0],
    ];
    callouts.forEach((label, index) => {
      worldPoint.fromArray(labelPoints[index]).applyMatrix4(model.matrixWorld).project(camera);
      const x = (worldPoint.x + 1) * width / 2;
      const y = (1 - worldPoint.y) * height / 2;
      const dockX = width * (stacked ? [0.17, 0.5, 0.83][index] : [0.24, 0.54, 0.79][index]);
      const dockY = height * (shortLandscape ? 0.78 : stacked ? 0.73 : 0.81);
      label.style.setProperty("--part-x", `${dockX}px`);
      label.style.setProperty("--part-y", `${dockY}px`);
      connectorPaths[index]?.setAttribute("points", `${x},${y} ${x},${dockY - 22} ${dockX},${dockY - 22} ${dockX},${dockY}`);
      connectorDots[index]?.setAttribute("cx", String(x));
      connectorDots[index]?.setAttribute("cy", String(y));
    });
    // Allocate the comparison texture before the first lit frame, then only
    // refresh the shadow when the rig's parts move.
    const nextShadowPose = `${shot.explode}:${shot.footer}`;
    renderer.shadowMap.needsUpdate ||= key.shadow.map === null || nextShadowPose !== shadowPose;
    shadowPose = nextShadowPose;
    opticalMaterial.uniforms.brandOpacity.value = (1 - THREE.MathUtils.smoothstep(progress, 0.04, 0.32)) * THREE.MathUtils.smoothstep(storyTime, 0.2, 1.8);

    const surface = scrollProgress >= 0.94 ? "footer" : scrollProgress >= 0.72 ? "parts" : scrollProgress >= 0.29 && scrollProgress <= 0.66 ? "monitor" : "hero";
    studioElement?.setAttribute("data-chapter", surface === "hero" ? scrollProgress > 0.09 ? "craft" : "stories" : surface);
    const phase = progress === 1 ? "ready" : progress > 0.005 ? "reveal" : "intro";
    const rounded = Math.round(progress * 100);
    const state = `${phase}:${rounded}:${surface}`;
    if (state !== lastState) {
      lastState = state;
      onStateChange({ phase, progress: rounded / 100, surface });
    }
  }

  function resize() {
    const rect = host.getBoundingClientRect();
    if (!rect.width || !rect.height || (width === rect.width && height === rect.height)) return;
    width = rect.width;
    height = rect.height;
    camera.aspect = width / height;
    const tangent = Math.tan(THREE.MathUtils.degToRad(camera.fov / 2));
    const stacked = width < 900 && height > width * 0.85;
    const shortScreen = height < 500;
    overviewDistance = Math.max(
      5.4 / (2 * tangent * (stacked ? 0.41 : shortScreen ? 0.69 : 0.77)),
      6.3 / (2 * tangent * camera.aspect * (stacked ? 0.92 : 0.48)),
    );
    // Fit the entire circular rim, including a small top and bottom margin.
    introDistance = 0.04 + 1.32 / (2 * tangent * Math.min(1, camera.aspect) * 0.96);
    renderer.setSize(width, height);
    updateShot();
    requestRender();
  }

  function skip() {
    playing = false;
    progress = 1;
    storyTime = 6.8;
    updateShot();
    renderer.render(scene, camera);
    requestRender();
  }

  function replay() {
    if (motionPreference.matches) { skip(); return; }
    storyTime = 0;
    progress = 0;
    previousTime = 0;
    playing = true;
    updateShot();
    requestRender();
  }

  function render(time: number) {
    frame = null;
    if (disposed) return;
    if (document.hidden) { previousTime = 0; return; }
    const delta = previousTime ? Math.min((time - previousTime) / 1000, 0.1) : 0;
    previousTime = time;
    if (playing) {
      storyTime += delta;
      progress = THREE.MathUtils.clamp((storyTime - 3.2) / 3.6, 0, 1);
      if (progress === 1) playing = false;
    }
    scrollProgress = motionPreference.matches ? 0 : THREE.MathUtils.damp(scrollProgress, desiredScroll, 14, delta || 1 / 60);
    if (Math.abs(scrollProgress - desiredScroll) < 0.0002) scrollProgress = motionPreference.matches ? 0 : desiredScroll;
    updateShot();
    renderer.render(scene, camera);
    if (playing || (!motionPreference.matches && Math.abs(scrollProgress - desiredScroll) > 0.0001)) requestRender();
  }

  function onScroll() {
    // The intro owns the frame while it runs: scrolling neither moves the
    // scene underneath it nor cuts it short.
    if (playing) { requestRender(); return; }
    if (scrollTrack) {
      const rect = scrollTrack.getBoundingClientRect();
      desiredScroll = THREE.MathUtils.clamp(-rect.top / Math.max(1, rect.height - height), 0, 1);
    }
    requestRender();
  }
  function onMotionPreference() {
    if (motionPreference.matches) skip();
  }
  function onVisibility() {
    previousTime = 0;
    if (document.hidden && frame !== null) { cancelAnimationFrame(frame); frame = null; }
    else requestRender();
  }
  function onServiceFocus(event: FocusEvent) {
    if (motionPreference.matches || !storyTimeline(scrollProgress).servicesActive || !serviceContent || !scrollTrack) return;
    const focused = event.target;
    if (!(focused instanceof HTMLElement)) return;
    const contentBox = serviceContent.getBoundingClientRect();
    const focusedBox = focused.getBoundingClientRect();
    const overflow = Math.max(0, serviceContent.scrollHeight - height + 24);
    if (!overflow) return;
    const currentOffset = overflow * storyTimeline(scrollProgress).browse;
    const top = focusedBox.top - contentBox.top;
    const bottom = focusedBox.bottom - contentBox.top;
    let offset = currentOffset;
    if (top - currentOffset < 100) offset = top - 112;
    else if (bottom - currentOffset > height - 24) offset = bottom - height + 24;
    const browse = THREE.MathUtils.clamp(offset / overflow, 0, 1);
    if (Math.abs(offset - currentOffset) < 1) return;
    // Keyboard focus advances the same page timeline; it must not create a
    // second, hidden scroll offset inside the projected monitor.
    desiredScroll = scrollProgress = 0.4 + browse * 0.2;
    const trackTop = scrollTrack.getBoundingClientRect().top + window.scrollY;
    window.scrollTo({ top: trackTop + desiredScroll * (scrollTrack.offsetHeight - height), behavior: "instant" });
    updateShot();
    requestRender();
  }
  portal?.addEventListener("focusin", onServiceFocus);
  const observer = new ResizeObserver(resize);
  observer.observe(host);
  resize();
  onScroll();
  window.addEventListener("scroll", onScroll, { passive: true });
  document.addEventListener("visibilitychange", onVisibility);
  motionPreference.addEventListener("change", onMotionPreference);

  function dispose() {
    if (disposed) return;
    disposed = true;
    if (frame !== null) cancelAnimationFrame(frame);
    observer.disconnect();
    portal?.removeEventListener("focusin", onServiceFocus);
    window.removeEventListener("scroll", onScroll);
    document.removeEventListener("visibilitychange", onVisibility);
    motionPreference.removeEventListener("change", onMotionPreference);
    signal.removeEventListener("abort", dispose);
    const geometries = new Set<THREE.BufferGeometry>();
    const materials = new Set<THREE.Material>();
    const textures = new Set<THREE.Texture>();
    scene.traverse((object) => {
      if (!(object instanceof THREE.Mesh)) return;
      if (object instanceof THREE.InstancedMesh) object.dispose();
      geometries.add(object.geometry);
      for (const material of Array.isArray(object.material) ? object.material : [object.material]) {
        materials.add(material);
        for (const value of Object.values(material)) if (value instanceof THREE.Texture) textures.add(value);
      }
    });
    geometries.forEach((geometry) => geometry.dispose());
    materials.forEach((material) => material.dispose());
    textures.forEach((texture) => texture.dispose());
    brandTexture.dispose();
    environment.dispose();
    key.shadow.dispose();
    renderer.dispose();
    renderer.domElement.remove();
  }
  signal.addEventListener("abort", dispose, { once: true });
  try {
    if (renderer.extensions.has("KHR_parallel_shader_compile")) await renderer.compileAsync(scene, camera);
    else renderer.compile(scene, camera);
    signal.throwIfAborted();
    renderer.render(scene, camera);
    requestRender();
  } catch (error) {
    dispose();
    throw error;
  }
  return { actions: { replay, skip }, dispose };
}
