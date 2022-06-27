const { response } = require("express");
const Country = require("../models/country.model");

exports.list = async (req, res) => {

    try {
        let list = await Country.list()

        return res.status(200).send({
            status: "success",
            message: "Country list.",
            list: list
        });
    } catch (err) {
        return res.status(500).send({
            status: "error",
            message: "Something is not right.",
        });
    }
};

exports.stateList = async (req, res) => {

    // Collecting params
    let country_id = req.query.country_id || null;

    /* START: Validating params */
    if (!country_id) {
        return res.status(400).send({
            status: "error",
            message: "Bad request.",
        });
    }
    /* END: Validating params */

    try {
        let list = await Country.stateList(country_id)

        return res.status(200).send({
            status: "success",
            message: "State list.",
            list: list
        });
    } catch (err) {
        return res.status(500).send({
            status: "error",
            message: "Something is not right.",
        });
    }
};

