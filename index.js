const awssdk = require("aws-sdk")
awssdk.config.update({region: 'us-east-1'})
const documentClient = new awssdk.DynamoDB.DocumentClient()
const sgMail = require('@sendgrid/mail')

exports.emailVerification = (event, context, callback) => {
    
    console.log("Lambda function for email notification")
    console.log(event)

    console.log(Object.keys(event.Records[0].Sns))
    console.log(event.Records[0].Sns.MessageAttributes)
    console.log("email is: "+event.Records[0].Sns.MessageAttributes.emailid.Value)
    let emailId = event.Records[0].Sns.MessageAttributes.emailid.Value
    let tokenValue = event.Records[0].Sns.MessageAttributes.token.Value
    
    let getEmailListParams = {
        TableName: 'emailListTbl',
        Key: {
            emailid: emailId
        }
    }
    
    let putEmailParams = {
        TableName: "emailListTbl",
        Item: {
            emailid: emailId
        }
    }
    
    documentClient.get(getEmailListParams, (err, emaillist) => {
        if (err) console.log(err)
        else {
            console.log("email list is " +emaillist)
            console.log("length is " +Object.keys(emaillist).length)
            // email not found, add email to list
            if (Object.keys(emaillist).length === 0) {

                sgMail.setApiKey(process.env.SENDGRID_API_KEY)
                const msg = {
                    to: emailId, // Change to your recipient
                    from: 'no-reply@sethusurya.com', // Change to your verified sender
                    subject: 'Sending with SendGrid is Fun',
                    text: 'and easy to do anywhere, even with Node.js',
                    html: '<div><strong>and easy to do anywhere, even with Node.js</strong><p>hello sethu</p></div>',
                }
                sgMail
                    .send(msg)
                    .then((data) => {
                    console.log('Email sent')
                    documentClient.put(putEmailParams, (err, data) => {
                        if (err) {
                            console.log("Error in adding item to Email list table")
                        }
                        else {
                            console.log(`Email id ${putEmailParams.Item.emailid} added to sent list`)
                        }
                    })
                    callback(null, {data: data})
                    })
                    .catch((error) => {
                    console.error(error)
                    })
            } else {
                console.log("Email already sent")
            }
        }
    })
}