import React, { useState } from 'react';
import { PieChart, TrendingUp, ShieldCheck, FileText, CheckCircle2, AlertCircle, Download, ArrowUpRight, DollarSign, FileSpreadsheet, Layers, Info } from 'lucide-react';
import { exportToCsv, exportToExcelXls, exportReportToPdf } from '../utils/exportUtils';

export const PortfolioTaxView: React.FC = () => {
  const [selectedClient, setSelectedClient] = useState<'ramesh' | 'sunita' | 'vikram'>('ramesh');
  const [selectedFy, setSelectedFy] = useState<'2024-2025' | '2025-2026'>('2024-2025');
  const [activeTab, setActiveTab] = useState<'portfolio' | 'tax' | 'stocks' | 'cas'>('tax');

  const CLIENTS_DATA: Record<string, any> = {
    ramesh: {
      investorName: 'Ramesh Sharma',
      pan: 'AAAPS1234K',
      ucc: 'UCC-RAMESH-001',
      profileBadge: 'Moderate Wealth Creation',
      totalInvested: 208926.24,
      currentValue: 384858.51,
      absoluteGain: 175932.27,
      absoluteReturnPct: 84.21,
      portfolioXirr: 15.46,
      assetAllocation: {
        equityPct: 90.98,
        debtPct: 4.40,
        liquidPct: 4.62
      },
      holdings: [
        { name: 'HDFC Top 100 Fund - Regular Growth', units: 300.0, nav: 985.42, xirr: 14.2, type: 'Large Cap' },
        { name: 'Parag Parikh Flexi Cap Fund - Regular Growth', units: 695.19, nav: 78.45, xirr: 18.5, type: 'Flexi Cap' },
        { name: 'HDFC Short Term Debt Fund - Regular Growth', units: 600.0, nav: 28.20, xirr: 7.2, type: 'Debt' },
        { name: 'ICICI Prudential Liquid Fund - Regular Growth', units: 50.0, nav: 355.50, xirr: 6.8, type: 'Liquid' }
      ],
      realizedTaxData: {
        totalRealizedSales: 237906.50,
        totalCost: 125200.00,
        grossGain: 112706.50,
        equityStcg: { gain: 0, ratePct: 20.0, tax: 0 },
        equityLtcg: {
          gain: 97851.50,
          exemptionApplied: 97851.50, // Out of ₹1,25,000
          annualLimit: 125000,
          netTaxable: 0,
          ratePct: 12.5,
          tax: 0
        },
        debtSec50aa: {
          gain: 1355.00,
          ratePct: 30.0,
          tax: 406.50,
          note: 'Deemed STCG under Section 50AA (purchased post 01-Apr-2023)'
        },
        cessAmount: 16.26,
        totalTaxLiability: 422.76,
        fifoLots: [
          {
            scheme: 'HDFC Top 100 Fund - Regular Plan - Growth',
            purchaseDate: '2017-06-15',
            saleDate: '2024-08-20',
            units: 200,
            purchaseNav: 450.00,
            fmv31Jan2018: 540.00,
            adjustedCostNav: 540.00,
            saleNav: 985.42,
            gainType: 'LTCG',
            taxRate: '12.5%',
            gain: 89084.00,
            isGrandfathered: true
          },
          {
            scheme: 'Parag Parikh Flexi Cap Fund - Regular Plan - Growth',
            purchaseDate: '2022-01-10',
            saleDate: '2024-09-05',
            units: 150,
            purchaseNav: 50.00,
            saleNav: 78.45,
            gainType: 'LTCG',
            taxRate: '12.5%',
            gain: 4267.50,
            isGrandfathered: false
          },
          {
            scheme: 'HDFC Short Term Debt Fund - Regular Plan - Growth',
            purchaseDate: '2023-05-10',
            saleDate: '2024-11-15',
            units: 400,
            purchaseNav: 25.50,
            saleNav: 28.20,
            gainType: 'STCG (Sec 50AA)',
            taxRate: '30.0% (Slab)',
            gain: 1355.00,
            isGrandfathered: false
          }
        ]
      },
      underlyingStocks: [
        { company: 'HDFC Bank Ltd.', isin: 'INE040A01034', sector: 'Financial Services', weight: 8.85, marketCap: 'Large Cap', funds: 'HDFC Top 100, Parag Parikh Flexi Cap' },
        { company: 'ICICI Bank Ltd.', isin: 'INE090A01021', sector: 'Financial Services', weight: 7.92, marketCap: 'Large Cap', funds: 'HDFC Top 100, Parag Parikh Flexi Cap' },
        { company: 'ITC Ltd.', isin: 'INE154A01025', sector: 'Fast Moving Consumer Goods', weight: 6.10, marketCap: 'Large Cap', funds: 'HDFC Top 100, Parag Parikh Flexi Cap' },
        { company: 'Reliance Industries Ltd.', isin: 'INE002A01018', sector: 'Oil Gas & Energy', weight: 5.60, marketCap: 'Large Cap', funds: 'HDFC Top 100 Fund' },
        { company: 'Infosys Ltd.', isin: 'INE009A01021', sector: 'Information Technology', weight: 4.80, marketCap: 'Large Cap', funds: 'HDFC Top 100 Fund' },
        { company: 'Bajaj Holdings & Investment Ltd.', isin: 'INE118A01012', sector: 'Financial Services', weight: 3.90, marketCap: 'Large Cap', funds: 'Parag Parikh Flexi Cap' },
        { company: 'Larsen & Toubro Ltd.', isin: 'INE018A01030', sector: 'Construction & Capital Goods', weight: 3.40, marketCap: 'Large Cap', funds: 'HDFC Top 100 Fund' },
        { company: 'Power Grid Corporation of India', isin: 'INE752E01010', sector: 'Power & Energy', weight: 3.20, marketCap: 'Large Cap', funds: 'Parag Parikh Flexi Cap' },
        { company: 'Coal India Ltd.', isin: 'INE522F01014', sector: 'Metals & Mining', weight: 3.15, marketCap: 'Large Cap', funds: 'Parag Parikh Flexi Cap' },
        { company: 'Bharti Airtel Ltd.', isin: 'INE397D01024', sector: 'Telecommunication', weight: 3.10, marketCap: 'Large Cap', funds: 'HDFC Top 100 Fund' },
        { company: 'Maruti Suzuki India Ltd.', isin: 'INE585B01010', sector: 'Automobile', weight: 2.80, marketCap: 'Large Cap', funds: 'Parag Parikh Flexi Cap' },
        { company: 'HCL Technologies Ltd.', isin: 'INE860A01027', sector: 'Information Technology', weight: 2.50, marketCap: 'Large Cap', funds: 'Parag Parikh Flexi Cap' },
        { company: 'Axis Bank Ltd.', isin: 'INE238A01034', sector: 'Financial Services', weight: 2.20, marketCap: 'Large Cap', funds: 'HDFC Top 100, Parag Parikh Flexi Cap' }
      ],
      sectorBreakdown: [
        { sector: 'Financial Services', weight: 31.8, color: 'bg-[#c5a059]' },
        { sector: 'Information Technology', weight: 14.5, color: 'bg-sky-500' },
        { sector: 'Fast Moving Consumer Goods', weight: 11.2, color: 'bg-emerald-500' },
        { sector: 'Oil Gas & Energy', weight: 8.9, color: 'bg-purple-500' },
        { sector: 'Construction & Capital Goods', weight: 7.4, color: 'bg-amber-500' },
        { sector: 'Automobile', weight: 6.2, color: 'bg-blue-400' },
        { sector: 'Metals, Mining & Telecom', weight: 6.2, color: 'bg-teal-400' },
        { sector: 'Cash Equivalents & Debt', weight: 13.8, color: 'bg-slate-600' }
      ]
    },
    sunita: {
      investorName: 'Sunita Mehta',
      pan: 'BKMPM4920E',
      ucc: 'UCC-SUNITA-002',
      profileBadge: 'Aggressive High Alpha',
      totalInvested: 820000.00,
      currentValue: 1452400.00,
      absoluteGain: 632400.00,
      absoluteReturnPct: 77.12,
      portfolioXirr: 24.80,
      assetAllocation: {
        equityPct: 95.20,
        debtPct: 0.00,
        liquidPct: 4.80
      },
      holdings: [
        { name: 'Nippon India Small Cap Fund - Regular Growth', units: 3100.0, nav: 162.18, xirr: 31.4, type: 'Small Cap' },
        { name: 'Motilal Oswal Midcap Fund - Regular Growth', units: 4200.0, nav: 105.80, xirr: 32.8, type: 'Mid Cap' },
        { name: 'Quant Active Fund - Regular Growth', units: 480.0, nav: 685.12, xirr: 28.1, type: 'Multi Cap' },
        { name: 'Tata Small Cap Fund - Regular Growth', units: 3800.0, nav: 44.80, xirr: 26.5, type: 'Small Cap' }
      ],
      realizedTaxData: {
        totalRealizedSales: 412500.00,
        totalCost: 220000.00,
        grossGain: 192500.00,
        equityStcg: { gain: 32500.00, ratePct: 20.0, tax: 6500.00 },
        equityLtcg: {
          gain: 160000.00,
          exemptionApplied: 125000.00, // Full ₹1,25,000 exemption utilized
          annualLimit: 125000,
          netTaxable: 35000.00,
          ratePct: 12.5,
          tax: 4375.00
        },
        debtSec50aa: { gain: 0, ratePct: 30.0, tax: 0, note: 'No debt holdings redeemed' },
        cessAmount: 435.00,
        totalTaxLiability: 11310.00,
        fifoLots: [
          {
            scheme: 'Quant Active Fund - Regular Plan - Growth',
            purchaseDate: '2023-11-10',
            saleDate: '2024-08-15',
            units: 100,
            purchaseNav: 510.00,
            saleNav: 685.12,
            gainType: 'STCG (Held < 12M)',
            taxRate: '20.0%',
            gain: 17512.00,
            isGrandfathered: false
          },
          {
            scheme: 'Nippon India Small Cap Fund - Regular Plan - Growth',
            purchaseDate: '2021-04-12',
            saleDate: '2024-09-20',
            units: 1000,
            purchaseNav: 65.00,
            saleNav: 162.18,
            gainType: 'LTCG',
            taxRate: '12.5%',
            gain: 97180.00,
            isGrandfathered: false
          }
        ]
      },
      underlyingStocks: [
        { company: 'Jio Financial Services Ltd.', isin: 'INE758E01017', sector: 'Financial Services', weight: 7.20, marketCap: 'Mid Cap', funds: 'Motilal Oswal Midcap' },
        { company: 'Persistent Systems Ltd.', isin: 'INE262H01013', sector: 'Information Technology', weight: 6.40, marketCap: 'Mid Cap', funds: 'Motilal Oswal Midcap' },
        { company: 'Trent Ltd.', isin: 'INE849A01020', sector: 'Consumer Retail', weight: 5.80, marketCap: 'Large Cap', funds: 'Motilal Oswal Midcap' },
        { company: 'Coforge Ltd.', isin: 'INE591G01017', sector: 'Information Technology', weight: 5.10, marketCap: 'Mid Cap', funds: 'Motilal Oswal Midcap' },
        { company: 'Vodafone Idea Ltd.', isin: 'INE669E01016', sector: 'Telecommunication', weight: 4.60, marketCap: 'Mid Cap', funds: 'Motilal Oswal Midcap' },
        { company: 'Kalyan Jewellers India Ltd.', isin: 'INE303R01014', sector: 'Consumer Goods', weight: 4.20, marketCap: 'Mid Cap', funds: 'Motilal Oswal Midcap' },
        { company: 'Quess Corp Ltd.', isin: 'INE401201019', sector: 'Services', weight: 3.80, marketCap: 'Small Cap', funds: 'Tata Small Cap Fund' },
        { company: 'Radico Khaitan Ltd.', isin: 'INE944F01012', sector: 'Beverages', weight: 3.20, marketCap: 'Small Cap', funds: 'Tata Small Cap Fund' },
        { company: 'Allcargo Logistics Ltd.', isin: 'INE418H01029', sector: 'Logistics', weight: 2.90, marketCap: 'Small Cap', funds: 'Tata Small Cap Fund' },
        { company: 'Kirloskar Pneumatic Company Ltd.', isin: 'INE784A01023', sector: 'Capital Goods', weight: 2.70, marketCap: 'Small Cap', funds: 'Tata Small Cap Fund' },
        { company: 'Basf India Ltd.', isin: 'INE373A01013', sector: 'Chemicals', weight: 2.50, marketCap: 'Small Cap', funds: 'Tata Small Cap Fund' }
      ],
      sectorBreakdown: [
        { sector: 'Information Technology', weight: 24.5, color: 'bg-sky-500' },
        { sector: 'Consumer Retail & Services', weight: 22.8, color: 'bg-[#c5a059]' },
        { sector: 'Financial Services', weight: 18.2, color: 'bg-purple-500' },
        { sector: 'Capital Goods & Industrial', weight: 14.1, color: 'bg-emerald-500' },
        { sector: 'Telecommunication', weight: 7.2, color: 'bg-amber-500' },
        { sector: 'Chemicals & Others', weight: 13.2, color: 'bg-slate-600' }
      ]
    },
    vikram: {
      investorName: 'Col. Vikramaditya Rathore',
      pan: 'ACZPR8102J',
      ucc: 'UCC-VIKRAM-003',
      profileBadge: 'Conservative Retirement Cashflow',
      totalInvested: 3500000.00,
      currentValue: 4820500.00,
      absoluteGain: 1320500.00,
      absoluteReturnPct: 37.73,
      portfolioXirr: 11.20,
      assetAllocation: {
        equityPct: 42.50,
        debtPct: 45.20,
        liquidPct: 12.30
      },
      holdings: [
        { name: 'ICICI Prudential Balanced Advantage Fund - Regular Growth', units: 26000.0, nav: 78.45, xirr: 13.9, type: 'Hybrid BAF' },
        { name: 'SBI Bluechip Fund - Regular Growth', units: 15000.0, nav: 98.45, xirr: 14.8, type: 'Large Cap' },
        { name: 'ICICI Prudential All Seasons Bond Fund - Regular Growth', units: 58000.0, nav: 36.80, xirr: 7.9, type: 'Debt' },
        { name: 'HDFC Liquid Fund - Regular Growth', units: 120.0, nav: 4890.20, xirr: 6.9, type: 'Liquid' }
      ],
      realizedTaxData: {
        totalRealizedSales: 420000.00, // Monthly SWP totaling 4.2 Lakhs
        totalCost: 340000.00,
        grossGain: 80000.00,
        equityStcg: { gain: 0, ratePct: 20.0, tax: 0 },
        equityLtcg: {
          gain: 55000.00,
          exemptionApplied: 55000.00, // Fully exempt under ₹1.25L
          annualLimit: 125000,
          netTaxable: 0,
          ratePct: 12.5,
          tax: 0
        },
        debtSec50aa: {
          gain: 25000.00,
          ratePct: 30.0,
          tax: 7500.00,
          note: 'SWP redemptions from Debt fund purchased after 01-Apr-2023'
        },
        cessAmount: 300.00,
        totalTaxLiability: 7800.00,
        fifoLots: [
          {
            scheme: 'ICICI Prudential Balanced Advantage Fund - Growth',
            purchaseDate: '2020-03-25',
            saleDate: '2024-10-01',
            units: 1200,
            purchaseNav: 42.00,
            saleNav: 78.45,
            gainType: 'LTCG (SWP)',
            taxRate: '12.5%',
            gain: 43740.00,
            isGrandfathered: false
          },
          {
            scheme: 'ICICI Prudential All Seasons Bond Fund - Growth',
            purchaseDate: '2023-04-15',
            saleDate: '2024-10-01',
            units: 3000,
            purchaseNav: 31.00,
            saleNav: 36.80,
            gainType: 'STCG (Sec 50AA SWP)',
            taxRate: '30.0%',
            gain: 17400.00,
            isGrandfathered: false
          }
        ]
      },
      underlyingStocks: [
        { company: 'Government of India 7.18% GS 2033', isin: 'IN0020230085', sector: 'Sovereign Debt (G-Sec)', weight: 32.50, marketCap: 'Sovereign', funds: 'ICICI Pru All Seasons Bond' },
        { company: 'State Development Loans (SDLs)', isin: 'IN2220200155', sector: 'State Government Bonds', weight: 15.20, marketCap: 'State Sovereign', funds: 'ICICI Pru All Seasons Bond' },
        { company: 'HDFC Bank Ltd.', isin: 'INE040A01034', sector: 'Financial Services', weight: 8.40, marketCap: 'Large Cap', funds: 'ICICI Pru BAF, SBI Bluechip' },
        { company: 'ICICI Bank Ltd.', isin: 'INE090A01021', sector: 'Financial Services', weight: 7.80, marketCap: 'Large Cap', funds: 'ICICI Pru BAF, SBI Bluechip' },
        { company: 'Reliance Industries Ltd.', isin: 'INE002A01018', sector: 'Oil & Gas', weight: 6.90, marketCap: 'Large Cap', funds: 'ICICI Pru BAF, SBI Bluechip' },
        { company: 'Infosys Ltd.', isin: 'INE009A01021', sector: 'Information Technology', weight: 5.40, marketCap: 'Large Cap', funds: 'SBI Bluechip Fund' },
        { company: 'Larsen & Toubro Ltd.', isin: 'INE018A01030', sector: 'Construction', weight: 4.80, marketCap: 'Large Cap', funds: 'ICICI Pru BAF' },
        { company: 'TREPS / Overnight Cash', isin: 'N/A', sector: 'Cash Equivalents', weight: 19.00, marketCap: 'Cash', funds: 'HDFC Liquid Fund' }
      ],
      sectorBreakdown: [
        { sector: 'Sovereign Debt & G-Secs', weight: 47.7, color: 'bg-sky-500' },
        { sector: 'Financial Services', weight: 18.5, color: 'bg-[#c5a059]' },
        { sector: 'Cash & Liquid Equivalents', weight: 19.0, color: 'bg-emerald-500' },
        { sector: 'Energy & Industrials', weight: 9.8, color: 'bg-purple-500' },
        { sector: 'Technology', weight: 5.0, color: 'bg-amber-500' }
      ]
    }
  };

  const activeClientData = CLIENTS_DATA[selectedClient];
  const portfolioSummary = activeClientData;
  const realizedTaxData = activeClientData.realizedTaxData;

  const formatInr = (val: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 2
    }).format(val);
  };

  // --- Export Handlers ---
  const handleExportPortfolioPdf = () => {
    const headers = ['Scheme Name', 'Category', 'Units', 'Latest NAV', 'Current Value', 'XIRR'];
    const rows = activeClientData.holdings.map((h: any) => [
      h.name,
      h.type,
      h.units.toFixed(2),
      `₹${h.nav.toFixed(2)}`,
      `₹${Math.round(h.units * h.nav).toLocaleString()}`,
      `${h.xirr}%`
    ]);

    exportReportToPdf({
      title: 'Mutual Fund Portfolio Valuation & XIRR Report',
      subtitle: 'Serviced by: Tanashvi Wealth Advisory (ARN-347849)',
      clientName: activeClientData.investorName,
      pan: activeClientData.pan,
      ucc: activeClientData.ucc,
      summaryCards: [
        { label: 'Current Value', value: formatInr(portfolioSummary.currentValue) },
        { label: 'Total Invested', value: formatInr(portfolioSummary.totalInvested) },
        { label: 'Absolute Gain', value: `+${formatInr(portfolioSummary.absoluteGain)}` },
        { label: 'Portfolio XIRR', value: `${portfolioSummary.portfolioXirr}% p.a.` }
      ],
      headers,
      rows,
      filename: `portfolio_${activeClientData.investorName.toLowerCase().replace(/[^a-z0-9]/g, '_')}.pdf`,
      footerNotes: [
        'Valuations based on latest available NAVs from BSE StAR MF.',
        'XIRR calculated across purchase cashflows and current market value.'
      ]
    });
  };

  const handleExportPortfolioXls = () => {
    const headers = ['Scheme Name', 'Category', 'Units', 'Latest NAV', 'Current Value (INR)', 'XIRR (%)'];
    const rows = activeClientData.holdings.map((h: any) => [
      h.name,
      h.type,
      h.units,
      h.nav,
      Math.round(h.units * h.nav),
      h.xirr
    ]);

    exportToExcelXls(
      `portfolio_${activeClientData.investorName.toLowerCase().replace(/[^a-z0-9]/g, '_')}.xls`,
      'Holdings',
      headers,
      rows,
      {
        title: 'Portfolio Valuation & Allocation Statement',
        clientName: activeClientData.investorName,
        pan: activeClientData.pan,
        subtitle: `Total Portfolio Valuation: ${formatInr(portfolioSummary.currentValue)}`
      }
    );
  };

  const handleExportTaxPdf = () => {
    const headers = ['Scheme Name', 'Purchase Date', 'Sale Date', 'Units', 'Gain Type', 'Gain (₹)', 'Tax Rate', 'Grandfathered'];
    const rows = realizedTaxData.fifoLots.map((lot: any) => [
      lot.scheme,
      lot.purchaseDate,
      lot.saleDate,
      lot.units,
      lot.gainType,
      `₹${lot.gain.toFixed(2)}`,
      lot.taxRate,
      lot.isGrandfathered ? 'Yes (Sec 112A)' : 'No'
    ]);

    exportReportToPdf({
      title: `Capital Gains Statement - FY ${selectedFy}`,
      subtitle: 'Prepared under Section 112A (Equity LTCG) & Section 50AA (Debt STCG) - Finance Act 2024',
      clientName: activeClientData.investorName,
      pan: activeClientData.pan,
      ucc: activeClientData.ucc,
      summaryCards: [
        { label: 'Total Realized Sales', value: formatInr(realizedTaxData.totalRealizedSales) },
        { label: 'Gross Capital Gain', value: formatInr(realizedTaxData.grossGain) },
        { label: 'Sec 112A Exemption', value: formatInr(realizedTaxData.equityLtcg.exemptionApplied) },
        { label: 'Net Tax Liability', value: formatInr(realizedTaxData.totalTaxLiability) }
      ],
      headers,
      rows,
      filename: `capital_gains_tax_${activeClientData.investorName.toLowerCase().replace(/[^a-z0-9]/g, '_')}_${selectedFy}.pdf`,
      footerNotes: [
        'Post July 23, 2024 rates applied: Equity STCG @ 20%, Equity LTCG @ 12.5%.',
        'Section 112A annual exemption limit of ₹1,25,000 applied to Equity LTCG.',
        'Debt schemes purchased on or after 01-Apr-2023 classified as STCG under Section 50AA.'
      ]
    });
  };

  const handleExportTaxXls = () => {
    const headers = ['Scheme Name', 'Purchase Date', 'Sale Date', 'Units', 'Gain Type', 'Capital Gain (INR)', 'Tax Rate', 'Grandfathered'];
    const rows = realizedTaxData.fifoLots.map((lot: any) => [
      lot.scheme,
      lot.purchaseDate,
      lot.saleDate,
      lot.units,
      lot.gainType,
      lot.gain,
      lot.taxRate,
      lot.isGrandfathered ? 'YES' : 'NO'
    ]);

    exportToExcelXls(
      `tax_statement_${activeClientData.investorName.toLowerCase().replace(/[^a-z0-9]/g, '_')}_${selectedFy}.xls`,
      'Tax Lots',
      headers,
      rows,
      {
        title: `Capital Gains Tax Statement - FY ${selectedFy}`,
        clientName: activeClientData.investorName,
        pan: activeClientData.pan,
        subtitle: `Total Tax Liability: ${formatInr(realizedTaxData.totalTaxLiability)}`
      }
    );
  };

  const handleExportStocksPdf = () => {
    const headers = ['Company Name', 'ISIN', 'Sector', 'Market Cap', 'Weight (%)', 'Value (INR)', 'Contributing Schemes'];
    const rows = (activeClientData.underlyingStocks || []).map((s: any) => [
      s.company,
      s.isin,
      s.sector,
      s.marketCap,
      `${s.weight.toFixed(2)}%`,
      `₹${Math.round(portfolioSummary.currentValue * (s.weight / 100)).toLocaleString()}`,
      s.funds
    ]);

    exportReportToPdf({
      title: 'Mutual Fund Look-Through Stock Holdings & Sector Report',
      subtitle: `Client: ${activeClientData.investorName} (${activeClientData.ucc}) · AMFI Portfolio Disclosures`,
      summaryCards: [
        { label: 'Total Portfolio', value: formatInr(portfolioSummary.currentValue) },
        { label: 'Underlying Stocks', value: `${activeClientData.underlyingStocks?.length || 0} Companies` },
        { label: 'Top Sector', value: activeClientData.sectorBreakdown?.[0]?.sector || 'Financials' },
        { label: 'Data Source', value: 'AMC Portfolio Disclosures' }
      ],
      headers,
      rows,
      filename: `underlying_stocks_${activeClientData.investorName.toLowerCase().replace(/[^a-z0-9]/g, '_')}.pdf`,
      footerNotes: [
        'Underlying company holdings are derived from official AMC Monthly Portfolio Disclosures filed under SEBI regulations.',
        'Percentages reflect the effective weighted look-through across all mutual fund folios held by the investor.'
      ]
    });
  };

  const handleExportStocksXls = () => {
    const headers = ['Company Name', 'ISIN', 'Industry Sector', 'Market Cap', 'Weight (%)', 'Effective Value (INR)', 'Contributing Schemes'];
    const rows = (activeClientData.underlyingStocks || []).map((s: any) => [
      s.company,
      s.isin,
      s.sector,
      s.marketCap,
      s.weight,
      Math.round(portfolioSummary.currentValue * (s.weight / 100)),
      s.funds
    ]);

    exportToExcelXls(
      `underlying_stocks_${activeClientData.investorName.toLowerCase().replace(/[^a-z0-9]/g, '_')}.xls`,
      'Stock Holdings',
      headers,
      rows,
      {
        title: 'Mutual Fund Look-Through Stock Holdings & Sector Analysis',
        clientName: activeClientData.investorName,
        pan: activeClientData.pan,
        subtitle: `Total Portfolio Valuation: ${formatInr(portfolioSummary.currentValue)}`
      }
    );
  };

  return (
    <div className="space-y-6">
      {/* Top Banner (AdvisorKhoj Feature Banner) */}
      <div className="p-6 rounded-xl bg-gradient-to-r from-[#0a192f] via-[#0d213f] to-[#0a192f] border border-[#c5a059]/40 shadow-xl space-y-4">
        {/* Client Switcher Pill Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <span className="text-xs text-[#c5a059] uppercase tracking-wider font-semibold font-serif">
              Investor Portfolio:
            </span>
            <div className="flex bg-slate-950 p-1 rounded-lg border border-slate-800 text-xs">
              <button
                onClick={() => setSelectedClient('ramesh')}
                className={`px-3 py-1 rounded font-medium transition cursor-pointer ${
                  selectedClient === 'ramesh'
                    ? 'bg-[#c5a059] text-slate-950 font-bold shadow'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Ramesh Sharma (Core)
              </button>
              <button
                onClick={() => setSelectedClient('sunita')}
                className={`px-3 py-1 rounded font-medium transition cursor-pointer ${
                  selectedClient === 'sunita'
                    ? 'bg-[#c5a059] text-slate-950 font-bold shadow'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Sunita Mehta (Alpha)
              </button>
              <button
                onClick={() => setSelectedClient('vikram')}
                className={`px-3 py-1 rounded font-medium transition cursor-pointer ${
                  selectedClient === 'vikram'
                    ? 'bg-[#c5a059] text-slate-950 font-bold shadow'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Col. Vikramaditya (SWP)
              </button>
            </div>
          </div>

          <span className="text-xs text-slate-400 font-mono">
            Profile: <strong className="text-white">{portfolioSummary.profileBadge}</strong>
          </span>
        </div>

        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-[#c5a059]/10 border border-[#c5a059]/30 flex items-center justify-center text-[#c5a059]">
              <FileText className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-serif font-bold text-lg text-white">
                  {portfolioSummary.investorName}
                </span>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-[#c5a059]/15 text-[#c5a059] border border-[#c5a059]/30 font-semibold">
                  PAN: {portfolioSummary.pan}
                </span>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-slate-800 text-slate-300 border border-slate-700">
                  UCC: {portfolioSummary.ucc}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                AMFI Registered Distributor ARN-347849 · BSE StAR MF v2 Portfolio Ledger
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setActiveTab('tax')}
              className={`px-3 py-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer shadow ${
                activeTab === 'tax'
                  ? 'bg-[#c5a059] text-slate-950 font-bold'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              <ShieldCheck className="w-4 h-4" />
              Capital Gains
            </button>
            <button
              onClick={() => setActiveTab('portfolio')}
              className={`px-3 py-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer ${
                activeTab === 'portfolio'
                  ? 'bg-[#c5a059] text-slate-950 font-bold'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              <PieChart className="w-4 h-4" />
              Holdings & XIRR
            </button>
            <button
              onClick={() => setActiveTab('stocks')}
              className={`px-3 py-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer ${
                activeTab === 'stocks'
                  ? 'bg-[#c5a059] text-slate-950 font-bold'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              <Layers className="w-4 h-4" />
              Underlying Shares & Sectors
            </button>

            {activeTab === 'stocks' ? (
              <>
                <button
                  onClick={handleExportStocksPdf}
                  className="px-3 py-2 bg-gradient-to-r from-[#c5a059] to-amber-600 hover:from-amber-500 hover:to-amber-700 text-slate-950 font-bold rounded-lg text-xs flex items-center gap-1.5 shadow cursor-pointer"
                  title="Download Underlying Stock Holdings PDF"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Stocks PDF</span>
                </button>
                <button
                  onClick={handleExportStocksXls}
                  className="px-2.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-medium rounded-lg text-xs flex items-center gap-1.5 cursor-pointer"
                  title="Export Stock Holdings to Excel (.xls)"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
                  <span>XLS</span>
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={handleExportPortfolioPdf}
                  className="px-3 py-2 bg-gradient-to-r from-[#c5a059] to-amber-600 hover:from-amber-500 hover:to-amber-700 text-slate-950 font-bold rounded-lg text-xs flex items-center gap-1.5 shadow cursor-pointer"
                  title="Download Branded Portfolio PDF"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Portfolio PDF</span>
                </button>
                <button
                  onClick={handleExportPortfolioXls}
                  className="px-2.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-medium rounded-lg text-xs flex items-center gap-1.5 cursor-pointer"
                  title="Export Portfolio Holdings to Excel (.xls)"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
                  <span>XLS</span>
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Capital Gains View */}
      {activeTab === 'tax' && (
        <div className="space-y-6">
          {/* Statutory Regime Info Card */}
          <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 text-xs font-semibold text-emerald-400">
                <CheckCircle2 className="w-4 h-4" />
                <span>Union Budget 2024-25 Income Tax Regime Active</span>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                Post-July 23, 2024: Equity STCG @ 20%, LTCG @ 12.5% with ₹1,25,000 annual exemption limit. Section 112A grandfathering applied.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs text-slate-400">Assessment FY:</span>
              <select
                value={selectedFy}
                onChange={(e) => setSelectedFy(e.target.value as any)}
                className="px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-700 text-white font-mono text-xs focus:outline-hidden focus:border-[#c5a059]"
              >
                <option value="2024-2025">FY 2024-2025</option>
                <option value="2025-2026">FY 2025-2026</option>
              </select>
              <button
                onClick={handleExportTaxPdf}
                className="px-3 py-1.5 bg-[#c5a059] hover:bg-amber-500 text-slate-950 font-bold text-xs rounded-lg flex items-center gap-1.5 cursor-pointer shadow"
                title="Download Capital Gains Statement PDF"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Tax PDF</span>
              </button>
              <button
                onClick={handleExportTaxXls}
                className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs rounded-lg flex items-center gap-1 cursor-pointer"
                title="Export Capital Gains Lots to Excel (.xls)"
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
                <span>XLS</span>
              </button>
            </div>
          </div>

          {/* Tax Metrics Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-4 rounded-xl bg-[#0a192f] border border-slate-800">
              <span className="text-xs text-slate-400 block">Total Realized Sales</span>
              <span className="text-xl font-mono font-bold text-white mt-1 block">
                {formatInr(realizedTaxData.totalRealizedSales)}
              </span>
              <span className="text-[11px] text-slate-500">Gross Gain: {formatInr(realizedTaxData.grossGain)}</span>
            </div>

            <div className="p-4 rounded-xl bg-[#0a192f] border border-emerald-500/30">
              <span className="text-xs text-emerald-400 block">Equity LTCG (Exempt)</span>
              <span className="text-xl font-mono font-bold text-white mt-1 block">
                {formatInr(realizedTaxData.equityLtcg.gain)}
              </span>
              <span className="text-[11px] text-emerald-300">
                100% covered by ₹1.25L Exemption
              </span>
            </div>

            <div className="p-4 rounded-xl bg-[#0a192f] border border-amber-500/30">
              <span className="text-xs text-amber-400 block">Section 50AA Debt STCG</span>
              <span className="text-xl font-mono font-bold text-white mt-1 block">
                {formatInr(realizedTaxData.debtSec50aa.gain)}
              </span>
              <span className="text-[11px] text-amber-300">Taxed at 30% slab rate</span>
            </div>

            <div className="p-4 rounded-xl bg-[#0a192f] border border-[#c5a059]/40 bg-[#c5a059]/5">
              <span className="text-xs text-[#c5a059] block">Total Tax Liability</span>
              <span className="text-xl font-mono font-bold text-[#c5a059] mt-1 block">
                {formatInr(realizedTaxData.totalTaxLiability)}
              </span>
              <span className="text-[11px] text-slate-400">Includes 4% Health & Ed Cess</span>
            </div>
          </div>

          {/* FIFO Matched Lots Table */}
          <div className="p-6 rounded-xl bg-slate-900/90 border border-slate-800 space-y-4">
            <h3 className="text-sm font-serif font-bold text-white flex items-center justify-between">
              <span>FIFO Redemption Lot Matching Schedule (Budget 2024 Rules)</span>
              <span className="text-xs font-mono font-normal text-slate-400">3 Transactions Matched</span>
            </h3>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 uppercase tracking-wider font-semibold">
                    <th className="py-2.5 px-3">Scheme Name</th>
                    <th className="py-2.5 px-3">Purchase Date</th>
                    <th className="py-2.5 px-3">Redemption Date</th>
                    <th className="py-2.5 px-3">Units</th>
                    <th className="py-2.5 px-3">Purchase NAV</th>
                    <th className="py-2.5 px-3">Sale NAV</th>
                    <th className="py-2.5 px-3">Gain Type</th>
                    <th className="py-2.5 px-3 text-right">Taxable Gain</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-mono">
                  {realizedTaxData.fifoLots.map((lot, idx) => (
                    <tr key={idx} className="hover:bg-slate-800/30 transition-colors">
                      <td className="py-3 px-3 font-sans font-medium text-white max-w-xs truncate">
                        {lot.scheme}
                        {lot.isGrandfathered && (
                          <span className="ml-2 px-1.5 py-0.5 rounded text-[9px] bg-amber-950/60 text-amber-300 border border-amber-500/30">
                            Sec 112A Grandfathered (FMV ₹{lot.fmv31Jan2018})
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-3 text-slate-300">{lot.purchaseDate}</td>
                      <td className="py-3 px-3 text-slate-300">{lot.saleDate}</td>
                      <td className="py-3 px-3 text-white">{lot.units}</td>
                      <td className="py-3 px-3 text-slate-300">₹{lot.purchaseNav.toFixed(2)}</td>
                      <td className="py-3 px-3 text-slate-300">₹{lot.saleNav.toFixed(2)}</td>
                      <td className="py-3 px-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] ${
                          lot.gainType.includes('LTCG') 
                            ? 'bg-emerald-950/60 text-emerald-300 border border-emerald-500/30' 
                            : 'bg-amber-950/60 text-amber-300 border border-amber-500/30'
                        }`}>
                          {lot.gainType} ({lot.taxRate})
                        </span>
                      </td>
                      <td className="py-3 px-3 text-right font-bold text-white">
                        {formatInr(lot.gain)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* 3. Underlying Stocks & Sector Composition View */}
      {activeTab === 'stocks' && (
        <div className="space-y-6">
          {/* SEBI Monthly Portfolio Disclosures Info Card */}
          <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <Info className="w-5 h-5 text-[#c5a059] shrink-0 mt-0.5" />
              <div>
                <div className="text-xs font-semibold text-white">
                  SEBI Mandated Look-Through Portfolio Disclosures
                </div>
                <p className="text-xs text-slate-400 mt-0.5">
                  While BSE StAR MF acts as the execution & settlement engine (orders, folios & NAV units), underlying stock holdings and company weights are derived from official AMC Monthly Portfolio Disclosures (mandated under SEBI regulations on the 10th of every month) mapped to the investor's active units.
                </p>
              </div>
            </div>
            <div className="text-right shrink-0">
              <span className="text-[11px] font-mono text-emerald-400 font-semibold px-2 py-1 rounded bg-emerald-950/60 border border-emerald-500/30">
                Latest AMC Disclosures Active
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Col: Sector Breakdown & Market Cap */}
            <div className="space-y-6">
              {/* Sector Breakdown */}
              <div className="p-6 rounded-xl bg-slate-900/90 border border-slate-800 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-serif font-bold text-white flex items-center gap-2">
                    <PieChart className="w-4 h-4 text-[#c5a059]" />
                    <span>Industry Sector Exposure</span>
                  </h3>
                  <span className="text-xs text-slate-400 font-mono">100% Total</span>
                </div>

                <div className="w-full h-3 bg-slate-800 rounded-full overflow-hidden flex">
                  {(activeClientData.sectorBreakdown || []).map((s: any, idx: number) => (
                    <div key={idx} style={{ width: `${s.weight}%` }} className={`${s.color} h-full`} />
                  ))}
                </div>

                <div className="space-y-2.5 pt-2 text-xs">
                  {(activeClientData.sectorBreakdown || []).map((s: any, idx: number) => (
                    <div key={idx} className="flex justify-between items-center py-1 border-b border-slate-800/80">
                      <span className="text-slate-300 flex items-center gap-2">
                        <span className={`w-2.5 h-2.5 rounded-full ${s.color}`} />
                        {s.sector}
                      </span>
                      <span className="font-mono text-white font-semibold">{s.weight}%</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Market Cap Distribution */}
              <div className="p-5 rounded-xl bg-slate-900/90 border border-slate-800 space-y-3 text-xs">
                <h4 className="font-semibold text-white text-xs">Market Capitalization Split</h4>
                <div className="space-y-2">
                  <div className="flex justify-between text-slate-300">
                    <span>Large Cap Stocks</span>
                    <span className="font-mono font-bold text-white">74.5%</span>
                  </div>
                  <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                    <div className="bg-[#c5a059] h-full" style={{ width: '74.5%' }} />
                  </div>

                  <div className="flex justify-between text-slate-300 pt-1">
                    <span>Mid Cap Stocks</span>
                    <span className="font-mono font-bold text-white">16.2%</span>
                  </div>
                  <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                    <div className="bg-sky-500 h-full" style={{ width: '16.2%' }} />
                  </div>

                  <div className="flex justify-between text-slate-300 pt-1">
                    <span>Small Cap Stocks</span>
                    <span className="font-mono font-bold text-white">9.3%</span>
                  </div>
                  <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                    <div className="bg-purple-500 h-full" style={{ width: '9.3%' }} />
                  </div>
                </div>
              </div>
            </div>

            {/* Right 2 Cols: Underlying Shares Table */}
            <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-lg space-y-4">
              <div className="p-5 border-b border-slate-800 flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                    <Layers className="w-4 h-4 text-[#c5a059]" />
                    <span>Top Underlying Company Holdings</span>
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Consolidated look-through equity shares held across {activeClientData.holdings.length} mutual fund schemes.
                  </p>
                </div>
                <div className="text-xs font-mono text-[#c5a059] font-bold">
                  Portfolio Value: {formatInr(portfolioSummary.currentValue)}
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-800/80 text-slate-300 uppercase tracking-wider font-semibold border-b border-slate-700">
                    <tr>
                      <th className="px-4 py-3">Company Name / ISIN</th>
                      <th className="px-4 py-3">Industry Sector</th>
                      <th className="px-4 py-3 text-center">Cap Class</th>
                      <th className="px-4 py-3 text-right">Portfolio Weight</th>
                      <th className="px-4 py-3 text-right">Effective Value</th>
                      <th className="px-4 py-3">Contributing Scheme(s)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                    {(activeClientData.underlyingStocks || []).map((s: any, idx: number) => {
                      const effectiveValue = Math.round(portfolioSummary.currentValue * (s.weight / 100));
                      return (
                        <tr key={idx} className="hover:bg-slate-800/50 transition-colors">
                          <td className="px-4 py-3">
                            <div className="font-semibold text-white">{s.company}</div>
                            <div className="text-[11px] font-mono text-slate-400">{s.isin}</div>
                          </td>
                          <td className="px-4 py-3 text-slate-300">{s.sector}</td>
                          <td className="px-4 py-3 text-center">
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-slate-800 text-slate-300 border border-slate-700">
                              {s.marketCap}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-right font-mono font-bold text-[#c5a059]">
                            {s.weight.toFixed(2)}%
                          </td>
                          <td className="px-4 py-3 text-right font-mono font-medium text-emerald-400">
                            {formatInr(effectiveValue)}
                          </td>
                          <td className="px-4 py-3 text-slate-400 text-[11px] truncate max-w-xs">
                            {s.funds}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Portfolio & XIRR View */}
      {activeTab === 'portfolio' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1 p-6 rounded-xl bg-[#0a192f] border border-[#c5a059]/40 space-y-5">
            <h3 className="text-sm font-serif font-bold text-white uppercase tracking-wider">
              Asset Allocation & XIRR
            </h3>

            <div>
              <span className="text-xs text-slate-400 block">Portfolio XIRR</span>
              <span className="text-4xl font-serif font-bold text-white mt-1 block">
                {portfolioSummary.portfolioXirr}% <span className="text-sm font-sans font-normal text-slate-400">p.a.</span>
              </span>
              <span className="text-xs text-emerald-400 block mt-1">
                Absolute Gain: +{formatInr(portfolioSummary.absoluteGain)} (+{portfolioSummary.absoluteReturnPct}%)
              </span>
            </div>

            <div className="space-y-3 pt-4 border-t border-slate-800 text-xs">
              <div>
                <div className="flex justify-between text-slate-300 mb-1">
                  <span>Equity Funds</span>
                  <span className="font-mono font-semibold">{portfolioSummary.assetAllocation.equityPct}%</span>
                </div>
                <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                  <div className="bg-[#c5a059] h-full" style={{ width: `${portfolioSummary.assetAllocation.equityPct}%` }}></div>
                </div>
              </div>

              <div>
                <div className="flex justify-between text-slate-300 mb-1">
                  <span>Debt Funds</span>
                  <span className="font-mono font-semibold">{portfolioSummary.assetAllocation.debtPct}%</span>
                </div>
                <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                  <div className="bg-sky-500 h-full" style={{ width: `${portfolioSummary.assetAllocation.debtPct}%` }}></div>
                </div>
              </div>

              <div>
                <div className="flex justify-between text-slate-300 mb-1">
                  <span>Liquid / Cash Funds</span>
                  <span className="font-mono font-semibold">{portfolioSummary.assetAllocation.liquidPct}%</span>
                </div>
                <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                  <div className="bg-emerald-500 h-full" style={{ width: `${portfolioSummary.assetAllocation.liquidPct}%` }}></div>
                </div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-2 p-6 rounded-xl bg-slate-900/90 border border-slate-800 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-serif font-bold text-white">Current Active Holdings</h3>
              <span className="text-xs text-slate-400 font-mono">
                {activeClientData.holdings.length} Active Schemes
              </span>
            </div>
            <div className="space-y-3 text-xs">
              {activeClientData.holdings.map((h: any, idx: number) => (
                <div key={idx} className="p-3.5 bg-slate-950/70 rounded-lg border border-slate-800 flex items-center justify-between gap-4 hover:border-slate-700 transition">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-white block">{h.name}</span>
                      <span className="px-1.5 py-0.5 rounded text-[9px] bg-slate-800 text-slate-300 font-mono">
                        {h.type}
                      </span>
                    </div>
                    <span className="text-slate-400 block mt-0.5">
                      {h.units.toFixed(2)} units · Latest NAV ₹{h.nav.toFixed(2)}
                    </span>
                  </div>
                  <div className="text-right font-mono shrink-0">
                    <span className="text-white font-bold block text-sm">
                      {formatInr(h.units * h.nav)}
                    </span>
                    <span className={`text-[11px] font-semibold ${h.xirr >= 15 ? 'text-emerald-400' : h.xirr >= 10 ? 'text-teal-400' : 'text-sky-400'}`}>
                      XIRR: {h.xirr}% p.a.
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 3. Underlying Stocks & Sector Composition View */}
      {activeTab === 'stocks' && (
        <div className="space-y-6">
          {/* SEBI Monthly Portfolio Disclosures Info Card */}
          <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <Info className="w-5 h-5 text-[#c5a059] shrink-0 mt-0.5" />
              <div>
                <div className="text-xs font-semibold text-white">
                  SEBI Mandated Look-Through Portfolio Disclosures
                </div>
                <p className="text-xs text-slate-400 mt-0.5">
                  While BSE StAR MF acts as the execution & settlement engine (orders, folios & NAV units), underlying stock holdings and company weights are derived from official AMC Monthly Portfolio Disclosures (mandated under SEBI regulations on the 10th of every month) mapped to the investor's active units.
                </p>
              </div>
            </div>
            <div className="text-right shrink-0">
              <span className="text-[11px] font-mono text-emerald-400 font-semibold px-2 py-1 rounded bg-emerald-950/60 border border-emerald-500/30">
                Latest AMC Disclosures Active
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Col: Sector Breakdown & Market Cap */}
            <div className="space-y-6">
              {/* Sector Breakdown */}
              <div className="p-6 rounded-xl bg-slate-900/90 border border-slate-800 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-serif font-bold text-white flex items-center gap-2">
                    <PieChart className="w-4 h-4 text-[#c5a059]" />
                    <span>Industry Sector Exposure</span>
                  </h3>
                  <span className="text-xs text-slate-400 font-mono">100% Total</span>
                </div>

                <div className="w-full h-3 bg-slate-800 rounded-full overflow-hidden flex">
                  {(activeClientData.sectorBreakdown || []).map((s: any, idx: number) => (
                    <div key={idx} style={{ width: `${s.weight}%` }} className={`${s.color} h-full`} />
                  ))}
                </div>

                <div className="space-y-2.5 pt-2 text-xs">
                  {(activeClientData.sectorBreakdown || []).map((s: any, idx: number) => (
                    <div key={idx} className="flex justify-between items-center py-1 border-b border-slate-800/80">
                      <span className="text-slate-300 flex items-center gap-2">
                        <span className={`w-2.5 h-2.5 rounded-full ${s.color}`} />
                        {s.sector}
                      </span>
                      <span className="font-mono text-white font-semibold">{s.weight}%</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Market Cap Distribution */}
              <div className="p-5 rounded-xl bg-slate-900/90 border border-slate-800 space-y-3 text-xs">
                <h4 className="font-semibold text-white text-xs">Market Capitalization Split</h4>
                <div className="space-y-2">
                  <div className="flex justify-between text-slate-300">
                    <span>Large Cap Stocks</span>
                    <span className="font-mono font-bold text-white">74.5%</span>
                  </div>
                  <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                    <div className="bg-[#c5a059] h-full" style={{ width: '74.5%' }} />
                  </div>

                  <div className="flex justify-between text-slate-300 pt-1">
                    <span>Mid Cap Stocks</span>
                    <span className="font-mono font-bold text-white">16.2%</span>
                  </div>
                  <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                    <div className="bg-sky-500 h-full" style={{ width: '16.2%' }} />
                  </div>

                  <div className="flex justify-between text-slate-300 pt-1">
                    <span>Small Cap Stocks</span>
                    <span className="font-mono font-bold text-white">9.3%</span>
                  </div>
                  <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                    <div className="bg-purple-500 h-full" style={{ width: '9.3%' }} />
                  </div>
                </div>
              </div>
            </div>

            {/* Right 2 Cols: Underlying Shares Table */}
            <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-lg space-y-4">
              <div className="p-5 border-b border-slate-800 flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                    <Layers className="w-4 h-4 text-[#c5a059]" />
                    <span>Top Underlying Company Holdings</span>
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Consolidated look-through equity shares held across {activeClientData.holdings.length} mutual fund schemes.
                  </p>
                </div>
                <div className="text-xs font-mono text-[#c5a059] font-bold">
                  Portfolio Value: {formatInr(portfolioSummary.currentValue)}
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-800/80 text-slate-300 uppercase tracking-wider font-semibold border-b border-slate-700">
                    <tr>
                      <th className="px-4 py-3">Company Name / ISIN</th>
                      <th className="px-4 py-3">Industry Sector</th>
                      <th className="px-4 py-3 text-center">Cap Class</th>
                      <th className="px-4 py-3 text-right">Portfolio Weight</th>
                      <th className="px-4 py-3 text-right">Effective Value</th>
                      <th className="px-4 py-3">Contributing Scheme(s)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                    {(activeClientData.underlyingStocks || []).map((s: any, idx: number) => {
                      const effectiveValue = Math.round(portfolioSummary.currentValue * (s.weight / 100));
                      return (
                        <tr key={idx} className="hover:bg-slate-800/50 transition-colors">
                          <td className="px-4 py-3">
                            <div className="font-semibold text-white">{s.company}</div>
                            <div className="text-[11px] font-mono text-slate-400">{s.isin}</div>
                          </td>
                          <td className="px-4 py-3 text-slate-300">{s.sector}</td>
                          <td className="px-4 py-3 text-center">
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-slate-800 text-slate-300 border border-slate-700">
                              {s.marketCap}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-right font-mono font-bold text-[#c5a059]">
                            {s.weight.toFixed(2)}%
                          </td>
                          <td className="px-4 py-3 text-right font-mono font-medium text-emerald-400">
                            {formatInr(effectiveValue)}
                          </td>
                          <td className="px-4 py-3 text-slate-400 text-[11px] truncate max-w-xs">
                            {s.funds}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

