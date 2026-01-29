
import React, { useState, useEffect, useRef, useMemo } from 'react';
// Added missing Sparkles and Languages imports
import { 
  Upload, Loader2, ArrowLeft, Plus, Trash2, 
  FileText, FileArchive, File as FileIcon,
  UserCheck, Edit3, FileSpreadsheet, Paperclip, X, Search, Link as LinkIcon,
  CalendarDays,
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
      company: 'Compañía',
      authority: 'Autoridad *',
      tramite: 'Trámite # *',
      docTitle: 'Título del Documento *',
      notification: 'FECHA NOTIFICACIÓN (Doc)',
      uploadDate: 'FECHA CARGA (App)',
      term: 'PLAZO',
      type: 'TIPO',
      due: 'VENCIMIENTO',
      summaryEs: 'RESUMEN DEL DOCUMENTO RECIBIDO (Español)...',
      summaryCn: '文件摘要 (Chino)...',
      cancel: 'Cancelar',
      save: 'Guardar',
      update: 'Actualizar',
      alertRequired: 'Error: Los campos marcados con (*) son obligatorios para guardar.',
      auditCreated: 'Cargado por',
      auditEdited: 'Última edición',
      addAttachments: 'Añadir Adjuntos (XLS, DOC, PDF, ZIP)',
      noAttachments: 'No hay archivos adjuntos.',
      relatedDoc: 'Relacionar con Documento Anterior',
      searchDoc: 'Buscar trámite anterior...'
    },
    cn: {
      newTitle: '新文档',
      editTitle: '编辑文档',
      analyzing: '正在进行人工智能分析...',
      uploadFile: '上传主文件 (PDF/JPG)',
      company: '公司',
      authority: '机构 *',
      tramite: '程序编号 *',
      docTitle: '文档标题 *',
      notification: '通知日期',
      uploadDate: '上传日期',
      term: '期限',
      type: '类型',
      due: '到期日期',
      summaryEs: '西班牙语摘要...',
      summaryCn: '中文摘要...',
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
  const [trarniteNumber, setTrarniteNumber] = useState('');
  const [title, setTitle] = useState('');
  const [relatedDocId, setRelatedDocId] = useState('');
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
        setTrarniteNumber(existingDoc.trarniteNumber);
        setTitle(existingDoc.title);
        setRelatedDocId(existingDoc.relatedDoc || '');
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
    // Inicia desde el mediodía para evitar problemas de zona horaria
    const date = new Date(year, month - 1, day, 12, 0, 0);
    
    if (dayType === DayType.BUSINESS) {
        let addedDays = 0;
        let tempDate = new Date(date);
        // El conteo inicia a partir del siguiente día de la notificación
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
      reader.onload = () => {
        const base64String = (reader.result as string).split(',')[1];
        resolve(base64String);
      };
      reader.onerror = error => reject(error);
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
        setTrarniteNumber(result.trarniteNumber || '');
        setTitle(result.title || selectedFile.name);
        
        if (result.notificationDate && result.notificationDate.length === 10) {
          setNotificationDate(result.notificationDate);
        }
        if (result.daysLimit !== undefined && !isNaN(result.daysLimit)) {
          setDaysLimit(result.daysLimit);
        }
        
        setSummaryEs(result.summaryEs || '');
        setSummaryCn(result.summaryCn || '');
    } catch (error: any) {
        console.error("Error al conectar con la IA:", error);
    } finally {
        setIsAnalyzing(false);
    }
  };

  const handleAddActivity = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files).map((f: File) => ({
        id: 'att_' + Math.random().toString(36).substr(2, 9),
        name: f.name
      }));
      setAttachments(prev => [...prev, ...newFiles]);
    }
  };

  const handleRemoveAttachment = (aid: string) => {
    setAttachments(prev => prev.filter(a => a.id !== aid));
  };

  const getFileIcon = (name: string) => {
    const ext = name.split('.').pop()?.toLowerCase();
    if (ext === 'xlsx' || ext === 'xls') return <FileSpreadsheet className="w-5 h-5 text-green-600" />;
    if (ext === 'pdf') return <FileIcon className="w-5 h-5 text-red-600" />;
    if (ext === 'zip') return <FileArchive className="w-5 h-5 text-orange-600" />;
    return <FileText className="w-5 h-5 text-blue-600" />;
  };

  const handleSubmit = () => {
    // Validación estricta de campos obligatorios
    if (!title.trim() || !trarniteNumber.trim() || !authority.trim()) {
      return alert(t.alertRequired);
    }

    const existingDoc = isEditing ? allPreviousDocs.find(d => d.id === id) : null;
    const docData: Document = {
        id: isEditing ? (id as string) : 'd' + Date.now(),
        title,
        trarniteNumber,
        company,
        authority,
        notificationDate,
        daysLimit,
        dayType,
        dueDate,
        status: isEditing ? (existingDoc?.status || DocStatus.INITIALIZED) : DocStatus.INITIALIZED,
        summaryEs,
        summaryCn,
        relatedDoc: relatedDocId,
        fileName: file?.name || existingDoc?.fileName || 'document.pdf',
        createdBy: isEditing ? (existingDoc?.createdBy || CURRENT_USER.name) : CURRENT_USER.name,
        createdAt: createdAtDate,
        lastEditedBy: isEditing ? CURRENT_USER.name : undefined,
        lastEditedAt: isEditing ? new Date().toISOString().split('T')[0] : undefined,
        attachments: attachments,
        contestations: existingDoc?.contestations || []
    };
    if (isEditing) updateDocument(docData);
    else saveDocument(docData);
    navigate(`/documents/${docData.id}`);
  };

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="flex items-center gap-4 mb-8">
          <button onClick={() => navigate('/documents')} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
              <ArrowLeft className="w-6 h-6 text-gray-500" />
          </button>
          <h1 className="text-2xl font-bold text-gray-900">{isEditing ? t.editTitle : t.newTitle}</h1>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden mb-10">
        {!isEditing && (
          <div className="p-8 border-b border-gray-200 bg-gray-50 text-center">
            <input type="file" id="fileUpload" className="hidden" accept="application/pdf,image/*" onChange={handleFileChange} />
            <label htmlFor="fileUpload" className="cursor-pointer flex flex-col items-center border-2 border-dashed rounded-xl p-8 hover:border-primary transition-all">
                {isAnalyzing ? <Loader2 className="w-12 h-12 text-primary animate-spin mb-4" /> : <Upload className="w-12 h-12 text-gray-400 mb-4" />}
                <span className="text-lg font-medium text-gray-700">{isAnalyzing ? t.analyzing : file ? file.name : t.uploadFile}</span>
                <p className="text-xs text-gray-400 mt-2 font-medium italic">La IA analizará el contenido del archivo y extraerá los plazos fácticos</p>
            </label>
          </div>
        )}

        <div className="p-8 space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <label className="block">
                    <span className="text-xs font-bold text-gray-500 mb-2 block uppercase tracking-wider">{t.company}</span>
                    <select value={company} onChange={(e) => setCompany(e.target.value)} className="w-full rounded-lg border-gray-200 p-3 border shadow-sm outline-none text-sm bg-white">
                        <option value="ECSA">ECSA</option>
                        <option value="EXSA">EXSA</option>
                        <option value="HCSA">HCSA</option>
                        <option value="PCSA">PCSA</option>
                        <option value="MMSA">MMSA</option>
                    </select>
                </label>
                <label className="block">
                    <span className="text-xs font-bold text-gray-500 mb-2 block uppercase tracking-wider">{t.authority}</span>
                    <input type="text" value={authority} onChange={(e) => setAuthority(e.target.value)} className="w-full rounded-lg border-gray-200 p-3 border shadow-sm outline-none text-sm" placeholder="Ej: SRI" />
                </label>
                <label className="block">
                    <span className="text-xs font-bold text-gray-500 mb-2 block uppercase tracking-wider">{t.tramite}</span>
                    <input type="text" value={trarniteNumber} onChange={(e) => setTrarniteNumber(e.target.value)} className="w-full rounded-lg border-gray-200 p-3 border shadow-sm outline-none text-sm" placeholder="Número de expediente" />
                </label>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <label className="block">
                  <span className="text-xs font-bold text-gray-500 mb-2 block uppercase tracking-wider">{t.docTitle}</span>
                  <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} className="w-full rounded-lg border-gray-200 p-3 border shadow-sm outline-none text-sm" />
              </label>

              <label className="block relative">
                  <span className="text-xs font-bold text-gray-500 mb-2 block uppercase tracking-wider">{t.relatedDoc}</span>
                  <div className="relative">
                    <input 
                      type="text" 
                      list="prevDocs"
                      value={relatedDocId} 
                      onChange={(e) => setRelatedDocId(e.target.value)} 
                      placeholder={t.searchDoc}
                      className="w-full rounded-lg border-gray-200 p-3 pl-10 border shadow-sm outline-none text-sm" 
                    />
                    <LinkIcon className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                    <datalist id="prevDocs">
                      {allPreviousDocs.filter(d => d.id !== id).map(doc => (
                        <option key={doc.id} value={doc.id}>{doc.trarniteNumber} - {doc.title}</option>
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
                  <span className="text-xs font-bold text-gray-400 uppercase flex items-center gap-2"><Sparkles className="w-4 h-4 text-primary" /> {lang === 'es' ? 'RESUMEN DEL DOCUMENTO RECIBIDO' : '文件摘要'}</span>
                  <textarea rows={12} value={summaryEs} onChange={(e) => setSummaryEs(e.target.value)} className="w-full rounded-xl border-gray-200 p-4 border text-sm shadow-sm outline-none font-sans leading-relaxed" placeholder={t.summaryEs} />
                </div>
                <div className="space-y-2">
                  <span className="text-xs font-bold text-gray-400 uppercase flex items-center gap-2"><Languages className="w-4 h-4 text-indigo-400" /> {lang === 'es' ? 'RESUMEN EN CHINO' : '中文摘要'}</span>
                  <textarea rows={12} value={summaryCn} onChange={(e) => setSummaryCn(e.target.value)} className="w-full rounded-xl border-gray-200 p-4 border text-sm shadow-sm outline-none font-sans leading-relaxed italic" placeholder={t.summaryCn} />
                </div>
            </div>

            <div className="border-t border-gray-100 pt-8">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2 uppercase tracking-wider">
                    <Paperclip className="w-4 h-4" /> {t.addAttachments}
                  </h3>
                  <input type="file" ref={attachmentInputRef} className="hidden" multiple onChange={handleAddActivity} />
                  <button onClick={() => attachmentInputRef.current?.click()} className="flex items-center gap-2 px-4 py-2 bg-gray-50 text-gray-700 text-xs font-bold rounded-lg hover:bg-gray-100 border border-gray-200 shadow-sm transition-all">
                    <Plus className="w-4 h-4" /> {lang === 'es' ? 'SUBIR ARCHIVOS' : '上传附件'}
                  </button>
                </div>
                
                <div className="bg-gray-50/50 rounded-xl p-4 border border-dashed border-gray-200">
                  {attachments.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                      {attachments.map((att) => (
                        <div key={att.id} className="bg-white p-3 rounded-lg border border-gray-100 shadow-sm flex items-center justify-between group">
                          <div className="flex items-center gap-3 overflow-hidden">
                            {getFileIcon(att.name)}
                            <span className="text-xs font-bold text-gray-700 truncate">{att.name}</span>
                          </div>
                          <button onClick={() => handleRemoveAttachment(att.id)} className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all opacity-0 group-hover:opacity-100">
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-6 text-gray-400 italic text-xs font-medium">{t.noAttachments}</div>
                  )}
                </div>
            </div>
        </div>

        {isEditing && auditInfo.createdBy && (
          <div className="bg-gray-50 px-8 py-3 border-t border-gray-100 flex items-center gap-4 text-[10px] text-gray-400 font-medium">
            <div className="flex items-center gap-1"><UserCheck className="w-3.5 h-3.5" /> {t.auditCreated}: {auditInfo.createdBy} ({displayDate(auditInfo.createdAt || '')})</div>
            {auditInfo.lastEditedBy && <div className="flex items-center gap-1 border-l border-gray-200 pl-4"><Edit3 className="w-3.5 h-3.5" /> {t.auditEdited}: {auditInfo.lastEditedBy} ({displayDate(auditInfo.lastEditedAt || '')})</div>}
          </div>
        )}

        <div className="bg-gray-50 px-8 py-6 border-t border-gray-200 flex justify-end gap-4">
            <button className="text-gray-500 font-medium" onClick={() => navigate('/documents')}>{t.cancel}</button>
            <button onClick={handleSubmit} className="bg-primary text-white px-10 py-2.5 rounded-xl font-bold hover:bg-blue-700 shadow-lg">{isEditing ? t.update : t.save}</button>
        </div>
      </div>
    </div>
  );
};

export default DocumentUpload;
