const BLADES = 8;
const radius = 30;

function bladeSeams(radius) {
  return Array.from({ length: BLADES }, (_, index) => {
    const a1 = (index / BLADES) * Math.PI * 2 - Math.PI / 2;
    // We want the seam to extend along the edge from vertex i to vertex i-1 (or i+1).
    // Let's use i+1.
    const a2 = ((index + 1) / BLADES) * Math.PI * 2 - Math.PI / 2;
    
    const startX = 50 + radius * Math.cos(a1);
    const startY = 50 + radius * Math.sin(a1);
    
    const nextX = 50 + radius * Math.cos(a2);
    const nextY = 50 + radius * Math.sin(a2);
    
    const angle = Math.atan2(nextY - startY, nextX - startX);
    const L = 10000;
    
    const endX = startX + L * Math.cos(angle);
    const endY = startY + L * Math.sin(angle);
    
    return `M ${startX.toFixed(2)} ${startY.toFixed(2)} L ${endX.toFixed(2)} ${endY.toFixed(2)}`;
  });
}
console.log(bladeSeams(30)[0]);
