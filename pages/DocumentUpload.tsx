
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  Upload, Loader2, ArrowLeft, Plus, Trash2, 
  FileText, FileArchive, File as FileIcon,
  UserCheck, Edit3, FileSpreadsheet, Paperclip, X, Search, Link as LinkIcon,
  CalendarCheck,
  Sparkles,
  Languages
} from 'lucide-react';
import { analyzeDocumentText } from '../services/geminiService';
import { DayType, DocStatus, Document, ContestationFile } from '../types';
import { useNavigate, useParams } from 'react-router-dom';
import { saveDocument, updateDocument, isEcuadorBusinessDay, getDocuments, displayDate, CURRENT_USER } from '../constants';

const DocumentUpload: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditing = !!id;
  const attachmentInputRef = useRef<HTMLInputElement>(null);
  
  const [lang, setLang] = useState<'es' | 'cn'>(() => (localStorage.getItem('app_lang') as 'es' | 'cn') || 'es');
  
  useEffect(() => {
    const handleLangChange = () => {
      setLang((localStorage.getItem('app_lang') as 'es' | 'cn') || 'es');
    };
    window.addEventListener('languageChange', handleLangChange);
    return () => window.removeEventListener('languageChange', handleLangChange);
  }, []);

  const translations = {
    es: {
      newTitle: 'Nuevo Documento',
      editTitle: 'Editar Documento',
      analyzing: 'Analizando con IA...',
      uploadFile: 'Subir archivo principal (PDF/JPG)',
      company: 'COMPAÑÍA *',
      authority: 'AUTORIDAD *',
      department: 'DEPARTAMENTO',
      tramite: 'TRÁMITE # *',
      docTitle: 'TÍTULO DEL DOCUMENTO *',
      notification: 'FECHA NOTIFICACIÓN (Doc) *',
      uploadDate: 'FECHA CARGA (App) *',
      term: 'PLAZO',
      type: 'TIPO',
      due: 'VENCIMIENTO *',
      summaryEs: 'RESUMEN DEL DOCUMENTO RECIBIDO (Español)...',
      summaryCn: '文件摘要 (Chino)...',
      summaryEsLabel: 'RESUMEN DEL DOCUMENTO RECIBIDO *',
      summaryCnLabel: 'RESUMEN EN CHINO *',
      cancel: 'Cancelar',
      save: 'Guardar',
      update: 'Actualizar',
      alertRequired: 'Error: Los campos marcados con (*) son obligatorios para guardar.',
      auditCreated: 'Cargado por',
      auditEdited: 'Última edición',
      addAttachments: 'Añadir Adjuntos (XLS, DOC, PDF, ZIP)',
      noAttachments: 'No hay archivos adjuntos.',
      relatedDoc: 'RELACIONAR CON DOCUMENTO ANTERIOR',
      searchDoc: 'Buscar trámite anterior...'
    },
    cn: {
      newTitle: '新文档',
      editTitle: '编辑文档',
      analyzing: '正在进行人工智能分析...',
      uploadFile: '上传主文件 (PDF/JPG)',
      company: '公司 *',
      authority: '机构 *',
      department: '部门',
      tramite: '程序编号 *',
      docTitle: '文档标题 *',
      notification: '通知日期 *',
      uploadDate: '上传日期 *',
      term: '期限',
      type: '类型',
      due: '到期日期 *',
      summaryEs: '西班牙语摘要...',
      summaryCn: '中文摘要...',
      summaryEsLabel: '收到文件摘要 *',
      summaryCnLabel: '中文摘要 *',
      cancel: '取消',
      save: '保存',
      update: '更新',
      alertRequired: '错误：带 (*) 的字段是必填项。',
      auditCreated: '上传者',
      auditEdited: '最后编辑',
      addAttachments: '添加附件 (XLS, DOC, PDF, ZIP)',
      noAttachments: '没有附件。',
      relatedDoc: '关联之前的文档',
      searchDoc: '搜索之前的程序...'
    }
  };

  const t = translations[lang];

  const [file, setFile] = useState<File | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [company, setCompany] = useState('ECSA');
  const [authority, setAuthority] = useState('');
  const [department, setDepartment] = useState('');
  const [trarniteNumber, setTrarniteNumber] = useState('');
  const [title, setTitle] = useState('');
  const [relatedDocSearch, setRelatedDocSearch] = useState(''); 
  const [attachments, setAttachments] = useState<ContestationFile[]>([]);
  const [summaryEs, setSummaryEs] = useState('');
  const [summaryCn, setSummaryCn] = useState('');
  const [notificationDate, setNotificationDate] = useState(new Date().toISOString().split('T')[0]);
  const [createdAtDate, setCreatedAtDate] = useState(new Date().toISOString().split('T')[0]);
  const [daysLimit, setDaysLimit] = useState(10);
  const [dayType, setDayType] = useState<DayType>(DayType.BUSINESS);
  const [dueDate, setDueDate] = useState('');
  
  const [auditInfo, setAuditInfo] = useState<{
    createdBy?: string;
    createdAt?: string;
    lastEditedBy?: string;
    lastEditedAt?: string;
  }>({});

  const allPreviousDocs = useMemo(() => getDocuments(), []);

  useEffect(() => {
    if (isEditing) {
      const existingDoc = allPreviousDocs.find(d => d.id === id);
      if (existingDoc) {
        setCompany(existingDoc.company);
        setAuthority(existingDoc.authority);
        setDepartment(existingDoc.department || '');
        setTrarniteNumber(existingDoc.trarniteNumber);
        setTitle(existingDoc.title);
        
        if (existingDoc.relatedDoc) {
          const rel = allPreviousDocs.find(d => d.id === existingDoc.relatedDoc);
          setRelatedDocSearch(rel ? rel.title : '');
        }

        setNotificationDate(existingDoc.notificationDate);
        setCreatedAtDate(existingDoc.createdAt || new Date().toISOString().split('T')[0]);
        setDaysLimit(existingDoc.daysLimit);
        setDayType(existingDoc.dayType);
        setSummaryEs(existingDoc.summaryEs);
        setSummaryCn(existingDoc.summaryCn);
        setAttachments(existingDoc.attachments || []);
        setAuditInfo({
            createdBy: existingDoc.createdBy,
            createdAt: existingDoc.createdAt,
            lastEditedBy: existingDoc.lastEditedBy,
            lastEditedAt: existingDoc.lastEditedAt
        });
      }
    }
  }, [id, isEditing, allPreviousDocs]);

  useEffect(() => {
    if (!notificationDate) return;
    const [year, month, day] = notificationDate.split('-').map(Number);
    const date = new Date(year, month - 1, day, 12, 0, 0);
    
    if (dayType === DayType.BUSINESS) {
        let addedDays = 0;
        let tempDate = new Date(date);
        while (addedDays < daysLimit) {
            tempDate.setDate(tempDate.getDate() + 1);
            if (isEcuadorBusinessDay(tempDate)) addedDays++;
        }
        setDueDate(tempDate.toISOString().split('T')[0]);
    } else {
        const tempDate = new Date(date);
        tempDate.setDate(tempDate.getDate() + daysLimit);
        setDueDate(tempDate.toISOString().split('T')[0]);
    }
  }, [notificationDate, daysLimit, dayType]);

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve((reader.result as string).split(',')[1]);
      reader.onerror = reject;
    });
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      setFile(selectedFile);
      analyzeFile(selectedFile);
    }
  };

  const analyzeFile = async (selectedFile: File) => {
    setIsAnalyzing(true);
    try {
        const base64Data = await fileToBase64(selectedFile);
        const result = await analyzeDocumentText(base64Data, selectedFile.type);
        setAuthority(result.authority || '');
        setDepartment(result.department || '');
        setTrarniteNumber(result.trarniteNumber || '');
        setTitle(result.title || selectedFile.name);
        if (result.notificationDate) setNotificationDate(result.notificationDate);
        if (result.daysLimit) setDaysLimit(result.daysLimit);
        setSummaryEs(result.summaryEs || '');
        setSummaryCn(result.summaryCn || '');
    } catch (error) { console.error(error); } finally { setIsAnalyzing(false); }
  };

  const handleSubmit = () => {
    if (!company || !authority.trim() || !trarniteNumber.trim() || !title.trim() || !notificationDate || !summaryEs.trim() || !summaryCn.trim()) {
      return alert(t.alertRequired);
    }

    let finalRelatedId = '';
    if (relatedDocSearch.trim()) {
      const found = allPreviousDocs.find(d => d.title === relatedDocSearch.trim());
      if (found) finalRelatedId = found.id;
    }

    const existingDoc = isEditing ? allPreviousDocs.find(d => d.id === id) : null;
    const docData: Document = {
        id: isEditing ? (id as string) : 'd' + Date.now(),
        title, trarniteNumber, company, authority, department,
        notificationDate, daysLimit, dayType, dueDate,
        status: isEditing ? (existingDoc?.status || DocStatus.INITIALIZED) : DocStatus.INITIALIZED,
        summaryEs, summaryCn, relatedDoc: finalRelatedId,
        fileName: file?.name || existingDoc?.fileName || 'document.pdf',
        createdBy: isEditing ? (existingDoc?.createdBy || CURRENT_USER.name) : CURRENT_USER.name,
        createdAt: createdAtDate,
        lastEditedBy: isEditing ? CURRENT_USER.name : undefined,
        lastEditedAt: isEditing ? new Date().toISOString().split('T')[0] : undefined,
        attachments,
        contestations: existingDoc?.contestations || []
    };
    if (isEditing) updateDocument(docData);
    else saveDocument(docData);
    navigate(`/documents/${docData.id}`);
  };

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="flex items-center gap-4 mb-8">
          <button onClick={() => navigate('/documents')} className="p-2 hover:bg-gray-100 rounded-full transition-colors"><ArrowLeft className="w-6 h-6 text-gray-500" /></button>
          <h1 className="text-2xl font-bold text-gray-900">{isEditing ? t.editTitle : t.newTitle}</h1>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden mb-10">
        {!isEditing && (
          <div className="p-8 border-b border-gray-200 bg-gray-50 text-center">
            <input type="file" id="fileUpload" className="hidden" accept="application/pdf,image/*" onChange={handleFileChange} />
            <label htmlFor="fileUpload" className="cursor-pointer flex flex-col items-center border-2 border-dashed rounded-xl p-8 hover:border-primary transition-all">
                {isAnalyzing ? <Loader2 className="w-12 h-12 text-primary animate-spin mb-4" /> : <Upload className="w-12 h-12 text-gray-400 mb-4" />}
                <span className="text-lg font-medium text-gray-700">{isAnalyzing ? t.analyzing : file ? file.name : t.uploadFile}</span>
            </label>
          </div>
        )}

        <div className="p-8 space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <label className="block">
                    <span className="text-xs font-bold text-gray-500 mb-2 block uppercase tracking-wider">{t.company}</span>
                    <select value={company} onChange={(e) => setCompany(e.target.value)} className="w-full rounded-lg border-gray-200 p-3 border shadow-sm outline-none text-sm bg-white">
                        <option value="ECSA">ECSA</option><option value="EXSA">EXSA</option><option value="HCSA">HCSA</option><option value="PCSA">PCSA</option><option value="MMSA">MMSA</option>
                    </select>
                </label>
                <label className="block">
                  <span className="text-xs font-bold text-gray-500 mb-2 block uppercase tracking-wider">{t.docTitle}</span>
                  <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} className="w-full rounded-lg border-gray-200 p-3 border shadow-sm outline-none text-sm" />
                </label>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <label className="block">
                    <span className="text-xs font-bold text-gray-500 mb-2 block uppercase tracking-wider">{t.authority}</span>
                    <input type="text" value={authority} onChange={(e) => setAuthority(e.target.value)} className="w-full rounded-lg border-gray-200 p-3 border shadow-sm outline-none text-sm" placeholder="Ej: SRI" />
                </label>
                <label className="block">
                    <span className="text-xs font-bold text-gray-500 mb-2 block uppercase tracking-wider">{t.department}</span>
                    <input type="text" value={department} onChange={(e) => setDepartment(e.target.value)} className="w-full rounded-lg border-gray-200 p-3 border shadow-sm outline-none text-sm" placeholder="Ej: Dirección Nacional..." />
                </label>
                <label className="block">
                    <span className="text-xs font-bold text-gray-500 mb-2 block uppercase tracking-wider">{t.tramite}</span>
                    <input type="text" value={trarniteNumber} onChange={(e) => setTrarniteNumber(e.target.value)} className="w-full rounded-lg border-gray-200 p-3 border shadow-sm outline-none text-sm" />
                </label>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <label className="block relative">
                  <span className="text-xs font-bold text-gray-500 mb-2 block uppercase tracking-wider">{t.relatedDoc}</span>
                  <div className="relative">
                    <input type="text" list="prevDocs" value={relatedDocSearch} onChange={(e) => setRelatedDocSearch(e.target.value)} placeholder={t.searchDoc} className="w-full rounded-lg border-gray-200 p-3 pl-10 border shadow-sm outline-none text-sm" />
                    <LinkIcon className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                    <datalist id="prevDocs">
                      {allPreviousDocs.filter(d => d.id !== id).map(doc => (
                        <option key={doc.id} value={doc.title}>{doc.title} ({doc.trarniteNumber})</option>
                      ))}
                    </datalist>
                  </div>
              </label>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-end">
                <label className="md:col-span-1">
                    <span className="text-[10px] font-bold text-gray-400 uppercase block mb-2">{t.notification}</span>
                    <input type="date" value={notificationDate} onChange={(e) => setNotificationDate(e.target.value)} className="w-full rounded-lg border-gray-200 p-2.5 border text-sm" />
                </label>
                <div className="md:col-span-1">
                    <span className="text-[10px] font-bold text-gray-400 uppercase block mb-2">{t.uploadDate}</span>
                    <div className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-500 flex items-center gap-2">
                        <CalendarCheck className="w-4 h-4" /> {displayDate(createdAtDate)}
                    </div>
                </div>
                <label className="md:col-span-1">
                    <span className="text-[10px] font-bold text-gray-400 uppercase block mb-2">{t.term}</span>
                    <input type="number" value={daysLimit} onChange={(e) => setDaysLimit(parseInt(e.target.value) || 0)} className="w-full rounded-lg border-gray-200 p-2.5 border text-sm text-center" />
                </label>
                <label className="md:col-span-1">
                    <span className="text-[10px] font-bold text-gray-400 uppercase block mb-2">{t.type}</span>
                    <select value={dayType} onChange={(e) => setDayType(e.target.value as DayType)} className="w-full rounded-lg border-gray-200 p-2.5 border text-sm bg-white">
                        <option value={DayType.BUSINESS}>{lang === 'es' ? 'Días hábiles' : '工作日'}</option>
                        <option value={DayType.CALENDAR}>{lang === 'es' ? 'Días calendario' : '自然日'}</option>
                    </select>
                </label>
                <div className="md:col-span-1">
                    <div className="text-[10px] font-bold text-gray-400 uppercase block mb-2">{t.due}</div>
                    <div className="w-full py-2.5 bg-primary text-white rounded-lg text-center font-bold text-lg shadow-sm">{displayDate(dueDate)}</div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-4">
                <div className="space-y-2">
                  <span className="text-xs font-bold text-gray-400 uppercase flex items-center gap-2"><Sparkles className="w-4 h-4 text-primary" /> {t.summaryEsLabel}</span>
                  <textarea rows={12} value={summaryEs} onChange={(e) => setSummaryEs(e.target.value)} className="w-full rounded-xl border-gray-200 p-4 border text-sm shadow-sm outline-none font-sans leading-relaxed" />
                </div>
                <div className="space-y-2">
                  <span className="text-xs font-bold text-gray-400 uppercase flex items-center gap-2"><Languages className="w-4 h-4 text-indigo-400" /> {t.summaryCnLabel}</span>
                  <textarea rows={12} value={summaryCn} onChange={(e) => setSummaryCn(e.target.value)} className="w-full rounded-xl border-gray-200 p-4 border text-sm shadow-sm outline-none font-sans leading-relaxed italic" />
                </div>
            </div>
        </div>

        <div className="bg-gray-50 px-8 py-6 border-t border-gray-200 flex justify-end gap-4">
            <button className="text-gray-500 font-medium" onClick={() => navigate('/documents')}>{t.cancel}</button>
            <button onClick={handleSubmit} className="bg-primary text-white px-10 py-2.5 rounded-xl font-bold hover:bg-blue-700 shadow-lg">{isEditing ? t.update : t.save}</button>
        </div>
      </div>
    </div>
  );
};

export default DocumentUpload;
