require("dotenv").config();
const express = require("express");
const cookieParser = require("cookie-parser");
const session = require("express-session");
const bodyParser = require("body-parser");
const { engine } = require("express-handlebars");
const flash = require("express-flash");
const path = require("path");
const NewsAPI = require('newsapi');
const newsapi = new NewsAPI(process.env.NEWS_API_KEY);
const debounce = require('lodash.debounce');


const app = express();

//const mailchimpClient = require("@mailchimp/mailchimp_marketing");
//const https = require('https');
//const request = require ("request");
//const { response } = require('express');

//middlewares
app.use(express.static(path.join(__dirname, "public")));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(cookieParser("secret"));
app.use(
  session({
    secret: "secret",
    resave: true,
    saveUninitialized: true,
    cookie: { maxAge: null },
  })
);

//flash message middleware
//app.use ((req,res,next)=>{
//    res.locals.message = req.session.message
//every time we reload this session
//    delete req.session.message
//    next()
//})
app.use(flash());
app.engine("handlebars", engine());
app.set("view engine", "handlebars");
app.set("views", "./views");

//================DATABASE CONNECTION (POSTGRESQL)===============================

const { Pool } = require("pg");

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});

pool.on("error", (err, client) => {
  console.error("Error:", err);
});

function openConnection() {
  console.log("opening connection to db");
  pool.query("SELECT NOW()", (err, res) => {
    console.log(err, res);
  });
}
//================================================================================
var categories = require('./categories.js');
var countryData = require('./countries.js');
var languageData = require('./languages.js');
const countries = countryData.getCountriesObject();
const languages = languageData.getLanguagesObject();


//TODO:
// delete this when tested
var mediastack = require('./mediastack');


app.get("/", (req, res) => {
  res.render("login");
});

app.get("/login", (req, res) => {
  res.render("login");
});

app.post("/login", (req, res) => {});

app.get("/subscribe", (request, response) => {
  response.render("subscribe");
});

/*
app.post("/subscribe", (request, response) => {
  const { email, password } = request.body;
  const query_findByEmail = `SELECT EXISTS (SELECT 1 FROM users WHERE email = '${email}') AS email_exists`;

  pool.query(query_findByEmail, (err, res) => {
    //if error in query
    if (err) {
      console.error(`Error in query ${query_findByEmail}`);
      request.flash("error", "Query Error");
      return response.redirect("/subscribe");
    } else {
      const emailExists = res.rows[0].email_exists;
      //if email exits, notify user
      if (emailExists) {
        request.flash("error", "User aready exists.");
        return response.redirect("/subscribe");
      }
      //add new user to database
      else {
        let query = `INSERT INTO users (email,password) VALUES ('${email}', '${password}')`;
        pool.query(query, (err, res) => {
          if (err) {
            console.log("Error inserting user:", err);
            request.flash("error", err);
            return response.redirect("/subscribe");
          } else {
            response.send("USER SUBSCRIBED SUCEFULLY!");
          }
        });
      }
    }
  });
});
*/

//optimized
app.post("/subscribe", (request, response) => {
    const { email, password } = request.body;
    const query_findByEmail = 'SELECT EXISTS (SELECT 1 FROM users WHERE email = $1) AS email_exists';
    const query_insertUser = 'INSERT INTO users (email, password) VALUES ($1, $2)';
  
    pool.query(query_findByEmail, [email], (err, res) => {
      if (err) {
        console.error(`Error in query ${query_findByEmail}`);
        request.flash("error", "Query Error");
        return response.redirect("/subscribe");
      }
  
      const emailExists = res.rows[0].email_exists;
  
      if (emailExists) {
        request.flash("error", "User already exists.");
        return response.redirect("/subscribe");
      }
  
      pool.query(query_insertUser, [email, password], (err, res) => {
        if (err) {
          console.log("Error inserting user:", err);
          request.flash("error", err);
          return response.redirect("/subscribe");
        } else {
          response.send("USER SUBSCRIBED SUCCESSFULLY!");
        }
      });
    });
  });

  app.get("/customize", (request, response) => {
    response.render("customize", {categories:categories, countries:countries, languages:languages});
  });  

  const Cache = require( "node-cache" ); // Replace with your chosen caching library
  const cache = new Cache(); // Initialize the cache
  
  const FETCH_INTERVAL = 0.5 * 60 * 60 * 1000; // 24 hours in milliseconds
  let lastInvocationTime = 0;
  //can not make more than 1 request by day because there are more than 50 countries
  //this variables for topheadlines and are set by getNews
  let countryList = countryData.getCountryList();
  let newsApiResponse;
  const debouncedFunction = debounce(fetchNews,FETCH_INTERVAL);
  
  function fetchNews() {
    console.log("[fetchNews] Fetching the news from newsapi...");
    lastInvocationTime = Date.now();
  
    const countryPromises = countryList.map((country) => {
      console.log(`Getting news for country: ${country}`);
      var longName = countryData.getCountryName(country);      
      return newsapi.v2.topHeadlines({
        country: country,        
      }).then((response) => {
        response.country = country; // Add country key with corresponding value
        response.longName = longName;
        return response;
      });    
    });
    return Promise.all(countryPromises)
      .then((newsResponses) => {
        console.log("News fetching is complete.");
        newsApiResponse = newsResponses;
        cache.set('news', newsApiResponse); // Update the cache with the new data
        return newsResponses;
      })
      .catch((error) => {
        console.error(error);
        //throw new Error(error);
      });
  }
    
  app.get("/topheadlines", (request, response) => {
    console.log('GET /topheadlines');
  
    const cachedNews = cache.get('news');
  
    if (cachedNews) {
      console.log('Using cached news data.');
      response.render("topheadlines", { headlines: cachedNews });
    } else {
      //if there is not cahced news is because something went wwrong while
      //calling fetchNews, so I will retunr an error page 
      //indicating to try again later.
      response.render("error_page", {remainingTime:remainingTime});

      //--old code. delete when every thingis ok
      /*console.log('Cached news data not found. Fetching news...');
      fetchNews()
        .then((newsResponses) => {
          console.log('End Fetching news. Rendering page.');
          response.render("topheadlines", { headlines: newsResponses });
        })
        .catch((error) => {
          console.error("Error occurred while fetching news:", error);
          response.status(500).send({ status: "error", message: "Internal server error" });
        });
        */
    }
  });
  
  //TODO: to be implemented
  //https://mediastack.com/documentation
  //
  app.get("/mediastack", (request, response)=>{
    const mediastack_response =  mediastack.response;
    //response.render("topheadlines", { headlines: newsResponses });
    response.render("mediastack", {news:mediastack_response});
    //response.send(json_res);
    //response.render("/mediastack", {response:response});
  });

  function formatTime(milliseconds) {
    const hours = Math.floor(milliseconds / (1000 * 60 * 60));
    const minutes = Math.floor((milliseconds % (1000 * 60 * 60)) / (1000 * 60));
  
    let formattedTime = '';
    if (hours > 0) {
      formattedTime += hours + ' hour';
      if (hours > 1) {
        formattedTime += 's';
      }
    }
    if (minutes > 0) {
      formattedTime += (hours > 0 ? ' and ' : '') + minutes + ' minute';
      if (minutes > 1) {
        formattedTime += 's';
      }
    }
    return formattedTime;
  }
  
function remainingTime () {
  const elapsedTime = Date.now() - lastInvocationTime;
  const remainingTime = (FETCH_INTERVAL - (elapsedTime % FETCH_INTERVAL)) || FETCH_INTERVAL;
  return (`Remaining time until next invocation: ${formatTime(remainingTime)}`);
}

app.listen(process.env.PORT || 4000, () => {
  console.log(`app listening on port 4000`);

  // Calculate the remaining time until the next invocation
  //const elapsedTime = Date.now() - lastInvocationTime;
  //const remainingTime = (FETCH_INTERVAL - (elapsedTime % FETCH_INTERVAL)) || FETCH_INTERVAL;
  //console.log(`Remaining time until next invocation: ${formatTime(remainingTime)}`);
  console.log(remainingTime () );

  // Fetch news on server startup
  try{
    debouncedFunction(); 
    }catch (err){
      console.log (`error when calling NEWSAPI: ${err}`);
  }

  // Schedule news fetching every 6 hours
  //setInterval(fetchNews, FETCH_INTERVAL);

});
