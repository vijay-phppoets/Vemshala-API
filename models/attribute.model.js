const sql = require("./db.js")
const { v4: uuidv4 } = require('uuid')

// defining table name
const tbl = "attribute"

/* ----
Purpose: To fetch category info
Req: category_url_key
Res: array
---- */
exports.list = async (nature) => {

    let nature_whr_cls = ""
    if (nature !== "all") nature_whr_cls = `WHERE a.nature = '${nature}'`


    var query = `
        SELECT
            a.id,
            a.name,
            a.type,
            a.nature,
            a.attr_code,
            a.use_for_search,
            ao.id AS option_id,
            ao.option_value AS option_value,
            ao.option_url_key AS option_url_key,
            ao.color_code AS color_code
        FROM
            attribute a
        LEFT JOIN attribute_option ao
            ON ao.attribute_id = a.id
        ${nature_whr_cls}
    `

    return new Promise((resolve, reject) => {
        sql.query(query, (error, result, fields) => {
            if (error) return reject(error)
            return resolve(result)
        })
    })
}