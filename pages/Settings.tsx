
import React, { useState, useEffect } from 'react';
import { CURRENT_USER } from '../constants';
import { User, Lock, Save, Camera } from 'lucide-react';

const Settings: React.FC = () => {
  const [lang, setLang] = useState<'es' | 'cn'>(() => (localStorage.getItem('app_lang') as 'es' | 'cn') || 'es');
  
  useEffect(() => {
    const handleLangChange = () => {
      setLang((localStorage.getItem('app_lang') as 'es' | 'cn') || 'es');
    };
    window.addEventListener('languageChange', handleLangChange);
    return () => window.removeEventListener('languageChange', handleLangChange);
  }, []);

  const t = {
    title: lang === 'es' ? 'Ajustes de Cuenta' : '帐户设置',
    subtitle: lang === 'es' ? 'Gestiona tu perfil y preferencias de seguridad.' : '管理您的个人资料和安全偏好。',
    personalInfo: lang === 'es' ? 'Información Personal' : '个人信息',
    changePhoto: lang === 'es' ? 'Cambiar Foto' : '更换照片',
    fullName: lang === 'es' ? 'Nombre Completo' : '姓名',
    email: lang === 'es' ? 'Correo Electrónico' : '电子邮件',
    emailNote: lang === 'es' ? 'El correo electrónico es gestionado por el administrador.' : '电子邮件由管理员管理。',
    security: lang === 'es' ? 'Seguridad' : '安全',
    currentPass: lang === 'es' ? 'Contraseña Actual' : '当前密码',
    newPass: lang === 'es' ? 'Nueva Contraseña' : '新密码',
    confirmPass: lang === 'es' ? 'Confirmar Nueva Contraseña' : '确认新密码',
    saveBtn: lang === 'es' ? 'Guardar Cambios' : '保存更改'
  };

  return (
    <div className="p-8 max-w-3xl mx-auto">
       <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">{t.title}</h1>
        <p className="text-gray-500">{t.subtitle}</p>
      </div>

      <div className="space-y-6">
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
            <div className="p-6 border-b border-gray-200 bg-gray-50">
                <h3 className="text-lg font-medium text-gray-900 flex items-center gap-2">
                    <User className="w-5 h-5 text-gray-500" />
                    {t.personalInfo}
                </h3>
            </div>
            <div className="p-6">
                <div className="flex items-center gap-6 mb-6">
                    <div className="relative">
                        <img src={CURRENT_USER.avatar} alt="Profile" className="w-20 h-20 rounded-full object-cover border-4 border-white shadow-sm" />
                        <button className="absolute bottom-0 right-0 p-1.5 bg-white border border-gray-200 rounded-full shadow-sm hover:bg-gray-50">
                            <Camera className="w-3 h-3 text-gray-600" />
                        </button>
                    </div>
                    <div>
                        <h4 className="text-lg font-bold text-gray-900">{CURRENT_USER.name}</h4>
                        <p className="text-sm text-gray-500">{CURRENT_USER.email}</p>
                        <span className="inline-block mt-1 px-2 py-0.5 bg-blue-100 text-blue-700 rounded text-xs font-medium">
                            {lang === 'es' ? CURRENT_USER.role : (CURRENT_USER.role === 'Admin' ? '管理员' : '操作员')}
                        </span>
                    </div>
                </div>
                <div className="grid grid-cols-1 gap-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">{t.fullName}</label>
                        <input type="text" defaultValue={CURRENT_USER.name} className="w-full rounded-lg border-gray-300 shadow-sm p-2.5 border text-sm focus:ring-primary focus:border-primary" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">{t.email}</label>
                        <input type="email" defaultValue={CURRENT_USER.email} readOnly className="w-full rounded-lg border-gray-300 bg-gray-50 shadow-sm p-2.5 border text-sm text-gray-500 cursor-not-allowed" />
                        <p className="text-xs text-gray-400 mt-1">{t.emailNote}</p>
                    </div>
                </div>
            </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
            <div className="p-6 border-b border-gray-200 bg-gray-50">
                <h3 className="text-lg font-medium text-gray-900 flex items-center gap-2">
                    <Lock className="w-5 h-5 text-gray-500" />
                    {t.security}
                </h3>
            </div>
            <div className="p-6 space-y-4">
                 <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">{t.currentPass}</label>
                    <input type="password" placeholder="••••••••" className="w-full rounded-lg border-gray-300 shadow-sm p-2.5 border text-sm focus:ring-primary focus:border-primary" />
                </div>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">{t.newPass}</label>
                        <input type="password" placeholder="••••••••" className="w-full rounded-lg border-gray-300 shadow-sm p-2.5 border text-sm focus:ring-primary focus:border-primary" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">{t.confirmPass}</label>
                        <input type="password" placeholder="••••••••" className="w-full rounded-lg border-gray-300 shadow-sm p-2.5 border text-sm focus:ring-primary focus:border-primary" />
                    </div>
                 </div>
            </div>
            <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex justify-end">
                 <button className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-blue-600 text-sm font-medium shadow-sm transition-all active:scale-95">
                    <Save className="w-4 h-4" />
                    {t.saveBtn}
                </button>
            </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
