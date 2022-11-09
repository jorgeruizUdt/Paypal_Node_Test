require("dotenv").config();

const express = require('express');
const paypal = require('paypal-rest-sdk');
const app = express();
const PORT = process.env.PORT;

paypal.configure({
  'mode': 'sandbox', //sandbox or live
  'client_id': process.env.PAYPAL_CLIENT_ID,
  'client_secret': process.env.PAYPAL_CLIENT_SECRET
});

app.get('/', (req, res) => res.sendFile(__dirname + "/index.html"));
app.listen(PORT, () => console.log(`Server Started on ${PORT}`));

app.get('/cancel', (req, res) => res.send('Cancelled'));

app.post('/pay', (req, res) => {
    const create_payment_json = {
      "intent": "sale",
      "payer": {
          "payment_method": "paypal"
      },
      "redirect_urls": {
          "return_url": process.env.URL_SUCCESS,
          "cancel_url": process.env.URL_CANCEL
      },
      "transactions": [{
          "item_list": {
              "items": [{
                  "name": "ARed Sox Hat",
                  "sku": "0001",
                  "price": "27.00",
                  "currency": "USD",
                  "quantity": 1
              }]
          },
          "amount": {
              "currency": "USD",
              "total": "27.00"
          },
          "description": "Hat for the best team ever"
      }]
  };

  app.get('/success', (req, res) => {
    const payerId = req.query.PayerID;
    const paymentId = req.query.paymentId;
  
    const execute_payment_json = {
      "payer_id": payerId,
      "transactions": [{
          "amount": {
              "currency": "USD",
              "total": "27.00"
          }
      }]
    };
  
    paypal.payment.execute(paymentId, execute_payment_json, function (error, payment) {
      if (error) {
          console.log(error.response);
          throw error;
      } else {
          console.log(JSON.stringify(payment));
          res.send('Success');
      }
    });
  });

    paypal.payment.create(create_payment_json, function (error, payment) {
        if (error) {
            throw error;
        } else {
            for(let i = 0;i < payment.links.length;i++){
              if(payment.links[i].rel === 'approval_url'){
                res.redirect(payment.links[i].href);
              }
            }
        }
      });
      
});