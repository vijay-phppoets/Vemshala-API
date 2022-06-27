const bcrypt = require('bcrypt');
const jwt = require("jsonwebtoken")

/* model */
const Setting = require('../models/setting.model')
const { sendEmail } = require("../email/email")
const _ = require('lodash');

exports.update = async (req, res) => {
    // Collecting params 
    let international_price = req.body.international_price || "";
    let admin_email = req.body.admin_email || "";
    let offer_strip = req.body.offer_strip || "";
    /* START: Validating params */
    if (!international_price && !admin_email && !offer_strip) {
        return res.status(400).send({
            status: "error",
            message: "Bad request.",
        });
    }
    /* END: Validating params */
    /* END: Validating params */

    try {
        let obj = {
            international_price: international_price,
            admin_email: admin_email,
            offer_strip: offer_strip,
        }

        let setting = await Promise.all([
            Setting.updateInternationPrice(obj),
            Setting.updateAdminEmail(obj),
            Setting.updateOffer(obj),
        ])

        return res.status(200).send({
            status: "success",
            message: "Setting update successfully",
        });
    } catch (error) {
        return res.status(500).send({
            status: "error",
            message: "Something is not right.",
        });
    }
}

exports.list = async (req, res) => {
    try {
        let setting = await Setting.getData()
        return res.status(200).send({
            status: "success",
            message: "USD Data",
            list: setting
        });
    } catch (err) {
        return res.status(500).send({
            status: "error",
            message: "Something is not right.",
        });
    }
};

exports.updateShipping = async (req, res) => {
    // Collecting params 

    let minimun_cart_value = req.body.minimun_cart_value || "";
    let shipping_price = req.body.shipping_price || "";
    let international_shipping = req.body.international_shipping || "";
    /* START: Validating params */
    if (!shipping_price && !minimun_cart_value && !international_shipping) {
        return res.status(400).send({
            status: "error",
            message: "Bad request.",
        });
    }
    /* END: Validating params */

    try {
        let obj = {
            minimun_cart_value: minimun_cart_value,
            shipping_price: shipping_price,
            international_shipping: international_shipping,
        }

        let setting = await Promise.all([
            Setting.updateShipping(obj),
            Setting.updateCartValue(obj),
            Setting.updateInternationalShipping(obj),
        ])

        // let setting = await Setting.updateShipping({
        //     minimun_cart_value: minimun_cart_value, 
        // })
        return res.status(200).send({
            status: "success",
            message: "Price update successfully",
        });
    } catch (error) {
        return res.status(500).send({
            status: "error",
            message: "Something is not right.",
        });
    }
}


exports.sendEmail = async (req, res) => {
    let emailHtml = '<div id=":2cd" class="a3s aiL "> <table bgcolor="#fafafa" width="100%" height="100%" align="center" style="border-collapse:collapse" border="0" cellspacing="0" cellpadding="0">  <tbody> <tr> <td align="center"> <table width="600" border="1" cellspacing="0" cellpadding="0" bgcolor="#ffffff" style="text-align:left"> <tbody> <tr> <td height="20" style="border-top:none;border-bottom:none;border-left:none;border-right:none"> </td>  </tr> <tr> <td width="20" style="border-top:none;border-bottom:none;border-left:none;border-right:none"> </td> <td width="48" valign="top" style="border-top:none;border-bottom:none;border-left:none;border-right:none"> <img src="https://ci6.googleusercontent.com/proxy/jMYX9kHsl1drgBgoBLpn3Ga5S3YV2HJHWNqUQIVBslk88TWErmg_CcPhR90s4pcLi58INb73LCVbN1aq08UTEzpmR9cgBsyLCCrVK_4A8XS_qt8cKEY5Ecw=s0-d-e1-ft#https://i01.appmifile.com/webfile/globalimg/common/mail/milogo-new.png" border="0" height="48" width="48" class="CToWUd"></td> <td align="right" style="font-size:12px;line-height:18px;color:#666;border-top:none;border-bottom:none;border-left:none;border-right:none">  Order ID <span style="color:#ee330a">#1234</span><br> <a href="mailto:service.in@xiaomi.com" target="_blank">Contact us online</a><br></td> <td width="20" style="border-top:none;border-bottom:none;border-left:none;border-right:none"> </td></tr> <tr> <td height="20" style="border-top:none;border-bottom:none;border-left:none;border-right:none"> </td> </tr>  </tbody> </table> </td> </tr> <tr> <td height="10"></td> </tr> <tr> <td align="center"> <table width="600" border="1" cellspacing="0" cellpadding="0" bgcolor="#ffffff"  style="text-align:left"> <tbody> <tr> <td height="20" style="border-top:none;border-bottom:none;border-left:none;border-right:none"> </td> </tr> <tr> <td width="20" style="border-top:none;border-bottom:none;border-left:none;border-right:none"> </td> <td style="border-top:none;border-bottom:none;border-left:none;border-right:none"> <p style="color:#333;font-size:30px;margin-top:5px;margin-bottom:10px">Your Order has been shipped.</p>  <p style="color:#666;font-size:14px;line-height:22px;margin-top:14px;margin-bottom:14px"> Thank you for shopping with us! </p> </td> <td width="20" style="border-top:none;border-bottom:none;border-left:none;border-right:none"> </td> </tr> <tr> <td height="20" style="border-top:none;border-bottom:none;border-left:none;border-right:none"> </td> </tr> </tbody> </table> </td> </tr> <tr>  <td height="10"></td> </tr>  <tr><td align="center">';

    emailHtml += '<table width="600" border="1" cellspacing="0" cellpadding="0" bgcolor="#ffffff" style="text-align:left"> <tbody> <tr> <td width="20" style="border-top:none;border-left:none;border-right:none"></td> <td style="border-top:none;border-left:none;border-right:none"> <table width="100%"> <tbody> <tr> <td width="200" style="font-size:18px;color:#333;font-weight:bold;line-height:54px"> Order detail</td> </tr> </tbody> </table> </td> <td width="20" style="border-top:none;border-left:none;border-right:none"></td> </tr> <tr> <td width="20" style="border-top:none;border-bottom:none;border-left:none;border-right:none"> </td> <td style="border-top:none;border-left:none;border-right:none"> <table width="100%" border="0" cellspacing="0" cellpadding="0"> <tbody> <tr> <td width="10"></td> <td width="100" height="116" style="font-size:18px;color:#333;line-height:54px"><img style="vertical-align:middle" src="https://ci5.googleusercontent.com/proxy/KHTkjXVeP0MIGOQAhQVXRKSM-rlRWtTTYyflDU8AriPaTs5PCF9i-0R14e4XGE7kuw9jt8aOp0AILPZK9_7BFYqjan18AaPen-Sr5MewOIG1dj9fC0qYuwS8719aE8L5NLX06jbTlyMchMj2u3CQc1o=s0-d-e1-ft#http://i01.appmifile.com/v1/MI_18455B3E4DA706226CF7535A58E875F0267/pms_1575870690.22854399.jpg"  border="0" height="80" width="80" class="CToWUd"></td> <td style="font-size:14px;color:#333"> <p style="font-size:14px;color:#666;font-weight:bold;margin:0"> Mi 2A Fast Charger with Cable Black</p> <p style="font-size:14px;color:#666;margin:0;line-height:30px"> ₹449 X 1 = ₹449</p> </td> </tr> </tbody> </table>  </td> <td width="20" style="border-top:none;border-bottom:none;border-left:none;border-right:none"> </td> </tr> <tr> <td width="20" style="border-top:none;border-left:none;border-right:none"></td> <td style="border-top:none;border-left:none;border-right:none"> <table width="100%" border="0" cellspacing="0" cellpadding="0"> <tbody><tr> <td height="10"> </td> </tr> <tr> <td style="font-size:14px;color:#666;line-height:30px"> <span style="margin-right:10px"><strong>Subtotal:</strong> ₹698</span><span><strong></strong></span></td></tr><tr><td style="font-size:14px;color:#666;line-height:30px"><span style="margin-right:10px"><strong>Shipping:</strong>₹0</span></td></tr><tr><td style="font-size:18px;color:#ee330a;line-height:30px"><strong>Total:</strong> ₹698 </td></tr><tr><td height="10"></td></tr></tbody></table></td><td width="20" style="border-top:none;border-left:none;border-right:none"></td></tr><tr><td width="20" style="border-top:none;border-bottom:none;border-left:none;border-right:none"></td><td style="border-top:none;border-bottom:none;border-left:none;border-right:none"><table width="100%" border="0" cellspacing="0" cellpadding="0"><tbody><tr><td height="10"></td></tr><tr><td colspan="2" style="font-size:18px;color:#333;font-weight:bold;line-height:50px">Delivery information</td></tr><tr><td valign="top" width="80"style="font-size:14px;color:#666;line-height:24px;font-weight:bold">Name:</td><td valign="top" style="font-size:14px;color:#666;line-height:24px">pushpendra upadhayay</td></tr><tr><td valign="top" style="font-size:14px;color:#666;line-height:24px;font-weight:bold">Phone:</td><td valign="top" style="font-size:14px;color:#666;line-height:24px">+919680747037 </td></tr><tr><td valign="top" style="font-size:14px;color:#666;line-height:24px;font-weight:bold">Address:</td><td valign="top" style="font-size:14px;color:#666;line-height:24px">Kotak Mahindra Bank Trimurti Heights8C Madhuban, KotakMahindra Bank Trimurti Heights8C Madhuban, UDAIPUR,RAJASTHAN-313001 </td></tr><tr><td height="20"></td></tr><tr><td colspan="2" style="font-size:14px;color:#666;line-height:24px">*Package will be delivered between 09:00-19:00 from Monday to Saturday. There are no deliveries on Sunday and on public holidays.</td></tr><tr><td height="20"></td></tr></tbody></table></td><td width="20" style="border-top:none;border-bottom:none;border-left:none;border-right:none"></td></tr></tbody></table>'



    emailHtml += '</td></tr> <tr> <td height="10"></td> </tr> <tr> <td align="center"> <table width="600" border="1" cellspacing="0" cellpadding="0" bgcolor="#ffffff" style="text-align:left"> <tbody>  <tr> <td height="20" style="border-top:none;border-bottom:none;border-left:none;border-right:none"> </td> </tr> <tr> <td width="20" style="border-top:none;border-bottom:none;border-left:none;border-right:none"> </td> <td width="48" valign="top" style="border-top:none;border-bottom:none;border-left:none;border-right:none"> <img src="https://ci6.googleusercontent.com/proxy/jMYX9kHsl1drgBgoBLpn3Ga5S3YV2HJHWNqUQIVBslk88TWErmg_CcPhR90s4pcLi58INb73LCVbN1aq08UTEzpmR9cgBsyLCCrVK_4A8XS_qt8cKEY5Ecw=s0-d-e1-ft#https://i01.appmifile.com/webfile/globalimg/common/mail/milogo-new.png" border="0" height="48" width="48" class="CToWUd"></td> <td align="right" style="font-size:12px;line-height:18px;color:#666;line-height:24px;border-top:none;border-bottom:none;border-left:none;border-right:none"> Customer Support: <a href="mailto:service.in@xiaomi.com" target="_blank">service.in@xiaomi.com</a><br> Customer Hotline: 1800 103 6286 </td> <td width="20" style="border-top:none;border-bottom:none;border-left:none;border-right:none">  </td> </tr>  <tr> <td height="20" style="border-top:none;border-bottom:none;border-left:none;border-right:none"> </td> </tr> </tbody>  </table> </td> </tr> </tbody> </table> <img alt="" width="0px" height="0px" src="https://ci3.googleusercontent.com/proxy/B-YIWfWaydHrXRKIMBQiK1JLP6_IH4cIY31oBPKKewe1-Olp9HtweFI6U6FgoeqkaxhjoYQd7dFo5Jx_HXhFeTPRFv-ea5yLB9xxHknV06tHkIB24DFLASeIq8Rw=s0-d-e1-ft#http://store.mi.com/in/misc/stat?l=053746862161&amp;t=1626167746&amp;p=shipped&amp;w=1" class="CToWUd"><img src="https://ci6.googleusercontent.com/proxy/SmqLTh-7pzLcbaymCdG_BGaIYHLoYOMZenlt4EYDYZ9lWvKK7IoBeoggyh5zzQZPskKxaEZ-hicG9lfIh0CXfIhCyGy97bNNt491I_g3kYBo9nH1-9XEI1KHD_2kqC-AaqXLl3MCE5hRDOomqDn7cpvEbwS1qyOfE1duHexU5tWQRYB6bPf6tt4XuYDpD3PeL6C5RH7hLc1skskck7Wuo6RSuM_DRnq7P6D2quWt6hsbfgwFk6gy176qZmujgeL2khyhA6iC990nfrDJQC6HasrGACqdbm1xUuC0xuZ37Iwt5Rihcr9Sbk5un0PA2g8-BRQj5vsBaekA873OieTq9OAYXQl7lfGrcquYgtVv0ix3Ubp7CJOCuJnFKL4vg4W71oA7HCIQM3PiIR6TQACuvTt4iDJsiZyuIE_cOvMgp94=s0-d-e1-ft#http://url1028.in.passport.xiaomi.com/wf/open?upn=2jC-2Fl5qzQNWPyNyxWz4BQ4fh46NFg0dj18JcNI7bDEAOv2sZZFmNfm5yIBR-2BhcLH3LQyJ5OC3cqz3aVf4eQPYZRQ-2FdteyCKwQ6PS2-2B0UXeFvpQoJM8KHidOKi1507NJ8tY44HpmuoXhTCXbEOyvLo0KdbaUopCKBRaMgkDM6ND7re9OnLnKURQREpYXk0AxnBKd5chUL78sjTB2Y46yRgBEIlCe-2BbAm92C8ICH-2BpXNA-3D" alt="" width="1" height="1" border="0" style="height:1px!important;width:1px!important;border-width:0!important;margin-top:0!important;margin-bottom:0!important;margin-right:0!important;margin-left:0!important;padding-top:0!important;padding-bottom:0!important;padding-right:0!important;padding-left:0!important" class="CToWUd"> </div>';


    try {
        await sendEmail({ to: "dasumenaria@gmail.com", subject: "Book Appointment", html: emailHtml })
        return res.status(200).send({
            status: "success",
            message: "Email sent!!!",
        });
    } catch (error) {
        return res.status(500).send({
            status: "error",
            message: "Something is not right.",
        });
    }

}



exports.getOffer = async (req, res) => {
    try {
        let setting = await Setting.getData()
        let setData = _.find(setting, { 'meta_key': "offer_strip" });
        let offer_strip = setData.meta_value;
        return res.status(200).send({
            status: "success",
            message: offer_strip
        });
    } catch (err) {
        return res.status(500).send({
            status: "error",
            message: "Something is not right.",
        });
    }
};



