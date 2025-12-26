import React from 'react';

export const APP_NAME = "Bússola da Cura";

export const DEFAULT_CTA = {
  preText: "Para tratar a raiz deste sintoma/doença, é necessário aplicar o Protocolo do Ponto Final que se encontra disponível na plataforma da 'Bússola da Cura'",
  buttonText: "APLICAR PROTOCOLO",
  buttonLink: "https://hotmart.com/pt-br" // Placeholder
};

export const Logo: React.FC<{ className?: string }> = ({ className }) => (
  <svg 
    className={className} 
    viewBox="0 0 916.84 203.28" 
    xmlns="http://www.w3.org/2000/svg"
    aria-label="Logo Bússola da Cura"
  >
    <defs>
      <style>{`
        .cls-4 { fill: #736458; }
        .cls-6 { fill: #c8b299; }
        .cls-7 { fill: #d8223d; }
      `}</style>
    </defs>
    <g>
      <path className="cls-7" d="M54.91,152.25l-3.37,7.83c-16.89-13.88-27.68-34.92-27.68-58.44,0-37.51,27.46-68.71,63.32-74.61l-1.19,10.11,16.23-25.44c-.91-.03-1.82-.05-2.74-.05C51.96,11.66,12.93,48.7,9.72,95.42l-9.72,6.22,9.72,6.22c2.16,31.45,20.55,58.52,46.84,72.85l-1.65-28.45Z"/>
      <path className="cls-4" d="M73.07,81.59c-.24.32-.48.64-.71.97.23-.33.46-.65.71-.97Z"/>
      <path className="cls-4" d="M126.14,121.37s-.03.04-.05.07c.02-.02.03-.04.05-.07Z"/>
      <path style={{fill: 'currentColor'}} d="M91,103.28l-5.14,19.07c-.46,1.7.82,3.37,2.58,3.37h22.06c1.76,0,3.04-1.67,2.58-3.37l-5.14-19.09c2.28-1.78,4.03-4.27,4.83-7.28,1.97-7.35-2.39-14.9-9.74-16.87-7.35-1.97-14.9,2.39-16.87,9.74-1.48,5.51.6,11.12,4.83,14.43ZM99.48,82.87c5.27,0,9.55,4.27,9.55,9.55,0,3.97-2.43,7.38-5.88,8.81l5.45,20.2h-18.25l5.28-20.28c-3.36-1.48-5.71-4.83-5.71-8.74,0-5.27,4.27-9.55,9.55-9.55Z"/>
      <path className="cls-6" d="M72.16,82.83c-.28.4-.54.81-.8,1.22l.8-1.22Z"/>
      <path style={{fill: 'currentColor'}} d="M73.07,81.59c7.91-10.41,21.59-15.57,34.99-11.98C125.75,74.35,126.72,0,126.72,0l-54.55,82.83s.02-.02.02-.03c.06-.08.12-.16.17-.25.23-.33.46-.65.71-.97Z"/>
      <path style={{fill: 'currentColor'}} d="M126.65,120.67l.15-.23c-.21.31-.43.62-.66.92-.02.02-.03.04-.05.07-7.88,10.58-21.68,15.86-35.19,12.23-17.69-4.74-18.65,69.61-18.65,69.61h0s.35-.55.35-.55l54.04-82.05Z"/>
      <path className="cls-6" d="M126.8,120.45c.28-.4.54-.81.8-1.22l-.8,1.22Z"/>
      <path className="cls-7" d="M198.97,101.64l-9.72-6.22c-2.16-31.45-20.55-58.52-46.84-72.85l1.65,28.45,3.37-7.83c16.89,13.88,27.68,34.92,27.68,58.44,0,37.51-27.46,68.71-63.32,74.61l1.18-10.11-16.23,25.44c.91.03,1.82.05,2.74.05,47.52,0,86.55-37.04,89.76-83.76l9.72-6.22Z"/>
      <text transform="translate(208.01 145.51)" style={{ fontFamily: '"Bebas Neue", cursive', fontSize: '131px', fill: 'currentColor' }}>
        <tspan x="0" y="0">bússola </tspan>
        <tspan x="373.21" y="0" style={{ letterSpacing: '0em'}}>d</tspan>
        <tspan x="426.53" y="0" style={{ letterSpacing: '0em'}}>a cura</tspan>
      </text>
    </g>
  </svg>
);