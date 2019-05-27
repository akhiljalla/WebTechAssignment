var express = require("express");
var fs = require('fs');
var http = require('http');
const https = require('https');

const fileUpload = require('express-fileupload');
const Cryptr = require('cryptr');
const cryptr = new Cryptr('myTotalySecretKey')

var app = express();

var path = require("path");
app.use(express.static(path.join(__dirname)));

const sqlite3 = require('sqlite3');
const db = new sqlite3.Database('pet.db');

const bodyParser = require('body-parser');
app.use(bodyParser.urlencoded({ extended: true }));
app.use(fileUpload());

app.get('/', function(req, res){

    res
        .status(200)
        .sendFile(path.join(__dirname,"homepage.html"));
});

function save(rows, callback) {
    fs.writeFile('./pets_information.json', JSON.stringify(rows), callback);
  }

app.get('/loginAuthorization/:email/:pwd', (req, res) => {
    const emailToLookup = req.params.email;
    const passwordToLookup = req.params.pwd;  // matches ':userid' above
   
    db.all(
      'SELECT USER_PASSWORD FROM USERS WHERE USER_EMAIL=$userEmail',
      // parameters to SQL query:
      {
        $userEmail: emailToLookup
      },
      // callback function to run when the query finishes:
      (err, rows) => {
        if (rows.length > 0) {
          
          const dpassword = cryptr.decrypt(rows[0].USER_PASSWORD);
          console.log(dpassword);
          if (passwordToLookup == dpassword) {			
              res.send(rows);
              
          } 
          else
          {
              res.send({});
          }
        }
        else
          {
              res.send({});
          }
      }
    ); 
  });

app.post('/saveUser', (req, res) => {
    var data = {
        user_name : req.body.name,
        user_email: req.body.email,
        user_password: req.body.password,
        user_dob: req.body.dob,
    }
    const epassword = cryptr.encrypt(data.user_password);
    
    var sql = 'INSERT INTO users(user_name, user_email, user_password, user_dob) VALUES(?,?,?,?)'
    var params = [data.user_name, data.user_email, epassword, data.user_dob]
     
    console.log(epassword);
    // insert one row into the langs table
    db.run(sql,params, function(err) {
      if (err) {
        return console.log(err.message);
      }
      // get the last insert id
      console.log('A row has been inserted with rowid ${this.lastID}');
    });
  });

app.post('/pets_for_adoption',(req, res) => {
    console.log(req.body);
    db.run(
        'INSERT INTO pet VALUES ($refnumber, $animal, $name, $breed, $age, $image)',
        {
            $refnumber: req.body.refnumber,
            $animal: req.body.animal,
            $name: req.body.name,
            $breed: req.body.breed,
            $age: req.body.age,
            $image: req.body.filename
        },
        (err)=>{
            if(err){
                res.send({message: 'error in app.post'});
            }
            else{
                res
                .status(200)
                .sendFile(path.join(__dirname,"successful.html"));
            }
        }
    );
    let sampleFile;
    let uploadPath;
    sampleFile = req.files.image;

    uploadPath = __dirname + '/images_from_database/' + sampleFile.name;

    sampleFile.mv(uploadPath, function(err) {
      if (err) {
        return res.status(500).send(err);
      }
  });
  var list = [];
  db.all('SELECT * FROM pet',(err,rows)=>{
        console.log(rows);
        //res.json(rows);
        save(rows, function(err) {
            if (err) {
              res.status(404).send('User not saved');
              return;
            }
          });
    });
});

app.post('/request_for_adoption',(req, res) => {
    console.log(req.body);
    db.run(
        'INSERT INTO adoptionlist VALUES ($refnumber, $name, $occupation, $address, $email, $reason)',
        {
            $refnumber: req.body.refnumber,
            $name: req.body.name,
            $occupation: req.body.occupation,
            $address: req.body.address,
            $email: req.body.email,
            $reason: req.body.reason
        },
        (err)=>{
            if(err){
                res.send({message: 'error in app.post'});
            }
            else{
                res
                .status(200)
                .sendFile(path.join(__dirname,"request_sent.html"));
            }
        }
    );  
});

app.get('/pet_information/:petid',(req,res) => {
    const reference = req.params.petid;
    console.log('reached1',reference);
    db.all('SELECT * FROM pet WHERE refnumber=$refnumber',
    {
        $refnumber: reference
    },
    (err, rows) => {
        console.log(rows);
        res.send(rows);
    });
});


// app.listen(3000, function(){
//     console.log("LOGGED IN");
// })
//http.createServer(app).listen(80);

https.createServer({
  key: fs.readFileSync('server.key'),
  cert: fs.readFileSync('server.crt')
}, app).listen(3000, () => {
  console.log('Listening...')
})