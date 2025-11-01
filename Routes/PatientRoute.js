const express = require("express");
const {
  registerUser,
  registerPatient,
  loginPatient,
  allPatients,
  currentUser,
  getPatientById,
  updatePatientById,
  deletePatientById,
  updateAppointment,
  searchDoctors,
  loginPatient1,
  cancelAppointment,
  cancelRequest,
  rescheduleAppointment,
  cancelRequestAdmin,
  acceptRequestAdmin,
  completeRequestAdmin
} = require("../Controllers/PatientController");
const { authenticateToken  }= require("../Middlewares/JWT.authentication");
const { PatientAuth } = require("../Middlewares/RoleBased.authentication");

const PatientRouter = express.Router();
const multer =  require('multer')
const path = require('path')

// Set up storage for file uploads
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, 'uploads/');
    },
    filename: function (req, file, cb) {
      cb(null, Date.now() + ' - ' + file.originalname);
    },
  });
  
  const upload = multer({ storage: storage });
  
  // Define which fields to accept for file uploads
  const uploadFields = upload.fields([
    { name: 'identificationDocument', maxCount: 1 },
    // Add more fields if necessary
  ]);



// Register/login/search a new patient/doctor
PatientRouter.post("/user", registerUser)
PatientRouter.post("/login", loginPatient);
PatientRouter.post("/login1", loginPatient1);
PatientRouter.get("/search",searchDoctors)
PatientRouter.get("/patients",allPatients)

// Get a patient by ID
PatientRouter.get("/currentuser",authenticateToken,currentUser);
PatientRouter.get("/patient",authenticateToken, getPatientById);
PatientRouter.post("/register",authenticateToken,registerPatient);
PatientRouter.put("/updatePatient",authenticateToken,uploadFields,updatePatientById);

// PatientRouter.patch("/:patientId", updatePatientById);
PatientRouter.patch("/appointment/:patientId", updateAppointment);
PatientRouter.patch("/cancelappointment/:appointmentId", cancelAppointment);
PatientRouter.patch("/rescheduleappointment/:appointmentId", rescheduleAppointment);
PatientRouter.patch("/cancelrequest/:ambulanceRequestId", cancelRequest);
PatientRouter.patch("/cancelrequestadmin/:ambulanceRequestId", cancelRequestAdmin);

// Delete a patient by ID
PatientRouter.delete("/deletePatient",authenticateToken,deletePatientById);

module.exports = PatientRouter;
