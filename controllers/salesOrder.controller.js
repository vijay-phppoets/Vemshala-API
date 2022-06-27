/* Model */
const SalesOrder = require('../models/salesorder.model')
const Product = require('../models/product.model')
const salesOrderItem = require('../models/salesOrderItem.model');
const { includes } = require('lodash');
const Setting = require('../models/setting.model')
const _ = require('lodash');
const conf = require("../config/config")
const { sendEmail } = require("../email/email");
const { resolveContent } = require('nodemailer/lib/shared');
/* ----
Purpose: To update cart 
Req: product_id, qty, cart_id
Res: 
---- */
exports.update = async (req, res) => {
    // Collecting params
    let product_id = req.body.product_id || null;
    let qty = req.body.qty || 1;
    let cart_id = req.body.cart_id || null;
    let currencyType = req.body.currencyType || null;
    if (cart_id === 'undefined') cart_id = null

    /* START: Validating params */
    if (!product_id) {
        return res.status(400).send({
            status: "error",
            message: "Bad request.",
        });
    }
    /* END: Validating params */

    try {
        // if cart not exists, creating a cart
        let internation_price = 1;
        if (currencyType === "USD") {
            let settingData = await Setting.getData();
            let internationPriceData = _.find(settingData, { 'meta_key': "international_price" });
            internation_price = internationPriceData.meta_value;
        }
        let cart
        if (!cart_id || cart_id === undefined) {
            cart = await SalesOrder.createEmptyCart()
        } else {
            cart = await SalesOrder.getCartDetail(cart_id)
        }
        // TODO: validation for stock 

        // checking if product is already exists in the cart
        let cart_item = null
        if (cart && cart.items) {
            cart_item = cart.items.filter(item => item.product_id === product_id)
            if (cart_item.length > 0) cart_item = cart_item[0]
            else cart_item = null
        }



        if (cart_item) {
            // updating cart item
            if (cart_item.quantity + qty > 0) {
                await salesOrderItem.updateItem({
                    sales_order_item_id: cart_item.soi_id,
                    quantity: cart_item.quantity + qty,
                })
            } else {
                // delete cart item
                await salesOrderItem.deleteItem({
                    sales_order_item_id: cart_item.soi_id,
                })
            }
        } else {
            // adding product to the cart
            if (qty > 0) {
                await salesOrderItem.addItem({
                    sales_order_id: cart.id,
                    product_id: product_id,
                    quantity: qty,
                })
            }
        }
        return res.status(200).send({
            status: "success",
            message: "Cart updated.",
            cart_id: cart.id
        });

    } catch (error) {
        return res.status(500).send({
            status: "error",
            message: "Something is not right.",
        });
    }


};


exports.count = async (req, res) => {
    // Collecting params
    let cart_id = req.query.cart_id || null;
    if (cart_id === 'undefined') cart_id = null
    /* START: Validating params */
    if (!cart_id) {
        return res.status(400).send({
            status: "error",
            message: "Bad request.",
        });
    }
    /* END: Validating params */

    try {
        let count = await SalesOrder.cartCount(cart_id)
        return res.status(200).send({
            status: "success",
            message: "Cart count.",
            count: count
        });
    } catch (error) {
        return res.status(500).send({
            status: "error",
            message: "Something is not right.",
        });
    }
}

exports.websiteView = async (req, res) => {
    // Collecting params
    let cart_id = req.query.cart_id || null;
    let currencyType = req.query.currencyType || null;
    if (cart_id === 'undefined') cart_id = null

    /* START: Validating params */
    if (!cart_id) {
        return res.status(400).send({
            status: "error",
            message: "Bad request.",
        });
    }
    /* END: Validating params */

    try {
        let internation_price = 1;
        if (currencyType === "USD") {
            let settingData = await Setting.getData();
            let internationPriceData = _.find(settingData, { 'meta_key': "international_price" });
            internation_price = internationPriceData.meta_value;
        }
        let cart = await SalesOrder.websiteView(cart_id, internation_price, currencyType)

        return res.status(200).send({
            status: "success",
            message: "Cart details.",
            cart: cart
        });
    } catch (error) {
        return res.status(500).send({
            status: "error",
            message: "Something is not right.",
        });
    }
}


exports.updateAddress = async (req, res) => {
    // Collecting params
    let cart_id = req.body.cart_id || '';
    let type = req.body.type || '';
    let fname = req.body.fname || '';
    let lname = req.body.lname || '';
    let company = req.body.company_name || '';
    let country = req.body.country || '';
    let state = req.body.state || '';
    let city = req.body.city || '';
    let street = req.body.street || '';
    let landmark = req.body.landmark || '';
    let phone = req.body.phone || '';
    // let email = req.body.email || '';
    let zip_code = req.body.zip_code || '';
    let same_as_billing = req.body.same_as_billing || false



    /* START: Validating params */
    if (!same_as_billing){
        if (!['billing', 'shipping'].includes(type) ||
            !fname ||
            !lname ||
            !country ||
            !state ||
            !city ||
            !street ||
            !phone ||
            // !email ||
            !zip_code ||
            !cart_id
        ) {
            return res.status(400).send({
                status: "error",
                message: "Bad request.",
            });
        }
    }
    /* END: Validating params */

    try {
        let obj = {
            cart_id: cart_id,
            fname: fname,
            lname: lname,
            company: company,
            country: country,
            state: state,
            city: city,
            street: street,
            landmark: landmark,
            phone: phone,
            // email: email,
            zip_code: zip_code,
            same_as_billing: same_as_billing 
        }
        if (type === 'billing') {
            await SalesOrder.updateBillingAddress(obj)
        }
        if (type === 'shipping') {
            await SalesOrder.updateShippingAddress(obj)
        }
        return res.status(200).send({
            status: "success",
            message: "Address updated successfully.",
        });

    } catch (error) {
        return res.status(500).send({
            status: "error",
            message: "Something is not right.",
        });
    }
};

exports.placeCodOrder = async (req, res) => {
    // Collecting params
    let cart_id = req.body.cart_id || '';
    let currencyType = req.body.currencyType || '';
    let customer = req.body.customer || ''; 

    try {
        let internation_price = 1;
        if (currencyType === "USD") {
            let settingData = await Setting.getData();
            let internationPriceData = _.find(settingData, { 'meta_key': "international_price" });
            internation_price = internationPriceData.meta_value;
        }
        if(customer){ 
            await SalesOrder.updateCustomer(customer.id, cart_id)
        }
        await SalesOrder.placeOrder(null, type = 'cod', cart_id, internation_price, currencyType)
        //- total Update
        await this.updateProductDetailAndTotal(cart_id);
        //- total Update
        await this.sendEmailOnOrder(cart_id, currencyType, 'placed')
        return res.status(200).send({
            status: "success",
            message: "Order placed successfully.",
        });
    } catch (error) {
        return res.status(500).send({
            status: "error",
            message: "Something is not right.",
            error: error
        });
    }
}

exports.list = async (req, res) => {
    // collecting params
    let customer_id = req.AuthData.customer.id

    /* START: Validating params */
    if (!customer_id) {
        return res.status(400).send({
            status: "error",
            message: "Bad request.",
        });
    }
    /* END: Validating params */
    try {
        let list = await SalesOrder.list(customer_id)
        return res.status(200).send({
            status: "success",
            message: "Order list.",
            list: list
        });
    } catch (error) {
        return res.status(500).send({
            status: "error",
            message: "Something is not right.",
        });
    }
}

exports.detail = async (req, res) => {
    // collecting params
    let customer_id = req.AuthData.customer.id
    let order_id = req.query.order_id

    /* START: Validating params */
    if (!customer_id || !order_id) {
        return res.status(400).send({
            status: "error",
            message: "Bad request.",
        });
    }
    /* END: Validating params */

    try {
        let order_rows = await SalesOrder.detail(customer_id, order_id)
        let order = { items: [] }
        order_rows.map(row => {
            order['id'] = row.id
            order['order_no'] = row.order_no
            order['order_date'] = row.order_date
            order['b_fname'] = row.b_fname
            order['b_lname'] = row.b_lname
            order['b_company_name'] = row.b_company_name
            order['b_country'] = row.b_country
            order['b_state'] = row.b_state
            order['b_city'] = row.b_city
            order['b_street'] = row.b_street
            order['b_landmark'] = row.b_landmark
            order['b_zip_code'] = row.b_zip_code
            order['b_phone'] = row.b_phone
            order['b_email'] = row.b_email
            order['s_fname'] = row.s_fname
            order['s_lname'] = row.s_lname
            order['s_company_name'] = row.s_company_name
            order['s_country'] = row.s_country
            order['s_state'] = row.s_state
            order['s_city'] = row.s_city
            order['s_street'] = row.s_street
            order['s_landmark'] = row.s_landmark
            order['s_zip_code'] = row.s_zip_code
            order['s_phone'] = row.s_phone
            order['s_email'] = row.s_email
            order['status'] = row.status
            order['payment_mode'] = row.payment_mode
            order['sub_total'] = row.sub_total
            order['grand_total'] = row.grand_total
            order.items.push({
                product_id: row.product_id,
                product_name: row.name,
                thumbnail: row.thumbnail,
                quantity: row.quantity,
                price: row.price,
                total: row.total,
            })
        })
        return res.status(200).send({
            status: "success",
            message: "Order list.",
            order: order
        });
    } catch (error) {
        return res.status(500).send({
            status: "error",
            message: "Something is not right.",
        });
    }
}

exports.sendEmailOnOrder = async (cart_id, currencyType, status) => {

    let order_rows = await SalesOrder.orderDetail(cart_id)
    let order = { items: [] }
    order_rows.map(row => {
        order['id'] = row.id
        order['order_no'] = row.order_no
        order['order_date'] = row.order_date
        order['shipping_charge'] = row.shipping_charge
        if (row.payment_type === "USD") {
            order['discount'] = row.discount_usd
        }
        else {
            order['discount'] = row.discount_inr
        }

        order['b_fname'] = row.b_fname
        order['b_lname'] = row.b_lname
        order['b_company_name'] = row.b_company_name
        order['b_country'] = row.b_country
        order['b_state'] = row.b_state
        order['b_city'] = row.b_city
        order['b_street'] = row.b_street
        order['b_landmark'] = row.b_landmark
        order['b_zip_code'] = row.b_zip_code
        order['b_phone'] = row.b_phone
        order['b_email'] = row.b_email
        order['s_fname'] = row.s_fname
        order['s_lname'] = row.s_lname
        order['s_company_name'] = row.s_company_name
        order['s_country'] = row.s_country
        order['s_state'] = row.s_state
        order['s_city'] = row.s_city
        order['s_street'] = row.s_street
        order['s_landmark'] = row.s_landmark
        order['s_zip_code'] = row.s_zip_code
        order['s_phone'] = row.s_phone
        order['s_email'] = row.s_email
        order['status'] = row.status
        order['payment_mode'] = row.payment_mode
        order['sub_total'] = row.sub_total
        order['grand_total'] = row.grand_total
        order.items.push({
            product_id: row.product_id,
            product_name: row.name,
            thumbnail: row.thumbnail,
            quantity: row.quantity,
            price: row.price,
            total: row.total,
        })
    });
    let emailHtml = '<div id=":2cd" class="a3s aiL "> <table bgcolor="#fafafa" width="100%" height="100%" align="center" style="border-collapse:collapse" border="0" cellspacing="0" cellpadding="0">  <tbody> <tr> <td align="center"> <table width="600" border="1" cellspacing="0" cellpadding="0" bgcolor="#ffffff" style="text-align:left"> <tbody> <tr> <td height="20" style="border-top:none;border-bottom:none;border-left:none;border-right:none"> </td>  </tr> <tr> <td width="20" style="border-top:none;border-bottom:none;border-left:none;border-right:none"> </td> <td width="48" valign="top" style="border-top:none;border-bottom:none;border-left:none;border-right:none"> <img src="https://ci6.googleusercontent.com/proxy/jMYX9kHsl1drgBgoBLpn3Ga5S3YV2HJHWNqUQIVBslk88TWErmg_CcPhR90s4pcLi58INb73LCVbN1aq08UTEzpmR9cgBsyLCCrVK_4A8XS_qt8cKEY5Ecw=s0-d-e1-ft#https://i01.appmifile.com/webfile/globalimg/common/mail/milogo-new.png" border="0" height="48" width="48" class="CToWUd"></td> <td align="right" style="font-size:12px;line-height:18px;color:#666;border-top:none;border-bottom:none;border-left:none;border-right:none">  Order ID <span style="color:#ee330a">#' + order['order_no'] + '</span><br> <a href="mailto:service.in@xiaomi.com" target="_blank">Contact us online</a><br></td> <td width="20" style="border-top:none;border-bottom:none;border-left:none;border-right:none"> </td></tr> <tr> <td height="20" style="border-top:none;border-bottom:none;border-left:none;border-right:none"> </td> </tr>  </tbody> </table> </td> </tr> <tr> <td height="10"></td> </tr> <tr> <td align="center"> <table width="600" border="1" cellspacing="0" cellpadding="0" bgcolor="#ffffff"  style="text-align:left"> <tbody> <tr> <td height="20" style="border-top:none;border-bottom:none;border-left:none;border-right:none"> </td> </tr> <tr> <td width="20" style="border-top:none;border-bottom:none;border-left:none;border-right:none"> </td> <td style="border-top:none;border-bottom:none;border-left:none;border-right:none"> <p style="color:#333;font-size:30px;margin-top:5px;margin-bottom:10px">Your Order has been ' + status + '.</p>  <p style="color:#666;font-size:14px;line-height:22px;margin-top:14px;margin-bottom:14px"> Thank you for shopping with us! </p> </td> <td width="20" style="border-top:none;border-bottom:none;border-left:none;border-right:none"> </td> </tr> <tr> <td height="20" style="border-top:none;border-bottom:none;border-left:none;border-right:none"> </td> </tr> </tbody> </table> </td> </tr> <tr>  <td height="10"></td> </tr>  <tr><td align="center"><table width="600" border="1" cellspacing="0" cellpadding="0" bgcolor="#ffffff" style="text-align:left"> <tbody> <tr> <td width="20" style="border-top:none;border-left:none;border-right:none"></td> <td style="border-top:none;border-left:none;border-right:none"> <table width="100%"> <tbody> <tr> <td width="200" style="font-size:18px;color:#333;font-weight:bold;line-height:54px"> Order details</td> </tr> </tbody> </table> </td> <td width="20" style="border-top:none;border-left:none;border-right:none"></td> </tr> <tr> <td width="20" style="border-top:none;border-bottom:none;border-left:none;border-right:none"> </td> <td style="border-top:none;border-left:none;border-right:none">';
    let symbole = '₹';
    if (currencyType == 'USD') {
        symbole = '$';
    }

    order.items.forEach(product => {
        emailHtml += '  <table width="100%" border="0" cellspacing="0" cellpadding="0"> <tbody> <tr> <td width="10"></td> <td width="100" height="116" style="font-size:18px;color:#333;line-height:54px"><img style="vertical-align:middle" src="' + conf.s3_base_url + product.thumbnail + '"  border="0" height="80" width="80" class="CToWUd"></td> <td style="font-size:14px;color:#333"> <p style="font-size:14px;color:#666;font-weight:bold;margin:0"> ' + product.product_name + '</p> <p style="font-size:14px;color:#666;margin:0;line-height:30px"> ' + symbole + product.price + 'X' + product.quantity + ' = ' + symbole + product.total + '</p> </td> </tr> </tbody> </table>';
    });

    let fullName = order['b_fname'] + ' ' + order['b_lname'];
    let grand_total = order['sub_total'] + order['shipping_charge'] - order['discount'];
    emailHtml += '</td> <td width="20" style="border-top:none;border-bottom:none;border-left:none;border-right:none"> </td> </tr> <tr> <td width="20" style="border-top:none;border-left:none;border-right:none"></td> <td style="border-top:none;border-left:none;border-right:none"> <table width="100%" border="0" cellspacing="0" cellpadding="0"> <tbody><tr> <td height="10"> </td> </tr> <tr> <td style="font-size:14px;color:#666;line-height:30px"> <span style="margin-right:10px"><strong>Subtotal:</strong> ' + symbole + order['sub_total'] + '</span><span><strong></strong></span></td></tr><tr><td style="font-size:14px;color:#666;line-height:30px"><span style="margin-right:10px"><strong>Shipping:</strong>' + symbole + order['shipping_charge'] + '</span></td></tr><tr><td style="font-size:14px;color:#666;line-height:30px"><span style="margin-right:10px"><strong>Discount:</strong>' + symbole + order['discount'] + '</span></td></tr><tr><td style="font-size:18px;color:#ee330a;line-height:30px"><strong>Total:</strong> ' + symbole + grand_total + ' </td></tr><tr><td height="10"></td></tr></tbody></table></td><td width="20" style="border-top:none;border-left:none;border-right:none"></td></tr><tr><td width="20" style="border-top:none;border-bottom:none;border-left:none;border-right:none"></td><td style="border-top:none;border-bottom:none;border-left:none;border-right:none"><table width="100%" border="0" cellspacing="0" cellpadding="0"><tbody><tr><td height="10"></td></tr><tr><td colspan="2" style="font-size:18px;color:#333;font-weight:bold;line-height:50px">Delivery information</td></tr><tr><td valign="top" width="80"style="font-size:14px;color:#666;line-height:24px;font-weight:bold">Name:</td><td valign="top" style="font-size:14px;color:#666;line-height:24px">' + fullName + '</td></tr><tr><td valign="top" style="font-size:14px;color:#666;line-height:24px;font-weight:bold">Phone:</td><td valign="top" style="font-size:14px;color:#666;line-height:24px">' + order['b_phone'] + ' </td></tr><tr><td valign="top" style="font-size:14px;color:#666;line-height:24px;font-weight:bold">Address:</td><td valign="top" style="font-size:14px;color:#666;line-height:24px">' + order['b_landmark'] + ' ' + order['b_city'] + ' ' + order['b_state'] + ' ' + order['b_zip_code'] + ' ' + order['b_country'] + '</td></tr><tr><td height="20"></td></tr><tr><td colspan="2" style="font-size:14px;color:#666;line-height:24px">*Package will be delivered between 09:00-19:00 from Monday to Saturday. There are no deliveries on Sunday and on public holidays.</td></tr><tr><td height="20"></td></tr></tbody></table></td><td width="20" style="border-top:none;border-bottom:none;border-left:none;border-right:none"></td></tr></tbody></table>   </td></tr> <tr> <td height="10"></td> </tr> <tr> <td align="center"> <table width="600" border="1" cellspacing="0" cellpadding="0" bgcolor="#ffffff" style="text-align:left"> <tbody>  <tr> <td height="20" style="border-top:none;border-bottom:none;border-left:none;border-right:none"> </td> </tr> <tr> <td width="20" style="border-top:none;border-bottom:none;border-left:none;border-right:none"> </td> <td width="48" valign="top" style="border-top:none;border-bottom:none;border-left:none;border-right:none"> <img src="https://ci6.googleusercontent.com/proxy/jMYX9kHsl1drgBgoBLpn3Ga5S3YV2HJHWNqUQIVBslk88TWErmg_CcPhR90s4pcLi58INb73LCVbN1aq08UTEzpmR9cgBsyLCCrVK_4A8XS_qt8cKEY5Ecw=s0-d-e1-ft#https://i01.appmifile.com/webfile/globalimg/common/mail/milogo-new.png" border="0" height="48" width="48" class="CToWUd"></td> <td align="right" style="font-size:12px;line-height:18px;color:#666;line-height:24px;border-top:none;border-bottom:none;border-left:none;border-right:none"> Customer Support: <a href="mailto:service.in@xiaomi.com" target="_blank">service.in@xiaomi.com</a><br> Customer Hotline: 1800 103 6286 </td> <td width="20" style="border-top:none;border-bottom:none;border-left:none;border-right:none">  </td> </tr>  <tr> <td height="20" style="border-top:none;border-bottom:none;border-left:none;border-right:none"> </td> </tr> </tbody>  </table> </td> </tr> </tbody> </table> <img alt="" width="0px" height="0px" src="https://ci3.googleusercontent.com/proxy/B-YIWfWaydHrXRKIMBQiK1JLP6_IH4cIY31oBPKKewe1-Olp9HtweFI6U6FgoeqkaxhjoYQd7dFo5Jx_HXhFeTPRFv-ea5yLB9xxHknV06tHkIB24DFLASeIq8Rw=s0-d-e1-ft#http://store.mi.com/in/misc/stat?l=053746862161&amp;t=1626167746&amp;p=shipped&amp;w=1" class="CToWUd"><img src="https://ci6.googleusercontent.com/proxy/SmqLTh-7pzLcbaymCdG_BGaIYHLoYOMZenlt4EYDYZ9lWvKK7IoBeoggyh5zzQZPskKxaEZ-hicG9lfIh0CXfIhCyGy97bNNt491I_g3kYBo9nH1-9XEI1KHD_2kqC-AaqXLl3MCE5hRDOomqDn7cpvEbwS1qyOfE1duHexU5tWQRYB6bPf6tt4XuYDpD3PeL6C5RH7hLc1skskck7Wuo6RSuM_DRnq7P6D2quWt6hsbfgwFk6gy176qZmujgeL2khyhA6iC990nfrDJQC6HasrGACqdbm1xUuC0xuZ37Iwt5Rihcr9Sbk5un0PA2g8-BRQj5vsBaekA873OieTq9OAYXQl7lfGrcquYgtVv0ix3Ubp7CJOCuJnFKL4vg4W71oA7HCIQM3PiIR6TQACuvTt4iDJsiZyuIE_cOvMgp94=s0-d-e1-ft#http://url1028.in.passport.xiaomi.com/wf/open?upn=2jC-2Fl5qzQNWPyNyxWz4BQ4fh46NFg0dj18JcNI7bDEAOv2sZZFmNfm5yIBR-2BhcLH3LQyJ5OC3cqz3aVf4eQPYZRQ-2FdteyCKwQ6PS2-2B0UXeFvpQoJM8KHidOKi1507NJ8tY44HpmuoXhTCXbEOyvLo0KdbaUopCKBRaMgkDM6ND7re9OnLnKURQREpYXk0AxnBKd5chUL78sjTB2Y46yRgBEIlCe-2BbAm92C8ICH-2BpXNA-3D" alt="" width="1" height="1" border="0" style="height:1px!important;width:1px!important;border-width:0!important;margin-top:0!important;margin-bottom:0!important;margin-right:0!important;margin-left:0!important;padding-top:0!important;padding-bottom:0!important;padding-right:0!important;padding-left:0!important" class="CToWUd"> </div>';

    // client
    let senderEmail = order['b_email'];
    try {
        await sendEmail({ to: senderEmail, subject: "Order Place", html: emailHtml })

    } catch (error) {
    }
    // admin
    try {
        await sendEmail({ to: process.env.EMAIL_USERNAME, subject: "New Order Place", html: emailHtml })
        return 200;
    } catch (error) {
        return 500;
    }

}

exports.updateProductDetailAndTotal = async (cart_id) => {

    /* END: Validating params */
    try {
        let rows = await SalesOrder.getCartDetailRows(cart_id)
        const promises = rows.map(async singleRow => {
            const updateing = await this.getDetailsandUpdateSOI(singleRow.product_id, singleRow.soi_id, singleRow.quantity)
            return updateing
        })
        const updateDetails = await Promise.all(promises)
        return true
    } catch (error) {
        return false
    }
}

exports.getDetailsandUpdateSOI = async (product_id, soi_id, qty) => {
    /* END: Validating params */
    try {
        let productDetails = await SalesOrder.getProductDetails(product_id)
        let price = productDetails.price;
        let total = price * qty;
        await SalesOrder.updateSOIdetails(soi_id, price, total)
        return true
    } catch (error) {
        return false
    }
}

// Admin
exports.admin_list = async (req, res) => {
    try {
        let list = await SalesOrder.adminList()
        return res.status(200).send({
            status: "success",
            message: "Order list.",
            list: list
        });
    } catch (error) {
        return res.status(500).send({
            status: "error",
            message: "Something is not right.",
        });
    }
}

exports.admin_detail = async (req, res) => {
    // collecting params 
    let order_id = req.query.order_id

    /* START: Validating params */
    if (!order_id) {
        return res.status(400).send({
            status: "error",
            message: "Bad request.",
        });
    }
    /* END: Validating params */

    try {
        let order_rows = await SalesOrder.orderDetail(order_id)
        let order = { items: [] }
        order_rows.map(row => {
            order['id'] = row.id
            order['order_no'] = row.order_no
            order['order_date'] = row.order_date
            order['shipping_charge'] = row.shipping_charge
            if (row.payment_type === "USD") {
                order['discount'] = row.discount_usd
            }
            else {
                order['discount'] = row.discount_inr
            }
            order['b_fname'] = row.b_fname
            order['b_lname'] = row.b_lname
            order['b_company_name'] = row.b_company_name
            order['b_country'] = row.b_country
            order['b_state'] = row.b_state
            order['b_city'] = row.b_city
            order['b_street'] = row.b_street
            order['b_landmark'] = row.b_landmark
    
            order['b_zip_code'] = row.b_zip_code
            order['b_phone'] = row.b_phone
            order['b_email'] = row.b_email
            order['s_fname'] = row.s_fname
            order['s_lname'] = row.s_lname
            order['s_company_name'] = row.s_company_name
            order['s_country'] = row.s_country
            order['s_state'] = row.s_state
            order['s_city'] = row.s_city
            order['s_street'] = row.s_street
            order['s_landmark'] = row.s_landmark
            order['s_zip_code'] = row.s_zipcode
            order['s_phone'] = row.s_phone
            order['s_email'] = row.s_email
            order['status'] = row.status
            order['payment_mode'] = row.payment_mode
            order['sub_total'] = row.sub_total
            order['grand_total'] = row.grand_total
            order.items.push({
                product_id: row.product_id,
                product_name: row.name,
                thumbnail: row.thumbnail,
                quantity: row.quantity,
                price: row.price,
                total: row.total,
            })
        })
        return res.status(200).send({
            status: "success",
            message: "Order details.",
            order: order
        });
    } catch (error) {
        return res.status(500).send({
            status: "error",
            message: "Something is not right.",
        });
    }
}

exports.order_update = async (req, res) => {
    // Collecting params
    let order_id = req.body.order_id || '';
    let status = req.body.status || '';
    let currencyType = req.body.currencyType || '';

    if (!order_id && !status) {
        return res.status(400).send({
            status: "error",
            message: "Bad request.",
        });
    }
    try {
        await SalesOrder.updateOrder(order_id, status)
        await this.sendEmailOnOrder(order_id, currencyType, status)
        return res.status(200).send({
            status: "success",
            message: "Order update successfully.",
        });
    } catch (error) {
        return res.status(500).send({
            status: "error",
            message: "Something is not right.",
            error: error
        });
    }
   
} 
exports.generateInvoice = async (req, res) => {
    // Collecting params
    let order_id = req.query.card_id || '';
    let customer_id = req.query.customer_id || '';
    
    if (!order_id ) {
        return res.status(400).send({
            status: "error",
            message: "Bad request.",
        });
    } 
    try { 
       let order_rows = await SalesOrder.detail(customer_id, order_id)
        let order = { items: [] }
        order_rows.map(row => {
            order['id'] = row.id
            order['order_no'] = row.order_no
            order['order_date'] = row.order_date
            order['b_fname'] = row.b_fname
            order['b_lname'] = row.b_lname
            order['b_company_name'] = row.b_company_name
            order['b_country'] = row.b_country
            order['b_state'] = row.b_state
            order['b_city'] = row.b_city
            order['b_street'] = row.b_street
            order['b_landmark'] = row.b_landmark
            order['b_zip_code'] = row.b_zip_code
            order['b_phone'] = row.b_phone
            order['b_email'] = row.b_email
            order['s_fname'] = row.s_fname
            order['s_lname'] = row.s_lname
            order['s_company_name'] = row.s_company_name
            order['s_country'] = row.s_country
            order['s_state'] = row.s_state
            order['s_city'] = row.s_city
            order['s_street'] = row.s_street
            order['s_landmark'] = row.s_landmark
            order['s_zip_code'] = row.s_zip_code
            order['s_phone'] = row.s_phone
            order['s_email'] = row.s_email
            order['status'] = row.status
            order['payment_mode'] = row.payment_mode
            order['sub_total'] = row.sub_total
            order['grand_total'] = row.grand_total
            order['shipping_charge'] = row.shipping_charge
            order['payment_type'] = row.payment_type
            order['discount_usd'] = row.discount_usd
            order['discount_inr'] = row.discount_inr
            order.items.push({
                product_id: row.product_id,
                product_name: row.name,
                thumbnail: row.thumbnail,
                quantity: row.quantity,
                price: row.price,
                total: row.total,
            })
        })
        return res.status(200).send({
            status: "success",
            message: "Order fetch successfully.",
            order:order
        });
    } catch (error) {
        console.log(error);
        return res.status(500).send({
            status: "error",
            message: "Something is not right.",
            error: error
        });
    }
}