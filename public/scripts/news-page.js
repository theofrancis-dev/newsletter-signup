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
        for (var i=0; i < articles.length; i++) {
          const source = articles[i].source;

          const image_url = articles[i].urlToImage;
          const publish_time = articles[i].publishedAt;
          const news_title = articles[i].title;
          const author = articles[i].author;
          const article_url = articles[i].url;
          const news_content = articles[i].content;
          const news_source = source.name;

          //console.log(`source id: ${source.id}`);
          //console.log(`source: ${news_source}`);
          //console.log(`author: ${author}`);
          //console.log(`title: ${news_title}`);
          //console.log(`url: ${article_url}`);
          //console.log(`urlToImage: ${image_url}`);
          //console.log(`publishedAt: ${publish_time}`);
          //console.log(`content: ${news_content}`);
          
          result=result.concat('<div class="col mb-4">','<div class="card" style="max-width: 400px;">')
          result=result.concat('<img src="',image_url, '"class="card-img-top" alt="News Image">');
          result=result.concat ('<div class="card-body">',  
            '<h5 class="card-title">',news_title,'</h5>',
            '<p class="card-text">',news_content,'</p></div>',
            '<div class="card-footer">',
            '<small class="text-muted">Source: ', news_source, '</small><br>',
            '<small class="text-muted">Published: ', publish_time,'</small></div></div></div>');
       }
       const news_container = document.getElementById('news-container');
       //console.log(news_container);
       news_container.innerHTML = result;
      })
        .catch(error => {
        console.error('Error:', error);
      });
  }

