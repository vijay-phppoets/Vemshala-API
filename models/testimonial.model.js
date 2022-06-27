const sql = require("./db.js")
const { v4: uuidv4 } = require('uuid')

// defining table name
const tbl = "testimonial"

/* ----
Purpose: To save home page testimonial
Req: 
Res: 
---- */
exports.save = async (description, image, name, title, sequence) => {

    let id = uuidv4()

    var query = `
        INSERT INTO
            ${tbl}
        SET
            id = "${id}",
            description = "${description}",
            image = "${image}",
            name = "${name}",
            title = "${title}",
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
Purpose: To fetch testimonial
Req: 
Res: 
---- */
exports.list = async () => {

    var query = `
        SELECT
            id,
            description,
            image,
            name,
            title,
            sequence
        FROM
            ${tbl}
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
Purpose: To delete testimonial
Req: id
Res: 
---- */
exports.delete = async (id) => {

    var query = `
        DELETE
            FROM
                ${tbl}
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
Purpose: To fetch testimonial info by id
Req: id
Res: array
---- */
exports.detail_by_id = async (id) => {
    var query = `
        SELECT
            id,
            description,
            image,
            name,
            title,
            sequence
        FROM
            ${tbl}
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