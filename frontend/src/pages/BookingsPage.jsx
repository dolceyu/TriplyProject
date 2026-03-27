import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Plane, Hotel, FileText, Plus } from 'lucide-react';

import TransportTab from '../components/Bookings/TransportTab';
import HousingTab from '../components/Bookings/HousingTab';
import DocumentsTab from '../components/Bookings/DocumentsTab';

const BookingsPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('housing'); 

  const currentTrip = { id: id, destination: "Париж" };

  const tabs = [
    { id: 'transport', label: 'Транспорт', icon: <Plane size={16} /> },
    { id: 'housing', label: 'Житло', icon: <Hotel size={16} /> },
    { id: 'docs', label: 'Документи', icon: <FileText size={16} /> },
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case 'transport': return <TransportTab />;
      case 'housing': return <HousingTab trip={currentTrip} />;
      case 'docs': return <DocumentsTab />;
      default: return <TransportTab />;
    }
  };

  return (
    <div className="min-h-screen bg-[#F8F9FA] flex flex-col font-sans text-black relative overflow-hidden">
      
      {/* Легкий фоновий патерн */}
      <div className="absolute inset-0 z-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'radial-gradient(#000 2px, transparent 2px)', backgroundSize: '32px 32px' }}></div>

      <header className="h-20 bg-white border-b-4 border-black flex items-center justify-between px-8 shrink-0 z-20 relative">
        <div className="flex items-center gap-6">
          <button onClick={() => navigate(-1)} className="w-10 h-10 bg-gray-100 border-2 border-black rounded-xl flex items-center justify-center hover:bg-[#93E74F] shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-y-0.5 active:shadow-none transition-all">
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-2xl font-black uppercase tracking-tight">Сейф документів</h1>
            <p className="text-sm font-bold text-gray-400">Всі квитки та броні в одному місці</p>
          </div>
        </div>
      </header>

      {/* Основний контейнер, який тягнеться до кінця екрану */}
      <main className="flex-1 w-full px-8 pb-8 pt-6 flex gap-8 relative z-10 items-stretch">
        
        {/* ЛІВА ЧАСТИНА (65%) */}
        <div className="w-[65%] flex flex-col gap-6">
          
          {/* Вкладки: фіксована висота */}
          <div className="flex gap-4 h-[52px] shrink-0">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-6 h-full border-2 border-black rounded-2xl font-black text-sm uppercase transition-all active:translate-y-0.5 active:shadow-none ${
                  activeTab === tab.id 
                    ? 'bg-black text-[#93E74F] shadow-[4px_4px_0px_0px_rgba(147,231,79,1)]' 
                    : 'bg-white text-black hover:bg-gray-100 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]'
                }`}
              >
                {tab.icon} {tab.label}
              </button>
            ))}
          </div>
          
          {/* Контейнер для самої картки, який заповнює решту висоти */}
          <div className="flex-1 flex flex-col">
            {renderTabContent()}
          </div>
        </div>

        {/* ПРАВА ЧАСТИНА (35%) */}
        <div className="w-[35%] flex flex-col gap-6">
          
          {/* НЕВИДИМИЙ БЛОК: Вирівнює правий контент з лівим (висота вкладок 52px) */}
          <div className="h-[52px] shrink-0"></div>

          {/* Сам правий порожній блок, тягнеться до самого низу завдяки flex-1 */}
          <div className="flex-1 w-full border-4 border-dashed border-gray-200 rounded-[40px] flex items-center justify-center bg-white/50 min-h-[600px]">
             <p className="text-gray-400 font-bold uppercase tracking-widest text-sm">Тут буде твій блок</p>
          </div>
          
        </div>
      </main>
    </div>
  );
};

export default BookingsPage;