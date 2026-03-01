import React from 'react';
import logoImg from '../assets/logo-mini.png'; 

const Logo = () => {
  return (
    <div className="flex items-center gap-4 z-10">
      <img src={logoImg} alt="Triply Logo" className="w-14 h-14 object-contain" />
      <span className="text-3xl font-bold tracking-tighter">Triply</span>
    </div>
  );
};

export default Logo;