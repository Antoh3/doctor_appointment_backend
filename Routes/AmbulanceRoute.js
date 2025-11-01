const express = require('express');
const  AmbulanceRouter = express.Router();
const {
    ambulanceRequest,
    createAmbulance,
    trackAmbulance,
    trackAmbulance1,
    trackAmbulance2,
    getAllAmbulances,
    getAllAmbulanceRequests,
    getAmbulanceById,
    updateAmbulance,
    approveAmbulance,
    approveAmbulanceRequest,
    getAmbulancetStatus,
    getAmbulancetRequestStatus,
    getAllAmbulanceRequestsAdmin,
    cancelRequestAdmin,
    acceptRequestAdmin,
    completeRequestAdmin,
    changeAmbulanceStatus,
    deleteAmbulance
} = require("../Controllers/AmbulanceController")
const {loginPatient1} = require("../Controllers/PatientController")
const { authenticateToken }= require("../Middlewares/JWT.authentication");

AmbulanceRouter.get("/getall",getAllAmbulances);
AmbulanceRouter.post("/login", loginPatient1);
AmbulanceRouter.post("/createambulance",createAmbulance);
AmbulanceRouter.get("/ambulancestatus",getAmbulancetStatus);
AmbulanceRouter.get("/requeststatus",getAmbulancetRequestStatus);
AmbulanceRouter.get("/ambulancerequests",authenticateToken,getAllAmbulanceRequests);
AmbulanceRouter.get("/ambulancerequests",authenticateToken,getAllAmbulanceRequests);
AmbulanceRouter.get("/ambulancerequestsadmin",getAllAmbulanceRequestsAdmin);

AmbulanceRouter.get("/ambulance/:ambulanceId",getAmbulanceById);
AmbulanceRouter.patch("/ambulance/:ambulanceId",approveAmbulance);
AmbulanceRouter.put("/updateambulance/:ambulanceId",updateAmbulance);
AmbulanceRouter.patch("/updateambulance1/:ambulanceId",updateAmbulance);
AmbulanceRouter.patch("/updateambulancestatus/:ambulanceId",changeAmbulanceStatus);
AmbulanceRouter.patch("/approverequest/:ambulanceRequestId",approveAmbulanceRequest)
AmbulanceRouter.patch("/cancelrequestadmin/:ambulanceRequestId", cancelRequestAdmin);
AmbulanceRouter.patch("/accepterequestadmin/:ambulanceRequestId", acceptRequestAdmin);
AmbulanceRouter.patch("/completerequestadmin/:ambulanceRequestId", completeRequestAdmin);
AmbulanceRouter.delete("/deleteambulance/:ambulanceId", deleteAmbulance);


AmbulanceRouter.get("/ambulancerequests",authenticateToken,getAllAmbulanceRequests);
AmbulanceRouter.post("/requestambulance",authenticateToken,ambulanceRequest);
// AmbulanceRouter.get("/trackambulance/:requestId",authenticateToken,trackAmbulance);
AmbulanceRouter.get("/trackambulance/:requestId",authenticateToken,trackAmbulance2);

module.exports = AmbulanceRouter;