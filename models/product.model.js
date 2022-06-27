const sql = require("./db.js")
const { v4: uuidv4 } = require('uuid')

// defining table name
const tbl = "product"

/* ----
Purpose: To fetch list of products
Req: 
Res: array
---- */
exports.list = async (obj, internation_price) => {

    let ordCls = ""
    if (obj.sort_key === "price_low_to_high") ordCls = `ORDER BY actual_price ASC`
    if (obj.sort_key === "price_high_to_low") ordCls = `ORDER BY actual_price DESC`

    let wheCls = ""
    if (obj.filter_params.category) {
        wheCls += `AND`
        let categoryArr = obj.filter_params.category.split(",")
        categoryArr = categoryArr.filter(el => el !== "");
        wheCls += ` c.url_key IN("${categoryArr.join('","')}")`
    }

    if (obj.filter_params.price) {
        let actual_price_field = `(
                CASE
                    WHEN p.is_sale_price = "yes"
                        THEN p.sale_price
                    ELSE p.price
                END
            )`
        priceWhr = []
        let price_range_arr = obj.filter_params.price.split(",")
        price_range_arr = price_range_arr.filter(el => el !== "");
        price_range_arr.map(range => {
            let rangeArr = range.split("-")
            if (rangeArr[1] !== "above") {
                priceWhr.push(`${actual_price_field} BETWEEN ${rangeArr[0]} AND ${rangeArr[1]}`)
            } else {
                priceWhr.push(`${actual_price_field} >= ${rangeArr[0]}`)
            }
        })
        wheCls += ` AND (${priceWhr.join(" OR ")})`
    }

   
    let findInSetArr = []
    if (obj.attr_filter_params) {
        let keys = Object.keys(obj.attr_filter_params);
        keys.map((key, idx) => {
            findInSetArr[idx] = []
            let optionsStr = obj.attr_filter_params[key]
            let optionArr = []
            if (optionsStr) optionArr = optionsStr.split(",")
            optionArr.map(el => {
                findInSetArr[idx].push(`FIND_IN_SET("${key}=${el}", attr_option_data) > 0`)
            })
        })
    }
    let findInSetArr2 = []
    findInSetArr.map(item => {
        findInSetArr2.push(item && "(" + item.join(" OR ") + ")")
    })
    let findInSetArr3 = findInSetArr2 && findInSetArr2.join(" AND ")
    let havingCls = findInSetArr3 && `HAVING (${findInSetArr3})`



    let baseWhrCls = ''
    if (obj.search_query) {
        baseWhrCls = `p.name LIKE "%${obj.search_query}%"`
    } else {
        baseWhrCls = `c.hierarchy LIKE "${obj.category.id}/%"`
    }

    var query = `
        SELECT
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
            ) AS thumbnail,
            GROUP_CONCAT(a.attr_code,"=",ao.option_url_key) AS attr_option_data
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
        WHERE ${baseWhrCls}
            ${wheCls} 
            && p.status = 'enabled'
        GROUP BY
            p.id
        ${havingCls}
        ${ordCls}
        LIMIT ${obj.records}
        OFFSET ${obj.records * (obj.page - 1)}
    `

    return new Promise((resolve, reject) => {
        sql.query(query, (error, result, fields) => {
            if (error) return reject(error)
            return resolve(result)
        })
    })
}

/* ----
Purpose: To fetch total records
Req: 
Res: array
---- */
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
        WHERE c.url_key = "${obj.category_url_key}"
        GROUP BY
            p.id,
            pa.attribute_option_id
    `

    return new Promise((resolve, reject) => {
        sql.query(query, (error, result, fields) => {
            if (error) return reject(error);
            return resolve(result.length);
        })
    })
}


/* ----
Purpose: To fetch list of product for admin panel
Req: 
Res: array
---- */
exports.admin_list = async () => {
    var query = `
        SELECT
            id,
            name,
            url_key,
            type,
            price,
            is_sale_price,
            sale_price,
            is_exclusive,
            status
        FROM
            product
    `

    return new Promise((resolve, reject) => {
        sql.query(query, (error, result, fields) => {
            if (error) return reject(error)
            return resolve(result)
        })
    })
}

/* ----
Purpose: To get product details
Req: 
Res: 
---- */
exports.admin_view = async (product_id) => {
    var query = `
        SELECT
            p.id,
            p.type,
            p.status,
            p.name,
            p.url_key,
            p.price,
            p.is_sale_price,
            p.sale_price,
            p.attributes_for_variants,
            p.sku,
            COUNT(pv.id) AS variant_count,
            p.display_separate_product_by_attribute,
            p.attribute_for_separate_images,
            p.is_exclusive,
            p.short_description,
            p.tags,
            p.gst,
            p.stock
        FROM
            product p
        LEFT JOIN product_variant pv ON
            pv.product_id = p.id
        WHERE
            p.id = "${product_id}"
        GROUP BY
            pv.product_id
    `

    return new Promise((resolve, reject) => {
        sql.query(query, (error, result, fields) => {
            if (error) return reject(error)
            if (result[0]) return resolve(result[0])
            else return reject(false)
        })
    })
}

/* ----
Purpose: To get product images
Req: 
Res: 
---- */
exports.get_images = async (product_id, attribute_id, attribute_option_id, scope) => {

    let wheCls = ""
    let params = []

    if (scope === "single") {
        if (attribute_id && attribute_option_id) {
            whrCls = `WHERE product_id = ? AND attribute_id = ? AND attribute_option_id = ?`
            params = [product_id, attribute_id, attribute_option_id]
        } else {
            whrCls = `WHERE product_id = ? AND attribute_id IS NULL AND attribute_option_id IS NULL`
            params = [product_id]
        }
    } else {
        whrCls = `WHERE product_id = ?`
        params = [product_id]
    }


    var query = `
        SELECT
           id,
           image,
           is_thumbnail,
           attribute_id,
           attribute_option_id
        FROM
            product_image
        ${whrCls}
    `

    return new Promise((resolve, reject) => {
        sql.query(query, params, (error, result, fields) => {
            if (error) return reject(error)
            return resolve(result)
        })
    })
}

/* ----
Purpose: To create product
Req: obj
Res: bool
---- */
exports.create = async (obj) => {

    let id = uuidv4()

    var query = `
        INSERT INTO 
            product
        SET
            id = ?,
            name = ?,
            url_key = ?,
            type = ?,
            price = ?,
            is_sale_price = ?,
            sale_price = ?,
            gst = ?,
            status = ?
    `

    let params = [id, obj.name, obj.url_key, obj.type, obj.price, obj.is_sale_price, obj.sale_price,obj.gst, obj.status]


    return new Promise((resolve, reject) => {
        sql.query(query, params, (error, result, fields) => {
            if (error) return reject(error)
            return resolve({ id: id })
        })
    })
}

/* ----
Purpose: To update product
Req: obj
Res: bool
---- */
exports.update = async (obj) => {

    var query = `
        UPDATE
            product
        SET
            name = ?,
            url_key = ?,
            type = ?,
            price = ?,
            is_sale_price = ?,
            sale_price = ?,
            status = ?,
            is_exclusive = ?,
            sku = ?,
            short_description = ?,
            tags = ?,
            gst = ?,
            stock = ?
        WHERE id = ?
    `
    let params = [obj.name, obj.url_key, obj.type, obj.price, obj.is_sale_price,
    obj.sale_price, obj.status, obj.is_exclusive, obj.sku, obj.short_description, obj.tags,obj.gst, obj.stock,
    obj.product_id]


    return new Promise((resolve, reject) => {
        sql.query(query, params, (error, result, fields) => {
            if (error) return reject(error)
            return resolve(true)
        })
    })
}

/* ----
Purpose: To saveAttributeForVariants
Req: product_id,attributes
Res: bool
---- */
exports.saveAttributeForVariants = async (product_id, attributes) => {

    var query = `
        UPDATE
            product
        SET
            attributes_for_variants = ?,
            attribute_for_separate_images = ?,
            display_separate_product_by_attribute = ?
        WHERE id = ?
    `


    let params = [attributes.join(","), null, null, product_id]

    return new Promise((resolve, reject) => {
        sql.query(query, params, (error, result, fields) => {
            if (error) return reject(error)
            return resolve(true)
        })
    })
}


/* ----
Purpose: To create product variant
Req: product_id,price,stock
Res: obj
---- */
exports.create_variant = async (product_id, name, price, is_sale_price, sale_price, stock) => {

    let id = uuidv4()

    var query = `
        INSERT INTO 
            product_variant
        SET
            id = ?,
            product_id = ?,
            name = ?,
            price = ?,
            is_sale_price = ?,
            sale_price = ?,
            stock = ?
    `

    let params = [id, product_id, name, price, is_sale_price, sale_price, stock]


    return new Promise((resolve, reject) => {
        sql.query(query, params, (error, result, fields) => {
            if (error) return reject(error)
            return resolve({ id: id })
        })
    })
}

/* ----
Purpose: To save product variant attributes
Req: product_id, product_variant, attributes
Res: bool
---- */
exports.save_variant_attribute = async (product_id, product_variant, attributes) => {


    let toBeInsertedRows = ""
    attributes.map(obj => {
        toBeInsertedRows = (toBeInsertedRows) ? `${toBeInsertedRows}, ("${uuidv4()}", "${product_id}", "${product_variant.id}", "${obj.attr_id}", "${obj.option_id}")` : `("${uuidv4()}", "${product_id}", "${product_variant.id}", "${obj.attr_id}", "${obj.option_id}")`
    })

    var query = `
        INSERT INTO product_attribute (
            id, 
            product_id,
            product_variant_id,
            attribute_id,
            attribute_option_id
        )
        VALUES ${toBeInsertedRows}
    `


    return new Promise((resolve, reject) => {
        sql.query(query, (error, result, fields) => {
            if (error) return reject(error)
            return resolve(true)
        })
    })
}

/* ----
Purpose: To get product variant list
Req: product_id
Res: array
---- */
exports.variant_list = async (product_id) => {
    var query = `
        SELECT
            pv.id,
            pv.product_id,
            pv.name,
            pv.price,
            pv.is_sale_price,
            pv.sale_price,
            pv.stock,
            pa.attribute_id,
            pa.attribute_option_id,
            a.name AS attribute_name,
            a.type AS attribute_type,
            ao.option_value AS attribute_option_value
        FROM
            product_variant pv
        LEFT JOIN product_attribute pa
            ON pa.product_variant_id = pv.id
        LEFT JOIN attribute a
            ON a.id = pa.attribute_id
        LEFT JOIN attribute_option ao
            on ao.id = pa.attribute_option_id
        WHERE pv.product_id = "${product_id}"
    `

    return new Promise((resolve, reject) => {
        sql.query(query, (error, result, fields) => {
            if (error) return reject(error)
            return resolve(result)
        })
    })
}

/* ----
Purpose: To getProductVariantByAttributes
Req: product_id, attributes
Res: obj
---- */
exports.getProductVariantByAttributes = async (product_id, attributes) => {

    let having_cls = ""
    attribute_condition = "";
    attributes.map(obj => {
        attribute_condition =
            attribute_condition === ""
                ? `${attribute_condition}(Find_In_Set("${obj.option_id}", attribute_options) > 0)`
                : `${attribute_condition} AND (Find_In_Set("${obj.option_id}", attribute_options) > 0)`;
    })
    having_cls = `HAVING ${attribute_condition}`;

    var query = `
        SELECT
            pv.id,
            GROUP_CONCAT(pa.attribute_option_id) AS attribute_options
        FROM
            product_variant pv
        LEFT JOIN product_attribute pa ON
            pa.product_variant_id = pv.id
        WHERE
            pv.product_id = "${product_id}"
        GROUP BY
            pv.id
        ${having_cls}
    `

    return new Promise((resolve, reject) => {
        sql.query(query, (error, result, fields) => {
            if (error) return reject(error)
            if (result[0]) return resolve(result[0])
            else return resolve(null)
        })
    })
}

/* ----
Purpose: To save display_separate_product_by_attribute field of product
Req: product_id, attribute_id
Res: array
---- */
exports.save_sp_prod_data = async (product_id, attribute_id) => {
    var query = `
        UPDATE
            product
        SET
            display_separate_product_by_attribute =?
        WHERE id = ?
    `

    let params = [attribute_id, product_id]

    return new Promise((resolve, reject) => {
        sql.query(query, params, (error, result, fields) => {
            if (error) return reject(error)
            return resolve(true)
        })
    })
}

/* ----
Purpose: To save attribute_for_separate_images field of product
Req: product_id, attribute_id
Res: array
---- */
exports.save_sp_img_data = async (product_id, attribute_id) => {
    var query = `
        UPDATE
            product
        SET
            attribute_for_separate_images =?
        WHERE id = ?
    `

    let params = [attribute_id, product_id]

    return new Promise((resolve, reject) => {
        sql.query(query, params, (error, result, fields) => {
            if (error) return reject(error)
            return resolve(true)
        })
    })
}

/* ----
Purpose: To get_prod_img_count
Req: product_id
Res: 
---- */
exports.get_prod_img_count = async (product_id, attribute_id, attribute_option_id) => {

    let whrCls = ""
    let params = []
    if (attribute_id && attribute_option_id) {
        whrCls = `WHERE product_id = ? AND attribute_id = ? AND attribute_option_id = ?`
        params = [product_id, attribute_id, attribute_option_id]
    } else {
        whrCls = `WHERE product_id = ? AND attribute_id IS NULL AND attribute_option_id IS NULL`
        params = [product_id]
    }

    var query = `
        SELECT 
            COUNT(id) AS count
        FROM
            product_image
        ${whrCls}
    `

    return new Promise((resolve, reject) => {
        sql.query(query, params, (error, result, fields) => {
            if (error) return reject(error)
            if (result[0]) return resolve(result[0].count)
            else return resolve(0)
        })
    })
}

/* ----
Purpose: To save_prod_img
Req: product_id
Res: 
---- */
exports.save_prod_img = async (product_id, image, is_thumbnail, attribute_id, attribute_option_id) => {
    let id = uuidv4()

    var query = `
        INSERT INTO  
            product_image
        SET
            id = ?,
            product_id = ?,
            image = ?,
            is_thumbnail = ?,
            attribute_id = ?,
            attribute_option_id = ?
    `

    let params = [id, product_id, image, is_thumbnail, attribute_id, attribute_option_id]

    return new Promise((resolve, reject) => {
        sql.query(query, params, (error, result, fields) => {
            if (error) return reject(error)
            return resolve(true)
        })
    })
}


/* ----
Purpose: To del_prod_img
Req: 
Res: 
---- */
exports.del_prod_img = async (img_id) => {
    var query = `
        DELETE
            FROM
                product_image
            WHERE id = '${img_id}'
    `


    return new Promise((resolve, reject) => {
        sql.query(query, (error, result, fields) => {
            if (error) return reject(error)
            return resolve(true)
        })
    })
}

/* ----
Purpose: To mark_img_thumb
Req: 
Res: 
---- */
exports.mark_img_thumb = async (img_id, product_id, attribute_id, attribute_option_id) => {

    let whrCls = ""
    let params = []
    if (attribute_id && attribute_option_id) {
        whrCls = `WHERE product_id = ? AND attribute_id = ? AND attribute_option_id = ?`
        params = [product_id, attribute_id, attribute_option_id]
    } else {
        whrCls = `WHERE product_id = ? AND attribute_id IS NULL AND attribute_option_id  IS NULL`
        params = [product_id]
    }


    var query1 = `
        UPDATE 
            product_image
        SET
            is_thumbnail = 0
        ${whrCls}
    `

    var query2 = `
        UPDATE 
            product_image
        SET
            is_thumbnail = 1
        WHERE id = "${img_id}"
    `


    return new Promise((resolve, reject) => {
        sql.query(query1, params, (error, result, fields) => {
            if (error) return reject(error)

            sql.query(query2, (error, result, fields) => {
                if (error) return reject(error)
                return resolve(true)
            })
        })
    })
}


/* ----
Purpose: To get attribute data for seperate product
Req: product_id
Res: 
---- */
exports.get_attr_data_for_sp_img = async (product_id) => {
    var query = `
        SELECT
            DISTINCT (pa.attribute_id),
            pa.attribute_option_id,
            a.name,
            ao.option_value
        FROM
            product_attribute pa
        LEFT JOIN attribute a ON
            a.id = pa.attribute_id
        LEFT JOIN attribute_option ao ON
            ao.id = pa.attribute_option_id
        WHERE
            pa.product_id = "${product_id}" 
            AND pa.attribute_id =(
                SELECT
                    p.attribute_for_separate_images
                FROM
                    product p
                WHERE
                    p.id = "${product_id}"
                LIMIT 1
            )
    `


    return new Promise((resolve, reject) => {
        sql.query(query, (error, result, fields) => {
            if (error) return reject(error)
            return resolve(result)
        })
    })
}

/* ----
Purpose: To del_prod_var
Req: 
Res: 
---- */
exports.del_prod_var = async (product_id, product_variant_id) => {

    var query1 = `
       DELETE
            FROM
                product_variant
            WHERE id = '${product_variant_id}'
    `

    var query2 = `
        DELETE
            FROM
                product_attribute
            WHERE product_variant_id = '${product_variant_id}'
    `



    return new Promise((resolve, reject) => {
        sql.query(query1, (error, result, fields) => {
            if (error) return reject(error)

            sql.query(query2, (error, result, fields) => {
                if (error) return reject(error)
                return resolve(true)
            })
        })
    })
}

/* ----
Purpose: To update categories
Req: 
Res: 
---- */
exports.update_categories = async (product_id, categories) => {

    var query1 = `
        DELETE 
            FROM 
                product_category
        WHERE
            product_id = "${product_id}"
    `

    let toBeInsertedRows = ""
    categories.map(category_id => {
        toBeInsertedRows = (toBeInsertedRows) ? `${toBeInsertedRows}, ("${product_id}", "${category_id}")` : `("${product_id}", "${category_id}")`
    })

    var query2 = `
        INSERT INTO 
            product_category (
                product_id,
                category_id
        )
        VALUES ${toBeInsertedRows}
    `


    return new Promise((resolve, reject) => {
        sql.query(query1, (error, result, fields) => {
            if (error) return reject(error)

            if (toBeInsertedRows) {
                sql.query(query2, (error, result, fields) => {
                    if (error) return reject(error)
                    return resolve(true)
                })
            } else {
                return resolve(true)
            }
        })
    })
}


/* ----
Purpose: To get categries
Req: 
Res: 
---- */
exports.get_categories = async (product_id) => {
    var query = `
        SELECT
            category_id
        FROM 
            product_category
        WHERE product_id = '${product_id}'
    `

    return new Promise((resolve, reject) => {
        sql.query(query, (error, result, fields) => {
            if (error) return reject(error)
            return resolve(result)
        })
    })
}


/* ----
Purpose: To fetch list of NewArrivals products by Category
Req: 
Res: array
---- */
exports.getNewArrivalsByCategory = async (category, internation_price) => {
    var query = `
        SELECT
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
            p.price AS regular_price,
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
            ON (pa.product_variant_id = pv.id AND pa.attribute_id = p.display_separate_product_by_attribute)
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
        WHERE c.id = "${category.id}" AND p.created_at > now() - INTERVAL 20 day
        GROUP BY
            p.id,
            pa.attribute_option_id
        LIMIT 4
    `


    return new Promise((resolve, reject) => {
        sql.query(query, (error, result, fields) => {
            if (error) return reject(error)
            return resolve({ category: category, products: result })
        })
    })
}


/* ----
Purpose: To fetch list of Exclusive products by Category
Req: 
Res: array
---- */
exports.getExclusivesByCategory = async (category, internation_price) => {
    var query = `
        SELECT
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
            p.price AS regular_price,
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
            ON (pa.product_variant_id = pv.id AND pa.attribute_id = p.display_separate_product_by_attribute)
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
        WHERE c.id = "${category.id}" AND p.is_exclusive = "yes"
        GROUP BY
            p.id,
            pa.attribute_option_id
        LIMIT 4
    `

    return new Promise((resolve, reject) => {
        sql.query(query, (error, result, fields) => {
            if (error) return reject(error)
            return resolve({ category: category, products: result })
        })
    })
}


/* ----
Purpose: To fetch list of products with sales price by Category
Req: 
Res: array
---- */
exports.getOnSalePrdsByCategory = async (category) => {
    var query = `
        SELECT
            p.id,
            p.name,
            p.type,
            p.url_key,
            (
                CASE
                    WHEN p.is_sale_price = "yes"
                        THEN p.sale_price
                    ELSE p.price
                END
            ) AS actual_price,
            p.is_sale_price,
            p.price AS regular_price,
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
            ON (pa.product_variant_id = pv.id AND pa.attribute_id = p.display_separate_product_by_attribute)
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
        WHERE c.id = "${category.id}" AND p.is_sale_price = "yes"
        GROUP BY
            p.id,
            pa.attribute_option_id
        LIMIT 4
    `

    return new Promise((resolve, reject) => {
        sql.query(query, (error, result, fields) => {
            if (error) return reject(error)
            return resolve({ category: category, products: result })
        })
    })
}

/* ----
Purpose: To get product details by url_key
Req: url_key
Res: 
---- */
exports.detail = async (url_key, internation_price) => {
    var query = `
        SELECT
            p.id,
            p.type,
            p.status,
            p.name,
            p.url_key,
            p.stock,
            ROUND(p.price/${internation_price},2) AS price,
            p.is_sale_price,
            p.sale_price,
            p.sku,
            p.is_exclusive,
            p.short_description,
            p.tags,
            p.gst,
            p.attribute_for_separate_images
        FROM
            product p
        WHERE
            p.url_key = "${url_key}"
    `

    return new Promise((resolve, reject) => {
        sql.query(query, (error, result, fields) => {
            if (error) return reject(error)
            if (result[0]) return resolve(result[0])
            else return resolve(null)
        })
    })
}

/* ----
Purpose: To get product images by id
Req: product_id
Res: 
---- */
exports.prod_images = async (product_id) => {
    var query = `
        SELECT
            pi.id,
            pi.image,
            pi.is_thumbnail,
            pi.attribute_id,
            pi.attribute_option_id
        FROM
            product_image pi
        WHERE
            pi.product_id = '${product_id}'
    `

    return new Promise((resolve, reject) => {
        sql.query(query, (error, result, fields) => {
            if (error) return reject(error)
            return resolve(result)
        })
    })
}

/* ----
Purpose: To get product categories by id
Req: product_id
Res: 
---- */
exports.prod_cats = async (product_id) => {
    var query = `
        SELECT
            c.id,
            c.name,
            c.url_key
        FROM
            product_category pc
        LEFT JOIN category c ON
            c.id = pc.category_id
        WHERE
            pc.product_id = '${product_id}'
    `

    return new Promise((resolve, reject) => {
        sql.query(query, (error, result, fields) => {
            if (error) return reject(error)
            return resolve(result)
        })
    })
}

/* ----
Purpose: To create product description
Req: 
Res: 
---- */
exports.addDescription = async (product_id, title) => {

    let id = uuidv4()

    var query = `
        INSERT INTO 
            product_description
        SET
            id = ?,
            product_id = ?,
            title = ?
    `

    let params = [id, product_id, title]


    return new Promise((resolve, reject) => {
        sql.query(query, params, (error, result, fields) => {
            if (error) return reject(error)
            return resolve({ id: id })
        })
    })
}

/* ----
Purpose: To get product description list
Req: 
Res: 
---- */
exports.listDescription = async (product_id) => {

    var query = `
        SELECT
            id,
            title,
            content,
            sequence
        FROM
            product_description
        WHERE
            product_id = '${product_id}'
        ORDER BY sequence
    `

    return new Promise((resolve, reject) => {
        sql.query(query, (error, result, fields) => {
            if (error) return reject(error)
            return resolve(result)
        })
    })
}

/* ----
Purpose: To get  description 
Req: 
Res: 
---- */
exports.descriptionView = async (description_id) => {

    var query = `
        SELECT
            id,
            title,
            content,
            sequence
        FROM
            product_description
        WHERE
            id = '${description_id}'
    `

    return new Promise((resolve, reject) => {
        sql.query(query, (error, result, fields) => {
            if (error) return reject(error)
            if (result && result[0]) return resolve(result[0])
            else resolve(null)
        })
    })
}

/* ----
Purpose: To update product description
Req: 
Res: 
---- */
exports.updateDescription = async (description_id, title, content, sequence) => {

    let id = uuidv4()

    var query = `
        UPDATE 
            product_description
        SET
            title = ?,
            content = ?,
            sequence = ?
        WHERE id = ?
    `

    let params = [title, content, sequence, description_id]


    return new Promise((resolve, reject) => {
        sql.query(query, params, (error, result, fields) => {
            if (error) return reject(error)
            return resolve(true)
        })
    })
}

/* ----
Purpose: To get product attr data
Req: 
Res: 
---- */
exports.attr_data = async (product_id) => {

    var query = `
        SELECT
            DISTINCT(pa.attribute_option_id),
            a.id,
            a.name,
            a.attr_code,
            a.type,
            ao.id AS option_id,
            ao.option_value,
            ao.option_url_key,
            ao.color_code
        FROM
            product_attribute pa
        LEFT JOIN attribute a ON
            a.id = pa.attribute_id
        LEFT JOIN attribute_option ao ON
            ao.id = pa.attribute_option_id
        WHERE
            pa.product_id = '${product_id}'
        ORDER BY a.sequence
    `


    return new Promise((resolve, reject) => {
        sql.query(query, (error, result, fields) => {
            if (error) return reject(error)
            return resolve(result)
        })
    })
}

/* ----
Purpose: To add related product
Req: 
Res: 
---- */
exports.addRelProd = async (product_id, related_product_id) => {

    let id = uuidv4()

    var query = `
        INSERT INTO 
            related_product
        SET
            id = ?,
            product_id = ?,
            related_product_id = ?
    `

    let params = [id, product_id, related_product_id]


    return new Promise((resolve, reject) => {
        sql.query(query, params, (error, result, fields) => {
            if (error) return reject(error)
            return resolve(true)
        })
    })
}

/* ----
Purpose: To delete related product
Req: 
Res: 
---- */
exports.delRelProd = async (product_id, related_product_id) => {

    var query = `
         DELETE
            FROM
                related_product
            WHERE product_id = ? AND related_product_id = ?
    `

    let params = [product_id, related_product_id]


    return new Promise((resolve, reject) => {
        sql.query(query, params, (error, result, fields) => {
            if (error) return reject(error)
            return resolve(true)
        })
    })
}

/* ----
Purpose: To get list related product
Req: 
Res: 
---- */
exports.listRelProd = async (product_id) => {

    var query = `
         SELECT
            p.id,
            p.name
        FROM
            related_product rp
        LEFT JOIN product p ON
            p.id = rp.related_product_id
        WHERE
            rp.product_id = '${product_id}'
    `

    return new Promise((resolve, reject) => {
        sql.query(query, (error, result, fields) => {
            if (error) return reject(error)
            return resolve(result)
        })
    })
}


/* ----
Purpose: To get variant products
Req: 
Res: 
---- */
exports.variants = async (product_id) => {

    var query = `
        SELECT
            pv.id,
            pv.name,
            pv.price,
            pv.price,
            pv.is_sale_price,
            pv.sale_price,
            pv.stock,
            pa.attribute_id,
            pa.attribute_option_id
        FROM
            product_variant pv
        LEFT JOIN product_attribute pa ON
            pa.product_variant_id = pv.id
        WHERE
            pv.product_id = '${product_id}'
    `

    return new Promise((resolve, reject) => {
        sql.query(query, (error, result, fields) => {
            if (error) return reject(error)
            return resolve(result)
        })
    })
}


/* ----
Purpose: To fetch related products 
Req: 
Res: array
---- */
exports.relatedProds = async (product_id, internation_price) => {
    var query = `
        SELECT
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
            p.price AS regular_price,
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
            ON (pa.product_variant_id = pv.id AND pa.attribute_id = p.display_separate_product_by_attribute)
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
        WHERE p.id IN (
            SELECT rp.related_product_id FROM related_product rp WHERE rp.product_id = '${product_id}'
        )
        GROUP BY
            p.id,
            pa.attribute_option_id
        LIMIT 4
    `


    return new Promise((resolve, reject) => {
        sql.query(query, (error, result, fields) => {
            if (error) return reject(error)
            return resolve(result)
        })
    })
}

// Get Exclusive Products

/* ----
Purpose: To fetch list of Exclusive products by Category
Req: 
Res: array
---- */
exports.getExclusives = async (internation_price) => {
    var query = `
        SELECT
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
            p.price AS regular_price,
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
            ON (pa.product_variant_id = pv.id AND pa.attribute_id = p.display_separate_product_by_attribute)
        LEFT JOIN attribute a 
            ON a.id = pa.attribute_id
        LEFT JOIN attribute_option ao 
            ON ao.id = pa.attribute_option_id
        LEFT JOIN product_image pi
            ON (pi.product_id = p.id AND pi.is_thumbnail =1 AND pi.attribute_id IS NULL AND pi.attribute_option_id IS NULL)
        WHERE p.is_exclusive = "yes"
        GROUP BY
            p.id,
            pa.attribute_option_id
        LIMIT 4
    `

    return new Promise((resolve, reject) => {
        sql.query(query, (error, result, fields) => {
            if (error) return reject(error)
            return resolve({ products: result })
        })
    })
}