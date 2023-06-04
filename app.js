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

  app.get("/news", (request, response) => {
    response.render("news-page", {categories:categories, countries:countries, languages:languages});
  });

  const Cache = require( "node-cache" ); // Replace with your chosen caching library
  const cache = new Cache(); // Initialize the cache
  
  const FETCH_INTERVAL = 24 * 60 * 60 * 1000; // 12 hours in milliseconds
  //can not make more than 2 request by day because there are more than 50 countries
  //this variables for topheadlines and are set by getNews
  let countryList = countryData.getCountryList();
  let newsApiResponse;
  
  function fetchNews() {
    console.log("[fetchNews] Fetching the news from newsapi...");
  
    const countryPromises = countryList.map((country) => {
      console.log(`Getting news for country: ${country}`);
      return newsapi.v2.topHeadlines({
        country: country,
      }).then((response) => {
        response.country = country; // Add country key with corresponding value
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
        console.error("Error occurred while calling News API:", error);
        throw new Error(error);
      });
  }
  
  // Fetch news on server startup or whenever needed
  try{
    fetchNews();
  }catch (err){
    console.log (`error when calling NEWSAPI: ${err}`);
  }
  
  // Schedule news fetching every 6 hours
  setInterval(fetchNews, FETCH_INTERVAL);
  
  app.get("/topheadlines", (request, response) => {
    console.log('GET /topheadlines');
  
    const cachedNews = cache.get('news');
  
    if (cachedNews) {
      console.log('Using cached news data.');
      response.render("topheadlines", { headlines: cachedNews });
    } else {
      console.log('Cached news data not found. Fetching news...');
      fetchNews()
        .then((newsResponses) => {
          console.log('End Fetching news. Rendering page.');
          response.render("topheadlines", { headlines: newsResponses });
        })
        .catch((error) => {
          console.error("Error occurred while fetching news:", error);
          response.status(500).send({ status: "error", message: "Internal server error" });
        });
    }
  });
  
  
  app.get("/mediastack", (request, response)=>{
    const mediastack_response =  mediastack.response;
    //response.render("topheadlines", { headlines: newsResponses });
    response.render("mediastack", {news:mediastack_response});
    //response.send(json_res);
    //response.render("/mediastack", {response:response});
  });
 
//  function getNews (item,index) {
//   try {
//      console.log(`country: ${country}`);
//      newsapi.v2.topHeadlines({        
//        country: country,
//      }).then (response => {
//        console.log(response);
//        news_responses.push(response);
//      });
//   } catch (error) {
      // Handle error when calling the News API
//      console.error("Error occurred while calling News API:", error);
  
      // Send an error response back to the client
//      response.status(500).send({ status: "error", message: "Internal server error" });
//    }    
//  }

  app.post("/news-page", async (request, response) => {
    if (!request.body) {
      return response.status(400).send({ status: "not received" });
    }
  
    const { category, language, country } = request.body;
  
    try {
      const newsResponse = await newsapi.v2.topHeadlines({        
        category: category,
        language: language,
        country: country,
      });
  
      // Handle successful response    
      /*
        {
          status: "ok",
          articles: [...]
        }
      */
  
      // Send the response back to the client
      response.send(newsResponse);
    } catch (error) {
      // Handle error when calling the News API
      console.error("Error occurred while calling News API:", error);
  
      // Send an error response back to the client
      response.status(500).send({ status: "error", message: "Internal server error" });
    }
  });
  
/*
async function mailchimpPing(res) {
  try {
    const pingRes = await mailchimpClient.ping.get();
    console.log("Ping Response: " + JSON.stringify(pingRes));
    console.log("health status: " + pingRes.health_status);
    if (pingRes.health_status === "Everything's Chimpy!") {
      return true;
    } else {
      return false;
    }
  } catch (e) {
    res.sendFile(__dirname + "/");
    console.log("Error..." + e.message);
    return false;
  } finally {
    //console.log ('finally');
  }
}

async function getAllLists() {
  let allList = await mailchimpClient.lists.getAllLists();
  console.log("all lists: " + JSON.stringify(allList));
  return allList;
}
*/

function topHeadLines () {
    const url = `https://newsapi.org/v2/top-headlines?country=us&apiKey=${NEWS_API_KEY}`;
}

app.listen(process.env.PORT || 4000, () => {
  console.log(`app listening on port 4000`);
});
