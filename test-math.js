const BLADES = 8;
const radius = 30;
function bladeSeams(radius) {
  return Array.from({ length: BLADES }, (_, index) => {
    const angle = (index / BLADES) * Math.PI * 2 - Math.PI / 2;
    const L = 100000;
    
    // Start point on the circle
    const startX = 50 + radius * Math.cos(angle);
    const startY = 50 + radius * Math.sin(angle);
    
    // End point along the tangent
    // Tangent angle is angle + PI/2 or angle - PI/2 depending on which way blades overlap
    const tangentAngle = angle + 0.2; // Let's just use a slight angle outward
    const endX = startX + L * Math.cos(tangentAngle);
    const endY = startY + L * Math.sin(tangentAngle);
    
    return `M ${startX.toFixed(2)} ${startY.toFixed(2)} L ${endX.toFixed(2)} ${endY.toFixed(2)}`;
  });
}
console.log(bladeSeams(30)[0]);
