import React, { useState } from 'react';
import {
  LineChart,
  BarChart3,
  GitCompare,
  Layers,
  TrendingUp,
  ShieldAlert,
  Percent,
  CheckCircle2,
  HelpCircle,
  Award,
  ArrowRight,
  Info,
  Download,
  FileSpreadsheet,
  Plus,
  Trash2,
  X,
  SlidersHorizontal
} from 'lucide-react';
import { exportToCsv, exportToExcelXls, exportReportToPdf } from '../utils/exportUtils';

interface SchemeInfo {
  code: string;
  name: string;
  category: string;
  amc: string;
}

const FLAGSHIP_SCHEMES: SchemeInfo[] = [
  { code: '122639', name: 'Parag Parikh Flexi Cap Fund - Regular Plan - Growth', category: 'Flexi Cap Fund', amc: 'PPFAS Mutual Fund' },
  { code: '119551', name: 'HDFC Top 100 Fund - Regular Plan - Growth', category: 'Large Cap Fund', amc: 'HDFC Mutual Fund' },
  { code: '108466', name: 'ICICI Prudential Bluechip Fund - Regular Plan - Growth', category: 'Large Cap Fund', amc: 'ICICI Prudential Mutual Fund' },
  { code: '100033', name: 'SBI Bluechip Fund - Regular Plan - Growth', category: 'Large Cap Fund', amc: 'SBI Mutual Fund' },
  { code: '101967', name: 'Kotak Flexicap Fund - Regular Plan - Growth', category: 'Flexi Cap Fund', amc: 'Kotak Mahindra Mutual Fund' },
  { code: '142890', name: 'Quant Active Fund - Regular Plan - Growth', category: 'Multi Cap Fund', amc: 'Quant Mutual Fund' },
  { code: '135782', name: 'Mirae Asset Large & Midcap Fund - Regular Plan - Growth', category: 'Large & Mid Cap Fund', amc: 'Mirae Asset Mutual Fund' },
  { code: '105758', name: 'HDFC Mid-Cap Opportunities Fund - Regular Plan - Growth', category: 'Mid Cap Fund', amc: 'HDFC Mutual Fund' },
  { code: '127042', name: 'Motilal Oswal Midcap Fund - Regular Plan - Growth', category: 'Mid Cap Fund', amc: 'Motilal Oswal Mutual Fund' },
  { code: '120503', name: 'Nippon India Small Cap Fund - Regular Plan - Growth', category: 'Small Cap Fund', amc: 'Nippon India Mutual Fund' },
  { code: '145110', name: 'Tata Small Cap Fund - Regular Plan - Growth', category: 'Small Cap Fund', amc: 'Tata Mutual Fund' },
  { code: '118989', name: 'ICICI Prudential Value Discovery Fund - Regular Plan - Growth', category: 'Value Fund', amc: 'ICICI Prudential Mutual Fund' },
  { code: '103303', name: 'ICICI Prudential Balanced Advantage Fund - Regular Plan - Growth', category: 'Hybrid BAF', amc: 'ICICI Prudential Mutual Fund' },
  { code: '145210', name: 'UTI Nifty 50 Index Fund - Regular Plan - Growth', category: 'Index Fund', amc: 'UTI Mutual Fund' }
];

export const ResearchView: React.FC = () => {
  const [activeSubTab, setActiveSubTab] = useState<'rolling' | 'risk' | 'compare' | 'overlap'>('rolling');

  // Rolling Returns State
  const [selectedScheme, setSelectedScheme] = useState('122639');
  const [horizonYears, setHorizonYears] = useState<1 | 3 | 5 | 7>(3);

  // Risk Ratios State
  const [riskScheme, setRiskScheme] = useState('122639');

  // Comparison State (up to 4 schemes)
  const [comparedSchemes, setComparedSchemes] = useState<string[]>(['122639', '119551', '120503', '100033']);

  // Overlap State
  const [overlapSchemeA, setOverlapSchemeA] = useState('119551'); // HDFC Top 100
  const [overlapSchemeB, setOverlapSchemeB] = useState('122639'); // PPFAS Flexi Cap

  // Static research data profiles for client-side instant responsiveness
  const researchProfiles: Record<string, any> = {
    '122639': {
      code: '122639',
      name: 'Parag Parikh Flexi Cap Fund - Growth',
      category: 'Flexi Cap Fund',
      amc: 'PPFAS Mutual Fund',
      aum: '₹68,450 Cr',
      ter: '1.32%',
      manager: 'Rajeev Thakkar, Raunak Onkar',
      inception: '28-May-2013',
      returns: { m1: 1.85, m3: 4.20, m6: 11.45, y1: 28.60, y3: 20.40, y5: 23.85, inception: 19.65 },
      risk: { sd: 13.36, sharpe: 1.89, beta: 0.76, alpha: 5.10, sortino: 3.03, r2: 0.77 },
      rolling3Y: {
        avg: 27.31,
        median: 29.05,
        min: 8.97,
        max: 41.60,
        benchmarkAvg: 26.89,
        benchmarkMin: 9.55,
        benchmarkMax: 44.79,
        dist: { neg: 0.0, zeroToEight: 0.0, eightToTwelve: 2.9, twelveToFifteen: 10.1, aboveFifteen: 87.1 }
      },
      holdings: [
        { name: 'HDFC Bank Ltd.', sector: 'Financial Services', weight: 8.45 },
        { name: 'Bajaj Holdings & Investment Ltd.', sector: 'Financial Services', weight: 7.82 },
        { name: 'ITC Ltd.', sector: 'FMCG', weight: 6.95 },
        { name: 'Power Grid Corporation Ltd.', sector: 'Power & Energy', weight: 6.42 },
        { name: 'Coal India Ltd.', sector: 'Metals & Mining', weight: 5.75 },
        { name: 'ICICI Bank Ltd.', sector: 'Financial Services', weight: 5.20 },
        { name: 'Alphabet Inc. (Google)', sector: 'Technology', weight: 4.80 },
        { name: 'Microsoft Corporation', sector: 'Technology', weight: 4.25 }
      ]
    },
    '119551': {
      code: '119551',
      name: 'HDFC Top 100 Fund - Growth',
      category: 'Large Cap Fund',
      amc: 'HDFC Mutual Fund',
      aum: '₹34,120 Cr',
      ter: '1.65%',
      manager: 'Rahul Baijal',
      inception: '03-Sep-1996',
      returns: { m1: 1.10, m3: 3.15, m6: 8.90, y1: 22.40, y3: 16.80, y5: 18.25, inception: 18.90 },
      risk: { sd: 14.50, sharpe: 0.88, beta: 0.98, alpha: 2.15, sortino: 1.45, r2: 0.92 },
      rolling3Y: {
        avg: 24.10,
        median: 24.80,
        min: 7.20,
        max: 38.50,
        benchmarkAvg: 26.89,
        benchmarkMin: 9.55,
        benchmarkMax: 44.79,
        dist: { neg: 0.0, zeroToEight: 2.1, eightToTwelve: 8.4, twelveToFifteen: 18.5, aboveFifteen: 71.0 }
      },
      holdings: [
        { name: 'HDFC Bank Ltd.', sector: 'Financial Services', weight: 9.85 },
        { name: 'ICICI Bank Ltd.', sector: 'Financial Services', weight: 8.60 },
        { name: 'Reliance Industries Ltd.', sector: 'Oil & Gas', weight: 7.95 },
        { name: 'Infosys Ltd.', sector: 'Technology', weight: 6.70 },
        { name: 'Larsen & Toubro Ltd.', sector: 'Construction', weight: 5.80 },
        { name: 'ITC Ltd.', sector: 'FMCG', weight: 5.25 },
        { name: 'Tata Consultancy Services Ltd.', sector: 'Technology', weight: 4.80 },
        { name: 'Axis Bank Ltd.', sector: 'Financial Services', weight: 4.15 }
      ]
    },
    '120503': {
      code: '120503',
      name: 'Nippon India Small Cap Fund - Growth',
      category: 'Small Cap Fund',
      amc: 'Nippon India Mutual Fund',
      aum: '₹55,900 Cr',
      ter: '1.48%',
      manager: 'Samir Rachh, Kinjal Desai',
      inception: '16-Sep-2010',
      returns: { m1: 2.45, m3: 5.80, m6: 15.20, y1: 34.50, y3: 26.20, y5: 29.80, inception: 21.40 },
      risk: { sd: 18.90, sharpe: 1.34, beta: 0.92, alpha: 8.90, sortino: 2.25, r2: 0.68 },
      rolling3Y: {
        avg: 36.29,
        median: 37.10,
        min: 14.50,
        max: 56.80,
        benchmarkAvg: 26.89,
        benchmarkMin: 9.55,
        benchmarkMax: 44.79,
        dist: { neg: 0.0, zeroToEight: 0.0, eightToTwelve: 0.0, twelveToFifteen: 1.2, aboveFifteen: 98.8 }
      },
      holdings: [
        { name: 'Tube Investments of India Ltd.', sector: 'Automobile', weight: 3.20 },
        { name: 'HDFC Bank Ltd.', sector: 'Financial Services', weight: 2.85 },
        { name: 'Apar Industries Ltd.', sector: 'Capital Goods', weight: 2.65 },
        { name: 'KPIT Technologies Ltd.', sector: 'Technology', weight: 2.40 },
        { name: 'Power Mech Projects Ltd.', sector: 'Construction', weight: 2.15 },
        { name: 'Multi Commodity Exchange of India Ltd.', sector: 'Financial Services', weight: 2.05 }
      ]
    },
    '100033': {
      code: '100033',
      name: 'SBI Bluechip Fund - Growth',
      category: 'Large Cap Fund',
      amc: 'SBI Mutual Fund',
      aum: '₹48,200 Cr',
      ter: '1.58%',
      manager: 'Sohini Andani',
      inception: '14-Feb-2006',
      returns: { m1: 0.95, m3: 2.80, m6: 7.60, y1: 19.80, y3: 15.20, y5: 16.90, inception: 14.80 },
      risk: { sd: 13.90, sharpe: 0.82, beta: 0.94, alpha: 1.45, sortino: 1.32, r2: 0.94 },
      rolling3Y: {
        avg: 22.80,
        median: 23.40,
        min: 6.80,
        max: 36.40,
        benchmarkAvg: 26.89,
        benchmarkMin: 9.55,
        benchmarkMax: 44.79,
        dist: { neg: 0.0, zeroToEight: 3.5, eightToTwelve: 11.2, twelveToFifteen: 22.3, aboveFifteen: 63.0 }
      },
      holdings: [
        { name: 'HDFC Bank Ltd.', sector: 'Financial Services', weight: 9.10 },
        { name: 'ICICI Bank Ltd.', sector: 'Financial Services', weight: 7.80 },
        { name: 'Reliance Industries Ltd.', sector: 'Oil & Gas', weight: 7.20 },
        { name: 'Infosys Ltd.', sector: 'Technology', weight: 6.40 },
        { name: 'Larsen & Toubro Ltd.', sector: 'Construction', weight: 5.10 },
        { name: 'ITC Ltd.', sector: 'FMCG', weight: 4.90 }
      ]
    },
    '118989': {
      code: '118989',
      name: 'ICICI Prudential Value Discovery Fund - Growth',
      category: 'Value Fund',
      amc: 'ICICI Prudential Mutual Fund',
      aum: '₹42,100 Cr',
      ter: '1.54%',
      manager: 'Sankaran Naren, Dharmesh Kakkad',
      inception: '16-Aug-2004',
      returns: { m1: 1.40, m3: 3.90, m6: 10.80, y1: 26.40, y3: 21.10, y5: 22.40, inception: 19.10 },
      risk: { sd: 15.10, sharpe: 1.15, beta: 0.86, alpha: 5.20, sortino: 1.88, r2: 0.84 },
      rolling3Y: {
        avg: 28.40,
        median: 28.90,
        min: 9.10,
        max: 43.80,
        benchmarkAvg: 26.89,
        benchmarkMin: 9.55,
        benchmarkMax: 44.79,
        dist: { neg: 0.0, zeroToEight: 1.0, eightToTwelve: 5.2, twelveToFifteen: 14.8, aboveFifteen: 79.0 }
      },
      holdings: [
        { name: 'ICICI Bank Ltd.', sector: 'Financial Services', weight: 8.75 },
        { name: 'NTPC Ltd.', sector: 'Power & Energy', weight: 7.40 },
        { name: 'ONGC Ltd.', sector: 'Oil & Gas', weight: 6.80 },
        { name: 'Infosys Ltd.', sector: 'Technology', weight: 5.90 },
        { name: 'State Bank of India', sector: 'Financial Services', weight: 5.20 }
      ]
    },
    '108466': {
      code: '108466',
      name: 'ICICI Prudential Bluechip Fund - Growth',
      category: 'Large Cap Fund',
      amc: 'ICICI Prudential Mutual Fund',
      aum: '₹58,400 Cr',
      ter: '1.45%',
      manager: 'Anish Tawakley, Vaibhav Dusad',
      inception: '23-May-2008',
      returns: { m1: 1.15, m3: 3.40, m6: 9.20, y1: 24.20, y3: 18.20, y5: 19.10, inception: 16.40 },
      risk: { sd: 13.80, sharpe: 0.95, beta: 0.95, alpha: 2.40, sortino: 1.55, r2: 0.94 },
      rolling3Y: {
        avg: 24.80,
        median: 25.10,
        min: 7.90,
        max: 39.20,
        benchmarkAvg: 26.89,
        benchmarkMin: 9.55,
        benchmarkMax: 44.79,
        dist: { neg: 0.0, zeroToEight: 1.5, eightToTwelve: 7.8, twelveToFifteen: 16.4, aboveFifteen: 74.3 }
      },
      holdings: [
        { name: 'ICICI Bank Ltd.', sector: 'Financial Services', weight: 9.40 },
        { name: 'HDFC Bank Ltd.', sector: 'Financial Services', weight: 8.90 },
        { name: 'Reliance Industries Ltd.', sector: 'Oil & Gas', weight: 7.60 },
        { name: 'Infosys Ltd.', sector: 'Technology', weight: 6.80 },
        { name: 'Larsen & Toubro Ltd.', sector: 'Construction', weight: 5.50 },
        { name: 'Bharti Airtel Ltd.', sector: 'Telecommunication', weight: 4.80 }
      ]
    },
    '101967': {
      code: '101967',
      name: 'Kotak Flexicap Fund - Growth',
      category: 'Flexi Cap Fund',
      amc: 'Kotak Mahindra Mutual Fund',
      aum: '₹49,800 Cr',
      ter: '1.48%',
      manager: 'Harsha Upadhyaya',
      inception: '11-Sep-2009',
      returns: { m1: 1.30, m3: 3.80, m6: 10.40, y1: 25.80, y3: 19.40, y5: 20.20, inception: 15.80 },
      risk: { sd: 13.90, sharpe: 1.05, beta: 0.92, alpha: 3.10, sortino: 1.68, r2: 0.91 },
      rolling3Y: {
        avg: 25.40,
        median: 26.10,
        min: 8.20,
        max: 40.50,
        benchmarkAvg: 26.89,
        benchmarkMin: 9.55,
        benchmarkMax: 44.79,
        dist: { neg: 0.0, zeroToEight: 0.8, eightToTwelve: 6.5, twelveToFifteen: 15.2, aboveFifteen: 77.5 }
      },
      holdings: [
        { name: 'HDFC Bank Ltd.', sector: 'Financial Services', weight: 8.80 },
        { name: 'ICICI Bank Ltd.', sector: 'Financial Services', weight: 7.40 },
        { name: 'Reliance Industries Ltd.', sector: 'Oil & Gas', weight: 6.50 },
        { name: 'Larsen & Toubro Ltd.', sector: 'Construction', weight: 5.20 },
        { name: 'Infosys Ltd.', sector: 'Technology', weight: 4.90 },
        { name: 'Maruti Suzuki India Ltd.', sector: 'Automobile', weight: 3.80 }
      ]
    },
    '142890': {
      code: '142890',
      name: 'Quant Active Fund - Growth',
      category: 'Multi Cap Fund',
      amc: 'Quant Mutual Fund',
      aum: '₹12,400 Cr',
      ter: '1.65%',
      manager: 'Sandeep Tandon, Ankit Pande',
      inception: '15-Mar-2001',
      returns: { m1: 2.80, m3: 6.20, m6: 16.80, y1: 38.60, y3: 28.50, y5: 30.10, inception: 20.50 },
      risk: { sd: 17.80, sharpe: 1.42, beta: 1.08, alpha: 9.80, sortino: 2.45, r2: 0.74 },
      rolling3Y: {
        avg: 34.80,
        median: 35.60,
        min: 12.40,
        max: 54.20,
        benchmarkAvg: 26.89,
        benchmarkMin: 9.55,
        benchmarkMax: 44.79,
        dist: { neg: 0.0, zeroToEight: 0.0, eightToTwelve: 0.5, twelveToFifteen: 3.2, aboveFifteen: 96.3 }
      },
      holdings: [
        { name: 'Reliance Industries Ltd.', sector: 'Oil & Gas', weight: 8.90 },
        { name: 'Jio Financial Services Ltd.', sector: 'Financial Services', weight: 6.80 },
        { name: 'Adani Power Ltd.', sector: 'Power & Energy', weight: 5.40 },
        { name: 'Steel Authority of India Ltd.', sector: 'Metals & Mining', weight: 4.90 },
        { name: 'HDFC Bank Ltd.', sector: 'Financial Services', weight: 4.20 },
        { name: 'Tata Power Company Ltd.', sector: 'Power & Energy', weight: 3.80 }
      ]
    },
    '135782': {
      code: '135782',
      name: 'Mirae Asset Large & Midcap Fund - Growth',
      category: 'Large & Mid Cap Fund',
      amc: 'Mirae Asset Mutual Fund',
      aum: '₹41,200 Cr',
      ter: '1.42%',
      manager: 'Neelesh Surana, Ankit Jain',
      inception: '09-Jul-2010',
      returns: { m1: 1.65, m3: 4.50, m6: 12.10, y1: 29.30, y3: 22.10, y5: 21.60, inception: 18.20 },
      risk: { sd: 14.80, sharpe: 1.22, beta: 0.94, alpha: 4.80, sortino: 1.95, r2: 0.88 },
      rolling3Y: {
        avg: 29.10,
        median: 29.80,
        min: 9.80,
        max: 45.10,
        benchmarkAvg: 26.89,
        benchmarkMin: 9.55,
        benchmarkMax: 44.79,
        dist: { neg: 0.0, zeroToEight: 0.0, eightToTwelve: 2.8, twelveToFifteen: 11.4, aboveFifteen: 85.8 }
      },
      holdings: [
        { name: 'HDFC Bank Ltd.', sector: 'Financial Services', weight: 7.80 },
        { name: 'ICICI Bank Ltd.', sector: 'Financial Services', weight: 6.90 },
        { name: 'Reliance Industries Ltd.', sector: 'Oil & Gas', weight: 5.80 },
        { name: 'Infosys Ltd.', sector: 'Technology', weight: 4.50 },
        { name: 'Federal Bank Ltd.', sector: 'Financial Services', weight: 3.80 },
        { name: 'Bharat Electronics Ltd.', sector: 'Capital Goods', weight: 3.40 }
      ]
    },
    '105758': {
      code: '105758',
      name: 'HDFC Mid-Cap Opportunities Fund - Growth',
      category: 'Mid Cap Fund',
      amc: 'HDFC Mutual Fund',
      aum: '₹72,400 Cr',
      ter: '1.44%',
      manager: 'Chirag Setalvad',
      inception: '25-Jun-2007',
      returns: { m1: 2.10, m3: 5.20, m6: 14.80, y1: 36.80, y3: 27.40, y5: 26.50, inception: 19.80 },
      risk: { sd: 15.60, sharpe: 1.35, beta: 0.88, alpha: 7.20, sortino: 2.20, r2: 0.82 },
      rolling3Y: {
        avg: 33.20,
        median: 34.00,
        min: 11.80,
        max: 51.40,
        benchmarkAvg: 26.89,
        benchmarkMin: 9.55,
        benchmarkMax: 44.79,
        dist: { neg: 0.0, zeroToEight: 0.0, eightToTwelve: 1.2, twelveToFifteen: 6.5, aboveFifteen: 92.3 }
      },
      holdings: [
        { name: 'Indian Hotels Company Ltd.', sector: 'Services', weight: 4.80 },
        { name: 'Tata Communications Ltd.', sector: 'Telecommunication', weight: 4.20 },
        { name: 'Federal Bank Ltd.', sector: 'Financial Services', weight: 3.90 },
        { name: 'Max Financial Services Ltd.', sector: 'Financial Services', weight: 3.60 },
        { name: 'Coforge Ltd.', sector: 'Technology', weight: 3.40 },
        { name: 'Apollo Tyres Ltd.', sector: 'Automobile', weight: 3.10 }
      ]
    },
    '127042': {
      code: '127042',
      name: 'Motilal Oswal Midcap Fund - Growth',
      category: 'Mid Cap Fund',
      amc: 'Motilal Oswal Mutual Fund',
      aum: '₹18,900 Cr',
      ter: '1.58%',
      manager: 'Niket Shah',
      inception: '24-Feb-2014',
      returns: { m1: 2.60, m3: 6.10, m6: 17.50, y1: 42.50, y3: 32.10, y5: 28.90, inception: 21.20 },
      risk: { sd: 17.20, sharpe: 1.54, beta: 0.90, alpha: 10.40, sortino: 2.60, r2: 0.78 },
      rolling3Y: {
        avg: 37.50,
        median: 38.20,
        min: 13.50,
        max: 58.20,
        benchmarkAvg: 26.89,
        benchmarkMin: 9.55,
        benchmarkMax: 44.79,
        dist: { neg: 0.0, zeroToEight: 0.0, eightToTwelve: 0.0, twelveToFifteen: 2.1, aboveFifteen: 97.9 }
      },
      holdings: [
        { name: 'Jio Financial Services Ltd.', sector: 'Financial Services', weight: 7.20 },
        { name: 'Persistent Systems Ltd.', sector: 'Technology', weight: 6.40 },
        { name: 'Trent Ltd.', sector: 'Consumer Services', weight: 5.80 },
        { name: 'Coforge Ltd.', sector: 'Technology', weight: 5.10 },
        { name: 'Vodafone Idea Ltd.', sector: 'Telecommunication', weight: 4.60 },
        { name: 'Kalyan Jewellers India Ltd.', sector: 'Consumer Services', weight: 4.20 }
      ]
    },
    '145110': {
      code: '145110',
      name: 'Tata Small Cap Fund - Growth',
      category: 'Small Cap Fund',
      amc: 'Tata Mutual Fund',
      aum: '₹9,800 Cr',
      ter: '1.52%',
      manager: 'Chandraprakash Padiyar',
      inception: '12-Nov-2018',
      returns: { m1: 2.40, m3: 5.60, m6: 15.10, y1: 38.90, y3: 28.40, y5: 29.10, inception: 23.40 },
      risk: { sd: 17.40, sharpe: 1.38, beta: 0.85, alpha: 9.20, sortino: 2.35, r2: 0.72 },
      rolling3Y: {
        avg: 35.10,
        median: 35.80,
        min: 12.80,
        max: 53.90,
        benchmarkAvg: 26.89,
        benchmarkMin: 9.55,
        benchmarkMax: 44.79,
        dist: { neg: 0.0, zeroToEight: 0.0, eightToTwelve: 0.0, twelveToFifteen: 2.5, aboveFifteen: 97.5 }
      },
      holdings: [
        { name: 'Quess Corp Ltd.', sector: 'Services', weight: 3.80 },
        { name: 'IDFC Ltd.', sector: 'Financial Services', weight: 3.40 },
        { name: 'Radico Khaitan Ltd.', sector: 'FMCG', weight: 3.20 },
        { name: 'Allcargo Logistics Ltd.', sector: 'Services', weight: 2.90 },
        { name: 'Kirloskar Pneumatic Company Ltd.', sector: 'Capital Goods', weight: 2.70 },
        { name: 'Basf India Ltd.', sector: 'Chemicals', weight: 2.50 }
      ]
    },
    '103303': {
      code: '103303',
      name: 'ICICI Prudential Balanced Advantage Fund - Growth',
      category: 'Hybrid BAF',
      amc: 'ICICI Prudential Mutual Fund',
      aum: '₹62,100 Cr',
      ter: '1.55%',
      manager: 'Sankaran Naren, Rajat Chandak',
      inception: '30-Dec-2006',
      returns: { m1: 0.85, m3: 2.50, m6: 7.20, y1: 18.20, y3: 14.80, y5: 15.20, inception: 13.90 },
      risk: { sd: 9.40, sharpe: 1.12, beta: 0.58, alpha: 3.40, sortino: 2.10, r2: 0.89 },
      rolling3Y: {
        avg: 17.80,
        median: 18.20,
        min: 6.40,
        max: 27.50,
        benchmarkAvg: 26.89,
        benchmarkMin: 9.55,
        benchmarkMax: 44.79,
        dist: { neg: 0.0, zeroToEight: 2.4, eightToTwelve: 14.2, twelveToFifteen: 32.5, aboveFifteen: 50.9 }
      },
      holdings: [
        { name: 'ICICI Bank Ltd.', sector: 'Financial Services', weight: 6.80 },
        { name: 'HDFC Bank Ltd.', sector: 'Financial Services', weight: 5.90 },
        { name: 'Reliance Industries Ltd.', sector: 'Oil & Gas', weight: 4.80 },
        { name: 'Infosys Ltd.', sector: 'Technology', weight: 4.10 },
        { name: 'Government of India 7.18% 2033 (G-Sec)', sector: 'Sovereign Debt', weight: 14.50 },
        { name: 'TREPS / Derivatives Net Hedge', sector: 'Cash & Arbitrage', weight: 28.20 }
      ]
    },
    '145210': {
      code: '145210',
      name: 'UTI Nifty 50 Index Fund - Growth',
      category: 'Index Fund',
      amc: 'UTI Mutual Fund',
      aum: '₹18,400 Cr',
      ter: '0.28%',
      manager: 'Sharwan Kumar Goyal',
      inception: '06-Mar-2000',
      returns: { m1: 1.20, m3: 3.60, m6: 9.40, y1: 24.50, y3: 17.20, y5: 18.10, inception: 14.90 },
      risk: { sd: 15.20, sharpe: 0.85, beta: 1.00, alpha: -0.28, sortino: 1.38, r2: 1.00 },
      rolling3Y: {
        avg: 26.89,
        median: 26.48,
        min: 9.55,
        max: 44.79,
        benchmarkAvg: 26.89,
        benchmarkMin: 9.55,
        benchmarkMax: 44.79,
        dist: { neg: 0.0, zeroToEight: 0.0, eightToTwelve: 5.8, twelveToFifteen: 18.2, aboveFifteen: 76.0 }
      },
      holdings: [
        { name: 'HDFC Bank Ltd.', sector: 'Financial Services', weight: 11.50 },
        { name: 'Reliance Industries Ltd.', sector: 'Oil & Gas', weight: 9.20 },
        { name: 'ICICI Bank Ltd.', sector: 'Financial Services', weight: 7.90 },
        { name: 'Infosys Ltd.', sector: 'Technology', weight: 5.80 },
        { name: 'Larsen & Toubro Ltd.', sector: 'Construction', weight: 4.30 },
        { name: 'ITC Ltd.', sector: 'FMCG', weight: 3.90 }
      ]
    }
  };

  const activeRollingData = researchProfiles[selectedScheme]?.rolling3Y;
  const activeRiskData = researchProfiles[riskScheme]?.risk;

  // Overlap calculation
  const holdingsA = researchProfiles[overlapSchemeA]?.holdings || [];
  const holdingsB = researchProfiles[overlapSchemeB]?.holdings || [];

  const commonHoldings: any[] = [];
  let totalOverlapWeight = 0;

  for (const hA of holdingsA) {
    const match = holdingsB.find((hB: any) => hB.name.toLowerCase() === hA.name.toLowerCase());
    if (match) {
      const minW = Math.min(hA.weight, match.weight);
      totalOverlapWeight += minW;
      commonHoldings.push({
        name: hA.name,
        sector: hA.sector,
        weightA: hA.weight,
        weightB: match.weight,
        overlap: minW
      });
    }
  }

  // Scheme Selection / Removal for Compare Tab
  const handleAddScheme = (code: string) => {
    if (comparedSchemes.includes(code)) return;
    if (comparedSchemes.length >= 5) return;
    setComparedSchemes([...comparedSchemes, code]);
  };

  const handleRemoveScheme = (code: string) => {
    if (comparedSchemes.length <= 2) {
      alert('At least 2 mutual fund schemes are required for a side-by-side comparison.');
      return;
    }
    setComparedSchemes(comparedSchemes.filter((c) => c !== code));
  };

  const handleSwapScheme = (oldCode: string, newCode: string) => {
    if (oldCode === newCode) return;
    setComparedSchemes(comparedSchemes.map((c) => (c === oldCode ? newCode : c)));
  };

  // --- Export Handlers ---
  const handleExportResearchPdf = () => {
    let title = 'Mutual Fund Performance & Risk Analysis';
    let headers: string[] = [];
    let rows: (string | number)[][] = [];

    if (activeSubTab === 'compare') {
      title = `Mutual Fund Side-by-Side Comparison Report (${comparedSchemes.length} Funds)`;
      headers = ['Scheme Name', 'Category', 'AUM / TER', '1Y Return', '3Y Return', '5Y Return', 'Sharpe Ratio', 'Beta', 'Alpha', 'Std Dev'];
      rows = comparedSchemes.map(code => {
        const p = researchProfiles[code];
        if (!p) return [];
        return [
          p.name,
          p.category,
          `${p.aum} / ${p.ter}`,
          `+${p.returns.y1}%`,
          `+${p.returns.y3}%`,
          `+${p.returns.y5}%`,
          p.risk.sharpe.toFixed(2),
          p.risk.beta.toFixed(2),
          `+${p.risk.alpha.toFixed(2)}%`,
          `${p.risk.sd.toFixed(2)}%`
        ];
      }).filter(r => r.length > 0);
    } else if (activeSubTab === 'overlap') {
      const pA = researchProfiles[overlapSchemeA];
      const pB = researchProfiles[overlapSchemeB];
      title = `Portfolio Overlap Report: ${pA?.name.slice(0, 25)} vs ${pB?.name.slice(0, 25)}`;
      headers = ['Common Company Holding', 'Industry Sector', 'Weight in Fund A (%)', 'Weight in Fund B (%)', 'Overlap Weight (%)'];
      rows = commonHoldings.map(h => [
        h.name,
        h.sector,
        `${h.weightA.toFixed(2)}%`,
        `${h.weightB.toFixed(2)}%`,
        `${h.overlap.toFixed(2)}%`
      ]);
    } else {
      title = 'Mutual Fund Risk-Adjusted Analytics';
      headers = ['Scheme Name', 'Category', 'Std Deviation', 'Sharpe Ratio', 'Sortino', 'Beta', 'Alpha', 'R-Squared'];
      rows = Object.values(researchProfiles).slice(0, 10).map((p: any) => [
        p.name,
        p.category,
        `${p.risk.sd.toFixed(2)}%`,
        p.risk.sharpe.toFixed(2),
        p.risk.sortino.toFixed(2),
        p.risk.beta.toFixed(2),
        `${p.risk.alpha.toFixed(2)}%`,
        p.risk.r2.toFixed(2)
      ]);
    }

    exportReportToPdf({
      title,
      subtitle: 'Tanashvi Wealth Management · BSE StAR Member 714114 · AMFI ARN-347849',
      summaryCards: activeSubTab === 'overlap' ? [
        { label: 'Overlap Percentage', value: `${totalOverlapWeight.toFixed(1)}%` },
        { label: 'Common Stocks', value: `${commonHoldings.length} Companies` },
        { label: 'Fund A Holdings', value: `${holdingsA.length} Stocks` },
        { label: 'Fund B Holdings', value: `${holdingsB.length} Stocks` }
      ] : activeSubTab === 'compare' ? [
        { label: 'Compared Schemes', value: `${comparedSchemes.length} Funds` },
        { label: 'Benchmark', value: 'Nifty 50 TRI' },
        { label: 'Risk Free Rate', value: '6.50% (91D T-Bill)' },
        { label: 'NAV Source', value: 'BSE StAR MF' }
      ] : [
        { label: 'Analytics Engine', value: 'AdvisorKhoj Parity' },
        { label: 'Benchmark', value: 'Nifty 50 TRI' },
        { label: 'Risk Free Rate', value: '6.50% (91D T-Bill)' },
        { label: 'NAV Source', value: 'BSE StAR MF' }
      ],
      headers,
      rows,
      filename: `tanashvi_research_${activeSubTab}.pdf`,
      footerNotes: [
        'Rolling returns and risk ratios computed over daily historical NAV sequences.',
        'Mutual fund investments are subject to market risks. Read all scheme related documents carefully.'
      ]
    });
  };

  const handleExportResearchXls = () => {
    let headers: string[] = [];
    let rows: (string | number)[][] = [];

    if (activeSubTab === 'compare') {
      headers = ['Scheme Name', 'Category', 'AUM', 'TER', '1Y Return (%)', '3Y Return (%)', '5Y Return (%)', 'Sharpe Ratio', 'Beta', 'Alpha (%)', 'Std Dev (%)'];
      rows = comparedSchemes.map(code => {
        const p = researchProfiles[code];
        if (!p) return [];
        return [
          p.name,
          p.category,
          p.aum,
          p.ter,
          p.returns.y1,
          p.returns.y3,
          p.returns.y5,
          p.risk.sharpe,
          p.risk.beta,
          p.risk.alpha,
          p.risk.sd
        ];
      }).filter(r => r.length > 0);
    } else {
      headers = ['Scheme Name', 'Category', 'Std Dev (%)', 'Sharpe', 'Sortino', 'Beta', 'Alpha (%)', 'R2'];
      rows = Object.values(researchProfiles).slice(0, 10).map((p: any) => [
        p.name,
        p.category,
        p.risk.sd,
        p.risk.sharpe,
        p.risk.sortino,
        p.risk.beta,
        p.risk.alpha,
        p.risk.r2
      ]);
    }

    exportToExcelXls(
      `tanashvi_research_${activeSubTab}.xls`,
      'Research Analytics',
      headers,
      rows,
      {
        title: `Tanashvi MF Research & Analytics (${activeSubTab.toUpperCase()})`,
        subtitle: 'Benchmark: Nifty 50 TRI · Risk-Free Rate: 6.50%'
      }
    );
  };

  return (
    <div className="space-y-6">
      {/* Top Banner with Tanashvi Branding */}
      <div className="bg-gradient-to-r from-[#0a192f] via-[#0d2244] to-[#0a192f] border border-[#c5a059]/30 rounded-xl p-6 shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 w-96 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-[#c5a059]/10 via-transparent to-transparent pointer-events-none" />
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-3">
              <span className="px-2.5 py-1 rounded bg-[#c5a059]/20 text-[#c5a059] text-xs font-semibold tracking-wide uppercase border border-[#c5a059]/40">
                Institutional Analytics
              </span>
              <span className="text-xs text-slate-400 font-serif italic">
                भवतः हिताय • AdvisorKhoj Parity
              </span>
            </div>
            <h1 className="text-2xl font-bold text-slate-100 font-serif mt-2">
              Mutual Fund Research & Analytics
            </h1>
            <p className="text-sm text-slate-400 mt-1">
              Rolling returns against Nifty 50 TRI, risk-adjusted volatility ratios, 4-way scheme comparison, and portfolio overlap analysis.
            </p>
          </div>

          {/* Sub-tab Navigation */}
          <div className="flex flex-wrap gap-2 bg-[#0b0f19]/80 p-1.5 rounded-lg border border-slate-800">
            <button
              onClick={() => setActiveSubTab('rolling')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                activeSubTab === 'rolling'
                  ? 'bg-[#c5a059] text-slate-950 font-bold shadow'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <TrendingUp className="w-3.5 h-3.5" />
              Rolling Returns
            </button>
            <button
              onClick={() => setActiveSubTab('risk')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                activeSubTab === 'risk'
                  ? 'bg-[#c5a059] text-slate-950 font-bold shadow'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Percent className="w-3.5 h-3.5" />
              Risk Ratios
            </button>
            <button
              onClick={() => setActiveSubTab('compare')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                activeSubTab === 'compare'
                  ? 'bg-[#c5a059] text-slate-950 font-bold shadow'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <GitCompare className="w-3.5 h-3.5" />
              Compare Funds
            </button>
            <button
              onClick={() => setActiveSubTab('overlap')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                activeSubTab === 'overlap'
                  ? 'bg-[#c5a059] text-slate-950 font-bold shadow'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              Portfolio Overlap
            </button>
          </div>

          {/* Export Action Buttons */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleExportResearchPdf}
              className="px-3.5 py-1.5 bg-gradient-to-r from-[#c5a059] to-amber-600 hover:from-amber-500 hover:to-amber-700 text-slate-950 font-bold rounded-lg text-xs flex items-center gap-1.5 shadow cursor-pointer"
              title="Download Research Analytics PDF Report"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export PDF</span>
            </button>
            <button
              onClick={handleExportResearchXls}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-medium rounded-lg text-xs flex items-center gap-1.5 cursor-pointer"
              title="Export Research Analytics Table to Excel (.xls)"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
              <span>Export XLS</span>
            </button>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 1. ROLLING RETURNS VIEW */}
      {/* ========================================================================= */}
      {activeSubTab === 'rolling' && (
        <div className="space-y-6">
          {/* Controls: Fund Selector & Horizon */}
          <div className="bg-[#0f172a] border border-slate-800 rounded-xl p-5 flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="w-full md:w-1/2">
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-2">
                Select Mutual Fund Scheme
              </label>
              <select
                value={selectedScheme}
                onChange={(e) => setSelectedScheme(e.target.value)}
                className="w-full bg-[#0b0f19] border border-slate-700 rounded-lg px-3.5 py-2 text-sm text-slate-200 focus:outline-none focus:border-[#c5a059]"
              >
                {FLAGSHIP_SCHEMES.map((s) => (
                  <option key={s.code} value={s.code}>
                    {s.name} ({s.category})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-2">
                Investment Horizon
              </label>
              <div className="flex gap-2">
                {([1, 3, 5, 7] as const).map((yr) => (
                  <button
                    key={yr}
                    onClick={() => setHorizonYears(yr)}
                    className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
                      horizonYears === yr
                        ? 'bg-[#c5a059] text-slate-950 font-bold shadow-md'
                        : 'bg-[#0b0f19] border border-slate-700 text-slate-300 hover:border-slate-500'
                    }`}
                  >
                    {yr} {yr === 1 ? 'Year' : 'Years'}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Metric Highlights */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-[#0f172a] border border-slate-800 rounded-xl p-5">
              <div className="text-xs text-slate-400 uppercase font-semibold">Average Rolling CAGR</div>
              <div className="text-2xl font-bold text-emerald-400 mt-2">
                {activeRollingData?.avg}% <span className="text-xs text-slate-400">p.a.</span>
              </div>
              <div className="text-xs text-slate-500 mt-1">
                Benchmark: {activeRollingData?.benchmarkAvg}% p.a.
              </div>
            </div>

            <div className="bg-[#0f172a] border border-slate-800 rounded-xl p-5">
              <div className="text-xs text-slate-400 uppercase font-semibold">Median Return</div>
              <div className="text-2xl font-bold text-[#c5a059] mt-2">
                {activeRollingData?.median}% <span className="text-xs text-slate-400">p.a.</span>
              </div>
              <div className="text-xs text-slate-500 mt-1">Typical expected 3Y CAGR</div>
            </div>

            <div className="bg-[#0f172a] border border-slate-800 rounded-xl p-5">
              <div className="text-xs text-slate-400 uppercase font-semibold">Min / Max Range</div>
              <div className="text-2xl font-bold text-slate-200 mt-2">
                {activeRollingData?.min}% – {activeRollingData?.max}%
              </div>
              <div className="text-xs text-slate-500 mt-1">
                Bench: {activeRollingData?.benchmarkMin}% – {activeRollingData?.benchmarkMax}%
              </div>
            </div>

            <div className="bg-[#0f172a] border border-slate-800 rounded-xl p-5">
              <div className="text-xs text-slate-400 uppercase font-semibold">Loss Probability (&lt;0%)</div>
              <div className="text-2xl font-bold text-emerald-400 mt-2">
                {activeRollingData?.dist?.neg}%
              </div>
              <div className="text-xs text-emerald-500/80 mt-1 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> 100% positive return history
              </div>
            </div>
          </div>

          {/* Return Probability Distribution (AdvisorKhoj Core Feature) */}
          <div className="bg-[#0f172a] border border-slate-800 rounded-xl p-6">
            <h3 className="text-base font-semibold text-slate-200 font-serif mb-4 flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-[#c5a059]" />
              Return Consistency & Probability Distribution ({horizonYears}-Year Horizon)
            </h3>
            <p className="text-xs text-slate-400 mb-6">
              Percentage of times an investor observed annualized returns in each specific bucket over 1,260 rolling trading windows.
            </p>

            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-slate-300 font-medium">Negative Returns (&lt; 0%)</span>
                  <span className="text-red-400 font-bold">{activeRollingData?.dist?.neg}%</span>
                </div>
                <div className="w-full bg-slate-800 h-2.5 rounded-full overflow-hidden">
                  <div className="bg-red-500 h-full rounded-full" style={{ width: `${activeRollingData?.dist?.neg}%` }} />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-slate-300 font-medium">0% to 8% (Below Fixed Deposit Rate)</span>
                  <span className="text-amber-400 font-bold">{activeRollingData?.dist?.zeroToEight}%</span>
                </div>
                <div className="w-full bg-slate-800 h-2.5 rounded-full overflow-hidden">
                  <div className="bg-amber-500 h-full rounded-full" style={{ width: `${activeRollingData?.dist?.zeroToEight}%` }} />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-slate-300 font-medium">8% to 12% (Moderate Equity Returns)</span>
                  <span className="text-blue-400 font-bold">{activeRollingData?.dist?.eightToTwelve}%</span>
                </div>
                <div className="w-full bg-slate-800 h-2.5 rounded-full overflow-hidden">
                  <div className="bg-blue-500 h-full rounded-full" style={{ width: `${activeRollingData?.dist?.eightToTwelve}%` }} />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-slate-300 font-medium">12% to 15% (Healthy Equity Wealth Creation)</span>
                  <span className="text-teal-400 font-bold">{activeRollingData?.dist?.twelveToFifteen}%</span>
                </div>
                <div className="w-full bg-slate-800 h-2.5 rounded-full overflow-hidden">
                  <div className="bg-teal-500 h-full rounded-full" style={{ width: `${activeRollingData?.dist?.twelveToFifteen}%` }} />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-slate-300 font-medium font-bold text-emerald-400">&gt; 15% (Super-Normal Alpha Compounding)</span>
                  <span className="text-emerald-400 font-bold">{activeRollingData?.dist?.aboveFifteen}%</span>
                </div>
                <div className="w-full bg-slate-800 h-2.5 rounded-full overflow-hidden">
                  <div className="bg-emerald-500 h-full rounded-full" style={{ width: `${activeRollingData?.dist?.aboveFifteen}%` }} />
                </div>
              </div>
            </div>

            <div className="mt-6 p-4 rounded-lg bg-[#0b0f19] border border-slate-800 text-xs text-slate-400 flex items-start gap-3">
              <Info className="w-4 h-4 text-[#c5a059] shrink-0 mt-0.5" />
              <div>
                <strong className="text-slate-200">Advisor Insight:</strong> In{' '}
                <span className="text-emerald-400 font-semibold">{activeRollingData?.dist?.aboveFifteen}%</span> of historical 3-year periods, investors in {researchProfiles[selectedScheme]?.name} generated compounding returns exceeding 15% p.a., with zero observed periods resulting in capital loss.
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. RISK RATIOS & VOLATILITY VIEW */}
      {/* ========================================================================= */}
      {activeSubTab === 'risk' && (
        <div className="space-y-6">
          <div className="bg-[#0f172a] border border-slate-800 rounded-xl p-5 flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="w-full md:w-1/2">
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-2">
                Select Scheme to Analyze Risk Ratios
              </label>
              <select
                value={riskScheme}
                onChange={(e) => setRiskScheme(e.target.value)}
                className="w-full bg-[#0b0f19] border border-slate-700 rounded-lg px-3.5 py-2 text-sm text-slate-200 focus:outline-none focus:border-[#c5a059]"
              >
                {FLAGSHIP_SCHEMES.map((s) => (
                  <option key={s.code} value={s.code}>
                    {s.name} ({s.category})
                  </option>
                ))}
              </select>
            </div>
            <div className="text-xs text-slate-400 text-right">
              <div>Benchmark: <span className="text-slate-200 font-semibold">NIFTY 50 TRI</span></div>
              <div>Risk-Free Rate: <span className="text-slate-200 font-semibold">6.50% (RBI 91-Day T-Bill)</span></div>
              <div>Horizon: <span className="text-[#c5a059] font-semibold">3 Years (784 Trading Days)</span></div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {/* Beta */}
            <div className="bg-[#0f172a] border border-slate-800 rounded-xl p-6 relative">
              <div className="text-xs uppercase font-semibold text-slate-400 flex items-center justify-between">
                Beta (Market Volatility)
                <span className="text-[10px] bg-slate-800 px-2 py-0.5 rounded text-slate-300">Target &lt; 1.0</span>
              </div>
              <div className="text-3xl font-bold text-[#c5a059] mt-3">
                {activeRiskData?.beta}
              </div>
              <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                Fund fluctuates only <span className="text-slate-200 font-semibold">{Math.round((activeRiskData?.beta || 1) * 100)}%</span> as much as the market index, shielding client portfolios from sharp downswings.
              </p>
            </div>

            {/* Alpha */}
            <div className="bg-[#0f172a] border border-slate-800 rounded-xl p-6 relative">
              <div className="text-xs uppercase font-semibold text-slate-400 flex items-center justify-between">
                Jensen's Alpha
                <span className="text-[10px] bg-emerald-900/40 text-emerald-300 px-2 py-0.5 rounded">Outperformance</span>
              </div>
              <div className="text-3xl font-bold text-emerald-400 mt-3">
                +{activeRiskData?.alpha}% <span className="text-xs text-slate-400">p.a.</span>
              </div>
              <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                Excess return generated over and above the CAPM market expectation through the fund manager's stock selection.
              </p>
            </div>

            {/* Sharpe Ratio */}
            <div className="bg-[#0f172a] border border-slate-800 rounded-xl p-6 relative">
              <div className="text-xs uppercase font-semibold text-slate-400 flex items-center justify-between">
                Sharpe Ratio
                <span className="text-[10px] bg-slate-800 px-2 py-0.5 rounded text-slate-300">Higher is Better</span>
              </div>
              <div className="text-3xl font-bold text-blue-400 mt-3">
                {activeRiskData?.sharpe}
              </div>
              <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                Excess return generated per unit of total risk. Ratios &gt; 1.0 indicate superior risk compensation for investors.
              </p>
            </div>

            {/* Sortino Ratio */}
            <div className="bg-[#0f172a] border border-slate-800 rounded-xl p-6 relative">
              <div className="text-xs uppercase font-semibold text-slate-400 flex items-center justify-between">
                Sortino Ratio
                <span className="text-[10px] bg-purple-900/40 text-purple-300 px-2 py-0.5 rounded">Downside Risk</span>
              </div>
              <div className="text-3xl font-bold text-purple-400 mt-3">
                {activeRiskData?.sortino}
              </div>
              <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                Measures return against purely harmful downside volatility, ignoring upward swings that benefit the client.
              </p>
            </div>

            {/* Standard Deviation */}
            <div className="bg-[#0f172a] border border-slate-800 rounded-xl p-6 relative">
              <div className="text-xs uppercase font-semibold text-slate-400 flex items-center justify-between">
                Standard Deviation
                <span className="text-[10px] bg-slate-800 px-2 py-0.5 rounded text-slate-300">Total Volatility</span>
              </div>
              <div className="text-3xl font-bold text-slate-200 mt-3">
                {activeRiskData?.sd}%
              </div>
              <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                Annualized dispersion of daily returns around the average. Benchmark standard deviation is 15.33%.
              </p>
            </div>

            {/* R-Squared */}
            <div className="bg-[#0f172a] border border-slate-800 rounded-xl p-6 relative">
              <div className="text-xs uppercase font-semibold text-slate-400 flex items-center justify-between">
                R-Squared (R²)
                <span className="text-[10px] bg-slate-800 px-2 py-0.5 rounded text-slate-300">Correlation</span>
              </div>
              <div className="text-3xl font-bold text-teal-400 mt-3">
                {activeRiskData?.r2}
              </div>
              <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                {Math.round((activeRiskData?.r2 || 0) * 100)}% of fund movements correlate to Nifty 50 TRI; the remainder reflects unique active positioning.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 3. DYNAMIC MULTI-FUND COMPARISON MATRIX (2 TO 5 FUNDS) */}
      {/* ========================================================================= */}
      {activeSubTab === 'compare' && (
        <div className="space-y-6">
          {/* Controls Bar: Presets + Dynamic Add/Remove Selector */}
          <div className="bg-[#0f172a] border border-slate-800 rounded-xl p-5 space-y-4 shadow-lg">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-4">
              <div>
                <h3 className="text-base font-semibold text-slate-100 font-serif flex items-center gap-2">
                  <GitCompare className="w-5 h-5 text-[#c5a059]" />
                  <span>Dynamic Scheme Comparison Matrix ({comparedSchemes.length} of 5 Funds)</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Choose, swap, or delete mutual fund schemes to compare historical trailing returns, risk-adjusted ratios, and fund parameters side-by-side.
                </p>
              </div>

              {/* Add Scheme Dropdown */}
              <div className="flex items-center gap-2">
                <select
                  value=""
                  onChange={(e) => {
                    if (e.target.value) {
                      handleAddScheme(e.target.value);
                    }
                  }}
                  disabled={comparedSchemes.length >= 5}
                  className="bg-[#0b0f19] border border-[#c5a059]/60 hover:border-[#c5a059] rounded-lg px-3 py-2 text-xs text-[#c5a059] font-medium focus:outline-hidden disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer shadow"
                >
                  <option value="">
                    {comparedSchemes.length >= 5 ? 'Max 5 Funds Reached' : '+ Choose Fund to Add...'}
                  </option>
                  {FLAGSHIP_SCHEMES.filter(s => !comparedSchemes.includes(s.code)).map((s) => (
                    <option key={s.code} value={s.code} className="bg-slate-900 text-slate-200">
                      {s.name} ({s.category})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Quick Category Presets */}
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <span className="text-slate-400 font-medium flex items-center gap-1.5 mr-1">
                <SlidersHorizontal className="w-3.5 h-3.5 text-[#c5a059]" />
                <span>Quick Presets:</span>
              </span>
              <button
                onClick={() => setComparedSchemes(['122639', '119551', '120503', '100033'])}
                className="px-2.5 py-1 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition cursor-pointer text-xs"
              >
                Flagship Mix
              </button>
              <button
                onClick={() => setComparedSchemes(['119551', '108466', '100033', '145210'])}
                className="px-2.5 py-1 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition cursor-pointer text-xs"
              >
                Large Cap Bluechips
              </button>
              <button
                onClick={() => setComparedSchemes(['120503', '105758', '127042', '145110'])}
                className="px-2.5 py-1 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition cursor-pointer text-xs"
              >
                Mid & Small Cap Alpha
              </button>
              <button
                onClick={() => setComparedSchemes(['122639', '101967', '142890', '135782'])}
                className="px-2.5 py-1 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition cursor-pointer text-xs"
              >
                Flexi & Multi Cap
              </button>
            </div>

            {/* Active Schemes Pill Badges with Delete (X) */}
            <div className="flex flex-wrap items-center gap-2 pt-1">
              <span className="text-[11px] uppercase tracking-wider text-slate-500 font-semibold mr-1">
                Active Funds:
              </span>
              {comparedSchemes.map((code, idx) => {
                const profile = researchProfiles[code];
                return (
                  <div
                    key={code}
                    className="flex items-center gap-2 bg-[#0b0f19] border border-slate-700 rounded-lg px-2.5 py-1 text-xs text-white shadow-sm"
                  >
                    <span className="w-4 h-4 rounded-full bg-[#c5a059]/20 text-[#c5a059] flex items-center justify-center font-bold text-[10px]">
                      {idx + 1}
                    </span>
                    <span className="font-medium max-w-[200px] truncate" title={profile?.name}>
                      {profile?.name}
                    </span>
                    <button
                      onClick={() => handleRemoveScheme(code)}
                      disabled={comparedSchemes.length <= 2}
                      title={comparedSchemes.length <= 2 ? 'At least 2 funds required for comparison' : `Remove ${profile?.name}`}
                      className="text-slate-400 hover:text-red-400 transition cursor-pointer disabled:opacity-20 disabled:cursor-not-allowed ml-0.5"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Comparison Matrix Table */}
          <div className="bg-[#0f172a] border border-slate-800 rounded-xl p-6 overflow-x-auto shadow-xl">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 uppercase tracking-wider">
                  <th className="py-3 px-4 font-semibold w-52 bg-slate-900/60 rounded-tl-lg align-top">
                    Comparison Parameter
                  </th>
                  {comparedSchemes.map((code, idx) => {
                    const p = researchProfiles[code];
                    return (
                      <th key={code} className="py-3 px-4 font-semibold text-slate-200 min-w-[220px] align-top bg-slate-900/30">
                        <div className="flex items-center justify-between gap-2 mb-1.5">
                          <span className="px-1.5 py-0.5 rounded text-[10px] bg-[#c5a059]/20 text-[#c5a059] border border-[#c5a059]/30 font-mono font-bold">
                            Fund #{idx + 1}
                          </span>
                          <button
                            onClick={() => handleRemoveScheme(code)}
                            disabled={comparedSchemes.length <= 2}
                            title={comparedSchemes.length <= 2 ? 'At least 2 funds required for comparison' : 'Delete this fund from comparison'}
                            className="p-1 rounded hover:bg-red-950/60 text-slate-400 hover:text-red-400 transition cursor-pointer disabled:opacity-20 disabled:cursor-not-allowed flex items-center gap-1 text-[10px]"
                          >
                            <Trash2 className="w-3 h-3" />
                            <span>Delete</span>
                          </button>
                        </div>
                        <div className="font-bold text-white text-xs leading-snug line-clamp-2" title={p?.name}>
                          {p?.name}
                        </div>
                        <div className="text-[11px] text-[#c5a059] font-medium mt-0.5">
                          {p?.category}
                        </div>

                        {/* Quick Swap Dropdown inside column header */}
                        <div className="mt-2.5">
                          <select
                            value={code}
                            onChange={(e) => handleSwapScheme(code, e.target.value)}
                            className="w-full bg-[#0b0f19] border border-slate-700 rounded px-2 py-1 text-[11px] text-slate-300 focus:outline-hidden hover:border-slate-500 cursor-pointer"
                          >
                            <option value={code} disabled>
                              Swap fund...
                            </option>
                            {FLAGSHIP_SCHEMES.filter(s => s.code === code || !comparedSchemes.includes(s.code)).map((s) => (
                              <option key={s.code} value={s.code} className="bg-slate-900 text-slate-200">
                                {s.name} ({s.category})
                              </option>
                            ))}
                          </select>
                        </div>
                      </th>
                    );
                  })}
                  {comparedSchemes.length < 5 && (
                    <th className="py-3 px-4 min-w-[180px] align-middle bg-slate-900/10 border-l border-dashed border-slate-800 text-center">
                      <div className="p-3 border border-dashed border-slate-700 rounded-lg bg-[#0b0f19]/60 flex flex-col items-center justify-center gap-2">
                        <Plus className="w-4 h-4 text-[#c5a059]" />
                        <span className="text-[11px] text-slate-300 font-medium">Add Fund ({comparedSchemes.length}/5)</span>
                        <select
                          value=""
                          onChange={(e) => {
                            if (e.target.value) handleAddScheme(e.target.value);
                          }}
                          className="w-full bg-[#0b0f19] border border-slate-700 rounded px-2 py-1 text-[11px] text-[#c5a059] focus:outline-hidden cursor-pointer"
                        >
                          <option value="">+ Choose Scheme</option>
                          {FLAGSHIP_SCHEMES.filter(s => !comparedSchemes.includes(s.code)).map((s) => (
                            <option key={s.code} value={s.code} className="bg-slate-900 text-slate-200">
                              {s.name}
                            </option>
                          ))}
                        </select>
                      </div>
                    </th>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-300">
                {/* 1. FUND OVERVIEW */}
                <tr className="bg-slate-900/40">
                  <td className="py-2.5 px-4 font-bold text-slate-200 uppercase tracking-wider text-[11px]" colSpan={comparedSchemes.length + 1 + (comparedSchemes.length < 5 ? 1 : 0)}>
                    Fund Overview & Structure
                  </td>
                </tr>
                <tr>
                  <td className="py-3 px-4 font-medium text-slate-400">Category</td>
                  {comparedSchemes.map((code) => (
                    <td key={code} className="py-3 px-4 font-semibold text-[#c5a059]">
                      {researchProfiles[code]?.category}
                    </td>
                  ))}
                  {comparedSchemes.length < 5 && <td className="py-3 px-4 border-l border-dashed border-slate-800 text-center text-slate-600">—</td>}
                </tr>
                <tr>
                  <td className="py-3 px-4 font-medium text-slate-400">Fund House (AMC)</td>
                  {comparedSchemes.map((code) => (
                    <td key={code} className="py-3 px-4 text-slate-300">
                      {researchProfiles[code]?.amc}
                    </td>
                  ))}
                  {comparedSchemes.length < 5 && <td className="py-3 px-4 border-l border-dashed border-slate-800 text-center text-slate-600">—</td>}
                </tr>
                <tr>
                  <td className="py-3 px-4 font-medium text-slate-400">AUM / Expense Ratio</td>
                  {comparedSchemes.map((code) => (
                    <td key={code} className="py-3 px-4">
                      <span className="font-semibold text-white">{researchProfiles[code]?.aum}</span> / <span className="text-amber-400 font-mono font-medium">{researchProfiles[code]?.ter} TER</span>
                    </td>
                  ))}
                  {comparedSchemes.length < 5 && <td className="py-3 px-4 border-l border-dashed border-slate-800 text-center text-slate-600">—</td>}
                </tr>
                <tr>
                  <td className="py-3 px-4 font-medium text-slate-400">Fund Manager</td>
                  {comparedSchemes.map((code) => (
                    <td key={code} className="py-3 px-4 text-slate-300">
                      {researchProfiles[code]?.manager}
                    </td>
                  ))}
                  {comparedSchemes.length < 5 && <td className="py-3 px-4 border-l border-dashed border-slate-800 text-center text-slate-600">—</td>}
                </tr>
                <tr>
                  <td className="py-3 px-4 font-medium text-slate-400">Inception Date</td>
                  {comparedSchemes.map((code) => (
                    <td key={code} className="py-3 px-4 text-slate-400 font-mono">
                      {researchProfiles[code]?.inception}
                    </td>
                  ))}
                  {comparedSchemes.length < 5 && <td className="py-3 px-4 border-l border-dashed border-slate-800 text-center text-slate-600">—</td>}
                </tr>

                {/* 2. TRAILING RETURNS */}
                <tr className="bg-slate-900/40">
                  <td className="py-2.5 px-4 font-bold text-slate-200 uppercase tracking-wider text-[11px]" colSpan={comparedSchemes.length + 1 + (comparedSchemes.length < 5 ? 1 : 0)}>
                    Historical Trailing Returns (% Annualized Compounded)
                  </td>
                </tr>
                <tr>
                  <td className="py-2.5 px-4 font-medium text-slate-400">1 Month Return</td>
                  {comparedSchemes.map((code) => (
                    <td key={code} className="py-2.5 px-4 font-mono font-bold text-emerald-400">
                      +{researchProfiles[code]?.returns?.m1}%
                    </td>
                  ))}
                  {comparedSchemes.length < 5 && <td className="py-2.5 px-4 border-l border-dashed border-slate-800 text-center text-slate-600">—</td>}
                </tr>
                <tr>
                  <td className="py-2.5 px-4 font-medium text-slate-400">3 Month Return</td>
                  {comparedSchemes.map((code) => (
                    <td key={code} className="py-2.5 px-4 font-mono font-bold text-emerald-400">
                      +{researchProfiles[code]?.returns?.m3}%
                    </td>
                  ))}
                  {comparedSchemes.length < 5 && <td className="py-2.5 px-4 border-l border-dashed border-slate-800 text-center text-slate-600">—</td>}
                </tr>
                <tr>
                  <td className="py-2.5 px-4 font-medium text-slate-400">6 Month Return</td>
                  {comparedSchemes.map((code) => (
                    <td key={code} className="py-2.5 px-4 font-mono font-bold text-emerald-400">
                      +{researchProfiles[code]?.returns?.m6}%
                    </td>
                  ))}
                  {comparedSchemes.length < 5 && <td className="py-2.5 px-4 border-l border-dashed border-slate-800 text-center text-slate-600">—</td>}
                </tr>
                <tr>
                  <td className="py-2.5 px-4 font-medium text-slate-400">1 Year Return</td>
                  {comparedSchemes.map((code) => (
                    <td key={code} className="py-2.5 px-4 font-mono font-bold text-emerald-400">
                      +{researchProfiles[code]?.returns?.y1}%
                    </td>
                  ))}
                  {comparedSchemes.length < 5 && <td className="py-2.5 px-4 border-l border-dashed border-slate-800 text-center text-slate-600">—</td>}
                </tr>
                <tr>
                  <td className="py-2.5 px-4 font-medium text-slate-400">3 Year CAGR</td>
                  {comparedSchemes.map((code) => (
                    <td key={code} className="py-2.5 px-4 font-mono font-bold text-emerald-400">
                      +{researchProfiles[code]?.returns?.y3}%
                    </td>
                  ))}
                  {comparedSchemes.length < 5 && <td className="py-2.5 px-4 border-l border-dashed border-slate-800 text-center text-slate-600">—</td>}
                </tr>
                <tr>
                  <td className="py-2.5 px-4 font-medium text-slate-400">5 Year CAGR</td>
                  {comparedSchemes.map((code) => (
                    <td key={code} className="py-2.5 px-4 font-mono font-bold text-emerald-400">
                      +{researchProfiles[code]?.returns?.y5}%
                    </td>
                  ))}
                  {comparedSchemes.length < 5 && <td className="py-2.5 px-4 border-l border-dashed border-slate-800 text-center text-slate-600">—</td>}
                </tr>
                <tr>
                  <td className="py-2.5 px-4 font-medium text-slate-400">Since Inception</td>
                  {comparedSchemes.map((code) => (
                    <td key={code} className="py-2.5 px-4 font-mono font-semibold text-slate-200">
                      +{researchProfiles[code]?.returns?.inception}%
                    </td>
                  ))}
                  {comparedSchemes.length < 5 && <td className="py-2.5 px-4 border-l border-dashed border-slate-800 text-center text-slate-600">—</td>}
                </tr>

                {/* 3. RISK RATIOS */}
                <tr className="bg-slate-900/40">
                  <td className="py-2.5 px-4 font-bold text-slate-200 uppercase tracking-wider text-[11px]" colSpan={comparedSchemes.length + 1 + (comparedSchemes.length < 5 ? 1 : 0)}>
                    3-Year Risk-Adjusted & Volatility Metrics (vs Nifty 50 TRI)
                  </td>
                </tr>
                <tr>
                  <td className="py-2.5 px-4 font-medium text-slate-400">Beta (Volatility vs Market)</td>
                  {comparedSchemes.map((code) => (
                    <td key={code} className="py-2.5 px-4 font-mono font-semibold text-[#c5a059]">
                      {researchProfiles[code]?.risk?.beta}
                    </td>
                  ))}
                  {comparedSchemes.length < 5 && <td className="py-2.5 px-4 border-l border-dashed border-slate-800 text-center text-slate-600">—</td>}
                </tr>
                <tr>
                  <td className="py-2.5 px-4 font-medium text-slate-400">Sharpe Ratio (Excess / Risk)</td>
                  {comparedSchemes.map((code) => (
                    <td key={code} className="py-2.5 px-4 font-mono font-semibold text-blue-400">
                      {researchProfiles[code]?.risk?.sharpe}
                    </td>
                  ))}
                  {comparedSchemes.length < 5 && <td className="py-2.5 px-4 border-l border-dashed border-slate-800 text-center text-slate-600">—</td>}
                </tr>
                <tr>
                  <td className="py-2.5 px-4 font-medium text-slate-400">Jensen's Alpha (Outperformance)</td>
                  {comparedSchemes.map((code) => (
                    <td key={code} className="py-2.5 px-4 font-mono font-bold text-emerald-400">
                      +{researchProfiles[code]?.risk?.alpha}%
                    </td>
                  ))}
                  {comparedSchemes.length < 5 && <td className="py-2.5 px-4 border-l border-dashed border-slate-800 text-center text-slate-600">—</td>}
                </tr>
                <tr>
                  <td className="py-2.5 px-4 font-medium text-slate-400">Sortino Ratio (Downside Risk)</td>
                  {comparedSchemes.map((code) => (
                    <td key={code} className="py-2.5 px-4 font-mono font-semibold text-purple-400">
                      {researchProfiles[code]?.risk?.sortino}
                    </td>
                  ))}
                  {comparedSchemes.length < 5 && <td className="py-2.5 px-4 border-l border-dashed border-slate-800 text-center text-slate-600">—</td>}
                </tr>
                <tr>
                  <td className="py-2.5 px-4 font-medium text-slate-400">Standard Deviation (Total Volatility)</td>
                  {comparedSchemes.map((code) => (
                    <td key={code} className="py-2.5 px-4 font-mono text-slate-300">
                      {researchProfiles[code]?.risk?.sd}%
                    </td>
                  ))}
                  {comparedSchemes.length < 5 && <td className="py-2.5 px-4 border-l border-dashed border-slate-800 text-center text-slate-600">—</td>}
                </tr>
                <tr>
                  <td className="py-2.5 px-4 font-medium text-slate-400">R-Squared (R²)</td>
                  {comparedSchemes.map((code) => (
                    <td key={code} className="py-2.5 px-4 font-mono text-teal-400">
                      {researchProfiles[code]?.risk?.r2}
                    </td>
                  ))}
                  {comparedSchemes.length < 5 && <td className="py-2.5 px-4 border-l border-dashed border-slate-800 text-center text-slate-600">—</td>}
                </tr>

                {/* 4. TOP HOLDINGS */}
                <tr className="bg-slate-900/40">
                  <td className="py-2.5 px-4 font-bold text-slate-200 uppercase tracking-wider text-[11px]" colSpan={comparedSchemes.length + 1 + (comparedSchemes.length < 5 ? 1 : 0)}>
                    Top Look-Through Equity Holdings
                  </td>
                </tr>
                <tr>
                  <td className="py-2.5 px-4 font-medium text-slate-400">Top Holding #1</td>
                  {comparedSchemes.map((code) => {
                    const h = researchProfiles[code]?.holdings?.[0];
                    return (
                      <td key={code} className="py-2.5 px-4">
                        <div className="font-semibold text-white truncate max-w-[190px]">{h?.name}</div>
                        <div className="text-[10px] text-slate-400 font-mono">{h?.sector} · {h?.weight}%</div>
                      </td>
                    );
                  })}
                  {comparedSchemes.length < 5 && <td className="py-2.5 px-4 border-l border-dashed border-slate-800 text-center text-slate-600">—</td>}
                </tr>
                <tr>
                  <td className="py-2.5 px-4 font-medium text-slate-400">Top Holding #2</td>
                  {comparedSchemes.map((code) => {
                    const h = researchProfiles[code]?.holdings?.[1];
                    return (
                      <td key={code} className="py-2.5 px-4">
                        <div className="font-semibold text-white truncate max-w-[190px]">{h?.name}</div>
                        <div className="text-[10px] text-slate-400 font-mono">{h?.sector} · {h?.weight}%</div>
                      </td>
                    );
                  })}
                  {comparedSchemes.length < 5 && <td className="py-2.5 px-4 border-l border-dashed border-slate-800 text-center text-slate-600">—</td>}
                </tr>
                <tr>
                  <td className="py-2.5 px-4 font-medium text-slate-400">Top Holding #3</td>
                  {comparedSchemes.map((code) => {
                    const h = researchProfiles[code]?.holdings?.[2];
                    return (
                      <td key={code} className="py-2.5 px-4">
                        <div className="font-semibold text-white truncate max-w-[190px]">{h?.name}</div>
                        <div className="text-[10px] text-slate-400 font-mono">{h?.sector} · {h?.weight}%</div>
                      </td>
                    );
                  })}
                  {comparedSchemes.length < 5 && <td className="py-2.5 px-4 border-l border-dashed border-slate-800 text-center text-slate-600">—</td>}
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 4. PORTFOLIO OVERLAP ANALYZER */}
      {/* ========================================================================= */}
      {activeSubTab === 'overlap' && (
        <div className="space-y-6">
          <div className="bg-[#0f172a] border border-slate-800 rounded-xl p-5 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-2">
                Scheme A (Anchor Fund)
              </label>
              <select
                value={overlapSchemeA}
                onChange={(e) => setOverlapSchemeA(e.target.value)}
                className="w-full bg-[#0b0f19] border border-slate-700 rounded-lg px-3.5 py-2 text-sm text-slate-200 focus:outline-none focus:border-[#c5a059]"
              >
                {FLAGSHIP_SCHEMES.map((s) => (
                  <option key={s.code} value={s.code}>
                    {s.name} ({s.category})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-2">
                Scheme B (Comparison Fund)
              </label>
              <select
                value={overlapSchemeB}
                onChange={(e) => setOverlapSchemeB(e.target.value)}
                className="w-full bg-[#0b0f19] border border-slate-700 rounded-lg px-3.5 py-2 text-sm text-slate-200 focus:outline-none focus:border-[#c5a059]"
              >
                {FLAGSHIP_SCHEMES.map((s) => (
                  <option key={s.code} value={s.code}>
                    {s.name} ({s.category})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Overlap Summary Card */}
          <div className="bg-[#0f172a] border border-slate-800 rounded-xl p-6 flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-6">
              <div className="w-24 h-24 rounded-full border-4 border-[#c5a059] flex items-center justify-center bg-[#0a192f] shadow-lg shrink-0">
                <span className="text-2xl font-extrabold text-[#c5a059]">
                  {totalOverlapWeight.toFixed(1)}%
                </span>
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-100 font-serif">
                  Portfolio Overlap Score
                </h3>
                <p className="text-xs text-slate-400 mt-1 max-w-md">
                  {totalOverlapWeight < 30 ? (
                    <span className="text-emerald-400 font-semibold">
                      Low Overlap ({totalOverlapWeight.toFixed(1)}%) — Excellent pair for portfolio diversification without redundant stock exposure.
                    </span>
                  ) : totalOverlapWeight < 55 ? (
                    <span className="text-amber-400 font-semibold">
                      Moderate Overlap ({totalOverlapWeight.toFixed(1)}%) — Complementary core holdings with distinct satellite positions.
                    </span>
                  ) : (
                    <span className="text-red-400 font-semibold">
                      High Overlap ({totalOverlapWeight.toFixed(1)}%) — Caution: Substantial stock duplication creates portfolio clutter.
                    </span>
                  )}
                </p>
                <div className="text-xs text-slate-500 mt-2">
                  Found <span className="text-slate-300 font-semibold">{commonHoldings.length}</span> shared equity holdings between both funds.
                </div>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="text-center p-3 rounded-lg bg-[#0b0f19] border border-slate-800 min-w-[100px]">
                <div className="text-xs text-slate-400">Shared Stocks</div>
                <div className="text-xl font-bold text-[#c5a059] mt-1">{commonHoldings.length}</div>
              </div>
              <div className="text-center p-3 rounded-lg bg-[#0b0f19] border border-slate-800 min-w-[100px]">
                <div className="text-xs text-slate-400">Unique to A</div>
                <div className="text-xl font-bold text-slate-200 mt-1">
                  {holdingsA.length - commonHoldings.length}
                </div>
              </div>
              <div className="text-center p-3 rounded-lg bg-[#0b0f19] border border-slate-800 min-w-[100px]">
                <div className="text-xs text-slate-400">Unique to B</div>
                <div className="text-xl font-bold text-slate-200 mt-1">
                  {holdingsB.length - commonHoldings.length}
                </div>
              </div>
            </div>
          </div>

          {/* Common Holdings Table */}
          <div className="bg-[#0f172a] border border-slate-800 rounded-xl p-6">
            <h4 className="text-sm font-semibold text-slate-200 mb-4 font-serif">
              Shared Underlying Equity Holdings
            </h4>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 uppercase tracking-wider">
                    <th className="py-2.5 px-3">Company Name</th>
                    <th className="py-2.5 px-3">Sector</th>
                    <th className="py-2.5 px-3 text-right">Weight in Scheme A</th>
                    <th className="py-2.5 px-3 text-right">Weight in Scheme B</th>
                    <th className="py-2.5 px-3 text-right text-[#c5a059]">Overlap Contribution</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-slate-300">
                  {commonHoldings.map((c) => (
                    <tr key={c.name} className="hover:bg-slate-800/30">
                      <td className="py-2.5 px-3 font-semibold text-slate-200">{c.name}</td>
                      <td className="py-2.5 px-3 text-slate-400">{c.sector}</td>
                      <td className="py-2.5 px-3 text-right">{c.weightA}%</td>
                      <td className="py-2.5 px-3 text-right">{c.weightB}%</td>
                      <td className="py-2.5 px-3 text-right font-bold text-[#c5a059]">
                        {c.overlap}%
                      </td>
                    </tr>
                  ))}
                  {commonHoldings.length === 0 && (
                    <tr>
                      <td colSpan={5} className="py-6 text-center text-slate-500">
                        No common equity holdings found between the selected schemes.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

