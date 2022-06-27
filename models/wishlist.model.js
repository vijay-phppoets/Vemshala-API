const sql = require("./db.js")
const { v4: uuidv4 } = require('uuid')

// defining table name
const tbl = "wishlist"


exports.create = async (obj) => {
    let id = uuidv4()

    var query = `
        INSERT INTO 
            wishlist
        SET
            id = ?,
            customer_id = ?,
            product_id = ?
    `

    let params = [id, obj.customer_id, obj.product_id]
    return new Promise((resolve, reject) => {
        sql.query(query, params, (error, result, fields) => {
            if (error) return reject(error)
            return resolve({ id: id })
        })
    })
}

exports.isWishlisted = async (obj) => {

    var query = `
        SELECT  
            id
        FROM
            wishlist
        WHERE 
            customer_id = ? AND 
            product_id = ?
    `
    let params = [obj.customer_id, obj.product_id]
    return new Promise((resolve, reject) => {
        sql.query(query, params, (error, result, fields) => {
            if (error) return reject(error)
            if (result && result[0]) return resolve(true)
            else return resolve(false)
        })
    })
}

exports.list = async (obj, internation_price) => {

    var query = `
        SELECT
            w.id as wishlist_id,
            p.id,
            p.name,
            p.type,
            p.url_key,
            ROUND((
                CASE
                    WHEN p.is_sale_price = "yes"
                        THEN p.sale_price
                    ELSE p.price
                END
            )/${internation_price},2) AS actual_price,
            p.is_sale_price,
            ROUND(p.price/${internation_price},2) AS regular_price,
            (
                CASE
                    WHEN p.is_sale_price = "yes"
                        THEN ROUND((p.price-p.sale_price)/p.price*100)
                    ELSE 0
                END
            ) AS discount,
            (
                CASE 
                    WHEN pi.image IS NULL THEN 'default-product.png' 
                    ELSE pi.image
                END
            ) AS thumbnail
        FROM
            product p
        LEFT JOIN product_variant pv 
            ON p.id = pv.product_id
        LEFT JOIN product_attribute pa 
            ON (pa.product_variant_id = pv.id)
        LEFT JOIN attribute a 
            ON a.id = pa.attribute_id
        LEFT JOIN attribute_option ao 
            ON ao.id = pa.attribute_option_id
        LEFT JOIN product_image pi
            ON (pi.product_id = p.id AND pi.is_thumbnail =1 AND pi.attribute_id IS NULL AND pi.attribute_option_id IS NULL)
        LEFT JOIN product_category pc
	        ON pc.product_id = p.id
        LEFT JOIN category c
            ON c.id = pc.category_id
            
        INNER JOIN  wishlist w
            ON w.product_id = p.id
        WHERE w.customer_id = "${obj.customerId}"
        GROUP BY w.product_id
    `

    //,    GROUP_CONCAT(a.attr_code,"=",ao.option_url_key) AS attr_option_data
     
    return new Promise((resolve, reject) => {
        sql.query(query, (error, result, fields) => {
            if (error) return reject(error)
            return resolve(result)
        })
    })
}

exports.count = async (obj) => {
    var query = `
        SELECT
            p.id,
            GROUP_CONCAT(
                IF(p.type = 'variant', ao.id, '') SEPARATOR ','
            ) AS variant_options,
            GROUP_CONCAT(pa.attribute_option_id) AS attributes
        FROM
            product p
        LEFT JOIN product_variant pv 
            ON p.id = pv.product_id
        LEFT JOIN product_attribute pa 
            ON (pa.product_variant_id = pv.id AND pa.attribute_id = p.display_separate_product_by_attribute)
        LEFT JOIN attribute a 
            ON a.id = pa.attribute_id
        LEFT JOIN attribute_option ao 
            ON ao.id = pa.attribute_option_id
        LEFT JOIN product_category pc
	        ON pc.product_id = p.id
        LEFT JOIN category c
            ON c.id = pc.category_id
        INNER JOIN wishlist w 
            ON w.product_id = p.id
        WHERE w.customer_id= "${obj.customerId}"
        GROUP BY
            p.id
    `
    return new Promise((resolve, reject) => {
        sql.query(query, (error, result, fields) => {
            if (error) return reject(error);
            return resolve(result.length);
        })
    })
}

exports.remove = async (obj) => {

    var query = `
        DELETE FROM 
            wishlist
        WHERE
            id = ?
    `
    let params = [obj.wishlist_id]
    return new Promise((resolve, reject) => {
        sql.query(query, params, (error, result, fields) => {
            if (error) return reject(error)
            return resolve(true)
        })
    })
}