const express = require('express');
const dotenv = require('dotenv');
const config = require('./config');


const app = express();

app.get('/health', (req, res) => {
    res.status(200).json({ status: 'OK' });
});

const port = process.env.PORT || config.port;
app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});