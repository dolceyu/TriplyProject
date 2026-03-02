import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import logoImg from '../assets/logo-mini.png';

// Імпортуємо компоненти
import TripsTab from '../components/Dashboard/TripsTab';
import FriendsTab from '../components/Dashboard/FriendsTab';
import ProfileTab from '../components/Dashboard/ProfileTab';
import SettingsTab from '../components/Dashboard/SettingsTab';

const Dashboard = () => {
  const navigate = useNavigate();
  const [userName, setUserName] = useState('');
  const [activeTab, setActiveTab] = useState('trips'); 

  // Стейт для налаштувань
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deletePassword, setDeletePassword] = useState('');
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');

  // Стейт для профілю
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [profileName, setProfileName] = useState('');
  const [dob, setDob] = useState(''); 
  const [preferences, setPreferences] = useState({
    mountains: false, sea: false, museums: false, active: true, coffee: true,
  });

  useEffect(() => {
    const savedName = localStorage.getItem('userName');
    if (!savedName) {
      navigate('/login');
    } else {
      setUserName(savedName);
      setProfileName(savedName);
    }
  }, [navigate]);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setShowDeleteConfirm(false); 
    setDeletePassword('');
  }, [activeTab]);

  const handleLogout = () => {
    localStorage.removeItem('userName');
    toast.success("Ви вийшли з акаунта");
    navigate('/');
  };

  const handleSaveProfile = () => {
    localStorage.setItem('userName', profileName);
    setUserName(profileName);
    setIsEditingProfile(false);
    toast.success("Профіль успішно оновлено!");
  };

  const handleChangePassword = () => {
    if (!oldPassword || !newPassword) {
      toast.error("Заповніть обидва поля пароля");
      return;
    }
    toast.success("Пароль змінено (візуально)");
    setOldPassword('');
    setNewPassword('');
  };

  const handleDeleteAccount = () => {
    if (!deletePassword) {
      toast.error("Введіть пароль");
      return;
    }
    localStorage.removeItem('userName');
    toast.success("Акаунт видалено");
    navigate('/');
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
            <button onClick={() => setActiveTab('friends')} className={`hover:text-black transition pb-1 ${activeTab === 'friends' ? 'text-black border-b-2 border-[#A3E635]' : ''}`}>Друзі</button>
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
        
        {activeTab === 'friends' && <FriendsTab />}
        
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