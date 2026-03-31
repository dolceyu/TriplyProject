import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { Plus, Link as LinkIcon, FileText, AlignLeft, ExternalLink, Plane, X, Download, Trash2, Pencil } from 'lucide-react';

const TransportTab = ({ trip }) => {
  const [items, setItems] = useState([]);
  const [selectedItem, setSelectedItem] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [activeTab, setActiveTab] = useState('link'); 
  const [formData, setFormData] = useState({ title: '', content: '' });
  const [selectedFile, setSelectedFile] = useState(null);

  const fileInputRef = useRef(null);

  useEffect(() => {
    const fetchTransport = async () => {
      try {
        const res = await axios.get(`http://localhost:8000/trips/${trip.id}/documents/transport`);
        const sorted = res.data.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
        setItems(sorted);
      } catch (err) {
        console.error("Помилка завантаження транспорту:", err);
      }
    };
    if (trip?.id) fetchTransport();
  }, [trip]);

  const handleSubmit = async () => {
    if (!formData.title) return;

    if (isEditing) {
      try {
        const response = await axios.patch(`http://localhost:8000/documents/${selectedItem.id}`, {
          title: formData.title,
          content: formData.content,
          category: 'transport',
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
      data.append('category', 'transport'); 
      data.append('title', formData.title);
      data.append('item_type', activeTab);
      
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
    if (!window.confirm("Видалити цей квиток/маршрут?")) return;
    try {
      await axios.delete(`http://localhost:8000/documents/${id}`);
      setItems(items.filter(item => item.id !== id));
      if (selectedItem?.id === id) setSelectedItem(null);
    } catch (err) { console.error(err); }
  };

  const resetForm = () => {
    setFormData({ title: '', content: '' });
    setSelectedFile(null);
    setIsEditing(false);
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
      setFormData({ ...formData, content: file.name });
    }
  };

  const getFileUrl = (fileName) => `http://localhost:8000/uploads/${fileName}`;

  return (
    <div className="flex-1 flex w-full gap-6 font-sans text-black pb-4 pr-3 min-h-0">
      <div className="w-1/2 flex flex-col bg-white border-4 border-black rounded-3xl shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] overflow-hidden">
        <div className="p-6 border-b-4 border-black flex justify-between items-center bg-gray-50">
          <h2 className="font-black text-xl uppercase tracking-widest flex items-center gap-2 text-black">
            ✈️ Транспорт
          </h2>
          <span className="bg-[#93E74F] text-black text-[10px] px-2 py-1 rounded-lg font-black border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] text-black">
            {items.length} ЗАПИСІВ
          </span>
        </div>

        <div className="flex-1 overflow-y-auto p-6 bg-white flex flex-col gap-4">
          {items.map(item => (
            <button
              key={item.id}
              onClick={() => setSelectedItem(item)}
              className={`group relative w-full text-left p-4 rounded-2xl border-2 transition-all flex items-center gap-4 ${
                selectedItem?.id === item.id 
                  ? 'bg-[#93E74F]/10 border-[#93E74F] shadow-[4px_4px_0px_0px_rgba(147,231,79,1)] translate-x-1' 
                  : 'bg-white border-black hover:bg-gray-50 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]'
              }`}
            >
              <div onClick={(e) => handleDelete(e, item.id)} className="absolute -top-2 -left-2 w-7 h-7 bg-white border-2 border-black rounded-full flex items-center justify-center text-red-500 opacity-0 group-hover:opacity-100 transition-all shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] z-10">
                <Trash2 size={12} />
              </div>
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center border-2 border-black ${selectedItem?.id === item.id ? 'bg-[#93E74F]' : 'bg-gray-100'}`}>
                {item.item_type === 'link' ? <LinkIcon size={18}/> : item.item_type === 'text' ? <AlignLeft size={18}/> : <FileText size={18}/>}
              </div>
              <div className="flex-1 overflow-hidden text-black">
                <h4 className="font-black text-sm uppercase truncate">{item.title}</h4>
                <p className="text-[10px] font-bold text-gray-500 uppercase mt-1">Квиток/Маршрут</p>
              </div>
            </button>
          ))}
        </div>

        <div className="p-6 border-t-4 border-black bg-white">
          <button 
            onClick={() => { resetForm(); setIsModalOpen(true); }}
            className="w-full py-4 bg-[#93E74F] text-black border-4 border-black rounded-xl font-black text-sm uppercase shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:translate-y-1 active:shadow-none transition-all flex items-center justify-center gap-2"
          >
            <Plus size={20} /> Додати квиток
          </button>
        </div>
      </div>

      <div className="w-1/2 bg-gray-50 border-4 border-dashed border-gray-300 rounded-3xl flex flex-col overflow-hidden relative shadow-inner">
        {selectedItem ? (
          <div className="flex-1 bg-white border-4 border-black rounded-2xl m-4 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] flex flex-col overflow-hidden text-black">
             <div className="p-6 border-b-4 border-black flex items-center justify-between bg-[#93E74F]/20">
                <h2 className="text-xl font-black uppercase truncate text-black">{selectedItem.title}</h2>
                <div className="flex gap-2">
                   <button onClick={() => { setFormData({title: selectedItem.title, content: selectedItem.content}); setIsEditing(true); setIsModalOpen(true); }} className="p-2 border-2 border-black rounded-lg hover:bg-[#93E74F] transition-colors text-black"><Pencil size={16}/></button>
                   {selectedItem.item_type === 'file' && <a href={getFileUrl(selectedItem.content)} download className="p-2 border-2 border-black rounded-lg bg-black text-[#93E74F]"><Download size={16}/></a>}
                </div>
             </div>
             <div className="flex-1 overflow-hidden bg-white">
                {selectedItem.item_type === 'file' ? (
                   selectedItem.content.toLowerCase().endsWith('.pdf') ? 
                   <iframe src={getFileUrl(selectedItem.content)} className="w-full h-full border-none" /> : 
                   <div className="p-4 flex justify-center h-full items-center bg-gray-100"><img src={getFileUrl(selectedItem.content)} className="max-h-full border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]" /></div>
                ) : (
                   <div className="p-8 text-black font-bold whitespace-pre-wrap">{selectedItem.content}</div>
                )}
             </div>
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center opacity-40 text-black font-black uppercase text-sm">Оберіть квиток</div>
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4 text-black">
          <div className="bg-white border-4 border-black rounded-3xl p-8 max-w-lg w-full relative shadow-[12px_12px_0px_0px_rgba(0,0,0,1)]">
            <button onClick={() => setIsModalOpen(false)} className="absolute top-6 right-6 text-gray-500 hover:text-black"><X size={24} /></button>
            <h2 className="text-2xl font-black uppercase italic mb-6 text-black">{isEditing ? "Редагувати транспорт" : "Додати квиток"}</h2>
            
            {!isEditing && (
               <div className="flex gap-2 mb-6 bg-gray-100 p-1.5 rounded-2xl border-2 border-black">
                  {['link', 'text', 'file'].map(t => (
                     <button key={t} onClick={() => setActiveTab(t)} className={`flex-1 py-2 font-black text-xs uppercase rounded-xl transition-all ${activeTab === t ? 'bg-white border-2 border-black text-black shadow-sm' : 'text-gray-500'}`}>
                        {t === 'link' ? 'Лінк' : t === 'text' ? 'Текст' : 'Файл'}
                     </button>
                  ))}
               </div>
            )}

            <div className="space-y-4 mb-8">
               <input type="text" value={formData.title} onChange={(e) => setFormData({...formData, title: e.target.value})} className="w-full p-4 border-2 border-black rounded-xl font-bold bg-gray-50 text-black" placeholder="Назва (напр. Потяг до Варшави)" />
               {activeTab === 'file' ? (
                  <div onClick={() => fileInputRef.current.click()} className="border-4 border-dashed border-gray-300 rounded-xl p-8 text-center cursor-pointer bg-gray-50 hover:border-black">
                     <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept=".pdf,.jpg,.png" />
                     <p className="font-black text-xs uppercase text-black">{formData.content || "Оберіть файл квитка"}</p>
                  </div>
               ) : (
                  <textarea rows="4" value={formData.content} onChange={(e) => setFormData({...formData, content: e.target.value})} className="w-full p-4 border-2 border-black rounded-xl font-bold bg-gray-50 resize-none text-black" placeholder={activeTab === 'link' ? "Вставте посилання..." : "Деталі маршруту, номер місця..."} />
               )}
            </div>

            <button onClick={handleSubmit} className="w-full py-4 bg-[#93E74F] text-black border-4 border-black rounded-xl font-black uppercase shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] active:translate-y-1 active:shadow-none transition-all">
               {isEditing ? "Оновити дані" : "Зберегти"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default TransportTab;