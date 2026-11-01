/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  BseCredentials,
  ClientUcc,
  Scheme,
  BseOrder,
  Mandate,
  ApiLog,
  SubDistributor,
  ActiveUserSession,
  KycRecord
} from './types/bse';
import {
  INITIAL_BSE_CREDENTIALS,
  MOCK_SCHEMES,
  MOCK_CLIENTS,
  MOCK_MANDATES,
  MOCK_ORDERS,
  MOCK_SUB_DISTRIBUTORS,
  MOCK_KYC_RECORDS
} from './data/mockBseData';
import { BseApiService } from './services/bseApiService';
import { Header } from './components/Header';
import { ApiConfigModal } from './components/ApiConfigModal';
import { IntegrationGuideModal } from './components/IntegrationGuideModal';
import { SubDistributorModal } from './components/SubDistributorModal';
import { SubDistributorManager } from './components/SubDistributorManager';
import { KycModule } from './components/KycModule';
import { SchemeMaster } from './components/SchemeMaster';
import { OrderTerminal } from './components/OrderTerminal';
import { UccManager } from './components/UccManager';
import { MandateManager } from './components/MandateManager';
import { OrderBook } from './components/OrderBook';
import { DevTestbench } from './components/DevTestbench';
import { CalculatorsView } from './components/CalculatorsView';
import { PortfolioTaxView } from './components/PortfolioTaxView';
import { ProposalCartView } from './components/ProposalCartView';
import { ResearchView } from './components/ResearchView';
import { CheckCircle2, Shield, Activity, RefreshCw } from 'lucide-react';

export default function App() {
  const [credentials, setCredentials] = useState<BseCredentials>(() => {
    const saved = localStorage.getItem('bse_credentials');
    return saved ? JSON.parse(saved) : INITIAL_BSE_CREDENTIALS;
  });

  const [subDistributors, setSubDistributors] = useState<SubDistributor[]>(() => {
    const saved = localStorage.getItem('bse_sub_distributors');
    return saved ? JSON.parse(saved) : MOCK_SUB_DISTRIBUTORS;
  });

  const [currentSession, setCurrentSession] = useState<ActiveUserSession>(() => {
    const saved = localStorage.getItem('bse_active_session');
    return saved ? JSON.parse(saved) : {
      role: 'MASTER_MFD',
      name: 'Tanashvi (ARN-347849)',
      memberId: '714114'
    };
  });

  const [schemes] = useState<Scheme[]>(MOCK_SCHEMES);
  const [clients, setClients] = useState<ClientUcc[]>(() => {
    const saved = localStorage.getItem('bse_clients');
    return saved ? JSON.parse(saved) : MOCK_CLIENTS;
  });
  const [kycRecords, setKycRecords] = useState<KycRecord[]>(() => {
    const saved = localStorage.getItem('bse_kyc_records');
    return saved ? JSON.parse(saved) : MOCK_KYC_RECORDS;
  });
  const [mandates, setMandates] = useState<Mandate[]>(() => {
    const saved = localStorage.getItem('bse_mandates');
    return saved ? JSON.parse(saved) : MOCK_MANDATES;
  });
  const [orders, setOrders] = useState<BseOrder[]>(() => {
    const saved = localStorage.getItem('bse_orders');
    return saved ? JSON.parse(saved) : MOCK_ORDERS;
  });

  const [currentTab, setCurrentTab] = useState<string>('kyc');
  const [isApiConfigOpen, setIsApiConfigOpen] = useState(false);
  const [isDocOpen, setIsDocOpen] = useState(false);
  const [isSubDistributorModalOpen, setIsSubDistributorModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Selected scheme for prefilling Order Terminal
  const [prefilledScheme, setPrefilledScheme] = useState<Scheme | null>(null);
  const [prefilledOrderType, setPrefilledOrderType] = useState<'LUMPSUM' | 'SIP' | null>(null);

  // Logs
  const [logs, setLogs] = useState<ApiLog[]>([]);

  useEffect(() => {
    setLogs(BseApiService.getLogs());
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleSaveCredentials = (creds: BseCredentials) => {
    setCredentials(creds);
    localStorage.setItem('bse_credentials', JSON.stringify(creds));
    showToast(`BSE StAR MF Gateway updated: ${creds.memberId} (${creds.environment.toUpperCase()})`);
  };

  const handleSwitchSession = (session: ActiveUserSession) => {
    setCurrentSession(session);
    localStorage.setItem('bse_active_session', JSON.stringify(session));
    if (session.role === 'SUB_DISTRIBUTOR') {
      showToast(`Logged in as Sub-Distributor: ${session.name} (${session.subBrokerCode})`);
    } else {
      showToast(`Switched back to Master MFD (Principal Admin)`);
    }
  };

  const handleAddSubDistributor = (newSub: SubDistributor) => {
    const updated = [newSub, ...subDistributors];
    setSubDistributors(updated);
    localStorage.setItem('bse_sub_distributors', JSON.stringify(updated));
    showToast(`Sub-Distributor ${newSub.name} (${newSub.subBrokerCode}) registered under Member`);
  };

  const handleOrderPlaced = (newOrder: BseOrder) => {
    const updated = [newOrder, ...orders];
    setOrders(updated);
    localStorage.setItem('bse_orders', JSON.stringify(updated));
    setLogs(BseApiService.getLogs());
    showToast(`Order ${newOrder.bseOrderNo} routed via BSE StAR MF`);
  };

  const handleClientAdded = (newClient: ClientUcc) => {
    const updated = [newClient, ...clients];
    setClients(updated);
    localStorage.setItem('bse_clients', JSON.stringify(updated));
    setLogs(BseApiService.getLogs());
    showToast(`UCC ${newClient.clientCode} registered with BSE StAR MF`);
  };

  const handleKycCreated = (newKyc: KycRecord) => {
    const updated = [newKyc, ...kycRecords];
    setKycRecords(updated);
    localStorage.setItem('bse_kyc_records', JSON.stringify(updated));
    showToast(`e-KYC verified for ${newKyc.clientName} (PAN: ${newKyc.pan})`);
  };

  const handleConvertToUcc = async (kycRecord: KycRecord) => {
    const newClientCode = `CL${Math.floor(100000 + Math.random() * 900000)}`;
    const newClient: ClientUcc = {
      clientCode: newClientCode,
      fullName: kycRecord.clientName,
      pan: kycRecord.pan,
      email: kycRecord.email,
      mobile: kycRecord.mobile,
      dob: kycRecord.dob,
      taxStatus: 'RI',
      holdingNature: 'SI',
      primaryBank: {
        accountNumber: kycRecord.bankVerification?.accountNumber || '50100482910481',
        accountType: 'SB',
        ifsc: kycRecord.bankVerification?.ifsc || 'HDFC0000060',
        bankName: kycRecord.bankVerification?.bankName || 'HDFC Bank Ltd',
        branchName: 'Corporate Branch'
      },
      fatcaCompliant: true,
      kycStatus: 'VERIFIED',
      aofStatus: 'APPROVED',
      subBrokerCode: kycRecord.subBrokerCode,
      createdAt: new Date().toISOString()
    };

    try {
      await BseApiService.registerUcc(newClient, credentials);
      handleClientAdded(newClient);

      // Mark in KYC record
      const updatedKyc = kycRecords.map((k) =>
        k.id === kycRecord.id
          ? { ...k, bseUccCreated: true, associatedClientCode: newClientCode }
          : k
      );
      setKycRecords(updatedKyc);
      localStorage.setItem('bse_kyc_records', JSON.stringify(updatedKyc));

      showToast(`UCC ${newClientCode} created on BSE StAR MF for ${kycRecord.clientName}!`);
      setCurrentTab('clients');
    } catch (err: any) {
      showToast('Error registering UCC on BSE: ' + err.message);
    }
  };

  const handleMandateAdded = (newMandate: Mandate) => {
    const updated = [newMandate, ...mandates];
    setMandates(updated);
    localStorage.setItem('bse_mandates', JSON.stringify(updated));
    setLogs(BseApiService.getLogs());
    showToast(`Mandate ${newMandate.mandateId} registered with NPCI / BSE`);
  };

  const handleSelectSchemeForOrder = (scheme: Scheme, type: 'LUMPSUM' | 'SIP') => {
    setPrefilledScheme(scheme);
    setPrefilledOrderType(type);
    setCurrentTab('orders');
  };

  const handleTradeWithClient = (client: ClientUcc) => {
    setCurrentTab('orders');
    showToast(`Client ${client.clientCode} selected in Order Engine`);
  };

  const handleCheckOrderStatus = (orderId: string) => {
    setOrders(prev => prev.map(o => {
      if (o.orderId === orderId && o.status === 'AWAITING_PAYMENT') {
        return {
          ...o,
          status: 'ALLOTTED',
          remarks: 'Payment verified by BSE Clearing & Settlement. Units allotted.'
        };
      }
      return o;
    }));
    showToast(`Updated status for Order ${orderId} from BSE StAR MF`);
  };

  return (
    <div className="min-h-screen bg-[#0b0f19] text-slate-100 flex flex-col font-sans selection:bg-amber-400 selection:text-slate-950">
      {/* Top Header */}
      <Header
        currentTab={currentTab}
        onTabChange={(t) => setCurrentTab(t)}
        credentials={credentials}
        currentSession={currentSession}
        onOpenSettings={() => setIsApiConfigOpen(true)}
        onOpenDoc={() => setIsDocOpen(true)}
        onOpenSessionModal={() => setIsSubDistributorModalOpen(true)}
      />

      {/* Main Workspace */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {currentTab === 'kyc' && (
          <KycModule
            kycRecords={kycRecords}
            credentials={credentials}
            currentSession={currentSession}
            subDistributors={subDistributors}
            onKycCreated={handleKycCreated}
            onConvertToUcc={handleConvertToUcc}
          />
        )}

        {currentTab === 'proposals' && <ProposalCartView />}
        {currentTab === 'research' && <ResearchView />}
        {currentTab === 'calculators' && <CalculatorsView />}
        {currentTab === 'portfolio' && <PortfolioTaxView />}

        {currentTab === 'orders' && (
          <OrderTerminal
            clients={clients}
            schemes={schemes}
            mandates={mandates}
            credentials={credentials}
            currentSession={currentSession}
            subDistributors={subDistributors}
            initialScheme={prefilledScheme}
            initialOrderType={prefilledOrderType}
            onOrderPlaced={handleOrderPlaced}
            onNavigateToClients={() => setCurrentTab('clients')}
          />
        )}

        {currentTab === 'schemes' && (
          <SchemeMaster
            schemes={schemes}
            onSelectSchemeForOrder={handleSelectSchemeForOrder}
          />
        )}

        {currentTab === 'clients' && (
          <UccManager
            clients={clients}
            credentials={credentials}
            currentSession={currentSession}
            subDistributors={subDistributors}
            onClientAdded={handleClientAdded}
            onTradeWithClient={handleTradeWithClient}
            onNavigateToKyc={() => setCurrentTab('kyc')}
          />
        )}

        {currentTab === 'mandates' && (
          <MandateManager
            mandates={mandates}
            clients={clients}
            credentials={credentials}
            onMandateAdded={handleMandateAdded}
          />
        )}

        {currentTab === 'book' && (
          <OrderBook
            orders={orders}
            currentSession={currentSession}
            subDistributors={subDistributors}
            onCheckStatus={handleCheckOrderStatus}
          />
        )}

        {currentTab === 'subdistributors' && (
          <SubDistributorManager
            subDistributors={subDistributors}
            currentSession={currentSession}
            onSwitchSession={handleSwitchSession}
            onOpenAddModal={() => setIsSubDistributorModalOpen(true)}
            masterMemberId={credentials.memberId}
          />
        )}

        {currentTab === 'testbench' && (
          <DevTestbench
            credentials={credentials}
            logs={logs}
            onRefreshLogs={() => setLogs(BseApiService.getLogs())}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800 bg-[#0a192f] py-6 text-center text-xs text-slate-400">
        <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <img src="/tanashvi_logo.jpeg" alt="Tanashvi" className="w-6 h-6 rounded object-cover border border-[#c5a059]/40" />
            <div className="text-left">
              <span className="font-serif font-bold text-white text-sm">Tanashvi</span>
              <span className="text-[#c5a059] font-serif ml-2 text-[11px]">भवतः हिताय</span>
              <p className="text-[11px] text-slate-400">Tanashvi Fintech Private Limited · AMFI Registered ARN-347849 · BSE Member 714114</p>
            </div>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-4 text-[11px]">
            <a href="https://www.tanashvi.in" target="_blank" rel="noopener noreferrer" className="text-[#c5a059] hover:underline font-medium">
              www.tanashvi.in
            </a>
            <span aria-hidden="true">·</span>
            <span>SEBI & BSE StAR MF v2 Compliant</span>
            <span aria-hidden="true">·</span>
            <span>CVL / CAMS / NDML KRA</span>
          </div>
        </div>
      </footer>

      {/* Modals */}
      <ApiConfigModal
        isOpen={isApiConfigOpen}
        onClose={() => setIsApiConfigOpen(false)}
        credentials={credentials}
        onSaveCredentials={handleSaveCredentials}
      />

      <IntegrationGuideModal
        isOpen={isDocOpen}
        onClose={() => setIsDocOpen(false)}
        onOpenSettings={() => setIsApiConfigOpen(true)}
      />

      <SubDistributorModal
        isOpen={isSubDistributorModalOpen}
        onClose={() => setIsSubDistributorModalOpen(false)}
        subDistributors={subDistributors}
        currentSession={currentSession}
        onSwitchSession={handleSwitchSession}
        onAddSubDistributor={handleAddSubDistributor}
        masterMemberId={credentials.memberId}
      />

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-amber-400 text-slate-950 px-4 py-2.5 rounded-lg shadow-xl font-medium text-xs flex items-center gap-2 animate-bounce">
          <CheckCircle2 className="w-4 h-4 shrink-0 text-slate-950" />
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
}
