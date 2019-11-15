import * as express from "express";
import * as Api from "../api";

export const register = ( app: express.Application ) => {
    app.post("/checkstatus", Api.checkstatus)
    app.post("/getfiles", Api.getfiles)
    app.post("/upload", Api.upload)
}
