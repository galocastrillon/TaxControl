
import React, { useMemo, useState, useEffect } from 'react';
import { AlertTriangle, Clock, CheckCircle, Calendar, ArrowRight, FileText } from 'lucide-react';
import { getDocuments, MOCK_ACTIVITIES, displayDate } from '../constants';
import { DocStatus, Activity } from '../types';
import { Link } from 'react-router-dom';

const Alerts: React.FC = () => {
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
      title: 'Centro de Alertas',
      subtitle: 'Gestiona tus notificaciones y mantente al día.',
      critTitle: 'Atención Requerida (Crítico)',
      noCrit: 'No tienes alertas críticas pendientes.',
      docOverdue: 'Documento Vencido',
      actPrior: 'Actividad Prioritaria',
      atrasada: 'Atrasada',
      deadline: 'Fecha Límite',
      complete: 'COMPLETAR',
      prox7Title: 'Próximos Vencimientos (7 días)',
      noProx: 'No hay vencimientos cercanos.',
      vence: 'Vence',
      markComplete: 'Marcar completado',
      othersTitle: 'Otras Actividades Pendientes',
      noOthers: 'No hay otras actividades pendientes.',
      colDesc: 'Descripción',
      colDate: 'Fecha',
      colPrior: 'Prioridad',
      colAction: 'Acción',
      low: 'Baja',
      medium: 'Media',
      viewDetail: 'Ver detalle'
    },
    cn: {
      title: '警报中心',
      subtitle: '管理您的通知并保持最新状态。',
      critTitle: '需要关注 (关键)',
      noCrit: '您没有待处理的关键警报。',
      docOverdue: '文档已过期',
      actPrior: '优先活动',
      atrasada: '已延迟',
      deadline: '截止日期',
      complete: '完成',
      prox7Title: '近期截止日期 (7 天)',
      noProx: '近期没有到期。',
      vence: '到期',
      markComplete: '标记为完成',
      othersTitle: '其他待处理活动',
      noOthers: '没有其他待处理的活动。',
      colDesc: '描述',
      colDate: '日期',
      colPrior: '优先级',
      colAction: '操作',
      low: '低',
      medium: '中',
      viewDetail: '查看详情'
    }
  };

  const t = translations[lang];

  const documents = useMemo(() => getDocuments(), []);
  const [activities, setActivities] = useState<Activity[]>(() => {
      return MOCK_ACTIVITIES;
  });

  const handleCompleteActivity = (act: Activity) => {
      const confirmMsg = lang === 'es' ? `¿Marcar "${act.description}" como completado?` : `将 "${act.description}" 标记为完成？`;
      if (!window.confirm(confirmMsg)) return;
      
      const storedKey = `activities_${act.docId}`;
      const stored = localStorage.getItem(storedKey);
      let list = stored ? JSON.parse(stored) : MOCK_ACTIVITIES.filter(a => a.docId === act.docId);
      
      const updated = list.map((a: Activity) => 
        a.id === act.id ? { ...a, status: 'Completed', completedBy: 'Galo Castrillon' } : a
      );
      
      localStorage.setItem(storedKey, JSON.stringify(updated));
      alert(lang === 'es' ? "Actividad completada y guardada." : "活动已完成并保存。");
      window.location.reload();
  };

  const today = new Date().toISOString().split('T')[0];
  const nextWeekDate = new Date();
  nextWeekDate.setDate(nextWeekDate.getDate() + 7);
  const nextWeek = nextWeekDate.toISOString().split('T')[0];

  const overdueDocs = documents.filter(d => d.status === DocStatus.OVERDUE);
  const criticalActivities = activities.filter(a => 
    a.status === 'Pending' && (a.priority === 'High' || a.dueDate < today)
  );

  const upcomingDocs = documents.filter(d => 
    d.status !== DocStatus.COMPLETED && 
    d.status !== DocStatus.OVERDUE && 
    d.dueDate >= today && 
    d.dueDate <= nextWeek
  );
  const upcomingActivities = activities.filter(a => 
    a.status === 'Pending' && 
    a.dueDate >= today && 
    a.dueDate <= nextWeek &&
    !criticalActivities.find(ca => ca.id === a.id)
  );

  const otherPendingActivities = activities.filter(a => 
    a.status === 'Pending' && 
    !criticalActivities.find(ca => ca.id === a.id) &&
    !upcomingActivities.find(ua => ua.id === a.id)
  );

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">{t.title}</h1>
        <p className="text-gray-500">{t.subtitle}</p>
      </div>

      <div className="space-y-8">
        <section>
            <div className="flex items-center gap-2 mb-4 text-red-600">
                <AlertTriangle className="w-6 h-6" />
                <h2 className="text-lg font-bold">{t.critTitle}</h2>
            </div>
            
            {overdueDocs.length === 0 && criticalActivities.length === 0 ? (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-green-800 flex items-center gap-3">
                    <CheckCircle className="w-5 h-5" />
                    {t.noCrit}
                </div>
            ) : (
                <div className="grid gap-4">
                    {overdueDocs.map(doc => (
                        <div key={doc.id} className="bg-white border-l-4 border-l-red-500 border border-gray-200 rounded-r-xl p-4 shadow-sm flex justify-between items-center">
                            <div>
                                <div className="flex items-center gap-2 mb-1">
                                    <span className="bg-red-100 text-red-800 text-xs px-2 py-0.5 rounded-full font-bold">{t.docOverdue}</span>
                                    <span className="text-xs text-gray-400">ID: {doc.trarniteNumber}</span>
                                </div>
                                <h3 className="font-semibold text-gray-900">{doc.title}</h3>
                                <p className="text-sm text-gray-500">{doc.authority} - {displayDate(doc.dueDate)}</p>
                            </div>
                            <Link to={`/documents/${doc.id}`} className="flex items-center gap-1 text-sm font-medium text-red-600 hover:text-red-800">
                                {t.viewDetail} <ArrowRight className="w-4 h-4" />
                            </Link>
                        </div>
                    ))}

                    {criticalActivities.map(act => {
                        const relatedDoc = documents.find(d => d.id === act.docId);
                        return (
                            <div key={act.id} className="bg-white border-l-4 border-l-orange-500 border border-gray-200 rounded-r-xl p-4 shadow-sm flex justify-between items-center">
                                <div>
                                     <div className="flex items-center gap-2 mb-1">
                                        <span className="bg-orange-100 text-orange-800 text-xs px-2 py-0.5 rounded-full font-bold">{t.actPrior}</span>
                                        {act.dueDate < today && <span className="text-xs text-red-600 font-bold">• {t.atrasada}</span>}
                                    </div>
                                    <h3 className="font-semibold text-gray-900">{act.description}</h3>
                                    <p className="text-sm text-gray-500">{relatedDoc?.title.substring(0, 40)}...</p>
                                </div>
                                <div className="text-right flex items-center gap-6">
                                    <div>
                                        <p className="text-sm font-bold text-gray-900">{displayDate(act.dueDate)}</p>
                                        <p className="text-xs text-gray-500">{t.deadline}</p>
                                    </div>
                                    <button onClick={() => handleCompleteActivity(act)} className="px-3 py-1.5 bg-orange-50 text-orange-700 text-xs font-bold rounded hover:bg-orange-100 border border-orange-200 transition-colors uppercase">{t.complete}</button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </section>

        <section>
            <div className="flex items-center gap-2 mb-4 text-indigo-600">
                <Clock className="w-6 h-6" />
                <h2 className="text-lg font-bold">{t.prox7Title}</h2>
            </div>

            {upcomingDocs.length === 0 && upcomingActivities.length === 0 ? (
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-gray-500 text-sm">
                    {t.noProx}
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                     {upcomingDocs.map(doc => (
                        <Link key={doc.id} to={`/documents/${doc.id}`} className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow block group">
                            <div className="flex items-start justify-between mb-2">
                                <div className="p-2 bg-blue-50 text-blue-600 rounded-lg group-hover:bg-blue-100 transition-colors">
                                    <FileText className="w-5 h-5" />
                                </div>
                                <span className="text-xs font-medium bg-gray-100 text-gray-600 px-2 py-1 rounded">
                                    {t.vence}: {displayDate(doc.dueDate)}
                                </span>
                            </div>
                            <h3 className="font-medium text-gray-900 line-clamp-2 mb-1">{doc.title}</h3>
                            <p className="text-xs text-gray-500">{doc.authority}</p>
                        </Link>
                    ))}
                    
                    {upcomingActivities.map(act => (
                         <div key={act.id} className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm flex flex-col justify-between">
                            <div>
                                <div className="flex justify-between items-start mb-2">
                                    <span className="text-xs font-bold text-indigo-600 uppercase tracking-wide">{lang === 'es' ? 'Actividad' : '活动'}</span>
                                    <span className="text-xs text-gray-500">{displayDate(act.dueDate)}</span>
                                </div>
                                <p className="font-medium text-gray-900">{act.description}</p>
                            </div>
                             <div className="mt-3 pt-3 border-t border-gray-100 flex justify-end">
                                <button onClick={() => handleCompleteActivity(act)} className="text-xs font-medium text-indigo-600 hover:text-indigo-800">{t.markComplete}</button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </section>

        <section>
            <div className="flex items-center gap-2 mb-4 text-gray-700">
                <Calendar className="w-6 h-6" />
                <h2 className="text-lg font-bold">{t.othersTitle}</h2>
            </div>
             <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
                {otherPendingActivities.length === 0 ? (
                    <div className="p-8 text-center text-gray-500">
                        {t.noOthers}
                    </div>
                ) : (
                    <table className="w-full text-left">
                        <thead className="bg-gray-50 text-xs uppercase text-gray-500 font-semibold">
                            <tr>
                                <th className="px-6 py-3">{t.colDesc}</th>
                                <th className="px-6 py-4">{t.colDate}</th>
                                <th className="px-6 py-3">{t.colPrior}</th>
                                <th className="px-6 py-3 text-right">{t.colAction}</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            {otherPendingActivities.map(act => (
                                <tr key={act.id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 text-sm text-gray-900">{act.description}</td>
                                    <td className="px-6 py-4 text-sm text-gray-500">{displayDate(act.dueDate)}</td>
                                    <td className="px-6 py-4">
                                        <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                                            act.priority === 'Low' ? 'bg-gray-100 text-gray-600' : 'bg-yellow-100 text-yellow-700'
                                        }`}>
                                            {act.priority === 'Low' ? t.low : t.medium}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <button onClick={() => handleCompleteActivity(act)} className="text-blue-600 hover:text-blue-800 text-sm font-medium">{t.markComplete}</button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
             </div>
        </section>
      </div>
    </div>
  );
};

export default Alerts;
