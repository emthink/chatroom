var mailer = require('nodemailer');

global.config = {
	mail: {
        from: {
            name: 'App name',
            service: '163',
            auth: {
                user: '11301166@bjtu.edu.com',
                pass: 'xxx'
            }
        },
        to: [
            'Jiangang Xiong <codingfun@163.com>'
        ]
    }
}
var toUser = {}

/**
 * [sendMail 发送邮件函数]
 * @param  {[type]} subject [邮件主题]
 * @param  {[type]} html    [邮件内容]
 * @return {[type]}         [description]
 */
function sendMail(subject, html) {
    var mailOptions = {
        from: [config.mail.from.name, config.mail.from.auth.user].join(' '),
        to: config.mail.to.join(','),
        subject: subject,
        html: html
    };

    smtpTransport.sendMail(mailOptions, function(error, response){
        if (error) {
            console.log(error);
        } else {
            console.log('Message sent: ' + response.message);
        }
        smtpTransport.close();
    });
}