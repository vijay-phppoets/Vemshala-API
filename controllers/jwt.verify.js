const jwt = require("jsonwebtoken");

module.exports = {
    verifyToken: function (req, res, next) {
        // Get auth header value
        const bearerHeader = req.headers['authorization'];
        // check if bearer is undefined
        if (typeof bearerHeader !== 'undefined') {
            // spli at the space
            const bearer = bearerHeader.split(' ');

            if (typeof bearer[0] !== 'undefined' && typeof bearer[1] !== 'undefined' && bearer[0] == 'Bearer') {
                // Get token from array
                const bearerToken = bearer[1];
                jwt.verify(bearerToken, process.env.JWT_SECRET_KEY, (err, AuthData) => {
                    if (err) {
                        // Forbidden
                        res.sendStatus(403);
                    } else {
                        // Set the token
                        req.token = bearerToken;
                        req.AuthData = AuthData;
                        next();
                    }
                });
            } else {
                // Forbidden
                res.sendStatus(403);
            }
        } else {
            // Forbidden
            res.sendStatus(403);
        }
    }
};

