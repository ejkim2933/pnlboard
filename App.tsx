import React, { useState, useEffect, useMemo } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, 
  Line, ComposedChart, Area, Cell, AreaChart
} from 'recharts';
import { 
  YearData, INITIAL_MONTHLY_DATA, MONTH_NAMES, CalculatedMetrics 
} from './types';
import { calculateMetrics, formatCurrency, formatPercent } from './utils/calculations';
import SummaryCard from './components/SummaryCard';
import DataEntryModal from './components/DataEntryModal';

const STORAGE_KEY = 'pl_dashboard_pro_v2';

const App: React.FC = () => {
  const [yearData, setYearData] = useState<YearData>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error("Failed to parse saved data", e);
      }
    }
    return {
      target: Array(12).fill(0).map(() => ({ ...INITIAL_MONTHLY_DATA })),
      actual: Array(12).fill(0).map(() => ({ ...INITIAL_MONTHLY_DATA })),
    };
  });

  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(yearData));
  }, [yearData]);

  const dashboardData = useMemo(() => {
    return MONTH_NAMES.map((name, idx) => {
      const targetMetrics = calculateMetrics(yearData.target[idx]);
      const actualMetrics = calculateMetrics(yearData.actual[idx]);

      return {
        name,
        targetSales: yearData.target[idx].sales,
        actualSales: yearData.actual[idx].sales,
        actualBEP: actualMetrics.bep,
        targetBEP: targetMetrics.bep,
        ...actualMetrics,
      };
    });
  }, [yearData]);

  // Fix: totalActual now returns an object that includes base data (sales) as well as calculated metrics.
  const totalActual = useMemo(() => {
    const sum = yearData.actual.reduce((acc, curr) => ({
      sales: acc.sales + curr.sales,
      materialCost: acc.materialCost + curr.materialCost,
      adminLabor: acc.adminLabor + curr.adminLabor,
      mfgLabor: acc.mfgLabor + curr.mfgLabor,
      adminOH: acc.adminOH + curr.adminOH,
      mfgOH: acc.mfgOH + curr.mfgOH,
      depreciation: acc.depreciation + curr.depreciation,
    }), { ...INITIAL_MONTHLY_DATA });
    
    return {
      ...sum,
      ...calculateMetrics(sum)
    };
  }, [yearData.actual]);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <header className="sticky top-0 z-[50] glass-card px-10 py-5 flex justify-between items-center shadow-sm border-b border-slate-200">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-slate-900 rounded-[1.25rem] flex items-center justify-center text-white shadow-xl rotate-3">
            <i className="fas fa-chart-pie text-2xl"></i>
          </div>
          <div>
            <h1 className="text-2xl font-black text-slate-800 tracking-tighter">손익 대시보드 PRO</h1>
            <p className="text-[10px] text-indigo-600 font-black uppercase tracking-[0.2em]">Management & Performance Insight</p>
          </div>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-3 rounded-2xl font-black text-sm flex items-center gap-3 transition-all active:scale-95 shadow-xl shadow-indigo-100"
        >
          <i className="fas fa-edit"></i>
          데이터 통합 관리
        </button>
      </header>

      <main className="max-w-[1600px] mx-auto w-full px-10 py-10 space-y-10 flex-1">
        {/* KPI Cards */}
        <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <SummaryCard 
            title="누적 매출액 (실제)" 
            value={`${formatCurrency(totalActual.sales)}원`}
            subValue="현재까지 확정된 총 매출"
            icon="fa-coins"
            color="bg-blue-600"
          />
          <SummaryCard 
            title="영업이익 (감가 전)" 
            value={`${formatCurrency(totalActual.operatingProfit)}원`}
            subValue={`이익률: ${formatPercent(totalActual.opMargin)}`}
            icon="fa-bolt"
            color="bg-emerald-500"
          />
          <SummaryCard 
            title="감가 반영 영업이익" 
            value={`${formatCurrency(totalActual.opInclDepr)}원`}
            subValue={`반영 이익률: ${formatPercent(totalActual.opMarginInclDepr)}`}
            icon="fa-calculator"
            color="bg-indigo-600"
          />
          <SummaryCard 
            title="평균 손익분기점 (BEP)" 
            value={`${formatCurrency(totalActual.bep)}원`}
            subValue="누적 고정비 회수 필요 매출"
            icon="fa-scale-balanced"
            color="bg-rose-500"
          />
        </section>

        {/* Charts Section */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
          {/* Main Chart: Sales vs BEP */}
          <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100 flex flex-col">
            <div className="mb-8">
              <h3 className="text-xl font-black text-slate-800 flex items-center gap-3">
                <span className="w-1.5 h-6 bg-blue-500 rounded-full"></span>
                매출 목표 vs 실적 및 손익분기 추이
              </h3>
              <p className="text-sm text-slate-400 font-medium mt-1 ml-4">막대는 매출 현황을, 붉은 선은 손익을 넘기기 위해 필요한 매출(BEP)을 의미합니다.</p>
            </div>
            <div className="h-[400px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={dashboardData} margin={{ top: 10, right: 10, bottom: 10, left: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 11, fontWeight: 700}} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 11}} tickFormatter={(val) => val >= 10000 ? `${(val/10000).toLocaleString()}만` : val} />
                  <Tooltip 
                    contentStyle={{borderRadius: '20px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)', padding: '16px'}}
                    formatter={(val: number) => formatCurrency(val) + '원'}
                  />
                  <Legend verticalAlign="top" align="right" iconType="circle" wrapperStyle={{paddingBottom: '30px'}} />
                  <Bar dataKey="targetSales" name="목표 매출" fill="#e2e8f0" radius={[10, 10, 0, 0]} barSize={20} />
                  <Bar dataKey="actualSales" name="실제 매출" radius={[10, 10, 0, 0]} barSize={20}>
                    {dashboardData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.actualSales >= entry.targetSales ? '#4f46e5' : '#94a3b8'} />
                    ))}
                  </Bar>
                  <Line type="monotone" dataKey="actualBEP" name="BEP (실제)" stroke="#f43f5e" strokeWidth={4} dot={{ r: 4, strokeWidth: 2, fill: '#fff' }} activeDot={{ r: 6 }} />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Profitability Chart */}
          <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100 flex flex-col">
            <div className="mb-8">
              <h3 className="text-xl font-black text-slate-800 flex items-center gap-3">
                <span className="w-1.5 h-6 bg-emerald-500 rounded-full"></span>
                영업이익 및 감가 반영 수익성 비교
              </h3>
              <p className="text-sm text-slate-400 font-medium mt-1 ml-4">순수 운영 수익과 감가상각비를 반영한 최종 수익의 차이를 확인합니다.</p>
            </div>
            <div className="h-[400px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={dashboardData} margin={{ top: 10, right: 10, bottom: 10, left: 10 }}>
                  <defs>
                    <linearGradient id="colorOP" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorDepr" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 11, fontWeight: 700}} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 11}} />
                  <Tooltip contentStyle={{borderRadius: '20px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)'}} />
                  <Legend verticalAlign="top" align="right" iconType="circle" wrapperStyle={{paddingBottom: '30px'}} />
                  <Area type="monotone" dataKey="operatingProfit" name="영업이익 (감가전)" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorOP)" />
                  <Area type="monotone" dataKey="opInclDepr" name="감가 반영 이익" stroke="#6366f1" strokeWidth={3} fillOpacity={1} fill="url(#colorDepr)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Detailed Table */}
        <section className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden">
          <div className="px-10 py-8 border-b border-slate-50 bg-slate-50/30 flex justify-between items-end">
            <div>
              <h3 className="text-xl font-black text-slate-800">월별 상세 경영 지표 (실적 기준)</h3>
              <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1">Monthly Performance Deep-dive</p>
            </div>
            <div className="text-right">
                <span className="text-[10px] font-black text-slate-300 bg-slate-100 px-3 py-1 rounded-full uppercase tracking-tighter">Automatic Calculation System</span>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-white text-slate-400 text-[10px] font-black uppercase tracking-widest border-b border-slate-100">
                  <th className="px-10 py-6 sticky left-0 bg-white z-10 w-[240px] shadow-[1px_0_0_#f1f5f9]">구분 지표</th>
                  {MONTH_NAMES.map(m => <th key={m} className="px-6 py-6 text-right">{m}</th>)}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {[
                  { label: '영업이익 (감가전)', key: 'operatingProfit', isPct: false, color: 'text-slate-900' },
                  { label: '영업이익률', key: 'opMargin', isPct: true, color: 'text-emerald-600 font-black' },
                  { label: '감가 반영 영업이익', key: 'opInclDepr', isPct: false, color: 'text-indigo-600' },
                  { label: '감가 반영 이익률', key: 'opMarginInclDepr', isPct: true, color: 'text-indigo-600 font-black' },
                  { label: '재료비율', key: 'materialRatio', isPct: true, color: 'text-slate-500' },
                  { label: '인건비율', key: 'laborRatio', isPct: true, color: 'text-slate-500' },
                  { label: '경비비율', key: 'expenseRatio', isPct: true, color: 'text-slate-500' },
                  { label: '한계이익률', key: 'marginalProfitRatio', isPct: true, color: 'text-blue-600 font-bold' },
                  { label: '손익분기점(BEP)', key: 'bep', isPct: false, color: 'text-rose-500 font-bold' },
                ].map((row, idx) => (
                  <tr key={idx} className="hover:bg-slate-50 transition-colors group">
                    <td className="px-10 py-5 font-extrabold text-slate-700 sticky left-0 bg-white z-10 shadow-[1px_0_0_#f1f5f9] group-hover:bg-slate-50">
                      {row.label}
                    </td>
                    {dashboardData.map((d, dIdx) => {
                      const val = d[row.key as keyof typeof d] as number;
                      const isNegative = val < 0;
                      return (
                        <td key={dIdx} className={`px-6 py-5 text-right whitespace-nowrap text-sm ${isNegative ? 'text-rose-500 font-bold' : row.color}`}>
                          {row.isPct ? formatPercent(val) : formatCurrency(val)}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </main>

      <footer className="px-10 py-8 text-center text-slate-300 text-xs font-bold border-t border-slate-100">
        &copy; 2024 Corporate P&L Dashboard Pro. All Financial Data Secured Locally.
      </footer>

      <DataEntryModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        yearData={yearData}
        onSave={(data) => setYearData(data)}
      />
    </div>
  );
};

export default App;