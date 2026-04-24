import React, { useState, useEffect } from 'react';
import { Sparkles, Check, X } from 'lucide-react';
import axios from 'axios';

const IncomingInvitations = ({ onAcceptSuccess, currentUserEmail }) => {
  const [invitations, setInvitations] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchInvitations = async () => {
    try {
      const res = await axios.get(`http://127.0.0.1:8000/users/${currentUserEmail}/invitations`);
      setInvitations(res.data);
    } catch (error) {
      console.error("Помилка завантаження запрошень:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInvitations();
  }, []);

  const handleRespond = async (invitationId, action) => {
    setInvitations(prev => prev.filter(inv => inv.id !== invitationId));

    try {
      await axios.post(`http://localhost:8000/invitations/${invitationId}/respond`, { action });
      if (action === 'accept' && onAcceptSuccess) {
        onAcceptSuccess(); 
      }
    } catch (error) {
      console.error("Помилка відповіді на запрошення:", error);
      fetchInvitations(); 
    }
  };

  if (loading || invitations.length === 0) return null;
  
  return (
    <div className="mb-8 flex flex-col gap-3 animate-in fade-in slide-in-from-top-4 duration-500">
      <h2 className="text-sm font-black uppercase tracking-tight flex items-center gap-2 text-black mb-1">
        <Sparkles size={16} className="text-[#93E74F]" /> Вас запрошують
      </h2>
      
      {invitations.map(inv => (
        <div 
          key={inv.id} 
          className="bg-white p-3 rounded-2xl border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] flex items-center justify-between gap-4 transition-all hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#93E74F] border-2 border-black rounded-full flex items-center justify-center font-black text-sm uppercase shrink-0">
              {inv.inviter_name.charAt(0)}
            </div>
            <div className="flex flex-col">
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[#93E74F] animate-pulse"></span> Smart Match
              </p>
              <p className="text-sm font-black uppercase leading-tight mt-0.5">
                {inv.inviter_name} <span className="text-gray-400 font-bold lowercase">кличе у</span> <span className="underline decoration-[#93E74F] decoration-2">{inv.trip_title}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button 
              onClick={() => handleRespond(inv.id, 'reject')}
              className="h-9 w-9 flex items-center justify-center bg-gray-100 text-gray-500 border-2 border-black rounded-xl hover:bg-black hover:text-white transition-colors shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-y-[2px] active:shadow-none"
              title="Відхилити"
            >
              <X size={16} strokeWidth={3} />
            </button>
            <button 
              onClick={() => handleRespond(inv.id, 'accept')}
              className="h-9 px-4 flex items-center gap-1.5 bg-[#93E74F] text-black border-2 border-black rounded-xl font-black text-xs uppercase tracking-wider hover:bg-black hover:text-[#93E74F] transition-all shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-y-[2px] active:shadow-none"
            >
              <Check size={16} strokeWidth={3} /> Так
            </button>
          </div>
          
        </div>
      ))}
    </div>
  );
};

export default IncomingInvitations;