var express = require('express');
var router = express.Router();
//var fs = require('fs')

/* GET home page.
router.get('/', function(req, res, next) {
  fs.readFile('./views/main.html', function(err, data) {
    res.writeHead(200, {'Content-Type': 'text/html'});
    res.write(data);
    res.end();
  });
});
*/

router.get('/', (req, res) => {
  res.render('main', {
    title: 'Welcome'
  })
})

module.exports = router;
