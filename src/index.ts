import express from "express"
import * as routes from "./routes";

const app = express();
const port = 8880;

routes.register( app );

// start the Express server
app.listen( port, () => {
    console.log( `server started at http://localhost:${ port }` );
} );
