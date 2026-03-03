import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import logoImg from '../assets/logo-mini.png';

import TripsTab from '../components/Dashboard/TripsTab';
import FriendsTab from '../components/Dashboard/FriendsTab';
import ProfileTab from '../components/Dashboard/ProfileTab';
import SettingsTab from '../components/Dashboard/SettingsTab';

const Dashboard = () => {
  const navigate = useNavigate();
  const [userName, setUserName] = useState('');
  
  const [activeTab, setActiveTab] = useState(localStorage.getItem('activeTab') || 'trips'); 
  const [requestCount, setRequestCount] = useState(0);

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deletePassword, setDeletePassword] = useState('');
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');

  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [profileName, setProfileName] = useState('');
  const [dob, setDob] = useState(''); 
  
  const [preferences, setPreferences] = useState({
    mountains: false, sea: false, museums: false, nature: false, 
    foodie: false, nightlife: false, shopping: false, active: false, 
    relax: false, roadtrips: false
  });

  useEffect(() => {
    const savedName = localStorage.getItem('userName');
    const userEmail = localStorage.getItem('userEmail');

    if (!savedName || !userEmail) {
      navigate('/login');
    } else {
      setUserName(savedName);
      setProfileName(savedName);
      
      fetch(`http://127.0.0.1:8000/get-profile/${userEmail}`)
        .then(res => res.json())
        .then(data => {
          if (data.first_name) {
            setUserName(data.first_name);
            setProfileName(data.first_name);
            localStorage.setItem('userName', data.first_name);
          }
          if (data.dob) setDob(data.dob);
          if (data.preferences) setPreferences(prev => ({ ...prev, ...data.preferences }));
        })
        .catch(err => console.error("Помилка завантаження профілю:", err));
    }
  }, [navigate]);

  const fetchRequestCount = async () => {
    const userEmail = localStorage.getItem('userEmail');
    if (!userEmail) return;
    try {
      const response = await fetch(`http://127.0.0.1:8000/friend-requests/${userEmail}`);
      if (response.ok) {
        const data = await response.json();
        setRequestCount(data.length);
      }
    } catch (err) {
      console.error("Помилка каунтера:", err);
    }
  };

  useEffect(() => {
    fetchRequestCount();
    const interval = setInterval(fetchRequestCount, 60000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    localStorage.setItem('activeTab', activeTab);
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setShowDeleteConfirm(false); 
    setDeletePassword('');
  }, [activeTab]);

  const handleLogout = () => {
    localStorage.clear();
    toast.success("Ви вийшли з акаунта");
    navigate('/');
  };

  const handleSaveProfile = async () => {
    const userEmail = localStorage.getItem('userEmail');
    try {
      const response = await fetch('http://127.0.0.1:8000/update-profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: userEmail,
          first_name: profileName, 
          dob: dob,
          preferences: preferences
        }),
      });

      if (response.ok) {
        localStorage.setItem('userName', profileName);
        setUserName(profileName);
        setIsEditingProfile(false);
        toast.success("Дані збережено! 🚀");
      } else {
        const error = await response.json();
        toast.error(error.detail || "Помилка збереження");
      }
    } catch (error) {
      toast.error("Сервер не відповідає");
    }
  };

  const handleChangePassword = async () => {
    if (!oldPassword || !newPassword) {
      toast.error("Заповніть обидва поля пароля");
      return;
    }
    const userEmail = localStorage.getItem('userEmail');
    try {
      const response = await fetch('http://127.0.0.1:8000/change-password', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: userEmail,
          old_password: oldPassword,
          new_password: newPassword
        }),
      });
      const data = await response.json();
      if (response.ok) {
        toast.success("Пароль успішно змінено! 🔐");
        setOldPassword('');
        setNewPassword('');
      } else {
        toast.error(data.detail || "Помилка при зміні пароля");
      }
    } catch (error) {
      toast.error("Сервер не відповідає");
    }
  };

  const handleDeleteAccount = async () => {
    if (!deletePassword) {
      toast.error("Введіть пароль для підтвердження");
      return;
    }
    const userEmail = localStorage.getItem('userEmail');
    try {
      const response = await fetch('http://127.0.0.1:8000/delete-account', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: userEmail,
          password: deletePassword
        }),
      });
      if (response.ok) {
        localStorage.clear();
        toast.success("Акаунт назавжди видалено");
        navigate('/');
      } else {
        const data = await response.json();
        toast.error(data.detail || "Не вдалося видалити акаунт");
      }
    } catch (error) {
      toast.error("Сервер не відповідає");
    }
  };

  const togglePreference = (key) => {
    setPreferences(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const formatDate = (dateString) => {
    if (!dateString) return "Не вказано";
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString('uk-UA', options);
  };

  return (
    <div className="min-h-screen bg-[#F9FAFB] flex flex-col" style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "Segoe UI", Roboto, sans-serif' }}>
      <nav className="px-16 pt-10 pb-6 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-4">
          <img src={logoImg} alt="Logo" className="w-14 h-14" />
          <span className="text-3xl font-bold tracking-tighter text-black">Triply</span>
        </Link>
        
        <div className="flex items-center gap-10">
          <div className="flex gap-6 font-semibold text-gray-500 text-lg">
            <button onClick={() => setActiveTab('trips')} className={`hover:text-black transition pb-1 ${activeTab === 'trips' ? 'text-black border-b-2 border-[#A3E635]' : ''}`}>Подорожі</button>
            
            <button 
              onClick={() => setActiveTab('friends')} 
              className={`hover:text-black transition pb-1 relative ${activeTab === 'friends' ? 'text-black border-b-2 border-[#A3E635]' : ''}`}
            >
              Друзі
              {requestCount > 0 && (
                <span className="absolute -top-2 -right-4 bg-red-500 text-white text-[11px] font-black px-1.5 py-0.5 rounded-full border-2 border-[#F9FAFB] animate-pulse">
                  {requestCount}
                </span>
              )}
            </button>

            <button onClick={() => setActiveTab('profile')} className={`hover:text-black transition pb-1 ${activeTab === 'profile' ? 'text-black border-b-2 border-[#A3E635]' : ''}`}>Профіль</button>
            <button onClick={() => setActiveTab('settings')} className={`hover:text-black transition pb-1 ${activeTab === 'settings' ? 'text-black border-b-2 border-[#A3E635]' : ''}`}>Налаштування</button>
          </div>
          
          <div className="flex items-center bg-gray-100 p-1.5 pl-6 rounded-full shadow-inner">
            <span className="font-bold text-gray-800 text-lg leading-none mr-4 relative top-[1px]">👋 Привіт, {userName}!</span>
            <button onClick={handleLogout} className="px-6 py-2.5 text-base font-bold text-red-500 hover:bg-red-500 hover:text-white rounded-full transition active:scale-95 leading-none">Вийти</button>
          </div>
        </div>
      </nav>

      <main className="flex-grow p-16 max-w-[1600px] w-full mx-auto">
        {activeTab === 'trips' && <TripsTab />}
        
        {activeTab === 'friends' && (
          <FriendsTab onRequestAccepted={fetchRequestCount} />
        )}

        {activeTab === 'profile' && (
          <ProfileTab 
            userName={userName} profileName={profileName} setProfileName={setProfileName}
            dob={dob} setDob={setDob} isEditingProfile={isEditingProfile}
            setIsEditingProfile={setIsEditingProfile} handleSaveProfile={handleSaveProfile}
            preferences={preferences} togglePreference={togglePreference} formatDate={formatDate}
          />
        )}
        {activeTab === 'settings' && (
          <SettingsTab 
            oldPassword={oldPassword} setOldPassword={setOldPassword}
            newPassword={newPassword} setNewPassword={setNewPassword}
            handleChangePassword={handleChangePassword} showDeleteConfirm={showDeleteConfirm}
            setShowDeleteConfirm={setShowDeleteConfirm} deletePassword={deletePassword}
            setDeletePassword={setDeletePassword} handleDeleteAccount={handleDeleteAccount}
          />
        )}
      </main>
    </div>
  );
};

export default Dashboard;