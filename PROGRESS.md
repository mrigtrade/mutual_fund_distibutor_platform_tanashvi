# Tanashvi B2B Mutual Fund Platform - Development Progress Tracker

> ### 🛡️ Core Architectural Mandate
> **Zero Live Dependency (Offline/Mock-First):**
> Since BSE requires static IP whitelisting before any inbound connection to their gateway is permitted, the entire platform (security, state machines, DTO builders, financial calculators, valuation engines, and proposal workflows) is designed to run self-contained locally against simulated BSE responses and offline seed fixtures.

---

## 📊 Phase Roadmap & Current Status

| Phase | Description | Status | Verification |
| :--- | :--- | :--- | :--- |
| **Task 1** | Codebase Review & Assessment of BSE v2 Specs & Wrappers | **COMPLETED** | Identified wrapper plaintext gap & V1/V2 mismatch |
| **Phase 1** | Foundational Architecture, Multi-Tenant Routing & JOSE Security | **COMPLETED** | Verified via `test_jose_security.ts` (Passed) |
| **Phase 2** | Core Data Models & Schemas (UCC, Nominees, Schemes, Orders) | **COMPLETED** | SQL migrations & TypeScript types compiled clean |
| **Phase 3** | API Request Structuring & Local BSE Gateway Simulator (Mock) | **COMPLETED** | Verified via `test_phase3_mock_integration.ts` (Passed) |
| **Phase 4** | State Machine, Webhook Ingestion & Cut-Off Reconciliation | **COMPLETED** | Verified via `test_phase4_webhook_state_machine.ts` (Passed) |
| **Phase 5** | REST API Gateway Server, Hot-Toggle Transport & Database Driver | **COMPLETED** | Verified via `test_phase5_api_server.ts` (Passed) |
| **Phase 6** | Mutual Fund & Goal Calculator Suite (AdvisorKhoj Feature Set) | **COMPLETED** | Verified via `test_calculators.ts` (Passed) |
| **Phase 7** | Daily AMFI Open NAV & Scheme Master Ingestion Engine | **COMPLETED** | Verified via `test_amfi_nav.ts` (Passed) |
| **Phase 8** | Client Portfolio, CAS Parser & Capital Gains Engine (Budget 2024) | **COMPLETED** | Verified via `test_phase8_portfolio_tax.ts` (Passed) |
| **Phase 9** | MFD Proposal Basket & Investment Cart Link Engine | **COMPLETED** | Verified via `test_phase9_proposal_cart.ts` (Passed) |
| **Phase 10** | Modern Frontend Web UI & Tanashvi Brand Experience | **COMPLETED** | Verified via Vite build (Lotus logo, theme, calculators, portfolio tax, cart) |
| **Phase 11** | MF Research & Analytics Engine (AdvisorKhoj Parity) | **COMPLETED** | Verified via `test_phase11_research.ts` (Passed 100%) |
| **Phase 12** | Live BSE Sandbox Integration (Post Static IP Whitelisting) | **IN PROGRESS (LIVE AUTH VERIFIED!)** | **HTTP 200 OK** on `/api/login` (`member/94515/tanashvifintechpvtltd`) & **28,128 live schemes** fetched via `/api/master_scheme_list` from `130.210.57.235` |

---

## 📝 Detailed Log of Completed Work

### Task 1: Codebase Review & Assessment
* **Analyzed Initial Development (`bse-star-mf-integration-terminal`):**
  * Identified that the AI Studio frontend prototype simulated legacy BSE StAR MF V1 SOAP Web Services with pipe-delimited XML payloads (`/StarMFWebService/ClientRegistration_UCC`).
  * Confirmed that it had no backend database, no real tenant isolation, and no BSE v2 REST endpoints.
* **Analyzed BSE API Documentation & SDK Wrappers (`api_unzipped_docs`):**
  * Discovered the critical **"Wrapper Trap"**: The official Node.js SDK (`bse-starmfv2-sdk`) and Python SDK wrapper send unencrypted `application/json` without the mandatory `X-API-Org-ID` header. Running them live would fail immediately.
  * Extracted the true production specification from `BSE StARMF v2 - EncryptDecrypt.pdf` and standalone python reference scripts: compact JWS wrapping JWE (RSA-OAEP-256 + A256GCM / RS256).
* **Multi-Tenant Routing Rules:**
  * Master Member: Tanashvi Fintech Private Limited (Member Code `714114`, ARN-347849).
  * Tenant MFD routing via `mem_details.sub_br_arn` and `sub_br_code`.
  * Mandatory SEBI EUIN compliance checks before dispatch.

---

### Phase 1: Foundational Architecture & Security Setup
* **PostgreSQL Multi-Tenant Routing Schema:**
  * File: [`001_phase1_multitenant_routing.sql`](file:///c:/Users/mrigt/Documents/mrig_new_laptop/mrig/tanashvi/mf-platform_dev/bse-star-backend/src/database/migrations/001_phase1_multitenant_routing.sql)
  * Tables: `tenants`, `tenant_bse_credentials`, `tenant_sub_brokers`, `tenant_euins`, `users`, `bse_api_audit_logs`.
  * Implemented PostgreSQL **Row-Level Security (RLS)** using `tanashvi_core.get_current_tenant_id()` and `app.is_super_admin`.
* **Production JOSE Security Module (`jose.ts`):**
  * File: [`src/security/jose.ts`](file:///c:/Users/mrigt/Documents/mrig_new_laptop/mrig/tanashvi/mf-platform_dev/bse-star-backend/src/security/jose.ts)
  * `ctEncrypt()`: Serializes payload, encrypts with BSE Public Key (RSA-OAEP-256 + A256GCM) -> JWE, signs with Member Private Key (RS256) -> compact JWS string (`application/jose`).
  * `ctDecrypt()`: Verifies signature with BSE Public Key, decrypts inner JWE with Member Private Key, parses JSON.
* **Header Injection Service (`bseHeaders.ts`):**
  * File: [`src/security/bseHeaders.ts`](file:///c:/Users/mrigt/Documents/mrig_new_laptop/mrig/tanashvi/mf-platform_dev/bse-star-backend/src/security/bseHeaders.ts)
  * Injects `X-API-Org-ID: member/714114:<fingerprint>`, `Content-Type: application/jose`, `X-STARMFv2-Trace-ID`, and `Authorization: Bearer <token>`.
* **Automated Cryptographic Testbench:**
  * File: [`src/tests/test_jose_security.ts`](file:///c:/Users/mrigt/Documents/mrig_new_laptop/mrig/tanashvi/mf-platform_dev/bse-star-backend/src/tests/test_jose_security.ts)
  * Status: **PASSED (100% round-trip verified)**.

---

### Phase 2: Core Data Models & Schemas
* **Database Migration:**
  * File: [`002_phase2_core_schemas.sql`](file:///c:/Users/mrigt/Documents/mrig_new_laptop/mrig/tanashvi/mf-platform_dev/bse-star-backend/src/database/migrations/002_phase2_core_schemas.sql)
* **Investor UCC Profiles:**
  * Strict separation of Physical vs. Demat (`is_client_physical`, `is_client_demat`, CDSL/NSDL DP IDs).
  * **Up to 5 Nominees** (`ucc_nominees`, rank 1 to 5, percentage summing to 100%, minor/guardian fields).
  * Multi-Holder (ranks 1 to 3 for Single/Joint/AS), CKYC, multiple bank accounts (up to 5), and FATCA declarations.
  * TypeScript interfaces: [`src/types/ucc.ts`](file:///c:/Users/mrigt/Documents/mrig_new_laptop/mrig/tanashvi/mf-platform_dev/bse-star-backend/src/types/ucc.ts).
* **Master Scheme Catalog & Cut-offs:**
  * Canonical BSE Scheme Code (`scheme_bse_code` PK) mapped to ISIN and AMFI codes.
  * Statutory cut-offs: Liquid/Overnight (13:30 IST) vs. Equity/Debt (15:00 IST).
  * Feature flags (`sip_flag`, `stp_in_flag`, `swp_flag`, `switch_in_flag`, physical/demat allowed).
  * Daily NAV history table (`scheme_nav_history`).
  * TypeScript interfaces: [`src/types/scheme.ts`](file:///c:/Users/mrigt/Documents/mrig_new_laptop/mrig/tanashvi/mf-platform_dev/bse-star-backend/src/types/scheme.ts).
* **Order Engine & Systematic (SxP) Engine:**
  * Mapping internal IDs to BSE IDs: `mem_ord_ref_id` &harr; `bse_order_no`, `mem_sxp_ref_id` &harr; `bse_reg_no`, `mem_mandate_id` &harr; `bse_mandate_id`.
  * Complete order state machine (`DRAFT` &rarr; `VALIDATED` &rarr; `QUEUED` &rarr; `SUBMITTED` &rarr; `ACCEPTED` &rarr; `AWAITING_PAYMENT` &rarr; `PAYMENT_CONFIRMED` &rarr; `UNITS_ALLOTTED`).
  * Systematic registrations (SIP, XSIP, STP, SWP) with installment ledger table (`systematic_installments`).
  * Mandate engine for eNACH, UPI AutoPay, and Paper NACH.
  * Regulatory attribution (`sub_br_arn`, `sub_br_code`, `euin`, `euin_flag`).
  * TypeScript interfaces: [`src/types/order.ts`](file:///c:/Users/mrigt/Documents/mrig_new_laptop/mrig/tanashvi/mf-platform_dev/bse-star-backend/src/types/order.ts).

---

### Phase 3: API Request Structuring & Local BSE Gateway Simulator
* **BSE v2 Request DTO Builders:**
  * [`src/builders/uccRequestBuilder.ts`](file:///c:/Users/mrigt/Documents/mrig_new_laptop/mrig/tanashvi/mf-platform_dev/bse-star-backend/src/builders/uccRequestBuilder.ts): Formats `/api/v2/add_ucc` payloads.
  * [`src/builders/orderRequestBuilder.ts`](file:///c:/Users/mrigt/Documents/mrig_new_laptop/mrig/tanashvi/mf-platform_dev/bse-star-backend/src/builders/orderRequestBuilder.ts): Formats `/api/order_new` payloads.
  * [`src/builders/sxpRequestBuilder.ts`](file:///c:/Users/mrigt/Documents/mrig_new_laptop/mrig/tanashvi/mf-platform_dev/bse-star-backend/src/builders/sxpRequestBuilder.ts): Formats `/api/sxp_register` payloads.
  * [`src/builders/mandateRequestBuilder.ts`](file:///c:/Users/mrigt/Documents/mrig_new_laptop/mrig/tanashvi/mf-platform_dev/bse-star-backend/src/builders/mandateRequestBuilder.ts): Formats `/api/mandate_register` payloads.
* **Local BSE Gateway Simulator (Mock Engine):**
  * [`src/mock/bseMockGateway.ts`](file:///c:/Users/mrigt/Documents/mrig_new_laptop/mrig/tanashvi/mf-platform_dev/bse-star-backend/src/mock/bseMockGateway.ts): Fully self-contained offline simulator executing full JWE/JWS round-trips.
* **End-to-End Offline Testbench:**
  * [`src/tests/test_phase3_mock_integration.ts`](file:///c:/Users/mrigt/Documents/mrig_new_laptop/mrig/tanashvi/mf-platform_dev/bse-star-backend/src/tests/test_phase3_mock_integration.ts): Automated test verifying Login &rarr; UCC &rarr; Mandate &rarr; SIP &rarr; Lumpsum.
  * Status: **PASSED (100% SUCCESS with zero live dependencies)**.

---

### Phase 4: State Machine, Webhook Ingestion & Cut-Off Reconciliation
* **Statutory Cut-Off & NAV Reconciliation Service:**
  * [`src/services/cutoffReconciliation.ts`](file:///c:/Users/mrigt/Documents/mrig_new_laptop/mrig/tanashvi/mf-platform_dev/bse-star-backend/src/services/cutoffReconciliation.ts): Implements SEBI statutory cut-off logic in IST for Liquid (13:30 IST) and Equity/Debt (15:00 IST), handling same-day NAV determinations and weekend rollovers.
* **Transaction State Machine (`orderStateMachine.ts`):**
  * [`src/services/orderStateMachine.ts`](file:///c:/Users/mrigt/Documents/mrig_new_laptop/mrig/tanashvi/mf-platform_dev/bse-star-backend/src/services/orderStateMachine.ts): Atomic lifecycle engine with transition guards.
* **BSE Webhook Ingestion Controller (`bseWebhookController.ts`):**
  * [`src/controllers/bseWebhookController.ts`](file:///c:/Users/mrigt/Documents/mrig_new_laptop/mrig/tanashvi/mf-platform_dev/bse-star-backend/src/controllers/bseWebhookController.ts): Ingestion receiver for all 5 BSE event types (`PAYMENT GATEWAY`, `ORDER`, `MANDATES`, `SXP`, `UCC`).
* **Automated Phase 4 Testbench:**
  * [`src/tests/test_phase4_webhook_state_machine.ts`](file:///c:/Users/mrigt/Documents/mrig_new_laptop/mrig/tanashvi/mf-platform_dev/bse-star-backend/src/tests/test_phase4_webhook_state_machine.ts): Full lifecycle verification.
  * Status: **PASSED (100% SUCCESS)**.

---

### Phase 5: REST API Gateway, Hot-Toggle Transport & Database Driver
* **REST API Gateway (Express Application Server):**
  * Files: [`src/app.ts`](file:///c:/Users/mrigt/Documents/mrig_new_laptop/mrig/tanashvi/mf-platform_dev/bse-star-backend/src/app.ts) & [`src/server.ts`](file:///c:/Users/mrigt/Documents/mrig_new_laptop/mrig/tanashvi/mf-platform_dev/bse-star-backend/src/server.ts)
* **Multi-Tenant Context & Compliance Middleware:**
  * File: [`src/middleware/tenantContext.ts`](file:///c:/Users/mrigt/Documents/mrig_new_laptop/mrig/tanashvi/mf-platform_dev/bse-star-backend/src/middleware/tenantContext.ts)
* **Unified Transport Abstraction & Hot-Toggle (`bseTransport.ts`):**
  * Seamlessly toggles between `BseSimulatorTransport` (offline mock) and `BseHttpLiveTransport` (live HTTPS gateway).
* **Automated Phase 5 Testbench:**
  * File: [`src/tests/test_phase5_api_server.ts`](file:///c:/Users/mrigt/Documents/mrig_new_laptop/mrig/tanashvi/mf-platform_dev/bse-star-backend/src/tests/test_phase5_api_server.ts)
  * Status: **PASSED (100% SUCCESS)**.

---

### Phase 6: Mutual Fund & Goal Calculator Suite (AdvisorKhoj Feature Set)
* **Mathematical Engines Implemented:**
  * [`src/calculators/sipCalculators.ts`](file:///c:/Users/mrigt/Documents/mrig_new_laptop/mrig/tanashvi/mf-platform_dev/bse-star-backend/src/calculators/sipCalculators.ts): Standard SIP, Step-Up SIP (annual % or fixed ₹ increase), Target Amount SIP (Reverse SIP).
  * [`src/calculators/goalCalculators.ts`](file:///c:/Users/mrigt/Documents/mrig_new_laptop/mrig/tanashvi/mf-platform_dev/bse-star-backend/src/calculators/goalCalculators.ts): Become a Crorepati Planner, Child Higher Education Planner, Comprehensive Retirement Planner.
  * [`src/calculators/withdrawalCalculators.ts`](file:///c:/Users/mrigt/Documents/mrig_new_laptop/mrig/tanashvi/mf-platform_dev/bse-star-backend/src/calculators/withdrawalCalculators.ts): Lumpsum Compounding, SWP (Systematic Withdrawal Plan with corpus exhaustion alerts), STP (Systematic Transfer Plan).
* **REST Endpoints:** Mounted in [`src/routes/calculatorRoutes.ts`](file:///c:/Users/mrigt/Documents/mrig_new_laptop/mrig/tanashvi/mf-platform_dev/bse-star-backend/src/routes/calculatorRoutes.ts) under `/api/v1/calculators/*`.
* **Automated Phase 6 Testbench:**
  * File: [`src/tests/test_calculators.ts`](file:///c:/Users/mrigt/Documents/mrig_new_laptop/mrig/tanashvi/mf-platform_dev/bse-star-backend/src/tests/test_calculators.ts)
  * Status: **PASSED (100% SUCCESS)**.

---

### Phase 7: Daily AMFI Open NAV & Scheme Master Synchronization
* **Open Public Feed Ingestion (`amfiNavService.ts`):**
  * File: [`src/services/amfiNavService.ts`](file:///c:/Users/mrigt/Documents/mrig_new_laptop/mrig/tanashvi/mf-platform_dev/bse-star-backend/src/services/amfiNavService.ts)
  * Ingests open public NAVAll feed (`https://www.amfiindia.com/spages/NAVAll.txt`) with zero static IP whitelist requirement.
  * Includes local seed fixture [`src/fixtures/amfi_nav_sample.txt`](file:///c:/Users/mrigt/Documents/mrig_new_laptop/mrig/tanashvi/mf-platform_dev/bse-star-backend/src/fixtures/amfi_nav_sample.txt) for 100% offline self-contained operation.
  * Automatic scheme classification (Broad Category, Plan, Option, Statutory Cut-off 13:30 vs 15:00 IST).
* **REST Endpoints:** Mounted in [`src/routes/schemeRoutes.ts`](file:///c:/Users/mrigt/Documents/mrig_new_laptop/mrig/tanashvi/mf-platform_dev/bse-star-backend/src/routes/schemeRoutes.ts):
  * `GET /api/v1/schemes/search`, `GET /api/v1/schemes/categories`, `GET /api/v1/schemes/:code`, `POST /api/v1/schemes/sync`.
* **Automated Phase 7 Testbench:**
  * File: [`src/tests/test_amfi_nav.ts`](file:///c:/Users/mrigt/Documents/mrig_new_laptop/mrig/tanashvi/mf-platform_dev/bse-star-backend/src/tests/test_amfi_nav.ts)
  * Status: **PASSED (100% SUCCESS)**.

---

### Phase 8: Client Portfolio, CAS Parser & Capital Gains Engine (Budget 2024 Rules)
* **High-Precision XIRR Calculator (`xirrCalculator.ts`):**
  * File: [`src/services/xirrCalculator.ts`](file:///c:/Users/mrigt/Documents/mrig_new_laptop/mrig/tanashvi/mf-platform_dev/bse-star-backend/src/services/xirrCalculator.ts)
  * Computes money-weighted annualized returns for irregular cashflows using Newton-Raphson with bounded Bisection fallback.
* **Union Budget 2024 Capital Gains Tax Engine (`capitalGainsService.ts`):**
  * File: [`src/services/capitalGainsService.ts`](file:///c:/Users/mrigt/Documents/mrig_new_laptop/mrig/tanashvi/mf-platform_dev/bse-star-backend/src/services/capitalGainsService.ts)
  * **Effective Cutoff Date**: Transfers on or after **July 23, 2024**.
  * **Equity STCG**: **20%** post-Budget 2024 (15% prior).
  * **Equity LTCG**: **12.5%** post-Budget 2024 (10% prior) with **₹1,25,000 annual exemption limit** per financial year.
  * **Section 112A Grandfathering**: Pre-31-Jan-2018 acquisitions evaluated against Fair Market Value (FMV).
  * **Section 50AA Debt Mutual Funds**: Units purchased on/after April 1, 2023 deemed STCG taxed at marginal slab rate.
  * **FIFO Lot Matching**: Chronological unit consumption across partial/full redemption lots.
  * **4% Health & Education Cess** computed across all gains.
* **CAS (Consolidated Account Statement) Ingestion Parser (`casParserService.ts`):**
  * File: [`src/services/casParserService.ts`](file:///c:/Users/mrigt/Documents/mrig_new_laptop/mrig/tanashvi/mf-platform_dev/bse-star-backend/src/services/casParserService.ts)
  * Parses CAMS / KFintech JSON and CSV exports into folios, schemes, and transaction ledgers.
* **Portfolio Valuation & Aggregator (`portfolioService.ts`):**
  * File: [`src/services/portfolioService.ts`](file:///c:/Users/mrigt/Documents/mrig_new_laptop/mrig/tanashvi/mf-platform_dev/bse-star-backend/src/services/portfolioService.ts)
  * Realistic seed fixture for investor **Ramesh Sharma** (`ramesh_portfolio_sample.json`).
  * Real-time NAV valuation, portfolio XIRR, and asset allocation breakdown (Equity % vs Debt % vs Liquid %).
* **REST Endpoints & AdvisorKhoj Feature:**
  * Implements the AdvisorKhoj platform banner: *"Generate capital gains report for Ramesh"*.
  * `GET /api/v1/portfolio/summary?client_code=UCC-RAMESH-001`
  * `GET /api/v1/portfolio/holdings?client_code=UCC-RAMESH-001`
  * `GET /api/v1/tax/capital-gains/realized?client_code=UCC-RAMESH-001&fy=2024-2025`
  * `GET /api/v1/tax/capital-gains/unrealized?client_code=UCC-RAMESH-001`
  * `POST /api/v1/portfolio/cas/import`
* **Automated Phase 8 Testbench:**
  * File: [`src/tests/test_phase8_portfolio_tax.ts`](file:///c:/Users/mrigt/Documents/mrig_new_laptop/mrig/tanashvi/mf-platform_dev/bse-star-backend/src/tests/test_phase8_portfolio_tax.ts)
  * Status: **PASSED (100% SUCCESS)**.

---

### Phase 9: MFD Proposal Basket & Investment Cart Link Engine
* **Proposal & Cart Engine (`proposalService.ts`):**
  * File: [`src/services/proposalService.ts`](file:///c:/Users/mrigt/Documents/mrig_new_laptop/mrig/tanashvi/mf-platform_dev/bse-star-backend/src/services/proposalService.ts)
  * Enables MFDs to bundle multi-scheme investment baskets (Lumpsums + SIPs) with regulatory ARN (`ARN-347849`) and EUIN (`E123456`) attribution.
  * Generates cryptographically secure, shareable **Magic Cart Links** for investors.
  * Lifecycle state machine: `SENT_TO_INVESTOR` &rarr; `VIEWED` (auto-tracked on link open) &rarr; `EXECUTING` &rarr; `EXECUTED`.
  * **One-Click Atomic BSE Execution**: Decomposes the approved cart into BSE lumpsum orders (`/api/order_new`) and systematic SIPs (`/api/sxp_register`), generating payment gateway links and registration numbers.
  * Guardrails against tampered tokens and double-execution attempts.
* **Database Schema Migration:**
  * File: [`004_phase9_proposal_baskets.sql`](file:///c:/Users/mrigt/Documents/mrig_new_laptop/mrig/tanashvi/mf-platform_dev/bse-star-backend/src/database/migrations/004_phase9_proposal_baskets.sql)
  * Tables: `mfd_proposals`, `mfd_proposal_items` with Row-Level Security (RLS).
* **REST Endpoints:** Mounted in [`src/routes/proposalRoutes.ts`](file:///c:/Users/mrigt/Documents/mrig_new_laptop/mrig/tanashvi/mf-platform_dev/bse-star-backend/src/routes/proposalRoutes.ts):
  * `POST /api/v1/proposals/create`
  * `GET /api/v1/proposals/view?token=...`
  * `POST /api/v1/proposals/execute`
  * `GET /api/v1/proposals/list`
  * `GET /api/v1/proposals/:id`
* **Automated Phase 9 Testbench:**
  * File: [`src/tests/test_phase9_proposal_cart.ts`](file:///c:/Users/mrigt/Documents/mrig_new_laptop/mrig/tanashvi/mf-platform_dev/bse-star-backend/src/tests/test_phase9_proposal_cart.ts)
  * Status: **PASSED (100% SUCCESS)**.

---

### Phase 10: Modern Frontend Web UI & Tanashvi Brand Experience
* **Tanashvi Brand Integration:**
  * Imported stylized Lotus (Padma) emblem from `logo/tanashvi_logo_ver1.jpeg`.
  * Created [`TanashviLogo.tsx`](file:///c:/Users/mrigt/Documents/mrig_new_laptop/mrig/tanashvi/mf-platform_dev/bse-star-mf-integration-terminal/src/components/TanashviLogo.tsx) with `header`, `hero`, and `compact` variants.
  * Embedded corporate motto **"भवतः हिताय"** (*"For Your Welfare"*) and official website link `https://www.tanashvi.in`.
  * Palette: Bespoke Navy (`#0a192f`) & Refined Gold (`#c5a059`) with `Libre Baskerville` and `Inter` typography.
* **Workspace Modules:**
  * Interactive tabs for Order Terminal, UCC Onboarding, Mandates, Order Book, Sub-Distributor Hierarchy, Financial Calculators, Portfolio & Tax, and Proposal Cart.
  * Verified production build via Vite (`npm run build`).

---

### Phase 11: Mutual Fund Research & Analytics Engine (AdvisorKhoj Parity)
* **Rolling Returns vs Benchmark Engine:**
  * File: [`src/services/rollingReturnsService.ts`](file:///c:/Users/mrigt/Documents/mrig_new_laptop/mrig/tanashvi/mf-platform_dev/bse-star-backend/src/services/rollingReturnsService.ts)
  * Calculates rolling CAGR returns over 1Y, 3Y, 5Y, and 7Y investment horizons.
  * Computes Average, Median, Min/Max range, and return probability distribution:
    - Negative returns ($<0\%$)
    - Below FD ($0\% - 8\%$)
    - Moderate equity ($8\% - 12\%$)
    - Healthy wealth creation ($12\% - 15\%$)
    - Alpha compounding ($>15\%$)
  * Synchronized day-by-day comparison with **NIFTY 50 TRI** benchmark.
* **Risk Ratios & Volatility Metrics Engine:**
  * File: [`src/services/riskRatiosService.ts`](file:///c:/Users/mrigt/Documents/mrig_new_laptop/mrig/tanashvi/mf-platform_dev/bse-star-backend/src/services/riskRatiosService.ts)
  * Enforces standard financial formulas:
    - Annualized Standard Deviation ($\sigma = \sigma_{\text{daily}} \sqrt{252}$)
    - Beta ($\beta = \text{Cov}(r_s, r_b) / \text{Var}(r_b)$)
    - Jensen's Alpha ($\alpha = (R_s - R_f) - \beta (R_b - R_f)$) with 6.50% RBI T-Bill rate
    - Sharpe Ratio ($S = (R_s - R_f) / \sigma$)
    - Sortino Ratio (downside risk deviation)
    - Correlation & R-Squared ($R^2$)
* **Portfolio Overlap Analysis Engine:**
  * File: [`src/services/portfolioOverlapService.ts`](file:///c:/Users/mrigt/Documents/mrig_new_laptop/mrig/tanashvi/mf-platform_dev/bse-star-backend/src/services/portfolioOverlapService.ts)
  * Exact stock-by-stock overlap: $\sum \min(W_{A,k}, W_{B,k})$.
  * Common shared holdings table and unique stocks breakdown to prevent over-diversification.
* **Multi-Scheme 4-Way Comparison Matrix:**
  * Side-by-side comparison across AUM, TER, fund managers, trailing returns (1M, 3M, 6M, 1Y, 3Y, 5Y), risk ratios, top 5 holdings, and sector allocations.
* **Database Schema Migration:**
  * File: [`005_phase11_research_analytics.sql`](file:///c:/Users/mrigt/Documents/mrig_new_laptop/mrig/tanashvi/mf-platform_dev/bse-star-backend/src/database/migrations/005_phase11_research_analytics.sql)
* **REST Endpoints:** Mounted in [`src/routes/researchRoutes.ts`](file:///c:/Users/mrigt/Documents/mrig_new_laptop/mrig/tanashvi/mf-platform_dev/bse-star-backend/src/routes/researchRoutes.ts):
  * `GET /api/v1/research/schemes`
  * `GET /api/v1/research/rolling-returns?schemeCode=...&years=...`
  * `GET /api/v1/research/risk-ratios?schemeCode=...&periodYears=...`
  * `POST /api/v1/research/compare`
  * `POST /api/v1/research/overlap`
* **Frontend Research View:**
  * File: [`src/components/ResearchView.tsx`](file:///c:/Users/mrigt/Documents/mrig_new_laptop/mrig/tanashvi/mf-platform_dev/bse-star-mf-integration-terminal/src/components/ResearchView.tsx)
  * Added **MF Research** tab in `Header.tsx` and `App.tsx`.
* **Automated Phase 11 Testbench:**
  * File: [`src/tests/test_phase11_research.ts`](file:///c:/Users/mrigt/Documents/mrig_new_laptop/mrig/tanashvi/mf-platform_dev/bse-star-backend/src/tests/test_phase11_research.ts)
  * Status: **PASSED (100% SUCCESS)**.

---

### Phase 12: Multi-Tenant 4-Role Architecture & PDF/XLS Report Generation
* **4-Tier User Role Matrix & Active Persona Switcher:**
  * **Category 1: MFD Standalone Subscriber:** Independent distributor subscriber serving their own clients with dedicated UCC onboarding, Order Engine, Mandates, Proposal Baskets, and Calculators.
  * **Category 2: MFD with Sub-Brokers (Institutional / Multi-Branch Network):** Multi-branch distributor network managing branch desks (`tenant_sub_brokers`), RM EUIN attribution (`tenant_euins`), and commission sharing splits (e.g. 70/30).
  * **Category 3: End Investor / Client Portal (`InvestorPortalView.tsx`):**
    * File: [`src/components/InvestorPortalView.tsx`](file:///c:/Users/mrigt/Documents/mrig_new_laptop/mrig/tanashvi/mf-platform_dev/bse-star-mf-integration-terminal/src/components/InvestorPortalView.tsx)
    * Personalized client dashboard (e.g., *Ramesh Sharma*, UCC `UCC-RAMESH-001`, PAN `AAAPS1234K`).
    * Consolidated portfolio valuation (₹3.84L), scheme holdings with XIRR, asset allocation, active SIP calendar with e-NACH debits, pending proposal baskets with one-click payment checkout, and ITR capital gains tax statements.
    * Back-office distributor tools (Scheme Master, UCC registration, BSE logs, Sub-distributors) hidden for security and simplicity.
  * **Category 4: Tanashvi Promoters & Platform Super-Admin (`PromoterDashboardView.tsx`):**
    * File: [`src/components/PromoterDashboardView.tsx`](file:///c:/Users/mrigt/Documents/mrig_new_laptop/mrig/tanashvi/mf-platform_dev/bse-star-mf-integration-terminal/src/components/PromoterDashboardView.tsx)
    * Executive control center for Tanashvi Fintech Private Limited (ARN-347849, BSE Member `714114`).
    * Aggregated metrics across 42 subscribed MFDs, ₹148.65 Cr cumulative platform AUM, 14,250 folios, 24-hour BSE transaction throughput (₹84.5L, 99.4% success), BSE gateway latency monitor (avg 318ms), and SEBI Regulation 25 immutable 7-year audit logs.
* **Unified Role & Persona Switcher Modal:**
  * File: [`src/components/SubDistributorModal.tsx`](file:///c:/Users/mrigt/Documents/mrig_new_laptop/mrig/tanashvi/mf-platform_dev/bse-star-mf-integration-terminal/src/components/SubDistributorModal.tsx)
  * Instant 1-click persona switching between Tanashvi HQ, Standalone MFD (Apex Wealth), Network Sub-Broker (Amit Wealth / Pooja Financial), and End Investor (Ramesh Sharma).
* **Client-Side PDF & Formatted Excel (.xls / .csv) Reporting Utility:**
  * File: [`src/utils/exportUtils.ts`](file:///c:/Users/mrigt/Documents/mrig_new_laptop/mrig/tanashvi/mf-platform_dev/bse-star-mf-integration-terminal/src/utils/exportUtils.ts)
  * Implemented using `jspdf` and `jspdf-autotable` with Tanashvi header, branding ("भवतः हिताय"), date, styled data tables, KPI summary cards, and SEBI compliance disclaimers.
  * Formatted Excel XML (.xls) and CSV export for spreadsheets.
* **Export Integrations across Views:**
  * **Portfolio & Tax (`PortfolioTaxView.tsx`):** Portfolio Valuation Statement (PDF & XLS), Capital Gains Tax Statement (PDF & XLS).
  * **Calculators (`CalculatorsView.tsx`):** Goal & SIP Amortization Schedule (PDF & XLS).
  * **Proposal Cart (`ProposalCartView.tsx`):** Investment Proposal Dossier (PDF).
  * **MF Research (`ResearchView.tsx`):** 4-Way Comparison Report & Portfolio Overlap Report (PDF & XLS).
  * **Promoter Dashboard (`PromoterDashboardView.tsx`):** Subscribed MFD Directory & Regulatory Audit Trail (PDF & XLS).
  * **Investor Portal (`InvestorPortalView.tsx`):** Client Account Statement & Capital Gains ITR Report (PDF & XLS).

---

### Phase 13: AUM / SIP / STP / SWP Systematic Analytics & Underlying Stock Look-Through Breakdown
* **AUM & Systematic Book Analytics Component (`AumSystematicAnalyticsView.tsx`):**
  * File: [`src/components/AumSystematicAnalyticsView.tsx`](file:///c:/Users/mrigt/Documents/mrig_new_laptop/mrig/tanashvi/mf-platform_dev/bse-star-mf-integration-terminal/src/components/AumSystematicAnalyticsView.tsx)
  * Supported roles: **Category 1 (Standalone MFD)**, **Category 2 (Network MFD with Sub-Brokers)**, and **Category 4 (Tanashvi Promoters & Super-Admin)**.
  * Real-time metrics: Total AUM, Monthly SIP Book, Active STP Book, Active SWP Book, and 13-Month Persistence rate (e.g. 88.4% to 92.4%).
  * Visual intelligence:
    * **Asset Class Breakdown:** Equity, Debt, Hybrid, Liquid/Arbitrage split.
    * **AMC Concentration:** Top fund houses (HDFC, ICICI Prudential, Parag Parikh, SBI, Nippon India).
    * **Systematic Debit Calendar:** Cashflow volumes scheduled across 1st, 5th, 10th, 15th, 20th, and 25th debit days.
  * Searchable & filterable Systematic Ledger (`SIP`, `STP`, `SWP`, `ACTIVE`, `PAUSED`, `COMPLETED`) with direct PDF and Excel (.xls) export.
* **Underlying Stock & Sector Look-Through Breakdown:**
  * Supported roles: **Category 1 (Standalone MFD)**, **Category 2 (Network MFD)** in `PortfolioTaxView.tsx`, and **Category 3 (End Investor)** in `InvestorPortalView.tsx`.
  * **Stock-Level Look-Through Table:** Displays underlying company name, ISIN, industry sector, market capitalization class (Large/Mid/Small Cap), effective percentage weight, equivalent Rupee valuation, and contributing schemes.
  * **Industry Sector Exposure:** Interactive progress bar and list breakdown (Financial Services 31.8%, Information Technology 14.5%, FMCG 11.2%, Energy 8.9%, Capital Goods 7.4%, Automobile 6.2%, etc.).
  * **Market Cap Distribution:** Visual distribution split (Large Cap 74.5%, Mid Cap 16.2%, Small Cap 9.3%).
  * **SEBI Compliance Architecture Notice:** Clearly clarifies the separation of concerns:
    * *BSE StAR MF:* Order routing, client UCC, payment collection, and folio unit settlement.
    * *AMC Monthly Disclosures:* Stock holdings and company weights sourced from SEBI-mandated monthly disclosures (published on the 10th of every month) mapped to active folio units.
  * Branded PDF (`underlying_stocks_<client>.pdf`) and Excel (`underlying_stocks_<client>.xls`) exports.
* **Dynamic Multi-Fund Comparison Matrix Enhancement (`ResearchView.tsx`):**
  * Added dynamic scheme selection, in-column swap, and deletion controls for the Fund Comparison matrix.
  * Allows distributors to add schemes from an extensive library of 14 flagship mutual funds (up to 5 funds simultaneously) or delete columns down to 2 funds.
  * Added quick one-click category presets: *Flagship Mix*, *Large Cap Bluechips*, *Mid & Small Cap Alpha*, and *Flexi & Multi Cap*.
  * Added column-level swap dropdowns, trailing returns (1M, 3M, 6M, 1Y, 3Y, 5Y, Inception), 3-year risk-adjusted ratios, and top look-through equity holdings.
  * Dynamically updates the generated comparison PDF and Excel (.xls) reports.

---

### Phase 14: Oracle Cloud Infrastructure & Live BSE UAT Gateway Activation
* **Backend Server Infrastructure Provisioned & Daemonized:**
  * **Provider:** Oracle Cloud Infrastructure (Always Free Tier) · Ubuntu 22.04 LTS.
  * **Reserved Static Public IP:** `130.210.57.235` (Whitelisted by BSE).
  * **OCI Security List & Host Firewall:** Configured Ingress Rules for destination ports `3000-4000` (TCP, `0.0.0.0/0`), and inserted Rule #1 in Ubuntu `iptables` (`sudo iptables -I INPUT 1 -p tcp --dport 3000 -j ACCEPT; netfilter-persistent save`).
  * **Daemon Process:** Express server managed under PM2 (`pm2 start index.js --name bse-api; pm2 save`), listening on `*:3000`.
  * **External Verification:** `Test-NetConnection -ComputerName 130.210.57.235 -Port 3000` verified `TcpTestSucceeded : True`; external HTTP GET returns `"BSE UAT Backend is running and waiting for API integration!"`.
* **BSE StAR MF v2 Network Whitelisting Confirmed:**
  * Verified outbound connectivity from `130.210.57.235` to `starmfv2demo.bseindia.com` in 356ms (HTTP 200). Perimeter firewall successfully passes packets without dropping.
* **Username Format Architecture Discovered:**
  * Identified that BSE StAR MF v2 REST API requires a composite `<MEMBER_ID>/<USER_ID>` username format: `94515/tanashvifintechpvtltd`.
  * Standard usernames triggered `msgid: 582` (`invalid_username_format`), whereas `94515/tanashvifintechpvtltd` cleanly passed validation, confirming format acceptance by BSE.
* **Web Portal vs API Architecture Identified:**
  * Clarified that `starmfv2demo.bseindia.com` is a headless machine-to-machine REST API gateway (hence timing out in browsers on `/`).
  * Identified human browser portal at `https://bsestarmfdemo.bseindia.com/Index.aspx` with a 20-character limit on the User ID field (`tanashvifintechpvtlt`).
* **Active Status:**
  * Email dispatched to Harsheel Sanghvi (BSE) on Nov 17 requesting confirmation of active User ID and password synchronization on the demo cluster.
  * Automated diagnostic testbench [`verify_bse_uat.js`](file:///c:/Users/mrigt/Documents/mrig_new_laptop/mrig/tanashvi/mf-platform_dev/bse-star-backend/scripts/verify_bse_uat.js) ready on server for instant verification once credentials are authenticated.

---

### Phase 15: Portfolio Visualization & Multi-Benchmark TRI Engine (All User Levels)
* **Backend Multi-Benchmark TRI Engine & Update Mechanisms (`bse-star-backend`):**
  * Created [`benchmark.ts`](file:///c:/Users/mrigt/Documents/mrig_new_laptop/mrig/tanashvi/mf-platform_dev/bse-star-backend/src/types/benchmark.ts), [`benchmarkService.ts`](file:///c:/Users/mrigt/Documents/mrig_new_laptop/mrig/tanashvi/mf-platform_dev/bse-star-backend/src/services/benchmarkService.ts), [`benchmarkController.ts`](file:///c:/Users/mrigt/Documents/mrig_new_laptop/mrig/tanashvi/mf-platform_dev/bse-star-backend/src/controllers/benchmarkController.ts), [`benchmarkRoutes.ts`](file:///c:/Users/mrigt/Documents/mrig_new_laptop/mrig/tanashvi/mf-platform_dev/bse-star-backend/src/routes/benchmarkRoutes.ts), and PostgreSQL migration [`006_phase15_benchmark_tri.sql`](file:///c:/Users/mrigt/Documents/mrig_new_laptop/mrig/tanashvi/mf-platform_dev/bse-star-backend/src/database/migrations/006_phase15_benchmark_tri.sql).
  * Supports **6 Standard Indian TRI Benchmarks** (`Nifty 50 TRI`, `Nifty 500 TRI`, `Nifty Midcap 150 TRI`, `Nifty Smallcap 250 TRI`, `BSE Sensex TRI`, `CRISIL Short Term Debt Index`) + dynamic **SEBI-style Custom Blended Benchmark** auto-weighted to the portfolio's exact Equity:Debt mix.
  * **3 Built-in TRI Update Channels:**
    1. **Automated Live EOD Sync (`POST /api/v1/benchmarks/sync`):** Pulls live daily EOD NAVs via AMFI Direct Index Fund TRI proxies (`api.mfapi.in`) with disk cache persistence and offline seed fallback.
    2. **Official NSE/BSE TRI CSV Bulk Import (`POST /api/v1/benchmarks/import`):** Parses `niftyindices.com` / `asiaindices.co.in` CSV exports (`DD MMM YYYY`, `DD-MMM-YYYY`, `YYYY-MM-DD`).
    3. **Manual EOD Override (`POST /api/v1/benchmarks/manual`)** + standalone weekday server cron script [`sync_benchmarks_eod.js`](file:///c:/Users/mrigt/Documents/mrig_new_laptop/mrig/tanashvi/mf-platform_dev/bse-star-backend/scripts/sync_benchmarks_eod.js).
  * Verified via [`test_phase15_benchmarks.ts`](file:///c:/Users/mrigt/Documents/mrig_new_laptop/mrig/tanashvi/mf-platform_dev/bse-star-backend/src/tests/test_phase15_benchmarks.ts) — all 10 backend suites pass 100%.
* **Frontend Interactive Charts & Benchmarking Suite (`bse-star-mf-integration-terminal`):**
  * Built reusable [`PortfolioChartsAndBenchmark.tsx`](file:///c:/Users/mrigt/Documents/mrig_new_laptop/mrig/tanashvi/mf-platform_dev/bse-star-mf-integration-terminal/src/components/PortfolioChartsAndBenchmark.tsx) & [`benchmarkData.ts`](file:///c:/Users/mrigt/Documents/mrig_new_laptop/mrig/tanashvi/mf-platform_dev/bse-star-mf-integration-terminal/src/utils/benchmarkData.ts) featuring:
    * Interactive dual-series SVG Portfolio vs. Benchmark curve (`₹ Wealth Growth` & `Base 100` toggle) with live mouse-hover crosshair tooltips across `6M`, `1Y`, `3Y`, `5Y`, `ALL`.
    * Alpha Scorecard: Portfolio vs. Benchmark XIRR, Net Alpha, Extra Wealth Generated (`₹`), Max Drawdown, Beta, and Up/Down Capture Ratios.
    * Interactive SVG Donut Charts (Asset Allocation + Market-Cap Distribution), **Portfolio Diversification & Fund Overlap Tracker** (0–100 score ring, Unique vs. Overlapping Exposure stacked bar, estimated unique securities, and pairwise fund overlap breakdown with common stocks), Scheme-wise Invested vs. Current Value Bars, and Sector Exposure Bars.
    * Built-in **Benchmark TRI Data Freshness & Update Center** (one-click Live AMFI TRI Sync, NSE/BSE CSV file upload, and Manual EOD TRI entry with `localStorage` persistence) + branded PDF & Excel (.xls) exports.
  * Deployed across **ALL 4 User Levels**:
    * **Category 3 (End Investor):** `Charts & Benchmark` tab inside `InvestorPortalView.tsx`.
    * **Category 1 & 2 (Standalone & Network MFD):** Client-level `Charts & Benchmark` tab inside `PortfolioTaxView.tsx` + Aggregate Book `Book Charts & Benchmark TRI` tab inside `AumSystematicAnalyticsView.tsx`.
    * **Category 4 (Tanashvi Promoters / HQ):** Platform-wide `Platform AUM Charts & TRI Manager` tab inside `PromoterDashboardView.tsx` + `AumSystematicAnalyticsView.tsx`.

---

### Phase 16: "Tanu" — Cute Wise Owl AI Portfolio Storyteller & Interactive Walkthrough
* **Animated Expressive Owl Mascot ([`TanuOwlMascot.tsx`](file:///c:/Users/mrigt/Documents/mrig_new_laptop/mrig/tanashvi/mf-platform_dev/bse-star-mf-integration-terminal/src/components/TanuOwlMascot.tsx)):**
  * Bespoke Tanashvi Navy & Gold SVG owl mascot with spectacles, natural eye blinking, beak lip-sync animation while speaking, stepping feet while walking across stage, and 6 dynamic mood states (`WAVING`, `HAPPY`, `CELEBRATING`, `REASSURING`, `THINKING`, `POINTING`).
* **Zero-Hallucination AI Story Engine ([`tanuStoryEngine.ts`](file:///c:/Users/mrigt/Documents/mrig_new_laptop/mrig/tanashvi/mf-platform_dev/bse-star-mf-integration-terminal/src/utils/tanuStoryEngine.ts)):**
  * **Deterministic Math Split:** Computes exact period returns, ₹ delta, SIP count, top/secondary fund drivers, benchmark TRI period return, and mini chart curves between any two dates (defaulting to the investor's **Last Login Date $\rightarrow$ Today**, persisted per UCC).
  * **Optional Gemini 2.5 Flash Enhancement (`@google/genai`):** Receives strictly anonymized non-PII facts to craft warm Indian-English narration & answer investor follow-up questions, with instant deterministic offline fallback.
  * **Strict Pure Indian-English Voice (`en-IN`) + Live Subtitles:** Strictly filters Web Speech voices to `en-*` only (blocking regional `bn-IN`/`hi-IN` leakage), matches `utterance.lang` to the chosen English voice, provides an optional pure-English voice selector, and displays always-visible live subtitles.
* **5-Slide Graphical Presentation Stage & Bottom Presenter Runway ([`TanuStoryWalkthroughModal.tsx`](file:///c:/Users/mrigt/Documents/mrig_new_laptop/mrig/tanashvi/mf-platform_dev/bse-star-mf-integration-terminal/src/components/TanuStoryWalkthroughModal.tsx)):**
  * Every slide presents full-width animated visual graphs/charts: (1) Portfolio Growth Area Graph, (2) Scheme-Wise Return Bar Chart + SIP Activity, (3) Dual-Line Benchmark Comparison Graph, (4) Asset Allocation Donut + Fund Diversification/Overlap Gauge, and (5) 5-Year Compounding Bar Graph + Interactive "Ask Tanu" Q&A.
  * Tanu walks smoothly across the bottom presenter runway below the slide deck (`10% -> 30% -> 50% -> 70% -> 84%`), pointing upward toward each visual chart slide like a live stage presenter.
  * Permanent **AI & SEBI Regulatory Caveat Banner** (educational/informational only; never autonomous buy/sell recommendations).
* **Deployed For Both Investors & MFDs:**
  * **End Investor Portal (`InvestorPortalView.tsx`):** Floating animated Tanu Owl launcher in bottom-right corner + top banner `Ask Tanu (Owl Story)` CTA.
  * **MFD Portfolio & Tax (`PortfolioTaxView.tsx`):** `Play Client Story (Tanu)` button for live client review meetings across all client profiles.

---

## 📌 Quick Context & Key Credentials Reference

* **Entity:** Tanashvi Fintech Private Limited
* **Brand:** Tanashvi | **Motto:** भवतः हिताय
* **Website:** https://www.tanashvi.in
* **BSE Member Code:** `94515` (Official UAT Member ID)
* **BSE User ID:** `tanashvifintechpvtltd`
* **AMFI ARN:** `ARN-347849`
* **Oracle Cloud Static IP:** `130.210.57.235`
* **Target UAT Gateway:** `https://starmfv2demo.bseindia.com/api`
* **Target Live Gateway (Future):** `https://v2.bsestarmf.in/api`
* **Live Web Application (Vercel):** `https://mutual-fund-distibutor-platform-tan.vercel.app/`
* **GitHub Repository:** `https://github.com/mrigtrade/mutual_fund_distibutor_platform_tanashvi.git`
* **AMFI NAV Open URL:** `https://www.amfiindia.com/spages/NAVAll.txt`
* **Local Test Suite:** `npm test` runs all 10 test suites (`test:jose`, `test:mock`, `test:webhook`, `test:api`, `test:calculators`, `test:schemes`, `test:portfolio`, `test:proposal`, `test:research`, `test:benchmarks`) with 100% green pass.
