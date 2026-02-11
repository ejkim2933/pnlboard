import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { YearData, DataType, MONTH_NAMES, MonthlyData } from '../types';

interface DataEntryModalProps {
  isOpen: boolean;
  onClose: () => void;
  yearData: YearData;
  onSave: (updatedData: YearData) => void;
}

interface GridRow {
  field: keyof MonthlyData;
  type: DataType;
  label: string;
  desc: string;
}

const DataEntryModal: React.FC<DataEntryModalProps> = ({ isOpen, onClose, yearData, onSave }) => {
  const [localData, setLocalData] = useState<YearData>(yearData);

  useEffect(() => {
    if (isOpen) {
      setLocalData(JSON.parse(JSON.stringify(yearData)));
    }
  }, [isOpen, yearData]);

  const gridRows: GridRow[] = useMemo(() => [
    { field: 'sales', type: 'target', label: '매출액', desc: '목표' },
    { field: 'sales', type: 'actual', label: '매출액', desc: '실제' },
    { field: 'materialCost', type: 'target', label: '재료비', desc: '목표' },
    { field: 'materialCost', type: 'actual', label: '재료비', desc: '실제' },
    { field: 'adminLabor', type: 'target', label: '판관 인건비', desc: '목표' },
    { field: 'adminLabor', type: 'actual', label: '판관 인건비', desc: '실제' },
    { field: 'mfgLabor', type: 'target', label: '제조 인건비', desc: '목표' },
    { field: 'mfgLabor', type: 'actual', label: '제조 인건비', desc: '실제' },
    { field: 'adminOH', type: 'target', label: '판관 관리비', desc: '목표' },
    { field: 'adminOH', type: 'actual', label: '판관 관리비', desc: '실제' },
    { field: 'mfgOH', type: 'target', label: '제조 관리비', desc: '목표' },
    { field: 'mfgOH', type: 'actual', label: '제조 관리비', desc: '실제' },
    { field: 'depreciation', type: 'target', label: '감가상각비', desc: '목표' },
    { field: 'depreciation', type: 'actual', label: '감가상각비', desc: '실제' },
  ], []);

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

  const handlePaste = useCallback((e: React.ClipboardEvent, startMonthIdx: number, startRowIdx: number) => {
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
          const gIdx = startRowIdx + rOffset;
          if (mIdx < 12 && gIdx < gridRows.length) {
            const { field, type } = gridRows[gIdx];
            const num = parseFloat(cellText.replace(/[^0-9.-]/g, '')) || 0;
            nextData[type][mIdx][field] = num;
          }
        });
      });
      return nextData;
    });
  }, [gridRows]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-md p-4 animate-in fade-in duration-300">
      <div className="bg-white rounded-[2.5rem] w-full max-w-[95vw] h-[90vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden">
        <div className="px-10 py-8 flex justify-between items-center bg-slate-50 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-indigo-100">
                <i className="fas fa-file-invoice-dollar"></i>
              </div>
              <h2 className="text-2xl font-black text-slate-800 tracking-tight">전사 손익 원본 데이터 관리</h2>
            </div>
            <p className="text-sm text-slate-400 mt-1 font-medium italic">Excel 시트에서 데이터를 복사하여 셀을 클릭한 후 Ctrl+V로 한 번에 입력할 수 있습니다.</p>
          </div>
          <button onClick={onClose} className="w-12 h-12 rounded-full hover:bg-slate-200 flex items-center justify-center transition-colors">
            <i className="fas fa-times text-slate-400 text-xl"></i>
          </button>
        </div>

        <div className="flex-1 overflow-auto bg-slate-100/50 p-8">
          <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-slate-800">
                  <th className="sticky left-0 z-30 bg-slate-800 px-6 py-4 text-left text-[10px] font-black text-slate-300 uppercase tracking-widest border-r border-slate-700 min-w-[200px]">항목 / 구분</th>
                  {MONTH_NAMES.map(m => (
                    <th key={m} className="px-4 py-4 text-center text-[10px] font-black text-slate-300 border-r border-slate-700 min-w-[120px]">{m}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {gridRows.map((row, rIdx) => (
                  <tr key={rIdx} className="hover:bg-indigo-50/30 transition-colors group">
                    <td className="sticky left-0 z-20 bg-white group-hover:bg-indigo-50/50 px-6 py-3 border-r border-slate-200 shadow-[2px_0_5px_rgba(0,0,0,0.02)]">
                      <div className="flex flex-col">
                        <span className={`text-[9px] font-bold uppercase tracking-tighter ${row.type === 'target' ? 'text-blue-500' : 'text-emerald-600'}`}>
                          {row.type === 'target' ? 'Plan (목표)' : 'Actual (실제)'}
                        </span>
                        <span className="text-sm font-extrabold text-slate-700">{row.label}</span>
                      </div>
                    </td>
                    {MONTH_NAMES.map((_, mIdx) => {
                      const val = localData[row.type][mIdx][row.field];
                      return (
                        <td key={mIdx} className="p-0 border-r border-slate-100 group-hover:bg-white transition-all">
                          <input
                            type="text"
                            className="w-full h-full px-4 py-3 text-right bg-transparent border-none focus:ring-2 focus:ring-indigo-500 focus:bg-white text-sm font-bold text-slate-600 outline-none"
                            value={val === 0 ? '' : val}
                            onChange={(e) => handleChange(mIdx, row.field, row.type, e.target.value)}
                            onPaste={(e) => handlePaste(e, mIdx, rIdx)}
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

        <div className="px-10 py-6 bg-white border-t border-slate-100 flex justify-between items-center">
          <div className="flex gap-4">
             <div className="flex items-center gap-2"><div className="w-3 h-3 rounded bg-blue-500"></div><span className="text-[11px] font-bold text-slate-500">목표</span></div>
             <div className="flex items-center gap-2"><div className="w-3 h-3 rounded bg-emerald-500"></div><span className="text-[11px] font-bold text-slate-500">실제</span></div>
          </div>
          <div className="flex gap-3">
            <button onClick={onClose} className="px-6 py-3 rounded-2xl font-bold text-slate-500 hover:bg-slate-100 transition-all text-sm">취소</button>
            <button onClick={() => { onSave(localData); onClose(); }} className="px-10 py-3 rounded-2xl bg-indigo-600 text-white font-bold hover:bg-indigo-700 shadow-lg shadow-indigo-100 transition-all active:scale-95 text-sm flex items-center gap-2">
              <i className="fas fa-check-circle"></i> 대시보드 업데이트 및 저장
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DataEntryModal;