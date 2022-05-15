const express = require("express");
const app = express();
const bodyParser = require("body-parser");
const sendBitcoin = require("./app");

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.post("/sendBTC", async (req, res) => {
  const { address, amount } = req.query;
  const sentDets = await sendBitcoin(address, amount);
  res.send(sentDets);
});

app.listen(3000, () => console.log("Bitcoin App listening on port 3000!"));
