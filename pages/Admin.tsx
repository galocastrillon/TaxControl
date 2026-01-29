
import React, { useState, useEffect } from 'react';
import { Save, UserPlus, Edit2, Trash2, RefreshCw, Mail, Info, Key, UserCheck, AlertCircle, Loader2, CheckCircle2, ShieldCheck } from 'lucide-react';
import { UserRole } from '../types';

const Admin: React.FC = () => {
  const [lang, setLang] = useState<'es' | 'cn'>(() => (localStorage.getItem('app_lang') as 'es' | 'cn') || 'es');
  
  useEffect(() => {
    const handleLangChange = () => {
      setLang((localStorage.getItem('app_lang') as 'es' | 'cn') || 'es');
    };
    window.addEventListener('languageChange', handleLangChange);
    return () => window.removeEventListener('languageChange', handleLangChange);
  }, []);

  const [activeTab, setActiveTab] = useState<'smtp' | 'users'>('smtp');
  const [isSaving, setIsSaving] = useState(false);
  const [testingId, setTestingId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error', message: string } | null>(null);

  const [smtpConfig, setSmtpConfig] = useState({
    host: 'owa1.corriente.com.ec',
    port: '465',
    useSSL: true,
    user: 'ecsa\\monitoreo',
    password: '',
    fromEmail: 'monitoreo@corriente.com.ec',
    fromName: 'Tax Control ECSA',
    testEmail: 'galo.castrillon@corriente.com.ec'
  });

  useEffect(() => {
    const savedConfig = localStorage.getItem('tax_control_smtp');
    if (savedConfig) {
      setSmtpConfig(JSON.parse(savedConfig));
    }
  }, []);

  const [users] = useState([
    { id: 1, name: 'Administrador ECSA', email: 'Impuestos@corriente.com.ec', role: UserRole.ADMIN, avatar: 'https://picsum.photos/id/1005/50/50' },
    { id: 2, name: 'Maria Lopez', email: 'maria.lopez@ecsa.com.ec', role: UserRole.OPERATOR, avatar: 'https://picsum.photos/id/1011/50/50' },
    { id: 3, name: 'Juan Perez', email: 'juan.perez@ecsa.com.ec', role: UserRole.READER, avatar: 'https://picsum.photos/id/1012/50/50' },
  ]);

  const handleInputChange = (field: string, value: any) => {
    setSmtpConfig(prev => {
        const newConfig = { ...prev, [field]: value };
        if (field === 'useSSL') {
            if (value && prev.port === '587') newConfig.port = '465';
            if (!value && prev.port === '465') newConfig.port = '587';
        }
        return newConfig;
    });
  };

  const handleSave = async () => {
    setIsSaving(true);
    setFeedback(null);
    await new Promise(resolve => setTimeout(resolve, 1000));
    localStorage.setItem('tax_control_smtp', JSON.stringify(smtpConfig));
    setIsSaving(false);
    showFeedback('success', lang === 'es' ? 'Configuración SMTP guardada correctamente.' : 'SMTP 设置已成功保存。');
  };

  const handleTestEmail = async (testId: string) => {
    if (!smtpConfig.testEmail) {
        showFeedback('error', lang === 'es' ? 'Debe configurar un email de prueba.' : '您必须配置测试电子邮件。');
        return;
    }
    setTestingId(testId);
    setFeedback(null);
    await new Promise(resolve => setTimeout(resolve, 2000));
    setTestingId(null);
    showFeedback('success', lang === 'es' ? `Prueba de "${testId}" enviada exitosamente.` : `"${testId}" 测试发送成功。`);
  };

  const showFeedback = (type: 'success' | 'error', message: string) => {
    setFeedback({ type, message });
    setTimeout(() => setFeedback(null), 5000);
  };

  const t = {
    title: lang === 'es' ? 'Administración' : '系统管理',
    subtitle: lang === 'es' ? 'Gestiona la configuración del sistema y los usuarios.' : '管理系统设置和用户。',
    smtpTab: lang === 'es' ? 'Configuración de Correo (SMTP)' : '邮件设置 (SMTP)',
    usersTab: lang === 'es' ? 'Gestión de Usuarios' : '用户管理',
    smtpTitle: lang === 'es' ? 'Configuración SMTP' : 'SMTP 设置',
    smtpDesc: lang === 'es' ? 'Configure los ajustes del servidor SMTP para el envío de correos electrónicos' : '配置 SMTP 服务器设置以发送电子邮件',
    host: lang === 'es' ? 'Host SMTP *' : 'SMTP 主机 *',
    port: lang === 'es' ? 'Puerto *' : '端口 *',
    useSSL: lang === 'es' ? 'Usar SSL/TLS (puerto 465 sugerido)' : '使用 SSL/TLS (建议端口 465)',
    user: lang === 'es' ? 'Usuario SMTP *' : 'SMTP 用户 *',
    password: lang === 'es' ? 'Contraseña' : '密码',
    passwordPlaceholder: lang === 'es' ? 'Dejar en blanco para mantener actual' : '留空以保持当前密码',
    fromEmail: lang === 'es' ? 'Email De (From) *' : '发件人邮箱 *',
    fromName: lang === 'es' ? 'Nombre De (From Name) *' : '发件人名称 *',
    testEmail: lang === 'es' ? 'Email de Prueba (Para testing)' : '测试邮箱 (用于测试)',
    testEmailNote: lang === 'es' ? 'Este email se usará para las pruebas de envío de correo' : '此电子邮件将用于邮件发送测试',
    saveBtn: lang === 'es' ? 'Guardar Configuración' : '保存设置',
    savingBtn: lang === 'es' ? 'Guardando...' : '保存中...',
    summaryTitle: lang === 'es' ? 'Resumen de Configuración Guardada' : '已保存设置摘要',
    portGuide: lang === 'es' ? 'Guía de Puertos Estándar' : '标准端口指南',
    testsTitle: lang === 'es' ? 'Pruebas de Email' : '电子邮件测试',
    testsDesc: lang === 'es' ? 'Pruebe la capacidad de envío del sistema ejecutando los siguientes tests manuales.' : '通过执行以下手动测试来测试系统的发送能力。',
    testBasic: lang === 'es' ? 'Prueba Básica SMTP' : '基本 SMTP 测试',
    testReset: lang === 'es' ? 'Prueba Reset Password' : '重置密码测试',
    testInvite: lang === 'es' ? 'Prueba Invitación' : '邀请测试',
    testAlert: lang === 'es' ? 'Prueba Alerta' : '警报测试',
    executeTest: lang === 'es' ? 'EJECUTAR TEST →' : '执行测试 →',
    noteTitle: lang === 'es' ? 'Nota sobre las pruebas de correo' : '关于邮件测试的说明',
    noteText: lang === 'es' ? 'Los correos se envían en tiempo real utilizando las credenciales guardadas.' : '使用保存的凭据实时发送电子邮件。',
    usersTitle: lang === 'es' ? 'Usuarios Registrados' : '已注册用户',
    inviteBtn: lang === 'es' ? 'Invitar Usuario' : '邀请用户',
    colName: lang === 'es' ? 'Nombre' : '姓名',
    colRole: lang === 'es' ? 'Rol' : '角色',
    colActions: lang === 'es' ? 'Acciones' : '操作'
  };

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="mb-8 flex justify-between items-start">
        <div>
            <h1 className="text-2xl font-bold text-gray-900">{t.title}</h1>
            <p className="text-gray-500">{t.subtitle}</p>
        </div>
        {feedback && (
            <div className={`flex items-center gap-3 px-4 py-3 rounded-lg border shadow-sm animate-in fade-in slide-in-from-top-4 duration-300 ${
                feedback.type === 'success' ? 'bg-green-50 border-green-200 text-green-800' : 'bg-red-50 border-red-200 text-red-800'
            }`}>
                {feedback.type === 'success' ? <CheckCircle2 className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
                <span className="text-sm font-medium">{feedback.message}</span>
            </div>
        )}
      </div>

      <div className="flex border-b border-gray-200 mb-8">
        <button
          className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'smtp' ? 'border-primary text-primary' : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
          onClick={() => setActiveTab('smtp')}
        >
          {t.smtpTab}
        </button>
        <button
          className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'users' ? 'border-primary text-primary' : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
          onClick={() => setActiveTab('users')}
        >
          {t.usersTab}
        </button>
      </div>

      {activeTab === 'smtp' ? (
        <div className="space-y-8 pb-12">
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-8">
            <h2 className="text-lg font-bold text-gray-900 mb-1">{t.smtpTitle}</h2>
            <p className="text-xs text-gray-500 mb-6">{t.smtpDesc}</p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1 uppercase tracking-wider">{t.host}</label>
                <input type="text" value={smtpConfig.host} onChange={(e) => handleInputChange('host', e.target.value)} className="w-full rounded-lg border-gray-200 shadow-sm p-3 border text-sm bg-[#F9FAFB] outline-none" />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1 uppercase tracking-wider">{t.port}</label>
                <input type="text" value={smtpConfig.port} onChange={(e) => handleInputChange('port', e.target.value)} className="w-full rounded-lg border-gray-200 shadow-sm p-3 border text-sm bg-[#F9FAFB] outline-none" />
              </div>
              <div className="md:col-span-2">
                <label className="flex items-center gap-3 cursor-pointer group">
                  <div className="relative inline-flex items-center">
                    <input type="checkbox" className="sr-only peer" checked={smtpConfig.useSSL} onChange={(e) => handleInputChange('useSSL', e.target.checked)} />
                    <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-checked:bg-primary after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-full"></div>
                  </div>
                  <span className="text-sm font-medium text-gray-700 group-hover:text-gray-900">{t.useSSL}</span>
                </label>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1 uppercase tracking-wider">{t.user}</label>
                <input type="text" value={smtpConfig.user} onChange={(e) => handleInputChange('user', e.target.value)} className="w-full rounded-lg border-gray-200 shadow-sm p-3 border text-sm bg-[#F9FAFB] outline-none" />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1 uppercase tracking-wider">{t.password}</label>
                <input type="password" value={smtpConfig.password} placeholder={t.passwordPlaceholder} onChange={(e) => handleInputChange('password', e.target.value)} className="w-full rounded-lg border-gray-200 shadow-sm p-3 border text-sm bg-[#F9FAFB] outline-none" />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1 uppercase tracking-wider">{t.fromEmail}</label>
                <input type="email" value={smtpConfig.fromEmail} onChange={(e) => handleInputChange('fromEmail', e.target.value)} className="w-full rounded-lg border-gray-200 shadow-sm p-3 border text-sm bg-[#F9FAFB] outline-none" />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1 uppercase tracking-wider">{t.fromName}</label>
                <input type="text" value={smtpConfig.fromName} onChange={(e) => handleInputChange('fromName', e.target.value)} className="w-full rounded-lg border-gray-200 shadow-sm p-3 border text-sm bg-[#F9FAFB] outline-none" />
              </div>
              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-gray-700 mb-1 uppercase tracking-wider">{t.testEmail}</label>
                <input type="email" value={smtpConfig.testEmail} onChange={(e) => handleInputChange('testEmail', e.target.value)} className="w-full rounded-lg border-gray-200 shadow-sm p-3 border text-sm bg-[#F9FAFB] outline-none" />
                <p className="text-[10px] text-gray-400 mt-1.5 font-medium italic">{t.testEmailNote}</p>
              </div>
            </div>

            <button onClick={handleSave} disabled={isSaving} className="bg-primary text-white px-8 py-3 rounded-lg text-sm font-bold shadow-md hover:bg-blue-700 flex items-center gap-2">
              {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              {isSaving ? t.savingBtn : t.saveBtn}
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="bg-[#F8FAFC] border border-gray-200 rounded-lg p-5 flex items-start gap-4">
              <div className="p-2 bg-white rounded-lg shadow-sm"><ShieldCheck className="w-5 h-5 text-primary" /></div>
              <div className="space-y-1">
                <p className="text-sm font-bold text-gray-700">{t.summaryTitle}</p>
                <div className="text-xs text-gray-600 space-y-1 font-medium mt-2">
                  <p className="flex justify-between w-64 border-b border-gray-100 pb-1">Host: <span className="text-gray-900">{smtpConfig.host}:{smtpConfig.port}</span></p>
                  <p className="flex justify-between w-64 border-b border-gray-100 pb-1">Usuario: <span className="text-gray-900 truncate ml-4">{smtpConfig.user}</span></p>
                  <p className="flex justify-between w-64 border-b border-gray-100 pb-1">Enviado como: <span className="text-gray-900">{smtpConfig.fromName}</span></p>
                  <p className="flex justify-between w-64 pb-1">Seguridad: <span className={`font-bold ${smtpConfig.useSSL ? 'text-green-600' : 'text-orange-600'}`}>{smtpConfig.useSSL ? (lang === 'es' ? 'Activado' : '已激活') : (lang === 'es' ? 'Desactivado' : '未激活')}</span></p>
                </div>
              </div>
            </div>

            <div className="bg-[#F8FAFC] border border-gray-200 rounded-lg p-5 flex items-start gap-4">
               <div className="p-2 bg-white rounded-lg shadow-sm"><Info className="w-5 h-5 text-blue-500" /></div>
              <div className="space-y-1">
                <p className="text-sm font-bold text-gray-700">{t.portGuide}</p>
                <div className="text-[11px] text-gray-600 font-medium space-y-2 mt-2">
                  <p><span className="font-bold text-gray-900 bg-white px-1.5 py-0.5 rounded shadow-xs border border-gray-100">465:</span> SSL/TLS. Switch <b>ON</b>.</p>
                  <p><span className="font-bold text-gray-900 bg-white px-1.5 py-0.5 rounded shadow-xs border border-gray-100">587:</span> STARTTLS. Switch <b>OFF</b>.</p>
                </div>
              </div>
            </div>
          </div>

          <div className="pt-8 border-t border-gray-200">
            <h2 className="text-xl font-bold text-gray-900 mb-1">{t.testsTitle}</h2>
            <p className="text-sm text-gray-500 mb-6">{t.testsDesc}</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              {[
                { id: 'Basic SMTP', title: t.testBasic, icon: Mail },
                { id: 'Reset Password', title: t.testReset, icon: Key },
                { id: 'Invitation', title: t.testInvite, icon: UserCheck },
                { id: 'Alert', title: t.testAlert, icon: AlertCircle }
              ].map((test) => (
                <button key={test.id} disabled={!!testingId} onClick={() => handleTestEmail(test.title)} className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm hover:shadow-md transition-all flex flex-col items-center text-center group disabled:opacity-50">
                  <div className={`p-3 rounded-xl transition-all mb-4 ${testingId === test.title ? 'bg-primary/10 text-primary animate-pulse' : 'bg-gray-50 text-gray-400 group-hover:bg-primary/10 group-hover:text-primary'}`}>
                    {testingId === test.title ? <Loader2 className="w-6 h-6 animate-spin" /> : <test.icon className="w-6 h-6" />}
                  </div>
                  <h3 className="text-xs font-bold text-gray-800 mb-1">{test.title}</h3>
                  <div className="mt-4 text-[10px] font-bold text-primary opacity-0 group-hover:opacity-100 transition-opacity">{t.executeTest}</div>
                </button>
              ))}
            </div>
            <div className="bg-blue-50 border border-blue-100 rounded-lg p-5 flex items-start gap-4">
              <Info className="w-5 h-5 text-blue-400 mt-1" />
              <div className="space-y-1">
                <p className="text-sm font-bold text-blue-900">{t.noteTitle}</p>
                <p className="text-xs text-blue-700 font-medium leading-relaxed">{t.noteText}</p>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-semibold text-gray-900">{t.usersTitle}</h2>
            <button className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-blue-600 text-sm font-medium shadow-sm">
              <UserPlus className="w-4 h-4" /> {t.inviteBtn}
            </button>
          </div>
          <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
            <table className="w-full text-left border-collapse">
              <thead className="bg-gray-50 text-gray-500 text-xs uppercase font-semibold">
                <tr>
                  <th className="px-6 py-4 border-b border-gray-100">{t.colName}</th>
                  <th className="px-6 py-4 border-b border-gray-100">{t.colRole}</th>
                  <th className="px-6 py-4 text-right border-b border-gray-100">{t.colActions}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {users.map(user => (
                  <tr key={user.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <img src={user.avatar} alt="" className="w-9 h-9 rounded-full bg-gray-200 object-cover ring-2 ring-gray-50 shadow-sm" />
                        <div>
                          <p className="text-sm font-bold text-gray-900">{user.name}</p>
                          <p className="text-[11px] text-gray-500 font-medium">{user.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                        user.role === UserRole.ADMIN ? 'bg-purple-100 text-purple-800' :
                        user.role === UserRole.OPERATOR ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-600'
                      }`}>
                        {lang === 'es' ? user.role : (user.role === UserRole.ADMIN ? '管理员' : user.role === UserRole.OPERATOR ? '操作员' : '读者')}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button className="p-2 text-gray-400 hover:text-blue-600 rounded-lg hover:bg-blue-50 transition-all"><Edit2 className="w-4 h-4" /></button>
                        <button className="p-2 text-gray-400 hover:text-yellow-600 rounded-lg hover:bg-yellow-50 transition-all"><RefreshCw className="w-4 h-4" /></button>
                        {user.role !== UserRole.ADMIN && <button className="p-2 text-gray-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition-all"><Trash2 className="w-4 h-4" /></button>}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default Admin;
