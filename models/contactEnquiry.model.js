const sql = require("./db.js")
const { v4: uuidv4 } = require('uuid')

// defining table name
const tbl = "contact_enquiry"


exports.create = async (obj) => {
    let id = uuidv4()

    var query = `
        INSERT INTO 
            contact_enquiry
        SET
            id = ?,
            name = ?,
            message = ?,
            email = ?
    `

    let params = [id, obj.name, obj.message, obj.email]
    return new Promise((resolve, reject) => {
        sql.query(query, params, (error, result, fields) => {
            if (error) return reject(error)
            return resolve({ id: id })
        })
    })
}
