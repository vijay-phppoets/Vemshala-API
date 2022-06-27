const sql = require("./db.js")
const { v4: uuidv4 } = require('uuid')
const { round } = require("lodash")
const Setting = require('../models/setting.model')
const _ = require('lodash');
// defining table name
const tbl = "sales_order"

/* ----
Purpose: To create an empty cart
Req: customer_id (optional)
Res: 
---- */
exports.createEmptyCart = async (customer_id) => {
    let id = uuidv4()

    var query = `
        INSERT INTO 
            sales_order
        SET
            id = ?,
            status = ?
    `

    let params = [id, 'cart']


    return new Promise((resolve, reject) => {
        sql.query(query, params, (error, result, fields) => {
            if (error) return reject(error)
            return resolve({ id: id })
        })
    })
}

/* ----
Purpose: To get cart details rows
Req: cart_id
Res: 
---- */
exports.getCartDetailRows = async (cart_id) => {
    var query = `
        SELECT
            so.id,
            soi.id AS soi_id,
            soi.product_id,
            soi.quantity
        FROM
            sales_order so
        LEFT JOIN sales_order_item soi ON
            so.id = soi.sales_order_id
        WHERE
            so.id = "${cart_id}"
    `


    return new Promise((resolve, reject) => {
        sql.query(query, (error, result, fields) => {
            if (error) return reject(error)
            return resolve(result)
        })
    })
}

exports.getCartDetail = async (cart_id) => {
    let rows = await this.getCartDetailRows(cart_id)
    let cart = { items: [] }

    rows.map(row => {
        cart.id = row.id
        cart.items.push({
            soi_id: row.soi_id,
            product_id: row.product_id,
            quantity: row.quantity,
        })
    })
    return new Promise((resolve, reject) => {
        return resolve(cart)
    })
}
exports.cartCount = async (cart_id) => {
    var query = `
        SELECT
            COUNT(id) AS count
        FROM
            sales_order_item
        WHERE
            sales_order_id = "${cart_id}"
    `

    return new Promise((resolve, reject) => {
        sql.query(query, (error, result, fields) => {
            if (error) return reject(error)
            if (result && result[0]) resolve(result[0].count)
            return resolve(null)
        })
    })
}
exports.websiteViewRows = async (cart_id, internation_price) => {
    var query = `
        SELECT
            so.id,
            so.discount_inr,
            so.discount_usd,
            so.coupon_code,
            so.payment_type,
            so.s_country,
            soi.id AS soi_id,
            soi.quantity,
            p.id as product_id,
            p.name,
            p.url_key,
            ROUND((
                CASE
                    WHEN p.is_sale_price = "yes"
                        THEN p.sale_price
                    ELSE p.price
                END
            )/${internation_price},2) AS actual_price,

            p.is_sale_price,
            ROUND(p.price/${internation_price},2)  AS regular_price,
            (
                CASE WHEN p.is_sale_price = "yes" 
                    THEN ROUND((p.price - p.sale_price) / p.price * 100) 
                    ELSE 0
                END
            ) AS discount,
            (
                CASE WHEN PI.image IS NULL THEN 'default-product.png' ELSE PI.image
                END
            ) AS thumbnail
        FROM
            sales_order so
        LEFT JOIN sales_order_item soi ON
            soi.sales_order_id = so.id
        LEFT JOIN product p ON
            p.id = soi.product_id
        LEFT JOIN product_image PI ON
            (
                PI.product_id = p.id AND PI.is_thumbnail = 1 AND PI.attribute_id IS NULL AND PI.attribute_option_id IS NULL
            )
        WHERE
            so.id = "${cart_id}" AND soi.id IS NOT NULL
        ORDER BY soi.created_at ASC
    `
    return new Promise((resolve, reject) => {
        sql.query(query, (error, result, fields) => {
            if (error) return reject(error)
            return resolve(result)
        })
    })
}
exports.websiteView = async (cart_id, internation_price, currencyType) => {
    let rows = await this.websiteViewRows(cart_id, internation_price)
    let cart = { items: [], subTotal: 0, shipping: 0, discount: 0, total: 0, shippingData: "", grandTotal: 0, couponCode: "" }

    let subTotal = 0;
    let cartDiscount = 0;
    rows.map(row => {
        cart.id = row.id
        if (currencyType === "USD") {
            cartDiscount = row.discount_usd;
        }
        else {
            cartDiscount = row.discount_inr;
        }
        cart.couponCode = row.coupon_code;
        cart.items.push({
            soi_id: row.soi_id,
            product_id: row.product_id,
            quantity: row.quantity,
            p_name: row.name,
            p_url_key: row.url_key,
            p_actual_price: round(row.actual_price * row.quantity, 2),
            p_regular_price: row.regular_price * row.quantity,
            p_is_sale_price: row.is_sale_price,
            p_discount: row.discount,
            p_thumbnail: row.thumbnail
        })

        subTotal += (row.actual_price * row.quantity)
    })
    cart.discount = cartDiscount;
    cart.subTotal = round(subTotal, 2);
    cart.total = round(subTotal - cartDiscount, 2);
    // Checking Shipping Amount 
    let settingData = await Setting.getData();
    let row = rows[rows.length -1]
    if (row  && row.s_country === "India")  {
        let cart_subTotal = cart.subTotal
        let CartValueData = _.find(settingData, { 'meta_key': "minimun_cart_value" });
        let minimun_cart_value = CartValueData.meta_value;
        if (currencyType == "USD"){
            cart_subTotal = cart.subTotal * _.find(settingData, { 'meta_key': "international_price" });
            // minimun_cart_value = minimun_cart_value *_.find(settingData, { 'meta_key': "international_price" });
        }
        
        let shipping_charge = "";
        if (cart_subTotal < minimun_cart_value) {
            let ShippingChargeData = _.find(settingData, { 'meta_key': "shipping_charge" });
            shipping_charge = ShippingChargeData.meta_value;
            cart.grandTotal = round((parseInt(cart.subTotal) + parseInt(shipping_charge)) - cartDiscount, 2);
            cart.shipping = round(shipping_charge, 2);
        }
        else{
            cart.grandTotal = round((parseInt(cart.subTotal)) - cartDiscount, 2);
        }
        let shippingDetails = {
            "minimun_cart_value": minimun_cart_value,
            "shipping_charge": shipping_charge,
        }
        cart.shippingData = JSON.stringify(shippingDetails);
    }
    else{
        let InShippingData = _.find(settingData, { 'meta_key': "international_shipping" });
        let international_shipping = InShippingData.meta_value;
        let cartCount = await this.cartCount(cart_id);
        let shipping = (cartCount + 1) * international_shipping;
        cart.grandTotal = round(parseInt(cart.subTotal) + parseInt(shipping) - cartDiscount, 2);
        cart.shipping = round(shipping, 2);
        let shippingDetails = {
            "international_shipping": international_shipping,
        }
        cart.shippingData = JSON.stringify(shippingDetails);
    }
    // Checking Shipping Amount
   
    return new Promise((resolve, reject) => {
        return resolve(cart)
    })
}

exports.updateBillingAddress = async (obj) => {
    var query = `
        UPDATE
            sales_order
        SET
            b_fname = "${obj.fname}",
            b_lname = "${obj.lname}",
            b_company_name = "${obj.company}",
            b_country = "${obj.country}",
            b_state = "${obj.state}",
            b_city = "${obj.city}",
            b_street = "${obj.street}",
            b_landmark = "${obj.landmark}",
            b_zip_code = "${obj.zip_code}",
            b_phone = "${obj.phone}"
        WHERE
            id = "${obj.cart_id}"
    `

    return new Promise((resolve, reject) => {
        sql.query(query, (error, result, fields) => {
            if (error) return reject(error)
            return resolve(true)
        })
    })
}
exports.updateShippingAddress = async (obj) => {
    var query = `
        UPDATE
            sales_order
        SET
            s_fname = "${obj.fname}",
            s_lname = "${obj.lname}",
            s_company_name = "${obj.company}",
            s_country = "${obj.country}",
            s_state = "${obj.state}",
            s_city = "${obj.city}",
            s_street = "${obj.street}",
            s_landmark = "${obj.landmark}",
            s_zip_code = "${obj.zip_code}",
            s_phone = "${obj.phone}",
            same_as_billing = "${obj.same_as_billing}"
        WHERE
            id = "${obj.cart_id}"`

    return new Promise((resolve, reject) => {
        sql.query(query, (error, result, fields) => {
            if (error) return reject(error)
            return resolve(true)
        })
    })
}
exports.updateCustomer = async (customer_id, cart_id) => {
    var query = `
        UPDATE
            sales_order
        SET
            customer_id = "${customer_id}"
        WHERE
            id = "${cart_id}"
    `

    return new Promise((resolve, reject) => {
        sql.query(query, (error, result, fields) => {
            if (error) return reject(error)
            return resolve(true)
        })
    })
}
exports.getCartBillingDetail = async (cart_id) => {
    var query = `
        SELECT
            id,
            b_fname,
            b_lname,
            b_email,
            b_phone
        FROM
            sales_order
        WHERE
            id = "${cart_id}"
    `
    return new Promise((resolve, reject) => {
        sql.query(query, (error, result, fields) => {
            if (error) return reject(error)
            if (result && result[0]) return resolve(result[0])
            return resolve(null)
        })
    })
}
exports.updateRzpOrderId = async (cart_id, rzp_order_id, currencyType) => {
    var query = `
        UPDATE
            sales_order
        SET
            rzp_order_id = "${rzp_order_id}",
            payment_type = "${currencyType}"
        WHERE id = "${cart_id}"
    `
    return new Promise((resolve, reject) => {
        sql.query(query, (error, result, fields) => {
            if (error) return reject(error)
            return resolve(true)
        })
    })
}
exports.getCartIdByRzpOrderId = async (rzp_order_id) => {
    var query = `
        SELECT
            id
        FROM
            sales_order
        WHERE rzp_order_id = "${rzp_order_id}"
    `
    return new Promise((resolve, reject) => {
        sql.query(query, (error, result, fields) => {
            if (error) return reject(error)
            if (result && result[0]) return resolve(result[0])
            return resolve(null)
        })
    })
}
exports.getNewOrderNo = async () => {
    var query = `
        SELECT MAX(order_no) AS last_order_no FROM sales_order
    `
    return new Promise((resolve, reject) => {
        sql.query(query, (error, result, fields) => {
            if (error) return reject(error)
            if (result && result[0]) return resolve(result[0].last_order_no + 1)
            return resolve(1)
        })
    })
}
exports.placeOrder = async (rzp_order_id, type = 'online', cart_id, internation_price, currencyType) => {
    if (type === 'online') {
        let cart = await this.getCartIdByRzpOrderId(rzp_order_id)
        cart_id = cart.id
    }

    let cartDetails = await this.websiteView(cart_id, internation_price)
    let ORDER_NO = await this.getNewOrderNo()
    let shippingData = cartDetails.shippingData;
    var query = `
        UPDATE
            sales_order
        SET
            status = "processing",
            payment_mode = "${type}",
            sub_total = ${cartDetails.subTotal},
            shipping_charge = ${cartDetails.shipping},
            shipping_formula = "${encodeURIComponent(shippingData)}",
            total = ${cartDetails.total},
            order_no = ${ORDER_NO},
            order_date = NOW(),
            payment_type = "${currencyType}"
        WHERE id = "${cart_id}"
    `

    return new Promise((resolve, reject) => {
        sql.query(query, (error, result, fields) => {
            if (error) return reject(error)

            return resolve(true)
        })
    })
}
exports.list = async (customer_id) => {
    var query = `
        SELECT 
            id,
            order_no,
            order_date,
            status,
            payment_mode,
            sub_total,
            total
        FROM sales_order
        WHERE customer_id = "${customer_id}" 
    `
    return new Promise((resolve, reject) => {
        sql.query(query, (error, result, fields) => {
            if (error) return reject(error)
            resolve(result)
        })
    })
}
exports.detail = async (customer_id, order_id) => {
    var query = `
        SELECT
            so.id,
            so.order_no,
            so.order_date,
            so.b_fname,
            so.b_lname,
            so.b_company_name,
            so.b_country,
            so.b_state,
            so.b_city,
            so.b_street,
            so.b_landmark,
            so.b_zip_code,
            so.b_phone,
            so.b_email,
            so.s_fname,
            so.s_lname,
            so.s_company_name,
            so.s_country,
            so.s_state,
            so.s_city,
            so.s_street,
            so.s_landmark,
            so.s_zip_code,
            so.s_phone,
            so.s_email,
            so.status,
            so.payment_mode,
            so.sub_total,
            so.total as grand_total,
            so.shipping_charge as shipping_charge,
            so.discount_usd as discount_usd,
            so.payment_type as payment_type,
            so.discount_inr as discount_inr,
            p.name,
            (
                CASE WHEN PI.image IS NULL THEN 'default-product.png' ELSE PI.image
                END
            ) AS thumbnail,
            soi.product_id,
            soi.quantity,
            soi.price,
            soi.total
        FROM
            sales_order so
        LEFT JOIN sales_order_item soi ON
            so.id = soi.sales_order_id
        LEFT JOIN product p ON
            p.id = soi.product_id
        LEFT JOIN product_image PI ON
            (
                PI.product_id = p.id AND PI.is_thumbnail = 1 AND PI.attribute_id IS NULL AND PI.attribute_option_id IS NULL
            )
        WHERE
            so.id = '${order_id}' AND so.customer_id = '${customer_id}'
    `
    return new Promise((resolve, reject) => {
        sql.query(query, (error, result, fields) => {
            if (error) return reject(error)
            resolve(result)
        })
    })
}

exports.orderDetail = async (order_id) => {
    var query = `
        SELECT
            so.id,
            so.order_no,
            so.order_date,
            so.shipping_charge, 
            so.payment_type, 
            so.coupon_code,
            so.b_fname,
            so.b_lname,
            so.b_company_name,
            so.b_country,
            so.b_state,
            so.b_city,
            so.b_street,
            so.b_landmark,
            so.b_zip_code,
            so.b_phone,
            so.b_email,
            so.s_fname,
            so.s_lname,
            so.s_company_name,
            so.s_country,
            so.s_state,
            so.s_city,
            so.s_street,
            so.s_landmark,
            so.s_zip_code,
            so.s_phone,
            so.s_email,
            so.status,
            so.payment_mode,
            so.sub_total,
            so.total as grand_total,
            so.discount_inr,
            so.discount_usd,
            p.name,
            (
                CASE WHEN PI.image IS NULL THEN 'default-product.png' ELSE PI.image
                END
            ) AS thumbnail,
            soi.product_id,
            soi.quantity,
            soi.price,
            soi.total
        FROM
            sales_order so
        LEFT JOIN sales_order_item soi ON
            so.id = soi.sales_order_id
        LEFT JOIN product p ON
            p.id = soi.product_id
        LEFT JOIN product_image PI ON
            (
                PI.product_id = p.id AND PI.is_thumbnail = 1 AND PI.attribute_id IS NULL AND PI.attribute_option_id IS NULL
            )
        WHERE
            so.id = '${order_id}'
    `
    return new Promise((resolve, reject) => {
        sql.query(query, (error, result, fields) => {
            if (error) return reject(error)
            resolve(result)
        })
    })
}

exports.getProductDetails = async (productId) => {
    var query = `
        SELECT 
            price
        FROM product
        WHERE id = "${productId}" 
    `
    return new Promise((resolve, reject) => {
        sql.query(query, (error, result, fields) => {
            if (error) return reject(error)
            if (result && result[0]) return resolve(result[0])
            resolve(result)
        })
    })
}

exports.updateSOIdetails = async (soi_id, price, total) => {
    var query = `
        UPDATE
            sales_order_item
        SET
            price = "${price}",
            total = "${total}"
        WHERE
            id = "${soi_id}"
    `

    return new Promise((resolve, reject) => {
        sql.query(query, (error, result, fields) => {
            if (error) return reject(error)
            resolve(result)
        })
    })
}
// Admin
exports.adminList = async () => {
    var query = `
        SELECT 
            id,
            order_no,
            order_date,
            status,
            payment_mode,
            payment_type,
            sub_total,
            total,
            s_fname,
            s_lname,
            order_no,
            s_phone,
            s_email
        FROM sales_order
        WHERE status != "cart"
    `
    return new Promise((resolve, reject) => {
        sql.query(query, (error, result, fields) => {
            if (error) return reject(error)
            resolve(result)
        })
    })
}

exports.updateOrder = async (order_id, status) => {
    var query = `
        UPDATE
            sales_order
        SET
            status = "${status}" 
        WHERE
            id = "${order_id}"
    `

    return new Promise((resolve, reject) => {
        sql.query(query, (error, result, fields) => {
            if (error) return reject(error)
            resolve(result)
        })
    })
}