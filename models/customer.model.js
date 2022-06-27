const sql = require("./db.js")
const { v4: uuidv4 } = require('uuid')

// defining table name
const tbl = "customer"


exports.create = async (obj) => {
    let id = uuidv4()

    var query = `
        INSERT INTO 
            customer
        SET
            id = ?,
            name = ?,
            email = ?,
            password = ?,
            signup_method = ?,
            id_token = ?
    `

    let params = [id, obj.name, obj.email, obj.password, obj.signup_method, obj.id_token]


    return new Promise((resolve, reject) => {
        sql.query(query, params, (error, result, fields) => {
            if (error) return reject(error)
            return resolve({ id: id })
        })
    })
}

exports.getCustomer = async (customer_id) => {

    var query = `
        SELECT 
            id,
            name,
            signup_method,
            email
        FROM customer
        WHERE id = "${customer_id}"
    `

    return new Promise((resolve, reject) => {
        sql.query(query, (error, result, fields) => {
            if (error) return reject(error)
            if (result && result[0]) return resolve(result[0])
            return resolve(null)
        })
    })
}

exports.getCustomerByEmail = async (email) => {

    var query = `
        SELECT 
            id,
            name,
            signup_method,
            email,
            password
        FROM customer
        WHERE 
            email = "${email}"
    `

    return new Promise((resolve, reject) => {
        sql.query(query, (error, result, fields) => {
            if (error) return reject(error)
            if (result && result[0]) return resolve(result[0])
            return resolve(null)
        })
    })
}

exports.getCustomerList = async () => {

    var query = `
        SELECT 
            id,
            name,
            email,
            created_at
        FROM customer
    `
    return new Promise((resolve, reject) => {
        sql.query(query, (error, result, fields) => {
            if (error) return reject(error)
            resolve(result)
        })
    })
}


exports.checkCustomer = async (email) => {

    var query = `
        SELECT 
            count(*) as count
        FROM customer
        WHERE 
            email = "${email}"
    `
    return new Promise((resolve, reject) => {
        sql.query(query, (error, result, fields) => {
            if (error) return reject(error)
            return resolve(result[0])
        })
    })
}

exports.resetPassword = async (obj) => {

    var query = `
        UPDATE 
            customer
        SET 
            password = ?
        WHERE
            id = ?
    `

    let params = [obj.password, obj.customer_id]

    return new Promise((resolve, reject) => {
        sql.query(query, params, (error, result, fields) => {
            if (error) return reject(error)
            return resolve(result)
        })
    })
}


exports.create_address = async (obj, res) => {
    const id = uuidv4()
    var query = `
    INSERT INTO customer_address
    SET 
    id = "${id}",
    customer_id = "${obj.customer_id}",
    first_name = '${obj.first_name}',
    last_name = '${obj.last_name}',
    company_name = '${obj.company_name}',
    phone = '${obj.phone}',
    country = '${obj.country}',
    state = '${obj.state}',
    city = '${obj.city}',
    street = '${obj.street}',
    landmark = '${obj.landmark}',
    zip_code = '${obj.zip_code}'
    `
    return new Promise((resolve, reject) => {
        sql.query(query, (error, result, fields) => {
            if (error) return reject(error)
            return resolve(true)
        })
    })
}

exports.get_address = async (obj, res) => {

    var query = `
        SELECT * FROM customer_address
        WHERE
            customer_id = "${obj.customer_id}" AND deleted = 0
    `
    return new Promise((resolve, reject) => {
        sql.query(query, (error, result, fields) => {
            if (error) return reject(error)
            return resolve(result)
        })
    })
}

exports.delete_address = async (obj, res) => {

    var query = `
        UPDATE customer_address
        SET deleted = 1 
        WHERE
            customer_id = "${obj.customer_id}" AND id = "${obj.address_id}"`
    return new Promise((resolve, reject) => {
        sql.query(query, (error, result, fields) => {
            if (error) return reject(error)
            return resolve(result)
        })
    })
}
