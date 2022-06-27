const Coupon = require("../models/coupon.model");
const Setting = require('../models/setting.model')
const _ = require('lodash');

exports.list = async (req, res) => {
    try {
        const response = await Coupon.list();
        if (response) {
            return res.status(200).send({
                status: "success",
                message: "Coupon list",
                list: response,
            });
        }
    } catch (err) {
        return res.status(500).send({
            status: "error",
            message: "Something is not right.",
        });
    }
};

exports.add = async (req, res) => {
    // Collecting params
    let type = req.body.type || "";
    let status = req.body.status || "";
    let name = req.body.name || "";
    let code = req.body.code || "";
    let description = req.body.description || "";
    let no_of_usage_for_all = req.body.no_of_usage_for_all || 0;

    let valid_from = req.body.valid_from || 0;
    let valid_to = req.body.valid_to || 0;
    let discount = req.body.discount || 0;
    let minimum_cart_value = req.body.minimum_cart_value || 0;
    let maximum_discount_amount = req.body.maximum_discount_amount || 0;

    if (valid_from) {
        valid_from_ar = valid_from.split(" ")
        valid_from_ar[0] = valid_from_ar[0].split("-").reverse().join("-")
        valid_from = valid_from_ar.join(" ")
    } else {
        return res.status(400).send({
            status: "error", message: "Invalid date."
        })
    }
    if (valid_to) {
        valid_to_ar = valid_to.split(" ")
        valid_to_ar[0] = valid_to_ar[0].split("-").reverse().join("-")
        valid_to = valid_to_ar.join(" ")
    } else {
        return res.status(400).send({
            status: "error", message: "Invalid date."
        })
    }


    /* START: Validating params */
    if (!type || !status || !name || !code || !no_of_usage_for_all || !valid_from || !valid_to || !discount || !minimum_cart_value || !maximum_discount_amount) {
        return res.status(400).send({
            status: "error",
            message: "Bad request.",
        });
    }
    /* END: Validating params */

    try {
        let obj = {
            type: type,
            status: status,
            name: name,
            code: code,
            no_of_usage_for_all: no_of_usage_for_all,
            valid_from: valid_from,
            valid_to: valid_to,
            discount: discount,
            minimum_cart_value: minimum_cart_value,
            maximum_discount_amount: maximum_discount_amount,
            description: description,
        }
        let couponExistOrNot = await Coupon.checkExistorNot(code)
        let Count = couponExistOrNot.coupon_count;
        if (Count > 0) {
            return res.status(500).send({
                status: "error",
                message: "Voucher code already exist",
            });
        }
        let coupon = await Coupon.create(obj)
        return res.status(200).send({
            status: "success",
            message: "Coupon created successfully.",
            coupon: coupon
        });
    } catch (err) {
        return res.status(500).send({
            status: "error",
            message: "Something is not right.",
        });
    }
};

exports.view = async (req, res) => {

    // Collecting params
    let voucher_id = req.query.voucher_id || null;

    /* START: Validating params */
    if (!voucher_id) {
        return res.status(400).send({
            status: "error",
            message: "Bad request.",
        });
    }
    /* END: Validating params */

    try {
        const coupon = await Coupon.admin_view(voucher_id);

        if (coupon) {
            return res.status(200).send({
                status: "success",
                message: "",
                coupon: coupon,
            });
        }
    } catch (err) {
        return res.status(500).send({
            status: "error",
            message: "Something is not right.",
        });
    }
};

exports.update = async (req, res) => {

    // Collecting params
    let voucher_id = req.body.voucher_id || "";
    let type = req.body.type || "";
    let status = req.body.status || "";
    let name = req.body.name || "";
    let code = req.body.code || "";
    let description = req.body.description || "";
    let no_of_usage_for_all = req.body.no_of_usage_for_all || 0;

    let valid_from = req.body.valid_from || 0;
    let valid_to = req.body.valid_to || 0;
    let discount = req.body.discount || 0;
    let minimum_cart_value = req.body.minimum_cart_value || 0;
    let maximum_discount_amount = req.body.maximum_discount_amount || 0;

    if (valid_from) {
        valid_from_ar = valid_from.split(" ")
        valid_from_ar[0] = valid_from_ar[0].split("-").reverse().join("-")
        valid_from = valid_from_ar.join(" ")
    } else {
        return res.status(400).send({
            status: "error", message: "Invalid date."
        })
    }
    if (valid_to) {
        valid_to_ar = valid_to.split(" ")
        valid_to_ar[0] = valid_to_ar[0].split("-").reverse().join("-")
        valid_to = valid_to_ar.join(" ")
    } else {
        return res.status(400).send({
            status: "error", message: "Invalid date."
        })
    }

    /* START: Validating params */
    if (!voucher_id || !type || !status || !name || !code || !no_of_usage_for_all || !valid_from || !valid_to || !discount || !minimum_cart_value || !maximum_discount_amount) {
        return res.status(400).send({
            status: "error",
            message: "Bad request.",
        });
    }
    /* END: Validating params */

    try {
        let obj = {
            voucher_id: voucher_id,
            type: type,
            status: status,
            name: name,
            code: code,
            no_of_usage_for_all: no_of_usage_for_all,
            valid_from: valid_from,
            valid_to: valid_to,
            discount: discount,
            minimum_cart_value: minimum_cart_value,
            maximum_discount_amount: maximum_discount_amount,
            description: description,
        }
        let coupon = await Coupon.update(obj)

        return res.status(200).send({
            status: "success",
            message: "Product updated successfully.",
        });
    } catch (err) {
        return res.status(500).send({
            status: "error",
            message: "Something is not right.",
        });
    }
};


exports.applyCoupon = async (req, res) => {

    // Collecting params
    let couponCode = req.body.coupon_code || null;
    let cartId = req.body.cart_id || null;
    let cartValue = req.body.cartValue || null;
    let currencyType = req.body.currencyType || null;


    /* START: Validating params */
    if (!couponCode && !cartId && !currencyType) {
        return res.status(400).send({
            status: "error",
            message: "Bad request.",
        });
    }
    /* END: Validating params */

    try {

        // check Coupon exist or not
        const checkCodeExistorNot = await Coupon.checkExistorNot(couponCode);
        if (checkCodeExistorNot.coupon_count == 0) {
            return res.status(400).send({
                status: "error",
                message: "Invalid Coupon Code.",
            });
        }

        // check current date and coupon date is valid or not
        let today = new Date();
        let date = today.getFullYear() + '-' + (today.getMonth() + 1) + '-' + (today.getDate());
        let time = today.getHours() + ":" + today.getMinutes() + ":" + today.getSeconds();
        let dateTime = date + ' ' + time
        const checkCodeExistInDateRange = await Coupon.checkCodeExistInDateRange(couponCode, dateTime);
        if (checkCodeExistInDateRange.coupon_count == 0) {
            return res.status(400).send({
                status: "error",
                message: "Coupon code expired.",
            });
        }

        // no of uses exeed or not 
        const checkCodeTotalUsage = await Coupon.checkCodeTotalUsage(couponCode);
        let total_usage = checkCodeTotalUsage.total_usage;
        let no_of_usage_for_all = checkCodeTotalUsage.no_of_usage_for_all;
        let minimum_cart_value = checkCodeTotalUsage.minimum_cart_value;
        let maximum_discount_amount = checkCodeTotalUsage.maximum_discount_amount;
        let discount = checkCodeTotalUsage.discount;
        let type = checkCodeTotalUsage.type;

        if (no_of_usage_for_all < total_usage) {
            return res.status(400).send({
                status: "error",
                message: "Coupon code usage exceed.",
            });
        }

        // min cart value check

        //  Check currency type with minmun cart value
        let internation_price = 1;
        let symbole = "₹ ";
        if (currencyType === "USD") {
            let settingData = await Setting.getData();
            let internationPriceData = _.find(settingData, { 'meta_key': "international_price" });
            internation_price = internationPriceData.meta_value;
            symbole = "$ "
        }

        let calcCartValue = minimum_cart_value / internation_price;

        if (calcCartValue > cartValue) {
            return res.status(400).send({
                status: "error",
                message: "Cart amount is less then " + symbole + calcCartValue + ". Please add more item.",
            });
        }

        let discountAmount = 0;
        let maxDisAmt = maximum_discount_amount / internation_price;
        if (type == "percentage") {
            discountAmount = cartValue * discount / 100;

            if (discountAmount > maxDisAmt) {
                discountAmount = maxDisAmt;
            }
        }
        else {
            if (discount > maxDisAmt) {
                discountAmount = maxDisAmt;
            }
            else {
                discountAmount = discount;
            }
        }
        let inrDiscount = 0;
        let usdDiscount = 0;
        if (currencyType === "USD") {
            usdDiscount = discountAmount;
            inrDiscount = discountAmount * internation_price;
        }
        else {
            let SD = await Setting.getData();
            let inData = _.find(SD, { 'meta_key': "international_price" });
            let ip = inData.meta_value;
            usdDiscount = discountAmount / ip;
            inrDiscount = discountAmount;
        }


        // Update in DB 
        await Coupon.updateCouponCode(couponCode, usdDiscount, inrDiscount, cartId);
        await Coupon.updateCouponUsage(couponCode);

        return res.status(200).send({
            status: "success",
            message: "Coupon applied",
        });

    } catch (err) {
        return res.status(500).send({
            status: "error",
            message: "Something is not right.",
            err: err
        });
    }
};


exports.removeAppliedCoupon = async (req, res) => {

    // Collecting params 
    let cartId = req.body.cart_id || null;
    let couponCode = req.body.coupon_code || null;


    /* START: Validating params */
    if (!cartId && !couponCode) {
        return res.status(400).send({
            status: "error",
            message: "Bad request.",
        });
    }
    /* END: Validating params */

    try {
        // Update in DB 
        await Coupon.removeAppliedCoupon(cartId);
        await Coupon.removeTotalUsage(couponCode);

        return res.status(200).send({
            status: "success",
            message: "",
        });

    } catch (err) {
        return res.status(500).send({
            status: "error",
            message: "Something is not right.",
            err: err
        });
    }
};
