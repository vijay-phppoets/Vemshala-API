const dbCred = require("../database.json")

module.exports = {
    HOST: dbCred.dev.host,
    USER: dbCred.dev.user,
    PASSWORD: dbCred.dev.password,
    DB: dbCred.dev.database
};

