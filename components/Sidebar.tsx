
import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Bell, FileText, UploadCloud, Settings, Shield } from 'lucide-react';

const Sidebar: React.FC = () => {
  const location = useLocation();
  const [lang, setLang] = useState<'es' | 'cn'>(() => (localStorage.getItem('app_lang') as 'es' | 'cn') || 'es');
  
  useEffect(() => {
    const handleLangChange = () => {
      setLang((localStorage.getItem('app_lang') as 'es' | 'cn') || 'es');
    };
    window.addEventListener('languageChange', handleLangChange);
    return () => window.removeEventListener('languageChange', handleLangChange);
  }, []);

  const isActive = (path: string) => location.pathname === path;

  const translations = {
    es: {
      dashboard: 'Dashboard',
      alerts: 'Alertas',
      documents: 'Documentos',
      upload: 'Subir Documento',
      admin: 'Administración',
      settings: 'Ajustes'
    },
    cn: {
      dashboard: '仪表板',
      alerts: '警报',
      documents: '文件管理',
      upload: '上传文件',
      admin: '系统管理',
      settings: '设置'
    }
  };

  const t = translations[lang];

  const renderNavItem = (path: string, Icon: React.ElementType, label: string) => (
    <Link
      key={path}
      to={path}
      className={`flex items-center px-4 py-3 text-sm font-medium transition-colors duration-200 ${
        isActive(path)
          ? 'bg-primary/10 text-primary border-r-4 border-primary'
          : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
      }`}
    >
      <Icon className={`w-5 h-5 mr-3 ${isActive(path) ? 'text-primary' : 'text-gray-400'}`} />
      {label}
    </Link>
  );

  return (
    <div className="w-64 h-screen bg-white border-r border-gray-200 flex flex-col fixed left-0 top-0 z-50">
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center gap-2 text-primary font-bold text-xl">
          <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M2 17L12 22L22 17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M2 12L12 17L22 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <span>Tax Control</span>
        </div>
        <p className="text-xs text-gray-500 mt-1 ml-10">ECSA</p>
      </div>

      <nav className="flex-1 pt-4 overflow-y-auto">
        {renderNavItem('/', LayoutDashboard, t.dashboard)}
        {renderNavItem('/alerts', Bell, t.alerts)}
        {renderNavItem('/documents', FileText, t.documents)}
        {renderNavItem('/upload', UploadCloud, t.upload)}
        
        <div className="mt-8 px-4 mb-2">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">{lang === 'es' ? 'Admin' : '系统管理'}</p>
        </div>
        
        {renderNavItem('/admin', Shield, t.admin)}
      </nav>

      <div className="p-4 border-t border-gray-200">
        <Link 
            to="/settings"
            className={`flex items-center gap-3 px-4 py-2 rounded-lg transition-colors ${isActive('/settings') ? 'bg-gray-100 text-gray-900' : 'bg-gray-50 text-gray-600 hover:bg-gray-100'}`}
        >
            <Settings className="w-5 h-5" />
            <span className="text-sm font-medium">{t.settings}</span>
        </Link>
      </div>
    </div>
  );
};

export default Sidebar;
