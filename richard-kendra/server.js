'use strict';

const fs = require('fs');
const express = require('express');
const pg = require('pg');

const PORT = process.env.PORT || 3000;
const app = express();

// Windows and Linux users: You should have retained the user/password from the pre-work for this course.
// Your OS may require that your conString is composed of additional information including user and password.
// const conString = 'postgres://kendragon:Zip9tape!@localhost:5432/kilovolt';
const conString = 'postgres://rich:6641@localhost:5432/kilovolt';

// Mac:
// const conString = 'postgres://localhost:5432';

const client = new pg.Client(conString);

// REVIEW: Use the client object to connect to our DB.
client.connect();


// REVIEW: Install the middleware plugins so that our app can parse the request body
app.use(express.json());
app.use(express.urlencoded());
app.use(express.static('./public'));


// REVIEW: Routes for requesting HTML resources
app.get('/new-article', (request, response) => {
  // COMMENT: What number(s) of the full-stack-diagram.png image correspond to the following line of code? Which method of article.js, if any, is interacting with this particular piece of `server.js`? What part of CRUD, if any, is being enacted/managed by this particular piece of code?
  // The following line of code matches #5 in the full-stack-diagram.png. It appears that no methods in article.js interact with this piece of server.js. This piece also is not a part of CRUD, because it's just serving the new.html page and does not do anything with the app's data in the database.
  response.sendFile('new.html', {root: './public'});
});


// REVIEW: Routes for making API calls to use CRUD Operations on our database
app.get('/articles', (request, response) => {
  // COMMENT: What number(s) of the full-stack-diagram.png image correspond to the following line of code? Which method of article.js is interacting with this particular piece of `server.js`? What part of CRUD is being enacted/managed by this particular piece of code?
  // This line of code matches #3 & #5 in the diagram, which is making a query to the database and sending a response. This interacts with the method fetchAll() in article.js, which asks for all the article data. This corresponds to the "R" in CRUD, because it's retrieving data from the database.
  client.query('SELECT * FROM articles;')
    .then(function(result) {
      response.send(result.rows);
    })
    .catch(function(err) {
      console.error(err)
    })
});

app.post('/articles', (request, response) => {
  // COMMENT: What number(s) of the full-stack-diagram.png image correspond to the following line of code? Which method of article.js is interacting with this particular piece of `server.js`? What part of CRUD is being enacted/managed by this particular piece of code?
  // This matches #3 & #5 in the diagram, making a query to the database. It's used by Article.insertRecord() to create a new record for an article in the DB. This corresponds to the 'C' in CRUD, since it CREATES a new entry in the DB.
  let SQL = `
    INSERT INTO articles(title, author, author_url, category, published_on, body)
    VALUES ($1, $2, $3, $4, $5, $6);
  `;

  let values = [
    request.body.title,
    request.body.author,
    request.body.author_url,
    request.body.category,
    request.body.published_on,
    request.body.body
  ]

  client.query( SQL, values )
    .then(function() {
      response.send('insert complete')
    })
    .catch(function(err) {
      console.error(err);
    });
});

app.put('/articles/:id', (request, response) => {
  // COMMENT: What number(s) of the full-stack-diagram.png image correspond to the following line of code? Which method of article.js is interacting with this particular piece of `server.js`? What part of CRUD is being enacted/managed by this particular piece of code?
  // This also matches #3 & #5 in the diagram, since it queries the DB and responds to the client. It's used by Article.updateRecord to update a record in the DB. This matches the 'U' in CRUD, since it's updating the record.

  let SQL = `UPDATE articles
  SET
    title=$1,
    author=$2,
    author_url=$3,
    category=$4,
    published_on=$5,
    body=$6
  WHERE article_id=$7;`;

  let values = [
    request.body.title,
    request.body.author,
    request.body.author_url,
    request.body.category,
    request.body.published_on,
    request.body.body,
    request.params.id
  ];

  client.query( SQL, values )
    .then(() => {
      response.send('update complete')
    })
    .catch(err => {
      console.error(err);
    });
});

app.delete('/articles/:id', (request, response) => {
  // COMMENT: What number(s) of the full-stack-diagram.png image correspond to the following line of code? Which method of article.js is interacting with this particular piece of `server.js`? What part of CRUD is being enacted/managed by this particular piece of code?
  // This matches #3 and #5 in the diagram. It's making a request to the DB to delete the article with the given id and responds to the client. This is used by the method Article.deleteRecord() in article.js. This matches the 'D' in CRUD, (destroy a record).

  let SQL = `DELETE FROM articles WHERE article_id=$1;`;
  let values = [request.params.id];

  client.query( SQL, values )
    .then(() => {
      response.send('Delete complete')
    })
    .catch(err => {
      console.error(err);
    });
});

app.delete('/articles', (request, response) => {
  // COMMENT: What number(s) of the full-stack-diagram.png image correspond to the following line of code? Which method of article.js is interacting with this particular piece of `server.js`? What part of CRUD is being enacted/managed by this particular piece of code?
  // This also matches #'s 3 and 5 in the diagram since it queries the DB and sends a response to the client. It's used by Article.truncateTable to either delete or shorten a table in the DB. This corresponds to the 'D' in CRUD, destroy a table.

  let SQL = '';
  client.query( SQL )
    .then(() => {
      response.send('Delete complete')
    })
    .catch(err => {
      console.error(err);
    });
});

// COMMENT: What is this function invocation doing?
// This first checks if there's a table in the DB called 'articles.' If the table does not exists, it creates it and then calls loadArticles() to load the table with the article data from hackerIpsum.json
loadDB();

app.listen(PORT, () => {
  console.log(`Server started on port ${PORT}!`);
});


//////// ** DATABASE LOADER ** ////////
////////////////////////////////////////
function loadArticles() {
  // COMMENT: What number(s) of the full-stack-diagram.png image correspond to the following line of code? Which method of article.js is interacting with this particular piece of `server.js`? What part of CRUD is being enacted/managed by this particular piece of code?
  // This matches #3, querying the DB. It does not interacti with article.js. It matches the 'C' in CRUD, create.

  let SQL = 'SELECT COUNT(*) FROM articles';
  client.query( SQL )
    .then(result => {
    // REVIEW: result.rows is an array of objects that PostgreSQL returns as a response to a query.
    // If there is nothing on the table, then result.rows[0] will be undefined, which will make count undefined. parseInt(undefined) returns NaN. !NaN evaluates to true.
    // Therefore, if there is nothing on the table, line 143 will evaluate to true and enter into the code block.
      if(!parseInt(result.rows[0].count)) {
        fs.readFile('./public/data/hackerIpsum.json', 'utf8', (err, fd) => {
          JSON.parse(fd).forEach(ele => {
            let SQL = `
              INSERT INTO articles(title, author, author_url, category, published_on, body)
              VALUES ($1, $2, $3, $4, $5, $6);
            `;
            let values = [ele.title, ele.author, ele.author_url, ele.category, ele.published_on, ele.body];
            client.query( SQL, values );
          })
        })
      }
    })
}

function loadDB() {
  // COMMENT: What number(s) of the full-stack-diagram.png image correspond to the following line of code? Which method of article.js is interacting with this particular piece of `server.js`? What part of CRUD is being enacted/managed by this particular piece of code?
  // This matches #3 in the diagram. It doesn't interact with article.js. It matches the 'C' in CRUD, create.
  client.query(`
    CREATE TABLE IF NOT EXISTS articles (
      article_id SERIAL PRIMARY KEY,
      title VARCHAR(255) NOT NULL,
      author VARCHAR(255) NOT NULL,
      author_url VARCHAR (255),
      category VARCHAR(20),
      published_on DATE,
      body TEXT NOT NULL);`
  )
    .then(() => {
      loadArticles();
    })
    .catch(err => {
      console.error(err);
    });
}
