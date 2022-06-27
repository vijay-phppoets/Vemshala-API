const { response } = require("express");
const jwt = require("jsonwebtoken")

const User = require("../models/user.model");
const { jwtSecretKey } = require("../utils")

/* ----
Purpose: To login
Req: email, password
Res: token
---- */
exports.login = async (req, res) => {
    // Collecting params
    let email = req.body.email || "";
    let password = req.body.password || "";

    /* START: Validating params */
    if (!email || !password) {
        return res.status(400).send({
            status: "error",
            message: "Bad request.",
        });
    }
    /* END: Validating params */

    try {
        const user = await User.login(email, password);

        if (user) {
            var token = jwt.sign({ user }, process.env.JWT_SECRET_KEY)
            return res.status(200).send({ status: "success", token: token, user: user })
        }
    } catch (err) {
        return res.status(500).send({
            status: "error",
            message: "Something is not right.",
        });
    }
};
