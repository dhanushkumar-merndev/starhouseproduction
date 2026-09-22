/** The same scroll position always produces the same shot, in either direction. */
const clamp = (value: number) => Math.max(0, Math.min(1, value));
const ease = (value: number, start: number, end: number) => {
  const t = clamp((value - start) / (end - start));
  return t * t * (3 - 2 * t);
};
export function storyTimeline(value: number) {
  const p = clamp(value);
  return {
    travel: ease(p, 0, 0.18),
    approach: ease(p, 0.21, 0.29),
    enter: ease(p, 0.29, 0.4),
    browse: clamp((p - 0.4) / 0.2),
    exit: ease(p, 0.61, 0.73),
    explode: ease(p, 0.73, 0.8),
    footer: ease(p, 0.87, 0.97),
    servicesActive: p >= 0.4 && p <= 0.61,
  };
}

type Point = readonly [number, number];
/** Map a viewport-sized HTML surface onto four projected monitor corners. */
export function quadTransform(points: readonly Point[], width: number, height: number) {
  const [[x0,y0],[x1,y1],[x2,y2],[x3,y3]] = points;
  const dx1=x1-x2, dx2=x3-x2, dx3=x0-x1+x2-x3;
  const dy1=y1-y2, dy2=y3-y2, dy3=y0-y1+y2-y3;
  const determinant=dx1*dy2-dx2*dy1;
  const g=Math.abs(determinant)<1e-9?0:(dx3*dy2-dx2*dy3)/determinant;
  const h=Math.abs(determinant)<1e-9?0:(dx1*dy3-dx3*dy1)/determinant;
  return [
    (x1-x0+g*x1)/width,(y1-y0+g*y1)/width,0,g/width,
    (x3-x0+h*x3)/height,(y3-y0+h*y3)/height,0,h/height,
    0,0,1,0,x0,y0,0,1,
  ];
}
