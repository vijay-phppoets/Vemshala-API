const { response } = require("express");
const Attribute = require("../models/attribute.model");
const _ = require('lodash');


/* ----
Purpose: To fetch attribute list
Req: nature
Res: 
---- */
exports.list = async (req, res) => {

    // Collecting params
    let nature = req.query.nature || "all";


    try {
        let attribute_list = await Attribute.list(nature)

        let attribute_arr = []
        attribute_list.map(row => {
            if (_.findIndex(attribute_arr, { 'id': row.id }) < 0) {
                attribute_arr.push({
                    id: row.id,
                    name: row.name,
                    type: row.type,
                    nature: row.nature,
                    attr_code: row.attr_code,
                    use_for_search: row.use_for_search,
                    options: [{ id: row.option_id, option_value: row.option_value, option_url_key: row.option_url_key, color_code: row.color_code }]
                })
            } else {
                attribute_arr[_.findIndex(attribute_arr, { 'id': row.id })].options.push({ id: row.option_id, option_value: row.option_value, option_url_key: row.option_url_key, color_code: row.color_code })
            }
        })

        return res.status(200).send({
            status: "success",
            message: "Attribute info",
            list: attribute_arr
        });
    } catch (err) {
        return res.status(500).send({
            status: "error",
            message: "Something is not right.",
        });
    }
};