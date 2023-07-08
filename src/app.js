const {ScoreController} = require("./api");
const express = require('express')
const path = require('path')
var cors = require("cors")

const app = express()
const port = process.env.PORT || 3001;


app.use(express.urlencoded({extended: true}));
app.use(cors());


// routes
app.get('/', (req, res) => {
  res.status(200).json({status: true, msg:"the is demo msg"});
})


app.use("/cbz", ScoreController.cricbuzz);


app.get('*/:val', (req, res) => {
  res.status(404).json({status: false, errMsg: `Opps! '${req.params.val}' Page Not Found!`
  })
})


app.listen(port, () => {
  console.log(`Server running on port:${port}!`)
})






