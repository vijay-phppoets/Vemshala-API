const bcrypt = require('bcrypt');
const jwt = require("jsonwebtoken")

/* model */
const Customer = require('../models/customer.model')
const SalesOrder = require('../models/salesorder.model')
const { sendEmail } = require("../email/email")


exports.create = async (req, res) => {
    // Collecting params
    let name = req.body.name || "";
    let email = req.body.email || "";
    let password = req.body.password || "";
    let signup_method = req.body.signup_method || "";
    let id_token = req.body.id_token || "";

    /* START: Validating params */
    if (!name && !email && !password) {
        return res.status(400).send({
            status: "error",
            message: "Bad request.",
        });
    }
    /* END: Validating params */

    try {
        let customerCheck = await Customer.checkCustomer(email);
        console.log(customerCheck);
        if (signup_method == 'website') {
            password = await bcrypt.hash(password, 12)
            if (customerCheck.count > 0) {
                return res.status(400).send({
                    status: "error",
                    message: "email id already exist",
                });
            }
        }

        if (signup_method == 'google' && customerCheck.count > 0) {
            let customer = await Customer.getCustomerByEmail(email);
            customer = await Customer.getCustomer(customer.id)

            const token = jwt.sign({ customer }, process.env.JWT_SECRET_KEY)
            return res.status(200).send({
                status: "success",
                message: "You are logged in.",
                customer: customer,
                token: token
            });
        }
        else {

            let customer = await Customer.create({
                name: name,
                email: email,
                password: password,
                signup_method: signup_method,
                id_token: id_token,
            })

            customer = await Customer.getCustomer(customer.id)
            // Email
            await this.welcomeEmail(email, name);
            // Email
            const token = jwt.sign({ customer }, process.env.JWT_SECRET_KEY)

            return res.status(200).send({
                status: "success",
                message: "Account created successfully.",
                customer: customer,
                token: token
            });
        }
    } catch (error) {
        return res.status(500).send({
            status: "error",
            message: "Something is not right.",
            error: error
        });
    }
}

exports.login = async (req, res) => {
    // Collecting params
    let email = req.body.email || "";
    let password = req.body.password || "";
    let cart_id = req.body.cart_id || "";


    /* START: Validating params */
    if (!email && !password) {
        return res.status(400).send({
            status: "error",
            message: "Bad request.",
        });
    }
    /* END: Validating params */

    try {
        let customer = await Customer.getCustomerByEmail(email)

        if (!customer) {
            return res.status(403).send({
                status: "error",
                message: "No record found with entered email.",
            });
        }

        let is_password_matched = await bcrypt.compare(password, customer.password)
        if (is_password_matched) {
            customer = await Customer.getCustomer(customer.id)
            const token = jwt.sign({ customer }, process.env.JWT_SECRET_KEY)

            if (cart_id) {
                // upading cutomer_id in cart
                await SalesOrder.updateCustomer(customer.id, cart_id)
            }
            return res.status(200).send({
                status: "success",
                message: "Login successful.",
                customer: customer,
                token: token
            });
        } else {
            return res.status(403).send({
                status: "error",
                message: "incorrect credentials.",
            });
        }
    } catch (error) {
        return res.status(500).send({
            status: "error",
            message: "Something is not right.",
        });
    }
}

exports.detail = async (req, res) => {
    // collecting params
    let customer_id = req.AuthData.customer.id

    /* START: Validating params */
    if (!customer_id) {
        return res.status(400).send({
            status: "error",
            message: "Bad request.",
        });
    }
    /* END: Validating params */

    try {
        let customer = await Customer.getCustomer(customer_id)
        return res.status(200).send({
            status: "success",
            message: "Login successful.",
            customer: customer,
        });
    } catch (error) {
        return res.status(500).send({
            status: "error",
            message: "Something is not right.",
        });
    }
}

exports.admin_list = async (req, res) => {
    try {
        let list = await Customer.getCustomerList()
        return res.status(200).send({
            status: "success",
            message: "Data found",
            list: list,
        });
    } catch (error) {
        return res.status(500).send({
            status: "error",
            message: "Something is not right.",
        });
    }
}

exports.sendOtp = async (req, res) => {
    let email = req.body.email || "";
    if (!email) {
        return res.status(400).send({
            status: "error",
            message: "Bad request.",
        });
    }
    let customer = await Customer.getCustomerByEmail(email)
    if (!customer) {
        return res.status(403).send({
            status: "error",
            message: "No record found with entered email.",
        });
    }
    let link = "http://vemastore.com/reset-password/" + customer.id;
    let emailHtml = 'Dear ' + customer.name + ', <br/>';
    emailHtml += 'We heard that you lost your Vemastore account password. Sorry about that! <br/><br/> But don’t worry! You can use the following link to reset your password: <br/>' + link;


    try {
        await sendEmail({ to: email, subject: "Forgot Password", html: emailHtml })
        return res.status(200).send({
            status: "success",
            message: "Reset password link send on your email. Please check"
        });
    } catch (error) {
        return res.status(500).send({
            status: "error",
            message: "something not right"
        });
    }
}

exports.resetPassword = async (req, res) => {
    // Collecting params
    let customer_id = req.body.customer_id || "";
    let password = req.body.password || "";

    /* START: Validating params */
    if (!customer_id && !password) {
        return res.status(400).send({
            status: "error",
            message: "Bad request.",
        });
    }
    /* END: Validating params */

    try {
        password = await bcrypt.hash(password, 12)
        let customer = await Customer.resetPassword({
            customer_id: customer_id,
            password: password,
        })
        return res.status(200).send({
            status: "success",
            message: "Password change successfully.",
        });

    } catch (error) {
        console.log(error)
        return res.status(500).send({
            status: "error",
            message: "Something is not right.",
        });
    }
}

exports.welcomeEmail = async (email, name) => {
    let emailHtml = 'Dear ' + name + ', <br/>';
    emailHtml += 'You are successfully register on Vemastore.';
    try {
        await sendEmail({ to: email, subject: "Registration Successfully", html: emailHtml })
        return 200
    } catch (error) {
        return 500;
    }
}


exports.create_address = async (req, res) => {

    if (!req.body.first_name) {
        return res.status(400).send({
            status: "error", message: "First Name can't be empty."
        })
    }
    if (!req.body.last_name) {
        return res.status(400).send({
            status: "error", message: "Last Name can't be empty."
        })
    }
    // if (!req.body.email) {
    //     return res.status(400).send({
    //         status: "error", message: "Email can't be empty."
    //     })
    // }
    if (!req.body.city) {
        return res.status(400).send({
            status: "error", message: "City can't be empty."
        })
    }
    if (!req.body.country) {
        return res.status(400).send({
            status: "error", message: "Country can't be empty."
        })
    }
    if (!req.body.state) {
        return res.status(400).send({
            status: "error", message: "State can't be empty."
        })
    }
    if (!req.body.phone) {
        return res.status(400).send({
            status: "error", message: "Phone can't be empty."
        })
    }
    if (!req.body.zip_code) {
        return res.status(400).send({
            status: "error", message: "zip code can't be empty."
        })
    }

    const obj = {
        first_name: req.body.first_name || "",
        last_name: req.body.last_name || "",
        company_name: req.body.company_name || "",
        email: req.body.email || "",
        phone: req.body.phone || "",
        country: req.body.country || "",
        state: req.body.state || "",
        city: req.body.city || "",
        street: req.body.street || "",
        landmark: req.body.landmark || "",        
        zip_code: req.body.zip_code || "",        
        customer_id: req.AuthData.customer.id,

    }
    try {
        const response = await Customer.create_address(obj)
        if (response) {
            return res.status(200).send({ message: "Address added successfully" })
        }
        return res.status(401).send({
            status: "error", message: "Invalid address."
        })
    } catch (err) {
        console.log(err)
        return res.status(500).send({
            status: "error", message: "Something is not right."
        })
    }
}

exports.get_address = async (req, res) => {

    let customer_id = req.AuthData.customer ? req.AuthData.customer.id : null
    if (!customer_id){
        return res.status(200).send({ status: "Fetch address successfully", customer_address: [] })
    }

    try {
        const response = await Customer.get_address({ customer_id: customer_id })
        if (response) {
            return res.status(200).send({ status: "Fetch address successfully", customer_address: response })
        }
        return res.status(401).send({
            status: "error", message: "Invalid address."
        })
    } catch (err) {
        return res.status(500).send({
            status: "error", message: "Something is not right."
        })
    }
}

exports.delete_address = async (req, res) => {

    let customer_id = req.AuthData.customer ? req.AuthData.customer.id : null
    let address_id = req.body.address_id || ""

    if (!address_id){
        return res.status(400).send({  status:"error", "message": "Address ID Invalid"})
    }

    if (!customer_id){
        return res.status(400).send({ status:"error", "message": "Customer Invalid"})
    }

    try {
        const response = await Customer.delete_address({ customer_id: customer_id, address_id: address_id })
        if (response) {
            return res.status(200).send({ status:"success", message: "Address Deleted successfully" })
        }
        return res.status(401).send({
            status: "error", message: "Invalid address."
        })
    } catch (err) {
        return res.status(500).send({
            status: "error", message: "Something is not right."
        })
    }
}