const StarMFService = require("bse-starmfv2-sdk");
// const {
//   BseLoginService,
//   UccService,
//   TrxnService,
//   MandateService,
//   PaymentService,
//   MasterDataService,
// } = require("../../../src");
const { configData } = require("../config");
const orderRequestData = require("../requestData/orderRequestData");
const uccRequestData = require("../requestData/uccRequestData");
const xspRequestData = require("../requestData/xspRequestData");
const nftRequestData = require("../requestData/nftRequestData");
const schemeRequestData = require("../requestData/schemeRequestData");
const paymentRequestData = require("../requestData/paymentRequestData");
const fetch2FALinkRequestData = require("../requestData/fetch2FALinkRequestData");
const mandateRequestData = require("../requestData/mandateRequestData");
const navRequestData = require("../requestData/navRequestData");

class StarMFController {
  constructor() {
    this.loginService = new StarMFService.BseLoginService({
      baseUrl: configData.baseUrl,
    });
    this.uccService = new StarMFService.UccService({
      baseUrl: configData.baseUrl,
    });
    this.trxnService = new StarMFService.TrxnService({
      baseUrl: configData.baseUrl,
    });
    this.mandatteService = new StarMFService.MandateService({
      baseUrl: configData.baseUrl,
    });
    this.paymentService = new StarMFService.PaymentService({
      baseUrl: configData.baseUrl,
    });
    this.masterDataService = new StarMFService.MasterDataService({
      baseUrl: configData.baseUrl,
    });
    this.nftService = new StarMFService.NFTService({
      baseUrl: configData.baseUrl,
    });
    this.fetch2FALinkService = new StarMFService.Fetch2FALinkService({
      baseUrl: configData.baseUrl,
    });
    this.navService = new StarMFService.NavService({
      baseUrl: configData.baseUrl,
    });
    // this.loginService = new BseLoginService({ baseUrl: configData.baseUrl });
    // this.uccService = new UccService({ baseUrl: configData.baseUrl });
    // this.trxnService = new TrxnService({ baseUrl: configData.baseUrl });
    // this.mandatteService = new MandateService({ baseUrl: configData.baseUrl });
    // this.paymentService = new PaymentService({ baseUrl: configData.baseUrl });
    // this.masterDataService = new MasterDataService({
    //   baseUrl: configData.baseUrl,
    // });
    this.username = configData.username;
    this.password = configData.password;
    this.baseUrl = configData.baseUrl;
    this.accessToken = null; //need to check for token expiration time
    this.tokenExpiry = "";
  }

  async loginFunc() {
    const loginResp = await this.loginService.login(
      this.username,
      this.password
    );
    let accessToken = loginResp?.data?.access_token;
    this.accessToken = accessToken;
    // return accessToken ? accessToken : null;
    return loginResp;
  }

  async handleUccRequest(serviceMethod, reqObj, res) {
    let loginResp;
    if (this.accessToken == null) {
      loginResp = await this.loginFunc();
    }
    if (loginResp?.status === "error") {
      res.json(loginResp);
      return;
    }
    try {
      //to Check Access Token
      const requestData = reqObj;
      const response = await this.uccService[serviceMethod](
        this.accessToken,
        requestData
      );
      // console.log("response" , response)

      res.json(response);
    } catch (error) {
      console.error(`Error in ${serviceMethod}:`, error);
      res
        .status(500)
        .json({ error: "Internal Server Error", details: error.message });
    }
  }

  async handleTrxnRequest(serviceMethod, reqObj, res) {
    let loginResp;
    if (this.accessToken == null) {
      loginResp = await this.loginFunc();
    }
    if (loginResp?.status === "error") {
      res.json(loginResp);
      return;
    }
    try {
      const requestData = reqObj;
      const response = await this.trxnService[serviceMethod](
        this.accessToken,
        requestData
      );
      // console.log("response" , response)

      res.json(response);
    } catch (error) {
      console.error(`Error in ${serviceMethod}:`, error);
      res
        .status(500)
        .json({ error: "Internal Server Error", details: error.message });
    }
  }

  async handleMandateRequest(serviceMethod, req, res) {
    let loginResp;
    if (this.accessToken == null) {
      loginResp = await this.loginFunc();
    }
    if (loginResp?.status === "error") {
      res.json(loginResp);
      return;
    }
    try {
      const requestData = req;
      const response = await this.mandatteService[serviceMethod](
        this.accessToken,
        requestData
      );
      // console.log("response" , response)

      res.json(response);
    } catch (error) {
      console.error(`Error in ${serviceMethod}:`, error);
      res
        .status(500)
        .json({ error: "Internal Server Error", details: error.message });
    }
  }

  async handlePaymentRequest(serviceMethod, reqObj, res) {
    let loginResp;
    if (this.accessToken == null) {
      loginResp = await this.loginFunc();
    }
    if (loginResp?.status === "error") {
      res.json(loginResp);
      return;
    }
    try {
      const requestData = reqObj;
      const response = await this.paymentService[serviceMethod](
        this.accessToken,
        requestData
      );
      // console.log("response" , response)

      res.json(response);
    } catch (error) {
      console.error(`Error in ${serviceMethod}:`, error);
      res
        .status(500)
        .json({ error: "Internal Server Error", details: error.message });
    }
  }

  async handleMasterDataRequest(serviceMethod, reqObj, res) {
    let loginResp;
    if (this.accessToken == null) {
      loginResp = await this.loginFunc();
    }
    if (loginResp?.status === "error") {
      res.json(loginResp);
      return;
    }
    try {
      const requestData = reqObj;
      const response = await this.masterDataService[serviceMethod](
        this.accessToken,
        requestData
      );
      // console.log("response" , response)

      res.json(response);
    } catch (error) {
      console.error(`Error in ${serviceMethod}:`, error);
      res
        .status(500)
        .json({ error: "Internal Server Error", details: error.message });
    }
  }

  async handleNFTRequest(serviceMethod, reqObj, res) {
    let loginResp;
    if (this.accessToken == null) {
      loginResp = await this.loginFunc();
    }
    if (loginResp?.status === "error") {
      res.json(loginResp);
      return;
    }
    try {
      const requestData = reqObj;
      const response = await this.nftService[serviceMethod](
        this.accessToken,
        requestData
      );
      // console.log("response" , response)

      res.json(response);
    } catch (error) {
      console.error(`Error in ${serviceMethod}:`, error);
      res
        .status(500)
        .json({ error: "Internal Server Error", details: error.message });
    }
  }

  async handleFetch2FALinkRequest(serviceMethod, reqObj, res) {
    let loginResp;
    if (this.accessToken == null) {
      loginResp = await this.loginFunc();
    }
    if (loginResp?.status === "error") {
      res.json(loginResp);
      return;
    }
    try {
      const requestData = reqObj;
      const response = await this.fetch2FALinkService[serviceMethod](
        this.accessToken,
        requestData
      );
      // console.log("response" , response)

      res.json(response);
    } catch (error) {
      console.error(`Error in ${serviceMethod}:`, error);
      res
        .status(500)
        .json({ error: "Internal Server Error", details: error.message });
    }
  }

  async handleNavRequest(serviceMethod, reqObj, res) {
    let loginResp;
    if (this.accessToken == null) {
      loginResp = await this.loginFunc();
    }
    if (loginResp?.status === "error") {
      res.json(loginResp);
      return;
    }
    try {
      const requestData = reqObj;
      const response = await this.navService[serviceMethod](
        this.accessToken,
        requestData
      );
      // console.log("response" , response)

      res.json(response);
    } catch (error) {
      console.error(`Error in ${serviceMethod}:`, error);
      res
        .status(500)
        .json({ error: "Internal Server Error", details: error.message });
    }
  }

  loginRequest = async (req, res) => {
    try {
      const loginResp = await this.loginService.login(
        this.username,
        this.password
      );
      console.log("loginResp", loginResp);
      res.json(loginResp);
    } catch (error) {
      // console.error(`Error in ${serviceMethod}:`, error);
      res
        .status(500)
        .json({ error: "Internal Server Error", details: error.message });
    }
  };

  // UCC Methods
  getAllUcc = async (req, res) => {
    let reqObj = uccRequestData.getAllUcc;
    return this.handleUccRequest("getAllUcc", reqObj, res);
  };
  getParticularUcc = async (req, res) => {
    let reqObj = uccRequestData.getParticularUcc;
    return this.handleUccRequest("getParticularUcc", reqObj, res);
  };
  createPhysicalUcc = async (req, res) => {
    let reqObj = uccRequestData.createPhysicalUcc;
    return this.handleUccRequest("createPhysicalUcc", reqObj, res);
  };
  createDematUcc = async (req, res) => {
    let reqObj = uccRequestData.createDematUcc;
    return this.handleUccRequest("createDematUcc", reqObj, res);
  };
  createBothUcc = async (req, res) => {
    let reqObj = uccRequestData.createBothUcc;
    return this.handleUccRequest("createBothUcc", reqObj, res);
  };
  updateUccAddress = async (req, res) => {
    let reqObj = uccRequestData.updateUccAddress;
    return this.handleUccRequest("updateUccAddress", reqObj, res);
  };
  updateUccProfile = async (req, res) => {
    let reqObj = uccRequestData.updateUccProfile;
    return this.handleUccRequest("updateUccProfile", reqObj, res);
  };
  updateUccUpdateBankData = async (req, res) => {
    let reqObj = uccRequestData.updateUccUpdateBankData;
    return this.handleUccRequest("updateUccUpdateBankData", reqObj, res);
  };
  deactivateUcc = async (req, res) => {
    let reqObj = uccRequestData.deactivateUcc;
    return this.handleUccRequest("deactivateUcc", reqObj, res);
  };

  // // Mandate Methods
  registerMandate = async (req, res) => {
    let reqObj = mandateRequestData.registerMandate;
    return this.handleMandateRequest("registerMandate", reqObj, res);
  };

  registerMandateUPI = async (req, res) => {
    let reqObj = mandateRequestData.registerMandateUPI;
    return this.handleMandateRequest("registerMandateUPI", reqObj, res);
  };

  registerMandateEnach = async (req, res) => {
    let reqObj = mandateRequestData.registerMandateEnach;
    return this.handleMandateRequest("registerMandateEnach", reqObj, res);
  };

  registerMandateNach = async (req, res) => {
    let reqObj = mandateRequestData.registerMandateNach;
    return this.handleMandateRequest("registerMandateNach", reqObj, res);
  };

  getMandate = async (req, res) => {
    let reqObj = mandateRequestData.getMandate;
    return this.handleMandateRequest("getMandate", reqObj, res);
  };

  getAllMandate = async (req, res) => {
    let reqObj = mandateRequestData.getAllMandate;
    return this.handleMandateRequest("getAllMandate", reqObj, res);
  };

  cancelMandate = async (req, res) => {
    let reqObj = mandateRequestData.cancelMandate;
    return this.handleMandateRequest("cancelMandate", reqObj, res);
  };

  linkMandate = async (req, res) => {
    let reqObj = mandateRequestData.linkMandate;
    return this.handleMandateRequest("linkMandate", reqObj, res);
  };

  mandateDelink = async (req, res) => {
    let reqObj = mandateRequestData.mandateDelink;
    return this.handleMandateRequest("mandateDelink", reqObj, res);
  };

  updateMandate = async (req, res) => {
    let reqObj = mandateRequestData.updateMandate;
    return this.handleMandateRequest("updateMandate", reqObj, res);
  };

  // XSP Methods
  xspRegister = async (req, res) => {
    let reqObj = xspRequestData.xspRegisterData;
    return this.handleTrxnRequest("xspRegister", reqObj, res);
  };
  getXsp = async (req, res) => {
    let reqObj = xspRequestData.getXspData;
    return this.handleTrxnRequest("getXsp", reqObj, res);
  };
  pauseXsp = async (req, res) => {
    let reqObj = xspRequestData.pauseXspData;
    return this.handleTrxnRequest("pauseXsp", reqObj, res);
  };
  cancelXsp = async (req, res) => {
    let reqObj = xspRequestData.cancelXspData;
    return this.handleTrxnRequest("cancelXsp", reqObj, res);
  };
  getAllXsp = async (req, res) => {
    let reqObj = xspRequestData.getAllXspData;
    return this.handleTrxnRequest("getAllXsp", reqObj, res);
  };
  topupXsp = async (req, res) => {
    let reqObj = xspRequestData.topupXspData;
    return this.handleTrxnRequest("topupXsp", reqObj, res);
  };

  resumeXsp = async (req, res) => {
    let reqObj = xspRequestData.resumeXsp;
    return this.handleTrxnRequest("resumeXsp", reqObj, res);
  };

  getXspTrxnHistory = async (req, res) => {
    let reqObj = xspRequestData.getXspTrxnHistory;
    return this.handleTrxnRequest("getXspTrxnHistory", reqObj, res);
  };

  // Order Methods
  purchaseNewOrder = async (req, res) => {
    let reqObj = orderRequestData.purchaseNewOrder;
    return this.handleTrxnRequest("purchaseNewOrder", reqObj, res);
  };
  updatePurchaseOrder = async (req, res) => {
    let reqObj = orderRequestData.updatePurchaseOrder;
    return this.handleTrxnRequest("updatePurchaseOrder", reqObj, res);
  };
  getAllOrders = async (req, res) => {
    let reqObj = orderRequestData.getAllOrders;
    return this.handleTrxnRequest("getAllOrders", reqObj, res);
  };
  getOrder = async (req, res) => {
    let reqObj = orderRequestData.getOrder;
    return this.handleTrxnRequest("getOrder", reqObj, res);
  };
  cancelPurchaseOrder = async (req, res) => {
    let reqObj = orderRequestData.cancelPurchaseOrder;
    return this.handleTrxnRequest("cancelPurchaseOrder", reqObj, res);
  };
  listPaymentDetail = async (req, res) => {
    let reqObj = orderRequestData.listPaymentDetail;
    return this.handleTrxnRequest("listPaymentDetail", reqObj, res);
  };
  getPaymentDetail = async (req, res) => {
    let reqObj = orderRequestData.getPaymentDetail;
    return this.handleTrxnRequest("getPaymentDetail", reqObj, res);
  };

  // // Payment Methods
  uploadMis = async (req, res) => {
    let reqObj = paymentRequestData.uploadMis;
    this.handlePaymentRequest("paymentReport", reqObj, res);
  };
  getMisDetails = async (req, res) => {
    let reqObj = paymentRequestData.getMisDetails;
    this.handlePaymentRequest("getPaymentMisDetails", reqObj, res);
  };

  // // Scheme Methods
  getSchemeMasterList = async (req, res) => {
    let reqObj = schemeRequestData.getSchemeMasterList;
    this.handleMasterDataRequest("getSchemeMasterList", reqObj, res);
  };

  // NFT Service Method

  nftBankAccountChange = async (req, res) => {
    let reqObj = nftRequestData.nftBankAccountChange;
    return this.handleNFTRequest("nftBankAccountChange", reqObj, res);
  };
  nftNomineeChange = async (req, res) => {
    let reqObj = nftRequestData.nftNomineeChange;
    return this.handleNFTRequest("nftNomineeChange", reqObj, res);
  };
  nftContactChange = async (req, res) => {
    let reqObj = nftRequestData.nftContactChange;
    return this.handleNFTRequest("nftContactChange", reqObj, res);
  };

  // Fetch 2FA Link Service

  get2FAUccNom = async (req, res) => {
    let reqObj = fetch2FALinkRequestData.get2FAUccNom;
    return this.handleFetch2FALinkRequest("get2FAUccNom", reqObj, res);
  };

  get2FAUccElog = async (req, res) => {
    let reqObj = fetch2FALinkRequestData.get2FAUccElog;
    return this.handleFetch2FALinkRequest("get2FAUccElog", reqObj, res);
  };

  get2FAVerifyMandateCancel = async (req, res) => {
    let reqObj = fetch2FALinkRequestData.get2FAVerifyMandateCancel;
    return this.handleFetch2FALinkRequest(
      "get2FAVerifyMandateCancel",
      reqObj,
      res
    );
  };

  get2FAVerifySxpReg = async (req, res) => {
    let reqObj = fetch2FALinkRequestData.get2FAVerifySxpReg;
    return this.handleFetch2FALinkRequest("get2FAVerifySxpReg", reqObj, res);
  };

  get2FAVerifyOrderCancel = async (req, res) => {
    let reqObj = fetch2FALinkRequestData.get2FAVerifyOrderCancel;
    return this.handleFetch2FALinkRequest(
      "get2FAVerifyOrderCancel",
      reqObj,
      res
    );
  };

   getExchPgService = async (req, res) => {
    // use sample requestData or override with req.body
    const reqObj = req.body && Object.keys(req.body).length ? req.body : paymentRequestData.getExchPgService;
    return this.handlePaymentRequest("getExchPgService", reqObj, res);
  };

  // Send Payment Info
  sendPaymentInfo = async (req, res) => {
    const reqObj = req.body && Object.keys(req.body).length ? req.body : paymentRequestData.sendPaymentInfo;
    return this.handlePaymentRequest("sendPaymentInfo", reqObj, res);
  };

  // Nav Services

  getNavMasterList = async (req, res) => {
    let reqObj = navRequestData.getNavMasterList;
    return this.handleNavRequest("getNavMasterList", reqObj, res);
  };

}

// Export an instance of the class
module.exports = new StarMFController();
