const sql = require("./db.js")
const { v4: uuidv4 } = require('uuid')

// defining table name
const tbl = "home_page_slider"

/* ----
Purpose: To save home page slider images
Req: images
Res: 
---- */
exports.save = async (banner_img, m_banner_img, sequence) => {

    let id = uuidv4()

    var query = `
        INSERT INTO
            home_page_slider
        SET
            id = "${id}",
            image = "${banner_img}",
            m_image = "${m_banner_img}",
            sequence = ${sequence}
    `


    return new Promise((resolve, reject) => {
        sql.query(query, (error, result, fields) => {
            if (error) return reject(error)
            return resolve(true)
        })
    })
}

/* ----
Purpose: To fetch slider list
Req: images
Res: 
---- */
exports.list = async () => {

    var query = `
        SELECT
            id,
            image,
            m_image,
            sequence
        FROM
            home_page_slider
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
Purpose: To delete slider
Req: id
Res: 
---- */
exports.delete = async (id) => {

    var query = `
        DELETE
            FROM
                home_page_slider
            WHERE id = '${id}'
    `

    return new Promise((resolve, reject) => {
        sql.query(query, (error, result, fields) => {
            if (error) return reject(error)
            return resolve(true)
        })
    })
}


/* ----
Purpose: To fetch slider info by id
Req: id
Res: array
---- */
exports.detail_by_id = async (id) => {
    var query = `
        SELECT
            id,
            image,
            m_image,
            sequence
        FROM
            home_page_slider
        WHERE id = '${id}'
    `

    return new Promise((resolve, reject) => {
        sql.query(query, (error, result, fields) => {
            if (error) return reject(error)
            if (result[0]) return resolve(result[0])
            else return resolve(null)
        })
    })
}