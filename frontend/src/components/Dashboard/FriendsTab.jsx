import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import ConfirmModal from './ConfirmModal'; 

const FriendsTab = ({ onRequestAccepted }) => {
  const userEmail = localStorage.getItem('userEmail');
  
  const [friends, setFriends] = useState([]);
  const [friendRequests, setFriendRequests] = useState([]);
  const [recommendations, setRecommendations] = useState([]);
  
  const [searchEmail, setSearchEmail] = useState('');
  const [foundUser, setFoundUser] = useState(null);
  const [isSearching, setIsSearching] = useState(false);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [friendToDelete, setFriendToDelete] = useState(null);

  const traitLabels = {
    mountains: '🏔️ Гори', sea: '🏖️ Море', museums: '🏛️ Музеї',
    nature: '🌲 Природа', foodie: '🍕 Їжа', nightlife: '🪩 Вечірки',
    shopping: '🛍️ Шопінг', active: '🏃‍♀️ Актив', relax: '🧘‍♀️ Релакс', roadtrips: '🚗 Авто',
    coffee: '☕ Кава' 
  };

  useEffect(() => {
    fetchFriends();
    fetchRequests();
    fetchRecommendations();
  }, []);

  const fetchFriends = async () => {
    try {
      const response = await fetch(`http://127.0.0.1:8000/get-friends/${userEmail}`);
      if (response.ok) {
        const data = await response.json();
        setFriends(data);
      }
    } catch (err) {
      console.error("Помилка завантаження друзів");
    }
  };

  const fetchRequests = async () => {
    try {
      const response = await fetch(`http://127.0.0.1:8000/friend-requests/${userEmail}`);
      if (response.ok) {
        const data = await response.json();
        setFriendRequests(data);
      }
    } catch (err) {
      console.error("Помилка завантаження запитів");
    }
  };

  const fetchRecommendations = async () => {
    try {
      const response = await fetch(`http://127.0.0.1:8000/recommend-friends/${userEmail}`);
      if (response.ok) {
        const data = await response.json();
        setRecommendations(data);
      }
    } catch (err) {
      console.error("Помилка завантаження рекомендацій");
    }
  };

  const handleSearch = async () => {
    if (!searchEmail) return;
    setIsSearching(true);
    try {
      const response = await fetch(`http://127.0.0.1:8000/search-user/${searchEmail}`);
      if (response.ok) {
        const data = await response.json();
        setFoundUser(data);
      } else {
        toast.error("Користувача не знайдено");
        setFoundUser(null);
      }
    } catch (err) {
      toast.error("Помилка пошуку");
    } finally {
      setIsSearching(false);
    }
  };

  const handleAddFriend = async (receiverEmail) => {
    try {
      const response = await fetch(`http://127.0.0.1:8000/send-request?sender_email=${userEmail}&receiver_email=${receiverEmail}`, {
        method: 'POST'
      });
      if (response.ok) {
        toast.success("Запит надіслано! 🚀");
        if (foundUser && foundUser.email === receiverEmail) {
          setFoundUser(null);
          setSearchEmail('');
        }
        fetchRecommendations();
      } else {
        const data = await response.json();
        toast.error(data.detail || "Помилка");
      }
    } catch (err) {
      toast.error("Сервер не відповідає");
    }
  };

  const handleAccept = async (request) => {
    try {
      const response = await fetch(`http://127.0.0.1:8000/accept-friend-request/${request.id}`, {
        method: 'PUT'
      });
      if (response.ok) {
        toast.success(`Тепер ви друзі з ${request.name}! 🤝`);
        fetchRequests();
        fetchFriends();
        fetchRecommendations();
        if (onRequestAccepted) onRequestAccepted();
      }
    } catch (err) {
      toast.error("Помилка підтвердження");
    }
  };

  const openDeleteModal = (friend) => {
    setFriendToDelete(friend);
    setIsModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!friendToDelete) return;

    try {
      const response = await fetch(`http://127.0.0.1:8000/delete-friend?my_email=${userEmail}&friend_email=${friendToDelete.email}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        toast.success("Друга видалено");
        fetchFriends();
        fetchRecommendations(); 
      } else {
        toast.error("Не вдалося видалити друга");
      }
    } catch (err) {
      toast.error("Помилка зв'язку з сервером");
    } finally {
      setIsModalOpen(false);
      setFriendToDelete(null);
    }
  };

  const handleDeclineRequest = async (request) => {
    try {
      const response = await fetch(`http://127.0.0.1:8000/delete-friend?my_email=${userEmail}&friend_email=${request.email}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        toast.error("Запит відхилено");
        fetchRequests();
        if (onRequestAccepted) onRequestAccepted();
      }
    } catch (err) {
      toast.error("Помилка сервера");
    }
  };

  const UserAvatar = ({ email, name, size = "w-16 h-16", textSize = "text-2xl" }) => {
    const [imgError, setImgError] = useState(false);
    const avatarSrc = `http://127.0.0.1:8000/get-avatar/${email}?t=${Date.now()}`;

    return (
      <div className={`${size} bg-[#A3E635] rounded-full flex items-center justify-center border-2 border-black shadow-sm overflow-hidden shrink-0`}>
        {!imgError ? (
          <img 
            src={avatarSrc} 
            alt="" 
            className="w-full h-full object-cover"
            onError={() => setImgError(true)}
          />
        ) : (
          <span className={`${textSize} font-black text-black select-none`}>
            {name ? name.charAt(0).toUpperCase() : 'U'}
          </span>
        )}
      </div>
    );
  };

  return (
    <div className="max-w-7xl mx-auto relative min-h-[90vh]">
      <div className="relative z-10">
        <h1 className="text-4xl font-black mb-12 text-black">Мої друзі</h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 items-start">
          <div className="lg:col-span-2 flex flex-col gap-6">
            
            <div className="relative group">
              <input 
                type="text" 
                placeholder="Введіть email користувача..." 
                value={searchEmail}
                onChange={(e) => setSearchEmail(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                className="w-full px-8 py-5 rounded-[25px] bg-white border-2 border-transparent focus:border-[#A3E635] outline-none shadow-sm text-lg font-medium transition-all"
              />
              <button 
                onClick={handleSearch}
                className="absolute right-4 top-1/2 -translate-y-1/2 bg-[#A3E635] p-3 rounded-2xl hover:scale-105 transition active:scale-95"
              >
                {isSearching ? '⏳' : '🔍'}
              </button>
            </div>

            {foundUser && (
              <div className="bg-[#A3E635]/10 border-2 border-[#A3E635] rounded-[30px] p-6 flex items-center justify-between animate-in fade-in slide-in-from-top-4 shadow-sm">
                <div className="flex items-center gap-4">
                  <UserAvatar email={foundUser.email} name={foundUser.first_name} size="w-14 h-14" textSize="text-xl" />
                  <div>
                    <h3 className="font-black text-black text-lg">{foundUser.first_name}</h3>
                    <p className="text-sm text-gray-500 font-medium">{foundUser.email}</p>
                  </div>
                </div>
                <button 
                  onClick={() => handleAddFriend(foundUser.email)}
                  className="px-8 py-3.5 bg-black text-white rounded-2xl font-bold hover:bg-gray-800 transition shadow-[4px_4px_0px_0px_rgba(163,230,53,1)] active:translate-y-1 active:shadow-none"
                >
                  Додати в друзі
                </button>
              </div>
            )}

            <div className="bg-white/80 backdrop-blur-sm rounded-[40px] p-8 shadow-sm flex flex-col gap-4 border-2 border-gray-50">
              {friends.length > 0 ? (
                friends.map(friend => (
                  <div key={friend.id} className="flex items-center justify-between p-5 hover:bg-white rounded-[30px] transition group border border-transparent hover:border-gray-100 hover:shadow-md">
                    <div className="flex items-center gap-5">
                      <UserAvatar email={friend.email} name={friend.name} size="w-24 h-24" textSize="text-4xl" />
                      <div>
                        <h3 className="text-xl font-extrabold text-black leading-tight">{friend.name}</h3>
                        <p className="text-gray-400 font-bold text-sm tracking-wide uppercase">{friend.email}</p>
                      </div>
                    </div>
                    <button 
                      onClick={() => openDeleteModal(friend)}
                      className="opacity-0 group-hover:opacity-100 px-5 py-2.5 bg-red-50 text-red-500 rounded-xl font-black transition-all text-xs hover:bg-red-500 hover:text-white"
                    >
                      ВИДАЛИТИ
                    </button>
                  </div>
                ))
              ) : (
                <div className="text-center py-16 flex flex-col items-center gap-4">
                  <span className="text-6xl grayscale">🏝️</span>
                  <p className="text-gray-400 font-black text-xl max-w-xs leading-snug">Тут поки порожньо... Знайди когось для спільної подорожі!</p>
                </div>
              )}
            </div>
          </div>

          <div className="lg:col-span-1 flex flex-col gap-8 sticky top-10">
            
            <div className="bg-white/90 backdrop-blur-md rounded-[40px] p-8 shadow-sm border-2 border-dashed border-[#A3E635]">
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-2xl font-black text-black">Запити на дружбу</h2>
                {friendRequests.length > 0 && (
                  <span className="bg-black text-[#A3E635] px-4 py-1 rounded-full text-xs font-black border-2 border-[#A3E635] animate-pulse">
                    {friendRequests.length} НОВИХ
                  </span>
                )}
              </div>

              <div className="flex flex-col gap-6">
                {friendRequests.length > 0 ? (
                  friendRequests.map(request => (
                    <div key={request.id} className="flex flex-col gap-4 p-6 bg-gray-50 rounded-[35px] border-2 border-white shadow-inner">
                      <div className="flex items-center gap-4">
                        <UserAvatar email={request.email} name={request.name} size="w-12 h-12" textSize="text-lg" />
                        <div className="overflow-hidden">
                          <h4 className="font-black text-black text-sm truncate uppercase tracking-tighter">{request.name}</h4>
                          <p className="text-[11px] text-gray-400 font-bold truncate leading-none">{request.email}</p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button 
                          onClick={() => handleAccept(request)} 
                          className="flex-grow py-3.5 bg-[#A3E635] text-black rounded-2xl font-black text-xs border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:bg-[#92d624] transition-all active:translate-y-0.5 active:shadow-none"
                        >
                          ПРИЙНЯТИ
                        </button>
                        <button 
                          onClick={() => handleDeclineRequest(request)}
                          className="px-5 py-3.5 bg-white border-2 border-gray-200 text-gray-400 rounded-2xl font-black text-xs hover:text-red-500 hover:border-red-500 transition-all"
                        >
                          ✕
                        </button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-10 bg-gray-50/50 rounded-[30px] border-2 border-dotted border-gray-200">
                    <p className="text-gray-400 text-sm font-black uppercase tracking-widest">Немає нових запитів</p>
                  </div>
                )}
              </div>
            </div>

            {recommendations.length > 0 && (
              <div className="bg-[#A3E635]/10 rounded-[40px] p-8 border-2 border-[#A3E635] shadow-sm backdrop-blur-md">
                <h2 className="text-2xl font-black text-black mb-6">✨ Ідеальні компаньйони</h2>
                <div className="flex flex-col gap-4">
                  {recommendations.map(rec => (
                    <div key={rec.id} className="bg-white p-5 rounded-[25px] border-2 border-[#A3E635] shadow-sm flex flex-col gap-4 hover:shadow-md transition-all">
                      <div className="flex items-center gap-4">
                        <UserAvatar email={rec.email} name={rec.first_name} size="w-12 h-12" textSize="text-lg" />
                        <div className="flex-grow overflow-hidden">
                          <h3 className="font-black text-black text-lg truncate leading-tight">{rec.first_name}</h3>
                          <p className="text-xs text-gray-500 font-bold truncate">{rec.email}</p>
                        </div>
                        <button 
                          onClick={() => handleAddFriend(rec.email)}
                          className="bg-black text-[#A3E635] px-4 py-2.5 rounded-xl font-bold text-xs hover:bg-gray-800 transition active:scale-95 whitespace-nowrap shadow-[2px_2px_0px_0px_rgba(163,230,53,1)] active:shadow-none"
                        >
                          Додати
                        </button>
                      </div>
                      
                      {rec.shared_traits && rec.shared_traits.length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-1">
                          <span className="bg-black text-white text-[10px] font-black px-2.5 py-1 rounded-md uppercase tracking-wider">
                            🔥 Збігів: {rec.score}
                          </span>
                          {rec.shared_traits.map(trait => (
                             <span key={trait} className="bg-[#A3E635]/20 text-black border border-[#A3E635] text-[10px] font-bold px-2 py-1 rounded-md">
                               {traitLabels[trait] || trait}
                             </span>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

          </div>
        </div>
      </div>

      <ConfirmModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onConfirm={handleConfirmDelete}
        title="Видалити друга?"
        message={friendToDelete ? `Ви впевнені, що хочете видалити ${friendToDelete.name} (${friendToDelete.email}) зі списку друзів? Ця дія незворотна.` : ""}
      />
    </div>
  );
};

export default FriendsTab;