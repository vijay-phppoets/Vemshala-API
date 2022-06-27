const sql = require("./db.js")
const { v4: uuidv4 } = require('uuid')

// defining table name
const tbl = "category"

/* ----
Purpose: To fetch category info
Req: category_url_key
Res: array
---- */
exports.details = async (category_url_key) => {
    var query = `
        SELECT
            id,
            name,
            banner_img,
            m_banner_img
        FROM
            category
        WHERE url_key = '${category_url_key}'
    `

    return new Promise((resolve, reject) => {
        sql.query(query, (error, result, fields) => {
            if (error) return reject(error)
            if (result && result[0]) return resolve(result[0])
            return reject(false)
        })
    })
}


/* ----
Purpose: To fetch sub categories (children) of category by category_url_key
Req: category_url_key
Res: array
---- */
exports.children = async (category_url_key) => {
    var query = `
        SELECT
            c.id,
            c.name,
            c.url_key,
            c.image
        FROM
            category c
        WHERE
            parent_category_id =(
                SELECT
                    id
                FROM
                    category c2
                WHERE
                    url_key = '${category_url_key}'
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
Purpose: To fetch category flatList
Req: category_url_key
Res: array
---- */
exports.flatList = async (only_parent = false) => {

    let whrCls = ""
    if (only_parent) {
        whrCls = `WHERE parent_category_id IS NULL`
    }
    var query = `
        SELECT
            id,
            name,
            url_key,
            image,
            banner_img,
            m_banner_img,
            parent_category_id,
            hierarchy
        FROM
            category
        ${whrCls}
    `


    return new Promise((resolve, reject) => {
        sql.query(query, (error, result, fields) => {
            if (error) return reject(error)
            return resolve(result)
        })
    })
}

/* ----
Purpose: To fetch category info by id
Req: id
Res: array
---- */
exports.detail_by_id = async (category_id) => {
    var query = `
        SELECT
            id,
            name,
            url_key,
            image,
            banner_img,
            m_banner_img,
            parent_category_id,
            hierarchy
        FROM
            category
        WHERE id = '${category_id}'
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
Purpose: To fetch category info by url_key
Req: id
Res: array
---- */
exports.detail_by_url_key = async (url_key) => {
    var query = `
        SELECT
            id,
            name,
            url_key,
            image,
            banner_img,
            m_banner_img,
            parent_category_id,
            hierarchy
        FROM
            category
        WHERE url_key = '${url_key}'
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
Purpose: To create category
Req: obj, parent_category_obj
Res: bool
---- */
exports.create = async (obj, parent_category) => {

    let id = uuidv4()

    let hierarchy = ''
    if (parent_category) hierarchy = `${parent_category.hierarchy}/${id}`
    else hierarchy = id


    var query = `
        INSERT INTO 
            category
        SET
            id = ?,
            name = ?,
            url_key = ?,
            image = ?,
            banner_img = ?,
            m_banner_img = ?,
            parent_category_id = ?,
            hierarchy = ?
    `

    let params = [id, obj.name, obj.url_key, obj.image, obj.banner_img, obj.m_banner_img, obj.parent_category_id, hierarchy]


    return new Promise((resolve, reject) => {
        sql.query(query, params, (error, result, fields) => {
            if (error) return reject(error)
            return resolve({ id: id })
        })
    })
}

/* ----
Purpose: To update category
Req: obj, parent_category_obj
Res: bool
---- */
exports.update = async (obj, parent_category) => {

    let id = obj.category_id

    let hierarchy = ''
    if (parent_category) hierarchy = `${parent_category.hierarchy}/${id}`
    else hierarchy = id

    let parent_category_id = null
    if (obj.parent_category_id) parent_category_id = obj.parent_category_id

    /* var query = `
        UPDATE 
            category
        SET
            name = '${obj.name}',
            url_key = '${obj.url_key}',
            image = '${obj.image}',
            banner_img = '${obj.banner_img}',
            m_banner_img = '${obj.m_banner_img}',
            parent_category_id = '${parent_category_id}',
            hierarchy = '${hierarchy}'
        WHERE id = '${id}'
    ` */

    var query = `
        UPDATE 
            category
        SET
            name = ?,
            url_key = ?,
            image = ?,
            banner_img = ?,
            m_banner_img = ?,
            parent_category_id = ?,
            hierarchy = ?
        WHERE id = ?
    `
    let params = [obj.name, obj.url_key, obj.image, obj.banner_img, obj.m_banner_img, parent_category_id, hierarchy, id]

    return new Promise((resolve, reject) => {
        sql.query(query, params, (error, result, fields) => {
            if (error) return reject(error)
            return resolve({ id: id })
        })
    })
}

/* ----
Purpose: To fetch category children by id
Req: id
Res: array
---- */
exports.get_children = async (category) => {
    var query = `
        SELECT
            id,
            name,
            url_key,
            image,
            banner_img,
            m_banner_img,
            parent_category_id,
            hierarchy
        FROM
            category
        WHERE hierarchy LIKE '${category.hierarchy}/%'
    `

    return new Promise((resolve, reject) => {
        sql.query(query, (error, result, fields) => {
            if (error) return reject(error)
            return resolve(result)
        })
    })
}

/* ----
Purpose: To delete category
Req: id
Res: 
---- */
exports.delete = async (category_id) => {
    var query = `
        DELETE
            FROM
                category
            WHERE id = '${category_id}'
    `

    return new Promise((resolve, reject) => {
        sql.query(query, (error, result, fields) => {
            if (error) return reject(error)
            return resolve(true)
        })
    })
}