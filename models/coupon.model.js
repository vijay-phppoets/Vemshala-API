const sql = require("./db.js")
const { v4: uuidv4 } = require('uuid')

// defining table name
const tbl = "coupon"


exports.list = async () => {
    var query = `
        SELECT
            id,
            name,
            code,
            type,
            valid_from,
            valid_to,
            discount,
            minimum_cart_value,
            maximum_discount_amount,
            status
        FROM
            coupon
    `

    return new Promise((resolve, reject) => {
        sql.query(query, (error, result, fields) => {
            if (error) return reject(error)
            return resolve(result)
        })
    })
}

exports.checkExistorNot = async (code) => {
    var query = `
        SELECT
            count(*) as coupon_count
        FROM
            coupon 
        WHERE
            coupon.code = "${code}" 
    `
    return new Promise((resolve, reject) => {
        sql.query(query, (error, result, fields) => {
            if (error) return reject(error)
            if (result[0]) return resolve(result[0])
            else return reject(false)
        })
    })
}


exports.create = async (obj) => {

    let id = uuidv4()

    var query = `
        INSERT INTO 
            coupon
        SET
            id = ?,
            name = ?,
            description = ?,
            code = ?,
            no_of_usage_for_all = ?, 
            valid_from = ?,
            valid_to = ?,
            type = ?,
            discount = ?,
            minimum_cart_value = ?,
            maximum_discount_amount = ?,
            status = ?
    `
    let params = [id, obj.name, obj.description, obj.code, obj.no_of_usage_for_all, obj.valid_from, obj.valid_to, obj.type, obj.discount, obj.minimum_cart_value, obj.maximum_discount_amount, obj.status]
    return new Promise((resolve, reject) => {
        sql.query(query, params, (error, result, fields) => {
            if (error) return reject(error)
            return resolve({ id: id })
        })
    })
}

exports.admin_view = async (voucher_id) => {
    var query = `
        SELECT
            *
        FROM
            coupon 
        WHERE
            coupon.id = "${voucher_id}" 
    `
    return new Promise((resolve, reject) => {
        sql.query(query, (error, result, fields) => {
            if (error) return reject(error)
            if (result[0]) return resolve(result[0])
            else return reject(false)
        })
    })
}
exports.update = async (obj) => {

    var query = `
        UPDATE
            coupon
        SET
            name = ?,
            description = ?,
            code = ?,
            no_of_usage_for_all = ?,
            valid_from = ?,
            valid_to = ?,
            type = ?,
            discount = ?,
            minimum_cart_value = ?,
            maximum_discount_amount = ?,
            status = ?
        WHERE id = ?
    `
    let params = [obj.name, obj.description, obj.code, obj.no_of_usage_for_all, obj.valid_from, obj.valid_to, obj.type, obj.discount, obj.minimum_cart_value, obj.maximum_discount_amount, obj.status, obj.voucher_id]

    return new Promise((resolve, reject) => {
        sql.query(query, params, (error, result, fields) => {
            if (error) return reject(error)
            return resolve(true)
        })
    })
}

exports.checkCodeExistInDateRange = async (code, today) => {

    var query = `
        SELECT
            count(*) as coupon_count
        FROM
            coupon 
        WHERE
            coupon.code = "${code}" &&  coupon.valid_from <= "${today}" && coupon.valid_to >= "${today}"
    `
    return new Promise((resolve, reject) => {
        sql.query(query, (error, result, fields) => {
            if (error) return reject(error)
            if (result[0]) return resolve(result[0])
            else return reject(false)
        })
    })
}

exports.checkCodeTotalUsage = async (code,) => {

    var query = `
        SELECT
            no_of_usage_for_all,
            total_usage,
            minimum_cart_value,
            maximum_discount_amount,
            type,
            discount
        FROM
            coupon 
        WHERE
            coupon.code = "${code}"  
    `
    return new Promise((resolve, reject) => {
        sql.query(query, (error, result, fields) => {
            if (error) return reject(error)
            if (result[0]) return resolve(result[0])
            else return reject(false)
        })
    })
}

exports.checkCartValue = async (code) => {

    var query = `
        SELECT
             as coupon_count
        FROM
            coupon 
        WHERE
            coupon.code = "${code}"
    `
    return new Promise((resolve, reject) => {
        sql.query(query, (error, result, fields) => {
            if (error) return reject(error)
            if (result[0]) return resolve(result[0])
            else return reject(false)
        })
    })
}

exports.updateCouponCode = async (couponCode, usdDiscount, inrDiscount, cartId) => {

    var query = `
        UPDATE
            sales_order
        SET
            coupon_code = ?,
            discount_inr = ?,
            discount_usd = ? 
        WHERE id = ?
    `
    let params = [couponCode, inrDiscount, usdDiscount, cartId]

    return new Promise((resolve, reject) => {
        sql.query(query, params, (error, result, fields) => {
            if (error) return reject(error)
            return resolve(true)
        })
    })
}

exports.updateCouponUsage = async (couponCode) => {
    var query = `
    UPDATE coupon
        SET total_usage = total_usage + 1 
        WHERE code = ?
    `
    let params = [couponCode]

    return new Promise((resolve, reject) => {
        sql.query(query, params, (error, result, fields) => {
            if (error) return reject(error)
            return resolve(true)
        })
    })
}

exports.removeAppliedCoupon = async (cartId) => {

    var query = `
        UPDATE
            sales_order
        SET
            coupon_code = "",
            discount_inr = 0,
            discount_usd =  0
        WHERE id = '${cartId}'
    `
    console.log(query)
    return new Promise((resolve, reject) => {
        sql.query(query, (error, result, fields) => {
            if (error) return reject(error)
            return resolve(true)
        })
    })
}

exports.removeTotalUsage = async (couponCode) => {
    var query = `
        UPDATE coupon
            SET total_usage = total_usage - 1 
        WHERE code = '${couponCode}'
    `

    return new Promise((resolve, reject) => {
        sql.query(query, (error, result, fields) => {
            if (error) return reject(error)
            return resolve(true)
        })
    })
}


