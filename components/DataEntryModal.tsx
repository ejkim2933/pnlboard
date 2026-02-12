import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { YearData, DataType, MONTH_NAMES, MonthlyData } from '../types';

interface DataEntryModalProps {
  isOpen: boolean;
  onClose: () => void;
  yearData: YearData;
  onSave: (updatedData: YearData) => void;
}

const DataEntryModal: React.FC<DataEntryModalProps> = ({ isOpen, onClose, yearData, onSave }) => {
  const [localData, setLocalData] = useState<YearData>(yearData);
  const [activeTab, setActiveTab] = useState<DataType>('actual');

  useEffect(() => {
    if (isOpen) {
      setLocalData(JSON.parse(JSON.stringify(yearData)));
    }
  }, [isOpen, yearData]);

  const fields: { key: keyof MonthlyData; label: string }[] = [
    { key: 'sales', label: '매출액' },
    { key: 'materialCost', label: '재료비' },
    { key: 'adminLabor', label: '판관 인건비' },
    { key: 'mfgLabor', label: '제조 인건비' },
    { key: 'adminOH', label: '판관 경비' },
    { key: 'mfgOH', label: '제조 경비' },
    { key: 'depreciation', label: '감가상각비' },
  ];

  const handleChange = (monthIdx: number, field: keyof MonthlyData, type: DataType, value: string) => {
    const cleaned = value.replace(/[^0-9.-]/g, '');
    const numValue = cleaned === '' ? 0 : parseFloat(cleaned);
    
    setLocalData(prev => {
      const nextData = { ...prev };
      const currentList = [...nextData[type]];
      currentList[monthIdx] = { ...currentList[monthIdx], [field]: numValue };
      nextData[type] = currentList;
      return nextData;
    });
  };

  const handlePaste = useCallback((e: React.ClipboardEvent, startMonthIdx: number, startFieldIdx: number) => {
    e.preventDefault();
    const pasteData = e.clipboardData.getData('text');
    if (!pasteData) return;

    const rowsText = pasteData.split(/\r\n|\n|\r/).filter(row => row.trim().length > 0);
    const gridText = rowsText.map(row => row.split('\t'));

    setLocalData(prev => {
      const nextData = JSON.parse(JSON.stringify(prev));
      gridText.forEach((rowText, rOffset) => {
        rowText.forEach((cellText, cOffset) => {
          const mIdx = startMonthIdx + cOffset;
          const fIdx = startFieldIdx + rOffset;
          if (mIdx < 12 && fIdx < fields.length) {
            const fieldKey = fields[fIdx].key;
            const num = parseFloat(cellText.replace(/[^0-9.-]/g, '')) || 0;
            nextData[activeTab][mIdx][fieldKey] = num;
          }
        });
      });
      return nextData;
    });
  }, [activeTab, fields]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-md p-4 animate-in fade-in duration-300">
      <div className="bg-white rounded-[2.5rem] w-full max-w-[95vw] h-[90vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden">
        
        {/* Header with Tab Navigation */}
        <div className="px-10 py-8 bg-slate-50 border-b border-slate-100 flex flex-col gap-6">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white shadow-lg">
                <i className="fas fa-database"></i>
              </div>
              <h2 className="text-2xl font-black text-slate-800 tracking-tight">전사 손익 원본 데이터 관리</h2>
            </div>
            <button onClick={onClose} className="w-10 h-10 rounded-full hover:bg-slate-200 flex items-center justify-center transition-colors">
              <i className="fas fa-times text-slate-400 text-xl"></i>
            </button>
          </div>

          <div className="flex gap-1 bg-slate-200 p-1 rounded-2xl w-fit self-center">
            <button 
              onClick={() => setActiveTab('target')}
              className={`px-8 py-2.5 rounded-xl font-black text-sm transition-all ${activeTab === 'target' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
              <i className="fas fa-bullseye mr-2"></i> 목표 (Plan) 설정
            </button>
            <button 
              onClick={() => setActiveTab('actual')}
              className={`px-8 py-2.5 rounded-xl font-black text-sm transition-all ${activeTab === 'actual' ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
              <i className="fas fa-chart-line mr-2"></i> 실적 (Actual) 입력
            </button>
          </div>
          <p className="text-center text-sm text-slate-400 font-medium -mt-2">
            {activeTab === 'target' 
              ? "경영 목표치를 입력합니다. 한번 설정된 목표는 실제 데이터와 비교하는 기준점이 됩니다." 
              : "매월 발생하는 실제 비용과 매출을 입력합니다. 누적 수치가 아닌 해당 월의 순수 실적을 입력해 주세요."}
          </p>
        </div>

        {/* Spreadsheet Area */}
        <div className="flex-1 overflow-auto bg-slate-100/30 p-8">
          <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-slate-800">
                  <th className="sticky left-0 z-30 bg-slate-800 px-6 py-4 text-left text-[10px] font-black text-slate-300 uppercase tracking-widest border-r border-slate-700 min-w-[200px]">데이터 항목</th>
                  {MONTH_NAMES.map(m => (
                    <th key={m} className="px-4 py-4 text-center text-[10px] font-black text-slate-300 border-r border-slate-700 min-w-[120px]">{m}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {fields.map((field, fIdx) => (
                  <tr key={field.key} className="hover:bg-slate-50 transition-colors group">
                    <td className="sticky left-0 z-20 bg-white group-hover:bg-slate-50 px-6 py-4 border-r border-slate-200 shadow-[2px_0_5px_rgba(0,0,0,0.02)]">
                      <span className="text-sm font-extrabold text-slate-700">{field.label}</span>
                    </td>
                    {MONTH_NAMES.map((_, mIdx) => {
                      const val = localData[activeTab][mIdx][field.key];
                      return (
                        <td key={mIdx} className="p-0 border-r border-slate-100">
                          <input
                            type="text"
                            className={`w-full h-full px-4 py-4 text-right bg-transparent border-none focus:ring-2 ${activeTab === 'target' ? 'focus:ring-blue-500' : 'focus:ring-emerald-500'} focus:bg-white text-sm font-bold text-slate-600 outline-none transition-all`}
                            value={val === 0 ? '' : val}
                            onChange={(e) => handleChange(mIdx, field.key, activeTab, e.target.value)}
                            onPaste={(e) => handlePaste(e, mIdx, fIdx)}
                            placeholder="0"
                          />
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Footer */}
        <div className="px-10 py-6 bg-white border-t border-slate-100 flex justify-between items-center">
          <div className="flex items-center gap-4 text-xs font-bold text-slate-400">
            <span className="flex items-center gap-1"><i className="fas fa-info-circle"></i> 탭(Tab) 구분된 엑셀 데이터를 복사하여 붙여넣을 수 있습니다.</span>
          </div>
          <div className="flex gap-3">
            <button onClick={onClose} className="px-6 py-3 rounded-2xl font-bold text-slate-500 hover:bg-slate-100 transition-all text-sm">취소</button>
            <button 
              onClick={() => { onSave(localData); onClose(); }} 
              className={`px-10 py-3 rounded-2xl text-white font-bold shadow-lg transition-all active:scale-95 text-sm flex items-center gap-2 ${activeTab === 'target' ? 'bg-blue-600 hover:bg-blue-700 shadow-blue-100' : 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-100'}`}
            >
              <i className="fas fa-save"></i> 전체 데이터 저장 및 반영
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DataEntryModal;