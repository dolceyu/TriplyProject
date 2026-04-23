import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Plane, Hotel, FileText, ListTodo } from 'lucide-react';
import axios from 'axios';

import TransportTab from '../components/Bookings/TransportTab';
import HousingTab from '../components/Bookings/HousingTab';
import DocumentsTab from '../components/Bookings/DocumentsTab';

const BookingsPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();

const [activeTab, setActiveTab] = useState(() => {
  return localStorage.getItem('savedSafeTab') || 'housing'; 
});

useEffect(() => {
  localStorage.setItem('savedSafeTab', activeTab);
}, [activeTab]); 

  const [tripData, setTripData] = useState(null);
  const currentTrip = { id: id, title: "Твоя подорож" };

  const tabs = [
    { id: 'transport', label: 'Транспорт', icon: <Plane size={16} /> },
    { id: 'housing', label: 'Житло', icon: <Hotel size={16} /> },
    { id: 'docs', label: 'Документи', icon: <FileText size={16} /> },
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case 'transport': return <TransportTab trip={currentTrip} />;
      case 'housing': return <HousingTab trip={currentTrip} />;
      case 'docs': return <DocumentsTab trip={currentTrip} />;
      default: return <TransportTab trip={currentTrip} />;
    }
  };

  return (
    <div className="min-h-screen bg-[#F8F9FA] flex flex-col font-sans text-black relative overflow-hidden">
      
      <div className="absolute inset-0 z-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'radial-gradient(#000 2px, transparent 2px)', backgroundSize: '32px 32px' }}></div>

      <header className="h-20 bg-white border-b-4 border-black flex items-center justify-between px-8 shrink-0 z-20 relative">
        <div className="flex items-center gap-6">
          <button onClick={() => navigate(-1)} className="w-10 h-10 bg-gray-100 border-2 border-black rounded-xl flex items-center justify-center hover:bg-[#93E74F] shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-y-0.5 active:shadow-none transition-all">
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-2xl font-black uppercase tracking-tight">Сейф документів</h1>
            <p className="text-sm font-bold text-gray-400">Всі квитки, броні та чеклисти в одному місці</p>
          </div>
        </div>
      </header>

      <main className="flex-1 w-full px-8 pb-8 pt-6 flex flex-col gap-6 relative z-10 h-full overflow-hidden">
        
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
        
        <div className="flex-1 w-full min-h-0 bg-transparent flex flex-col">
          {renderTabContent()}
        </div>

      </main>
    </div>
  );
};

export default BookingsPage;