import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { Plus, Link as LinkIcon, FileText, AlignLeft, X, Download, Trash2, Pencil, Image as ImageIcon } from 'lucide-react';

const DocumentsTab = ({ trip }) => {
  const [items, setItems] = useState([]);
  const [selectedItem, setSelectedItem] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({ title: '', content: '' });
  const [selectedFile, setSelectedFile] = useState(null);

  const fileInputRef = useRef(null);

  useEffect(() => {
    const fetchDocuments = async () => {
      try {
        const res = await axios.get(`http://localhost:8000/trips/${trip.id}/documents/docs`);
        const sorted = res.data.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
        setItems(sorted);
      } catch (err) {
        console.error("Помилка завантаження документів:", err);
      }
    };
    if (trip?.id) fetchDocuments();
  }, [trip]);
  
  const handleSubmit = async () => {
    if (!formData.title) return;

    if (isEditing) {
      try {
        const response = await axios.patch(`http://localhost:8000/documents/${selectedItem.id}`, {
          title: formData.title,
          content: formData.content, 
          category: 'docs',
          item_type: 'file'
        });
        setItems(items.map(item => item.id === selectedItem.id ? response.data : item));
        setSelectedItem(response.data);
        setIsModalOpen(false);
        resetForm();
      } catch (error) {
        console.error(error);
      }
    } else {
      if (!selectedFile) {
        alert("Будь ласка, оберіть файл!");
        return;
      }

      const data = new FormData();
      data.append('category', 'docs');
      data.append('title', formData.title);
      data.append('item_type', 'file'); 
      data.append('file', selectedFile);

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
    if (!window.confirm("Видалити цей документ?")) return;
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

  const renderIcon = (filename = '') => {
    const isImg = /\.(jpg|jpeg|png|webp|gif)$/i.test(filename);
    return isImg ? <ImageIcon size={18} /> : <FileText size={18} />;
  };

  return (
    <div className="flex-1 flex w-full gap-6 font-sans text-black pb-4 pr-3 min-h-0">
      <div className="w-1/2 flex flex-col bg-white border-4 border-black rounded-3xl shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] overflow-hidden">
        <div className="p-6 border-b-4 border-black flex justify-between items-center bg-gray-50">
          <h2 className="font-black text-xl uppercase tracking-widest flex items-center gap-2 text-black">
            📄 Документи
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
                {renderIcon(item.content)}
              </div>
              <div className="flex-1 overflow-hidden text-black">
                <h4 className="font-black text-sm uppercase truncate">{item.title}</h4>
                <p className="text-[10px] font-bold text-gray-500 uppercase mt-1">Документ</p>
              </div>
            </button>
          ))}
        </div>

        <div className="p-6 border-t-4 border-black bg-white">
          <button 
            onClick={() => { resetForm(); setIsModalOpen(true); }}
            className="w-full py-4 bg-[#93E74F] text-black border-4 border-black rounded-xl font-black text-sm uppercase shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:translate-y-1 active:shadow-none transition-all flex items-center justify-center gap-2"
          >
            <Plus size={20} /> Додати документ
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
                   <a href={getFileUrl(selectedItem.content)} download className="p-2 border-2 border-black rounded-lg bg-black text-[#93E74F]"><Download size={16}/></a>
                </div>
             </div>
             <div className="flex-1 overflow-hidden bg-white">
                {selectedItem.content?.toLowerCase().endsWith('.pdf') ? 
                   <iframe src={getFileUrl(selectedItem.content)} className="w-full h-full border-none" /> : 
                   <div className="p-4 flex justify-center h-full items-center bg-gray-100"><img src={getFileUrl(selectedItem.content)} className="max-h-full border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]" /></div>
                }
             </div>
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center opacity-40 text-black font-black uppercase text-sm">Оберіть документ</div>
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4 text-black">
          <div className="bg-white border-4 border-black rounded-3xl p-8 max-w-lg w-full relative shadow-[12px_12px_0px_0px_rgba(0,0,0,1)]">
            <button onClick={() => setIsModalOpen(false)} className="absolute top-6 right-6 text-gray-500 hover:text-black"><X size={24} /></button>
            <h2 className="text-2xl font-black uppercase italic mb-6 text-black">{isEditing ? "Редагувати документ" : "Додати документ"}</h2>
            
            <div className="space-y-4 mb-8">
               <input 
                 type="text" 
                 value={formData.title} 
                 onChange={(e) => setFormData({...formData, title: e.target.value})} 
                 className="w-full p-4 border-2 border-black rounded-xl font-bold bg-gray-50 text-black focus:outline-none focus:ring-2 focus:ring-[#93E74F]" 
                 placeholder="Назва (напр. Скан паспорта)" 
               />
               
               {!isEditing && (
                  <div onClick={() => fileInputRef.current.click()} className="border-4 border-dashed border-gray-300 rounded-xl p-8 text-center cursor-pointer bg-gray-50 hover:border-black transition-colors">
                     <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept=".pdf,.jpg,.png" />
                     <FileText size={32} className={`mx-auto mb-2 ${selectedFile ? 'text-[#93E74F]' : 'text-gray-400'}`} />
                     <p className="font-black text-xs uppercase text-black">{selectedFile ? selectedFile.name : "Оберіть файл документа"}</p>
                  </div>
               )}
            </div>

            <button 
              onClick={handleSubmit} 
              disabled={!formData.title || (!isEditing && !selectedFile)}
              className="w-full py-4 bg-[#93E74F] text-black border-4 border-black rounded-xl font-black uppercase shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] active:translate-y-1 active:shadow-none transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
               {isEditing ? "Оновити назву" : "Зберегти"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default DocumentsTab;