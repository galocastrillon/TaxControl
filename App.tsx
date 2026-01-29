
import React, { useState, useEffect } from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import Dashboard from './pages/Dashboard';
import DocumentList from './pages/DocumentList';
import DocumentUpload from './pages/DocumentUpload';
import DocumentDetail from './pages/DocumentDetail';
import Admin from './pages/Admin';
import Settings from './pages/Settings';
import Alerts from './pages/Alerts';

const Login: React.FC = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    
    const [lang, setLang] = useState<'es' | 'cn'>(() => (localStorage.getItem('app_lang') as 'es' | 'cn') || 'es');
    
    useEffect(() => {
        const handleLangChange = () => {
            setLang((localStorage.getItem('app_lang') as 'es' | 'cn') || 'es');
        };
        window.addEventListener('languageChange', handleLangChange);
        return () => window.removeEventListener('languageChange', handleLangChange);
    }, []);

    const t = {
        title: 'Tax Control',
        subtitle: lang === 'es' ? 'Acceso al Sistema de Control Tributario' : '进入税务控制系统',
        email: lang === 'es' ? 'Correo Electrónico' : '电子邮件',
        password: lang === 'es' ? 'Contraseña' : '密码',
        loginBtn: lang === 'es' ? 'Iniciar Sesión' : '登录',
        errorMsg: lang === 'es' ? 'Credenciales incorrectas.' : '凭据错误。',
        rights: lang === 'es' ? 'Todos los derechos reservados.' : '版权所有。'
    };

    const handleLogin = (e: React.FormEvent) => {
        e.preventDefault();
        if (email === 'Impuestos@corriente.com.ec' && password === 'Password123') {
            window.location.hash = '#/';
        } else {
            setError(t.errorMsg);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
            <div className="max-w-md w-full bg-white p-8 rounded-xl shadow-lg text-center">
                 <div className="flex justify-center mb-4">
                    <svg className="w-12 h-12 text-primary" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        <path d="M2 17L12 22L22 17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        <path d="M2 12L12 17L22 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                 </div>
                 <h2 className="text-2xl font-bold text-gray-900 mb-2">{t.title}</h2>
                 <p className="text-gray-500 mb-8">{t.subtitle}</p>
                 
                 <form className="space-y-4 text-left" onSubmit={handleLogin}>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">{t.email}</label>
                        <input 
                            type="email" 
                            placeholder="Impuestos@corriente.com.ec" 
                            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary outline-none"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">{t.password}</label>
                        <input 
                            type="password" 
                            placeholder="••••••••" 
                            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary outline-none"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                    </div>
                    {error && <p className="text-red-500 text-xs mt-2">{error}</p>}
                    <button type="submit" className="w-full bg-primary text-white p-3 rounded-lg font-bold hover:bg-blue-600 transition shadow-md mt-4">
                        {t.loginBtn}
                    </button>
                 </form>
                 <div className="mt-8 pt-6 border-t border-gray-100">
                    <p className="text-xs text-gray-400">© 2025 ECSA - Tax Control. {t.rights}</p>
                 </div>
            </div>
        </div>
    )
}

const MainLayout: React.FC<{children: React.ReactNode}> = ({ children }) => (
  <div className="min-h-screen bg-background font-sans text-text">
    <Sidebar />
    <Header />
    <main className="pl-64 pt-16 min-h-screen">
      {children}
    </main>
  </div>
);

const App: React.FC = () => {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/" element={<MainLayout><Dashboard /></MainLayout>} />
        <Route path="/alerts" element={<MainLayout><Alerts /></MainLayout>} />
        <Route path="/documents" element={<MainLayout><DocumentList /></MainLayout>} />
        <Route path="/documents/:id" element={<MainLayout><DocumentDetail /></MainLayout>} />
        <Route path="/upload" element={<MainLayout><DocumentUpload /></MainLayout>} />
        <Route path="/upload/:id" element={<MainLayout><DocumentUpload /></MainLayout>} />
        <Route path="/admin" element={<MainLayout><Admin /></MainLayout>} />
        <Route path="/settings" element={<MainLayout><Settings /></MainLayout>} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
};

export default App;
