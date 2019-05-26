const sqlite3 = require('sqlite3');
const db = new sqlite3.Database('pet.db');

db.serialize(() =>{
    db.run("CREATE TABLE pet (refnumber TEXT, animal TEXT, name TEXT, breed TEXT, age int, image TEXT)")
    db.run("CREATE TABLE USERS (USER_ID INTEGER, USER_NAME TEXT, USER_EMAIL TEXT, USER_PASSWORD TEXT, USER_DOB TEXT, PRIMARY KEY(USER_ID))")
    db.run("CREATE TABLE adoptionlist (refnumber TEXT, name TEXT, occupation TEXT, address TEXT, email TEXT, reason TEXT)")
});

db.close();