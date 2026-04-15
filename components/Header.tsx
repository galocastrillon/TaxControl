
import React, { useState, useEffect } from 'react';
import { Globe, Search, LogOut, User, Check } from 'lucide-react';
import { Link } from 'react-router-dom';
import { getCurrentUser } from '../constants';

const Header: React.FC = () => {
  const [lang, setLang] = useState<'es' | 'cn'>(() => {
    return (localStorage.getItem('app_lang') as 'es' | 'cn') || 'es';
  });
  const [user, setUser] = useState(getCurrentUser());
  const [showLangMenu, setShowLangMenu] = useState(false);

  useEffect(() => {
    const handleLangChange = () => {
      setLang((localStorage.getItem('app_lang') as 'es' | 'cn') || 'es');
    };
    
    const handleUserUpdate = () => {
      setUser(getCurrentUser());
    };

    window.addEventListener('languageChange', handleLangChange);
    window.addEventListener('userUpdate', handleUserUpdate);
    
    return () => {
      window.removeEventListener('languageChange', handleLangChange);
      window.removeEventListener('userUpdate', handleUserUpdate);
    };
  }, []);

  const toggleLanguage = (newLang: 'es' | 'cn') => {
    setLang(newLang);
    localStorage.setItem('app_lang', newLang);
    setShowLangMenu(false);
    window.dispatchEvent(new Event('languageChange'));
  };

  return (
    <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6 fixed top-0 right-0 left-64 z-40">
      <div className="flex items-center flex-1">
        <div className="relative w-96">
          <input 
            type="text"
            placeholder={lang === 'es' ? "Buscar..." : "搜索..."}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
          />
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
        </div>
      </div>

      <div className="flex items-center gap-6">
        <div className="relative">
          <button 
            onClick={() => setShowLangMenu(!showLangMenu)}
            className="flex items-center gap-2 text-gray-600 cursor-pointer hover:text-primary transition-colors bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-100"
          >
              <Globe className="w-5 h-5" />
              <span className="text-sm font-bold uppercase tracking-tighter">
                {lang === 'es' ? 'Español' : '简体中文'}
              </span>
          </button>

          {showLangMenu && (
            <div className="absolute right-0 mt-2 w-40 bg-white border border-gray-200 rounded-xl shadow-xl py-2 z-50 animate-in fade-in zoom-in-95 duration-100">
              <button 
                onClick={() => toggleLanguage('es')}
                className={`w-full text-left px-4 py-2 text-sm flex items-center justify-between hover:bg-gray-50 ${lang === 'es' ? 'text-primary font-bold' : 'text-gray-700'}`}
              >
                Español {lang === 'es' && <Check className="w-4 h-4" />}
              </button>
              <button 
                onClick={() => toggleLanguage('cn')}
                className={`w-full text-left px-4 py-2 text-sm flex items-center justify-between hover:bg-gray-50 ${lang === 'cn' ? 'text-primary font-bold' : 'text-gray-700'}`}
              >
                简体中文 {lang === 'cn' && <Check className="w-4 h-4" />}
              </button>
            </div>
          )}
        </div>

        <div className="flex items-center gap-3 pl-6 border-l border-gray-200">
            <div className="text-right hidden sm:block">
                <p className="text-sm font-semibold text-gray-900">{user.name}</p>
                <p className="text-xs text-gray-500 font-medium uppercase tracking-tighter">
                  {lang === 'es' ? user.role : (user.role === 'Admin' ? '管理员' : '操作员')}
                </p>
            </div>
            <div className="relative group">
                <img 
                    src={user.avatar} 
                    alt="Profile" 
                    className="w-10 h-10 rounded-full object-cover border-2 border-gray-100 cursor-pointer"
                />
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-xl py-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 transform origin-top-right border border-gray-100 z-50">
                    <Link to="/settings" className="px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-3 transition-colors">
                        <User className="w-4 h-4 text-gray-400" /> {lang === 'es' ? 'Perfil' : '个人资料'}
                    </Link>
                    <div className="h-px bg-gray-100 my-1 mx-2"></div>
                    <Link to="/login" className="px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-3 transition-colors">
                        <LogOut className="w-4 h-4" /> {lang === 'es' ? 'Cerrar Sesión' : '登出'}
                    </Link>
                </div>
            </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
