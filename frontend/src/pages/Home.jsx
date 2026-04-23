import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import Logo from '../components/Logo'; 
import airplaneImg from '../assets/plane.png';
import triplyTitleImg from '../assets/main-triply.png';
import smileImg from '../assets/smile.png';
import friendsImg from '../assets/friends.png';
import mapImg from '../assets/map-main.png';
import sightImg from '../assets/sight-main.png';

const Home = () => {
  useEffect(() => {
    document.documentElement.style.scrollBehavior = 'smooth';
    return () => {
      document.documentElement.style.scrollBehavior = 'auto';
    };
  }, []);

  return (
    <div className="min-h-screen bg-white text-black overflow-x-hidden flex flex-col" style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "Segoe UI", Roboto, sans-serif' }}>
      
      <nav className="relative flex items-center justify-between px-16 py-10 flex-shrink-0">
        <Logo />
        
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="flex gap-14 text-[20px] font-semibold text-gray-800 pointer-events-auto">
            <a href="#about" className="hover:text-[#A3E635] transition-colors">Про нас</a>
            <a href="#how-it-works" className="hover:text-[#A3E635] transition-colors">Як це працює?</a>
          </div>
        </div>

        <div className="flex gap-6 z-10">
          <Link 
            to="/login"
            className="px-10 py-3 border-2 border-black rounded-full font-bold text-lg hover:bg-gray-50 transition shadow-[5px_5px_0px_0px_rgba(0,0,0,1)] active:translate-y-0.5 inline-block text-center"
          >
            Вхід
          </Link>
          
          <Link 
            to="/register"
            className="px-10 py-3 bg-[#A3E635] border-2 border-black rounded-full font-bold text-lg shadow-[5px_5px_0px_0px_rgba(0,0,0,1)] active:translate-y-0.5 transition-all inline-block text-center"
          >
            Реєстрація
          </Link>
        </div>
      </nav>

      <main className="flex-col items-center justify-center pt-10 px-4 relative max-w-7xl mx-auto w-full">
        <div className="absolute left-0 top-40 w-80 h-80 pointer-events-none">
           <img src={airplaneImg} alt="" className="w-full h-full object-contain" />
        </div>

        <div className="relative mb-6 flex justify-center">
          <img src={triplyTitleImg} alt="Triply" className="h-48 md:h-64 object-contain" />
        </div>
        
        <div className="text-center max-w-3xl z-10 mb-16 mx-auto">
          <p className="text-[32px] font-black mb-4 tracking-tight">Плануйте спільні подорожі без суперечок</p>
          <p className="text-xl leading-relaxed font-medium max-w-xl mx-auto text-gray-500">
            Triply враховує вподобання кожного учасника, підбирає оптимальні маршрути та допомагає знайти компроміс
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full px-12 mb-24 relative">
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
            
            <div className="absolute -right-25 -top-38 w-48 h-48 z-20 pointer-events-none">
              <img src={smileImg} alt="" className="w-full h-full object-contain drop-shadow-2xl" />
            </div>
          </div>
        </div>
      </main>

      <section id="about" className="py-24 px-8 bg-white text-black scroll-mt-10">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl font-black mb-8 tracking-tight uppercase">Про Triply 🚀</h2>
          <p className="text-xl font-medium leading-relaxed mb-6 text-gray-600">
            Triply — це не просто планувальник подорожей. Це ваш розумний асистент, який бере на себе всю рутину. Ми створили платформу, де алгоритми штучного інтелекту та просторової кластеризації об'єднуються з вашими особистими вподобаннями.
          </p>
          <p className="text-xl font-medium leading-relaxed text-gray-600">
            Більше ніяких хаотичних маршрутів чи суперечок з друзями, куди піти. Triply аналізує інтереси компанії, будує оптимальні логістичні ланцюжки та синхронізує всі плани, квитки і документи в реальному часі.
          </p>
        </div>
      </section>

      <section id="how-it-works" className="py-24 px-8 bg-[#A3E635] text-black border-y-4 border-black scroll-mt-10">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-4xl font-black mb-16 text-center tracking-tight uppercase">Як це працює? ⚙️</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 px-4">
            <div className="bg-white p-10 rounded-[40px] border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-2 transition-transform">
              <h3 className="text-2xl font-black mb-4 uppercase">1. Створіть подорож</h3>
              <p className="font-medium text-gray-600 text-lg">Задайте дати, запросіть друзів за спеціальним кодом та вкажіть свої інтереси (від гір до гастротурів).</p>
            </div>
            <div className="bg-white p-10 rounded-[40px] border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-2 transition-transform">
              <h3 className="text-2xl font-black mb-4 uppercase">2. Додайте локації</h3>
              <p className="font-medium text-gray-600 text-lg">Генеруйте ідеї за допомогою нашого ШІ, який враховує ваш профіль, або шукайте місця вручну на карті.</p>
            </div>
            <div className="bg-white p-10 rounded-[40px] border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-2 transition-transform">
              <h3 className="text-2xl font-black mb-4 uppercase">3. Магія алгоритмів</h3>
              <p className="font-medium text-gray-600 text-lg">Натисніть "Розумний маршрут", і система сама розіб'є локації по днях і вибудує оптимальний шлях без зайвої біганини.</p>
            </div>
          </div>
        </div>
      </section>

      <footer className="text-center py-12 bg-white text-gray-400 font-bold flex-shrink-0">
        © 2026 Triply
      </footer>
    </div>
  );
};

export default Home;