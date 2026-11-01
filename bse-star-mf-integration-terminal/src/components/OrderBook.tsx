import React, { useState } from 'react';
import { BseOrder, ActiveUserSession, SubDistributor } from '../types/bse';
import { Search, Filter, RefreshCw, ExternalLink, Download, CheckCircle, Clock, AlertCircle, UserCheck } from 'lucide-react';

interface OrderBookProps {
  orders: BseOrder[];
  currentSession: ActiveUserSession;
  subDistributors: SubDistributor[];
  onCheckStatus: (orderId: string) => void;
}

export const OrderBook: React.FC<OrderBookProps> = ({
  orders,
  currentSession,
  subDistributors,
  onCheckStatus
}) => {
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [filterSubBroker, setFilterSubBroker] = useState<string>('ALL');
  const [search, setSearch] = useState<string>('');
  const [checkingId, setCheckingId] = useState<string | null>(null);

  const filteredOrders = orders.filter((o) => {
    // Sub-distributor session restriction
    if (currentSession.role === 'SUB_DISTRIBUTOR' && o.subBrokerCode !== currentSession.subBrokerCode) {
      return false;
    }

    if (filterSubBroker !== 'ALL') {
      if (filterSubBroker === 'DIRECT' && o.subBrokerCode) return false;
      if (filterSubBroker !== 'DIRECT' && o.subBrokerCode !== filterSubBroker) return false;
    }

    const matchesFilter = filterStatus === 'ALL' || o.status === filterStatus;
    const matchesSearch =
      o.bseOrderNo.toLowerCase().includes(search.toLowerCase()) ||
      o.orderId.toLowerCase().includes(search.toLowerCase()) ||
      o.clientName.toLowerCase().includes(search.toLowerCase()) ||
      o.clientCode.toLowerCase().includes(search.toLowerCase()) ||
      o.schemeName.toLowerCase().includes(search.toLowerCase()) ||
      (o.subBrokerCode && o.subBrokerCode.toLowerCase().includes(search.toLowerCase()));

    return matchesFilter && matchesSearch;
  });

  const handleQueryStatus = async (orderId: string) => {
    setCheckingId(orderId);
    await new Promise(r => setTimeout(r, 600));
    onCheckStatus(orderId);
    setCheckingId(null);
  };

  const exportCsv = () => {
    const headers = ['Order ID', 'BSE Order No', 'Client Code', 'Client Name', 'Sub-Broker Code', 'EUIN', 'Scheme', 'Type', 'Amount', 'Status', 'Timestamp'];
    const rows = filteredOrders.map(o => [
      o.orderId,
      o.bseOrderNo,
      o.clientCode,
      `"${o.clientName}"`,
      o.subBrokerCode || 'DIRECT',
      o.euin || 'N/A',
      `"${o.schemeName}"`,
      o.orderType,
      o.amount,
      o.status,
      o.timestamp
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `BSE_StAR_MF_OrderBook_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight">
            BSE StAR MF Order Book & Reconciliation
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Real-time audit log of routed transactions, BBO numbers & allotment state
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={exportCsv}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg transition-colors cursor-pointer border border-slate-700"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV Ledger</span>
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by BSE Order No, Client Code, Investor, Scheme, Sub-Broker..."
            className="w-full pl-10 pr-4 py-2 bg-slate-900 border border-slate-800 rounded-lg text-sm text-white focus:outline-hidden focus:border-amber-400"
          />
        </div>

        {currentSession.role === 'MASTER_MFD' && (
          <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-lg text-xs">
            <span className="text-slate-400 shrink-0">Sub-Distributor:</span>
            <select
              value={filterSubBroker}
              onChange={(e) => setFilterSubBroker(e.target.value)}
              className="bg-transparent text-white font-mono focus:outline-hidden cursor-pointer"
            >
              <option value="ALL">All Orders (Consolidated)</option>
              <option value="DIRECT">Direct MFD Only</option>
              {subDistributors.map((sub) => (
                <option key={sub.id} value={sub.subBrokerCode}>
                  {sub.subBrokerCode} - {sub.name}
                </option>
              ))}
            </select>
          </div>
        )}

        <div className="flex items-center gap-1.5 p-1 bg-slate-900 border border-slate-800 rounded-lg overflow-x-auto">
          {['ALL', 'AWAITING_PAYMENT', 'ALLOTTED', 'PLACED', 'REJECTED'].map((st) => (
            <button
              key={st}
              onClick={() => setFilterStatus(st)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md whitespace-nowrap cursor-pointer transition-colors ${
                filterStatus === st
                  ? 'bg-amber-400 text-slate-950 font-bold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {st === 'ALL' ? 'All Orders' : st.replace('_', ' ')}
            </button>
          ))}
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/80 text-slate-400 font-semibold border-b border-slate-800 uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4">BSE Order No</th>
                <th className="py-3 px-4">Investor & UCC</th>
                <th className="py-3 px-4">Sub-Broker / EUIN</th>
                <th className="py-3 px-4">Scheme & Type</th>
                <th className="py-3 px-4 text-right">Amount (₹)</th>
                <th className="py-3 px-4">Channel / Mode</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono">
              {filteredOrders.map((order) => (
                <tr key={order.orderId} className="hover:bg-slate-800/40 transition-colors">
                  <td className="py-3 px-4">
                    <div className="font-bold text-amber-400">{order.bseOrderNo}</div>
                    <div className="text-[11px] text-slate-500 font-sans">Ref: {order.orderId}</div>
                  </td>
                  <td className="py-3 px-4 font-sans">
                    <div className="font-semibold text-white">{order.clientName}</div>
                    <div className="text-[11px] text-slate-400 font-mono">{order.clientCode}</div>
                  </td>
                  <td className="py-3 px-4 font-sans">
                    {order.subBrokerCode ? (
                      <div>
                        <div className="font-mono font-semibold text-amber-400">{order.subBrokerCode}</div>
                        <div className="text-[10px] text-slate-400 font-mono">EUIN: {order.euin || 'E100000'}</div>
                      </div>
                    ) : (
                      <span className="text-slate-500 text-[11px] font-mono">Direct MFD</span>
                    )}
                  </td>
                  <td className="py-3 px-4">
                    <div className="font-sans text-slate-200 truncate max-w-[200px]" title={order.schemeName}>
                      {order.schemeName}
                    </div>
                    <div className="text-[11px] text-slate-400 font-mono">
                      {order.orderType} {order.sipFrequency ? `(${order.sipFrequency})` : ''}
                    </div>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <div className="font-bold text-white tabular-nums">
                      ₹{order.amount.toLocaleString('en-IN')}
                    </div>
                    {order.units && (
                      <div className="text-[11px] text-slate-400 tabular-nums">
                        {order.units} Units
                      </div>
                    )}
                  </td>
                  <td className="py-3 px-4 font-sans">
                    <div className="text-slate-300">{order.paymentMode}</div>
                    <div className="text-[10px] text-slate-500 font-mono">{order.dpType}</div>
                  </td>
                  <td className="py-3 px-4 font-sans">
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold ${
                        order.status === 'ALLOTTED'
                          ? 'bg-emerald-950/60 text-emerald-400 border border-emerald-500/30'
                          : order.status === 'AWAITING_PAYMENT'
                          ? 'bg-amber-950/60 text-amber-300 border border-amber-500/30'
                          : 'bg-blue-950/60 text-blue-300 border border-blue-500/30'
                      }`}
                    >
                      {order.status}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      {order.paymentUrl && order.status === 'AWAITING_PAYMENT' && (
                        <a
                          href={order.paymentUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="p-1.5 bg-amber-400/20 hover:bg-amber-400/30 text-amber-300 rounded transition-colors"
                          title="Open BSE Payment Gateway Link"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      )}
                      <button
                        onClick={() => handleQueryStatus(order.orderId)}
                        disabled={checkingId === order.orderId}
                        className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded transition-colors cursor-pointer"
                        title="Query Real-Time BSE Status"
                      >
                        <RefreshCw className={`w-3.5 h-3.5 ${checkingId === order.orderId ? 'animate-spin' : ''}`} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {filteredOrders.length === 0 && (
            <div className="text-center py-12 text-slate-400">
              <p className="text-sm font-medium">No orders found</p>
              <p className="text-xs text-slate-500 mt-1">Orders routed via the Order Engine will show up in this ledger</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
