import React from 'react';
import { CTAConfig } from '../types';

interface Props {
  config: CTAConfig;
}

const StickyCTA: React.FC<Props> = ({ config }) => {
  return (
    <div className="fixed bottom-0 left-0 w-full bg-brand-white border-t border-brand-lightGray shadow-[0_-4px_20px_rgba(0,0,0,0.1)] p-4 md:p-6 z-50 animate-slideUp">
      <div className="max-w-4xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
        <p className="text-brand-gray font-serif text-lg italic text-center md:text-left flex-1">
          {config.preText}
        </p>
        <a 
          href={config.buttonLink}
          target="_blank"
          rel="noopener noreferrer"
          className="bg-brand-red text-white font-sans font-bold py-3 px-8 rounded-full hover:bg-opacity-90 transition-all shadow-lg transform hover:-translate-y-1 w-full md:w-auto text-center shrink-0"
        >
          {config.buttonText}
        </a>
      </div>
    </div>
  );
};

export default StickyCTA;