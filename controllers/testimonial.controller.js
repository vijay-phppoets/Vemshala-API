const { response } = require("express");
const Testimonial = require("../models/testimonial.model");
const s3Controller = require("./s3.controller");

/* ----
Purpose: To save testimonial
Req: 
Res: 
---- */
exports.save = async (req, res) => {

    // Collecting params
    let description = req.body.description || "";
    let image = req.body.image || "";
    let name = req.body.name || "";
    let title = req.body.title || "";
    let sequence = req.body.sequence || 1;

    /* START: Validating params */
    if (!description || !name) {
        return res.status(400).send({
            status: "error",
            message: "Bad request.",
        });
    }
    /* END: Validating params */


    try {
        await Testimonial.save(description, image, name, title, sequence)

        return res.status(200).send({
            status: "success",
            message: "Testimonial saved.",
        });
    } catch (err) {
        return res.status(500).send({
            status: "error",
            message: "Something is not right.",
        });
    }
};

/* ----
Purpose: To delete testimonial
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
        let testimonial = await Testimonial.detail_by_id(id)

        if (testimonial) {
            // deleting old images
            await s3Controller.deleteFile(testimonial.image);

            await Testimonial.delete(id)
        }

        return res.status(200).send({
            status: "success",
            message: "Testimonial deleted.",
        });
    } catch (err) {
        return res.status(500).send({
            status: "error",
            message: "Something is not right.",
        });
    }
};

/* ----
Purpose: To fetch testimonial list
Req: 
Res: 
---- */
exports.list = async (req, res) => {


    try {
        let list = await Testimonial.list()

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