const express = require('express');
const models = require('./schema/index');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const session = require('express-session');
const cors = require('cors');
var genericAPI = require('./generic-api').Resource;

const app = express();

// Middleware
app.use(express.static(__dirname + '/public'));
app.use(cors());

app.use(cookieParser('LOL-my-Secret-dam'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: false}));

// Use the session middleware
app.use(session({ secret: 'keyboard cat', cookie: { maxAge: 60000 }}));

app.set('view engine', 'ejs');
app.set('views', __dirname + '/views');

//setup mongoose
mongoose.connect('mongodb://localhost/test');
app.db = mongoose.connection;
app.db.on('error', console.error.bind(console, 'mongoose connection error: '));
app.db.once('open', function () {
  
});

models(app, mongoose);

genericAPI.model('User');
genericAPI.methods(['get', 'post', 'put']);
genericAPI.registerRoutes(app, '/user', ['_id', 'email', 'name']);
genericAPI.setParamRulesList({
								name: {
									rules: [{name: 'length', max: 3, min: 1}, {name: 'slugify'}]
								},
								email: {
									rules: [{name: 'email'}]
								}
							});

app.listen(3005);

app.use(errorHandler);
// Main error handler
function errorHandler (err, req, res, next) {
  if (res.headersSent) {
    return next(err)
  }
  res.status(500);
    // res.send('error');
    if(req.xhr)
        return res.json({status: 0, message: err});
    res.render('error', { error: err })
    console.log(err);
}