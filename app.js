require('dotenv').config();
//import express from 'express';
//import { engine } from 'express-handlebars';

const express = require ('express');
const { engine } = require ('express-handlebars');

const flash = require('connect-flash'); //used by toa
const toastr = require ('express-toastr');
const cookieParser = require('cookie-parser');
const session = require('express-session');
const bodyParser = require("body-parser");
const path = require ('path');
//const mailchimpClient = require("@mailchimp/mailchimp_marketing");
//const https = require('https');
//const request = require ("request");
//const { response } = require('express');
const app = express();

//middlewares
app.use(express.static( path.join(__dirname, "public")));
app.use(bodyParser.urlencoded({extended:true}));
app.use(bodyParser.json());
app.use(cookieParser('secret'));
app.use(session(
    {
        secret: 'secret',
        resave: true,
        saveUninitialized: true,
        cookie:{maxAge:null},

    }));
    
app.use(flash());
app.use(toastr());
app.engine('handlebars', engine () );
app.set ('view engine','handlebars');
app.set('views','./views');

//used by toastr
app.use( (req, res, next) => 
    {
        res.locals.toastr = req.toastr.render()
        next()
    });

//=============
const AUDIENCE_ID = process.env.AUDIENCE_ID;
const chimpApiKey = process.env.CHIMPMAIL_API_KEY;

app.get('/', (req, res) => {
    //console.log('mailchimp api: ', chimpApiKey);
    //mailchimpClient.setConfig({
    //    apiKey: chimpApiKey,
    //    server: "us14"
    //});

    /*if ( mailchimpPing (res)){
        res.render('home');
    }else{
        res.message.
        res.redirect("/");
    }*/
    res.render('home');
});

app.get('/login', (req,res) => {
    res.render('login');
    
})

app.post('/login', (req,res) => {
    console.log ('login post.')
    req.toastr.error('un error con toastr');
    res.render('login',{req:req});
});

async function mailchimpPing (res) {
    try {
        const pingRes = await mailchimpClient.ping.get();  
        console.log("Ping Response: " + JSON.stringify(pingRes) );
        console.log("health status: " + pingRes.health_status );
        if (pingRes.health_status === "Everything's Chimpy!") {            
            return true;
        } else {
           return false;
        }
    } catch (e) {
        res.sendFile(__dirname + '/');    
        console.log("Error..." + e.message);   
        return false;     
    } finally {
        //console.log ('finally');
    }
};

async function getAllLists(){
    let allList = await mailchimpClient.lists.getAllLists(); 
    console.log("all lists: " + JSON.stringify(allList) );
    return allList;
}

app.get ('/subscribe/', (request, response) => {
    response.sendFile(__dirname + '/');
});

app.post('/subscribe', (req, res)=>{   
    console.log("POST subscribe") ;
    console.log(req.body);
    //using desconstruccion
    const { first_name, lastname, email } = req.body;
        
    /*https://mailchimp.com/developer/marketing/api/abuse-reports/*/
    //Audience > Preference Center > Settings > Audience fileds and *|MERGE|* tags
    // FNAME, LNAME, ADDRESS, PHONE, BIRTHDAY,
    const subscribingUser = {
    };

    const userInfo = {
        email_address: email,
        status:"subscribed",
        merge_fields:{
            FNAME : first_name,
            LNAME : lastname                    
        }
    };
    
    mailchimpClient.setConfig({
        apiKey: chimpApiKey,
        server: "us14"
    });
   
    async function addMember ()  {
        try {
            const chimpResponse = await mailchimpClient.lists.addListMember(AUDIENCE_ID, userInfo );
            //console.log("mailchimp response:" + chimpResponse.id);
            //console.log ("add member response: " + JSON.stringify(chimpResponse));
            if (chimpResponse.id){
                 console.log ("added member: "+ chimpResponse.id);
                return true;
            } else {
                return false;
            }            
        }catch (e) {
            console.log("addMember error: " + e.message);
            return false;
        }
      };
    
    if (addMember()) {
        res.sendFile(__dirname + '/');       
    } else{
        res.send("we run into problem");
    }
        
});
  
app.listen( process.env.PORT  || 4000, () => {
  console.log(`app listening on port 4000`)
})





