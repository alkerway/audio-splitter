import cors from "cors"
import express from "express"
import * as routes from "./routes";

const app = express()
const port = 8880

app.use((req, res, next) => {
    res.setHeader("Access-Control-Allow-Origin", "http://localhost:3000")
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS, PUT, PATCH, DELETE")
    next()
});

routes.register( app )
app.use(cors())
// start the Express server
app.listen( port, () => {
    console.log( `server started at http://localhost:${ port }` );
} );
