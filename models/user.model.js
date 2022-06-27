const sql = require("./db.js")
const { v4: uuidv4 } = require('uuid')
var md5 = require("md5");

// defining table name
const tbl = "user"

/* ----
Purpose: To login
Req: email, password
Res: user
---- */
exports.login = async (email, password) => {
    var query = `
        SELECT
            id
        FROM
            user
        WHERE email = '${email}'
        AND password = md5('${password}')
    `


    return new Promise((resolve, reject) => {
        sql.query(query, (error, result, fields) => {
            if (error) return reject(error)
            if (result && result[0]) return resolve(result[0])
            return reject(false)
        })
    })
}

