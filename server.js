const express = require("express");
const bodyParser = require("body-parser");
const fileUpload = require("express-fileupload");
require('dotenv').config();

const app = express();
var cors = require("cors");

// parse requests of content-type: application/json
app.use(bodyParser.json({ limit: '50mb', extended: true }));
app.use(fileUpload());
// parse requests of content-type: application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: true, limit: '50mb' }));
app.use(cors());


// Routes
require("./all.route")(app)



// set port, listen for requests
app.listen(9000, () => {
    console.log("Server is running on port 9000.");
});