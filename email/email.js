const nodemailer = require("nodemailer");

exports.sendEmail = async (receivers) => {

    // create reusable transporter object using the default SMTP transport
    let transporter = nodemailer.createTransport({
        host: "smtp.gmail.com",
        port: 587,
        secure: false, // true for 465, false for 587
        auth: {
            user: process.env.EMAIL_USERNAME, // generated ethereal user
            pass: process.env.EMAIL_PASSWORD, // generated ethereal password
        },
        tls: {
            rejectUnauthorized: false
        }
    });

    let info = await transporter.sendMail({
        from: `"VEMASTORE" <${process.env.EMAIL_USERNAME}>`, // sender address
        to: `${receivers.to}`, // list of receivers
        subject: `${receivers.subject}`, // Subject line
        html: `${receivers.html}`, // html body
    });

    console.log("Messageinfo sent: %s", info);
    console.log("Message sent: %s", info.messageId);
    // return 1234
    return info.messageId
}