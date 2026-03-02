import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast'; 
import logoMiniImg from '../assets/logo-mini.png';
import triplyTitleImg from '../assets/main-triply.png';
import peopleGroupImg from '../assets/people-group.png';

const LoginPage = () => {
  const [formData, setFormData] = useState({ email: '', password: '' });
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!formData.email || !formData.password) {
      toast.error("Введіть електронну пошту та пароль", {
        style: {
          borderRadius: '15px',
          background: '#333',
          color: '#fff',
        },
      });
      return; 
    }

    try {
      const response = await fetch('http://127.0.0.1:8000/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok) {
        localStorage.setItem('userName', data.user);
        
        toast.success(`Вітаємо, ${data.user}! Вхід успішний.`, {
          duration: 3000,
          style: {
            borderRadius: '15px',
            background: '#333',
            color: '#fff',
          },
        });
        setTimeout(() => navigate('/dashboard'), 1500); 
      } else {
        toast.error("Помилка: " + (data.detail || "Невірні дані"));
      }
    } catch (error) {
      toast.error("Сервер не відповідає! Перевірте бекенд.");
    }
  };

  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-8 relative overflow-hidden" style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "Segoe UI", Roboto, sans-serif' }}>
      
      <Link to="/" className="absolute top-10 left-16 z-50 hover:opacity-80 transition flex items-center gap-4">
        <img src={logoMiniImg} alt="Triply Logo" className="w-14 h-14 object-contain" />
        <span className="text-3xl font-bold tracking-tighter text-black">Triply</span>
      </Link>

      <div className="max-w-[1500px] w-full grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
        
        <div className="flex flex-col items-center justify-end w-full lg:order-1 order-2">
          <div className="w-full max-w-[560px] flex flex-col items-center">
            
            <img src={triplyTitleImg} alt="Triply" className="h-28 object-contain mb-2" />
            <p className="text-gray-800 font-bold text-xl mb-8">З поверненням до пригод!</p>
            
            <div className="bg-[#F4F4F4] rounded-[40px] p-10 w-full shadow-sm">
              <form className="flex flex-col gap-5" onSubmit={handleLogin} noValidate>
                <input 
                  type="email" 
                  name="email"
                  placeholder="Електронна пошта" 
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full px-6 py-4 rounded-2xl bg-white border-2 border-transparent focus:outline-none focus:border-[#A3E635] text-gray-700 font-medium transition text-lg" 
                />
                <input 
                  type="password" 
                  name="password" 
                  placeholder="Пароль" 
                  value={formData.password}
                  onChange={handleChange}
                  className="w-full px-6 py-4 rounded-2xl bg-white border-2 border-transparent focus:outline-none focus:border-[#A3E635] text-gray-700 font-medium transition text-lg" 
                />
                
                <button 
                  type="submit" 
                  className="mt-4 px-10 py-5 bg-[#A3E635] rounded-2xl font-bold text-black text-xl hover:bg-[#92d624] transition-all shadow-sm active:scale-95 w-full"
                >
                  Увійти
                </button>
              </form>
            </div>
            
            <p className="mt-8 text-gray-600 text-lg">
              Ще немає акаунта?{' '}
              <Link to="/register" className="text-[#A3E635] font-bold hover:underline">
                Зареєструватися!
              </Link>
            </p>
          </div>
        </div>

        <div className="flex justify-center items-center w-full lg:order-2 order-1">
          <img src={peopleGroupImg} alt="Triply Friends" className="w-full max-w-[700px] object-contain" />
        </div>

      </div>
    </div>
  );
};

export default LoginPage;