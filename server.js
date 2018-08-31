const express = require('express');
const bodyParser = require('body-parser');
const db = require('./models');
const PORT = process.env.PORT || 3000;
const itemRoutes = require('./app/routes/item');
const userRoutes = require('./app/routes/user');


const app = express();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended:  true}));
app.use(bodyParser.text());


itemRoutes(app,db);
userRoutes(app,db);


db.sequelize.sync().then(() => {
  app.listen(PORT, function () {
    console.log(`Listen on port ${PORT}`);
  });
});