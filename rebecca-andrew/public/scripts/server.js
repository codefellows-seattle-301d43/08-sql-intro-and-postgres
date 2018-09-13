const express = require('express');
const PORT = process.env.PORT || 3000;
const app = express();

// POST middleware from yesterday's starter code
app.use(express.urlencoded({ extended: true }));

// serves up public directory as root for static files
app.use(express.static('public'));

app.listen(PORT => {
  console.log(`we are listening to things on port ${PORT}!!`);
})