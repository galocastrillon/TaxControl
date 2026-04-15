
import React, { useMemo, useState, useEffect } from 'react';
import { STATS_CONFIG, getDocuments, displayDate } from '../constants';
import { PieChart, Pie, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';
import { DocStatus, Document } from '../types';
import { Calendar, Filter, Clock, AlertTriangle, ArrowRight, FileText, ChevronRight } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

const Dashboard: React.FC = () => {
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

  useEffect(() => {
    const fetchDocs = async () => {
      const docs = await getDocuments();
      setDocuments(docs);
    };
    fetchDocs();
  }, []);
  
  const translations = {
    es: {
      title: 'Dashboard de Control Tributario',
      subtitle: 'Resumen operativo y monitor de plazos legales para Galo Castrillon.',
      totalDocs: 'Documentos Totales',
      inProgress: 'En progreso',
      upcoming: 'Plazos Próximos',
      overdue: 'Plazos Vencidos',
      chartTitle: 'Estado General de Documentación',
      filters: 'Filtros de Vista',
      company: 'Empresa',
      authority: 'Autoridad',
      updateReport: 'Actualizar Reporte',
      vencidos: 'Vencidos',
      critico: 'Crítico',
      prox7: 'Próximos 7 días',
      urgente: 'Urgente',
      prox15: 'Próximos 15 días',
      planificacion: 'Planificación',
      noVencidos: 'No hay documentos vencidos.',
      no7: 'No hay vencimientos en 7 días.',
      no15: 'No hay vencimientos de 8 a 15 días.',
      viewMore: 'Ver {n} más',
      recentDocs: 'Últimos Documentos Ingresados',
      colName: 'NOMBRE DOCUMENTO / TRÁMITE',
      colAuth: 'AUTORIDAD',
      colDue: 'FECHA VENC.',
      colStatus: 'ESTADO'
    },
    cn: {
      title: '税务控制仪表板',
      subtitle: 'Galo Castrillon 的运营摘要和法律期限监控。',
      totalDocs: '文档总数',
      inProgress: '进行中',
      upcoming: '近期截止',
      overdue: '已逾期',
      chartTitle: '文档总体状态',
      filters: '视图过滤器',
      company: '公司',
      authority: '权力机构',
      updateReport: '更新报告',
      vencidos: '已过期',
      critico: '紧急',
      prox7: '未来 7 天',
      urgente: '紧急',
      prox15: '未来 15 天',
      planificacion: '规划',
      noVencidos: '没有过期的文件。',
      no7: '7天内没有到期文件。',
      no15: '8到15天内没有到期文件。',
      viewMore: '查看更多 {n}',
      recentDocs: '最近输入的文档',
      colName: '文件名 / 程序编号',
      colAuth: '机构',
      colDue: '到期日期',
      colStatus: '状态'
    }
  };

  const t = translations[lang];

  const statsValues = useMemo(() => {
    const total = documents.length;
    const inProgress = documents.filter(d => d.status === DocStatus.IN_PROGRESS).length;
    const overdue = documents.filter(d => d.status === DocStatus.OVERDUE).length;
    const upcoming = documents.filter(d => {
        const diff = (new Date(d.dueDate).getTime() - new Date().getTime()) / (1000 * 3600 * 24);
        return diff >= 0 && diff <= 7 && d.status !== DocStatus.COMPLETED;
    }).length;

    return { total, progress: inProgress, upcoming, overdue };
  }, [documents]);

  const last5Docs = useMemo(() => {
    return [...documents]
      .sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime())
      .slice(0, 5);
  }, [documents]);

  const upcoming7Docs = useMemo(() => {
    return documents.filter(d => {
        const diff = (new Date(d.dueDate).getTime() - new Date().getTime()) / (1000 * 3600 * 24);
        return diff >= 0 && diff <= 7 && d.status !== DocStatus.COMPLETED && d.status !== DocStatus.OVERDUE;
    }).sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());
  }, [documents]);

  const upcoming15Docs = useMemo(() => {
    return documents.filter(d => {
        const diff = (new Date(d.dueDate).getTime() - new Date().getTime()) / (1000 * 3600 * 24);
        return diff > 7 && diff <= 15 && d.status !== DocStatus.COMPLETED;
    }).sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());
  }, [documents]);

  const overdueDocs = useMemo(() => {
    return documents.filter(d => d.status === DocStatus.OVERDUE)
      .sort((a, b) => new Date(b.dueDate).getTime() - new Date(a.dueDate).getTime());
  }, [documents]);

  const chartData = useMemo(() => {
    const counts = documents.reduce((acc, doc) => {
        acc[doc.status] = (acc[doc.status] || 0) + 1;
        return acc;
    }, {} as Record<string, number>);

    return [
        { name: lang === 'es' ? 'Inicializado' : '已初始化', value: counts[DocStatus.INITIALIZED] || 0, color: '#3B82F6' },
        { name: lang === 'es' ? 'En progreso' : '进行中', value: counts[DocStatus.IN_PROGRESS] || 0, color: '#8B5CF6' },
        { name: lang === 'es' ? 'Completado' : '已完成', value: counts[DocStatus.COMPLETED] || 0, color: '#10B981' },
        { name: lang === 'es' ? 'Vencido' : '已逾期', value: counts[DocStatus.OVERDUE] || 0, color: '#EF4444' },
    ].filter(item => item.value > 0);
  }, [documents, lang]);

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
    if (lang === 'es') return status.toUpperCase();
    switch (status) {
      case DocStatus.INITIALIZED: return '已初始化';
      case DocStatus.IN_PROGRESS: return '进行中';
      case DocStatus.COMPLETED: return '已完成';
      case DocStatus.OVERDUE: return '已逾期';
      default: return status;
    }
  };

  const RADIAN = Math.PI / 180;
  const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }: any) => {
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);
    return (percent > 0.05) ? (
      <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central" className="text-[10px] font-bold">
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    ) : null;
  };

  return (
    <div className="p-8 space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">{t.title}</h1>
        <p className="text-gray-500">{t.subtitle}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {STATS_CONFIG.map((stat) => {
          let label = t.totalDocs;
          if (stat.id === 'progress') label = t.inProgress;
          if (stat.id === 'upcoming') label = t.upcoming;
          if (stat.id === 'overdue') label = t.overdue;

          return (
            <div key={stat.id} className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex items-center gap-4 hover:shadow-md transition-shadow">
                <div className={`p-3 rounded-full ${stat.color}`}>
                    <stat.icon className="w-6 h-6" />
                </div>
                <div>
                    <p className="text-sm font-medium text-gray-500">{label}</p>
                    <p className="text-2xl font-bold text-gray-900">{statsValues[stat.id as keyof typeof statsValues]}</p>
                </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
            <h3 className="text-lg font-bold text-gray-900 mb-6">{t.chartTitle}</h3>
            <div className="h-80 w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                        <Pie data={chartData} cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={5} dataKey="value" labelLine={false} label={renderCustomizedLabel}>
                            {chartData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                        </Pie>
                        <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                        <Legend verticalAlign="bottom" height={36}/>
                    </PieChart>
                </ResponsiveContainer>
            </div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex flex-col justify-between">
            <div>
                <h3 className="text-lg font-bold text-gray-900 mb-4">{t.filters}</h3>
                <div className="space-y-4">
                    <label className="block">
                        <span className="text-xs font-bold text-gray-500 uppercase mb-1 block">{t.company}</span>
                        <select className="w-full bg-gray-50 border border-gray-200 text-sm rounded-lg p-3 outline-none focus:ring-2 focus:ring-primary/20">
                            <option>ECSA (Ecuacorriente S.A.)</option>
                            <option>EXSA (Explorcobres S.A.)</option>
                            <option>HCSA (Hidrocruz S.A.)</option>
                            <option>PCSA (Puertocobre S.A.)</option>
                            <option>MMSA (MidasMine)</option>
                        </select>
                    </label>
                    <label className="block">
                        <span className="text-xs font-bold text-gray-500 uppercase mb-1 block">{t.authority}</span>
                        <select className="w-full bg-gray-50 border border-gray-200 text-sm rounded-lg p-3 outline-none focus:ring-2 focus:ring-primary/20">
                            <option>{lang === 'es' ? 'Todas' : '全部'}</option>
                            <option>SRI</option>
                            <option>SENAEP</option>
                        </select>
                    </label>
                </div>
            </div>
            <button className="w-full mt-6 flex items-center justify-center gap-2 px-4 py-3 bg-primary text-white rounded-xl hover:bg-blue-600 font-bold transition-all shadow-lg shadow-blue-200 active:scale-95">
                <Filter className="w-4 h-4" /> {t.updateReport}
            </button>
        </div>
      </div>

      {/* SECCIÓN DE ÚLTIMOS DOCUMENTOS INGRESADOS */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-gray-100 flex items-center justify-between">
           <h3 className="text-lg font-bold text-gray-900 uppercase tracking-tight">{t.recentDocs}</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-50/50 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
              <tr>
                <th className="px-8 py-4">{t.colName}</th>
                <th className="px-8 py-4">{t.colAuth}</th>
                <th className="px-8 py-4">{t.colDue}</th>
                <th className="px-8 py-4">{t.colStatus}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {last5Docs.map((doc) => (
                <tr key={doc.id} className="hover:bg-gray-50/50 transition-colors group">
                  <td className="px-8 py-5">
                    <div className="flex flex-col">
                      <Link 
                        to={`/documents/${doc.id}`} 
                        className="text-sm font-bold text-gray-900 hover:text-primary transition-colors line-clamp-1"
                      >
                        {doc.title}
                      </Link>
                      <span className="text-[11px] font-mono text-gray-400 mt-1">#{doc.trarniteNumber}</span>
                    </div>
                  </td>
                  <td className="px-8 py-5">
                    <span className="text-sm font-semibold text-gray-600 uppercase tracking-tight">{doc.authority}</span>
                  </td>
                  <td className="px-8 py-5">
                    <span className="text-sm font-bold text-gray-800">{displayDate(doc.dueDate)}</span>
                  </td>
                  <td className="px-8 py-5">
                    <span className={`inline-flex items-center px-4 py-1.5 rounded-full text-[10px] font-black tracking-wider ${getStatusColor(doc.status)}`}>
                      {getStatusLabel(doc.status)}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm flex flex-col border-t-4 border-t-red-500">
            <div className="p-5 border-b border-gray-100 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5 text-red-500" />
                    <h3 className="text-sm font-bold text-gray-900">{t.vencidos}</h3>
                </div>
                <span className="bg-red-100 text-red-700 text-[10px] font-black px-2 py-0.5 rounded-full uppercase">{t.critico}</span>
            </div>
            <div className="p-4 flex-1 space-y-3">
                {overdueDocs.length > 0 ? overdueDocs.slice(0, 4).map(doc => (
                    <Link key={doc.id} to={`/documents/${doc.id}`} className="block p-3 bg-red-50 hover:bg-red-100 rounded-lg transition-colors group">
                        <p className="text-xs font-bold text-gray-900 line-clamp-1 group-hover:text-red-700">{doc.title}</p>
                        <div className="flex justify-between items-center mt-1">
                            <span className="text-[10px] text-gray-500 font-mono">#{doc.trarniteNumber}</span>
                            <span className="text-[10px] text-red-600 font-bold">{displayDate(doc.dueDate)}</span>
                        </div>
                    </Link>
                )) : (
                    <p className="text-sm text-gray-400 italic text-center py-8">{t.noVencidos}</p>
                )}
            </div>
            {overdueDocs.length > 4 && (
                <Link to="/documents" className="p-3 text-center text-xs font-bold text-gray-400 hover:text-red-500 border-t border-gray-50 transition-colors uppercase tracking-widest">
                    {t.viewMore.replace('{n}', (overdueDocs.length - 4).toString())}
                </Link>
            )}
        </div>

        <div className="bg-white rounded-xl border border-gray-200 shadow-sm flex flex-col border-t-4 border-t-amber-500">
            <div className="p-5 border-b border-gray-100 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Clock className="w-5 h-5 text-amber-500" />
                    <h3 className="text-sm font-bold text-gray-900">{t.prox7}</h3>
                </div>
                <span className="bg-amber-100 text-amber-700 text-[10px] font-black px-2 py-0.5 rounded-full uppercase">{t.urgente}</span>
            </div>
            <div className="p-4 flex-1 space-y-3">
                {upcoming7Docs.length > 0 ? upcoming7Docs.slice(0, 4).map(doc => (
                    <Link key={doc.id} to={`/documents/${doc.id}`} className="block p-3 bg-amber-50 hover:bg-amber-100 rounded-lg transition-colors group">
                        <p className="text-xs font-bold text-gray-900 line-clamp-1 group-hover:text-amber-700">{doc.title}</p>
                        <div className="flex justify-between items-center mt-1">
                            <span className="text-[10px] text-gray-500 font-mono">#{doc.trarniteNumber}</span>
                            <span className="text-[10px] text-amber-600 font-bold">{displayDate(doc.dueDate)}</span>
                        </div>
                    </Link>
                )) : (
                    <p className="text-sm text-gray-400 italic text-center py-8">{t.no7}</p>
                )}
            </div>
            {upcoming7Docs.length > 4 && (
                <Link to="/documents" className="p-3 text-center text-xs font-bold text-gray-400 hover:text-amber-500 border-t border-gray-50 transition-colors uppercase tracking-widest">
                    {t.viewMore.replace('{n}', (upcoming7Docs.length - 4).toString())}
                </Link>
            )}
        </div>

        <div className="bg-white rounded-xl border border-gray-200 shadow-sm flex flex-col border-t-4 border-t-blue-500">
            <div className="p-5 border-b border-gray-100 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-blue-500" />
                    <h3 className="text-sm font-bold text-gray-900">{t.prox15}</h3>
                </div>
                <span className="bg-blue-100 text-blue-700 text-[10px] font-black px-2 py-0.5 rounded-full uppercase">{t.planificacion}</span>
            </div>
            <div className="p-4 flex-1 space-y-3">
                {upcoming15Docs.length > 0 ? upcoming15Docs.slice(0, 4).map(doc => (
                    <Link key={doc.id} to={`/documents/${doc.id}`} className="block p-3 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors group">
                        <p className="text-xs font-bold text-gray-900 line-clamp-1 group-hover:text-blue-700">{doc.title}</p>
                        <div className="flex justify-between items-center mt-1">
                            <span className="text-[10px] text-gray-500 font-mono">#{doc.trarniteNumber}</span>
                            <span className="text-[10px] text-blue-600 font-bold">{displayDate(doc.dueDate)}</span>
                        </div>
                    </Link>
                )) : (
                    <p className="text-sm text-gray-400 italic text-center py-8">{t.no15}</p>
                )}
            </div>
            {upcoming15Docs.length > 4 && (
                <Link to="/documents" className="p-3 text-center text-xs font-bold text-gray-400 hover:text-blue-500 border-t border-gray-50 transition-colors uppercase tracking-widest">
                    {t.viewMore.replace('{n}', (upcoming15Docs.length - 4).toString())}
                </Link>
            )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
