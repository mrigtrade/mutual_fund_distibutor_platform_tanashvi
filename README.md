# Tanashvi B2B Mutual Fund Platform (BSE StAR MF v2 Integration)

A proprietary, high-performance, multi-tenant B2B mutual fund transaction, advisory, and calculation engine developed for **Tanashvi Fintech Private Limited** (ARN-347849 / BSE Member Code 94515) to facilitate mutual fund distribution for Tanashvi and onboarded independent Mutual Fund Distributors (MFDs) with feature parity to platforms like **AdvisorKhoj**.

* **Brand Identity:** **Tanashvi** (Legal entity: *Tanashvi Fintech Private Limited*)
* **Corporate Motto / Tagline:** **भवतः हिताय** (*"Bhavatah Hitaya"* — *"For Your Welfare"*)
* **Official Website:** [https://www.tanashvi.in/](https://www.tanashvi.in/)
* **AMFI Registration:** `ARN-347849` | **BSE Member Code:** `94515` (Official UAT Allocated)
* **Oracle Cloud Dedicated Server:** `130.210.57.235` (Ubuntu 22.04 LTS · Static Whitelisted IP)
* **Live Web Application (Vercel):** [https://mutual-fund-distibutor-platform-tan.vercel.app/](https://mutual-fund-distibutor-platform-tan.vercel.app/)
* **GitHub Repository:** [https://github.com/mrigtrade/mutual_fund_distibutor_platform_tanashvi.git](https://github.com/mrigtrade/mutual_fund_distibutor_platform_tanashvi.git)

---

> ### 🛡️ Core Architectural Mandate
> **Zero Live Dependency (Offline/Mock-First):**
> Since BSE requires static IP whitelisting before any inbound connection to their gateway is permitted, the entire platform (security, state machines, DTO builders, financial calculators, portfolio valuation, research engines, and proposal carts) is designed to run self-contained locally against simulated BSE responses and offline seed fixtures.

---

## 1. System Overview

```mermaid
flowchart TD
    subgraph Multi_Tenant_MFD_Layer["Multi-Tenant MFD Platform Layer"]
        T1["Tanashvi Fintech (ARN-347849)<br/>Platform Master"]
        T2["Tenant MFD Firm A (ARN-XXXXX)"]
        T3["Tenant MFD Firm B (ARN-YYYYY)"]
    end

    subgraph API_Gateway["Express REST API Gateway Layer (Port 4000)"]
        TC["Tenant Context & EUIN Middleware"]
        UCC_API["/api/v1/ucc/register"]
        ORD_API["/api/v1/orders/create"]
        SXP_API["/api/v1/sxp/register"]
        MAN_API["/api/v1/mandates/create"]
        WH_API["/api/v1/webhooks/bse"]
        CALC_API["/api/v1/calculators/* (9 Financial Calculators)"]
        SCHEME_API["/api/v1/schemes/* (AMFI NAV & Schemes)"]
        PORT_API["/api/v1/portfolio/* (Holdings, XIRR, CAS)"]
        TAX_API["/api/v1/tax/* (Budget 2024 Capital Gains)"]
        PROP_API["/api/v1/proposals/* (MFD Magic Cart Links)"]
        RES_API["/api/v1/research/* (Rolling Returns, Risk Ratios, Overlap)"]
    end

    subgraph Internal_Engine["Tanashvi Core Platform Engine"]
        RLS["PostgreSQL Multi-Tenant RLS<br/>(Row-Level Security Isolation)"]
        VAL["Validation & Cut-Off Engine<br/>(Liquid: 13:30 | Equity: 15:00 in IST)"]
        ORD["Order Engine & SxP (SIP/STP/SWP)<br/>mem_ord_ref_id &harr; bse_order_no"]
        UCC["UCC Engine<br/>Physical vs Demat | Up to 5 Nominees"]
        FIN["Financial Calculator Suite<br/>SIP, Step-Up, Goals, SWP, STP"]
        AMFI["AMFI Open NAV Sync Engine<br/>29+ Funds Cached Offline"]
        PORT["Portfolio Valuation & XIRR<br/>FIFO Lot Matching Engine"]
        TAX["Capital Gains Engine (Budget 2024)<br/>20% STCG | 12.5% LTCG | ₹1.25L Exemption"]
        CART["MFD Proposal & Cart Engine<br/>Magic Shareable Investment Links"]
        RES["MF Research & Analytics Engine<br/>Rolling Returns | Risk Ratios | Fund Overlap"]
    end

    subgraph Security_Transport["BSE StAR MF v2 Transport & Security"]
        HOT["Hot-Toggle Transport (MOCK vs LIVE)"]
        JOSE["JOSE Security Module<br/>ctEncrypt() & ctDecrypt()<br/>(RSA-OAEP-256 + A256GCM | RS256)"]
        HDR["Header Injection Service<br/>X-API-Org-ID: member/714114:&lt;fingerprint&gt;<br/>X-STARMFv2-Trace-ID: &lt;uuid&gt;"]
    end

    subgraph BSE_Target["Target Gateways"]
        MOCK["Local BSE Gateway Simulator<br/>(Zero Live Dependency)"]
        LIVE["BSE StAR MF v2 Production Gateway<br/>(Active upon Static IP Whitelist)"]
    end

    Multi_Tenant_MFD_Layer --> TC --> API_Gateway
    API_Gateway --> RLS
    API_Gateway --> FIN
    API_Gateway --> AMFI
    API_Gateway --> PORT
    API_Gateway --> TAX
    API_Gateway --> CART
    API_Gateway --> RES
    RLS --> VAL --> ORD --> UCC
    ORD --> HOT
    UCC --> HOT
    CART --> ORD
    HOT --> JOSE --> HDR
    HDR -->|BSE_GATEWAY_MODE=MOCK| MOCK
    HDR -.->|BSE_GATEWAY_MODE=LIVE (Post-Whitelist)| LIVE
```

---

## 2. Directory Structure

```text
mf-platform_dev/
├── README.md                              # Main platform architecture and developer guide
├── PROGRESS.md                            # Live milestone tracker & next session briefing
├── api_unzipped_docs/                     # Official BSE StAR MF v2 documentation, specs & wrappers
│   ├── BSE StARMF v2 - EncryptDecrypt.pdf # BSE JOSE encryption standard
│   ├── V2.0.4_Star_MF_V2_API_Doc_21_July.pdf # Complete BSE v2 API specifications
│   ├── BSE_StARMF_2.0_NodeJS_Wrapper/     # Official BSE Node.js sample DTOs
│   ├── BSE_StARMF_2.0_Python_Wrapper/     # Official BSE Python sample DTOs
│   └── Python Script/                     # BSE reference JOSE encryption scripts
├── bse-star-backend/                      # Production Backend Architecture (TypeScript / Node.js)
│   ├── package.json
│   ├── tsconfig.json
│   ├── .env.example                       # Environment configuration template
│   ├── src/
│   │   ├── index.ts                       # Module entrypoint & public exports
│   │   ├── app.ts                         # Express Application configuration
│   │   ├── server.ts                      # HTTP Server bootstrap (Port 4000)
│   │   ├── middleware/
│   │   │   ├── tenantContext.ts           # Multi-tenant extraction, ARN & EUIN validation
│   │   │   └── errorHandler.ts            # Global error envelope & exception handling
│   │   ├── transport/
│   │   │   └── bseTransport.ts            # Transport abstraction (BseSimulatorTransport vs BseHttpLiveTransport)
│   │   ├── security/
│   │   │   ├── jose.ts                    # ctEncrypt() & ctDecrypt() production implementation
│   │   │   └── bseHeaders.ts              # BSE v2 header injection (member 714114)
│   │   ├── types/
│   │   │   ├── tenant.ts                  # TenantContext, sub-broker routing
│   │   │   ├── ucc.ts                     # UCC, up to 5 nominees, Physical/Demat, FATCA
│   │   │   ├── scheme.ts                  # Scheme Master, ISIN, cut-off timings, NAV
│   │   │   ├── order.ts                   # Lumpsum, SxP (SIP/STP/SWP), Mandates, State Machines
│   │   │   ├── portfolio.ts               # Holdings, Folios, FIFO Lots, Capital Gains DTOs
│   │   │   ├── proposal.ts                # MFD Proposal Baskets & Magic Cart DTOs
│   │   │   └── research.ts                # Rolling Returns, Risk Ratios, Overlap & Comparison DTOs
│   │   ├── calculators/                   # Mutual Fund & Goal Calculator Suite (AdvisorKhoj Feature Set)
│   │   │   ├── calculatorTypes.ts         # Math inputs, outputs, and amortization schedules
│   │   │   ├── sipCalculators.ts          # Regular SIP, Step-Up SIP, and Target Amount SIP
│   │   │   ├── goalCalculators.ts         # Crorepati, Child Education (Inflation), Retirement
│   │   │   └── withdrawalCalculators.ts   # Lumpsum, SWP (Withdrawal), STP (Transfer)
│   │   ├── builders/
│   │   │   ├── uccRequestBuilder.ts       # Exact BSE v2 /api/v2/add_ucc JSON request builder
│   │   │   ├── orderRequestBuilder.ts     # Exact BSE v2 /api/order_new JSON request builder
│   │   │   ├── sxpRequestBuilder.ts       # Exact BSE v2 /api/sxp_register JSON request builder
│   │   │   └── mandateRequestBuilder.ts   # Exact BSE v2 /api/mandate_register JSON request builder
│   │   ├── services/
│   │   │   ├── bseGatewayService.ts       # Gateway facade with session caching & hot-toggle
│   │   │   ├── cutoffReconciliation.ts    # SEBI cut-off engine (13:30 Liquid vs 15:00 Equity in IST)
│   │   │   ├── orderStateMachine.ts       # Atomic state machine & transition guards
│   │   │   ├── amfiNavService.ts          # Daily AMFI open NAV feed parser & search catalog
│   │   │   ├── xirrCalculator.ts          # High-precision cashflow-weighted XIRR engine
│   │   │   ├── capitalGainsService.ts     # Union Budget 2024 capital gains tax & grandfathering
│   │   │   ├── casParserService.ts        # CAMS/KFintech CAS statement parser (JSON & CSV)
│   │   │   ├── portfolioService.ts        # Portfolio aggregator, valuation & asset allocation
│   │   │   ├── proposalService.ts         # MFD proposal cart creation & atomic execution
│   │   │   ├── rollingReturnsService.ts   # 1Y, 3Y, 5Y, 7Y rolling CAGR & distribution engine
│   │   │   ├── riskRatiosService.ts       # SD, Sharpe, Beta, Alpha, Sortino vs Nifty 50 TRI
│   │   │   ├── portfolioOverlapService.ts # Portfolio stock overlap & duplication analyzer
│   │   │   └── researchDataService.ts     # 7+ yrs historical NAVs & flagship scheme holdings
│   │   ├── fixtures/
│   │   │   ├── amfi_nav_sample.txt        # Pre-seeded top Indian mutual fund NAV feed
│   │   │   └── ramesh_portfolio_sample.json # Sample investor portfolio (Ramesh Sharma)
│   │   ├── controllers/
│   │   │   ├── uccController.ts           # UCC onboarding HTTP controller
│   │   │   ├── orderController.ts         # Mutual fund order placement controller
│   │   │   ├── sxpController.ts           # SIP/STP/SWP registration controller
│   │   │   ├── mandateController.ts       # eNACH/UPI mandate controller
│   │   │   ├── calculatorController.ts    # Financial calculators HTTP controller
│   │   │   ├── schemeController.ts        # AMFI NAV & scheme catalog controller
│   │   │   ├── portfolioController.ts     # Portfolio valuation & CAS import controller
│   │   │   ├── taxController.ts           # Capital gains report controller (AdvisorKhoj feature)
│   │   │   ├── proposalController.ts      # MFD proposal basket controller
│   │   │   ├── researchController.ts      # Rolling returns, risk ratios & overlap controller
│   │   │   └── bseWebhookController.ts    # Asynchronous BSE webhook event ingestion
│   │   ├── routes/
│   │   │   ├── uccRoutes.ts               # /api/v1/ucc
│   │   │   ├── orderRoutes.ts             # /api/v1/orders
│   │   │   ├── sxpRoutes.ts               # /api/v1/sxp
│   │   │   ├── mandateRoutes.ts           # /api/v1/mandates
│   │   │   ├── calculatorRoutes.ts        # /api/v1/calculators
│   │   │   ├── schemeRoutes.ts            # /api/v1/schemes
│   │   │   ├── portfolioRoutes.ts         # /api/v1/portfolio
│   │   │   ├── taxRoutes.ts               # /api/v1/tax
│   │   │   ├── proposalRoutes.ts          # /api/v1/proposals
│   │   │   ├── researchRoutes.ts          # /api/v1/research
│   │   │   └── webhookRoutes.ts           # /api/v1/webhooks
│   │   ├── database/
│   │   │   ├── db.ts                      # PostgreSQL pool & withTenantTransaction (RLS injection)
│   │   │   ├── migrate.ts                 # Automated migration runner
│   │   │   └── migrations/
│   │   │       ├── 001_phase1_multitenant_routing.sql # Multi-tenant MFD routing, RLS, audit logs
│   │   │       ├── 002_phase2_core_schemas.sql        # UCC, Schemes, Orders, Mandates
│   │   │       ├── 003_phase8_portfolio_and_tax.sql   # Folios, Holdings, Transactions, FIFO Tax
│   │   │       ├── 004_phase9_proposal_baskets.sql    # MFD Proposals, Proposal Items, Magic Cart
│   │   │       └── 005_phase11_research_analytics.sql # Historical NAVs, Holdings & Research Metrics
│   │   └── tests/
│   │       ├── test_jose_security.ts              # Phase 1: Cryptographic verification testbench
│   │       ├── test_phase3_mock_integration.ts     # Phase 3: Offline Mock Integration Testbench
│   │       ├── test_phase4_webhook_state_machine.ts # Phase 4: State machine & webhook testbench
│   │       ├── test_phase5_api_server.ts          # Phase 5: REST API Gateway & Server testbench
│   │       ├── test_calculators.ts                # Phase 6: Financial Calculators testbench
│   │       ├── test_amfi_nav.ts                   # Phase 7: Daily AMFI NAV & Scheme Master testbench
│   │       ├── test_phase8_portfolio_tax.ts       # Phase 8: Client Portfolio & Budget 2024 Tax
│   │       ├── test_phase9_proposal_cart.ts       # Phase 9: MFD Proposal Cart Execution testbench
│   │       └── test_phase11_research.ts           # Phase 11: MF Research & Analytics testbench
│   └── dist/                              # Compiled ECMAScript output
├── bse-star-mf-integration-terminal/      # Client-side UI & Tanashvi MFD Terminal (React/Vite)
│   ├── src/
│   │   ├── components/
│   │   │   ├── TanashviLogo.tsx           # Lotus emblem, "Tanashvi", & "भवतः हिताय" lockup
│   │   │   ├── Header.tsx                 # Navigation bar with Tanashvi branding
│   │   │   ├── OrderTerminal.tsx          # BSE Order placement terminal
│   │   │   ├── ProposalCartView.tsx       # MFD Proposal basket builder & investor cart preview
│   │   │   ├── ResearchView.tsx           # Rolling returns, risk ratios, 4-way compare, overlap
│   │   │   ├── CalculatorsView.tsx        # 10 AdvisorKhoj mutual fund financial calculators
│   │   │   ├── PortfolioTaxView.tsx       # Portfolio valuation & Budget 2024 capital gains report
│   │   │   └── UccManager.tsx             # Investor UCC management & nominee allocation
├── logo/                                  # Official Tanashvi Lotus Brand Emblem
└── park/                                  # Archived original zip releases
└── park/                                  # Archived original zip releases
```

---

## 3. Cryptography & BSE v2 Transport Specification

All communication with BSE StAR MF v2 endpoints strictly adheres to the **JOSE (JSON Object Signing and Encryption)** standard:

### Outgoing Requests (`ctEncrypt`):
1. **Serialization:** Payload JSON serialized without extra whitespace (`{"data":{...}}`).
2. **Encryption (JWE):** Encrypted using BSE's RSA Public Key with `RSA-OAEP-256` key management and `A256GCM` content encryption.
3. **Digital Signature (JWS):** The compact JWE token string is signed with Member Private Key (`RS256`).
4. **Transport:** Transmitted as a compact JWS string with `Content-Type: application/jose`.

### Incoming Responses (`ctDecrypt`):
1. **Verification (JWS):** Outer JWS signature verified using BSE's RSA Public Key (`RS256`).
2. **Decryption (JWE):** Inner JWE decrypted using Member Private Key (`RSA-OAEP-256`).
3. **Parse:** Decrypted UTF-8 payload parsed into structured JSON.

### Mandatory HTTP Headers:
* `Content-Type: application/jose`
* `X-API-Org-ID: member/714114:<fingerprint>` (Tanashvi Member Code 714114)
* `Authorization: Bearer <access_token>` (Required for all endpoints except `/login`)
* `X-STARMFv2-Trace-ID: <uuid>` (Unique idempotent UUID per transaction)

---

## 4. Multi-Tenant MFD Architecture & Regulatory Routing

* **Platform Master:** Tanashvi Fintech Private Limited (`714114`, ARN-347849).
* **Tenant Isolation:** Enforced at the database engine level via PostgreSQL **Row-Level Security (RLS)** (`tanashvi_core.get_current_tenant_id()`).
* **AMFI/SEBI Brokerage Routing:** Tenant MFDs transacting over Tanashvi's infrastructure have their transactions tagged in BSE payloads:
  ```json
  "member": "714114",
  "mem_details": {
    "sub_br_arn": "ARN-XXXXX",      // Tenant MFD's AMFI ARN
    "sub_br_code": "BRANCH_PUNE",    // Tenant Sub-broker/branch code
    "euin": "E123456",               // RM's Employee Unique Identification Number
    "euin_flag": true,               // TRUE for advisory, FALSE for execution-only
    "partner_id": "TENANT_SLUG"
  }
  ```

---

## 5. REST API Endpoints Overview

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/health` | Server health, gateway mode (`MOCK` vs `LIVE`), and diagnostics. |
| `POST` | `/api/v1/ucc/register` | Onboards physical/demat investors with up to 5 nominees & FATCA. |
| `POST` | `/api/v1/orders/create` | Places fresh/additional purchase or redemption; auto-evaluates IST cut-offs. |
| `POST` | `/api/v1/sxp/register` | Registers SIP / STP / SWP systematic plans. |
| `POST` | `/api/v1/mandates/create` | Registers eNACH & UPI AutoPay bank mandates. |
| `POST` | `/api/v1/webhooks/bse` | Public callback receiver for BSE payment and allotment events. |
| `POST` | `/api/v1/calculators/sip` | Regular compound SIP calculator with yearly schedule. |
| `POST` | `/api/v1/calculators/step-up-sip` | Step-up / Top-up SIP calculator with flat comparison. |
| `POST` | `/api/v1/calculators/target-sip` | Reverse target amount SIP calculator. |
| `POST` | `/api/v1/calculators/crorepati` | Become a Crorepati wealth timeline planner. |
| `POST` | `/api/v1/calculators/education` | Child higher education planner with inflation adjustments. |
| `POST` | `/api/v1/calculators/retirement` | Comprehensive two-phase retirement planner. |
| `POST` | `/api/v1/calculators/lumpsum` | Lumpsum compounding wealth calculator. |
| `POST` | `/api/v1/calculators/swp` | Systematic Withdrawal Plan (regular monthly cash flows). |
| `POST` | `/api/v1/calculators/stp` | Systematic Transfer Plan (liquid to equity rebalancing). |
| `GET` | `/api/v1/schemes/search` | Search mutual funds by keyword, AMC, category, or plan. |
| `GET` | `/api/v1/schemes/categories` | List distinct mutual fund categories. |
| `GET` | `/api/v1/schemes/:code` | Retrieve NAV, ISIN, cut-off time by AMFI code or ISIN. |
| `POST` | `/api/v1/schemes/sync` | Synchronize scheme catalog with AMFI open data feed. |
| `GET` | `/api/v1/portfolio/summary` | Portfolio summary, valuation, asset allocation, and XIRR. |
| `GET` | `/api/v1/portfolio/holdings` | Folio-wise and scheme-wise holding details with real-time NAVs. |
| `GET` | `/api/v1/portfolio/transactions` | Historical transaction ledger. |
| `POST` | `/api/v1/portfolio/cas/import` | Ingest CAMS/KFintech Consolidated Account Statements (JSON/CSV). |
| `GET` | `/api/v1/tax/capital-gains/realized` | **Budget 2024 Capital Gains Tax Report** (e.g. Ramesh Sharma). |
| `GET` | `/api/v1/tax/capital-gains/unrealized` | Unrealized capital gains & tax loss harvesting analysis. |
| `POST` | `/api/v1/proposals/create` | MFD creates multi-scheme proposal basket with magic cart link. |
| `GET` | `/api/v1/proposals/view` | Investor views proposal cart via share token (status &rarr; VIEWED). |
| `POST` | `/api/v1/proposals/execute` | Investor one-click approval &rarr; atomic BSE order & SIP execution. |
| `GET` | `/api/v1/proposals/list` | List all proposals curated by MFD. |
| `GET` | `/api/v1/research/schemes` | List flagship schemes available for deep research and analytics. |
| `GET` | `/api/v1/research/rolling-returns` | 1Y, 3Y, 5Y, 7Y rolling CAGR returns & probability distribution vs Nifty 50 TRI. |
| `GET` | `/api/v1/research/risk-ratios` | Risk-adjusted volatility ratios (Standard Deviation, Beta, Alpha, Sharpe, Sortino). |
| `POST` | `/api/v1/research/compare` | 4-way side-by-side scheme comparison matrix across trailing returns & risk. |
| `POST` | `/api/v1/research/overlap` | Fund portfolio overlap percentage & shared equity holdings breakdown. |

---

## 6. Local Development & Verification

### Prerequisites
* Node.js v20+ or v22 LTS
* npm v10+

### Phase 12: 4-Tier Roles Architecture & Report Generation (PDF / XLS)
* **Category 1: MFD Standalone Subscriber:** Independent distributor managing their own client roster, placing orders with ARN & EUIN attribution.
* **Category 2: MFD with Sub-Brokers:** Institutional distributor managing branch desks, sub-broker ARN routing, and commission revenue splits.
* **Category 3: End Investor / Client Portal:** Dedicated client-facing experience (*Ramesh Sharma*) viewing net worth, asset allocation, active SIP schedule, pending proposal carts, and capital gains statements.
* **Category 4: Tanashvi Promoters & Super-Admin:** Executive portal for Tanashvi Fintech Private Limited (Member `714114`, ARN-347849) tracking 42 subscribed MFDs, ₹148.65 Cr platform AUM, 24h BSE transaction velocity, and SEBI Regulation 25 audit trails.
* **Client-Side PDF & Formatted Excel (.xls / .csv) Engine:** 1-click export of branded portfolio valuations, capital gains tax lots, financial goal schedules, fund comparison matrices, and investor proposal dossiers.

### Phase 13: AUM / SIP / STP / SWP Analytics, Underlying Stock Look-Through & Dynamic Fund Comparison
* **AUM & Systematic Book Analytics (`AumSystematicAnalyticsView.tsx`):**
  * Dedicated dashboard for Category 1, 2, and 4 users with Total AUM, Monthly SIP Book, Active STP & SWP Books, and 13-Month Persistence tracking.
  * Breakdown charts for Asset Class distribution, AMC concentration, and monthly SIP/STP debit calendar.
  * Filterable systematic ledger with direct PDF and Excel (.xls) statement export.
* **Underlying Stock & Sector Look-Through Breakdown:**
  * Complete look-through company stock holdings (ISIN, Company, Sector, Market Cap, Weight %, Rupee Value, Contributing Funds) available in Category 1 & 2 (`PortfolioTaxView.tsx`) and Category 3 (`InvestorPortalView.tsx`).
  * Sector exposure bars and Market Capitalization split (Large Cap, Mid Cap, Small Cap).
  * SEBI AMC monthly disclosure compliance mapping alongside BSE StAR MF execution folios.
* **Dynamic Multi-Fund Comparison Matrix Enhancement (`ResearchView.tsx`):**
  * Full dynamic selection, in-column swap, and deletion controls across 14 flagship mutual fund schemes (2 to 5 funds supported).
  * 1-Click peer group presets: *Flagship Mix*, *Large Cap Bluechips*, *Mid & Small Cap Alpha*, and *Flexi & Multi Cap*.
  * Expanded analytical parameters: Overview, Trailing Returns (1M, 3M, 6M, 1Y, 3Y, 5Y, Inception), 3Y Risk Ratios (Beta, Sharpe, Jensen's Alpha, Sortino, SD, $R^2$), and Top 3 Look-Through Holdings.
  * Branded client-side PDF and Excel (.xls) dynamic report downloads.

### Phase 14: Oracle Cloud Backend Server Infrastructure & Live BSE UAT Gateway Activation
* **Dedicated Cloud Infrastructure Provisioned:**
  * **Provider:** Oracle Cloud (Always Free Tier) · Ubuntu 22.04 LTS · Static Public IP `130.210.57.235`.
  * **Anti-Idle Keepalive:** Configured twice-daily cron running `/usr/bin/stress --cpu 1 --timeout 300` to prevent instance reclamation.
  * **Node.js Environment:** Node.js v20.20.2 & NPM active in `~/bse-backend`.
  * **Cryptographic Infrastructure:** 2048-bit RSA key pair (`bse_api_public.pem` shared with BSE, `bse_api_private.pem` on server with `chmod 400`).
* **Official BSE StAR MF v2 UAT Credentials (Allocated Nov 13):**
  * **Member ID:** `94515`
  * **User ID:** `tanashvifintechpvtltd`
  * **Official v2 API Login Username Format:** `member/94515/tanashvifintechpvtltd` *(per official BSE StAR MF 2.0 Postman Collection)*
  * **Password:** `94515@Xyz`
  * **UAT Demo Gateway URL:** `https://starmfv2demo.bseindia.com/api`
* **Automated Diagnostic & Verification Suite:**
  * Created `bse-star-backend/scripts/verify_bse_uat.js` and `setup_and_test_on_server.sh` for single-command UAT verification (`/api/login` + `/api/master_scheme_list`) on the Ubuntu server.

### Phase 15: Portfolio Visualization, Diversification & Multi-Benchmark TRI Engine (All User Levels)
* **Interactive Visual Charts, Diversification Tracker & Multi-Benchmark Comparison:**
  * Supports **Nifty 50 TRI**, **Nifty 500 TRI**, **Nifty Midcap 150 TRI**, **Nifty Smallcap 250 TRI**, **BSE Sensex TRI**, **CRISIL Short Term Debt Index**, and an auto-weighted **SEBI-Style Custom Blended Benchmark**.
  * Dual-series SVG Portfolio vs. Benchmark curve (`₹ Wealth Growth` & `Base 100`), hover crosshair tooltips, Alpha Scorecard (`Portfolio XIRR vs. Benchmark XIRR`, `Net Alpha`, `Extra Wealth in ₹`, `Max Drawdown`, `Beta`, `Up/Down Capture`), interactive Asset & Market-Cap Donuts, **Portfolio Diversification & Fund Overlap Tracker** (0–100 score ring, Unique vs. Overlapping stacked bar, estimated unique stocks, and fund-to-fund pairwise overlap matrix with shared holdings), Scheme Invested vs. Current Value Bars, and Branded PDF/XLS export.
  * Deployed across **all 4 user levels**: End Investor (`InvestorPortalView`), Standalone & Network MFDs (`PortfolioTaxView` + `AumSystematicAnalyticsView`), and Tanashvi Promoters/HQ (`PromoterDashboardView`).
* **Keeping Benchmark TRI Data Updated:**
  * **One-Click Live Sync:** `POST /api/v1/benchmarks/sync` (and UI `Sync Live TRI` button) fetches live daily EOD TRI proxies from open AMFI Direct Index feeds (`api.mfapi.in`).
  * **Official NSE/BSE TRI CSV Import:** `POST /api/v1/benchmarks/import` (and UI CSV uploader) parses official `niftyindices.com` / `asiaindices.co.in` TRI CSV exports.
  * **Manual EOD Override & Weekday Server Cron:** `POST /api/v1/benchmarks/manual` + `bse-star-backend/scripts/sync_benchmarks_eod.js` for automated Mon–Fri 22:00 IST cron sync on Oracle Cloud.

### Phase 16: "Tanu" — Cute Wise Owl AI Portfolio Storyteller & Interactive Presentation
* **Animated Presenter Mascot & Bottom Runway Choreography:**
  * Custom Tanashvi Navy & Gold animated SVG wise owl (**Tanu**) powered by `motion/react` spring physics: walks smoothly across a dedicated **bottom presenter runway** beneath full-width chart slides (`10% → 30% → 50% → 70% → 84%`), pointing upward toward each slide, blinking naturally, moving its beak while speaking, and shifting expressions (`WAVING`, `HAPPY`, `CELEBRATING`, `REASSURING`, `THINKING`, `POINTING`).
* **Full-Width Graphical Presentation Slides (Last Login → Today & Custom Dates):**
  * Defaults to the investor's **Last Login Date → Today** (persisted per UCC) with inline custom date pickers, quick presets (`Last Login`, `30D`, `3M`, `1Y`), and benchmark selector (`Nifty 50 TRI`, `Nifty 500 TRI`, `Midcap 150 TRI`, `Blended Mix`).
  * Every slide presents unobstructed full-width animated graphs: **(1)** Portfolio Growth Area Graph, **(2)** Scheme-Wise Return Bar Chart + SIP Execution Summary, **(3)** Dual-Line Benchmark Comparison Graph, **(4)** Asset Allocation Donut + Fund Diversification/Overlap Gauge, and **(5)** Illustrative 5-Year Wealth Compounding Bar Graph.
* **Pure Indian-English Voice (`en-IN`), Toggleable Subtitles & Dedicated Chat Drawer:**
  * Strictly filters browser Web Speech voices to **pure English (`en-IN` prioritized)** with zero regional-language leakage, optional voice selector, smooth token-guarded Auto-Play, and a compact toggleable **`CC` Subtitles** strip.
  * **Dedicated Right-Side "Chat with Tanu" Panel** accessible from any slide (halts slide playback to focus solely on user queries) featuring **10 curated everyday investor questions** (market outperformance, top/lagging funds, SIP dips, overlap/diversification, risk, crash resilience, Budget 2024 withdrawal tax, XIRR explained, and advisor connect).
  * **Zero-Hallucination Split & SEBI Guardrails:** Deterministic TypeScript math + optional Gemini 2.5 Flash (`@google/genai`, strictly anonymized non-PII facts) with offline fallback and a permanent **AI & SEBI Caveat Banner**.
  * Available in **End Investor Portal** (floating Tanu Owl launcher + header button) and **MFD Portfolio & Tax** (`Play Client Story (Tanu)` button for client review meetings).

### Phase 17: Live BSE StAR MF Market Research & Systematic Transfer Plan (STP) Engine
* **Live BSE StAR MF Market Research Integration:**
  * **28,128 Live Schemes & 15,692 Live NAVs:** Directly queried in real-time from BSE StAR MF v2.0 UAT via the `/api/bse-uat` proxy with zero CORS issues and zero impact on `tanashvi.in`.
  * **Quick AMC Filter Chips:** Instant 1-click searches across India's premier AMCs (`PARAG PARIKH`, `HDFC`, `SBI`, `NIPPON`, `KOTAK`, `ICICI PRUDENTIAL`, `QUANT`, `MIRAE`, `TATA`, `AXIS`).
  * **Dynamic Institutional Analytics:** Generates rolling returns distributions (1Y, 3Y, 5Y, 7Y), risk metrics (Sharpe, Sortino, Beta, Alpha, SD, R²), top portfolio holdings, and AUM estimates for any live BSE scheme.
  * **1-Click Execution Handoff:** Direct action buttons (`Buy Lumpsum`, `Start XSIP`, `Setup STP`) on any searched live BSE scheme route immediately into the Order Terminal with scheme prefilled.
* **Systematic Transfer Plan (STP) Engine:**
  * **SEBI & BSE Regulatory Compliance:** Strictly enforces the operational mandate that STPs and Switches can **only occur between schemes of the exact same Fund House (AMC)** under the same Folio. The UI dynamically restricts target schemes to `s.amc === selectedSourceScheme.amc` with prominent regulatory alerts.
  * **Flexible Installment Scheduling:** Supports Weekly, Monthly, and Quarterly transfer frequencies, custom debit days (e.g., 5th of the month or every Monday), and installment count presets (6, 12, **24 [Recommended / 2 Years]**, 36, 60, custom).
  * **Capital Transfer Projections:** Real-time calculation of total capital transferred (`amount * installments`), estimated units redeemed per transaction, and projected completion date.
  * **Full Reconciliation:** STP transactions routed with official BSE `/sxp_register` payload (`sxp_type: 'stp'`), recorded in the Order Book with source-to-target mapping, cyan STP badges, and exported in the CSV audit ledger.

---

### Build & Run Offline Testbenches
```powershell
cd bse-star-backend
npm install
npm test          # Builds TypeScript and executes all 10 test suites:
                  # 1. test:jose        -> Phase 1 JOSE Cryptographic Verification
                  # 2. test:mock        -> Phase 3 Offline API Request & Simulator Testbench
                  # 3. test:webhook     -> Phase 4 State Machine & Webhook Ingestion Testbench
                  # 4. test:api         -> Phase 5 REST API Gateway & Server Testbench
                  # 5. test:calculators -> Phase 6 Mutual Fund Financial Calculators
                  # 6. test:schemes     -> Phase 7 AMFI Open NAV & Scheme Master Sync
                  # 7. test:portfolio   -> Phase 8 Client Portfolio & Budget 2024 Tax Report
                  # 8. test:proposal    -> Phase 9 MFD Proposal Basket & Magic Cart Link
                  # 9. test:research    -> Phase 11 Mutual Fund Research & Analytics Engine
                  # 10. test:benchmarks -> Phase 15 Portfolio Benchmarking & TRI Sync Engine
```

### Start Development Server
```powershell
npm run dev       # Runs HTTP API Server with tsx auto-reload on http://localhost:4000
```

### Run Frontend Integration Terminal
```powershell
cd ../bse-star-mf-integration-terminal
npm install
npm run dev       # Runs Vite dev server on http://localhost:5173
```

### Apply Database Migrations
```powershell
npm run db:migrate # Applies SQL migrations with Row-Level Security to PostgreSQL
```
