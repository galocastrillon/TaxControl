
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getDocuments, updateDocument, MOCK_ACTIVITIES, displayDate, CURRENT_USER } from '../constants';
import { Document, Activity, DocStatus, DayType, Contestation, UserRole, ContestationFile } from '../types';
import { analyzeDocumentText } from '../services/geminiService';
import { 
  ArrowLeft, Download, FileArchive, Trash2, 
  Building2, Landmark, FileText, Calendar, User, Hash,
  Clock, Sparkles, Loader2, Edit3, Languages,
  History, Plus, Paperclip, Send, UserCheck, ShieldCheck, RefreshCw, Lock,
  FileSpreadsheet, File as FileIcon, FileCode, CheckSquare, Square,
  CalendarDays, CalendarCheck, X, FilePlus, Eye
} from 'lucide-react';

const DocumentDetail: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const documents = getDocuments();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [lang, setLang] = useState<'es' | 'cn'>(() => (localStorage.getItem('app_lang') as 'es' | 'cn') || 'es');
  
  useEffect(() => {
    const handleLangChange = () => {
      setLang((localStorage.getItem('app_lang') as 'es' | 'cn') || 'es');
    };
    window.addEventListener('languageChange', handleLangChange);
    return () => window.removeEventListener('languageChange', handleLangChange);
  }, []);

  const initialDoc = useMemo(() => 
    documents.find(d => d.id === id) || documents[0], 
    [id, documents]
  );
  
  const [doc, setDoc] = useState<Document>(initialDoc);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  
  const [showActivityModal, setShowActivityModal] = useState(false);
  const [showContestationModal, setShowContestationModal] = useState(false);
  const [editingContestationId, setEditingContestationId] = useState<string | null>(null);
  const [previewFile, setPreviewFile] = useState<ContestationFile | null>(null);

  const [activitiesList, setActivitiesList] = useState<Activity[]>(() => {
    const stored = localStorage.getItem(`activities_${id}`);
    return stored ? JSON.parse(stored) : MOCK_ACTIVITIES.filter(a => a.docId === initialDoc.id);
  });

  const canEdit = useMemo(() => {
    if (doc.status === DocStatus.OVERDUE) {
      return CURRENT_USER.role === UserRole.ADMIN;
    }
    return true;
  }, [doc.status]);

  const syncDocumentStatus = (currentActivities: Activity[]) => {
    const allCompleted = currentActivities.length > 0 && currentActivities.every(a => a.status === 'Completed');
    const anyStarted = currentActivities.some(a => a.status === 'Completed');
    
    let newStatus = doc.status;
    if (allCompleted) newStatus = DocStatus.COMPLETED;
    else if (anyStarted || currentActivities.length > 0) newStatus = DocStatus.IN_PROGRESS;
    else newStatus = DocStatus.INITIALIZED;

    if (doc.status !== newStatus) {
      const updatedDoc = { ...doc, status: newStatus };
      setDoc(updatedDoc);
      updateDocument(updatedDoc);
    }
  };

  const handleToggleActivity = (actId: string) => {
    const updatedActivities = activitiesList.map((act) => 
      act.id === actId 
        ? { 
            ...act, 
            status: (act.status === 'Completed' ? 'Pending' : 'Completed') as any,
            completedBy: act.status === 'Completed' ? undefined : CURRENT_USER.name,
            completedAt: act.status === 'Completed' ? undefined : new Date().toISOString().split('T')[0]
          } 
        : act
    );
    setActivitiesList(updatedActivities);
    localStorage.setItem(`activities_${id}`, JSON.stringify(updatedActivities));
    syncDocumentStatus(updatedActivities);
  };

  const [newActivity, setNewActivity] = useState({
    description: '',
    priority: 'Medium' as 'High' | 'Medium' | 'Low',
    dueDate: new Date().toISOString().split('T')[0]
  });

  const handleSaveActivity = () => {
    if (!newActivity.description.trim()) return;
    const activity: Activity = {
      id: 'act_' + Date.now(),
      docId: doc.id,
      description: newActivity.description,
      status: 'Pending',
      dueDate: newActivity.dueDate,
      priority: newActivity.priority
    };
    const updated = [...activitiesList, activity];
    setActivitiesList(updated);
    localStorage.setItem(`activities_${id}`, JSON.stringify(updated));
    syncDocumentStatus(updated);
    setShowActivityModal(false);
    setNewActivity({ description: '', priority: 'Medium', dueDate: new Date().toISOString().split('T')[0] });
  };

  const [newConData, setNewConData] = useState<{
    notes: string;
    date: string;
    contactMethod: string;
    files: ContestationFile[];
  }>({
    notes: '',
    date: new Date().toISOString().split('T')[0],
    contactMethod: 'Ventanilla Física',
    files: []
  });

  const handleEditContestation = (con: Contestation) => {
    setEditingContestationId(con.id);
    setNewConData({
      notes: con.notes,
      date: con.date,
      contactMethod: con.contactMethod,
      files: con.files || []
    });
    setShowContestationModal(true);
  };

  const handleDeleteContestation = (conId: string) => {
    if (!window.confirm(lang === 'es' ? '¿Está seguro de eliminar esta contestación?' : '确定要删除此答复吗？')) return;
    const updatedContestations = (doc.contestations || []).filter(c => c.id !== conId);
    const updatedDoc = { ...doc, contestations: updatedContestations };
    setDoc(updatedDoc);
    updateDocument(updatedDoc);
  };

  const handleAddFileToContestation = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const newFiles = Array.from(e.target.files).map(f => ({
        id: 'file_' + Math.random().toString(36).substr(2, 9),
        name: f.name,
        type: f.type
      }));
      setNewConData(prev => ({ ...prev, files: [...prev.files, ...newFiles] }));
    }
  };

  const handleRemoveFileFromNewCon = (fileId: string) => {
    setNewConData(prev => ({ ...prev, files: prev.files.filter(f => f.id !== fileId) }));
  };

  const handleSaveContestation = () => {
    if (!newConData.notes.trim()) return;
    
    let updatedContestations = [...(doc.contestations || [])];
    
    if (editingContestationId) {
      updatedContestations = updatedContestations.map(c => 
        c.id === editingContestationId 
          ? { 
              ...c, 
              ...newConData, 
              lastEditedBy: CURRENT_USER.name, 
              lastEditedAt: new Date().toISOString().split('T')[0] 
            } 
          : c
      );
    } else {
      const newCon: Contestation = {
        id: 'con_' + Date.now(),
        date: newConData.date,
        authority: doc.authority,
        notes: newConData.notes,
        contactMethod: newConData.contactMethod,
        files: newConData.files,
        registeredBy: CURRENT_USER.name,
        registrationDate: new Date().toISOString().split('T')[0]
      };
      updatedContestations.push(newCon);
    }
    
    const updatedDoc = { ...doc, contestations: updatedContestations };
    setDoc(updatedDoc);
    updateDocument(updatedDoc);
    setShowContestationModal(false);
    setEditingContestationId(null);
    setNewConData({ notes: '', date: new Date().toISOString().split('T')[0], contactMethod: 'Ventanilla Física', files: [] });
  };

  const handleDownloadFile = (file: ContestationFile) => {
    const isImage = file.type?.startsWith('image/') || /\.(jpg|jpeg|png|gif|webp)$/i.test(file.name);
    if (isImage) {
      setPreviewFile(file);
    } else {
      alert(`${lang === 'es' ? 'Descargando' : '正在下载'}: ${file.name}`);
    }
  };

  const handleEditFullDocument = () => {
    if (!canEdit) {
      const msg = lang === 'es' ? "Acceso Denegado" : "访问被拒绝";
      alert(msg);
      return;
    }
    navigate(`/upload/${doc.id}`);
  };

  const getFileIcon = (name: string) => {
    const ext = name.split('.').pop()?.toLowerCase();
    if (ext === 'xlsx' || ext === 'xls' || ext === 'csv') return <FileSpreadsheet className="w-5 h-5 text-green-600" />;
    if (ext === 'pdf') return <FileIcon className="w-5 h-5 text-red-600" />;
    if (ext === 'docx' || ext === 'doc') return <FileText className="w-5 h-5 text-blue-600" />;
    if (ext === 'zip' || ext === 'rar') return <FileArchive className="w-5 h-5 text-orange-600" />;
    return <FileCode className="w-5 h-5 text-gray-600" />;
  };

  const handleAnalyzeWithAI = async () => {
    setIsAnalyzing(true);
    try {
      const result = await analyzeDocumentText(`Trámite: ${doc.title}\nID: ${doc.trarniteNumber}\nEmpresa: ${doc.company}\nAutoridad: ${doc.authority}`);
      const updatedDoc = {
        ...doc,
        summaryEs: result.summaryEs || doc.summaryEs,
        summaryCn: result.summaryCn || doc.summaryCn,
        lastEditedBy: 'IA Assistant',
        lastEditedAt: new Date().toISOString().split('T')[0]
      };
      setDoc(updatedDoc);
      updateDocument(updatedDoc);
    } catch (err) { console.error(err); } finally { setIsAnalyzing(false); }
  };

  const getStatusBadge = (status: DocStatus) => {
    switch (status) {
      case DocStatus.COMPLETED: return 'bg-green-100 text-green-700';
      case DocStatus.IN_PROGRESS: return 'bg-blue-100 text-blue-700';
      case DocStatus.OVERDUE: return 'bg-red-100 text-red-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const t = {
    welcome: lang === 'es' ? 'Bienvenido, ' : '欢迎, ',
    manageSubtitle: lang === 'es' ? 'Gestiona el cumplimiento legal de este trámite' : '管理此程序的法律合规性',
    editBtn: lang === 'es' ? 'EDITAR' : '编辑',
    infoGeneral: lang === 'es' ? 'Información General' : '基本信息',
    infoPlazos: lang === 'es' ? 'Información de Plazos' : '期限信息',
    plazoOtorgado: lang === 'es' ? 'PLAZO OTORGADO' : '授予期限',
    vencimiento: lang === 'es' ? 'VENCIMIENTO' : '到期日期',
    entryDate: lang === 'es' ? 'FECHA DE INGRESO' : '录入日期',
    notifDate: lang === 'es' ? 'FECHA DE NOTIFICACIÓN' : '通知日期',
    dueDate: lang === 'es' ? 'FECHA DE VENCIMIENTO' : '到期日期',
    activitiesTitle: lang === 'es' ? 'Actividades a realizar' : '待办活动',
    contestations: lang === 'es' ? 'Contestaciones' : '答复记录',
    summaryTitle: lang === 'es' ? 'RESUMEN DEL DOCUMENTO RECIBIDO' : '收到文件摘要',
    processing: lang === 'es' ? 'PROCESANDO...' : '处理中...',
    reanalyze: lang === 'es' ? 'RE-ANALIZAR CON IA' : '重新使用人工智能分析',
    langEs: lang === 'es' ? 'LENGUAJE: ESPAÑOL' : '语言：西班牙语',
    langCn: lang === 'es' ? '中文摘要 (CHINO SIMPLIFICADO)' : '中文摘要',
    registeredBy: lang === 'es' ? 'Registrado por' : '注册人',
    lastEditedBy: lang === 'es' ? 'Última edición por' : '最后编辑',
    completedBy: lang === 'es' ? 'Completado por' : '完成者',
    modalActTitle: lang === 'es' ? 'Añadir Nueva Actividad' : '添加新活动',
    modalDesc: lang === 'es' ? 'Descripción' : '描述',
    modalPriority: lang === 'es' ? 'Prioridad' : '优先级',
    modalDue: lang === 'es' ? 'Vencimiento' : '到期',
    modalCancel: lang === 'es' ? 'Cancelar' : '取消',
    modalSave: lang === 'es' ? 'Guardar' : '保存',
    modalConTitle: lang === 'es' ? 'Registrar Contestación' : '注册答复',
    modalConEdit: lang === 'es' ? 'Editar Contestación' : '编辑答复',
    modalNotes: lang === 'es' ? 'Notas del descargo' : '免责声明备注',
    modalDate: lang === 'es' ? 'Fecha Presentación' : '提交日期',
    modalMethod: lang === 'es' ? 'Método' : '方式',
    modalFiles: lang === 'es' ? 'Archivos Adjuntos' : '附件',
    modalAttach: lang === 'es' ? 'ADJUNTAR' : '附加',
    modalNoFiles: lang === 'es' ? 'Sin archivos adjuntos.' : '无附件。',
    modalPreviewTitle: lang === 'es' ? 'Vista previa no disponible' : '预览不可用',
    modalPreviewNo: lang === 'es' ? 'El archivo no admite visualización directa.' : '该文件不支持直接查看。',
    modalClose: lang === 'es' ? 'Cerrar' : '关闭'
  };

  return (
    <div className="p-8 max-w-[1600px] mx-auto space-y-6">
      <div className="flex items-center gap-4 mb-2">
        <button onClick={() => navigate('/documents')} className="p-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors shadow-sm">
          <ArrowLeft className="w-4 h-4 text-gray-600" />
        </button>
        <div>
          <h2 className="text-xl font-bold text-gray-900">{t.welcome}{CURRENT_USER.name}</h2>
          <p className="text-sm text-gray-500 font-medium">{t.manageSubtitle}</p>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm flex items-center gap-8">
        <div className="flex-1 space-y-1">
          <h1 className="text-2xl font-black text-gray-900 leading-tight uppercase">{doc.title}</h1>
        </div>
        <div className="flex-1"></div>
        <div className="flex items-center gap-3 border-l border-gray-100 pl-10">
           <button onClick={handleEditFullDocument} className={`flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 text-gray-700 text-[11px] font-bold rounded-lg hover:bg-gray-50 shadow-sm transition-all ${!canEdit ? 'opacity-50' : ''}`}>
             <Edit3 className="w-3.5 h-3.5 text-primary" /> {t.editBtn}
           </button>
           <span className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-wider ${getStatusBadge(doc.status)}`}>
             {lang === 'es' ? doc.status : (doc.status === DocStatus.COMPLETED ? '已完成' : doc.status === DocStatus.IN_PROGRESS ? '进行中' : doc.status === DocStatus.OVERDUE ? '已逾期' : '已初始化')}
           </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden p-6 flex flex-col">
            <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2 uppercase tracking-tight"><Building2 className="w-5 h-5 text-gray-300" /> {t.infoGeneral}</h3>
            <div className="grid grid-cols-2 gap-6 flex-1">
              <div><p className="text-[11px] text-gray-400 font-bold uppercase mb-1">{lang === 'es' ? 'Empresa' : '公司'}</p><p className="text-sm font-bold text-gray-800">{doc.company}</p></div>
              <div><p className="text-[11px] text-gray-400 font-bold uppercase mb-1">{lang === 'es' ? 'Autoridad' : '机构'}</p><p className="text-sm font-bold text-gray-800 line-clamp-2">{doc.authority}</p></div>
              <div className="col-span-2 pt-4 flex flex-col gap-1">
                <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">{lang === 'es' ? 'TRÁMITE' : '程序'}: <span className="text-gray-900 font-mono ml-1">#{doc.trarniteNumber}</span></p>
                <div className="flex items-center justify-between">
                  <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">{lang === 'es' ? 'ARCHIVO' : '文件'}: <span className="text-gray-900 ml-1 break-all uppercase">{doc.fileName}</span></p>
                  <button onClick={() => handleDownloadFile({id: 'main', name: doc.fileName || 'document.pdf'})} className="p-1.5 text-primary hover:bg-blue-50 rounded-lg transition-all" title="Ver / Descargar">
                    <Download className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2 uppercase tracking-tight"><Clock className="w-5 h-5 text-gray-300" /> {t.infoPlazos}</h3>
            <div className="grid grid-cols-2 gap-6 mb-8">
              <div>
                <p className="text-[11px] text-gray-400 font-bold uppercase mb-1">{t.plazoOtorgado}</p>
                <p className="text-sm font-bold text-gray-800">{doc.daysLimit} {lang === 'es' ? doc.dayType : (doc.dayType === DayType.BUSINESS ? '工作日' : '自然日')}</p>
              </div>
              <div>
                <p className="text-[11px] text-gray-400 font-bold uppercase mb-1">{t.vencimiento}</p>
                <p className="text-lg font-black text-primary uppercase">{displayDate(doc.dueDate)}</p>
              </div>
            </div>
            <div className="flex gap-10 pt-4 border-t border-gray-50">
              <div className="flex flex-col gap-1">
                 <p className="text-[10px] font-bold text-gray-400 uppercase tracking-tight">{t.entryDate}</p>
                 <p className="text-sm font-bold text-gray-800">{displayDate(doc.createdAt || doc.notificationDate)}</p>
              </div>
              <div className="flex flex-col gap-1">
                 <p className="text-[10px] font-bold text-gray-400 uppercase tracking-tight">{t.notifDate}</p>
                 <p className="text-sm font-bold text-gray-800">{displayDate(doc.notificationDate)}</p>
              </div>
              <div className="flex flex-col gap-1">
                 <p className="text-[10px] font-bold text-red-400 uppercase tracking-tight">{t.dueDate}</p>
                 <p className="text-sm font-bold text-red-600">{displayDate(doc.dueDate)}</p>
              </div>
            </div>
        </div>
      </div>

      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2 uppercase tracking-widest"><Sparkles className="w-5 h-5 text-primary" /> {t.summaryTitle}</h3>
          <button onClick={handleAnalyzeWithAI} disabled={isAnalyzing} className="flex items-center gap-2 px-4 py-2 bg-primary text-white text-xs font-bold rounded-lg shadow-sm active:scale-95 disabled:bg-gray-400">
            {isAnalyzing ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />} {isAnalyzing ? t.processing : t.reanalyze}
          </button>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="bg-white border border-gray-200 rounded-xl p-8 shadow-sm">
            <h4 className="text-xs font-black text-primary mb-6 flex items-center gap-2 border-b border-gray-50 pb-3 uppercase tracking-wider">{t.langEs}</h4>
            <div className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap min-h-[400px]">{doc.summaryEs || (lang === 'es' ? 'No hay análisis.' : '没有分析。')}</div>
          </div>
          <div className="bg-white border border-gray-200 rounded-xl p-8 shadow-sm">
            <h4 className="text-xs font-black text-indigo-600 mb-6 flex items-center gap-2 border-b border-gray-50 pb-3 uppercase tracking-wider">{t.langCn}</h4>
            <div className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap italic min-h-[400px]">{doc.summaryCn || (lang === 'es' ? '无内容。' : '无内容。')}</div>
          </div>
        </div>
      </div>

      <div className="space-y-8 mt-8">
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden flex flex-col">
          <div className="p-5 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
            <h3 className="text-lg font-bold text-gray-900">{t.activitiesTitle} ({activitiesList.length})</h3>
            <button onClick={() => setShowActivityModal(true)} className="p-2 bg-primary text-white rounded-lg hover:bg-blue-600 transition-all shadow-sm active:scale-95">
              <Plus className="w-4 h-4" />
            </button>
          </div>
          <div className="p-6 space-y-4">
            {activitiesList.length > 0 ? activitiesList.map(act => (
              <div key={act.id} className="p-4 border border-gray-100 rounded-xl hover:bg-gray-50 transition-colors">
                <div className="flex items-center gap-4">
                   <button onClick={() => handleToggleActivity(act.id)}>
                      {act.status === 'Completed' ? <CheckSquare className="w-6 h-6 text-primary" /> : <Square className="w-6 h-6 text-gray-300" />}
                   </button>
                   <div className="flex-1">
                     <h4 className={`text-sm font-bold ${act.status === 'Completed' ? 'text-gray-400 line-through' : 'text-gray-900'}`}>{act.description}</h4>
                     <p className="text-[10px] text-gray-400 mt-0.5">{lang === 'es' ? 'Vence' : '到期'}: {displayDate(act.dueDate)}</p>
                   </div>
                   <span className={`px-2 py-0.5 rounded text-[10px] font-bold text-white uppercase ${act.priority === 'High' ? 'bg-red-500' : 'bg-gray-400'}`}>{lang === 'es' ? act.priority : (act.priority === 'High' ? '高' : act.priority === 'Medium' ? '中' : '低')}</span>
                </div>
                {act.status === 'Completed' && act.completedBy && (
                  <div className="mt-2 ml-10 pt-2 border-t border-gray-50 flex items-center gap-1.5 text-[9px] text-gray-400 italic">
                    <UserCheck className="w-3 h-3" /> {t.completedBy} <span className="font-bold">{act.completedBy}</span> {act.completedAt ? `el ${displayDate(act.completedAt)}` : ''}
                  </div>
                )}
              </div>
            )) : <p className="text-center py-12 text-gray-400 text-sm italic">{lang === 'es' ? 'No hay actividades registradas.' : '没有记录的活动。'}</p>}
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden flex flex-col">
          <div className="p-5 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
            <h3 className="text-lg font-bold text-gray-900">{t.contestations} ({doc.contestations?.length || 0})</h3>
            <button onClick={() => { setEditingContestationId(null); setNewConData({ notes: '', date: new Date().toISOString().split('T')[0], contactMethod: 'Ventanilla Física', files: [] }); setShowContestationModal(true); }} 
              className="p-2 border border-green-500 text-green-600 rounded-lg hover:bg-green-500 hover:text-white transition-all shadow-sm active:scale-95 border-2">
              <Plus className="w-4 h-4" />
            </button>
          </div>
          <div className="p-6 space-y-6">
            {doc.contestations && doc.contestations.length > 0 ? doc.contestations.map(con => (
              <div key={con.id} className="p-5 border border-gray-100 rounded-2xl hover:bg-gray-50/30 transition-all group">
                <div className="flex justify-between items-start mb-3">
                   <div className="flex gap-2 items-center">
                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{displayDate(con.date)}</span>
                    <span className="bg-blue-50 text-blue-700 text-[10px] font-bold px-2 py-0.5 rounded uppercase">{lang === 'es' ? con.contactMethod : (con.contactMethod === 'Ventanilla Física' ? '物理窗口' : con.contactMethod === 'Correo Electrónico' ? '电子邮件' : '网络平台')}</span>
                   </div>
                   <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => handleEditContestation(con)} className="p-1.5 text-gray-400 hover:text-primary hover:bg-blue-50 rounded-lg transition-all"><Edit3 className="w-4 h-4" /></button>
                      <button onClick={() => handleDeleteContestation(con.id)} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"><Trash2 className="w-4 h-4" /></button>
                   </div>
                </div>
                <p className="text-sm font-bold text-gray-800 leading-relaxed mb-4">{con.notes}</p>
                {con.files && con.files.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-4">
                    {con.files.map(f => (
                      <div key={f.id} className="flex items-center gap-2 px-3 py-1.5 bg-white border border-gray-100 rounded-lg text-xs font-medium text-gray-600 shadow-sm hover:border-primary transition-colors cursor-default group/file">
                        {getFileIcon(f.name)}
                        <span className="truncate max-w-[150px]">{f.name}</span>
                        <button onClick={() => handleDownloadFile(f)} className="text-gray-400 hover:text-primary p-0.5">
                           { (f.type?.startsWith('image/') || /\.(jpg|jpeg|png|gif|webp)$/i.test(f.name)) ? <Eye className="w-3.5 h-3.5" /> : <Download className="w-3.5 h-3.5" /> }
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                <div className="pt-3 border-t border-gray-50 flex flex-col gap-1">
                   <div className="flex items-center gap-1.5 text-[10px] text-gray-400 italic">
                      <UserCheck className="w-3 h-3" /> {t.registeredBy} {con.registeredBy} el {displayDate(con.registrationDate)}
                   </div>
                   {con.lastEditedBy && (
                     <div className="flex items-center gap-1.5 text-[10px] text-indigo-400 italic font-medium">
                        <Edit3 className="w-3 h-3" /> {t.lastEditedBy} {con.lastEditedBy} el {displayDate(con.lastEditedAt || '')}
                     </div>
                   )}
                </div>
              </div>
            )) : <p className="text-center py-12 text-gray-400 text-sm italic">{lang === 'es' ? 'No hay registros de contestación.' : '没有答复记录。'}</p>}
          </div>
        </div>
      </div>

      {showActivityModal && (
        <div className="fixed inset-0 z-[100] bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center">
              <h3 className="font-bold text-gray-900">{t.modalActTitle}</h3>
              <button onClick={() => setShowActivityModal(false)}><X className="w-5 h-5 text-gray-400" /></button>
            </div>
            <div className="p-6 space-y-4">
              <label className="block">
                <span className="text-xs font-bold text-gray-500 uppercase">{t.modalDesc}</span>
                <textarea className="w-full mt-1 p-3 border rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary/20" rows={3} value={newActivity.description} onChange={e => setNewActivity({...newActivity, description: e.target.value})} />
              </label>
              <div className="grid grid-cols-2 gap-4">
                <label>
                  <span className="text-xs font-bold text-gray-500 uppercase">{t.modalPriority}</span>
                  <select className="w-full mt-1 p-2.5 border rounded-lg text-sm bg-white" value={newActivity.priority} onChange={e => setNewActivity({...newActivity, priority: e.target.value as any})}>
                    <option value="High">{lang === 'es' ? 'Alta' : '高'}</option>
                    <option value="Medium">{lang === 'es' ? 'Media' : '中'}</option>
                    <option value="Low">{lang === 'es' ? 'Baja' : '低'}</option>
                  </select>
                </label>
                <label>
                  <span className="text-xs font-bold text-gray-500 uppercase">{t.modalDue}</span>
                  <input type="date" className="w-full mt-1 p-2.5 border rounded-lg text-sm" value={newActivity.dueDate} onChange={e => setNewActivity({...newActivity, dueDate: e.target.value})} />
                </label>
              </div>
            </div>
            <div className="p-6 bg-gray-50 flex justify-end gap-3">
              <button onClick={() => setShowActivityModal(false)} className="text-sm font-medium text-gray-500">{t.modalCancel}</button>
              <button onClick={handleSaveActivity} className="px-6 py-2 bg-primary text-white rounded-xl font-bold shadow-md hover:bg-blue-700">{t.modalSave}</button>
            </div>
          </div>
        </div>
      )}

      {showContestationModal && (
        <div className="fixed inset-0 z-[100] bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center">
              <h3 className="font-bold text-gray-900">{editingContestationId ? t.modalConEdit : t.modalConTitle}</h3>
              <button onClick={() => { setShowContestationModal(false); setEditingContestationId(null); }}><X className="w-5 h-5 text-gray-400" /></button>
            </div>
            <div className="p-6 space-y-5">
              <label className="block">
                <span className="text-xs font-bold text-gray-500 uppercase">{t.modalNotes}</span>
                <textarea className="w-full mt-1 p-3 border rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary/20" rows={4} placeholder={lang === 'es' ? "Detalle de la presentación..." : "详情提交..."} value={newConData.notes} onChange={e => setNewConData({...newConData, notes: e.target.value})} />
              </label>
              <div className="grid grid-cols-2 gap-4">
                <label>
                  <span className="text-xs font-bold text-gray-500 uppercase">{t.modalDate}</span>
                  <input type="date" className="w-full mt-1 p-2.5 border rounded-lg text-sm" value={newConData.date} onChange={e => setNewConData({...newConData, date: e.target.value})} />
                </label>
                <label>
                  <span className="text-xs font-bold text-gray-500 uppercase">{t.modalMethod}</span>
                  <select className="w-full mt-1 p-2.5 border rounded-lg text-sm bg-white" value={newConData.contactMethod} onChange={e => setNewConData({...newConData, contactMethod: e.target.value})}>
                    <option value="Ventanilla Física">{lang === 'es' ? 'Ventanilla Física' : '物理窗口'}</option>
                    <option value="Correo Electrónico">{lang === 'es' ? 'Correo Electrónico' : '电子邮件'}</option>
                    <option value="Plataforma Web">{lang === 'es' ? 'Plataforma Web' : '网络平台'}</option>
                  </select>
                </label>
              </div>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-gray-500 uppercase">{t.modalFiles}</span>
                  <input type="file" ref={fileInputRef} className="hidden" multiple onChange={handleAddFileToContestation} />
                  <button onClick={() => fileInputRef.current?.click()} className="flex items-center gap-1.5 px-3 py-1 bg-gray-50 border border-gray-200 text-[10px] font-bold text-gray-600 rounded-lg hover:bg-gray-100 transition-all">
                    <FilePlus className="w-3.5 h-3.5" /> {t.modalAttach}
                  </button>
                </div>
                <div className="bg-gray-50/50 p-4 border border-dashed border-gray-200 rounded-xl min-h-[60px]">
                  {newConData.files.length > 0 ? (
                    <div className="grid grid-cols-2 gap-2">
                      {newConData.files.map(f => (
                        <div key={f.id} className="flex items-center justify-between p-2 bg-white border border-gray-100 rounded-lg shadow-xs group">
                           <div className="flex items-center gap-2 overflow-hidden">
                              {getFileIcon(f.name)}
                              <span className="text-[10px] font-bold text-gray-600 truncate">{f.name}</span>
                           </div>
                           <button onClick={() => handleRemoveFileFromNewCon(f.id)} className="p-1 text-gray-400 hover:text-red-500 group-hover:opacity-100 transition-all"><X className="w-3 h-3" /></button>
                        </div>
                      ))}
                    </div>
                  ) : ( <p className="text-center py-2 text-[10px] text-gray-400 font-medium italic">{t.modalNoFiles}</p> )}
                </div>
              </div>
            </div>
            <div className="p-6 bg-gray-50 flex justify-end gap-3">
              <button onClick={() => { setShowContestationModal(false); setEditingContestationId(null); }} className="text-sm font-medium text-gray-500">{t.modalCancel}</button>
              <button onClick={handleSaveContestation} className="px-6 py-2 bg-green-600 text-white rounded-xl font-bold shadow-md hover:bg-green-700">{editingContestationId ? (lang === 'es' ? 'Actualizar Registro' : '更新记录') : (lang === 'es' ? 'Registrar' : '注册')}</button>
            </div>
          </div>
        </div>
      )}

      {previewFile && (
        <div className="fixed inset-0 z-[200] bg-black/80 flex items-center justify-center p-8 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative bg-white rounded-2xl max-w-5xl w-full max-h-[90vh] overflow-hidden shadow-2xl flex flex-col">
            <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-white sticky top-0">
               <div className="flex items-center gap-3">
                  {getFileIcon(previewFile.name)}
                  <h3 className="font-bold text-gray-900 truncate max-w-md">{previewFile.name}</h3>
               </div>
               <button onClick={() => setPreviewFile(null)} className="p-2 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-gray-900 transition-all"><X className="w-6 h-6" /></button>
            </div>
            <div className="flex-1 bg-gray-100 overflow-auto flex items-center justify-center p-4">
              {/\.(jpg|jpeg|png|gif|webp)$/i.test(previewFile.name) ? (
                <img src={`https://picsum.photos/seed/${previewFile.id}/1200/800`} alt={previewFile.name} className="max-w-full h-auto rounded shadow-lg bg-white" />
              ) : (
                <div className="bg-white p-12 rounded-2xl shadow-sm text-center">
                   <div className="w-20 h-20 bg-blue-50 text-primary rounded-full flex items-center justify-center mx-auto mb-6"><FileIcon className="w-10 h-10" /></div>
                   <h4 className="text-xl font-bold text-gray-900 mb-2">{t.modalPreviewTitle}</h4>
                   <p className="text-gray-500 text-sm mb-8">{t.modalPreviewNo}</p>
                   <button onClick={() => alert('Descargando archivo...')} className="px-8 py-3 bg-primary text-white rounded-xl font-bold shadow-lg hover:bg-blue-700 transition-all flex items-center gap-2 mx-auto"><Download className="w-5 h-5" /> {lang === 'es' ? 'Descargar Archivo' : '下载文件'}</button>
                </div>
              )}
            </div>
            <div className="p-4 bg-white border-t border-gray-100 flex justify-center"><button onClick={() => setPreviewFile(null)} className="px-6 py-2 bg-gray-900 text-white rounded-xl font-bold hover:bg-black transition-all">{t.modalClose}</button></div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DocumentDetail;
