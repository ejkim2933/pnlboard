export interface MonthlyData {
  sales: number;           // 매출액
  materialCost: number;    // 재료비
  adminLabor: number;      // 판관 인건비
  mfgLabor: number;        // 제조 인건비
  adminOH: number;         // 판관 경비
  mfgOH: number;           // 제조 경비
  depreciation: number;    // 감가상각비
}

export interface YearData {
  target: MonthlyData[];
  actual: MonthlyData[];
}

export interface CalculatedMetrics {
  operatingProfit: number;      // 영업이익 (감가 전)
  opMargin: number;            // 영업이익률
  opInclDepr: number;          // 감가 반영 영업이익
  opMarginInclDepr: number;    // 감가 반영 영업이익률
  materialRatio: number;       // 재료비율
  laborRatio: number;          // 인건비율
  expenseRatio: number;        // 경비비율
  fixedCostRatio: number;      // 고정비율 (인건비 + 경비)
  marginalProfitRatio: number; // 한계이익률
  bep: number;                 // BEP (손익분기점 매출)
  // 합계 금액 필드 추가
  totalLabor: number;          // 인건비 합계
  totalOH: number;             // 경비 합계
  totalMaterial: number;       // 재료비 합계
  totalFixedCost: number;      // 고정비 합계 (인건비 + 경비)
}

export const MONTH_NAMES = [
  '1월', '2월', '3월', '4월', '5월', '6월', 
  '7월', '8월', '9월', '10월', '11월', '12월'
];

export type DataType = 'target' | 'actual';

export const INITIAL_MONTHLY_DATA: MonthlyData = {
  sales: 0,
  materialCost: 0,
  adminLabor: 0,
  mfgLabor: 0,
  adminOH: 0,
  mfgOH: 0,
  depreciation: 0,
};