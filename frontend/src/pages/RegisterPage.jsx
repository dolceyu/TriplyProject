import React, { useState } from 'react'; 
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import logoImg from '../assets/logo-mini.png';
import triplyTitleImg from '../assets/main-triply.png';
import trioImg from '../assets/register-trio.png';
import luggageImg from '../assets/travel-luggage.png';
import ticketImg from '../assets/plane-ticket.png';

const RegisterPage = () => {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    password: ''
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    if (!formData.first_name || !formData.last_name || !formData.email || !formData.password) {
      toast.error("Будь ласка, заповніть усі поля", {
        style: {
          borderRadius: '15px',
          background: '#333',
          color: '#fff',
        },
      });
      return; 
    }

    try {
      const response = await fetch('http://127.0.0.1:8000/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success(`Вітаємо, ${formData.first_name}! Акаунт створено успішно.`, {
          duration: 3000,
          style: {
            borderRadius: '15px',
            background: '#333',
            color: '#fff',
          },
        });
        
        setTimeout(() => navigate('/login'), 1500);
      } else {
        toast.error("Помилка: " + (data.detail || "Щось пішло не так"));
      }
    } catch (error) {
      console.error("Помилка зв'язку з сервером:", error);
      toast.error("Сервер не відповідає! Перевірте підключення.");
    }
  };

  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-8 relative overflow-hidden" style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "Segoe UI", Roboto, sans-serif' }}>
      
      <Link to="/" className="absolute top-10 left-16 z-50 hover:opacity-80 transition flex items-center gap-4">
        <img src={logoImg} alt="Triply Logo" className="w-14 h-14 object-contain" />
        <span className="text-3xl font-bold tracking-tighter text-black">Triply</span>
      </Link>

      <div className="max-w-[1500px] w-full grid grid-cols-1 lg:grid-cols-2 gap-20 items-end">
        
        <div className="flex justify-center items-end w-full">
          <div className="relative w-full max-w-[600px]"> 
            <img src={trioImg} alt="Triply Steps" className="w-full object-contain z-10 mix-blend-multiply" />
            <img src={luggageImg} alt="Luggage" className="absolute top-[12%] -left-8 w-28 md:w-36 -rotate-12 z-20 drop-shadow-xl" />
            <img src={ticketImg} alt="Ticket" className="absolute -top-4 -right-2 w-24 md:w-32 rotate-[35deg] z-20 drop-shadow-xl" />
          </div>
        </div>

        <div className="flex flex-col items-center justify-end w-full">
          <div className="w-full max-w-[650px] flex flex-col items-center">
            
            <img src={triplyTitleImg} alt="Triply" className="h-28 object-contain mb-2" />
            <p className="text-gray-800 font-bold text-xl mb-8 text-center">Приєднуйтесь до Triply вже зараз!</p>
            
            <div className="bg-[#F4F4F4] rounded-[40px] p-10 w-full shadow-sm">
              <form className="flex flex-col gap-5" onSubmit={handleRegister} noValidate>
                <input 
                  type="text" 
                  name="first_name"
                  placeholder="Ім'я" 
                  value={formData.first_name}
                  onChange={handleChange}
                  className="w-full px-6 py-4 rounded-2xl bg-white border-2 border-transparent focus:outline-none focus:border-[#A3E635] text-gray-700 font-medium transition text-lg" 
                />
                <input 
                  type="text" 
                  name="last_name"
                  placeholder="Прізвище" 
                  value={formData.last_name}
                  onChange={handleChange}
                  className="w-full px-6 py-4 rounded-2xl bg-white border-2 border-transparent focus:outline-none focus:border-[#A3E635] text-gray-700 font-medium transition text-lg" 
                />
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
                  Зареєструватися!
                </button>
              </form>
            </div>

            <p className="mt-6 text-gray-600 font-medium">
              Вже маєте акаунт? <Link to="/login" className="text-[#A3E635] font-bold hover:underline">Увійти</Link>
            </p>
          </div>
        </div>

      </div>
    </div>
  );
};

export default RegisterPage;