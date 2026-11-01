import React, { useState } from 'react';
import { BseCredentials, ApiLog } from '../types/bse';
import { BseApiService } from '../services/bseApiService';
import { Terminal, Play, Code2, Copy, Check, FileCode, CheckCircle, Clock } from 'lucide-react';

interface DevTestbenchProps {
  credentials: BseCredentials;
  logs: ApiLog[];
  onRefreshLogs: () => void;
}

export const DevTestbench: React.FC<DevTestbenchProps> = ({
  credentials,
  logs,
  onRefreshLogs
}) => {
  const [selectedEndpoint, setSelectedEndpoint] = useState<string>('ORDER_ENTRY');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [isExecuting, setIsExecuting] = useState(false);
  const [activeCodeLang, setActiveCodeLang] = useState<'NODE' | 'CURL' | 'PYTHON'>('NODE');

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const endpointDefs: Record<string, {
    title: string;
    path: string;
    method: string;
    description: string;
    samplePayload: string;
    sampleResponse: string;
  }> = {
    ORDER_ENTRY: {
      title: 'MFOrderEntry (Lumpsum & Redemption)',
      path: '/StarMFWebService/MFOrderEntry',
      method: 'POST (SOAP/REST)',
      description: 'Places Purchase (P), Redemption (R), or Switch (S) order on BSE StAR MF',
      samplePayload: `<?xml version="1.0" encoding="utf-8"?>
<soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">
  <soap:Body>
    <MFOrderEntry xmlns="http://bsestarmf.in/">
      <MemberCode>${credentials.memberId}</MemberCode>
      <SubBrokerCode>SUB-101</SubBrokerCode>
      <EUIN>E294810</EUIN>
      <EUINFlag>Y</EUINFlag>
      <ClientCode>CL882041</ClientCode>
      <SchemeCd>119551</SchemeCd>
      <BuySell>P</BuySell>
      <BuySellType>FRESH</BuySellType>
      <DpTxnMode>P</DpTxnMode>
      <OrderAmount>50000</OrderAmount>
      <TransNo>ORD-20261020-001</TransNo>
      <PassKey>${credentials.passKey}</PassKey>
      <UserId>${credentials.userId}</UserId>
    </MFOrderEntry>
  </soap:Body>
</soap:Envelope>`,
      sampleResponse: `{
  "ResponseCode": "100",
  "BseOrderNo": "BBO-20261020-94812",
  "SubBrokerAttributed": "SUB-101",
  "EUINStatus": "AMFI_VERIFIED_VALID",
  "Status": "VALIDATED_OK",
  "CutoffApplicableNAV": 84.62,
  "PaymentUrl": "https://bsestarmfdemo.bseindia.com/PaymentGateway?orderNo=BBO-20261020-94812",
  "Message": "Order validated and routed successfully"
}`
    },
    XSIP_ENTRY: {
      title: 'XSIPOrderEntry (SIP with e-Mandate)',
      path: '/StarMFWebService/XSIPOrderEntry',
      method: 'POST (SOAP/REST)',
      description: 'Registers Systematic Investment Plan linked to an approved e-NACH Mandate',
      samplePayload: `<?xml version="1.0" encoding="utf-8"?>
<soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">
  <soap:Body>
    <XSIPOrderEntry xmlns="http://bsestarmf.in/">
      <MemberCode>${credentials.memberId}</MemberCode>
      <SubBrokerCode>SUB-101</SubBrokerCode>
      <EUIN>E294810</EUIN>
      <EUINFlag>Y</EUINFlag>
      <ClientCode>CL882041</ClientCode>
      <SchemeCode>120503</SchemeCode>
      <MandateId>MDT-88201</MandateId>
      <Frequency>MONTHLY</Frequency>
      <StartDate>05/11/2026</StartDate>
      <InstallmentAmount>10000</InstallmentAmount>
      <NoOfInstallments>60</NoOfInstallments>
      <FirstOrderFlag>Y</FirstOrderFlag>
      <PassKey>${credentials.passKey}</PassKey>
    </XSIPOrderEntry>
  </soap:Body>
</soap:Envelope>`,
      sampleResponse: `{
  "ResponseCode": "100",
  "XSIPRegNo": "BBO-XSIP-20261020-84021",
  "MandateLinked": "MDT-88201",
  "Status": "ACTIVE_APPROVED",
  "NextDebitDate": "2026-11-05"
}`
    },
    UCC_REGISTER: {
      title: 'ClientRegistration_UCC (Unique Client Code)',
      path: '/StarMFWebService/ClientRegistration_UCC',
      method: 'POST',
      description: 'Registers investor KYC, Bank details, Nominee & FATCA declarations',
      samplePayload: `MEMBER_CODE|CLIENT_CODE|CLIENT_NAME|PAN|TAX_STATUS|HOLDING|DOB|MOBILE|EMAIL|ACC_NO|ACC_TYPE|IFSC|FATCA_FLAG
${credentials.memberId}|CL882041|KAUSHIK GHOSH|ABCDE1234F|RI|SI|14/06/1988|9830144520|kaushik@gmail.com|50100289148201|SB|HDFC0000060|Y`,
      sampleResponse: `{
  "Status": "100",
  "BseCode": "UCC_CREATED_SUCCESS",
  "ClientCode": "CL882041",
  "AofReferenceNo": "AOF-BSE-918241",
  "PanStatus": "KYC_COMPLIANT_OK"
}`
    },
    MANDATE_REGISTER: {
      title: 'MandateRegistration (e-NACH)',
      path: '/StarMFWebService/MandateRegistration',
      method: 'POST',
      description: 'Submits NPCI e-NACH mandate with maximum limit cap',
      samplePayload: `{
  "MemberCode": "${credentials.memberId}",
  "ClientCode": "CL882041",
  "MandateType": "E_NACH",
  "BankName": "HDFC Bank",
  "AccountNo": "50100289148201",
  "IFSC": "HDFC0000060",
  "MaxAmount": 100000,
  "EndDate": "31/12/2050",
  "PassKey": "${credentials.passKey}"
}`,
      sampleResponse: `{
  "MandateId": "MDT-88201",
  "UMRN": "HDFC00000609820148",
  "Status": "REGISTERED_VERIFIED",
  "NpciStatus": "ACTIVE",
  "AuthUrl": "https://bsestarmfdemo.bseindia.com/eNachAuth?id=MDT-88201"
}`
    }
  };

  const activeDef = endpointDefs[selectedEndpoint] || endpointDefs['ORDER_ENTRY'];

  const handleTestInvoke = async () => {
    setIsExecuting(true);
    await new Promise(r => setTimeout(r, 450));
    BseApiService.addLog({
      endpoint: activeDef.path,
      service: selectedEndpoint,
      requestPayload: activeDef.samplePayload,
      responsePayload: activeDef.sampleResponse,
      statusCode: 200,
      latencyMs: 450,
      status: 'SUCCESS'
    });
    onRefreshLogs();
    setIsExecuting(false);
  };

  const getCodeSnippet = () => {
    if (activeCodeLang === 'NODE') {
      return `// Node.js / TypeScript integration with BSE StAR MF
import axios from 'axios';

const BSE_GATEWAY_URL = '${credentials.environment === 'prod' ? 'https://bsestarmf.in/StarMFWebAPI/v2' : 'https://bsestarmfdemo.bseindia.com/StarMFWebAPI/v2'}';
const MEMBER_ID = '${credentials.memberId}';
const PASS_KEY = '${credentials.passKey}';

export async function placeBseOrder(orderParams) {
  const payload = {
    MemberCode: MEMBER_ID,
    PassKey: PASS_KEY,
    ...orderParams
  };

  const response = await axios.post(\`\${BSE_GATEWAY_URL}${activeDef.path}\`, payload, {
    headers: {
      'Content-Type': 'application/json',
      'X-BSE-PassKey': PASS_KEY
    }
  });

  return response.data;
}`;
    }

    if (activeCodeLang === 'CURL') {
      return `curl -X POST "${credentials.environment === 'prod' ? 'https://bsestarmf.in' : 'https://bsestarmfdemo.bseindia.com'}${activeDef.path}" \\
  -H "Content-Type: application/json" \\
  -H "X-BSE-Member: ${credentials.memberId}" \\
  -d '${JSON.stringify({ MemberCode: credentials.memberId, PassKey: credentials.passKey })}'`;
    }

    return `# Python integration with BSE StAR MF Official API
import requests

url = "${credentials.environment === 'prod' ? 'https://bsestarmf.in' : 'https://bsestarmfdemo.bseindia.com'}${activeDef.path}"
payload = {
    "MemberCode": "${credentials.memberId}",
    "PassKey": "${credentials.passKey}",
    "ClientCode": "CL882041"
}

headers = {"Content-Type": "application/json"}
res = requests.post(url, json=payload, headers=headers)
print("BSE StAR MF Response:", res.json())`;
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight">
            Official BSE StAR MF API Developer Console
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Simulate and inspect official SOAP/REST payloads, schemas, encryption tokens & responses
          </p>
        </div>

        <button
          onClick={handleTestInvoke}
          disabled={isExecuting}
          className="flex items-center gap-2 px-4 py-2 bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs rounded-lg transition-colors cursor-pointer disabled:opacity-50"
        >
          <Play className={`w-3.5 h-3.5 ${isExecuting ? 'animate-spin' : ''}`} />
          <span>{isExecuting ? 'Dispatching to BSE...' : 'Send Test Request'}</span>
        </button>
      </div>

      {/* Endpoint Selector Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {Object.entries(endpointDefs).map(([key, def]) => (
          <button
            key={key}
            onClick={() => setSelectedEndpoint(key)}
            className={`px-3.5 py-2 text-xs font-semibold rounded-lg border whitespace-nowrap transition-colors cursor-pointer ${
              selectedEndpoint === key
                ? 'bg-amber-400 border-amber-400 text-slate-950 shadow-xs'
                : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            {def.title}
          </button>
        ))}
      </div>

      {/* Endpoint Details Card */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Request Schema */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-bold text-amber-400">{activeDef.method}</span>
              <span className="text-xs font-mono text-slate-300">{activeDef.path}</span>
            </div>
            <button
              onClick={() => copyToClipboard(activeDef.samplePayload, 'req')}
              className="text-xs text-slate-400 hover:text-white flex items-center gap-1 cursor-pointer"
            >
              {copiedKey === 'req' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>Copy</span>
            </button>
          </div>

          <div className="text-xs text-slate-400">{activeDef.description}</div>

          <pre className="p-3 bg-slate-950 border border-slate-800 rounded-lg text-slate-200 font-mono text-xs overflow-x-auto max-h-[300px]">
            {activeDef.samplePayload}
          </pre>
        </div>

        {/* Response Schema */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-bold text-emerald-400">HTTP 200 OK</span>
              <span className="text-xs text-slate-400">Expected BSE Acknowledgment</span>
            </div>
            <button
              onClick={() => copyToClipboard(activeDef.sampleResponse, 'res')}
              className="text-xs text-slate-400 hover:text-white flex items-center gap-1 cursor-pointer"
            >
              {copiedKey === 'res' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>Copy</span>
            </button>
          </div>

          <div className="text-xs text-slate-400">Response envelope returned by BSE StAR MF server</div>

          <pre className="p-3 bg-slate-950 border border-slate-800 rounded-lg text-emerald-300 font-mono text-xs overflow-x-auto max-h-[300px]">
            {activeDef.sampleResponse}
          </pre>
        </div>
      </div>

      {/* Code Snippet Generator */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Code2 className="w-4 h-4 text-amber-400" />
            <h3 className="text-sm font-semibold text-white">Backend Integration Snippet</h3>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 bg-slate-950 p-1 border border-slate-800 rounded-md">
              {(['NODE', 'CURL', 'PYTHON'] as const).map(lang => (
                <button
                  key={lang}
                  onClick={() => setActiveCodeLang(lang)}
                  className={`px-2.5 py-1 text-xs font-mono rounded cursor-pointer ${
                    activeCodeLang === lang ? 'bg-amber-400 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {lang}
                </button>
              ))}
            </div>

            <button
              onClick={() => copyToClipboard(getCodeSnippet(), 'snippet')}
              className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded cursor-pointer flex items-center gap-1"
            >
              {copiedKey === 'snippet' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
              <span>Copy Code</span>
            </button>
          </div>
        </div>

        <pre className="p-4 bg-slate-950 border border-slate-800 rounded-lg text-amber-200/90 font-mono text-xs overflow-x-auto">
          {getCodeSnippet()}
        </pre>
      </div>

      {/* Live Transaction / API Traffic Logs */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Terminal className="w-4 h-4 text-amber-400" />
            <h3 className="text-sm font-semibold text-white">BSE StAR Gateway Request Logs</h3>
          </div>
          <span className="text-xs font-mono text-slate-400">{logs.length} logged calls</span>
        </div>

        <div className="divide-y divide-slate-800/80 font-mono text-xs">
          {logs.slice(0, 5).map(log => (
            <div key={log.id} className="py-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                  log.status === 'SUCCESS' ? 'bg-emerald-950 text-emerald-400 border border-emerald-500/30' : 'bg-rose-950 text-rose-400 border border-rose-500/30'
                }`}>
                  {log.statusCode}
                </span>
                <span className="text-white font-medium">{log.service}</span>
                <span className="text-slate-500 text-[11px] truncate max-w-[200px]">{log.endpoint}</span>
              </div>
              <div className="flex items-center gap-3 text-slate-400 text-[11px]">
                <span>{log.latencyMs}ms</span>
                <span>{log.timestamp.slice(11, 19)} UTC</span>
              </div>
            </div>
          ))}
          {logs.length === 0 && (
            <div className="py-6 text-center text-slate-500 font-sans">
              No recent gateway logs. Send a test request or place an order to record traffic.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
