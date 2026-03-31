import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { Plus, Link as LinkIcon, FileText, AlignLeft, ExternalLink, MapPin, X, Download, Trash2, Pencil } from 'lucide-react';

const HousingTab = ({ trip }) => {
  const [items, setItems] = useState([]);
  const [selectedItem, setSelectedItem] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false); 
  const [activeTab, setActiveTab] = useState('link'); 
  const [formData, setFormData] = useState({ title: '', content: '' });
  const [selectedFile, setSelectedFile] = useState(null);

  const fileInputRef = useRef(null);

  useEffect(() => {
    const fetchHousing = async () => {
      try {
        const res = await axios.get(`http://localhost:8000/trips/${trip.id}/documents/housing`);
        const sorted = res.data.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
        setItems(sorted);
      } catch (err) {
        console.error("Помилка завантаження житла:", err);
      }
    };
    if (trip?.id) fetchHousing();
  }, [trip]);

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
        console.error("Помилка оновлення:", error);
      }
    } else {
      const data = new FormData();
      data.append('category', 'housing');
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
        console.error("Помилка збереження:", error);
      }
    }
  };

  const handleDelete = async (e, id) => {
    e.stopPropagation();
    if (!window.confirm("Видалити це бронювання?")) return;
    try {
      await axios.delete(`http://localhost:8000/documents/${id}`);
      setItems(items.filter(item => item.id !== id));
      if (selectedItem?.id === id) setSelectedItem(null);
    } catch (err) {
      console.error("Помилка видалення:", err);
    }
  };

  const resetForm = () => {
    setFormData({ title: '', content: '' });
    setSelectedFile(null);
    setIsEditing(false);
  };

  const handleEditClick = () => {
    setFormData({ 
      title: selectedItem.title, 
      content: selectedItem.content 
    });
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

  const renderIcon = (type) => {
    switch (type) {
      case 'link': return <LinkIcon size={18} />;
      case 'text': return <AlignLeft size={18} />;
      case 'file': return <FileText size={18} />;
      default: return <FileText size={18} />;
    }
  };

  const getFileUrl = (fileName) => `http://localhost:8000/uploads/${fileName}`;

  return (
    <div className="flex-1 flex w-full gap-6 font-sans text-black pb-4 pr-3 min-h-0">
      
      <div className="w-1/2 flex flex-col bg-white border-4 border-black rounded-3xl shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] overflow-hidden">
        <div className="p-6 border-b-4 border-black flex justify-between items-center bg-gray-50">
          <h2 className="font-black text-xl uppercase tracking-widest flex items-center gap-2 text-black">
            🏠 Ваше житло
          </h2>
          <span className="bg-[#93E74F] text-black text-[10px] px-2 py-1 rounded-lg font-black border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
            {items.length} БРОНЕЙ
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
              <div onClick={(e) => handleDelete(e, item.id)} className="absolute -top-2 -left-2 w-7 h-7 bg-white border-2 border-black rounded-full flex items-center justify-center text-red-500 opacity-0 group-hover:opacity-100 transition-all shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:bg-red-50 z-10">
                <Trash2 size={12} />
              </div>
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center border-2 border-black ${selectedItem?.id === item.id ? 'bg-[#93E74F]' : 'bg-gray-100'}`}>
                {renderIcon(item.item_type)}
              </div>
              <div className="flex-1 overflow-hidden">
                <h4 className="font-black text-sm uppercase truncate text-black">{item.title}</h4>
                <p className="text-[10px] font-bold text-gray-500 uppercase mt-1">
                  Додано: {new Date(item.created_at).toLocaleDateString('uk-UA')}
                </p>
              </div>
            </button>
          ))}
        </div>

        <div className="p-6 border-t-4 border-black bg-white">
          <button 
            onClick={() => { resetForm(); setIsModalOpen(true); }}
            className="w-full py-4 bg-[#93E74F] text-black border-4 border-black rounded-xl font-black text-sm uppercase shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:translate-y-1 active:shadow-none transition-all flex items-center justify-center gap-2"
          >
            <Plus size={20} /> Додати бронювання
          </button>
        </div>
      </div>
      <div className="w-1/2 bg-gray-50 border-4 border-dashed border-gray-300 rounded-3xl flex flex-col overflow-hidden relative shadow-inner">
        {selectedItem ? (
          <div className="flex-1 bg-white border-4 border-black rounded-2xl m-4 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] flex flex-col overflow-hidden text-black">
            <div className="p-6 border-b-4 border-black flex items-center justify-between bg-[#93E74F]/20">
              <div className="flex items-center gap-3 overflow-hidden">
                <div className="w-12 h-12 bg-black text-[#93E74F] rounded-xl flex items-center justify-center border-2 border-black shrink-0">
                   {renderIcon(selectedItem.item_type)}
                </div>
                <div className="overflow-hidden">
                  <span className="text-[10px] font-black uppercase tracking-widest text-gray-500 italic">
                    {selectedItem.item_type === 'link' ? 'Посилання' : selectedItem.item_type === 'text' ? 'Нотатка' : 'Документ'}
                  </span>
                  <h2 className="text-xl font-black uppercase tracking-tight leading-none truncate">{selectedItem.title}</h2>
                </div>
              </div>
              
              <div className="flex gap-2">
                <button 
                  onClick={handleEditClick}
                  className="p-3 bg-white text-black rounded-xl border-2 border-black hover:scale-110 transition-transform shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                  title="Редагувати"
                >
                  <Pencil size={18} />
                </button>

                {selectedItem.item_type === 'file' && (
                  <a href={getFileUrl(selectedItem.content)} download className="p-3 bg-black text-[#93E74F] rounded-xl border-2 border-black hover:scale-110 transition-transform shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                    <Download size={18} />
                  </a>
                )}
              </div>
            </div>
            
            <div className="flex-1 overflow-hidden bg-gray-100 flex flex-col">
              {selectedItem.item_type === 'link' && (
                <div className="p-8 text-center mt-10">
                  <p className="font-bold text-gray-500 mb-6 italic">Посилання на сайт:</p>
                  <a href={selectedItem.content} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 px-8 py-4 bg-black text-[#93E74F] border-2 border-black rounded-xl font-black uppercase shadow-[4px_4px_0px_0px_rgba(147,231,79,1)] transition-all">
                    Перейти <ExternalLink size={18} />
                  </a>
                </div>
              )}
              {selectedItem.item_type === 'text' && (
                <div className="p-8 h-full overflow-y-auto bg-white m-4 border-2 border-black rounded-xl shadow-inner">
                  <p className="whitespace-pre-wrap font-medium text-sm leading-relaxed">{selectedItem.content}</p>
                </div>
              )}
              {selectedItem.item_type === 'file' && (
                <div className="w-full h-full bg-gray-200">
                  {selectedItem.content.toLowerCase().endsWith('.pdf') ? (
                    <iframe src={getFileUrl(selectedItem.content)} className="w-full h-full border-none" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center p-6 bg-gray-200">
                      <img src={getFileUrl(selectedItem.content)} className="max-w-full max-h-full object-contain border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]" alt="Preview" />
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center text-center opacity-40 text-black">
            <div>
              <AlignLeft size={48} className="mx-auto mb-4" />
              <p className="font-black uppercase tracking-widest text-sm">Оберіть документ</p>
            </div>
          </div>
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-in fade-in text-black">
          <div className="bg-white border-4 border-black rounded-3xl p-8 max-w-lg w-full relative shadow-[12px_12px_0px_0px_rgba(0,0,0,1)]">
            <button onClick={() => setIsModalOpen(false)} className="absolute top-6 right-6 text-gray-500 hover:text-black">
              <X size={24} />
            </button>

            <h2 className="text-2xl font-black uppercase italic mb-6">
              {isEditing ? "Редагувати житло" : "Додати житло"}
            </h2>

            {!isEditing && (
              <div className="flex gap-2 mb-6 bg-gray-100 p-1.5 rounded-2xl border-2 border-black">
                {['link', 'text', 'file'].map(t => (
                  <button 
                    key={t}
                    onClick={() => setActiveTab(t)} 
                    className={`flex-1 py-3 font-black text-xs uppercase rounded-xl flex items-center justify-center gap-2 transition-all ${activeTab === t ? 'bg-white border-2 border-black text-black' : 'text-gray-500'}`}
                  >
                    {t === 'link' ? 'Лінк' : t === 'text' ? 'Текст' : 'Файл'}
                  </button>
                ))}
              </div>
            )}

            <div className="space-y-4 mb-8">
              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase mb-2">Назва</label>
                <input 
                  type="text" 
                  value={formData.title}
                  onChange={(e) => setFormData({...formData, title: e.target.value})}
                  className="w-full p-4 bg-gray-50 border-2 border-black rounded-xl font-bold text-black"
                />
              </div>

              {activeTab !== 'file' && (
                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase mb-2">
                    {activeTab === 'link' ? 'URL' : 'Текст нотатки'}
                  </label>
                  {activeTab === 'link' ? (
                    <input type="url" value={formData.content} onChange={(e) => setFormData({...formData, content: e.target.value})} className="w-full p-4 bg-gray-50 border-2 border-black rounded-xl font-bold" />
                  ) : (
                    <textarea rows="4" value={formData.content} onChange={(e) => setFormData({...formData, content: e.target.value})} className="w-full p-4 bg-gray-50 border-2 border-black rounded-xl font-bold resize-none" />
                  )}
                </div>
              )}
              
              {activeTab === 'file' && !isEditing && (
                <div onClick={() => fileInputRef.current.click()} className="border-4 border-dashed border-gray-300 rounded-xl p-8 text-center cursor-pointer bg-gray-50 hover:border-black">
                  <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept=".pdf,.jpg,.png" />
                  <FileText size={32} className="mx-auto mb-2 text-gray-300" />
                  <p className="font-black text-xs uppercase">{formData.content || "Оберіть новий файл"}</p>
                </div>
              )}
            </div>

            <button 
              onClick={handleSubmit}
              className="w-full py-4 bg-[#93E74F] text-black border-4 border-black rounded-xl font-black uppercase shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] active:translate-y-1 active:shadow-none transition-all"
            >
              {isEditing ? "Оновити дані" : "Зберегти"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default HousingTab;