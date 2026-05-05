import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { Plus, Link as LinkIcon, FileText, AlignLeft, ExternalLink, X, Download, Trash2, Pencil } from 'lucide-react';

const HousingTab = ({ trip }) => {
  const currentUserName = (localStorage.getItem('userName') || localStorage.getItem('user_name') || '')
    .replace(/['"]+/g, '')
    .trim();

  const [items, setItems] = useState([]);
  const [selectedItem, setSelectedItem] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false); 
  const [activeTab, setActiveTab] = useState('link'); 
  const [formData, setFormData] = useState({ title: '', content: '' });
  const [selectedFile, setSelectedFile] = useState(null);

  const fileInputRef = useRef(null);

  const fetchHousing = async () => {
    try {
      const res = await axios.get(`http://localhost:8000/trips/${trip.id}/documents/housing`);
      const sorted = res.data.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
      setItems(sorted);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (trip?.id) fetchHousing();
  }, [trip]);

  useEffect(() => {
    if (!trip?.id) return;
    const wsUrl = `ws://localhost:8000/ws/${trip.id}`;
    const socket = new WebSocket(wsUrl);
    socket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.action === "refresh_documents") fetchHousing();
      } catch (error) {
        console.error(error);
      }
    };
    return () => socket.close();
  }, [trip?.id]);

  useEffect(() => {
    if (selectedItem) {
      const itemStillExists = items.some(item => item.id === selectedItem.id);
      if (!itemStillExists) setSelectedItem(null);
    }
  }, [items, selectedItem]);

  const handleSubmit = async () => {
    if (!formData.title) return;

    if (isEditing) {
      try {
        const response = await axios.patch(`http://localhost:8000/documents/${selectedItem.id}`, {
          title: formData.title,
          content: formData.content,
          category: 'housing',
          item_type: selectedItem.item_type
        });
        setItems(items.map(item => item.id === selectedItem.id ? response.data : item));
        setSelectedItem(response.data);
        setIsModalOpen(false);
        resetForm();
      } catch (error) {
        console.error(error);
      }
    } else {
      const data = new FormData();
      data.append('category', 'housing');
      data.append('title', formData.title);
      data.append('item_type', activeTab);
      data.append('author_name', currentUserName);
      
      if (activeTab === 'file' && selectedFile) {
        data.append('file', selectedFile);
      } else {
        data.append('content', formData.content);
      }

      try {
        const response = await axios.post(
          `http://localhost:8000/trips/${trip.id}/documents`, 
          data,
          { headers: { 'Content-Type': 'multipart/form-data' } }
        );
        setItems([response.data, ...items]);
        setSelectedItem(response.data);
        setIsModalOpen(false);
        resetForm();
      } catch (error) {
        console.error(error);
      }
    }
  };

  const handleDelete = async (e, id) => {
    e.stopPropagation();
    if (!window.confirm("Видалити це бронювання?")) return;
    try {
      await axios.delete(`http://localhost:8000/documents/${id}`, {
        params: { user_name: currentUserName }
      });
      setItems(items.filter(item => item.id !== id));
    } catch (err) {
      alert(err.response?.data?.detail || "Помилка видалення");
    }
  };

  const resetForm = () => {
    setFormData({ title: '', content: '' });
    setSelectedFile(null);
    setIsEditing(false);
  };

  const handleEditClick = () => {
    setFormData({ title: selectedItem.title, content: selectedItem.content });
    setActiveTab(selectedItem.item_type);
    setIsEditing(true);
    setIsModalOpen(true);
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
      setFormData({ ...formData, content: file.name });
    }
  };

  const getFileUrl = (fileName) => `http://localhost:8000/uploads/${fileName}`;

  const renderIcon = (type) => {
    switch (type) {
      case 'link': return <LinkIcon size={18} />;
      case 'text': return <AlignLeft size={18} />;
      case 'file': return <FileText size={18} />;
      default: return <FileText size={18} />;
    }
  };

  return (
    <div className="flex-1 flex w-full gap-6 font-sans text-black pb-4 pr-3 min-h-0">
      <div className="w-1/2 flex flex-col bg-white border-4 border-black rounded-3xl shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] overflow-hidden">
        <div className="p-6 border-b-4 border-black flex justify-between items-center bg-gray-50 text-black">
          <h2 className="font-black text-xl uppercase tracking-widest flex items-center gap-2">🏠 Житло</h2>
          <span className="bg-[#93E74F] text-[10px] px-2 py-1 rounded-lg font-black border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
            {items.length} БРОНЕЙ
          </span>
        </div>

        <div className="flex-1 overflow-y-auto p-6 bg-white flex flex-col gap-4 text-black">
          {items.map(item => {
            const isAuthor = String(item.author_name).trim() === String(currentUserName).trim();
            const isGuide = String(trip?.guide_name).trim() === String(currentUserName).trim();
            const canDelete = isAuthor || isGuide;

            return (
              <button
                key={item.id}
                onClick={() => setSelectedItem(item)}
                className={`group relative w-full text-left p-4 rounded-2xl border-2 transition-all flex items-center gap-4 ${
                  selectedItem?.id === item.id 
                    ? 'bg-[#93E74F]/10 border-[#93E74F] shadow-[4px_4px_0px_0px_rgba(147,231,79,1)] translate-x-1' 
                    : 'bg-white border-black hover:bg-gray-50 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]'
                }`}
              >
                {canDelete && (
                  <div onClick={(e) => handleDelete(e, item.id)} className="absolute -top-2 -left-2 w-7 h-7 bg-white border-2 border-black rounded-full flex items-center justify-center text-red-500 opacity-0 group-hover:opacity-100 transition-all shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] z-10">
                    <Trash2 size={12} />
                  </div>
                )}
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center border-2 border-black ${selectedItem?.id === item.id ? 'bg-[#93E74F]' : 'bg-gray-100'}`}>
                  {renderIcon(item.item_type)}
                </div>
                <div className="flex-1 overflow-hidden">
                  <h4 className="font-black text-sm uppercase truncate">{item.title}</h4>
                  <p className="text-[9px] font-bold text-gray-400 uppercase mt-1">Додано: {item.author_name || 'Гість'}</p>
                </div>
              </button>
            );
          })}
        </div>

        <div className="p-6 border-t-4 border-black bg-white">
          <button onClick={() => { resetForm(); setIsModalOpen(true); }} className="w-full py-4 bg-[#93E74F] text-black border-4 border-black rounded-xl font-black uppercase shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:translate-y-1 transition-all flex items-center justify-center gap-2">
            <Plus size={20} /> Додати бронювання
          </button>
        </div>
      </div>

      <div className="w-1/2 bg-gray-50 border-4 border-dashed border-gray-300 rounded-3xl flex flex-col overflow-hidden relative shadow-inner">
        {selectedItem ? (
          <div className="flex-1 bg-white border-4 border-black rounded-2xl m-4 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] flex flex-col overflow-hidden text-black">
            <div className="p-6 border-b-4 border-black flex items-center justify-between bg-[#93E74F]/20">
              <h2 className="text-xl font-black uppercase truncate pr-4">{selectedItem.title}</h2>
              <div className="flex gap-2 shrink-0">
                {(String(selectedItem.author_name).trim() === String(currentUserName).trim() || String(trip?.guide_name).trim() === String(currentUserName).trim()) && (
                  <button onClick={handleEditClick} className="w-9 h-9 border-2 border-black rounded-md flex items-center justify-center bg-transparent hover:bg-black/5 transition-all">
                    <Pencil size={18} />
                  </button>
                )}
                {selectedItem.item_type === 'file' && (
                  <a href={getFileUrl(selectedItem.content)} download className="w-9 h-9 border-2 border-black rounded-md flex items-center justify-center bg-black text-[#93E74F]">
                    <Download size={18} />
                  </a>
                )}
              </div>
            </div>
            
            <div className="flex-1 overflow-auto bg-white p-8 text-black">
              {selectedItem.item_type === 'link' ? (
                <div className="p-8 text-center mt-10">
                  <div className="flex flex-col items-center gap-6">
                    <a href={selectedItem.content} target="_blank" rel="noopener noreferrer" className="text-blue-600 font-bold underline break-all hover:text-blue-800 text-sm mb-4">{selectedItem.content}</a>
                    <a href={selectedItem.content} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 px-8 py-4 bg-black text-[#93E74F] border-4 border-black rounded-xl font-black uppercase shadow-[6px_6px_0px_0px_rgba(147,231,79,1)] active:translate-y-1 transition-all">Відкрити бронювання <ExternalLink size={20} /></a>
                  </div>
                </div>
              ) : selectedItem.item_type === 'text' ? (
                <div className="p-8 bg-white border-2 border-black rounded-xl shadow-inner h-full"><p className="whitespace-pre-wrap font-bold">{selectedItem.content}</p></div>
              ) : (
                <div className="w-full h-full">
                  {selectedItem.content.toLowerCase().endsWith('.pdf') ? (
                    <iframe src={getFileUrl(selectedItem.content)} className="w-full h-full border-none rounded-lg" />
                  ) : (
                    <div className="flex items-center justify-center h-full"><img src={getFileUrl(selectedItem.content)} className="max-h-full border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]" alt="Preview" /></div>
                  )}
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center text-center opacity-40 text-black">
            <div><AlignLeft size={48} className="mx-auto mb-4" /><p className="font-black uppercase tracking-widest text-sm">Оберіть документ</p></div>
          </div>
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4 text-black">
          <div className="bg-white border-4 border-black rounded-3xl p-8 max-w-lg w-full relative shadow-[12px_12px_0px_0px_rgba(0,0,0,1)]">
            <button onClick={() => setIsModalOpen(false)} className="absolute top-6 right-6 text-gray-500 hover:text-black"><X size={24} /></button>
            <h2 className="text-2xl font-black uppercase italic mb-6">{isEditing ? "Редагувати" : "Додати житло"}</h2>
            {!isEditing && (
              <div className="flex gap-2 mb-6 bg-gray-100 p-1.5 rounded-2xl border-2 border-black text-black">
                {['link', 'text', 'file'].map(t => (
                  <button key={t} onClick={() => setActiveTab(t)} className={`flex-1 py-3 font-black text-xs uppercase rounded-xl flex items-center justify-center gap-2 transition-all ${activeTab === t ? 'bg-white border-2 border-black text-black' : 'text-gray-500'}`}>{t === 'link' ? 'Лінк' : t === 'text' ? 'Текст' : 'Файл'}</button>
                ))}
              </div>
            )}
            <div className="space-y-4 mb-8 text-black">
               <input type="text" value={formData.title} onChange={(e) => setFormData({...formData, title: e.target.value})} className="w-full p-4 bg-gray-50 border-2 border-black rounded-xl font-bold focus:outline-none focus:ring-2 focus:ring-[#93E74F]" placeholder="Назва" />
               {activeTab !== 'file' ? (
                 <textarea rows="4" value={formData.content} onChange={(e) => setFormData({...formData, content: e.target.value})} className="w-full p-4 bg-gray-50 border-2 border-black rounded-xl font-bold resize-none focus:outline-none focus:ring-2 focus:ring-[#93E74F]" placeholder="Введіть дані..." />
               ) : !isEditing && (
                 <div onClick={() => fileInputRef.current.click()} className="border-4 border-dashed border-gray-300 rounded-xl p-8 text-center cursor-pointer bg-gray-50 hover:border-black transition-colors"><input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept=".pdf,.jpg,.png" /><p className="font-black text-xs uppercase">{selectedFile ? selectedFile.name : (formData.content || "Оберіть файл")}</p></div>
               )}
            </div>
            <button onClick={handleSubmit} className="w-full py-4 bg-[#93E74F] text-black border-4 border-black rounded-xl font-black uppercase shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] active:translate-y-1 transition-all">{isEditing ? "Оновити" : "Зберегти"}</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default HousingTab;