const express = require('express');
const path = require('path');
const favicon = require('serve-favicon');
const logger = require('morgan');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const expressValidator = require('express-validator');
const flash = require('connect-flash');
const session = require('express-session');
const MongoStore = require('connect-mongo')(session);
const passport = require('passport');
const crypto = require('crypto'); //
const multer = require('multer'); // primarily used for uploading files
const GridFsStorage = require('multer-gridfs-storage'); //store uploaded files directly to MongoDb.
const Grid = require('gridfs-stream'); //stream files to and from MongoDB GridFS.
const methodOverride = require('method-override'); //Lets you use HTTP verbs such as PUT or DELETE in places where the client doesn't support it.

const config = require('./config/database');

const app = express();


// Load view engine
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));

//Express logger
app.use(logger('dev'));

// Body Parser Middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

// Cookie Parser Middleware
app.use(cookieParser());

// Set Public Folder
app.use(express.static(path.join(__dirname, 'public')));

//Method Override Middleware
app.use(methodOverride('_method'));

// Express Session Middleware
app.use(session({
  secret: 'keyboard cat',
  resave: true,
  saveUninitialized: true,
  store: new MongoStore({mongooseConnection: mongoose.connection})
}));

// Express Messages Middleware
app.use(require('connect-flash')());
app.use(function (req, res, next) {
  res.locals.messages = require('express-messages')(req, res);
  next();
});

// Express Validator Middleware
app.use(expressValidator({
  errorFormatter: function(param, msg, value) {
      var namespace = param.split('.')
      , root    = namespace.shift()
      , formParam = root;

    while(namespace.length) {
      formParam += '[' + namespace.shift() + ']';
    }
    return {
      param : formParam,
      msg   : msg,
      value : value
    };
  }
}));

// Passport Config
require('./config/passport')(passport);
// Passport Middleware
app.use(passport.initialize());
app.use(passport.session());

//User  Variable
app.get('*', function(req, res, next){
  res.locals.user = req.user || null;
  next();
});



//MongoDb connection

mongoose.connect(config.database, {
  useMongoClient: true,
});
let db = mongoose.connection;

// Check for DB errors
db.on('error', function(err){
  console.log(err);
});



//Set Bootstrap Folder

app.use('/bootstrap', express.static(path.join(__dirname + '/node_modules/bootstrap/dist/')));

//Set Bootstrap Folder


//Set jquery Folder

app.use('/jquery', express.static(path.join(__dirname + '/node_modules/jquery/dist/')));

//Set jquery Folder


// Home Route
let main = require('./routes/main')
app.use('/', main)

// Route Files
let posts = require('./routes/posts');
let images = require('./routes/images');
let users = require('./routes/users');
app.use('/posts', posts);
app.use('/images', images);
app.use('/users', users)

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});


module.exports = app;
