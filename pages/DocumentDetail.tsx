
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
  X, FilePlus, Eye, FileArchive
} from 'lucide-react';

const DocumentDetail: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const documents = getDocuments();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [lang, setLang] = useState<'es' | 'cn'>(() => (localStorage.getItem('app_lang') as 'es' | 'cn') || 'es');
  
  useEffect(() => {
    const handleLangChange = () => setLang((localStorage.getItem('app_lang') as 'es' | 'cn') || 'es');
    window.addEventListener('languageChange', handleLangChange);
    return () => window.removeEventListener('languageChange', handleLangChange);
  }, []);

  const initialDoc = useMemo(() => documents.find(d => d.id === id) || documents[0], [id, documents]);
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

  const canEdit = useMemo(() => doc.status === DocStatus.OVERDUE ? CURRENT_USER.role === UserRole.ADMIN : true, [doc.status]);

  const syncDocumentStatus = (currentActivities: Activity[]) => {
    const allCompleted = currentActivities.length > 0 && currentActivities.every(a => a.status === 'Completed');
    const anyStarted = currentActivities.some(a => a.status === 'Completed');
    let newStatus = allCompleted ? DocStatus.COMPLETED : (anyStarted || currentActivities.length > 0 ? DocStatus.IN_PROGRESS : DocStatus.INITIALIZED);
    if (doc.status !== newStatus) {
      const updatedDoc = { ...doc, status: newStatus };
      setDoc(updatedDoc);
      updateDocument(updatedDoc);
    }
  };

  const handleToggleActivity = (actId: string) => {
    const updated = activitiesList.map(act => act.id === actId ? { ...act, status: (act.status === 'Completed' ? 'Pending' : 'Completed') as any, completedBy: act.status === 'Completed' ? undefined : CURRENT_USER.name, completedAt: act.status === 'Completed' ? undefined : new Date().toISOString().split('T')[0] } : act);
    setActivitiesList(updated);
    localStorage.setItem(`activities_${id}`, JSON.stringify(updated));
    syncDocumentStatus(updated);
  };

  const [newActivity, setNewActivity] = useState({ description: '', priority: 'Medium' as 'High' | 'Medium' | 'Low', dueDate: new Date().toISOString().split('T')[0] });

  const handleSaveActivity = () => {
    if (!newActivity.description.trim()) return;
    const act: Activity = { id: 'act_' + Date.now(), docId: doc.id, description: newActivity.description, status: 'Pending', dueDate: newActivity.dueDate, priority: newActivity.priority };
    const updated = [...activitiesList, act];
    setActivitiesList(updated);
    localStorage.setItem(`activities_${id}`, JSON.stringify(updated));
    syncDocumentStatus(updated);
    setShowActivityModal(false);
    setNewActivity({ description: '', priority: 'Medium', dueDate: new Date().toISOString().split('T')[0] });
  };

  const [newConData, setNewConData] = useState({ notes: '', date: new Date().toISOString().split('T')[0], contact_method: 'Ventanilla Física', files: [] as ContestationFile[] });

  const handleSaveContestation = () => {
    if (!newConData.notes.trim()) return;
    let updatedContestations = [...(doc.contestations || [])];
    if (editingContestationId) {
      updatedContestations = updatedContestations.map(c => c.id === editingContestationId ? { ...c, ...newConData, lastEditedBy: CURRENT_USER.name, lastEditedAt: new Date().toISOString().split('T')[0] } : c);
    } else {
      updatedContestations.push({ id: 'con_' + Date.now(), ...newConData, authority: doc.authority, registered_by: CURRENT_USER.name, registration_date: new Date().toISOString().split('T')[0] });
    }
    const updatedDoc = { ...doc, contestations: updatedContestations };
    setDoc(updatedDoc);
    updateDocument(updatedDoc);
    setShowContestationModal(false);
    setEditingContestationId(null);
  };

  const handleAnalyzeWithAI = async () => {
    setIsAnalyzing(true);
    try {
      const result = await analyzeDocumentText(`Trámite: ${doc.title}\nID: ${doc.trarniteNumber}\nEmpresa: ${doc.company}\nAutoridad: ${doc.authority}`);
      const updatedDoc = { ...doc, summaryEs: result.summaryEs || doc.summaryEs, summaryCn: result.summaryCn || doc.summaryCn, lastEditedBy: 'IA Assistant', lastEditedAt: new Date().toISOString().split('T')[0] };
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
    langCn: lang === 'es' ? '中文摘要' : '中文摘要',
    modalCancel: lang === 'es' ? 'Cancelar' : '取消',
    modalSave: lang === 'es' ? 'Guardar' : '保存'
  };

  return (
    <div className="p-8 max-w-[1600px] mx-auto space-y-6">
      <div className="flex items-center gap-4 mb-2">
        <button onClick={() => navigate('/documents')} className="p-2 bg-white border border-gray-200 rounded-lg shadow-sm"><ArrowLeft className="w-4 h-4 text-gray-600" /></button>
        <div>
          <h2 className="text-xl font-bold text-gray-900">{t.welcome}{CURRENT_USER.name}</h2>
          <p className="text-sm text-gray-500 font-medium">{t.manageSubtitle}</p>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm flex items-center gap-8">
        <div className="flex-1">
          <h1 className="text-2xl font-black text-gray-900 uppercase">{doc.title}</h1>
        </div>
        <div className="flex items-center gap-3 border-l border-gray-100 pl-10">
           <button onClick={() => navigate(`/upload/${doc.id}`)} className={`flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 text-gray-700 text-[11px] font-bold rounded-lg hover:bg-gray-50 ${!canEdit ? 'opacity-50' : ''}`}><Edit3 className="w-3.5 h-3.5 text-primary" /> {t.editBtn}</button>
           <span className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-wider ${getStatusBadge(doc.status)}`}>{lang === 'es' ? doc.status : '已完成'}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-6 flex flex-col">
            <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2 uppercase"><Building2 className="w-5 h-5 text-gray-300" /> {t.infoGeneral}</h3>
            <div className="grid grid-cols-2 gap-6 flex-1 text-sm font-bold text-gray-800">
              <div><p className="text-[11px] text-gray-400 uppercase mb-1">{lang === 'es' ? 'Empresa' : '公司'}</p>{doc.company}</div>
              <div><p className="text-[11px] text-gray-400 uppercase mb-1">{lang === 'es' ? 'Autoridad' : '机构'}</p>{doc.authority} - {doc.department}</div>
              <div className="col-span-2 pt-4">TRÁMITE: <span className="font-mono">#{doc.trarniteNumber}</span></div>
            </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2 uppercase"><Clock className="w-5 h-5 text-gray-300" /> {t.infoPlazos}</h3>
            <div className="grid grid-cols-2 gap-6 mb-8">
              <div><p className="text-[11px] text-gray-400 uppercase mb-1">PLAZO</p>{doc.daysLimit} {doc.dayType}</div>
              <div><p className="text-[11px] text-gray-400 uppercase mb-1">{t.vencimiento}</p><span className="text-lg font-black text-primary uppercase">{displayDate(doc.dueDate)}</span></div>
            </div>
            <div className="flex gap-10 pt-4 border-t border-gray-50 text-sm font-bold">
              <div><p className="text-[10px] text-gray-400 uppercase">{t.notifDate}</p>{displayDate(doc.notificationDate)}</div>
              <div><p className="text-[10px] text-red-400 uppercase">{t.dueDate}</p><span className="text-red-600">{displayDate(doc.dueDate)}</span></div>
            </div>
        </div>
      </div>

      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2 uppercase tracking-widest"><Sparkles className="w-5 h-5 text-primary" /> {t.summaryTitle}</h3>
          <button onClick={handleAnalyzeWithAI} disabled={isAnalyzing} className="flex items-center gap-2 px-4 py-2 bg-primary text-white text-xs font-bold rounded-lg disabled:bg-gray-400">
            {isAnalyzing ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />} {isAnalyzing ? t.processing : t.reanalyze}
          </button>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="bg-white border border-gray-200 rounded-xl p-8 shadow-sm">
            <h4 className="text-xs font-black text-primary mb-6 flex items-center gap-2 border-b border-gray-50 pb-3 uppercase">{t.langEs}</h4>
            <div className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap min-h-[400px]">{doc.summaryEs}</div>
          </div>
          <div className="bg-white border border-gray-200 rounded-xl p-8 shadow-sm">
            <h4 className="text-xs font-black text-indigo-600 mb-6 flex items-center gap-2 border-b border-gray-50 pb-3 uppercase">{t.langCn}</h4>
            <div className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap italic min-h-[400px]">{doc.summaryCn}</div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-8 mt-8">
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm flex flex-col">
          <div className="p-5 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
            <h3 className="text-lg font-bold text-gray-900">{t.activitiesTitle}</h3>
            <button onClick={() => setShowActivityModal(true)} className="p-2 bg-primary text-white rounded-lg shadow-sm"><Plus className="w-4 h-4" /></button>
          </div>
          <div className="p-6 space-y-4">
            {activitiesList.map(act => (
              <div key={act.id} className="p-4 border border-gray-100 rounded-xl hover:bg-gray-50 flex items-center gap-4 transition-colors">
                 <button onClick={() => handleToggleActivity(act.id)}>{act.status === 'Completed' ? <CheckSquare className="w-6 h-6 text-primary" /> : <Square className="w-6 h-6 text-gray-300" />}</button>
                 <div className="flex-1">
                   <h4 className={`text-sm font-bold ${act.status === 'Completed' ? 'text-gray-400 line-through' : 'text-gray-900'}`}>{act.description}</h4>
                   <p className="text-[10px] text-gray-400 mt-0.5">Vence: {displayDate(act.dueDate)}</p>
                 </div>
                 <span className={`px-2 py-0.5 rounded text-[10px] font-bold text-white uppercase ${act.priority === 'High' ? 'bg-red-500' : 'bg-gray-400'}`}>{act.priority}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {showActivityModal && (
        <div className="fixed inset-0 z-[100] bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-2xl">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center"><h3 className="font-bold">Nueva Actividad</h3><button onClick={() => setShowActivityModal(false)}><X className="w-5 h-5 text-gray-400" /></button></div>
            <div className="p-6 space-y-4">
              <textarea className="w-full p-3 border rounded-xl text-sm outline-none" rows={3} value={newActivity.description} onChange={e => setNewActivity({...newActivity, description: e.target.value})} />
              <div className="grid grid-cols-2 gap-4">
                <select className="p-2.5 border rounded-lg text-sm bg-white" value={newActivity.priority} onChange={e => setNewActivity({...newActivity, priority: e.target.value as any})}><option value="High">Alta</option><option value="Medium">Media</option><option value="Low">Baja</option></select>
                <input type="date" className="p-2.5 border rounded-lg text-sm" value={newActivity.dueDate} onChange={e => setNewActivity({...newActivity, dueDate: e.target.value})} />
              </div>
            </div>
            <div className="p-6 bg-gray-50 flex justify-end gap-3"><button onClick={() => setShowActivityModal(false)} className="text-sm font-medium text-gray-500">{t.modalCancel}</button><button onClick={handleSaveActivity} className="px-6 py-2 bg-primary text-white rounded-xl font-bold shadow-md">{t.modalSave}</button></div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DocumentDetail;
