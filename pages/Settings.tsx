
import React, { useState, useEffect } from 'react';
import { getCurrentUser } from '../constants';
import { User, Lock, Save, Camera, CheckCircle2, Loader2, AlertCircle } from 'lucide-react';

const Settings: React.FC = () => {
  const [lang, setLang] = useState<'es' | 'cn'>(() => (localStorage.getItem('app_lang') as 'es' | 'cn') || 'es');
  const [user, setUser] = useState(getCurrentUser());
  const [name, setName] = useState(user.name);
  const [isSaving, setIsSaving] = useState(false);
  const [showToast, setShowToast] = useState(false);

  useEffect(() => {
    const handleLangChange = () => {
      setLang((localStorage.getItem('app_lang') as 'es' | 'cn') || 'es');
    };
    window.addEventListener('languageChange', handleLangChange);
    return () => window.removeEventListener('languageChange', handleLangChange);
  }, []);

  const handleSave = async () => {
    setIsSaving(true);
    
    // Simulamos latencia de red para una experiencia fluida
    await new Promise(resolve => setTimeout(resolve, 1200));
    
    const updatedUser = { ...user, name };
    localStorage.setItem('tax_control_user', JSON.stringify(updatedUser));
    setUser(updatedUser);
    
    // Notificamos a otros componentes que el usuario cambió
    window.dispatchEvent(new Event('userUpdate'));
    
    setIsSaving(false);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 4000);
  };

  const t = {
    title: lang === 'es' ? 'Configuración de Perfil' : '配置文件设置',
    personalInfo: lang === 'es' ? 'Información Personal' : '个人信息',
    changePhoto: lang === 'es' ? 'Cambiar Foto' : '更换照片',
    fullName: lang === 'es' ? 'Nombre Completo' : '姓名',
    email: lang === 'es' ? 'Correo Electrónico' : '电子邮件',
    emailNote: lang === 'es' ? 'El correo electrónico es gestionado por el administrador.' : '电子邮件由管理员管理。',
    security: lang === 'es' ? 'Seguridad' : '安全',
    currentPass: lang === 'es' ? 'Contraseña Actual' : '当前密码',
    newPass: lang === 'es' ? 'Nueva Contraseña' : '新密码',
    confirmPass: lang === 'es' ? 'Confirmar Nueva Contraseña' : '确认新密码',
    saveBtn: lang === 'es' ? 'Guardar Cambios' : '保存更改',
    saving: lang === 'es' ? 'Guardando...' : '保存中...',
    success: lang === 'es' ? '¡Perfil actualizado con éxito!' : '个人资料更新成功！'
  };

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-8 relative">
      {/* Success Toast */}
      {showToast && (
        <div className="fixed top-20 right-8 z-[100] animate-in slide-in-from-right-8 fade-in duration-500">
          <div className="bg-white border-l-4 border-secondary shadow-2xl rounded-xl p-5 flex items-center gap-4 min-w-[320px]">
            <div className="bg-secondary/10 p-2 rounded-full">
              <CheckCircle2 className="w-6 h-6 text-secondary" />
            </div>
            <div>
              <p className="text-sm font-bold text-gray-900">{t.success}</p>
              <p className="text-[10px] text-gray-400 uppercase font-black tracking-widest">{lang === 'es' ? 'Cambios aplicados' : '变更已生效'}</p>
            </div>
          </div>
        </div>
      )}

      {/* Sección Información Personal */}
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
        <div className="p-5 border-b border-gray-100 flex items-center gap-3 bg-gray-50/30">
          <User className="w-5 h-5 text-gray-400" />
          <h3 className="text-base font-bold text-gray-900 tracking-tight">{t.personalInfo}</h3>
        </div>
        
        <div className="p-8">
          <div className="flex items-center gap-8 mb-8">
            <div className="relative group">
              <img 
                src={user.avatar} 
                alt="Profile" 
                className="w-24 h-24 rounded-full object-cover border-4 border-white shadow-md ring-1 ring-gray-100 group-hover:brightness-90 transition-all" 
              />
              <button className="absolute bottom-0 right-0 p-2 bg-white border border-gray-200 rounded-full shadow-lg hover:bg-gray-50 transition-all text-gray-500 hover:text-primary active:scale-90">
                <Camera className="w-4 h-4" />
              </button>
            </div>
            <div className="space-y-1">
              <h4 className="text-xl font-bold text-gray-900">{user.name}</h4>
              <p className="text-sm text-gray-500 font-medium">{user.email}</p>
              <div className="inline-flex mt-2 px-3 py-1 bg-blue-50 text-primary rounded-lg text-[10px] font-black uppercase tracking-widest border border-blue-100">
                {lang === 'es' ? user.role : (user.role === 'Admin' ? '管理员' : '操作员')}
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div>
              <label className="block text-xs font-bold text-gray-600 mb-2 uppercase tracking-wider">{t.fullName}</label>
              <input 
                type="text" 
                value={name} 
                onChange={(e) => setName(e.target.value)}
                className="w-full rounded-lg border-gray-200 shadow-sm px-4 py-3 border text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all font-medium text-gray-700" 
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-600 mb-2 uppercase tracking-wider">{t.email}</label>
              <div className="relative">
                <input 
                  type="email" 
                  defaultValue={user.email} 
                  readOnly 
                  className="w-full rounded-lg border-gray-200 bg-gray-50 px-4 py-3 border text-sm text-gray-500 cursor-not-allowed outline-none font-medium" 
                />
              </div>
              <p className="text-[11px] text-gray-400 mt-2 font-medium">{t.emailNote}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Sección Seguridad */}
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
        <div className="p-5 border-b border-gray-100 flex items-center gap-3 bg-gray-50/30">
          <Lock className="w-5 h-5 text-gray-400" />
          <h3 className="text-base font-bold text-gray-900 tracking-tight">{t.security}</h3>
        </div>
        
        <div className="p-8 space-y-6">
          <div>
            <label className="block text-xs font-bold text-gray-600 mb-2 uppercase tracking-wider">{t.currentPass}</label>
            <input 
              type="password" 
              placeholder="••••••••" 
              className="w-full rounded-lg border-gray-200 shadow-sm px-4 py-3 border text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all" 
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-bold text-gray-600 mb-2 uppercase tracking-wider">{t.newPass}</label>
              <input 
                type="password" 
                placeholder="••••••••" 
                className="w-full rounded-lg border-gray-200 shadow-sm px-4 py-3 border text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all" 
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-600 mb-2 uppercase tracking-wider">{t.confirmPass}</label>
              <input 
                type="password" 
                placeholder="••••••••" 
                className="w-full rounded-lg border-gray-200 shadow-sm px-4 py-3 border text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all" 
              />
            </div>
          </div>
        </div>

        <div className="px-8 py-5 bg-gray-50/50 border-t border-gray-100 flex justify-end">
          <button 
            onClick={handleSave}
            disabled={isSaving}
            className="flex items-center gap-3 px-6 py-2.5 bg-primary text-white rounded-xl hover:bg-blue-600 text-sm font-bold shadow-lg shadow-blue-100 transition-all active:scale-95 group disabled:bg-gray-400 disabled:shadow-none"
          >
            {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4 group-hover:scale-110 transition-transform" />}
            {isSaving ? t.saving : t.saveBtn}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Settings;
