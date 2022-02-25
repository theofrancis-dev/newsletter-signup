//jshint esversion: 6

//$ npm install mailchimp-api-v3
const express = require('express');
const path = require ('path');
const app = express();
app.use(express.static( path.join(__dirname, "public")));

const https = require('https');
const bodyParser = require("body-parser");
const request = require ("request");
const mailchimpClient = require("@mailchimp/mailchimp_marketing");
const { response } = require('express');

app.use(bodyParser.urlencoded({extended:true}));
app.use(bodyParser.json());

//=============
const AUDIENCE_ID = "f592e75a6f";


app.get('/', (req, res) => {
        res.sendFile(__dirname + '/public/pinpad.html');
});

async function mailchimpPing (response) {
    try {
        //console.log("try...");
        const pingRes = await mailchimpClient.ping.get();  
        console.log("Ping Response: " + JSON.stringify(pingRes) );
        console.log("health status: " + pingRes.health_status );
        if (pingRes.health_status === "Everything's Chimpy!") {            
            return true;
        } else {
           return false;
        }
    } catch (e) {
        console.log("catch..." + e.message);   
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

function chkApikey ( apiKey ) {
    console.log("chk api key: " + apiKey );
    mailchimpClient.setConfig({
        apiKey: apiKey,
        server: "us14"
    });
    return mailchimpPing();
}

app.get ('/subscribe/', (request, response) => {
    response.sendFile(__dirname + '/subscribe.html');
});

app.get('/chkapi/:api', (request, response) => {    
    MAILCHIMP_APIKEY = request.params.api;
    if (chkApikey (MAILCHIMP_APIKEY)) {          
        response.redirect("/subscribe");
    }else {
        MAILCHIMP_APIKEY="";
        response.send("invalid key");
    }
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
        apiKey: MAILCHIMP_APIKEY,
        server: "us14"
    });
   
    async function addMember ()  {
        try {
            const chimpResponse = await mailchimpClient.lists.addListMember(AUDIENCE_ID, userInfo );
            //console.log("mailchimp response:" + chimpResponse.id);
            //console.log ("add member response: " + JSON.stringify(chimpResponse));
            if (chimpResponse.id){
                //console.log ("added member: "+ chimpResponse.id);
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
        res.sendFile(__dirname + '/public/success.html');       
    } else{
        res.send("we run into problem");
    }
        
});
  
app.listen( process.env.PORT  || 4000, () => {
  console.log(`Example app listening on port ${port}`)
})





