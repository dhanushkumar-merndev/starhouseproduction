const fs = require('fs');

const tsxPath = 'src/components/site/page-transition.tsx';
let tsx = fs.readFileSync(tsxPath, 'utf8');
tsx = tsx.replace(
  '<rect x="0" y="0" width="100" height="100" fill="#0b0c0b" mask={`url(#${maskId})`} />',
  '<rect x="0" y="0" width="100" height="100" fill="#0b0c0b" mask={`url(#${maskId})`} />\n        <rect x="0" y="0" width="100" height="100" fill="#0b0c0b" className={styles.shutterFade} />'
);
fs.writeFileSync(tsxPath, tsx);

const cssPath = 'src/components/site/page-transition.module.css';
let css = fs.readFileSync(cssPath, 'utf8');

css = css.replace(
  /@keyframes apertureOpen {[\s\S]*?}/,
  '@keyframes apertureOpen {\n  0% { transform: rotate(-20deg) scale(0.8); }\n  100% { transform: rotate(0deg) scale(4.2); }\n}'
);

css = css.replace(
  /@keyframes apertureClose {[\s\S]*?}/,
  '@keyframes apertureClose {\n  0% { transform: rotate(0deg) scale(4.2); }\n  100% { transform: rotate(-20deg) scale(0.8); }\n}'
);

css += `\n
.shutterFade {
  pointer-events: none;
}
.opening .shutterFade {
  animation: fadeOut 300ms ease-out forwards;
}
.closing .shutterFade {
  animation: fadeIn 300ms 600ms ease-in forwards;
}
@keyframes fadeIn {
  0% { opacity: 0; }
  100% { opacity: 1; }
}
@keyframes fadeOut {
  0% { opacity: 1; }
  100% { opacity: 0; }
}
`;
fs.writeFileSync(cssPath, css);
