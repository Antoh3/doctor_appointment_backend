const express = require("express");
const AppointmentRouter = express.Router();
const {
  createAppointment,
  updateAppointmentById,
  deleteAppointmentById,
  getPatientAppointmentById,
  getDoctorAppointmentById,
  rescheduleAppointment,
  cancelAppointment,
  approveAppointment,
  getAppointmentStatus,
  completeAppointment
} = require("../Controllers/AppointmentController");
const Auth = require("../Middlewares/JWT.authentication");

// Create a new appointment
AppointmentRouter.post("/bookAppointment",Auth.authenticateToken, createAppointment);

// Get a single appointment by ID
AppointmentRouter.get("/doctor",Auth.authenticateToken, getDoctorAppointmentById);
AppointmentRouter.get("/patient",Auth.authenticateToken, getPatientAppointmentById);
AppointmentRouter.get("/count",Auth.authenticateToken,getAppointmentStatus)

// Update an appointment by ID
AppointmentRouter.put("/:appointmentId",  updateAppointmentById); 
AppointmentRouter.patch("/rescheduleappointment/:appointmentId",rescheduleAppointment)  
AppointmentRouter.patch("/approveappointment/:appointmentId",approveAppointment)  
AppointmentRouter.patch("/cancelappointment/:appointmentId",cancelAppointment)  
AppointmentRouter.patch("/completeappointment/:appointmentId",completeAppointment)  

// Delete an appointment by ID
AppointmentRouter.delete("/:appointmentId",  deleteAppointmentById);


module.exports = AppointmentRouter;
