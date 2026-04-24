import React, { useState, useEffect } from 'react';
import { X, Sparkles, UserPlus, Clock, Ban } from 'lucide-react';
import axios from 'axios';

const SmartMatchModal = ({ isOpen, onClose, tripId }) => {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [inviteStatuses, setInviteStatuses] = useState({}); 

  useEffect(() => {
    if (isOpen) {
      setLoading(true);
      axios.get(`http://localhost:8000/trips/${tripId}/smart-match`)
        .then(res => {
          setData(res.data);
          
          if (res.data.matches) {
            const initialStatuses = {};
            res.data.matches.forEach(user => {
              if (user.invite_status) {
                initialStatuses[user.email] = user.invite_status;
              }
            });
            setInviteStatuses(initialStatuses);
          }
          
          setLoading(false);
        })
        .catch(err => {
          console.error("Помилка завантаження кандидатів:", err);
          setLoading(false);
        });
    }
  }, [isOpen, tripId]);

  const handleInvite = async (userEmail) => {
    setInviteStatuses(prev => ({ ...prev, [userEmail]: 'pending' }));
    
    try {
      await axios.post(`http://localhost:8000/trips/${tripId}/invite`, {
        email: userEmail
      });
    } catch (error) {
      console.error("[SmartMatch] Помилка відправки інвайту:", error);
      setInviteStatuses(prev => ({ ...prev, [userEmail]: null }));
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl w-full max-w-lg overflow-hidden shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] border-4 border-black">
        
        <div className="bg-[#93E74F] p-5 border-b-4 border-black flex justify-between items-center relative overflow-hidden">
          <div className="relative z-10 flex items-center gap-3">
            <Sparkles className="text-black" />
            <h2 className="text-xl font-black uppercase tracking-tight text-black">РОЗУМНИЙ ПІДБІР</h2>
          </div>
          <button onClick={onClose} className="relative z-10 p-1 hover:scale-110 transition-transform">
            <X size={24} strokeWidth={3} />
          </button>
        </div>

        <div className="p-6">
          {loading ? (
            <div className="py-12 flex flex-col items-center justify-center gap-4">
              <div className="w-10 h-10 border-4 border-black border-t-[#93E74F] rounded-full animate-spin"></div>
              <p className="font-bold uppercase text-xs tracking-widest text-gray-500">Аналізуємо концепт групи...</p>
            </div>
          ) : data?.core_concept?.length > 0 ? (
            <div className="flex flex-col gap-6">
              
              <div className="bg-gray-100 p-4 rounded-xl border-2 border-black border-dashed">
                <p className="text-xs font-black uppercase text-gray-500 mb-2">Стійкий контекст вашої групи:</p>
                <div className="flex flex-wrap gap-2">
                  {data.core_concept.map((tag, i) => (
                    <span key={i} className="px-3 py-1 bg-black text-[#93E74F] text-xs font-bold rounded-lg uppercase shadow-sm">
                      {tag}
                    </span>
                  ))}
                </div>
                <p className="text-[11px] text-gray-500 mt-3 font-bold uppercase tracking-wide">
                  Алгоритм ФКА знайшов людей, які ідеально доповнять цю поїздку на основі цих інтересів.
                </p>
              </div>

              <div className="flex flex-col gap-3">
                <h3 className="text-sm font-black uppercase text-black">Ідеальні кандидати:</h3>
                {data.matches?.length > 0 ? (
                  data.matches.map((user) => {
                    const status = inviteStatuses[user.email];
                    
                    return (
                      <div key={user.id} className="flex items-center justify-between p-3 border-2 border-black rounded-xl hover:bg-gray-50 transition-colors">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-[#93E74F] border-2 border-black rounded-full flex items-center justify-center font-black">
                            {user.first_name.charAt(0)}
                          </div>
                          <div>
                            <p className="font-black text-sm uppercase tracking-tight">{user.first_name}</p>
                            <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">100% MATCH</p>
                          </div>
                        </div>
                        
                        {!status ? (
                          <button 
                            onClick={() => handleInvite(user.email)}
                            className="w-12 h-10 flex items-center justify-center border-2 border-black rounded-xl font-black bg-white text-black hover:bg-[#93E74F] shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-y-[2px] active:shadow-none transition-all"
                            title="Запросити"
                          >
                            <UserPlus size={18} strokeWidth={2} />
                          </button>
                        ) : status === 'pending' ? (
                          <div className="px-3 h-10 flex items-center gap-2 border-2 border-black rounded-xl font-black bg-black text-[#93E74F] transition-all">
                            <Clock size={16} strokeWidth={3} />
                            <span className="text-[10px] uppercase tracking-wider">На розгляді</span>
                          </div>
                        ) : status === 'rejected' ? (
                          <div className="px-3 h-10 flex items-center gap-2 border-2 border-gray-300 rounded-xl font-black bg-gray-100 text-gray-400 transition-all">
                            <Ban size={16} strokeWidth={3} />
                            <span className="text-[10px] uppercase tracking-wider">Відхилено</span>
                          </div>
                        ) : null}

                      </div>
                    );
                  })
                ) : (
                  <p className="text-sm text-gray-500 font-bold text-center py-4 uppercase">Немає вільних кандидатів 😔</p>
                )}
              </div>

            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-500 font-bold uppercase">Група ще не має яскраво виражених спільних інтересів.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SmartMatchModal;