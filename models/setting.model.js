const sql = require("./db.js")

// defining table name
const tbl = "setting"

exports.update = async (obj) => {

    var query = `
        UPDATE 
            setting
        SET 
            meta_value = "${obj.is_value}"
        WHERE
            meta_key = "international_price"
    `
    return new Promise((resolve, reject) => {
        sql.query(query, (error, result, fields) => {
            if (error) return reject(error)
            return resolve(true)
        })
    })
}

exports.getData = async (obj) => {

    var query = `
        SELECT
            meta_key,
            meta_value
        FROM
            setting  
    `
    return new Promise((resolve, reject) => {
        sql.query(query, (error, result, fields) => {
            if (error) return reject(error)
            return resolve(result)
        })
    })
}

exports.updateShipping = async (obj) => {

    var query = `
        UPDATE 
            setting
        SET 
            meta_value = "${obj.shipping_price}"
        WHERE
            meta_key = "shipping_charge"
    `
    return new Promise((resolve, reject) => {
        sql.query(query, (error, result, fields) => {
            if (error) return reject(error)
            return resolve(true)
        })
    })
}

exports.updateCartValue = async (obj) => {

    var query = `
        UPDATE 
            setting
        SET 
            meta_value = "${obj.minimun_cart_value}"
        WHERE
            meta_key = "minimun_cart_value"
    `
    return new Promise((resolve, reject) => {
        sql.query(query, (error, result, fields) => {
            if (error) return reject(error)
            return resolve(true)
        })
    })
}

exports.updateInternationalShipping = async (obj) => {

    var query = `
        UPDATE 
            setting
        SET 
            meta_value = "${obj.international_shipping}"
        WHERE
            meta_key = "international_shipping"
    `
    return new Promise((resolve, reject) => {
        sql.query(query, (error, result, fields) => {
            if (error) return reject(error)
            return resolve(true)
        })
    })
}


exports.updateInternationPrice = async (obj) => {

    var query = `
        UPDATE 
            setting
        SET 
            meta_value = "${obj.international_price}"
        WHERE
            meta_key = "international_price"
    `
    return new Promise((resolve, reject) => {
        sql.query(query, (error, result, fields) => {
            if (error) return reject(error)
            return resolve(true)
        })
    })
}


exports.updateAdminEmail = async (obj) => {

    var query = `
        UPDATE 
            setting
        SET 
            meta_value = "${obj.admin_email}"
        WHERE
            meta_key = "admin_email"
    `
    return new Promise((resolve, reject) => {
        sql.query(query, (error, result, fields) => {
            if (error) return reject(error)
            return resolve(true)
        })
    })
}

exports.updateAdminEmail = async (obj) => {

    var query = `
        UPDATE 
            setting
        SET 
            meta_value = "${obj.admin_email}"
        WHERE
            meta_key = "admin_email"
    `
    return new Promise((resolve, reject) => {
        sql.query(query, (error, result, fields) => {
            if (error) return reject(error)
            return resolve(true)
        })
    })
}

exports.updateOffer = async (obj) => {

    var query = `
        UPDATE 
            setting
        SET 
            meta_value = "${obj.offer_strip}"
        WHERE
            meta_key = "offer_strip"
    `
    return new Promise((resolve, reject) => {
        sql.query(query, (error, result, fields) => {
            if (error) return reject(error)
            return resolve(true)
        })
    })
}