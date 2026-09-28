// The School of The Prophets — lesson illustrations, drawn as SVG scenes.
// Usage: node tools/illustrate.js spec.json  -> writes images/<slug>.svg for each scene
// A scene: {file, sky, ground, rays, items:[{el, x, y, s}], caption}
// Palette: the site's navy, gold, burgundy, parchment.
const fs = require('fs');

const C = { navy:'#14213D', deep:'#0E1830', burg:'#6B1F2E', gold:'#C9A24C', goldS:'#E4CE8E', parch:'#F5EFE1', parchD:'#E8DFC8', ink:'#221A14', olive:'#6B7A3E', oliveD:'#4C5A2A', stone:'#B8A88A', stoneD:'#8E7F63', sea:'#2F5E8C', seaD:'#1E3F62', wood:'#7A4A22', woodD:'#4E2D12', fire:'#E8792A', flame:'#F5C04A', white:'#FFFDF7', cloud:'#F2E9D6' };
const W = 800, H = 450;
let uid = 0; const id = p => `${p}${++uid}`;

// ---------- backgrounds ----------
function sky(kind){
  const g = id('sky');
  const stops = {
    dawn:  [['0%','#F7D9A8'],['45%','#E9B27A'],['100%','#B96A5A']],
    day:   [['0%','#CFE3F3'],['60%','#E9EEF0'],['100%','#F5EFE1']],
    dusk:  [['0%','#2B2F5E'],['55%','#8A4B63'],['100%','#E8A56A']],
    night: [['0%','#0E1830'],['70%','#1C2B52'],['100%','#3D4C78']],
    gold:  [['0%','#FBEFD2'],['55%','#EAD08E'],['100%','#C9A24C']],
    storm: [['0%','#4B4F5E'],['60%','#7E7F8A'],['100%','#C9C4B6']],
    hall:  [['0%','#2A2015'],['70%','#4A3A25'],['100%','#6E5A3E']],
  }[kind] || [['0%','#CFE3F3'],['100%','#F5EFE1']];
  return { defs:`<linearGradient id="${g}" x1="0" y1="0" x2="0" y2="1">${stops.map(s=>`<stop offset="${s[0]}" stop-color="${s[1]}"/>`).join('')}</linearGradient>`,
           body:`<rect width="${W}" height="${H}" fill="url(#${g})"/>` + (kind==='night'?stars():'') };
}
function stars(){ let s=''; let r=7; const rnd=()=>{ r=(r*9301+49297)%233280; return r/233280; };
  for(let i=0;i<70;i++){ const x=rnd()*W, y=rnd()*H*0.6, k=rnd(); s+=`<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${(0.6+k*1.4).toFixed(1)}" fill="#FFF7DC" opacity="${(0.4+k*0.6).toFixed(2)}"/>`; } return s; }
function ground(kind){
  switch(kind){
    case 'hills': return `<path d="M0 330 C120 290 220 300 330 320 S560 280 800 330 L800 450 L0 450Z" fill="${C.olive}"/><path d="M0 360 C180 330 300 350 420 365 S650 340 800 370 L800 450 L0 450Z" fill="${C.oliveD}"/>`;
    case 'desert': return `<path d="M0 320 C150 300 260 330 400 315 S650 300 800 325 L800 450 L0 450Z" fill="#D9B77E"/><path d="M0 370 C200 350 350 380 520 365 S700 350 800 375 L800 450 L0 450Z" fill="#C49A5C"/>`;
    case 'sea': return `<rect x="0" y="300" width="${W}" height="150" fill="${C.sea}"/><path d="M0 300 Q50 292 100 300 T200 300 T300 300 T400 300 T500 300 T600 300 T700 300 T800 300 L800 450 L0 450Z" fill="${C.seaD}" opacity=".55"/>${[320,345,372,400,428].map(y=>`<path d="M0 ${y} Q40 ${y-6} 80 ${y} T160 ${y} T240 ${y} T320 ${y} T400 ${y} T480 ${y} T560 ${y} T640 ${y} T720 ${y} T800 ${y}" fill="none" stroke="#7FA9D0" stroke-width="1.5" opacity=".5"/>`).join('')}`;
    case 'floor': return `<rect x="0" y="330" width="${W}" height="120" fill="${C.stone}"/><rect x="0" y="330" width="${W}" height="6" fill="${C.stoneD}"/>${[0,100,200,300,400,500,600,700].map(x=>`<path d="M${x} 336 L${x-40} 450" stroke="${C.stoneD}" stroke-width="1.5" opacity=".5"/>`).join('')}${[370,410].map(y=>`<line x1="0" y1="${y}" x2="${W}" y2="${y}" stroke="${C.stoneD}" stroke-width="1.5" opacity=".5"/>`).join('')}`;
    case 'plain': return `<path d="M0 340 C200 325 500 355 800 335 L800 450 L0 450Z" fill="#8C8A5C"/><path d="M0 385 C250 370 550 400 800 380 L800 450 L0 450Z" fill="#6E6B44"/>`;
    case 'table': return `<rect x="0" y="330" width="${W}" height="120" fill="${C.wood}"/><rect x="0" y="330" width="${W}" height="8" fill="${C.woodD}"/>${[360,390,420].map(y=>`<path d="M0 ${y} C200 ${y-4} 400 ${y+4} 800 ${y}" stroke="${C.woodD}" stroke-width="1.2" fill="none" opacity=".5"/>`).join('')}`;
    default: return '';
  }
}
function rays(cx=400, cy=-40, n=14, col='#FFF3C4'){ let s=`<g opacity=".35">`; for(let i=0;i<n;i++){ const a=(i/n)*Math.PI*2; const x=cx+Math.cos(a)*900, y=cy+Math.sin(a)*900; const a2=a+0.06; const x2=cx+Math.cos(a2)*900, y2=cy+Math.sin(a2)*900; s+=`<path d="M${cx} ${cy} L${x.toFixed(0)} ${y.toFixed(0)} L${x2.toFixed(0)} ${y2.toFixed(0)}Z" fill="${col}"/>`; } return s+'</g>'; }
function glow(cx, cy, r, col='#FFF3C4'){ const g=id('gl'); return { defs:`<radialGradient id="${g}"><stop offset="0%" stop-color="${col}" stop-opacity=".9"/><stop offset="100%" stop-color="${col}" stop-opacity="0"/></radialGradient>`, body:`<circle cx="${cx}" cy="${cy}" r="${r}" fill="url(#${g})"/>` }; }

// ---------- elements (each drawn around origin, ~200px wide at s=1) ----------
const E = {};
E.sun = () => `<circle r="42" fill="#FFE9A3"/><circle r="30" fill="#FFF6D6"/>`;
E.moon = () => `<path d="M-20 -40 A44 44 0 1 0 -20 40 A34 34 0 1 1 -20 -40Z" fill="#FFF3C4"/>`;
E.cloud = () => `<g fill="${C.cloud}" opacity=".9"><ellipse cx="0" cy="0" rx="70" ry="24"/><ellipse cx="-30" cy="-12" rx="38" ry="26"/><ellipse cx="22" cy="-16" rx="42" ry="30"/></g>`;
E.bible = () => `<g><path d="M-110 20 L-110 -60 Q-100 -70 0 -62 Q100 -70 110 -60 L110 20 Q100 30 0 22 Q-100 30 -110 20Z" fill="${C.burg}"/><path d="M-100 8 L-100 -58 Q-90 -66 -4 -58 L-4 14 Q-90 20 -100 8Z" fill="${C.parch}"/><path d="M100 8 L100 -58 Q90 -66 4 -58 L4 14 Q90 20 100 8Z" fill="${C.parch}"/>${[-48,-40,-32,-24,-16,-8,0].map(y=>`<line x1="-88" y1="${y}" x2="-14" y2="${y+2}" stroke="${C.stoneD}" stroke-width="1.6" opacity=".7"/><line x1="14" y1="${y+2}" x2="88" y2="${y}" stroke="${C.stoneD}" stroke-width="1.6" opacity=".7"/>`).join('')}<path d="M-2 -60 L-2 16" stroke="${C.burg}" stroke-width="3"/><path d="M0 -70 L0 -52 M-8 -64 L8 -64" stroke="${C.gold}" stroke-width="3" stroke-linecap="round"/><path d="M-30 22 L-30 34 L-22 30 L-14 34 L-14 22" fill="${C.gold}"/></g>`;
E.scroll = () => `<g><rect x="-90" y="-50" width="180" height="100" rx="4" fill="${C.parch}" stroke="${C.stoneD}"/>${[-30,-16,-2,12,26].map(y=>`<line x1="-70" y1="${y}" x2="70" y2="${y}" stroke="${C.stoneD}" stroke-width="2" opacity=".7"/>`).join('')}<rect x="-100" y="-58" width="16" height="116" rx="8" fill="${C.wood}"/><rect x="84" y="-58" width="16" height="116" rx="8" fill="${C.wood}"/><circle cx="-92" cy="-58" r="8" fill="${C.gold}"/><circle cx="-92" cy="58" r="8" fill="${C.gold}"/><circle cx="92" cy="-58" r="8" fill="${C.gold}"/><circle cx="92" cy="58" r="8" fill="${C.gold}"/></g>`;
E.lamp = () => `<g><path d="M-40 10 Q-40 40 0 40 Q40 40 40 10 L48 6 Q52 16 62 10 L52 0 Q40 -4 30 4 L-30 4 Q-38 -2 -44 6Z" fill="${C.gold}"/><ellipse cx="0" cy="8" rx="34" ry="8" fill="#B08A3A"/><path d="M56 6 Q64 -14 58 -30 Q70 -14 62 4Z" fill="${C.fire}"/><path d="M58 4 Q62 -8 59 -18 Q64 -8 61 2Z" fill="${C.flame}"/></g>`;
E.candle = () => `<g><rect x="-10" y="-60" width="20" height="90" rx="3" fill="${C.parch}"/><rect x="-24" y="26" width="48" height="10" rx="3" fill="${C.gold}"/><path d="M0 -62 Q-12 -84 0 -104 Q12 -84 0 -62Z" fill="${C.fire}"/><path d="M0 -66 Q-6 -80 0 -92 Q6 -80 0 -66Z" fill="${C.flame}"/></g>`;
E.cross = () => `<g><rect x="-9" y="-110" width="18" height="200" fill="${C.wood}"/><rect x="-60" y="-70" width="120" height="18" fill="${C.wood}"/><rect x="-9" y="-110" width="6" height="200" fill="${C.woodD}"/><rect x="-60" y="-70" width="120" height="5" fill="${C.woodD}"/></g>`;
E.crown = () => `<g><path d="M-70 30 L-80 -30 L-40 0 L0 -50 L40 0 L80 -30 L70 30Z" fill="${C.gold}"/><rect x="-72" y="26" width="144" height="18" rx="4" fill="#B08A3A"/><circle cx="-80" cy="-30" r="7" fill="${C.burg}"/><circle cx="0" cy="-50" r="8" fill="${C.burg}"/><circle cx="80" cy="-30" r="7" fill="${C.burg}"/><circle cx="-36" cy="34" r="5" fill="${C.burg}"/><circle cx="0" cy="34" r="5" fill="${C.burg}"/><circle cx="36" cy="34" r="5" fill="${C.burg}"/></g>`;
E.sword = () => `<g transform="rotate(-30)"><rect x="-6" y="-130" width="12" height="150" fill="#D8D8D8"/><path d="M-6 -130 L0 -150 L6 -130Z" fill="#EDEDED"/><rect x="-36" y="18" width="72" height="12" rx="3" fill="${C.gold}"/><rect x="-7" y="30" width="14" height="40" rx="3" fill="${C.burg}"/><circle cx="0" cy="76" r="9" fill="${C.gold}"/></g>`;
E.shield = () => `<g><path d="M-70 -80 L70 -80 L70 10 Q70 60 0 90 Q-70 60 -70 10Z" fill="${C.navy}" stroke="${C.gold}" stroke-width="6"/><path d="M0 -50 L0 40 M-32 -20 L32 -20" stroke="${C.gold}" stroke-width="10" stroke-linecap="round"/></g>`;
E.scales = () => `<g><rect x="-6" y="-100" width="12" height="150" fill="${C.gold}"/><rect x="-60" y="50" width="120" height="14" rx="4" fill="#B08A3A"/><rect x="-110" y="-100" width="220" height="8" rx="4" fill="${C.gold}"/><line x1="-100" y1="-96" x2="-100" y2="-30" stroke="${C.gold}" stroke-width="3"/><line x1="100" y1="-96" x2="100" y2="-30" stroke="${C.gold}" stroke-width="3"/><path d="M-140 -30 Q-100 10 -60 -30Z" fill="${C.gold}"/><path d="M60 -30 Q100 10 140 -30Z" fill="${C.gold}"/></g>`;
E.coins = () => `<g>${[[-30,20],[-10,26],[10,20],[30,26],[-20,6],[0,12],[20,6],[-10,-8],[10,-8],[0,-22]].map(p=>`<ellipse cx="${p[0]}" cy="${p[1]}" rx="18" ry="8" fill="${C.gold}" stroke="#B08A3A" stroke-width="1.5"/>`).join('')}</g>`;
E.sheaf = () => `<g>${[-24,-12,0,12,24].map((x,i)=>`<path d="M${x} 60 L${x*0.5} -50" stroke="#C9A24C" stroke-width="4" stroke-linecap="round"/><ellipse cx="${x*0.5}" cy="-60" rx="8" ry="18" fill="#E4CE8E" transform="rotate(${x*0.6} ${x*0.5} -60)"/>`).join('')}<path d="M-30 20 Q0 32 30 20" stroke="${C.burg}" stroke-width="6" fill="none"/></g>`;
E.tree = () => `<g><rect x="-10" y="0" width="20" height="90" fill="${C.woodD}"/><circle cx="0" cy="-30" r="60" fill="${C.olive}"/><circle cx="-40" cy="-10" r="40" fill="${C.oliveD}"/><circle cx="42" cy="-14" r="42" fill="${C.olive}"/><circle cx="0" cy="-64" r="36" fill="${C.oliveD}"/></g>`;
E.city = () => `<g fill="${C.stone}">${[[-160,20,50,70],[-110,-10,40,100],[-70,10,60,80],[-10,-30,50,120],[40,0,70,90],[110,-20,50,110],[160,10,40,80]].map(b=>`<rect x="${b[0]}" y="${b[1]}" width="${b[2]}" height="${b[3]}"/>`).join('')}${[[-130,30],[-90,0],[10,-10],[70,20],[130,-5]].map(p=>`<rect x="${p[0]}" y="${p[1]}" width="10" height="16" fill="${C.stoneD}"/>`).join('')}<rect x="-30" y="-60" width="16" height="40" fill="${C.stoneD}"/><path d="M-22 -90 L-40 -60 L-4 -60Z" fill="${C.stoneD}"/></g>`;
E.temple = () => `<g><rect x="-120" y="20" width="240" height="20" fill="${C.stone}"/><rect x="-130" y="40" width="260" height="14" fill="${C.stoneD}"/>${[-100,-60,-20,20,60,100].map(x=>`<rect x="${x-9}" y="-70" width="18" height="90" fill="${C.parch}" stroke="${C.stoneD}"/>`).join('')}<rect x="-120" y="-86" width="240" height="16" fill="${C.stone}"/><path d="M-130 -86 L0 -140 L130 -86Z" fill="${C.stoneD}"/><path d="M-110 -90 L0 -132 L110 -90Z" fill="${C.stone}"/></g>`;
E.tomb = () => `<g><path d="M-100 60 Q-100 -60 0 -70 Q100 -60 100 60Z" fill="${C.stoneD}"/><path d="M-50 60 Q-50 -10 0 -14 Q50 -10 50 60Z" fill="${C.deep}"/><circle cx="-90" cy="30" r="46" fill="${C.stone}" stroke="${C.stoneD}" stroke-width="4"/><circle cx="-90" cy="30" r="14" fill="none" stroke="${C.stoneD}" stroke-width="3"/></g>`;
E.dove = () => `<g fill="${C.white}"><path d="M0 0 Q-30 -20 -60 -6 Q-30 -34 6 -22 Q40 -40 70 -18 Q40 -18 30 -2 Q40 12 26 30 Q20 12 8 8 Q-12 24 -30 22 Q-10 10 0 0Z"/><path d="M6 -22 Q-2 -60 -40 -70 Q-4 -68 16 -30Z"/><circle cx="52" cy="-16" r="2.5" fill="${C.ink}"/></g>`;
E.fire = () => `<g><path d="M0 40 Q-50 10 -34 -40 Q-24 -10 -8 -24 Q-4 -60 20 -80 Q14 -40 30 -22 Q46 -50 44 -20 Q60 10 0 40Z" fill="${C.fire}"/><path d="M0 34 Q-24 14 -14 -14 Q-6 4 4 -6 Q6 -30 18 -40 Q14 -18 22 -6 Q34 12 0 34Z" fill="${C.flame}"/></g>`;
E.water = () => `<g>${[0,14,28].map(y=>`<path d="M-90 ${y} Q-70 ${y-10} -50 ${y} T-10 ${y} T30 ${y} T70 ${y} T110 ${y}" fill="none" stroke="#7FA9D0" stroke-width="5" stroke-linecap="round"/>`).join('')}</g>`;
E.chains = () => `<g fill="none" stroke="#8E8E8E" stroke-width="6">${[0,1,2,3].map(i=>`<ellipse cx="${-70+i*34}" cy="${i%2?8:0}" rx="16" ry="9" transform="rotate(${i%2?20:-20} ${-70+i*34} 0)"/>`).join('')}<path d="M60 -6 L84 -30 M64 6 L90 24" stroke="${C.gold}" stroke-width="5"/></g>`;
E.trumpet = () => `<g transform="rotate(-20)"><rect x="-90" y="-8" width="120" height="16" rx="6" fill="${C.gold}"/><path d="M30 -20 L90 -46 L90 46 L30 20Z" fill="${C.gold}"/><path d="M90 -46 Q104 0 90 46" fill="#B08A3A"/></g>`;
E.mountain = () => `<g><path d="M-200 100 L-60 -110 L80 100Z" fill="${C.stoneD}"/><path d="M-20 100 L100 -60 L220 100Z" fill="${C.stone}"/><path d="M-84 -74 L-60 -110 L-36 -74 L-48 -66 L-60 -78 L-72 -66Z" fill="${C.white}"/></g>`;
E.path = () => `<path d="M-40 120 Q-10 40 60 0 Q100 -20 180 -40 L200 -30 Q120 -8 70 20 Q10 60 20 120Z" fill="#D9B77E" opacity=".9"/>`;
E.gate = () => `<g><rect x="-90" y="-100" width="24" height="200" fill="${C.stone}"/><rect x="66" y="-100" width="24" height="200" fill="${C.stone}"/><path d="M-90 -100 Q0 -190 90 -100 L90 -80 Q0 -160 -90 -80Z" fill="${C.stoneD}"/><path d="M-60 100 L-60 -70 Q0 -130 60 -70 L60 100Z" fill="${C.gold}" opacity=".9"/><line x1="0" y1="-118" x2="0" y2="100" stroke="#B08A3A" stroke-width="3"/></g>`;
E.tent = () => `<g><path d="M-120 60 L0 -80 L120 60Z" fill="${C.parchD}"/><path d="M-120 60 L0 -80 L0 60Z" fill="${C.stone}"/><path d="M-30 60 L0 10 L30 60Z" fill="${C.deep}"/><line x1="0" y1="-80" x2="0" y2="-110" stroke="${C.wood}" stroke-width="4"/></g>`;
E.chalice = () => `<g><path d="M-40 -60 L40 -60 Q44 0 0 10 Q-44 0 -40 -60Z" fill="${C.gold}"/><rect x="-6" y="10" width="12" height="40" fill="${C.gold}"/><ellipse cx="0" cy="54" rx="30" ry="8" fill="#B08A3A"/><path d="M-30 -58 L30 -58 Q28 -40 0 -36 Q-28 -40 -30 -58Z" fill="${C.burg}"/></g>`;
E.bread = () => `<g><ellipse cx="0" cy="10" rx="60" ry="26" fill="#D8A860"/><ellipse cx="0" cy="0" rx="58" ry="24" fill="#E9BE74"/><path d="M-30 -8 Q-10 4 10 -8 Q30 4 44 -6" fill="none" stroke="#B7853F" stroke-width="3"/></g>`;
E.pillar = () => `<g><rect x="-22" y="-120" width="44" height="220" fill="${C.parch}" stroke="${C.stoneD}"/><rect x="-32" y="-132" width="64" height="14" fill="${C.stone}"/><rect x="-32" y="96" width="64" height="14" fill="${C.stone}"/>${[-12,0,12].map(x=>`<line x1="${x}" y1="-116" x2="${x}" y2="96" stroke="${C.stoneD}" stroke-width="1.5" opacity=".6"/>`).join('')}</g>`;
E.star = () => `<g fill="${C.goldS}"><path d="M0 -60 L10 -12 L60 0 L10 12 L0 60 L-10 12 L-60 0 L-10 -12Z"/><path d="M0 -30 L6 -6 L30 0 L6 6 L0 30 L-6 6 L-30 0 L-6 -6Z" transform="rotate(45)" opacity=".8"/></g>`;
E.keyring = () => `<g><circle cx="-40" cy="0" r="26" fill="none" stroke="${C.gold}" stroke-width="10"/><rect x="-14" y="-6" width="90" height="12" fill="${C.gold}"/><rect x="50" y="6" width="10" height="18" fill="${C.gold}"/><rect x="66" y="6" width="10" height="24" fill="${C.gold}"/></g>`;
E.anchor = () => `<g fill="none" stroke="${C.navy}" stroke-width="10" stroke-linecap="round"><circle cx="0" cy="-70" r="14"/><line x1="0" y1="-56" x2="0" y2="70"/><line x1="-50" y1="-20" x2="50" y2="-20"/><path d="M-70 30 Q-40 80 0 70 Q40 80 70 30"/></g>`;
E.hourglass = () => `<g><rect x="-50" y="-90" width="100" height="12" rx="4" fill="${C.wood}"/><rect x="-50" y="78" width="100" height="12" rx="4" fill="${C.wood}"/><path d="M-40 -78 L40 -78 L4 0 L40 78 L-40 78 L-4 0Z" fill="#DDEBF3" stroke="${C.stoneD}" stroke-width="2"/><path d="M-30 -74 L30 -74 L2 -10 L-2 -10Z" fill="#D9B77E"/><path d="M-36 76 L36 76 L8 46 L-8 46Z" fill="#D9B77E"/></g>`;
E.seal = () => `<g><circle r="58" fill="${C.burg}"/><circle r="48" fill="none" stroke="${C.gold}" stroke-width="3"/><path d="M0 -30 L0 26 M-20 -10 L20 -10" stroke="${C.gold}" stroke-width="8" stroke-linecap="round"/></g>`;
E.podium = () => `<g><rect x="-60" y="-20" width="120" height="120" fill="${C.wood}"/><rect x="-70" y="-30" width="140" height="14" fill="${C.woodD}"/><rect x="-46" y="-6" width="92" height="90" fill="none" stroke="${C.woodD}" stroke-width="3"/></g>`;
E.book_stack = () => `<g><rect x="-70" y="10" width="140" height="26" rx="3" fill="${C.navy}"/><rect x="-62" y="-16" width="126" height="26" rx="3" fill="${C.burg}"/><rect x="-56" y="-42" width="112" height="26" rx="3" fill="${C.oliveD}"/>${[22,-4,-30].map(y=>`<line x1="-40" y1="${y}" x2="40" y2="${y}" stroke="${C.gold}" stroke-width="2"/>`).join('')}</g>`;
E.sunrise_arc = () => `<g><path d="M-120 0 A120 120 0 0 1 120 0Z" fill="#FFE9A3"/><path d="M-90 0 A90 90 0 0 1 90 0Z" fill="#FFF6D6"/></g>`;
E.thunder = () => `<path d="M-10 -60 L20 -60 L4 -14 L30 -14 L-14 60 L-4 6 L-26 6Z" fill="${C.goldS}"/>`;
E.olive_branch = () => `<g><path d="M-80 20 Q0 -30 90 -10" fill="none" stroke="${C.oliveD}" stroke-width="4"/>${[-60,-40,-20,0,20,40,60].map((x,i)=>`<ellipse cx="${x}" cy="${-5 - Math.sin(i)*8}" rx="14" ry="6" fill="${C.olive}" transform="rotate(${i%2?30:-30} ${x} ${-5})"/>`).join('')}</g>`;
E.wall = () => `<g>${[0,1,2,3].map(r=>[0,1,2,3,4,5].map(c=>`<rect x="${-150+c*50+(r%2?25:0)}" y="${-60+r*30}" width="48" height="28" fill="${r%2?C.stone:C.stoneD}" stroke="#7A6B50"/>`).join('')).join('')}</g>`;
E.harp = () => `<g><path d="M-50 60 Q-70 -60 20 -70 Q60 -60 60 -20 L60 60Z" fill="none" stroke="${C.gold}" stroke-width="10" stroke-linejoin="round"/>${[-30,-16,-2,12,26,40].map(x=>`<line x1="${x}" y1="${-64+(x+30)*0.3}" x2="${x}" y2="60" stroke="${C.goldS}" stroke-width="2"/>`).join('')}</g>`;
E.helmet = () => `<g><path d="M-60 20 Q-60 -70 0 -70 Q60 -70 60 20 L60 40 L-60 40Z" fill="#B7B7B7"/><path d="M-6 -80 L6 -80 L6 -30 L-6 -30Z" fill="${C.burg}"/><path d="M-60 40 L-60 20 L-20 20 L-20 40 M20 40 L20 20 L60 20 L60 40" fill="#8E8E8E"/></g>`;
E.hand_lamp_stand = () => `<g><rect x="-6" y="-80" width="12" height="160" fill="${C.gold}"/><rect x="-40" y="76" width="80" height="12" rx="4" fill="#B08A3A"/>${[-60,-30,0,30,60].map((x,i)=>`<path d="M0 ${-20+Math.abs(x)*0.4} Q${x*0.6} ${-20} ${x} -80" fill="none" stroke="${C.gold}" stroke-width="7"/><path d="M${x} -84 Q${x-8} -104 ${x} -122 Q${x+8} -104 ${x} -84Z" fill="${C.fire}"/><path d="M${x} -88 Q${x-4} -100 ${x} -110 Q${x+4} -100 ${x} -88Z" fill="${C.flame}"/>`).join('')}<path d="M0 -84 Q-8 -104 0 -122 Q8 -104 0 -84Z" fill="${C.fire}"/></g>`;

// ---------- compose ----------
function scene(sp){
  uid = 0; const defs=[]; let body='';
  const sk = sky(sp.sky||'day'); defs.push(sk.defs); body += sk.body;
  if(sp.rays){ body += rays(sp.rays[0]??400, sp.rays[1]??-40); }
  if(sp.glow){ const g=glow(sp.glow[0], sp.glow[1], sp.glow[2]||200); defs.push(g.defs); body+=g.body; }
  body += ground(sp.ground||'hills');
  for(const it of (sp.items||[])){ const fn=E[it.el]; if(!fn){ console.error('unknown element', it.el); continue; }
    body += `<g transform="translate(${it.x} ${it.y}) scale(${it.s||1})${it.r?` rotate(${it.r})`:''}">${fn()}</g>`; }
  // vignette + frame
  const v=id('vg'); defs.push(`<radialGradient id="${v}" cx="50%" cy="50%" r="70%"><stop offset="60%" stop-color="#000" stop-opacity="0"/><stop offset="100%" stop-color="#000" stop-opacity=".28"/></radialGradient>`);
  body += `<rect width="${W}" height="${H}" fill="url(#${v})"/>`;
  body += `<rect x="6" y="6" width="${W-12}" height="${H-12}" fill="none" stroke="${C.gold}" stroke-width="3"/><rect x="14" y="14" width="${W-28}" height="${H-28}" fill="none" stroke="${C.gold}" stroke-width="1" opacity=".7"/>`;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" role="img" aria-label="${(sp.alt||sp.caption||'').replace(/"/g,'&quot;')}"><defs>${defs.join('')}</defs>${body}</svg>`;
}

if (require.main === module){
  const spec = JSON.parse(fs.readFileSync(process.argv[2],'utf8'));
  fs.mkdirSync('images', {recursive:true});
  for(const sp of spec){ fs.writeFileSync(`images/${sp.file}.svg`, scene(sp)); }
  console.log(spec.length+' scenes written');
}
module.exports = { scene, elements:Object.keys(E) };
