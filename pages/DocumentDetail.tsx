
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getDocuments, updateDocument, MOCK_ACTIVITIES, displayDate, CURRENT_USER } from '../constants';
import { Document, Activity, DocStatus, DayType, Contestation, UserRole, ContestationFile } from '../types';
import { analyzeDocumentText } from '../services/geminiService';
import { 
  ArrowLeft, Download, Trash2, 
  Building2, Clock, Sparkles, Loader2, Edit3, 
  Plus, UserCheck, RefreshCw,
  FileSpreadsheet, File as FileIcon, FileCode, CheckSquare, Square,
  X, FilePlus, Eye, FileArchive, Calendar, Send, PlusCircle, User as UserIcon, Paperclip, FileText, ExternalLink
} from 'lucide-react';

const DocumentDetail: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [lang, setLang] = useState<'es' | 'cn'>(() => (localStorage.getItem('app_lang') as 'es' | 'cn') || 'es');
  const [doc, setDoc] = useState<Document | null>(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    const handleLangChange = () => setLang((localStorage.getItem('app_lang') as 'es' | 'cn') || 'es');
    window.addEventListener('languageChange', handleLangChange);
    return () => window.removeEventListener('languageChange', handleLangChange);
  }, []);

  useEffect(() => {
    const fetchDoc = async () => {
      setLoading(true);
      try {
        const response = await fetch(`/api/documents/${id}`);
        if (!response.ok) throw new Error('Document not found');
        const data = await response.json();
        setDoc(data);
      } catch (error) {
        console.error('Error fetching document:', error);
        navigate('/documents');
      } finally {
        setLoading(false);
      }
    };
    fetchDoc();
  }, [id, navigate]);

  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [showActivityModal, setShowActivityModal] = useState(false);
  const [showContestationModal, setShowContestationModal] = useState(false);
  const [editingContestationId, setEditingContestationId] = useState<string | null>(null);
  const [editingActivityId, setEditingActivityId] = useState<string | null>(null);

  const [activitiesList, setActivitiesList] = useState<Activity[]>([]);

  useEffect(() => {
    if (doc) {
      const stored = localStorage.getItem(`activities_${id}`);
      setActivitiesList(stored ? JSON.parse(stored) : MOCK_ACTIVITIES.filter(a => a.docId === doc.id));
      setContestations(doc.contestations || []);
    }
  }, [doc, id]);

  const [contestations, setContestations] = useState<Contestation[]>([]);

  const [newActivity, setNewActivity] = useState({ 
    title: '', 
    description: '', 
    priority: 'High' as 'High' | 'Medium' | 'Low', 
    dueDate: new Date().toISOString().split('T')[0] 
  });

  const [newContestation, setNewContestation] = useState({
    date: new Date().toISOString().split('T')[0],
    authority: '',
    notes: '',
    contact_method: 'Ventanilla Física'
  });

  useEffect(() => {
    if (doc) {
      setNewContestation(prev => ({ ...prev, authority: doc.authority }));
    }
  }, [doc]);

  const [selectedFiles, setSelectedFiles] = useState<ContestationFile[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const canEdit = useMemo(() => {
    if (!doc) return false;
    return doc.status === DocStatus.OVERDUE ? CURRENT_USER.role === UserRole.ADMIN : true;
  }, [doc]);

  const syncDocumentStatus = async (currentActivities: Activity[]) => {
    if (!doc) return;
    const allCompleted = currentActivities.length > 0 && currentActivities.every(a => a.status === 'Completed');
    const anyStarted = currentActivities.some(a => a.status === 'Completed');
    let newStatus = allCompleted ? DocStatus.COMPLETED : (anyStarted || currentActivities.length > 0 ? DocStatus.IN_PROGRESS : DocStatus.INITIALIZED);
    if (doc.status !== newStatus) {
      const updatedDoc = { ...doc, status: newStatus };
      setDoc(updatedDoc);
      await updateDocument(updatedDoc);
    }
  };

  const handleToggleActivity = (actId: string) => {
    const updated = activitiesList.map(act => act.id === actId ? { 
      ...act, 
      status: (act.status === 'Completed' ? 'Pending' : 'Completed') as any, 
      completedBy: act.status === 'Completed' ? undefined : CURRENT_USER.name, 
      completedAt: act.status === 'Completed' ? undefined : new Date().toISOString().split('T')[0] 
    } : act);
    setActivitiesList(updated);
    localStorage.setItem(`activities_${id}`, JSON.stringify(updated));
    syncDocumentStatus(updated);
  };

  const handleOpenActivityModal = (activity?: Activity) => {
    if (activity) {
      setEditingActivityId(activity.id);
      setNewActivity({
        title: activity.description,
        description: activity.subDescription || '',
        priority: activity.priority,
        dueDate: activity.dueDate
      });
    } else {
      setEditingActivityId(null);
      setNewActivity({
        title: '',
        description: '',
        priority: 'High',
        dueDate: new Date().toISOString().split('T')[0]
      });
    }
    setShowActivityModal(true);
  };

  const handleSaveActivity = () => {
    if (!newActivity.title.trim() || !doc) return;
    
    let updated: Activity[];
    if (editingActivityId) {
      updated = activitiesList.map(a => a.id === editingActivityId ? {
        ...a,
        description: newActivity.title,
        subDescription: newActivity.description,
        priority: newActivity.priority,
        dueDate: newActivity.dueDate
      } : a);
    } else {
      const act: Activity = { 
        id: 'act_' + Date.now(), 
        docId: doc.id, 
        description: newActivity.title, 
        subDescription: newActivity.description,
        status: 'Pending', 
        dueDate: newActivity.dueDate, 
        priority: newActivity.priority 
      };
      updated = [...activitiesList, act];
    }
    
    setActivitiesList(updated);
    localStorage.setItem(`activities_${id}`, JSON.stringify(updated));
    syncDocumentStatus(updated);
    setShowActivityModal(false);
    setEditingActivityId(null);
    setNewActivity({ title: '', description: '', priority: 'High', dueDate: new Date().toISOString().split('T')[0] });
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const filesArray = Array.from(e.target.files);
      const newFiles: ContestationFile[] = await Promise.all(filesArray.map(async (f: File) => {
        const base64 = await new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.readAsDataURL(f);
        });
        return { id: 'f' + Math.random().toString(36).substr(2, 9), name: f.name, url: base64 };
      }));
      setSelectedFiles(prev => [...prev, ...newFiles]);
    }
  };

  const handleRemoveFile = (fId: string) => {
    setSelectedFiles(prev => prev.filter(f => f.id !== fId));
  };

  const handleOpenContestationModal = (contestation?: Contestation) => {
    if (!doc) return;
    if (contestation) {
      setEditingContestationId(contestation.id);
      setNewContestation({
        date: contestation.date,
        authority: contestation.authority,
        notes: contestation.notes,
        contact_method: contestation.contact_method
      });
      setSelectedFiles(contestation.files || []);
    } else {
      setEditingContestationId(null);
      setNewContestation({
        date: new Date().toISOString().split('T')[0],
        authority: doc.authority,
        notes: '',
        contact_method: 'Ventanilla Física'
      });
      setSelectedFiles([]);
    }
    setShowContestationModal(true);
  };

  const handleSaveContestation = async () => {
    if (!doc) return;
    let updatedContestations: Contestation[];
    
    if (editingContestationId) {
      updatedContestations = contestations.map(c => c.id === editingContestationId ? {
        ...c,
        date: newContestation.date,
        authority: newContestation.authority,
        notes: newContestation.notes,
        contact_method: newContestation.contact_method,
        files: selectedFiles,
        lastEditedBy: CURRENT_USER.name,
        lastEditedAt: new Date().toISOString().split('T')[0]
      } : c);
    } else {
      const contestation: Contestation = {
        id: 'c' + Date.now(),
        date: newContestation.date,
        authority: newContestation.authority,
        notes: newContestation.notes,
        contact_method: newContestation.contact_method,
        files: selectedFiles,
        registered_by: CURRENT_USER.name,
        registration_date: new Date().toISOString().split('T')[0]
      };
      updatedContestations = [...contestations, contestation];
    }

    setContestations(updatedContestations);
    const updatedDoc = { ...doc, contestations: updatedContestations };
    setDoc(updatedDoc);
    await updateDocument(updatedDoc);
    setShowContestationModal(false);
    setEditingContestationId(null);
    setSelectedFiles([]);
  };

  const handleDeleteContestation = async (cId: string) => {
    if (!doc) return;
    if (window.confirm(lang === 'es' ? '¿Está seguro de eliminar esta contestación?' : '您确定要删除此答复吗？')) {
      const updatedContestations = contestations.filter(c => c.id !== cId);
      setContestations(updatedContestations);
      const updatedDoc = { ...doc, contestations: updatedContestations };
      setDoc(updatedDoc);
      await updateDocument(updatedDoc);
    }
  };

  const downloadFile = (file: ContestationFile) => {
    if (!file.url) return;
    const link = document.createElement('a');
    link.href = file.url;
    link.download = file.name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDownloadMainFile = () => {
    if (doc && doc.fileUrl) {
      const link = document.createElement('a');
      link.href = doc.fileUrl;
      link.download = doc.fileName || 'documento_principal.pdf';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else {
      alert(lang === 'es' ? 'No hay un archivo principal cargado para descargar.' : '没有上传可供下载的主文件。');
    }
  };

  const handleAnalyzeWithAI = async () => {
    if (!doc) return;
    setIsAnalyzing(true);
    try {
      const result = await analyzeDocumentText(`Trámite: ${doc.title}\nID: ${doc.trarniteNumber}\nEmpresa: ${doc.company}\nAutoridad: ${doc.authority}`);
      const updatedDoc = { ...doc, summaryEs: result.summaryEs || doc.summaryEs, summaryCn: result.summaryCn || doc.summaryCn, lastEditedBy: 'IA Assistant', lastEditedAt: new Date().toISOString().split('T')[0] };
      setDoc(updatedDoc);
      await updateDocument(updatedDoc);
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
    downloadBtn: lang === 'es' ? 'DESCARGAR' : '下载',
    infoGeneral: lang === 'es' ? 'Información General' : '基本信息',
    infoPlazos: lang === 'es' ? 'Información de Plazos' : '期限信息',
    vencimiento: lang === 'es' ? 'VENCIMIENTO' : '到期日期',
    notifDate: lang === 'es' ? 'FECHA DE NOTIFICACIÓN' : '通知日期',
    dueDate: lang === 'es' ? 'FECHA DE VENCIMIENTO' : '到期日期',
    activitiesTitle: lang === 'es' ? 'Actividades a realizar' : '待办活动',
    summaryTitle: lang === 'es' ? 'RESUMEN DEL DOCUMENTO RECIBIDO' : '收到文件摘要',
    processing: lang === 'es' ? 'PROCESANDO...' : '处理中...',
    reanalyze: lang === 'es' ? 'RE-ANALIZAR CON IA' : '重新使用人工智能分析',
    langEs: lang === 'es' ? 'LENGUAJE: ESPAÑOL' : '语言：西班牙语',
    langCn: lang === 'es' ? '中文摘要' : '中文摘要',
    modalCancel: lang === 'es' ? 'Cancelar' : '取消',
    modalSave: lang === 'es' ? 'Guardar' : '保存',
    contestationsTitle: lang === 'es' ? 'Contestaciones' : '答复'
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="w-10 h-10 text-primary animate-spin" />
      </div>
    );
  }

  if (!doc) return null;

  return (
    <div className="p-8 max-w-[1600px] mx-auto space-y-6">
      <div className="flex items-center gap-4 mb-2">
        <button onClick={() => navigate('/documents')} className="p-2 bg-white border border-gray-200 rounded-lg shadow-sm transition-all hover:bg-gray-50 active:scale-95"><ArrowLeft className="w-4 h-4 text-gray-600" /></button>
        <div>
          <h2 className="text-xl font-bold text-gray-900">{t.welcome}{CURRENT_USER.name}</h2>
          <p className="text-sm text-gray-500 font-medium">{t.manageSubtitle}</p>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm flex items-center gap-8">
        <div className="flex-1">
          <h1 className="text-2xl font-black text-gray-900 uppercase tracking-tight">{doc.title}</h1>
          <p className="text-[14px] font-mono text-gray-500 mt-1">#{doc.trarniteNumber}</p>
        </div>
        <div className="flex items-center gap-3 border-l border-gray-100 pl-10">
           <button onClick={handleDownloadMainFile} className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 text-gray-700 text-[11px] font-bold rounded-lg hover:bg-gray-50 transition-all active:scale-95"><Download className="w-3.5 h-3.5 text-secondary" /> {t.downloadBtn}</button>
           <button onClick={() => navigate(`/upload/${doc.id}`)} disabled={!canEdit} className={`flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 text-gray-700 text-[11px] font-bold rounded-lg hover:bg-gray-50 transition-all ${!canEdit ? 'opacity-50 cursor-not-allowed' : 'active:scale-95'}`}><Edit3 className="w-3.5 h-3.5 text-primary" /> {t.editBtn}</button>
           <span className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-wider ${getStatusBadge(doc.status)}`}>{lang === 'es' ? doc.status : '已完成'}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2 uppercase tracking-tight"><Building2 className="w-5 h-5 text-gray-300" /> {t.infoGeneral}</h3>
            <div className="grid grid-cols-2 gap-6 text-sm font-bold text-gray-800">
              <div><p className="text-[11px] text-gray-400 uppercase mb-1 tracking-widest">{lang === 'es' ? 'Empresa' : '公司'}</p>{doc.company}</div>
              <div><p className="text-[11px] text-gray-400 uppercase mb-1 tracking-widest">{lang === 'es' ? 'Autoridad' : '机构'}</p>{doc.authority} - {doc.department}</div>
              <div className="col-span-2 pt-4 flex items-center gap-2">
                <span className="text-[11px] text-gray-400 uppercase tracking-widest">TRÁMITE:</span>
                <span className="font-mono text-primary">#{doc.trarniteNumber}</span>
              </div>
            </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2 uppercase tracking-tight"><Clock className="w-5 h-5 text-gray-300" /> {t.infoPlazos}</h3>
            <div className="grid grid-cols-2 gap-6 mb-8">
              <div><p className="text-[11px] text-gray-400 uppercase mb-1 tracking-widest">PLAZO</p>{doc.daysLimit} {doc.dayType}</div>
              <div><p className="text-[11px] text-gray-400 uppercase mb-1 tracking-widest">{t.vencimiento}</p><span className="text-lg font-black text-primary uppercase">{displayDate(doc.dueDate)}</span></div>
            </div>
            <div className="flex gap-10 pt-4 border-t border-gray-50 text-sm font-bold">
              <div><p className="text-[10px] text-gray-400 uppercase tracking-widest">{t.notifDate}</p>{displayDate(doc.notificationDate)}</div>
              <div><p className="text-[10px] text-red-400 uppercase tracking-widest">{t.dueDate}</p><span className="text-red-600">{displayDate(doc.dueDate)}</span></div>
            </div>
        </div>
      </div>

      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2 uppercase tracking-widest"><Sparkles className="w-5 h-5 text-primary" /> {t.summaryTitle}</h3>
          <button onClick={handleAnalyzeWithAI} disabled={isAnalyzing} className="flex items-center gap-2 px-4 py-2 bg-primary text-white text-xs font-bold rounded-lg disabled:bg-gray-400 shadow-md transition-all active:scale-95">
            {isAnalyzing ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />} {isAnalyzing ? t.processing : t.reanalyze}
          </button>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="bg-white border border-gray-200 rounded-xl p-8 shadow-sm">
            <h4 className="text-xs font-black text-primary mb-6 flex items-center gap-2 border-b border-gray-50 pb-3 uppercase tracking-widest">{t.langEs}</h4>
            <div className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap min-h-[300px]">{doc.summaryEs}</div>
          </div>
          <div className="bg-white border border-gray-200 rounded-xl p-8 shadow-sm">
            <h4 className="text-xs font-black text-indigo-600 mb-6 flex items-center gap-2 border-b border-gray-50 pb-3 uppercase tracking-widest">{t.langCn}</h4>
            <div className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap italic min-h-[300px]">{doc.summaryCn}</div>
          </div>
        </div>
      </div>

      {/* SECCIÓN DE ACTIVIDADES RESTAURADA */}
      <div className="grid grid-cols-1 gap-8 mt-8">
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm flex flex-col overflow-hidden">
          <div className="p-6 flex justify-between items-center">
            <h3 className="text-2xl font-bold text-gray-900">Actividades a realizar ({activitiesList.length})</h3>
            <button onClick={() => handleOpenActivityModal()} className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg font-bold text-sm shadow-lg shadow-blue-100 transition-all hover:bg-blue-600 active:scale-95">
              <PlusCircle className="w-4 h-4" /> Agregar Actividad
            </button>
          </div>
          <div className="p-6 pt-0 space-y-4">
            {activitiesList.length > 0 ? activitiesList.map(act => (
              <div key={act.id} className="p-4 border border-gray-100 rounded-xl flex items-center gap-6 bg-white shadow-sm hover:shadow-md transition-shadow group">
                 <div className="flex items-center">
                    <input 
                      type="checkbox" 
                      checked={act.status === 'Completed'} 
                      onChange={() => handleToggleActivity(act.id)} 
                      className="w-5 h-5 rounded border-gray-300 text-primary focus:ring-primary cursor-pointer transition-all"
                    />
                 </div>
                 <div className="flex-1">
                   <h4 className="text-sm font-bold text-gray-900">{act.description}</h4>
                   {act.subDescription && <p className="text-xs text-gray-500 mt-0.5">{act.subDescription}</p>}
                   {act.status === 'Completed' && act.completedBy && (
                     <p className="text-[11px] text-gray-400 mt-1 italic">Completado por: {act.completedBy}</p>
                   )}
                 </div>
                 <div className="flex items-center gap-8">
                   <span className={`px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-wider text-white ${act.priority === 'High' ? 'bg-red-500' : (act.priority === 'Medium' ? 'bg-amber-500' : 'bg-gray-400')}`}>
                     {act.priority === 'High' ? 'Alta' : (act.priority === 'Medium' ? 'Media' : 'Baja')}
                   </span>
                   <div className="flex flex-col items-center min-w-[100px]">
                     <span className="text-sm font-bold text-gray-900">{act.dueDate}</span>
                     {act.status === 'Completed' && (
                       <span className="px-3 py-0.5 bg-green-100 text-green-700 text-[10px] font-black rounded-full uppercase mt-1">Completado</span>
                     )}
                   </div>
                   <button onClick={() => handleOpenActivityModal(act)} className="p-2 text-gray-400 hover:text-gray-900 transition-colors">
                      <Edit3 className="w-4 h-4" />
                   </button>
                 </div>
              </div>
            )) : (
              <div className="text-center py-12 text-gray-400 italic text-sm">No hay actividades registradas.</div>
            )}
          </div>
        </div>
      </div>

      {/* SECCIÓN DE CONTESTACIONES - TÍTULO AGRANDADO Y FUNCIONALIDAD MULTI-ARCHIVO */}
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm flex flex-col overflow-hidden mt-8">
        <div className="p-8 border-b border-gray-100 flex justify-between items-center">
          <div className="flex items-center gap-4">
             <Send className="w-7 h-7 text-gray-400" />
             <h3 className="text-3xl font-black text-gray-900 tracking-tight">{t.contestationsTitle} ({contestations.length})</h3>
          </div>
          <button onClick={() => handleOpenContestationModal()} className="flex items-center gap-3 px-6 py-3 border border-secondary text-secondary font-bold text-sm rounded-xl hover:bg-secondary/5 transition-all active:scale-95 shadow-sm">
             <PlusCircle className="w-5 h-5" /> Ingresar Contestación
          </button>
        </div>
        <div className="p-8 space-y-10">
          {contestations.length > 0 ? contestations.map((c) => (
            <div key={c.id} className="relative pl-10 border-l-[6px] border-secondary/40 pb-4 group">
               <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
                  <div className="space-y-1">
                    <p className="text-[11px] font-black text-gray-900 flex items-center gap-2 uppercase tracking-widest opacity-60"><Calendar className="w-3.5 h-3.5" /> Fecha de Contestación</p>
                    <span className="text-base text-gray-800 font-bold">{displayDate(c.date)}</span>
                  </div>
                  <div className="space-y-2">
                    <p className="text-[11px] font-black text-gray-900 flex items-center gap-2 uppercase tracking-widest opacity-60"><Send className="w-3.5 h-3.5" /> Medio de Contacto</p>
                    <span className="inline-block px-4 py-1 bg-blue-50 text-blue-700 text-xs font-black rounded-full uppercase tracking-tighter">{c.contact_method}</span>
                  </div>
                  <div className="space-y-2">
                    <p className="text-[11px] font-black text-gray-900 flex items-center gap-2 uppercase tracking-widest opacity-60"><Paperclip className="w-3.5 h-3.5" /> Archivos ({c.files?.length || 0})</p>
                    <div className="space-y-2">
                       {c.files?.map(file => (
                         <div key={file.id} className="flex items-center justify-between gap-3 bg-gray-50 p-2 rounded-lg border border-gray-100">
                           <button onClick={() => downloadFile(file)} className="text-xs text-blue-600 font-bold hover:underline truncate flex items-center gap-2 max-w-[180px]">
                             <FileText className="w-3 h-3" /> {file.name}
                           </button>
                           <div className="flex items-center gap-1">
                             <button onClick={() => downloadFile(file)} className="p-1 text-gray-400 hover:text-primary transition-colors" title="Descargar"><Download className="w-3.5 h-3.5" /></button>
                           </div>
                         </div>
                       ))}
                       {(!c.files || c.files.length === 0) && <span className="text-xs text-gray-400 italic">Sin archivos</span>}
                    </div>
                  </div>
               </div>
               
               <div className="mt-6 space-y-3">
                  <p className="text-sm leading-relaxed"><span className="font-black text-gray-900 uppercase text-[10px] tracking-widest opacity-40 block mb-1">Autoridad Destinataria</span> <span className="text-gray-700 font-medium">{c.authority}</span></p>
                  <p className="text-sm leading-relaxed"><span className="font-black text-gray-900 uppercase text-[10px] tracking-widest opacity-40 block mb-1">Notas</span> <span className="text-gray-700">{c.notes}</span></p>
               </div>

               <div className="mt-8 flex items-center justify-between border-t border-gray-50 pt-4">
                  <div className="flex items-center gap-2 text-gray-400">
                    <UserIcon className="w-3.5 h-3.5" />
                    <span className="text-[10px] font-bold uppercase tracking-tighter">Registrado por {c.registered_by} el {c.registration_date}</span>
                    {c.lastEditedAt && <span className="text-[10px] font-bold text-primary ml-2">• Editado por {c.lastEditedBy} el {c.lastEditedAt}</span>}
                  </div>
                  <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => handleOpenContestationModal(c)} className="flex items-center gap-1.5 px-3 py-1.5 text-gray-500 hover:text-primary hover:bg-blue-50 rounded-lg text-xs font-bold transition-all"><Edit3 className="w-3.5 h-3.5" /> Editar</button>
                    <button onClick={() => handleDeleteContestation(c.id)} className="flex items-center gap-1.5 px-3 py-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg text-xs font-bold transition-all"><Trash2 className="w-3.5 h-3.5" /> Eliminar</button>
                  </div>
               </div>
            </div>
          )) : (
            <div className="text-center py-16 bg-gray-50/30 rounded-2xl border-2 border-dashed border-gray-100">
              <Send className="w-12 h-12 text-gray-200 mx-auto mb-4" />
              <p className="text-gray-400 font-medium text-sm">No hay contestaciones registradas para este trámite.</p>
            </div>
          )}
        </div>
      </div>

      {/* MODAL DE ACTIVIDAD (EDICIÓN FUNCIONAL) */}
      {showActivityModal && (
        <div className="fixed inset-0 z-[100] bg-black/60 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="p-8 space-y-6">
              <h3 className="text-lg font-bold text-gray-900 border-b pb-4">
                {editingActivityId ? 'Editar Actividad' : 'Agregar Actividad'}
              </h3>
              <div>
                <label className="text-sm font-semibold text-gray-900 mb-2 block">Título</label>
                <input 
                  type="text" 
                  className="w-full p-3 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary/20 transition-all font-medium" 
                  value={newActivity.title} 
                  onChange={e => setNewActivity({...newActivity, title: e.target.value})}
                  placeholder="Ej: Contestar Providencia"
                />
              </div>
              <div>
                <label className="text-sm font-semibold text-gray-900 mb-2 block">Descripción</label>
                <textarea 
                  className="w-full p-3 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary/20 transition-all min-h-[100px]" 
                  rows={4} 
                  value={newActivity.description} 
                  onChange={e => setNewActivity({...newActivity, description: e.target.value})}
                  placeholder="Detalle de la actividad..."
                />
              </div>
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="text-sm font-semibold text-gray-900 mb-2 block">Prioridad</label>
                  <select 
                    className="w-full p-3 border border-gray-200 rounded-xl text-sm bg-white outline-none focus:ring-2 focus:ring-primary/20 transition-all font-medium" 
                    value={newActivity.priority} 
                    onChange={e => setNewActivity({...newActivity, priority: e.target.value as any})}
                  >
                    <option value="High">Alta</option>
                    <option value="Medium">Media</option>
                    <option value="Low">Baja</option>
                  </select>
                </div>
                <div>
                  <label className="text-sm font-semibold text-gray-900 mb-2 block">Fecha Vencimiento</label>
                  <input 
                    type="date" 
                    className="w-full p-3 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary/20 transition-all font-medium" 
                    value={newActivity.dueDate} 
                    onChange={e => setNewActivity({...newActivity, dueDate: e.target.value})} 
                  />
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-4 border-t border-gray-50">
                <button onClick={() => setShowActivityModal(false)} className="px-6 py-2.5 bg-gray-50 text-gray-900 font-bold rounded-xl text-sm transition-all hover:bg-gray-100 active:scale-95">{t.modalCancel}</button>
                <button onClick={handleSaveActivity} className="px-8 py-2.5 bg-primary text-white font-bold rounded-xl text-sm shadow-lg shadow-blue-100 transition-all hover:bg-blue-600 active:scale-95">{t.modalSave}</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DE INGRESO DE CONTESTACIÓN (MULTIFILE) */}
      {showContestationModal && (
        <div className="fixed inset-0 z-[100] bg-black/60 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-3xl w-full max-w-xl overflow-hidden shadow-2xl animate-in zoom-in-95">
            <div className="p-8 space-y-6">
              <div className="flex justify-between items-center border-b border-gray-100 pb-4">
                <h3 className="text-2xl font-black text-gray-900 tracking-tight">
                  {editingContestationId ? 'Editar Contestación' : 'Ingresar Contestación'}
                </h3>
                <button onClick={() => setShowContestationModal(false)} className="p-2 hover:bg-gray-100 rounded-full transition-colors"><X className="w-6 h-6 text-gray-400" /></button>
              </div>
              
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="text-xs font-black text-gray-500 mb-2 block uppercase tracking-widest">Fecha Contestación</label>
                  <input type="date" className="w-full p-3 border border-gray-200 rounded-xl text-sm font-bold shadow-sm outline-none focus:ring-2 focus:ring-secondary/20 transition-all" value={newContestation.date} onChange={e => setNewContestation({...newContestation, date: e.target.value})} />
                </div>
                <div>
                  <label className="text-xs font-black text-gray-500 mb-2 block uppercase tracking-widest">Medio de Contacto</label>
                  <select className="w-full p-3 border border-gray-200 rounded-xl text-sm bg-white font-bold shadow-sm outline-none focus:ring-2 focus:ring-secondary/20 transition-all" value={newContestation.contact_method} onChange={e => setNewContestation({...newContestation, contact_method: e.target.value})}>
                    <option value="Ventanilla Física">Ventanilla Física</option>
                    <option value="Correo Electrónico">Correo Electrónico</option>
                    <option value="Plataforma Digital">Plataforma Digital</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-black text-gray-500 mb-2 block uppercase tracking-widest">Autoridad Destinataria</label>
                <input type="text" className="w-full p-3 border border-gray-200 rounded-xl text-sm font-bold shadow-sm outline-none focus:ring-2 focus:ring-secondary/20 transition-all" value={newContestation.authority} onChange={e => setNewContestation({...newContestation, authority: e.target.value})} placeholder="Ej: SRI ZAMORA" />
              </div>

              <div>
                <label className="text-xs font-black text-gray-500 mb-2 block uppercase tracking-widest">Notas / Observaciones</label>
                <textarea rows={3} className="w-full p-4 border border-gray-200 rounded-2xl text-sm shadow-sm outline-none focus:ring-2 focus:ring-secondary/20 transition-all" value={newContestation.notes} onChange={e => setNewContestation({...newContestation, notes: e.target.value})} placeholder="Detalle de la entrega..."></textarea>
              </div>

              {/* CARGA DE ARCHIVOS MÚLTIPLES */}
              <div>
                <label className="text-xs font-black text-gray-500 mb-3 block uppercase tracking-widest">Archivos Adjuntos</label>
                <div className="space-y-3">
                  <div className="flex gap-3">
                    <input type="file" multiple className="hidden" ref={fileInputRef} onChange={handleFileSelect} />
                    <button onClick={() => fileInputRef.current?.click()} className="flex items-center gap-2 px-4 py-2.5 bg-white border-2 border-dashed border-gray-200 text-gray-500 hover:border-secondary hover:text-secondary rounded-xl text-xs font-bold transition-all w-full justify-center">
                      <PlusCircle className="w-4 h-4" /> Seleccionar archivos
                    </button>
                  </div>
                  <div className="max-h-[120px] overflow-y-auto space-y-2 pr-2 custom-scrollbar">
                    {selectedFiles.map(file => (
                      <div key={file.id} className="flex items-center justify-between p-2.5 bg-gray-50 border border-gray-100 rounded-xl group">
                        <div className="flex items-center gap-3 truncate">
                          <div className="bg-white p-1.5 rounded-lg border border-gray-100 shadow-sm"><FileText className="w-4 h-4 text-secondary" /></div>
                          <span className="text-[11px] font-bold text-gray-700 truncate max-w-[280px]">{file.name}</span>
                        </div>
                        <button onClick={() => handleRemoveFile(file.id)} className="p-1.5 text-gray-300 hover:text-red-500 transition-colors"><Trash2 className="w-4 h-4" /></button>
                      </div>
                    ))}
                    {selectedFiles.length === 0 && <p className="text-center py-4 text-[10px] text-gray-400 uppercase font-black tracking-widest opacity-50 italic">No hay archivos seleccionados</p>}
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-6 border-t border-gray-50">
                <button onClick={() => setShowContestationModal(false)} className="px-6 py-3 bg-gray-50 text-gray-900 font-bold rounded-xl text-sm hover:bg-gray-100 transition-all active:scale-95">{t.modalCancel}</button>
                <button onClick={handleSaveContestation} className="px-10 py-3 bg-secondary text-white font-bold rounded-xl text-sm shadow-xl shadow-green-100 hover:bg-green-600 transition-all active:scale-95">{t.modalSave}</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DocumentDetail;
