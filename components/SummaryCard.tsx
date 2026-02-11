import React from 'react';

interface SummaryCardProps {
  title: string;
  value: string;
  subValue?: string;
  icon: string;
  color: string;
}

const SummaryCard: React.FC<SummaryCardProps> = ({ title, value, subValue, icon, color }) => {
  return (
    <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex items-center gap-5 transition-all hover:shadow-xl hover:-translate-y-1">
      <div className={`w-14 h-14 rounded-2xl ${color} flex items-center justify-center text-white shadow-lg`}>
        <i className={`fas ${icon} text-2xl`}></i>
      </div>
      <div className="flex-1">
        <p className="text-slate-400 text-xs font-bold uppercase tracking-wider">{title}</p>
        <h3 className="text-2xl font-extrabold mt-1 text-slate-800 tracking-tight">{value}</h3>
        {subValue && (
          <p className="text-[11px] font-semibold text-slate-500 mt-1 flex items-center gap-1">
            <span className="w-1 h-1 rounded-full bg-slate-300"></span>
            {subValue}
          </p>
        )}
      </div>
    </div>
  );
};

export default SummaryCard;