const AWS = require("aws-sdk")
const conf = require("../config/config")

exports.getSingedUrlforPut = async (req, res) => {

    let filename = req.query.filename || "hello"
    let ext = req.query.ext || "txt"

    const s3 = new AWS.S3({
        endpoint: conf.s3_endpoint,
        accessKeyId: conf.s3_access_key,
        secretAccessKey: conf.s3_secret_Key,
        Bucket: conf.s3_bucket,
        signatureVersion: 'v4',
        region: conf.s3_region
    });

    const params = {
        Bucket: conf.s3_bucket,
        Key: `${filename}.${ext}`,
        Expires: 60 * 5
    };

    try {
        s3.getSignedUrl('putObject', params, (err, url) => {
            if (err) {
                return res.status(500).send({
                    status: "error", message: "Something is not right."
                })
            }
            return res.status(200).send({
                status: "success",
                message: "S3 signed URL generated successfully.",
                url: url
            })
        })
    } catch (err) {
        return res.status(500).send({
            status: "error", message: "Something is not right."
        })
    }
}

exports.deleteFile = async (file) => {

    let filename = file

    const s3 = new AWS.S3({
        endpoint: conf.s3_endpoint,
        accessKeyId: conf.s3_access_key,
        secretAccessKey: conf.s3_secret_Key,
        Bucket: conf.s3_bucket,
        signatureVersion: 'v4',
        region: conf.s3_region
    });

    const params = {
        Bucket: conf.s3_bucket,
        Key: `${filename}`
    };

    try {
        s3.deleteObject(params, (err, data) => {
            if (err) {
                return "Something is not right."

            }
            return "File has been deleted successfully."
        })
    } catch (err) {
        return "Something is not right."
    }
}