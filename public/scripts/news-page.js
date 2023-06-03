const { urlencoded } = require("express");

  function submitForm() {
    // Get the selected values
    const category = document.getElementById('selCategory').value;
    const language = document.getElementById('selLang').value;
    const country = document.getElementById('selCountry').value;
    
    // Create an object with the values
    const data = {
      category: category,
      language: language,
      country: country
    };

    // Send a POST request to your API endpoint
    fetch('news-page', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    })
      .then(response => response.json())
      .then (data => {
        //console.log (`status code: ${response.status}`);
        //console.log(`headers: ${response.headers}`);
       
        //handle the JSON data
        //console.log(data);    
          
        let result = "";  
        const {status, totalResults, articles} = data; 
        const sucessLabel = document.getElementById("sucess_label");
        sucessLabel.innerHTML=`Total Results: ${totalResults}`;
        for (var i=0; i < articles.length; i++) {
          const source = articles[i].source;

          const image_url = articles[i].urlToImage;
          const publish_time = articles[i].publishedAt;
          const news_title = articles[i].title;
          const author = articles[i].author;
          const article_url = articles[i].url;
          let news_content = articles[i].content;          
          if (typeof news_content === "string" && news_content.length > 100) {
           news_content = news_content.substring(0, 100) + "...";
          }
          const news_source = source.name;                
          result=result.concat('<div class="col mb-4">','<div class="card" style="max-width: 400px;">')
          if (image_url){
            result=result.concat('<img src="',image_url, '"class="card-img-top" alt="News Image">');
          }else{
            result=result.concat('<img src="images/newspaper.png"class="card-img-top" alt="News Image">');
          }
          if (!news_content) {
            news_content="";
          }

          result=result.concat ('<div class="card-body">',  
            '<h5 class="card-title"><a href="',article_url,'" target="_blank" />',news_title,'</h5>',           
            '<p class="card-text">',news_content,'</p></div>',
            '<div class="card-footer">',
            '<small class="text-muted">Source: ', news_source, '</small><br>',
            '<small class="text-muted">Published: ', publish_time,'</small></div></div></div>');
       }
       const news_container = document.getElementById('news-container');      
       news_container.innerHTML = result;
      })
        .catch(error => {
        console.error('Error:', error);
      });
  }

  function createNewsCards(articles) {
 const newsContainer = document.getElementById("news-container");

articles.forEach((article) => {
  const card = document.createElement("div");
  card.classList.add("card");
  card.style.maxWidth = "400px";

  const image = document.createElement("img");
  image.src = article.image_url;
  image.classList.add("card-img-top");
  image.alt = "News Image";

  const cardBody = document.createElement("div");
  cardBody.classList.add("card-body");

  const title = document.createElement("h5");
  title.classList.add("card-title");
  title.textContent = article.title;

  const content = document.createElement("p");
  content.classList.add("card-text");
  let newsContent = article.content;

  if (typeof newsContent === "object" && newsContent !== null) {
    newsContent = JSON.stringify(newsContent);
  }

  if (typeof newsContent === "string") {
    if (newsContent.length > 100) {
      newsContent = newsContent.substring(0, 100) + "...";
    }
  } else {
    newsContent = ""; // Set an empty string if it's not a string
  }

  content.textContent = newsContent;

  const cardFooter = document.createElement("div");
  cardFooter.classList.add("card-footer");

  const source = document.createElement("small");
  source.classList.add("text-muted");
  source.textContent = `Source: ${article.source}`;

  const publishTime = document.createElement("small");
  publishTime.classList.add("text-muted");
  publishTime.textContent = `Published: ${article.publishedAt}`;

  cardBody.appendChild(title);
  cardBody.appendChild(content);

  cardFooter.appendChild(source);
  cardFooter.appendChild(document.createElement("br"));
  cardFooter.appendChild(publishTime);

  card.appendChild(image);
  card.appendChild(cardBody);
  card.appendChild(cardFooter);

  newsContainer.appendChild(card);
});

  }
    