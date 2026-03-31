import React, { useState } from 'react';
import { Plus, CheckSquare, Square, Trash2, ListTodo, X } from 'lucide-react';

const ChecklistsTab = () => {
  // Базові дані для демонстрації
  const [lists, setLists] = useState([
    {
      id: 1,
      title: 'Що взяти з собою 🎒',
      tasks: [
        { id: 101, text: 'Паспорти', completed: false },
        { id: 102, text: 'Зарядки та павербанк', completed: true },
        { id: 103, text: 'Аптечка (від болю, пластирі)', completed: false },
      ]
    },
    {
      id: 2,
      title: 'Зробити до виїзду ✈️',
      tasks: [
        { id: 201, text: 'Купити страховку', completed: false },
        { id: 202, text: 'Поміняти готівку (євро)', completed: false },
      ]
    }
  ]);

  const [activeListId, setActiveListId] = useState(lists[0]?.id || null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newListTitle, setNewListTitle] = useState('');
  const [newTaskText, setNewTaskText] = useState('');

  const activeList = lists.find(list => list.id === activeListId);

  // Створення нового списку (зліва)
  const handleAddList = () => {
    if (!newListTitle.trim()) return;
    const newList = {
      id: Date.now(),
      title: newListTitle,
      tasks: []
    };
    setLists([newList, ...lists]);
    setActiveListId(newList.id);
    setNewListTitle('');
    setIsModalOpen(false);
  };

  // Видалення списку
  const handleDeleteList = (e, id) => {
    e.stopPropagation();
    const updatedLists = lists.filter(list => list.id !== id);
    setLists(updatedLists);
    if (activeListId === id) {
      setActiveListId(updatedLists.length > 0 ? updatedLists[0].id : null);
    }
  };

  // Додавання завдання в активний список (справа)
  const handleAddTask = (e) => {
    if (e.key === 'Enter' && newTaskText.trim()) {
      const updatedLists = lists.map(list => {
        if (list.id === activeListId) {
          return {
            ...list,
            tasks: [...list.tasks, { id: Date.now(), text: newTaskText, completed: false }]
          };
        }
        return list;
      });
      setLists(updatedLists);
      setNewTaskText('');
    }
  };

  // Перемикання чекбокса
  const toggleTask = (taskId) => {
    const updatedLists = lists.map(list => {
      if (list.id === activeListId) {
        return {
          ...list,
          tasks: list.tasks.map(task => 
            task.id === taskId ? { ...task, completed: !task.completed } : task
          )
        };
      }
      return list;
    });
    setLists(updatedLists);
  };

  // Видалення завдання
  const deleteTask = (taskId) => {
    const updatedLists = lists.map(list => {
      if (list.id === activeListId) {
        return {
          ...list,
          tasks: list.tasks.filter(task => task.id !== taskId)
        };
      }
      return list;
    });
    setLists(updatedLists);
  };

  return (
    <div className="flex-1 flex w-full gap-6 font-sans text-black pb-4 pr-3 min-h-0">
      
      {/* ЛІВА ЧАСТИНА: КАТЕГОРІЇ СПИСКІВ */}
      <div className="w-[40%] flex flex-col bg-white border-4 border-black rounded-3xl shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] overflow-hidden">
        <div className="p-6 border-b-4 border-black flex justify-between items-center bg-gray-50">
          <h2 className="font-black text-xl uppercase tracking-widest flex items-center gap-2">
            Чеклисти 📝
          </h2>
          <span className="bg-black text-[#93E74F] text-[10px] px-2 py-1 rounded-lg font-black shadow-sm">
            {lists.length} СПИСКІВ
          </span>
        </div>

        <div className="flex-1 overflow-y-auto p-6 bg-white flex flex-col gap-4">
          {lists.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center opacity-50 py-10">
              <ListTodo size={48} className="mb-4 text-gray-400" />
              <p className="font-black uppercase tracking-widest text-sm text-black">Немає чеклистів</p>
            </div>
          ) : (
            lists.map(list => {
              const completedCount = list.tasks.filter(t => t.completed).length;
              const totalCount = list.tasks.length;
              const progress = totalCount === 0 ? 0 : Math.round((completedCount / totalCount) * 100);

              return (
                <div 
                  key={list.id}
                  onClick={() => setActiveListId(list.id)}
                  className={`group relative w-full text-left p-4 rounded-2xl border-2 transition-all cursor-pointer ${
                    activeListId === list.id 
                      ? 'bg-[#93E74F]/10 border-[#93E74F] shadow-[4px_4px_0px_0px_rgba(147,231,79,1)] translate-x-1' 
                      : 'bg-white border-black hover:bg-gray-50 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]'
                  }`}
                >
                  <button 
                    onClick={(e) => handleDeleteList(e, list.id)}
                    className="absolute -top-3 -left-3 w-8 h-8 bg-white border-2 border-black rounded-full flex items-center justify-center text-red-500 opacity-0 group-hover:opacity-100 transition-all shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:bg-red-50 z-10"
                  >
                    <Trash2 size={14} strokeWidth={3} />
                  </button>

                  <h4 className="font-black text-sm uppercase truncate pr-2">{list.title}</h4>
                  
                  <div className="mt-3">
                    <div className="flex justify-between text-[10px] font-bold text-gray-500 uppercase mb-1">
                      <span>Прогрес</span>
                      <span>{completedCount} / {totalCount}</span>
                    </div>
                    <div className="h-1.5 w-full bg-gray-200 rounded-full overflow-hidden border border-black/10">
                      <div style={{ width: `${progress}%` }} className="h-full bg-black transition-all duration-300"></div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        <div className="p-6 border-t-4 border-black bg-white">
          <button 
            onClick={() => setIsModalOpen(true)}
            className="w-full py-4 bg-[#93E74F] text-black border-4 border-black rounded-xl font-black text-sm uppercase shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:translate-y-1 active:shadow-none transition-all flex items-center justify-center gap-2"
          >
            <Plus size={20} /> Створити список
          </button>
        </div>
      </div>

      {/* ПРАВА ЧАСТИНА: ЗАВДАННЯ (ТУ-ДУ ЛІСТ) */}
      <div className="w-[60%] bg-white border-4 border-black rounded-3xl flex flex-col overflow-hidden shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
        {!activeList ? (
          <div className="flex-1 flex items-center justify-center text-center opacity-40 bg-gray-50">
            <div>
              <CheckSquare size={48} className="mx-auto mb-4" />
              <p className="font-black uppercase tracking-widest text-sm">Оберіть список ліворуч</p>
            </div>
          </div>
        ) : (
          <>
            <div className="p-6 border-b-4 border-black bg-[#93E74F]">
              <h2 className="text-2xl font-black uppercase tracking-tight italic">{activeList.title}</h2>
            </div>
            
            <div className="flex-1 overflow-y-auto p-8 bg-gray-50">
              {activeList.tasks.length === 0 ? (
                <p className="text-center font-bold text-gray-400 uppercase text-xs mt-10">Тут поки порожньо. Додайте перше завдання!</p>
              ) : (
                <div className="space-y-3">
                  {activeList.tasks.map(task => (
                    <div 
                      key={task.id} 
                      className={`group flex items-center gap-4 p-4 rounded-xl border-2 transition-all ${
                        task.completed 
                          ? 'bg-gray-100 border-gray-300' 
                          : 'bg-white border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]'
                      }`}
                    >
                      <button 
                        onClick={() => toggleTask(task.id)}
                        className={`transition-colors ${task.completed ? 'text-[#93E74F]' : 'text-gray-300 hover:text-black'}`}
                      >
                        {task.completed ? <CheckSquare size={24} className="text-black bg-[#93E74F] rounded-md" /> : <Square size={24} />}
                      </button>
                      
                      <span className={`flex-1 font-bold text-sm transition-all ${task.completed ? 'line-through text-gray-400' : 'text-black'}`}>
                        {task.text}
                      </span>

                      <button 
                        onClick={() => deleteTask(task.id)}
                        className="opacity-0 group-hover:opacity-100 p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Ввід нового завдання */}
            <div className="p-6 border-t-4 border-black bg-white">
              <input 
                type="text" 
                value={newTaskText}
                onChange={(e) => setNewTaskText(e.target.value)}
                onKeyDown={handleAddTask}
                placeholder="Напишіть завдання та натисніть Enter..."
                className="w-full p-4 bg-gray-100 border-2 border-black rounded-xl font-bold text-sm focus:bg-white focus:outline-none focus:ring-4 focus:ring-[#93E74F]/50 transition-all placeholder:text-gray-400 placeholder:uppercase placeholder:text-xs"
              />
            </div>
          </>
        )}
      </div>

      {/* МОДАЛКА НОВОГО СПИСКУ */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white border-4 border-black rounded-3xl p-8 max-w-sm w-full relative shadow-[12px_12px_0px_0px_rgba(0,0,0,1)]">
            <button onClick={() => setIsModalOpen(false)} className="absolute top-6 right-6 text-gray-500 hover:text-black hover:rotate-90 transition-all">
              <X size={24} strokeWidth={3} />
            </button>

            <h2 className="text-xl font-black uppercase italic mb-6">Новий чеклист</h2>

            <div className="mb-6">
              <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-2">Назва списку</label>
              <input 
                type="text" 
                value={newListTitle}
                onChange={(e) => setNewListTitle(e.target.value)}
                autoFocus
                className="w-full p-4 bg-gray-50 border-2 border-black rounded-xl font-bold focus:bg-white focus:outline-none focus:ring-4 focus:ring-[#93E74F]/50 transition-all"
                placeholder="Напр. Купити в дьюті-фрі..."
              />
            </div>

            <button 
              onClick={handleAddList}
              disabled={!newListTitle.trim()}
              className="w-full py-4 bg-[#93E74F] text-black border-4 border-black rounded-xl font-black uppercase shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:translate-y-1 active:shadow-none transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Створити
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChecklistsTab;