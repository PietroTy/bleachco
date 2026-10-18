import React from 'react';

export const ECLIPSE_SVG_RAW = `
  <svg viewBox="0 0 800 1000" xmlns="http://www.w3.org/2000/svg" style="width:100%;height:100%;">
    <path d="M220,180 L100,300 L190,350 L190,820 L610,820 L610,350 L700,300 L580,180 L520,230 Q400,290 280,230 Z" fill="#151515" stroke="#3a3a3a" stroke-width="2.4"/>
    <ellipse cx="400" cy="500" rx="145" ry="145" fill="#D4521E" opacity="0.82"/>
    <ellipse cx="400" cy="500" rx="95" ry="95" fill="#0c0c0c" opacity="0.96"/>
    <ellipse cx="400" cy="500" rx="168" ry="168" fill="none" stroke="#D4521E" stroke-width="12" opacity="0.18"/>
    <ellipse cx="400" cy="500" rx="186" ry="186" fill="none" stroke="#D4521E" stroke-width="4" opacity="0.10"/>
    <ellipse cx="260" cy="410" rx="22" ry="18" fill="#D4521E" opacity="0.35"/>
    <ellipse cx="555" cy="580" rx="16" ry="13" fill="#D4521E" opacity="0.28"/>
    <ellipse cx="310" cy="610" rx="10" ry="8" fill="#D4521E" opacity="0.22"/>
    <ellipse cx="500" cy="390" rx="8" ry="6" fill="#D4521E" opacity="0.3"/>
    <path d="M370 355 Q380 340 400 355 Q420 340 430 355" stroke="#D4521E" stroke-width="1.8" fill="none" opacity="0.45"/>
    <path d="M365 645 Q380 660 400 645 Q420 660 435 645" stroke="#D4521E" stroke-width="1.8" fill="none" opacity="0.45"/>
  </svg>
`;

export const SPY_SVG_RAW = `
  <svg viewBox="0 0 800 1000" xmlns="http://www.w3.org/2000/svg" style="width:100%;height:100%;">
    <path d="M220,180 L100,300 L190,350 L190,820 L610,820 L610,350 L700,300 L580,180 L520,230 Q400,290 280,230 Z" fill="#151515" stroke="#3a3a3a" stroke-width="2.4"/>
    <ellipse cx="400" cy="500" rx="160" ry="80" fill="none" stroke="#D4521E" stroke-width="18" opacity="0.8"/>
    <ellipse cx="400" cy="500" rx="52" ry="52" fill="#D4521E" opacity="0.85"/>
    <ellipse cx="400" cy="500" rx="26" ry="26" fill="#080808"/>
    <ellipse cx="416" cy="488" rx="8" ry="8" fill="#D4521E" opacity="0.6"/>
    <line x1="300" y1="422" x2="292" y2="390" stroke="#D4521E" stroke-width="6" stroke-linecap="round" opacity="0.5"/>
    <line x1="340" y1="405" x2="336" y2="372" stroke="#D4521E" stroke-width="5" stroke-linecap="round" opacity="0.45"/>
    <line x1="400" y1="420" x2="400" y2="386" stroke="#D4521E" stroke-width="5" stroke-linecap="round" opacity="0.5"/>
    <line x1="460" y1="405" x2="464" y2="372" stroke="#D4521E" stroke-width="5" stroke-linecap="round" opacity="0.45"/>
    <line x1="500" y1="422" x2="508" y2="390" stroke="#D4521E" stroke-width="6" stroke-linecap="round" opacity="0.5"/>
    <line x1="310" y1="575" x2="302" y2="605" stroke="#D4521E" stroke-width="4" stroke-linecap="round" opacity="0.3"/>
    <line x1="400" y1="580" x2="400" y2="612" stroke="#D4521E" stroke-width="4" stroke-linecap="round" opacity="0.3"/>
    <line x1="490" y1="575" x2="498" y2="605" stroke="#D4521E" stroke-width="4" stroke-linecap="round" opacity="0.3"/>
    <ellipse cx="230" cy="490" rx="14" ry="10" fill="#D4521E" opacity="0.25"/>
    <ellipse cx="570" cy="510" rx="12" ry="8" fill="#D4521E" opacity="0.22"/>
    <ellipse cx="360" cy="650" rx="8" ry="6" fill="#D4521E" opacity="0.2"/>
  </svg>
`;

export function EclipseSvg({ style }) {
  return <div style={style} dangerouslySetInnerHTML={{ __html: ECLIPSE_SVG_RAW }} />;
}

export function SpySvg({ style }) {
  return <div style={style} dangerouslySetInnerHTML={{ __html: SPY_SVG_RAW }} />;
}
