// Chess piece SVG definitions — custom designed, 45×45 viewBox

function _build(type, fill, stroke) {
  const A = `fill="${fill}" stroke="${stroke}" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"`;
  const BASE  = `<rect x="9.5" y="36.5" width="26" height="4.5" rx="2.2" ${A}/>`;
  const SKIRT = `<path d="M 12,36.5 Q 11.5,30 22.5,29 Q 33.5,30 33,36.5 Z" ${A}/>`;

  switch (type) {
    case 'P': return `${BASE}
      <path d="M 16.5,36.5 Q 16,27 22.5,24.5 Q 29,27 28.5,36.5 Z" ${A}/>
      <ellipse cx="22.5" cy="20.5" rx="4.5" ry="3.5" ${A}/>
      <circle  cx="22.5" cy="13"   r="5.5"  ${A}/>`;

    case 'R': return `${BASE}
      <rect x="12" y="21" width="21" height="15.5" ${A}/>
      <path d="M 10,21 L 10,11 L 14,11 L 14,16 L 18,16 L 18,11 L 22.5,11
               L 22.5,16 L 27,16 L 27,11 L 31,11 L 31,16 L 35,16 L 35,21 Z" ${A}/>
      <line x1="12" y1="28" x2="33" y2="28" stroke="${stroke}" stroke-width="1.2" opacity="0.4"/>`;

    // Knight: horse-head profile facing right
    case 'N': return `${BASE}
      <rect x="12" y="29.5" width="21" height="7" rx="1.2" ${A}/>
      <path d="M 13.5,29.5 L 14,22 Q 14,14 20,10 L 23,9
               L 21,7 L 24,5.5 L 27.5,8
               Q 33,10.5 34.5,15 L 33,18.5
               Q 29,21.5 25,23 L 25,29.5 Z" ${A}/>
      <circle cx="27" cy="11" r="2.2" fill="${stroke}" stroke="none"/>
      <path d="M 14,22 Q 17.5,20 20.5,22" fill="none" stroke="${stroke}"
            stroke-width="1.2" stroke-linecap="round" opacity="0.75"/>`;

    case 'B': return `${BASE}${SKIRT}
      <path d="M 20,29 Q 17,19 22.5,8.5 Q 28,19 25,29 Z" ${A}/>
      <circle cx="22.5" cy="7.5" r="3.5" ${A}/>
      <line x1="21"   y1="7.5" x2="24"   y2="7.5" stroke="${stroke}" stroke-width="1.5" stroke-linecap="round"/>
      <line x1="22.5" y1="6"   x2="22.5" y2="9"   stroke="${stroke}" stroke-width="1.5" stroke-linecap="round"/>
      <path d="M 16.5,25.5 Q 22.5,23 28.5,25.5" fill="none" stroke="${stroke}" stroke-width="1.2" opacity="0.65"/>`;

    case 'Q': return `${BASE}${SKIRT}
      <path d="M 12.5,29 L 10,16.5 L 16.5,22 L 22.5,8 L 28.5,22 L 35,16.5 L 32.5,29 Z" ${A}/>
      <circle cx="10"   cy="14"  r="3.2" ${A}/>
      <circle cx="22.5" cy="6.5" r="3.2" ${A}/>
      <circle cx="35"   cy="14"  r="3.2" ${A}/>
      <path d="M 12.5,29 Q 22.5,25.5 32.5,29" fill="none" stroke="${stroke}" stroke-width="1.2" opacity="0.5"/>`;

    case 'K': return `${BASE}${SKIRT}
      <path d="M 12.5,29 L 10.5,20 L 22.5,25.5 L 34.5,20 L 32.5,29 Z" ${A}/>
      <rect x="20.5" y="7.5" width="4"  height="21.5" rx="2"   ${A}/>
      <rect x="14"   y="12"  width="17" height="4.5"  rx="2.2" ${A}/>`;

    default: return '';
  }
}

export function getPieceUri(color, type) {
  const isW    = color === 'w';
  const fill   = isW ? '#ffffff' : '#1c1c1c';
  const stroke = isW ? '#2d2d2d' : '#c0c0c0';
  const body   = _build(type.toUpperCase(), fill, stroke);
  const svg    = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 45 45" shape-rendering="geometricPrecision">${body}</svg>`;
  return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
}
