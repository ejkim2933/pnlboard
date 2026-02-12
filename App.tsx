import React, { useState, useEffect, useMemo } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, 
  Line, ComposedChart, Area, Cell, AreaChart
} from 'recharts';
import { 
  YearData, INITIAL_MONTHLY_DATA, MONTH_NAMES, CalculatedMetrics 
} from './types';
import { calculateMetrics, formatCurrency, formatPercent, getCumulativeData, formatMillions } from './utils/calculations';
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
  const [viewMode, setViewMode] = useState<'monthly' | 'cumulative'>('monthly');
  const [displayPeriod, setDisplayPeriod] = useState<'1H' | '2H' | 'Full'>('1H');

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(yearData));
  }, [yearData]);

  // 현재 조회 기간에 해당하는 인덱스 범위 계산
  const periodRange = useMemo(() => {
    if (displayPeriod === '1H') return { start: 0, end: 6 };
    if (displayPeriod === '2H') return { start: 6, end: 12 };
    return { start: 0, end: 12 };
  }, [displayPeriod]);

  // 현재 뷰 모드 및 조회 기간에 따른 시각화 데이터 생성
  const dashboardData = useMemo(() => {
    const targetBase = viewMode === 'cumulative' ? getCumulativeData(yearData.target) : yearData.target;
    const actualBase = viewMode === 'cumulative' ? getCumulativeData(yearData.actual) : yearData.actual;

    const fullData = MONTH_NAMES.map((name, idx) => {
      const targetMetrics = calculateMetrics(targetBase[idx]);
      const actualMetrics = calculateMetrics(actualBase[idx]);

      return {
        name,
        targetSales: targetBase[idx].sales,
        actualSales: actualBase[idx].sales,
        actualBEP: actualMetrics.bep,
        targetBEP: targetMetrics.bep,
        ...actualMetrics,
      };
    });

    return fullData.slice(periodRange.start, periodRange.end);
  }, [yearData, viewMode, periodRange]);

  // 상단 요약 카드는 항상 누적(YTD) 전체 합계를 기준으로 표시
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

        <div className="flex items-center gap-4">
          {/* 조회 구간 필터 */}
          <div className="flex bg-slate-100 p-1 rounded-2xl border border-slate-200 shadow-inner">
            <button 
              onClick={() => setDisplayPeriod('1H')}
              className={`px-4 py-2 rounded-xl text-[11px] font-black transition-all ${displayPeriod === '1H' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
            >
              상반기 (1H)
            </button>
            <button 
              onClick={() => setDisplayPeriod('2H')}
              className={`px-4 py-2 rounded-xl text-[11px] font-black transition-all ${displayPeriod === '2H' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
            >
              하반기 (2H)
            </button>
            <button 
              onClick={() => setDisplayPeriod('Full')}
              className={`px-4 py-2 rounded-xl text-[11px] font-black transition-all ${displayPeriod === 'Full' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
            >
              전체 (Full)
            </button>
          </div>

          <div className="flex bg-slate-200/50 p-1.5 rounded-2xl shadow-inner border border-slate-100">
            <button 
              onClick={() => setViewMode('monthly')}
              className={`px-6 py-2 rounded-xl text-xs font-black transition-all ${viewMode === 'monthly' ? 'bg-white text-indigo-600 shadow-md' : 'text-slate-500 hover:text-indigo-400'}`}
            >
              당월 실적
            </button>
            <button 
              onClick={() => setViewMode('cumulative')}
              className={`px-6 py-2 rounded-xl text-xs font-black transition-all ${viewMode === 'cumulative' ? 'bg-white text-indigo-600 shadow-md' : 'text-slate-500 hover:text-indigo-400'}`}
            >
              누적 실적
            </button>
          </div>

          <button 
            onClick={() => setIsModalOpen(true)}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-3.5 rounded-2xl font-black text-sm flex items-center gap-3 transition-all active:scale-95 shadow-xl shadow-indigo-100"
          >
            <i className="fas fa-edit"></i>
            데이터 통합 관리
          </button>
        </div>
      </header>

      <main className="max-w-[1600px] mx-auto w-full px-10 py-10 space-y-10 flex-1">
        {/* KPI Cards (Always YTD Context) */}
        <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <SummaryCard 
            title="연간 누적 매출 (실제)" 
            value={`${formatMillions(totalActual.sales)}`}
            subValue="단위: 백만원"
            icon="fa-coins"
            color="bg-blue-600"
          />
          <SummaryCard 
            title="누적 영업이익 (감가전)" 
            value={`${formatMillions(totalActual.operatingProfit)}`}
            subValue={`이익률: ${formatPercent(totalActual.opMargin)} (백만원)`}
            icon="fa-bolt"
            color="bg-emerald-500"
          />
          <SummaryCard 
            title="감가 반영 누적 이익" 
            value={`${formatMillions(totalActual.opInclDepr)}`}
            subValue={`반영 이익률: ${formatPercent(totalActual.opMarginInclDepr)} (백만원)`}
            icon="fa-calculator"
            color="bg-indigo-600"
          />
          <SummaryCard 
            title="손익분기점 (YTD BEP)" 
            value={`${formatMillions(totalActual.bep)}`}
            subValue="회수 소요 매출 (단위: 백만원)"
            icon="fa-scale-balanced"
            color="bg-rose-500"
          />
        </section>

        {/* Charts Section */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
          {/* Main Chart: Sales vs BEP */}
          <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100 flex flex-col">
            <div className="mb-8 flex justify-between items-start">
              <div>
                <h3 className="text-xl font-black text-slate-800 flex items-center gap-3">
                  <span className="w-1.5 h-6 bg-blue-500 rounded-full"></span>
                  매출 목표 vs 실적 및 손익분기 ({viewMode === 'monthly' ? '월별' : '누적'})
                </h3>
                <p className="text-sm text-slate-400 font-medium mt-1 ml-4 text-xs">
                  구간: {displayPeriod === '1H' ? '상반기 (1-6월)' : displayPeriod === '2H' ? '하반기 (7-12월)' : '전체 (1-12월)'} | 단위: 백만원
                </p>
              </div>
              <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${viewMode === 'monthly' ? 'bg-indigo-50 text-indigo-500' : 'bg-emerald-50 text-emerald-500'}`}>
                {viewMode} View
              </span>
            </div>
            <div className="h-[400px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={dashboardData} margin={{ top: 10, right: 10, bottom: 10, left: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 11, fontWeight: 700}} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 11}} tickFormatter={(val) => formatMillions(val)} />
                  <Tooltip 
                    contentStyle={{borderRadius: '20px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)', padding: '16px'}}
                    formatter={(val: number) => formatMillions(val) + ' 백만원'}
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
                영업이익 및 수익성 추이 ({viewMode === 'monthly' ? '월별' : '누적'})
              </h3>
              <p className="text-sm text-slate-400 font-medium mt-1 ml-4 text-xs">
                구간: {displayPeriod === '1H' ? '상반기 (1-6월)' : displayPeriod === '2H' ? '하반기 (7-12월)' : '전체 (1-12월)'} | 단위: 백만원
              </p>
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
                  <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 11}} tickFormatter={(val) => formatMillions(val)} />
                  <Tooltip contentStyle={{borderRadius: '20px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)'}} formatter={(val: number) => formatMillions(val) + ' 백만원'} />
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
              <h3 className="text-xl font-black text-slate-800">상세 경영 지표 현황 ({viewMode === 'monthly' ? '월별' : '누적'})</h3>
              <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1">
                구간: {displayPeriod === '1H' ? '상반기' : displayPeriod === '2H' ? '하반기' : '전체'} | 단위: 백만원 / %
              </p>
            </div>
            <div className="text-right">
                <span className="text-[10px] font-black text-slate-400 bg-white border border-slate-200 px-4 py-2 rounded-xl shadow-sm">
                  {viewMode === 'monthly' ? '각 월의 독립적인 수치입니다' : '1월부터 누적 합산된 수치입니다'}
                </span>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-white text-slate-400 text-[10px] font-black uppercase tracking-widest border-b border-slate-100">
                  <th className="px-10 py-6 sticky left-0 bg-white z-10 w-[240px] shadow-[1px_0_0_#f1f5f9]">구분 지표</th>
                  {MONTH_NAMES.slice(periodRange.start, periodRange.end).map(m => (
                    <th key={m} className="px-6 py-6 text-right">{m}</th>
                  ))}
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
                          {row.isPct ? formatPercent(val) : formatMillions(val)}
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
