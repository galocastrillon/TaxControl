import React, { useState, useEffect } from 'react';
import { 
  Save, UserPlus, Edit2, Trash2, X,
  CheckCircle2, Loader2, Plus, Mail, Key, UserCheck, BellRing, Info
} from 'lucide-react';
import { UserRole, User } from '../types';
import { getCurrentUser } from '../constants';

const API_URL = import.meta.env.VITE_API_URL;

const Admin: React.FC = () => {
  const [lang, setLang] = useState<'es' | 'cn'>(() => (localStorage.getItem('app_lang') as 'es' | 'cn') || 'es');
  const currentUser = getCurrentUser();

  useEffect(() => {
    const handleLangChange = () => setLang((localStorage.getItem('app_lang') as 'es' | 'cn') || 'es');
    window.addEventListener('languageChange', handleLangChange);
    return () => window.removeEventListener('languageChange', handleLangChange);
  }, []);

  const [activeTab, setActiveTab] = useState<'smtp' | 'users'>('users');
  const [isSaving, setIsSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error', message: string } | null>(null);
  const [autoNotify, setAutoNotify] = useState(() => localStorage.getItem('tax_control_auto_notify') === 'true');
  const [users, setUsers] = useState<User[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(true);

  const token = localStorage.getItem('auth_token') || '';

  // Cargar usuarios desde el API
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const res = await fetch(`${API_URL}/api/users`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setUsers(data);
        }
      } catch (error) {
        console.error('Error cargando usuarios:', error);
      } finally {
        setLoadingUsers(false);
      }
    };
    fetchUsers();
  }, []);

  const [smtpConfig, setSmtpConfig] = useState({
    host: 'owa1.corriente.com.ec', port: '465', useSSL: true,
    user: 'ecsa\\monitoreo', password: '',
    fromEmail: 'monitoreo@corriente.com.ec',
    fromName: 'Tax Control ECSA',
    testEmail: 'galo.castrillon@corriente.com.ec'
  });

  useEffect(() => {
    const saved = localStorage.getItem('tax_control_smtp');
    if (saved) setSmtpConfig(JSON.parse(saved));
  }, []);

  const [showUserModal, setShowUserModal] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [newUser, setNewUser] = useState({ name: '', email: '', role: UserRole.OPERATOR, password: '' });

  const showFeedback = (type: 'success' | 'error', message: string) => {
    setFeedback({ type, message });
    setTimeout(() => setFeedback(null), 3000);
  };

  const handleSmtpChange = (field: string, value: any) => setSmtpConfig(prev => ({ ...prev, [field]: value }));

  const handleSaveSmtp = async () => {
    setIsSaving(true);
    await new Promise(resolve => setTimeout(resolve, 800));
    localStorage.setItem('tax_control_smtp', JSON.stringify(smtpConfig));
    localStorage.setItem('tax_control_auto_notify', autoNotify.toString());
    setIsSaving(false);
    showFeedback('success', lang === 'es' ? 'Configuración guardada correctamente.' : '设置已保存。');
  };

  const handleDeleteUser = async (e: React.MouseEvent, userToDelete: User) => {
    e.stopPropagation();
    if (userToDelete.id === currentUser.id) {
      alert(lang === 'es' ? 'No puedes eliminar tu propio usuario.' : '您不能删除自己的用户。');
      return;
    }
    if (!window.confirm(lang === 'es' ? `¿Eliminar a ${userToDelete.name}?` : `删除 ${userToDelete.name}?`)) return;
    try {
      const res = await fetch(`${API_URL}/api/users/${userToDelete.id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        setUsers(users.filter(u => u.id !== userToDelete.id));
        showFeedback('success', lang === 'es' ? 'Usuario eliminado.' : '用户已删除。');
      }
    } catch (error) {
      showFeedback('error', 'Error al eliminar usuario.');
    }
  };

  const openEditModal = (user: User) => {
    setModalMode('edit');
    setEditingUserId(user.id);
    setNewUser({ name: user.name, email: user.email, role: user.role, password: '' });
    setShowUserModal(true);
  };

  const handleUserSubmit = async () => {
    if (!newUser.name || !newUser.email) return;
    if (modalMode === 'create' && !newUser.password) {
      showFeedback('error', 'La contraseña es requerida para crear un usuario.');
      return;
    }
    try {
      if (modalMode === 'edit' && editingUserId) {
        const res = await fetch(`${API_URL}/api/users/${editingUserId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify(newUser)
        });
        if (res.ok) {
          setUsers(users.map(u => u.id === editingUserId ? { ...u, ...newUser } : u));
          if (editingUserId === currentUser.id) {
            localStorage.setItem('tax_control_user', JSON.stringify({ ...currentUser, ...newUser }));
            window.dispatchEvent(new Event('userUpdate'));
          }
        }
      } else {
        const res = await fetch(`${API_URL}/api/users`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify(newUser)
        });
        if (res.ok) {
          const created = await res.json();
          setUsers([...users, created]);
        } else {
          const err = await res.json();
          showFeedback('error', err.error || 'Error al crear usuario.');
          return;
        }
      }
      setShowUserModal(false);
      showFeedback('success', lang === 'es' ? 'Operación exitosa.' : '操作成功。');
    } catch (error) {
      showFeedback('error', 'Error de conexión.');
    }
  };

  const t = {
    title: lang === 'es' ? 'Administración' : '系统管理',
    subtitle: lang === 'es' ? 'Invita y gestiona los roles de los miembros de tu equipo y la configuración del sistema.' : '邀请并管理团队成员的角色y系统设置。',
    usersTab: lang === 'es' ? 'Gestión de Usuarios' : '用户管理',
    smtpTab: lang === 'es' ? 'Correo (SMTP)' : '邮件设置'
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{t.title}</h1>
          <p className="text-sm text-gray-500 mt-1">{t.subtitle}</p>
        </div>
        {feedback && (
          <div className={`flex items-center gap-3 px-4 py-2 rounded-lg border shadow-sm ${
            feedback.type === 'success' ? 'bg-green-50 border-green-200 text-green-700' : 'bg-red-50 border-red-200 text-red-700'
          }`}>
            <CheckCircle2 className="w-4 h-4" />
            <span className="text-sm font-medium">{feedback.message}</span>
          </div>
        )}
      </div>

      <div className="flex border-b border-gray-200">
        <button onClick={() => setActiveTab('users')} className={`px-6 py-3 text-sm font-bold border-b-2 transition-colors ${activeTab === 'users' ? 'border-primary text-primary' : 'border-transparent text-gray-500'}`}>
          {t.usersTab}
        </button>
        <button onClick={() => setActiveTab('smtp')} className={`px-6 py-3 text-sm font-bold border-b-2 transition-colors ${activeTab === 'smtp' ? 'border-primary text-primary' : 'border-transparent text-gray-500'}`}>
          {t.smtpTab}
        </button>
      </div>

      {activeTab === 'users' ? (
        <div className="space-y-6 animate-in fade-in duration-300">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold text-gray-900">{lang === 'es' ? 'Nombres' : '名称'}</h2>
            <div className="flex gap-3">
              <button onClick={() => { setModalMode('create'); setNewUser({ name:'', email:'', role: UserRole.OPERATOR, password:'' }); setShowUserModal(true); }}
                className="flex items-center gap-2 px-4 py-2 border border-gray-200 text-gray-700 text-sm font-bold rounded-lg hover:bg-gray-50 bg-white">
                <Plus className="w-4 h-4" /> {lang === 'es' ? 'Crear Usuario' : '创建用户'}
              </button>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            {loadingUsers ? (
              <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
            ) : (
              <table className="w-full text-left">
                <thead className="bg-gray-50/50 text-[11px] font-bold text-gray-400 uppercase tracking-widest border-b border-gray-100">
                  <tr>
                    <th className="px-8 py-4">{lang === 'es' ? 'NOMBRE' : '名称'}</th>
                    <th className="px-8 py-4">{lang === 'es' ? 'ROL' : '角色'}</th>
                    <th className="px-8 py-4 text-right">ACCIONES</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {users.map((u) => (
                    <tr key={u.id} onClick={() => openEditModal(u)} className="hover:bg-blue-50/30 transition-colors cursor-pointer group">
                      <td className="px-8 py-5">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center font-bold text-primary overflow-hidden">
                            {u.avatar ? <img src={u.avatar} className="w-full h-full object-cover" /> : u.name.charAt(0)}
                          </div>
                          <div className="flex flex-col">
                            <span className="text-sm font-bold text-gray-900">{u.name}</span>
                            <span className="text-xs text-gray-500">{u.email}</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-8 py-5">
                        <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase ${u.role === UserRole.ADMIN ? 'bg-primary text-white' : 'bg-gray-100 text-gray-600'}`}>
                          {u.role.toUpperCase()}
                        </span>
                      </td>
                      <td className="px-8 py-5 text-right">
                        <div className="flex justify-end gap-2">
                          <button onClick={(e) => { e.stopPropagation(); openEditModal(u); }} className="p-2 text-gray-400 hover:text-primary"><Edit2 className="w-4 h-4" /></button>
                          <button onClick={(e) => handleDeleteUser(e, u)} className={`p-2 ${u.id === currentUser.id ? 'text-gray-200 cursor-not-allowed' : 'text-gray-400 hover:text-red-600'}`}><Trash2 className="w-4 h-4" /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      ) : (
        <div className="space-y-8 animate-in fade-in duration-300">
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-8">
            <h2 className="text-lg font-bold text-gray-900 mb-1">Configuración SMTP</h2>
            <p className="text-sm text-gray-500 mb-8">Configure los ajustes del servidor SMTP para el envío de correos electrónicos</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[['Host SMTP *', 'host', 'text'], ['Puerto *', 'port', 'text'], ['Usuario SMTP *', 'user', 'text'], ['Email De (From) *', 'fromEmail', 'email'], ['Nombre De (From Name) *', 'fromName', 'text']].map(([label, field, type]) => (
                <div key={field} className="space-y-2">
                  <label className="text-xs font-bold text-gray-700 uppercase">{label}</label>
                  <input type={type} value={(smtpConfig as any)[field]} onChange={(e) => handleSmtpChange(field, e.target.value)}
                    className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary/20" />
                </div>
              ))}
              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-700 uppercase">Contraseña</label>
                <input type="password" value={smtpConfig.password} onChange={(e) => handleSmtpChange('password', e.target.value)}
                  placeholder="Dejar en blanco para mantener"
                  className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary/20" />
              </div>
              <div className="md:col-span-2 space-y-2">
                <label className="text-xs font-bold text-gray-700 uppercase">Email de Prueba</label>
                <input type="email" value={smtpConfig.testEmail} onChange={(e) => handleSmtpChange('testEmail', e.target.value)}
                  className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary/20" />
              </div>
              <div className="flex items-center gap-3 cursor-pointer" onClick={() => handleSmtpChange('useSSL', !smtpConfig.useSSL)}>
                <div className={`w-10 h-5 rounded-full transition-colors ${smtpConfig.useSSL ? 'bg-primary' : 'bg-gray-300'}`}>
                  <div className={`mt-1 ml-1 w-3 h-3 bg-white rounded-full transition-transform ${smtpConfig.useSSL ? 'translate-x-5' : ''}`}></div>
                </div>
                <span className="text-sm font-medium text-gray-600">Usar SSL/TLS</span>
              </div>
              <div className="flex items-center gap-3 cursor-pointer" onClick={() => setAutoNotify(!autoNotify)}>
                <div className={`w-10 h-5 rounded-full transition-colors ${autoNotify ? 'bg-primary' : 'bg-gray-300'}`}>
                  <div className={`mt-1 ml-1 w-3 h-3 bg-white rounded-full transition-transform ${autoNotify ? 'translate-x-5' : ''}`}></div>
                </div>
                <span className="text-sm font-bold text-[#204070]">Notificaciones Automáticas</span>
              </div>
            </div>
            <button onClick={handleSaveSmtp} disabled={isSaving}
              className="mt-8 bg-primary text-white px-6 py-2.5 rounded-lg font-bold hover:bg-blue-700 flex items-center gap-2">
              {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              Guardar Configuración
            </button>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-8">
            <h2 className="text-lg font-bold text-gray-900 mb-1">Pruebas de Email</h2>
            <p className="text-sm text-gray-500 mb-8">Prueba diferentes tipos de correos electrónicos</p>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {[
                { label: 'Prueba Básica SMTP', icon: Mail, color: 'text-indigo-500' },
                { label: 'Prueba Reset Password', icon: Key, color: 'text-amber-500' },
                { label: 'Prueba Invitación', icon: UserCheck, color: 'text-purple-500' },
                { label: 'Prueba Alerta', icon: BellRing, color: 'text-red-500' }
              ].map((test, idx) => (
                <button key={idx} className="bg-gray-50/50 hover:bg-gray-100 border border-gray-100 rounded-xl p-6 flex flex-col items-center gap-3 transition-all group active:scale-95">
                  <div className={`p-3 rounded-full bg-white shadow-sm group-hover:scale-110 transition-transform ${test.color}`}>
                    <test.icon className="w-5 h-5" />
                  </div>
                  <span className="text-[11px] font-bold text-gray-700 text-center">{test.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {showUserModal && (
        <div className="fixed inset-0 z-[100] bg-black/60 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-2xl">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
              <h3 className="font-bold text-lg">{modalMode === 'edit' ? 'Editar Usuario' : 'Nuevo Usuario'}</h3>
              <button onClick={() => setShowUserModal(false)}><X className="w-5 h-5 text-gray-400" /></button>
            </div>
            <div className="p-6 space-y-4">
              <input type="text" placeholder="Nombre" className="w-full p-3 border rounded-xl text-sm"
                value={newUser.name} onChange={e => setNewUser({ ...newUser, name: e.target.value })} />
              <input type="email" placeholder="Email" className="w-full p-3 border rounded-xl text-sm"
                value={newUser.email} onChange={e => setNewUser({ ...newUser, email: e.target.value })} />
              <input type="password" placeholder={modalMode === 'edit' ? 'Nueva contraseña (dejar vacío para no cambiar)' : 'Contraseña *'}
                className="w-full p-3 border rounded-xl text-sm"
                value={newUser.password} onChange={e => setNewUser({ ...newUser, password: e.target.value })} />
              <select className="w-full p-3 border rounded-xl text-sm bg-white"
                value={newUser.role} onChange={e => setNewUser({ ...newUser, role: e.target.value as UserRole })}>
                <option value={UserRole.ADMIN}>Administrador</option>
                <option value={UserRole.OPERATOR}>Operario</option>
              </select>
            </div>
            <div className="p-6 bg-gray-50 flex justify-end gap-3">
              <button onClick={() => setShowUserModal(false)} className="text-sm font-medium text-gray-500">Cancelar</button>
              <button onClick={handleUserSubmit} className="px-6 py-2 bg-primary text-white rounded-xl font-bold">Guardar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Admin;
