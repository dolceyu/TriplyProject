import React from 'react';

const SettingsTab = ({ 
  oldPassword, setOldPassword, newPassword, setNewPassword, 
  handleChangePassword, showDeleteConfirm, setShowDeleteConfirm, 
  deletePassword, setDeletePassword, handleDeleteAccount 
}) => {
  return (
    <div className="max-w-5xl mx-auto">
      <h1 className="text-4xl font-black mb-12">Налаштування</h1>

      <div className="flex flex-col gap-10">
        <div className="bg-white rounded-[40px] p-12 shadow-sm flex flex-col gap-8">
          <div className="flex flex-col gap-2">
            <h2 className="text-3xl font-bold text-black">Безпека та вхід</h2>
            <p className="text-gray-500 text-xl">Оновіть свій пароль, якщо це потрібно для збереження безпеки акаунта.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="flex flex-col gap-3">
              <label className="font-bold text-gray-700 text-base ml-2">Поточний пароль</label>
              <input 
                type="password" 
                value={oldPassword}
                onChange={(e) => setOldPassword(e.target.value)}
                placeholder="Введіть старий пароль"
                className="w-full px-5 py-4 rounded-3xl bg-[#F4F4F4] border-2 border-transparent focus:bg-white focus:border-[#A3E635] outline-none transition text-lg shadow-sm"
              />
            </div>
            <div className="flex flex-col gap-3">
              <label className="font-bold text-gray-700 text-base ml-2">Новий пароль</label>
              <input 
                type="password" 
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Створіть новий пароль"
                className="w-full px-5 py-4 rounded-3xl bg-[#F4F4F4] border-2 border-transparent focus:bg-white focus:border-[#A3E635] outline-none transition text-lg shadow-sm"
              />
            </div>
          </div>

          <div className="flex justify-end mt-4">
            <button 
              onClick={handleChangePassword}
              className="px-10 py-4 bg-black text-white rounded-2xl font-bold text-lg hover:bg-gray-800 transition shadow-sm active:scale-95"
            >
              Зберегти зміни
            </button>
          </div>
        </div>

        <div className="bg-white rounded-[40px] p-12 shadow-sm border-2 border-red-50 flex flex-col gap-8">
          <div className="flex flex-col gap-2">
            <h2 className="text-3xl font-bold text-red-600">Небезпечна зона</h2>
            <p className="text-gray-500 text-xl">Видалення акаунта призведе до незворотної втрати даних у Triply.</p>
          </div>

          {!showDeleteConfirm ? (
            <div className="flex justify-start mt-2">
              <button 
                onClick={() => setShowDeleteConfirm(true)}
                className="px-10 py-4 bg-red-50 text-red-600 rounded-2xl font-bold text-lg hover:bg-red-100 transition border border-red-100 active:scale-95"
              >
                Видалити мій акаунт
              </button>
            </div>
          ) : (
            <div className="bg-red-50 p-10 rounded-[30px] border-2 border-red-200 flex flex-col gap-6 mt-2">
              <label className="text-xl font-bold text-red-700 mb-2">Підтвердіть дію своїм паролем:</label>
              <input 
                type="password" 
                value={deletePassword}
                onChange={(e) => setDeletePassword(e.target.value)}
                placeholder="Ваш поточний пароль"
                className="w-full px-6 py-4 rounded-3xl bg-white border-2 border-red-200 focus:border-red-500 outline-none text-xl transition shadow-sm"
                autoFocus
              />
              <div className="flex gap-4 mt-4">
                <button onClick={handleDeleteAccount} className="px-10 py-4 bg-red-600 text-white rounded-2xl font-bold text-lg hover:bg-red-700 transition shadow-sm active:scale-95">Так, видалити назавжди</button>
                <button onClick={() => { setShowDeleteConfirm(false); setDeletePassword(''); }} className="px-10 py-4 bg-gray-200 text-gray-800 rounded-2xl font-bold text-lg hover:bg-gray-300 transition active:scale-95">Скасувати</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SettingsTab;