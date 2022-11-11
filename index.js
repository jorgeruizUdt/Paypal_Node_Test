require("dotenv").config();

const paypal = require('paypal-rest-sdk');
const open = require('open');
const express = require('express');
const app = express();
const PORT = process.env.PORT;

var pr;
var cr;
var token;

paypal.configure({
  'mode': 'sandbox', //sandbox or live
  'client_id': process.env.PAYPAL_CLIENT_ID,
  'client_secret': process.env.PAYPAL_CLIENT_SECRET
});

app.get('/', (req, res) => res.sendFile(__dirname + "/index.html"));
app.listen(PORT, () => console.log(`Server Started on ${PORT}`));

app.get('/cancel', (req, res) => res.send('Cancelled'));

app.get('/pay/:name/:sku/:price/:currency/:quantity', (req, res) => {
    var name = getInfo(req.params.name);
    var sku = getInfo(req.params.sku);
    var price = getInfo(req.params.price);
    var currency = getInfo(req.params.currency);
    var quantity = getInfo(req.params.quantity);
    cr = currency;
    pr = price;

    const create_payment_json = {
      "intent": "sale",
      "payer": {
          "payment_method": "paypal"
      },
      "redirect_urls": {
          "return_url": `http://localhost:3000/success`,
          "cancel_url": `http://localhost:3000/cancel`
      },
      "transactions": [{
          "item_list": {
              "items": [{
                  "name": name,
                  "sku": sku,
                  "price": price,
                  "currency": currency,
                  "quantity": parseInt(quantity)
              }]
          },
          "amount": {
              "currency": currency,
              "total": price
          },
          "description": "Hat for the best team ever"
      }]
  };

  app.get('/success', (req, res) => {
    const payerId = req.query.PayerID;
    const paymentId = req.query.paymentId;
    var price = pr;
    var currency = cr;
  
    const execute_payment_json = {
      "payer_id": payerId,
      "transactions": [{
          "amount": {
              "currency": currency,
              "total": price
          }
      }]
    };
  
    paypal.payment.execute(paymentId, execute_payment_json, function (error, payment) {
      if (error) {
          console.log(error.response);
          throw error;
      } else {
          console.log(JSON.stringify(payment));

          const url = `http://localhost:5000/success/paymentId=${payment.id}&token=${token}&PayerID=${payment['payer']['payer_info']['payer_id']}`;
          open(url);

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
              token = payment.links[i].href.split('token=')[1];
              res.redirect(payment.links[i].href);
              console.log(`fst: ${payment.links[i].href}`);
            }
          }
      }
    });   
});

app.get('/pay1', (req, res) => {
  const create_payment_json = {
    "intent": "sale",
    "payer": {
        "payment_method": "paypal"
    },
    "redirect_urls": {
        "return_url": `http://localhost:3000/success1`,
        "cancel_url": `http://localhost:3000/cancel`
    },
    "transactions": [{
        "item_list": {
            "items": [{
                "name": "Hat",
                "sku": "000-1",
                "price": "29.99",
                "currency": "USD",
                "quantity": 1
            }]
        },
        "amount": {
            "currency": "USD",
            "total": "29.99"
        },
        "description": "Hat for the best team ever"
    }]
};

  app.get('/success1', (req, res) => {
    const payerId = req.query.PayerID;
    const paymentId = req.query.paymentId;
    
    const execute_payment_json = {
      "payer_id": payerId,
      "transactions": [{
        "amount": {
            "currency": "USD",
            "total": "29.99"
        }
      }]
    };

  paypal.payment.execute(paymentId, execute_payment_json, function (error, payment) {
    if (error) {
      console.log(error.response);
      throw error;
    } else {
      console.log(JSON.stringify(payment));

      for(let i = 0;i < payment.links.length;i++){
        if(payment.links[i].rel === 'approval_url'){
          res.redirect(payment.links[i].href);
          console.log(`SUCCES1: ${payment.links[i].href}`);
        }
      }

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
            console.log(`fst: ${payment.links[i].href}`);
          }
        }
    }
  });   
});

function parseURLParams(url) {
  var queryStart = url.indexOf("?") + 1;
      queryEnd   = url.indexOf("#") + 1 || url.length + 1;
      query = url.slice(queryStart, queryEnd - 1);
      pairs = query.replace(/\+/g, " ").split("&");
      parms = {}, i, n, v, nv;

  if (query === url || query === "") return;

  for (i = 0; i < pairs.length; i++) {
      nv = pairs[i].split("=", 2);
      n = decodeURIComponent(nv[0]);
      v = decodeURIComponent(nv[1]);

      if (!parms.hasOwnProperty(n)) parms[n] = [];
      parms[n].push(nv.length === 2 ? v : null);
  }

  return parms;
}

function getInfo(complete_info) {
  const splt = complete_info.split('=');
  const info = splt[1];

  return info;
}