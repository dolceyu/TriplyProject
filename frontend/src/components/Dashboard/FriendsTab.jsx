import React, { useState } from 'react';
import toast from 'react-hot-toast';

const FriendsTab = () => {
  // Твої поточні друзі
  const [friends, setFriends] = useState([
    { id: 1, name: 'Стефочка', email: 'stefka@gmail.com', status: 'online' },
    { id: 2, name: 'Андрій', email: 'andrii@ukr.net', status: 'offline' }
  ]);

  // ЗАПИТИ В ДРУЗІ (новий стейт)
  const [friendRequests, setFriendRequests] = useState([
    { id: 10, name: 'Олена Коваль', email: 'olena@gmail.com' },
    { id: 11, name: 'Максим подорожник', email: 'max_travel@ukr.net' }
  ]);

  const [searchTerm, setSearchTerm] = useState('');

  // Логіка підтвердження дружби
  const handleAccept = (request) => {
    setFriends([...friends, { ...request, status: 'offline' }]); // Додаємо в друзі
    setFriendRequests(friendRequests.filter(r => r.id !== request.id)); // Видаляємо із запитів
    toast.success(`Тепер ви друзі з ${request.name}! 🤝`);
  };

  // Логіка відхилення
  const handleDecline = (id) => {
    setFriendRequests(friendRequests.filter(r => r.id !== id));
    toast.error("Запит відхилено");
  };

  return (
    <div className="max-w-7xl mx-auto">
      <h1 className="text-4xl font-black mb-12 text-black">Мої друзі</h1>

      {/* Сітка: основний список зліва (2/3) і запити справа (1/3) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 items-start">
        
        {/* ЛІВА КОЛОНКА: Пошук та список друзів */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          <div className="relative">
            <input 
              type="text" 
              placeholder="Знайти друга за іменем або поштою..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-8 py-5 rounded-[25px] bg-white border-2 border-transparent focus:border-[#A3E635] outline-none shadow-sm text-lg font-medium transition-all"
            />
            <span className="absolute right-8 top-1/2 -translate-y-1/2 text-2xl">🔍</span>
          </div>

          <div className="bg-white rounded-[40px] p-8 shadow-sm flex flex-col gap-4 border-2 border-gray-50">
            {friends.length > 0 ? (
              friends.map(friend => (
                <div key={friend.id} className="flex items-center justify-between p-4 hover:bg-gray-50 rounded-3xl transition group">
                  <div className="flex items-center gap-5">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center text-2xl font-black border-2 border-black">
                      {friend.name.charAt(0)}
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-black">{friend.name}</h3>
                      <p className="text-gray-400 font-medium">{friend.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`w-3 h-3 rounded-full ${friend.status === 'online' ? 'bg-green-500' : 'bg-gray-300'}`}></span>
                    <button className="opacity-0 group-hover:opacity-100 px-4 py-2 bg-red-50 text-red-500 rounded-xl font-bold transition text-sm">Видалити</button>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-center text-gray-400 py-10 font-bold italic">У вас поки немає друзів. Час когось запросити! 👋</p>
            )}
          </div>
        </div>

        {/* ПРАВА КОЛОНКА: Запити на дружбу */}
        <div className="bg-white rounded-[40px] p-8 shadow-sm border-2 border-dashed border-[#A3E635] sticky top-10">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-black text-black">Запити</h2>
            {friendRequests.length > 0 && (
              <span className="bg-[#A3E635] text-black px-3 py-1 rounded-full text-sm font-black border border-black">
                {friendRequests.length}
              </span>
            )}
          </div>

          <div className="flex flex-col gap-6">
            {friendRequests.length > 0 ? (
              friendRequests.map(request => (
                <div key={request.id} className="flex flex-col gap-4 p-5 bg-gray-50 rounded-[30px] border border-gray-100">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-black text-[#A3E635] rounded-full flex items-center justify-center font-black">
                      {request.name.charAt(0)}
                    </div>
                    <div className="overflow-hidden">
                      <h4 className="font-bold text-black truncate">{request.name}</h4>
                      <p className="text-xs text-gray-400 truncate">{request.email}</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button 
                      onClick={() => handleAccept(request)}
                      className="flex-grow py-3 bg-[#A3E635] text-black rounded-xl font-black text-sm hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all active:translate-y-0.5"
                    >
                      Прийняти
                    </button>
                    <button 
                      onClick={() => handleDecline(request.id)}
                      className="px-4 py-3 bg-white border border-gray-200 text-gray-400 rounded-xl font-bold text-sm hover:text-red-500 hover:border-red-200 transition"
                    >
                      ✕
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-6">
                <p className="text-gray-400 text-sm font-medium">Нових запитів немає ☕</p>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};

export default FriendsTab;