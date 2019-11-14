import * as express from "express";
import * as Api from "../api/audiosplit";

export const register = ( app: express.Application ) => {
    app.get( "/", ( req: any, res ) => {
        res.send("ayyyyy")
    } );
    app.get("/upload", Api.upload)
};
