const sql = require("./db.js")

// defining table name
const tbl = "country"


exports.list = async () => {

    var query = `
        SELECT
            id,
            name
        FROM
            country
        ORDER BY name
    `


    return new Promise((resolve, reject) => {
        sql.query(query, (error, result, fields) => {
            if (error) return reject(error)
            return resolve(result)
        })
    })
}

exports.stateList = async (country_id) => {

    var query = `
        SELECT
            id,
            name
        FROM
            state
        WHERE country_id = "${country_id}"
        ORDER BY name
    `


    return new Promise((resolve, reject) => {
        sql.query(query, (error, result, fields) => {
            if (error) return reject(error)
            return resolve(result)
        })
    })
}