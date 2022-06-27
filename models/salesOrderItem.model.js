const sql = require("./db.js")
const { v4: uuidv4 } = require('uuid')

// defining table name
const tbl = "sales_order_item"

/* ----
Purpose: To create an empty cart
Req: customer_id (optional)
Res: 
---- */
exports.addItem = async (obj) => {

    let id = uuidv4()

    var query = `
        INSERT INTO 
            sales_order_item
        SET
            id = ?,
            sales_order_id = ?,
            product_id = ?,
            quantity = ?
    `

    let params = [id, obj.sales_order_id, obj.product_id, obj.quantity]


    return new Promise((resolve, reject) => {
        sql.query(query, params, (error, result, fields) => {
            if (error) return reject(error)
            return resolve({ id: id })
        })
    })
}


/* ----
Purpose: To update a cart
Req: 
Res: 
---- */
exports.updateItem = async (obj) => {

    var query = `
        UPDATE 
            sales_order_item
        SET
            quantity = ${obj.quantity}
        WHERE 
            id = "${obj.sales_order_item_id}"
    `

    return new Promise((resolve, reject) => {
        sql.query(query, (error, result, fields) => {
            if (error) return reject(error)
            return resolve(true)
        })
    })
}

exports.deleteItem = async (obj) => {

    var query = `
        DELETE FROM 
            sales_order_item
        WHERE 
            id = "${obj.sales_order_item_id}"
    `

    return new Promise((resolve, reject) => {
        sql.query(query, (error, result, fields) => {
            if (error) return reject(error)
            return resolve(true)
        })
    })
}