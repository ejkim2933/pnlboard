import { MonthlyData, CalculatedMetrics } from '../types';

export const calculateMetrics = (data: MonthlyData): CalculatedMetrics => {
  const { 
    sales, materialCost, adminLabor, mfgLabor, adminOH, mfgOH, depreciation 
  } = data;

  const totalLabor = adminLabor + mfgLabor;
  const totalOH = adminOH + mfgOH;
  const totalMaterial = materialCost;
  const totalFixedCost = totalLabor + totalOH;
  
  // 1. 영업이익 (감가 전): 매출액 - (재료비 + 인건비 합계 + 경비 합계)
  const operatingProfit = sales - (materialCost + totalLabor + totalOH);
  const opMargin = sales > 0 ? (operatingProfit / sales) * 100 : 0;

  // 2. 감가 반영 영업이익 = 영업이익 - 감가상각비
  const opInclDepr = operatingProfit - depreciation;
  const opMarginInclDepr = sales > 0 ? (opInclDepr / sales) * 100 : 0;

  // 3. 비율 지표들
  const materialRatio = sales > 0 ? (totalMaterial / sales) * 100 : 0;
  const laborRatio = sales > 0 ? (totalLabor / sales) * 100 : 0;
  const expenseRatio = sales > 0 ? (totalOH / sales) * 100 : 0;
  
  // 고정비율 (사용자 정의: 인건비 + 경비)
  const fixedCostRatio = sales > 0 ? (totalFixedCost / sales) * 100 : 0;

  // 4. 한계이익률 = (매출 - 변동비[재료비]) / 매출
  const marginalProfit = sales - materialCost;
  const marginalProfitRatio = sales > 0 ? (marginalProfit / sales) * 100 : 0;

  // 5. 손익분기점 (BEP)
  // 고정비 = 인건비 + 경비 + 감가상각비
  const fixedCosts = totalFixedCost + depreciation;
  const bep = marginalProfitRatio > 0 ? fixedCosts / (marginalProfitRatio / 100) : 0;

  return {
    operatingProfit,
    opMargin,
    opInclDepr,
    opMarginInclDepr,
    materialRatio,
    laborRatio,
    expenseRatio,
    fixedCostRatio,
    marginalProfitRatio,
    bep,
    totalLabor,
    totalOH,
    totalMaterial,
    totalFixedCost
  };
};

/**
 * 월별 데이터를 누적(YTD) 데이터로 변환합니다.
 */
export const getCumulativeData = (dataList: MonthlyData[]): MonthlyData[] => {
  const cumulative: MonthlyData[] = [];
  let runningTotal = {
    sales: 0,
    materialCost: 0,
    adminLabor: 0,
    mfgLabor: 0,
    adminOH: 0,
    mfgOH: 0,
    depreciation: 0,
  };

  for (const month of dataList) {
    runningTotal = {
      sales: runningTotal.sales + month.sales,
      materialCost: runningTotal.materialCost + month.materialCost,
      adminLabor: runningTotal.adminLabor + month.adminLabor,
      mfgLabor: runningTotal.mfgLabor + month.mfgLabor,
      adminOH: runningTotal.adminOH + month.adminOH,
      mfgOH: runningTotal.mfgOH + month.mfgOH,
      depreciation: runningTotal.depreciation + month.depreciation,
    };
    cumulative.push({ ...runningTotal });
  }

  return cumulative;
};

export const formatCurrency = (val: number) => {
  return new Intl.NumberFormat('ko-KR', {
    style: 'decimal',
    maximumFractionDigits: 0,
  }).format(val);
};

export const formatMillions = (val: number) => {
  return new Intl.NumberFormat('ko-KR', {
    style: 'decimal',
    maximumFractionDigits: 1,
    minimumFractionDigits: 1,
  }).format(val / 1000000);
};

export const formatPercent = (val: number) => {
  return val.toFixed(1) + '%';
};