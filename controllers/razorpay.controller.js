const Razorpay = require("razorpay");
const crypto = require("crypto")

/* models */
const SalesOrder = require('../models/salesorder.model')
const Setting = require('../models/setting.model')
const _ = require('lodash');

exports.create = async (req, res) => {
    // Collecting params
    let cart_id = req.body.cart_id || "";
    let currencyType = req.body.currencyType || "";

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
        let billingInfo = await SalesOrder.getCartBillingDetail(cart_id)
        let cartDetails = await SalesOrder.websiteView(cart_id, internation_price, currencyType)

        const instance = new Razorpay({
            key_id: process.env.RAZORPAY_KEY_ID,
            key_secret: process.env.RAZORPAY_SECRET,
        });

        const options = {
            amount: cartDetails.total * 100,
            currency: "INR",
            receipt: "receipt_order_74394",
        };

        const order = await instance.orders.create(options);

        await SalesOrder.updateRzpOrderId(cart_id, order.id, currencyType)

        if (!order) return res.status(500).send("Some error occured");

        return res.status(200).send({
            status: "success",
            message: "Rzp order created.",
            order: order,
            billingInfo: billingInfo,
        });
    } catch (error) {
        res.status(500).send(error);
    }
}

exports.verify_payment = async (req, res) => {
    const secret = process.env.RAZORPAY_WEBHOOK_SECRET
    const shasum = crypto.createHmac("sha256", secret)
    shasum.update(JSON.stringify(req.body))
    const digest = shasum.digest("hex")

    if (digest === req.headers['x-razorpay-signature']) {
        let obj = req.body.payload.payment
        let rzp_order_id = obj[Object.keys(obj)[0]].order_id
        await SalesOrder.placeOrder(rzp_order_id)
    }
    return res.status(200)
}