const express = require("express");
// const cors = require("cors");
const dotenv = require("dotenv");
const rootRoute = require("./route/root-route/rootRoute") 

const app = express();
process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
//middleware to parse json
app.use(express.json());

//environment file
dotenv.config();

//routes
app.use("/" , rootRoute) ;

const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`Listening on port ${port}`))
