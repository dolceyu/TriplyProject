import React from 'react';

import logoImg from '../assets/logo-mini.png';
import airplaneImg from '../assets/plane.png';
import triplyTitleImg from '../assets/main-triply.png';
import smileImg from '../assets/smile.png';
import friendsImg from '../assets/friends.png';
import mapImg from '../assets/map-main.png';
import sightImg from '../assets/sight-main.png';

const Home = () => {
  return (
    <div className="h-screen bg-white text-black overflow-hidden flex flex-col" style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "Segoe UI", Roboto, sans-serif' }}>
      
      {/* Навігація — Меню посередині */}
      <nav className="relative flex items-center justify-between px-16 py-10 flex-shrink-0">
        <div className="flex items-center gap-4 z-10">
          <img src={logoImg} alt="Triply Logo" className="w-14 h-14 object-contain" />
          <span className="text-3xl font-bold tracking-tighter">Triply</span>
        </div>
        
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="flex gap-14 text-[20px] font-semibold text-gray-800 pointer-events-auto">
            <a href="#" className="hover:text-black transition">Про нас</a>
            <a href="#" className="hover:text-black transition">Як це працює?</a>
          </div>
        </div>

        <div className="flex gap-6 z-10">
          <button className="px-10 py-3 border-2 border-black rounded-full font-bold text-lg hover:bg-gray-50 transition">
            Вхід
          </button>
          {/* Прибрано дію з вікном, тепер це кнопка для переходу на нову сторінку */}
          <button 
            className="px-10 py-3 bg-[#A3E635] border-2 border-black rounded-full font-bold text-lg shadow-[5px_5px_0px_0px_rgba(0,0,0,1)] active:translate-y-0.5 transition-all"
          >
            Реєстрація
          </button>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="flex-grow flex flex-col items-center justify-center pt-10 px-4 relative max-w-7xl mx-auto w-full">
        
        {/* Літак — Опущений нижче */}
        <div className="absolute left-0 top-40 w-80 h-80 pointer-events-none">
           <img src={airplaneImg} alt="" className="w-full h-full object-contain" />
        </div>

        {/* Заголовок Triply */}
        <div className="relative mb-6">
          <img src={triplyTitleImg} alt="Triply" className="h-48 md:h-64 object-contain" />
        </div>
        
        <div className="text-center max-w-3xl z-10 mb-16">
          <p className="text-[32px] sans-serif font-black mb-4 tracking-tight">Плануйте спільні подорожі без суперечок</p>
          <p className="text-black-500 text-xl leading-relaxed font-medium max-w-xl mx-auto text-gray-500">
            Triply враховує вподобання кожного учасника, підбирає оптимальні маршрути та допомагає знайти компроміс
          </p>
        </div>

        {/* Картки */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full px-12 mb-10 relative">
          <div className="bg-[#F3F4F6] py-8 px-10 rounded-[40px] border-2 border-gray-100 flex flex-col items-center justify-center gap-4 min-h-48">
            <img src={friendsImg} alt="" className="h-20 object-contain" />
            <span className="font-bold text-xl">Збирайте друзів</span>
          </div>
          
          <div className="bg-[#F3F4F6] py-8 px-10 rounded-[40px] border-2 border-[#A3E635] flex flex-col items-center justify-center gap-4 h-48">
            <img src={mapImg} alt="" className="h-20 object-contain" />
            <span className="font-bold text-xl">Складайте маршрути</span>
          </div>

          <div className="bg-[#F3F4F6] py-8 px-10 rounded-[40px] border-2 border-gray-100 flex flex-col items-center justify-center gap-4 relative h-48 overflow-visible">
            <img src={sightImg} alt="" className="h-20 object-contain" />
            <span className="font-bold text-xl">Насолоджуйтесь</span>
            
            {/* Смайлик — Піднято вище */}
            <div className="absolute -right-25 -top-38 w-48 h-48 z-20 pointer-events-none">
              <img src={smileImg} alt="" className="w-full h-full object-contain drop-shadow-2xl" />
            </div>
          </div>
        </div>
      </main>

      {/* Футер — Водяний знак піднято за допомогою pb-24 */}
      <footer className="text-center pb-24 text-gray-400 font-bold flex-shrink-0">
        © 2026 Triply
      </footer>
    </div>
  );
};

export default Home;