const { reject } = require('lodash');
const { resolveContent } = require('nodemailer/lib/shared');
const { sendEmail } = require("../email/email");
const ContactEnquiry = require('../models/contactEnquiry.model')
const Setting = require('../models/setting.model')
const _ = require('lodash');

exports.create = async (req, res) => {
    // Collecting params 
    let name = req.body.name || "";
    let email = req.body.email || "";
    let message = req.body.message || "";
    /* START: Validating params */
    if (!name && !email && !message) {
        return res.status(400).send({
            status: "error",
            message: "Bad request.",
        });
    }
    /* END: Validating params */

    try {
        let contactEnquiry = await ContactEnquiry.create({
            name: name,
            email: email,
            message: message,
        });

        let mail = await this.sendEmailContact(name, email, message);
        return res.status(200).send({
            status: "success",
            message: "Successfully submitted",
        });
    } catch (error) {
        return res.status(500).send({
            status: "error",
            message: "Something is not right.",
        });
    }
}


exports.sendEmailContact = async (name, email, message) => {
    let settingData = await Setting.getData();
    let setData = _.find(settingData, { 'meta_key': "admin_email" });
    let adminEmail = setData.meta_value;

    let emailHtml = '<table width="600" border="1" cellspacing="0" cellpadding="0" bgcolor="#ffffff" style="text-align:left"> <tbody>  <tr> <td width="20" style="border-top:none;border-left:none;border-right:none"></td> <td style="border-top:none;border-left:none;border-right:none"> <table width="100%" border="0" cellspacing="0" cellpadding="0"><tbody><tr><td height="10"></td></tr><tr><td colspan="2" style="font-size:18px;color:#333;font-weight:bold;line-height:50px">Contact Us Enquiry</td></tr><tr><td valign="top" width="80"style="font-size:14px;color:#666;line-height:24px;font-weight:bold">Name:</td><td valign="top" style="font-size:14px;color:#666;line-height:24px">' + name + '</td></tr><tr><td valign="top" style="font-size:14px;color:#666;line-height:24px;font-weight:bold">Email:</td><td valign="top" style="font-size:14px;color:#666;line-height:24px">' + email + '</td></tr><tr><td valign="top" style="font-size:14px;color:#666;line-height:24px;font-weight:bold">Message:</td><td valign="top" style="font-size:14px;color:#666;line-height:24px">' + message + '</td></tr><tr><td height="20"></td></tr> <tr><td height="20"></td></tr></tbody></table> </td></tr> </tbody></table>';

    try {
        await sendEmail({ to: adminEmail, subject: "Contact Us Enquiry", html: emailHtml })
        return 200
    } catch (error) {
        console.log(error);
        return 500;
    }

}