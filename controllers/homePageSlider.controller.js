const { response } = require("express");
const HomePageSlider = require("../models/homePageSlider.model");
const Testimonial = require("../models/testimonial.model");
const Category = require("../models/category.model");
const Product = require("../models/product.model");
const s3Controller = require("./s3.controller");
const Setting = require('../models/setting.model')
const _ = require('lodash');
/* ----
Purpose: To save home page slider images
Req: 
Res: 
---- */
exports.save = async (req, res) => {

    // Collecting params
    let banner_img = req.body.banner_img || "";
    let m_banner_img = req.body.m_banner_img || "";
    let sequence = req.body.sequence || 0;

    /* START: Validating params */
    if (!banner_img || !m_banner_img || !sequence) {
        return res.status(400).send({
            status: "error",
            message: "Bad request.",
        });
    }
    /* END: Validating params */


    try {
        await HomePageSlider.save(banner_img, m_banner_img, sequence)

        return res.status(200).send({
            status: "success",
            message: "Slider images saved.",
        });
    } catch (err) {
        return res.status(500).send({
            status: "error",
            message: "Something is not right.",
        });
    }
};

/* ----
Purpose: To delete slider image
Req: 
Res: 
---- */
exports.delete = async (req, res) => {

    // Collecting params
    let id = req.body.id || "";

    /* START: Validating params */
    if (!id) {
        return res.status(400).send({
            status: "error",
            message: "Bad request.",
        });
    }
    /* END: Validating params */


    try {
        // getting current category details
        let slider = await HomePageSlider.detail_by_id(id)

        if (slider) {
            // deleting old images
            await s3Controller.deleteFile(slider.image);
            await s3Controller.deleteFile(slider.m_image);

            await HomePageSlider.delete(id)
        }

        return res.status(200).send({
            status: "success",
            message: "Slider images deleted.",
        });
    } catch (err) {
        return res.status(500).send({
            status: "error",
            message: "Something is not right.",
        });
    }
};

/* ----
Purpose: To fetch slider list
Req: 
Res: 
---- */
exports.list = async (req, res) => {


    try {
        let list = await HomePageSlider.list()

        return res.status(200).send({
            status: "success",
            message: "Slider list.",
            list: list
        });
    } catch (err) {
        return res.status(500).send({
            status: "error",
            message: "Something is not right.",
        });
    }
};

/* ----
Purpose: To fetch home page data
Req: 
Res: 
---- */
exports.homePageData = async (req, res) => {

    let currencyType = req.body.currencyType || "";

    try {
        let sliderList = await HomePageSlider.list()
        let testimonialList = await Testimonial.list()

        let categories = await Category.flatList(only_parent = true)
        let internation_price = 1;
        if (currencyType === "USD") {
            let settingData = await Setting.getData();
            let internationPriceData = _.find(settingData, { 'meta_key': "international_price" });
            internation_price = internationPriceData.meta_value;
        }

        let promises = categories.map(async category => {
            return await Product.getNewArrivalsByCategory(category, internation_price)
        })
        let newArrivalsProducts = await Promise.all(promises)
        let newArvlPrds = []
        newArrivalsProducts.map(obj => {
            if (obj.products.length > 0) {
                newArvlPrds.push(obj)
            }
        })

        let promises2 = categories.map(async category => {
            return await Product.getExclusivesByCategory(category, internation_price)
        })
        let exclusiveProducts = await Promise.all(promises2)
        let exclvsPrds = []
        exclusiveProducts.map(obj => {
            if (obj.products.length > 0) {
                exclvsPrds.push(obj)
            }
        })

        let promises3 = categories.map(async category => {
            return await Product.getOnSalePrdsByCategory(category)
        })
        let onSaleProducts = await Promise.all(promises3)
        let onSalePrds = []
        onSaleProducts.map(obj => {
            if (obj.products.length > 0) {
                onSalePrds.push(obj)
            }
        })

        return res.status(200).send({
            status: "success",
            message: "Home page data",
            sliderList: sliderList,
            testimonialList: testimonialList,
            newArvlPrds: newArvlPrds,
            exclvsPrds: exclvsPrds,
            onSalePrds: onSalePrds,
        });
    } catch (err) {
        return res.status(500).send({
            status: "error",
            message: "Something is not right.",
        });
    }
};