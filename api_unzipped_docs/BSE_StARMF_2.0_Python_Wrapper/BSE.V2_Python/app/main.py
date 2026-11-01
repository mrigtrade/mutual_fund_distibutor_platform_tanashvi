from flask import Flask, request, jsonify

import ssl
import requests


from services.login.login_service import LoginService

from services.ucc.addnewucc_service import AddNewUCCService
from services.ucc.addnewdematucc_service import AddNewDematUCCService
from services.ucc.addnewbothucc_service import AddNewBothUCCService
from services.ucc.getucc_service import GetUCCService
from services.ucc.getallucc_service import GetAllUCCService
from services.ucc.updatecommaddrss_service import UpdateCommAddrssService
from services.ucc.updatebankdetails_service import UpdateBankDetailsService
from services.ucc.updateuccprofile_service import UpdateUccProfileService
from services.ucc.deactivateucc_service import DeactivateUccService

from services.order.addneworder_service import AddNewOrderService
from services.order.updateorder_service import UpdateOrderService
from services.order.cancelorder_service import CancelOrderService
from services.order.getorder_service import GetOrderService
from services.order.getallorder_service import GetAllOrderService

from services.sxp.sxpregister_service import SxpRegisterService
from services.sxp.getsxp_service import GetSxpService
from services.sxp.getallsxp_service import GetAllSxpService
from services.sxp.sxpsetpause_service import SxpSetPauseService
from services.sxp.sxpresume_service import SxpResumeService
from services.sxp.sxpgethistory_service import SxpGetHistoryService
from services.sxp.sxpcancel_service import SxpCancelService
from services.sxp.sxptopup_service import SxpTopupService

from services.nft.nftnomineechange_service import NftNomineeChangeService
from services.nft.nftcontactchange_service import NftContactChangeService
from services.nft.nftbankaccountchange_service import NftBankAccountChangeService

from services.payment.uploadmis_service import UploadMISService
from services.payment.getmisdetail_service import GetMISDetailService

from services.master.masterschemelist_service import MasterSchemeListService

from services.mandate.mandateregister_service import MandateRegisterService
from services.mandate.mandateregisterupi_service import MandateRegisterUpiService
from services.mandate.mandateregisterenach_service import MandateRegisterEnachService
from services.mandate.mandateregisternach_service import MandateRegisterNachService
from services.mandate.mandatecancel_service import MandateCancelService
from services.mandate.mandateget_service import MandateGetService
from services.mandate.mandategetall_service import MandateGetAllService
from services.mandate.mandateupdate_service import MandateUpdateService
from services.mandate.mandatelink_service import MandateLinkService
from services.mandate.mandatedelink_service import MandateDelinkService

from services.nav.navmasterlist_service import NavMasterListService

from services.twofa.twofalinkuccnom_service import TwoFALinkUccNomService
from services.twofa.twofalinkuccelog_service import TwoFALinkUccElogService
from services.twofa.twofaverifymandatecancel_service import TwoFAVerifyMandateCancelService
from services.twofa.twofaverifysxpreg_service import TwoFAVerifySxpRegService
from services.twofa.twofaverifyordercancel_service import TwoFAVerifyOrderCancelService
from services.payment.get_exchpg_service import GetExchPgService
from services.payment.send_payment_info_service import SendPaymentInfoService



app = Flask(__name__)

@app.route('/api/login', methods=['POST'])
def user_login():
    response_data = LoginService.login()
    status_code = 200 if response_data["status"] == "success" else 401
    return jsonify(response_data), status_code

@app.route('/api/v2/add_ucc', methods=['POST'])
def add_new_ucc():
    request_data = request.json
    response = AddNewUCCService.add_new_ucc(request_data)   
    return jsonify(response)

@app.route('/api/v2/adddemat_ucc', methods=['POST'])
def add_new_demat_ucc():
    request_data = request.json
    response = AddNewDematUCCService.add_new_demat_ucc(request_data)   
    return jsonify(response)

@app.route('/api/v2/addboth_ucc', methods=['POST'])
def add_new_both_ucc():
    request_data = request.json
    response = AddNewBothUCCService.add_new_both_ucc(request_data)   
    return jsonify(response)

@app.route("/api/v2/get_ucc", methods=["POST"])
def get_ucc():
    request_data = request.json
    response = GetUCCService.get_ucc(request_data)
    return jsonify(response)

@app.route("/api/v2/list_ucc", methods=["POST"])
def get_all_ucc():
    request_data = request.json
    response = GetAllUCCService.get_all_ucc(request_data)
    return jsonify(response)

@app.route("/api/v2/update_commucc", methods=["POST"])
def update_communication_address():
    request_data = request.json
    response = UpdateCommAddrssService.update_comm_addrss(request_data)
    return jsonify(response)

@app.route("/api/v2/update_bankucc", methods=["POST"])
def update_bank_details():
    request_data = request.json
    response = UpdateBankDetailsService.update_bank_details(request_data)
    return jsonify(response)

@app.route("/api/v2/update_ucc", methods=["POST"])
def update_ucc_profile():
    request_data = request.json
    response = UpdateUccProfileService.update_ucc_profile(request_data)
    return jsonify(response)

@app.route("/api/v2/update_ucc", methods=["POST"])
def deactivate_ucc():
    request_data = request.json
    response = DeactivateUccService.deactivate_ucc(request_data)
    return jsonify(response)

@app.route("/api/neworder", methods=["POST"])
def add_new_order():
    request_data = request.json
    response = AddNewOrderService.add_new_order(request_data)
    return jsonify(response)

@app.route("/api/update_order", methods=["POST"])
def update_order():
    request_data = request.json
    response = UpdateOrderService.update_order(request_data)
    return jsonify(response)

@app.route("/api/order_cancel", methods=["POST"])
def cancel_order():
    request_data = request.json
    response = CancelOrderService.cancel_order(request_data)
    return jsonify(response)

@app.route("/api/get_order", methods=["POST"])
def get_order():
    request_data = request.json
    response = GetOrderService.get_order(request_data)
    return jsonify(response)

@app.route("/api/getall_order", methods=["POST"])
def get_all_order():
    request_data = request.json
    response = GetAllOrderService.get_all_order(request_data)
    return jsonify(response)

@app.route("/api/sxp_register", methods=["POST"])
def sxp_register():
    request_data = request.json
    response = SxpRegisterService.sxp_register(request_data)
    return jsonify(response)

@app.route("/api/get_sxp", methods=["POST"])
def get_sxp():
    request_data = request.json
    response = GetSxpService.get_sxp(request_data)
    return jsonify(response)

@app.route("/api/getall_sxp", methods=["POST"])
def get_all():
    request_data = request.json
    response = GetAllSxpService.get_all_sxp(request_data)
    return jsonify(response)

@app.route("/api/sxpset_pause", methods=["POST"])
def sxp_set_pause():
    request_data = request.json
    response = SxpSetPauseService.sxp_set_pause(request_data)
    return jsonify(response)

@app.route("/api/sxp_resume", methods=["POST"])
def sxp_resume():
    request_data = request.json
    response = SxpResumeService.sxp_resume(request_data)
    return jsonify(response)

@app.route("/api/sxpget_history", methods=["POST"])
def sxp_get_history():
    request_data = request.json
    response = SxpGetHistoryService.sxp_get_history(request_data)
    return jsonify(response)

@app.route("/api/sxp_cancel", methods=["POST"])
def sxp_cancel():
    request_data = request.json
    response = SxpCancelService.sxp_cancel(request_data)
    return jsonify(response)

@app.route("/api/sxp_topup", methods=["POST"])
def sxp_topup():
    request_data = request.json
    response = SxpTopupService.sxp_topup(request_data)
    return jsonify(response)

@app.route("/api/nft_nominee_change", methods=["POST"])
def nft_nominee_change():
    request_data = request.json
    response = NftNomineeChangeService.nft_nominee_change(request_data)
    return jsonify(response)

@app.route("/api/nft_contact_change", methods=["POST"])
def nft_contact_change():
    request_data = request.json
    response = NftContactChangeService.nft_contact_change(request_data)
    return jsonify(response)

@app.route("/api/nft_bank_account_change", methods=["POST"])
def nft_bank_account_change():
    request_data = request.json
    response = NftBankAccountChangeService.nft_bank_account_change(request_data)
    return jsonify(response)

@app.route("/api/upload_mis", methods=["POST"])
def upload_mis():
    request_data = request.json
    response = UploadMISService.upload_mis(request_data)
    return jsonify(response)

@app.route("/api/get_mis_detail", methods=["POST"])
def get_mis_detail():
    request_data = request.json
    response = GetMISDetailService.get_mis_detail(request_data)
    return jsonify(response)

@app.route("/api/master_scheme_list", methods=["POST"])
def master_scheme_list():
    request_data = request.json
    response = MasterSchemeListService.master_scheme_list(request_data)
    return jsonify(response)

@app.route("/api/mandate_register", methods=["POST"])
def mandate_register():
    request_data = request.json
    response = MandateRegisterService.mandate_register(request_data)
    return jsonify(response)

@app.route("/api/mandate_register_upi", methods=["POST"])
def mandate_register_upi():
    request_data = request.json
    response = MandateRegisterUpiService.mandate_register_upi(request_data)
    return jsonify(response)

@app.route("/api/mandate_register_enach", methods=["POST"])
def mandate_register_enach():
    request_data = request.json
    response = MandateRegisterEnachService.mandate_register_enach(request_data)
    return jsonify(response)

@app.route("/api/mandate_register_nach", methods=["POST"])
def mandate_register_nach():
    request_data = request.json
    response = MandateRegisterNachService.mandate_register_nach(request_data)
    return jsonify(response)

@app.route("/api/mandate_cancel", methods=["POST"])
def mandate_cancel():
    request_data = request.json
    response = MandateCancelService.mandate_cancel(request_data)
    return jsonify(response)

@app.route("/api/mandate_get", methods=["POST"])
def mandate_get():
    request_data = request.json
    response = MandateGetService.mandate_get(request_data)
    return jsonify(response)

@app.route("/api/mandate_getall", methods=["POST"])
def mandate_get_all():
    request_data = request.json
    response = MandateGetAllService.mandate_get_all(request_data)
    return jsonify(response)

@app.route("/api/mandate_update", methods=["POST"])
def mandate_update():
    request_data = request.json
    response = MandateUpdateService.mandate_update(request_data)
    return jsonify(response)

@app.route("/api/mandate_link", methods=["POST"])
def mandate_link():
    request_data = request.json
    response = MandateLinkService.mandate_link(request_data)
    return jsonify(response)

@app.route("/api/mandate_delink", methods=["POST"])
def mandate_delink():
    request_data = request.json
    response = MandateDelinkService.mandate_delink(request_data)
    return jsonify(response)

@app.route("/api/nav_master_list", methods=["POST"])
def nav_master_list():
    request_data = request.json
    response = NavMasterListService.nav_master_list(request_data)
    return jsonify(response)

@app.route("/api/get_2fa_link_nom", methods=["POST"])
def link_ucc_nom():
    request_data = request.json
    response = TwoFALinkUccNomService.link_ucc_nom(request_data)
    return jsonify(response)

@app.route("/api/get_2fa_link_elog", methods=["POST"])
def link_ucc_elog():
    request_data = request.json
    response = TwoFALinkUccElogService.link_ucc_elog(request_data)
    return jsonify(response)

@app.route("/api/verify_mandate_cancel", methods=["POST"])
def verify_mandate_cancel():
    request_data = request.json
    response = TwoFAVerifyMandateCancelService.verify_mandate_cancel(request_data)
    return jsonify(response)

@app.route("/api/verify_sxp_reg", methods=["POST"])
def verify_sxp_reg():
    request_data = request.json
    response = TwoFAVerifySxpRegService.verify_sxp_reg(request_data)
    return jsonify(response)

@app.route("/api/verify_order_cancel", methods=["POST"])
def verify_order_cancel():
    request_data = request.json
    response = TwoFAVerifyOrderCancelService.verify_order_cancel(request_data)
    return jsonify(response)

@app.route("/api/get_exchpg_service", methods=["POST"])
def get_exchpg_service():
    request_data = request.json
    response = GetExchPgService.get_exchpg_service(request_data)
    return jsonify(response)

@app.route("/api/send_payment_info", methods=["POST"])
def send_payment_info():
    request_data = request.json
    response = SendPaymentInfoService.send_payment_info(request_data)
    return jsonify(response)


if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)   