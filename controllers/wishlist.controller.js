const bcrypt = require('bcrypt');
const jwt = require("jsonwebtoken")


/* model */
const Wishlist = require('../models/wishlist.model')
const Setting = require('../models/setting.model')
const _ = require('lodash');

exports.create = async (req, res) => {
    // Collecting params
    let customerId = req.AuthData.customer.id
    let productId = req.body.product_id || "";
    /* START: Validating params */
    if (!customerId && !productId) {
        return res.status(400).send({
            status: "error",
            message: "Bad request.",
        });
    }
    /* END: Validating params */

    try {
        let check = await Wishlist.isWishlisted({
            customer_id: customerId,
            product_id: productId,
        }) 
        if(check===true){
            return res.status(200).send({
                status: "error",
                message: "Product already added to wishlist.",
                product_id: productId,
            });
        }
        let wishlist = await Wishlist.create({
            customer_id: customerId,
            product_id: productId,
        })
        return res.status(200).send({
            status: "success",
            message: "Product added to wishlist.",
            product_id: productId,
        });
    } catch (error) {
        return res.status(500).send({
            status: "error",
            message: "Something is not right.",
        });
    }
}

exports.wishList = async (req, res) => {
    // Collecting params
    let customerId = req.AuthData.customer.id
    let currencyType = req.query.currencyType || null;
    /* START: Validating params */
    if (!customerId) {
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

        let obj = {
            customerId: customerId,
        }
        const [list, total_records] = await Promise.all([
            Wishlist.list(obj, internation_price),
            Wishlist.count(obj),
        ])
        // console.log("customerId", list)
        return res.status(200).send({
            status: "success",
            message: "Wishlist",
            list: list,
            total_records: total_records,
        });
    } catch (err) {
        return res.status(500).send({
            status: "error",
            message: "Something is not right.",
        });
    }
};

exports.removeWishlist = async (req, res) => {
    // Collecting params
    let customerId = req.AuthData.customer.id
    let wishlist_id = req.body.wishlist_id || "";
    /* START: Validating params */
    if (!customerId && !wishlist_id) {
        return res.status(400).send({
            status: "error",
            message: "Bad request.",
        });
    }
    /* END: Validating params */
    try {
        let wishlist = await Wishlist.remove({
            customer_id: customerId,
            wishlist_id: wishlist_id,
        })
        return res.status(200).send({
            status: "success",
            message: "Product removed from wishlist.",
        });
    } catch (error) {
        return res.status(500).send({
            status: "error",
            message: "Something is not right.",
        });
    }
}


