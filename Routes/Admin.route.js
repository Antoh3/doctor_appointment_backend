const express = require("express");
const {
    adminLogin,
    adminRegister,
    updateAppointmentById,
    rescheduleAppointment,
    approveAppointment,
    cancelAppointment,
    completeAppointment,
    deleteAppointmentById,
    getAppointments,
    getAppointmentStatus,
    updatePatient,
    getAllPatients,
    deletePatientById,
    addDoctor,
    deleteDoctor,
    updateDoctor,
    getAllDoctors,
    registerUser,
    allAdminData,
    pendingRequests,
    completedRequests,
    doctorsData,
    patientData,
    appointmenstCount,
    ambulanceRequestCount,
    patientDataCount,
    monthlyVisists
} = require('../Controllers/AdminController')
const { authenticateToken  }= require("../Middlewares/JWT.authentication");
// const { registerPatient } = require("../Controllers/PatientController");


const AdminRouter = express.Router()


AdminRouter.post("/login",adminLogin)
AdminRouter.post("/register",adminRegister)
AdminRouter.post("/adddoctor",addDoctor)
AdminRouter.post("/addpatient",authenticateToken,registerUser)

AdminRouter.get("/appointments",authenticateToken,getAppointments)  
AdminRouter.get("/count",authenticateToken,getAppointmentStatus)  
AdminRouter.get("/allpatients",authenticateToken,getAllPatients)  
AdminRouter.get("/alldoctors",authenticateToken,getAllDoctors)  
AdminRouter.get("/alldata",authenticateToken,allAdminData)  
AdminRouter.get("/allpendingrequests",authenticateToken,pendingRequests)  
AdminRouter.get("/allcompletedrequests",authenticateToken,completedRequests)
AdminRouter.get("/doctorscount",authenticateToken,doctorsData)
AdminRouter.get("/patientscount",authenticateToken,patientData)
AdminRouter.get("/appointmentcount",authenticateToken,appointmenstCount)
AdminRouter.get("/ambulanceRequestCount",authenticateToken,ambulanceRequestCount)
AdminRouter.get("/patientdatacaount",authenticateToken,patientDataCount)
AdminRouter.get("/monthlyvisits",authenticateToken,monthlyVisists)



// Update  by ID
AdminRouter.put("/:appointmentId",authenticateToken,updateAppointmentById); 
AdminRouter.patch("/rescheduleappointment/:appointmentId",authenticateToken,rescheduleAppointment)  
AdminRouter.patch("/approveappointment/:appointmentId",authenticateToken,approveAppointment)  
AdminRouter.patch("/cancelappointment/:appointmentId",authenticateToken,cancelAppointment)  
AdminRouter.patch("/completeappointment/:appointmentId",authenticateToken,completeAppointment)  
AdminRouter.patch("/updatedoctor/:doctorId",updateDoctor)  
AdminRouter.patch("/updatepatient/:patientId",authenticateToken,updatePatient)  

// Delete  by ID
AdminRouter.delete("/deleteappointment/:appointmentId",authenticateToken,deleteAppointmentById);
AdminRouter.delete("/doctor/:doctorId",authenticateToken,deleteDoctor);
AdminRouter.delete("/patient/:patientId",authenticateToken,deletePatientById);


module.exports = AdminRouter