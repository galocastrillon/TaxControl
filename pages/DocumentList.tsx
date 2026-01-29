
import React, { useState, useEffect, useRef } from 'react';
import { getDocuments, displayDate, updateDocument } from '../constants';
import { DocStatus, Document } from '../types';
import { Search, Plus, MoreHorizontal, Eye, Edit, Trash2 } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

const DocumentList: React.FC = () => {
  const navigate = useNavigate();
  const [lang, setLang] = useState<'es' | 'cn'>(() => (localStorage.getItem('app_lang') as 'es' | 'cn') || 'es');
  
  useEffect(() => {
    const handleLangChange = () => {
      setLang((localStorage.getItem('app_lang') as 'es' | 'cn') || 'es');
    };
    window.addEventListener('languageChange', handleLangChange);
    return () => window.removeEventListener('languageChange', handleLangChange);
  }, []);

  const [documents, setDocuments] = useState<Document[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setDocuments(getDocuments());
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setOpenMenuId(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const translations = {
    es: {
      title: 'Gestión de Documentos',
      subtitle: 'Busca, filtra y gestiona todos tus documentos tributarios.',
      searchPlaceholder: 'Buscar por título, trámite o autoridad...',
      newDoc: 'Nuevo Documento',
      colTitle: 'Nombre Documento / Trámite',
      colAuth: 'Autoridad',
      colDue: 'Fecha Venc.',
      colStatus: 'Estado',
      colActions: 'Acciones',
      manage: 'Gestionar Trámite',
      delete: 'Eliminar',
      noDocs: 'No se encontraron documentos.'
    },
    cn: {
      title: '文档管理',
      subtitle: '搜索、过滤和管理您的所有税务文件。',
      searchPlaceholder: '按标题、程序或机构搜索...',
      newDoc: '新文档',
      colTitle: '文件名 / 程序编号',
      colAuth: '机构',
      colDue: '到期日期',
      colStatus: '状态',
      colActions: '操作',
      manage: '管理程序',
      delete: '删除',
      noDocs: '未找到文档。'
    }
  };

  const t = translations[lang];

  const getStatusColor = (status: DocStatus) => {
    switch (status) {
      case DocStatus.INITIALIZED: return 'bg-blue-100 text-blue-800';
      case DocStatus.IN_PROGRESS: return 'bg-purple-100 text-purple-800';
      case DocStatus.COMPLETED: return 'bg-green-100 text-green-800';
      case DocStatus.OVERDUE: return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusLabel = (status: DocStatus) => {
    if (lang === 'es') return status;
    switch (status) {
      case DocStatus.INITIALIZED: return '已初始化';
      case DocStatus.IN_PROGRESS: return '进行中';
      case DocStatus.COMPLETED: return '已完成';
      case DocStatus.OVERDUE: return '已逾期';
      default: return status;
    }
  };

  const toggleMenu = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setOpenMenuId(openMenuId === id ? null : id);
  };

  const handleDelete = (id: string) => {
    const confirmMsg = lang === 'es' ? '¿Está seguro de que desea eliminar este documento?' : '您确定要删除此文档吗？';
    if (window.confirm(confirmMsg)) {
      const allDocs = getDocuments();
      const filteredDocs = allDocs.filter(d => d.id !== id);
      localStorage.setItem('tax_control_docs', JSON.stringify(filteredDocs));
      setDocuments(filteredDocs);
      setOpenMenuId(null);
    }
  };

  const filteredDocuments = documents.filter(doc => 
    doc.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
    doc.trarniteNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
    doc.authority.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">{t.title}</h1>
        <p className="text-gray-500">{t.subtitle}</p>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-2.5 w-5 h-5 text-gray-400" />
          <input 
            type="text" 
            placeholder={t.searchPlaceholder} 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none text-sm transition-all" 
          />
        </div>
        <div className="flex items-center gap-3">
          <Link to="/upload" className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-blue-600 font-medium shadow-sm transition-all active:scale-95">
            <Plus className="w-4 h-4" /> {t.newDoc}
          </Link>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl shadow-sm">
        <div className="overflow-visible">
          <table className="w-full text-left border-collapse">
            <thead className="bg-gray-50 text-gray-500 text-[10px] uppercase font-bold tracking-wider">
              <tr>
                <th className="px-6 py-4 border-b border-gray-100">{t.colTitle}</th>
                <th className="px-6 py-4 border-b border-gray-100">{t.colAuth}</th>
                <th className="px-6 py-4 border-b border-gray-100">{t.colDue}</th>
                <th className="px-6 py-4 border-b border-gray-100">{t.colStatus}</th>
                <th className="px-6 py-4 text-right border-b border-gray-100">{t.colActions}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredDocuments.length > 0 ? filteredDocuments.map((doc) => (
                <tr key={doc.id} className="hover:bg-gray-50/50 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="flex flex-col">
                        <span className="text-sm font-semibold text-gray-900 line-clamp-1 group-hover:text-primary transition-colors">{doc.title}</span>
                        <span className="text-[11px] text-gray-400 mt-1 font-mono">#{doc.trarniteNumber}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm text-gray-600 font-medium">{doc.authority}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm text-gray-600 font-bold">{displayDate(doc.dueDate)}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide ${getStatusColor(doc.status)}`}>
                      {getStatusLabel(doc.status)}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                        <Link 
                          to={`/documents/${doc.id}`} 
                          title={t.manage}
                          className="p-1.5 text-gray-400 hover:text-primary rounded-lg hover:bg-blue-50 transition-all"
                        >
                            <Eye className="w-4 h-4" />
                        </Link>
                        
                        <div className="relative">
                          <button 
                            onClick={(e) => toggleMenu(e, doc.id)} 
                            className={`p-1.5 rounded-lg transition-all ${
                              openMenuId === doc.id ? 'bg-gray-100 text-gray-900 shadow-inner' : 'text-gray-400 hover:text-gray-700 hover:bg-gray-100'
                            }`}
                          >
                              <MoreHorizontal className="w-4 h-4" />
                          </button>
                          
                          {openMenuId === doc.id && (
                            <div 
                              ref={menuRef} 
                              className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-xl border border-gray-100 py-1.5 z-[100] animate-in fade-in zoom-in-95 duration-100 origin-top-right"
                            >
                                <button 
                                  onClick={() => navigate(`/documents/${doc.id}`)}
                                  className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-blue-50 hover:text-primary flex items-center gap-3 transition-colors"
                                >
                                    <Eye className="w-4 h-4" /> {t.manage}
                                </button>
                                <div className="h-px bg-gray-100 my-1 mx-2"></div>
                                <button 
                                  onClick={() => handleDelete(doc.id)}
                                  className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-3 transition-colors"
                                >
                                    <Trash2 className="w-4 h-4" /> {t.delete}
                                </button>
                            </div>
                          )}
                        </div>
                    </div>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                    <div className="flex flex-col items-center gap-2">
                      <Search className="w-8 h-8 text-gray-300" />
                      <p className="text-sm font-medium">{t.noDocs}</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default DocumentList;
