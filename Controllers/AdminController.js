const { generateToken, generateRefreshToken } = require('../Middlewares/JWT.authentication');
const prisma = require('../prisma/prismaClient')
const bcrypt = require('bcrypt')


const adminRegister = async (req, res) => {
    const { email, name, password } = req.body;

    const existingAdmin = await prisma.admin.findUnique({
        where: {
            email: email
        }
    })

    if (existingAdmin) {
        return res.status(400).json("Admin already exixts")
    }

    const saltrounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltrounds)

    const superadmin = await prisma.admin.create({
        data: {
            name,
            email,
            password: hashedPassword
        }
    })

    res.status(200).json({ superadmin, message: "Admin account created" })
}

const adminLogin = async (req, res) => {
    try {
        const { email, password } = req.body;

        const admin = await prisma.admin.findUnique({
            where: {
                email: email
            }
        })

        if (!admin) {
            return res.status(404).json({ message: "Admin does not exist" })
        }

        const comparePassword = await bcrypt.compare(password, admin.password)
        if (!comparePassword) {
            res.status(400).json({ message: "password mismatch" })
        }

        const accessToken = generateToken(admin.id, 'super_admin');
        const refreshToken = generateRefreshToken(admin.id, 'super_admin')


        res.status(200).json({ message: "Login successful", accessToken, refreshToken })

    } catch (error) {
        // Handle errors and send an error response
        console.error(error);
        res.status(500).json({ message: 'Internal server error' });
    }
}

const updateAppointmentById = async (req, res) => {

    try {
        const appointmentId = req.params.appointmentId;
        const { schedule, status, reason, cancelationReason, primaryPhysician } = req.body;
        const userRole = req.userRole;

        let filter = {}

        if (userRole !== 'super_admin') {
            return res.status(403).json({ message: "Forbidden" });
        }

        // Parse schedule to a valid Date object if it's a string
        const parsedSchedule = schedule ? new Date(schedule) : undefined;
        // Validate date format
        if (parsedSchedule && isNaN(parsedSchedule.getTime())) {
            return res.status(400).json({ message: 'Invalid schedule date format' });
        }

        // Check if the appointment with the given ID exists
        const existingAppointment = await prisma.appointment.findUnique({
            where: {
                id: appointmentId
            },
            include: {
                patient: true,
                doctor: true
            }
        })
        if (!existingAppointment) {
            return res.status(404).json({ message: 'Appointment not found' });
        }


        // Extract updated appointment data from req.body
        const updatedAppointment = await prisma.appointment.update({
            where: {
                id: appointmentId
            },
            data: {
                schedule: parsedSchedule || existingAppointment.schedule,
                status: status || existingAppointment.status,
                reason: reason || existingAppointment.reason,
                primaryPhysician: primaryPhysician || existingAppointment.primaryPhysician,
                cancelationReason: cancelationReason || existingAppointment.cancelationReason
            }
        })


        // Send a success response with the updated appointment data
        res.status(200).json(updatedAppointment);
    } catch (error) {
        // Handle errors and send an error response
        console.error(error);
        res.status(500).json({ message: 'Internal server error' });
    }
};


const deleteAppointmentById = async (req, res) => {
    try {
        const appointmentId = req.params.appointmentId;
        const userRole = req.userRole;

        let filter = {}

        if (userRole !== 'super_admin') {
            return res.status(403).json({ message: "Forbidden" });
        }
        
        const existingAppointment = await prisma.appointment.findUnique({
            where: {
                id: appointmentId
            }
        })
        if (!existingAppointment) {
            return res.status(404).json({ message: 'Appointment not found' });
        }


        await prisma.appointment.delete({
            where: {
                id: existingAppointment.id
            }
        })


        res.status(200).json({ message: 'Appointment deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Internal server error' });
    }
};

const rescheduleAppointment = async (req, res) => {
    const { appointmentId } = req.params;
    const { schedule } = req.body;
    const userRole = req.userRole;

    let filter = {}

    if (userRole !== 'super_admin') {
        return res.status(403).json({ message: "Forbidden" });
    }


    const findAppintment = await prisma.appointment.findUnique({
        where: {
            id: appointmentId
        }
    })

    if (!findAppintment) {
        return res.status(404).json({ message: "appintmentId not found" });
    }

    const updatedAppointment = await prisma.appointment.update({
        where: {
            id: appointmentId
        },
        data: {
            schedule: new Date(schedule),
            status: 'rescheduled'
        }
    })
    console.log(updatedAppointment)
    return res.status(200).json(updatedAppointment)
}

const approveAppointment = async (req, res) => {
    const { appointmentId } = req.params;
    const { status } = req.body;
    const userRole = req.userRole;


    let filter = {}

    if (userRole !== 'super_admin') {
        return res.status(403).json({ message: "Forbidden" });
    }


    const findAppintment = await prisma.appointment.findUnique({
        where: {
            id: appointmentId
        }
    })

    if (!findAppintment) {
        return res.status(404).json({ message: "appintmentId not found" });
    }

    const updatedAppointment = await prisma.appointment.update({
        where: {
            id: appointmentId
        },
        data: {
            status
        }
    })
    return res.status(200).json(updatedAppointment)
}

const cancelAppointment = async (req, res) => {
    const { appointmentId } = req.params;
    const { status, cancelationReason } = req.body;
    const userRole = req.userRole;


    let filter = {}

    if (userRole !== 'super_admin') {
        return res.status(403).json({ message: "Forbidden" });
    }


    const findAppintment = await prisma.appointment.findUnique({
        where: {
            id: appointmentId
        }
    })

    if (!findAppintment) {
        return res.status(404).json({ message: "appintmentId not found" });
    }

    const updatedAppointment = await prisma.appointment.update({
        where: {
            id: appointmentId
        },
        data: {
            status: "canceled_by_admin",
            cancelationReason
        }
    })
    return res.status(200).json(updatedAppointment)
}

const completeAppointment = async (req, res) => {
    const { appointmentId } = req.params;
    // const { status } = req.body;

    const userRole = req.userRole;

    let filter = {}

    if (userRole !== 'super_admin') {
        return res.status(403).json({ message: "Forbidden" });
    }


    const findAppintment = await prisma.appointment.findUnique({
        where: {
            id: appointmentId
        }
    })

    if (!findAppintment) {
        return res.status(404).json({ message: "appintmentId not found" });
    }

    const updatedAppointment = await prisma.appointment.update({
        where: {
            id: appointmentId
        },
        data: {
            status: "completed"
        }
    })
    return res.status(200).json(updatedAppointment)
}

const getAppointmentStatus = async (req, res) => {
    // const userId = req.userId;
    const userRole = req.userRole;

    let filter = {}

    if (userRole !== 'super_admin') {
        return res.status(403).json({ message: "Forbidden" });
    }

    // if(userRole === 'doctor'){
    //     filter.doctorId = userId
    // }else if (userRole === 'patient') {
    //     filter.patientId = userId
    // }else{
    //     return res.status(403).json({message:"Unauthorized"});
    // }

    const count = await prisma.appointment.groupBy({
        by: ['status'],
        _count: { status: true },
    })

    const total = await prisma.appointment.count()

    const formattesStatus = count.reduce((acc, curr) => {
        acc[curr.status] = curr._count.status;
        return acc;
    }, {})

    res.status(200).json({
        total: total,
        formattesStatus
    })
}

const getAppointments = async (req, res) => {
    try {
        if (req.userRole !== "super_admin") {
            return res.status(403).json({ message: "Access forbidden" })
        }

        const appointments = await prisma.appointment.findMany({
            select: {
                id: true,
                schedule: true,
                status: true,
                // primaryPhysician: true,
                patientName: true,
                reason: true,
                // cancelationReason: true
            },
            orderBy: {
                schedule: "asc"
            }
        })
        res.status(200).json(appointments)
    } catch (error) {
        // Handle errors and send an error response
        console.error(error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

const registerUser = async (req, res) => {
    try {
        // if (req.userRole !== "super_admin") {
        //     return res.status(403).json({ message: "Operation forbidden" })
        // }


        const { firstName, lastName, email, phoneNumber, birthDate,
            gender, idNumber, permanentLocation, password
        } = req.body;

        //  console.log(req.body);


        const existingUser = await prisma.patient.findUnique({
            where: {
                email: email,
            }
        });
        
        if (existingUser) {
            return res.status(400).json({ message: 'Email already exists!', status: false });
        }

        // const saltRounds = 10;
        // const hashedPassword = await bcrypt.hash(password, saltRounds)

        const newUser = await prisma.patient.create({
            data: {
                firstName,
                lastName,
                email,
                phoneNumber,
                birthDate,
                gender,
                idNumber,
                permanentLocation,
                // password: hashedPassword,
            },
        });

        // console.log(newUser);

        // const token = generateToken(newUser)
        res.status(200).json({ newUser, message: "User registered" });
        // console.log(newUser);

    } catch (error) {
        console.error(error)
        res.status(500).json({ message: "Internal server error" })
    }
}

const updatePatient = async (req, res) => {
    const patientId = req.params.patientId;

    try {
        if (req.userRole !== "super_admin") {
            return res.status(403).json({ message: "Operation forbidden" })
        }
        const { firstName, lastName, email, phoneNumber, birthDate,
            gender, idNumber, permanentLocation, password
        } = req.body;

        const existingUser = await prisma.patient.findUnique({
            where: {
                id: patientId
            }
        })

        if (!existingUser) {
            return res.status(404).json({ message: "User not found" })
        }

        const updatedUser = await prisma.patient.update({
            where: {
                id: existingUser.id
            },
            data: {
                firstName,
                lastName,
                email,
                phoneNumber,
                birthDate,
                gender,
                idNumber,
                permanentLocation,
                password
            }
        })

        res.status(200).json({ message: "User updated", updatedUser })
    } catch (error) {
        return res.status(500).json({ message: "Internal server error please try again" })
    }
}

const getAllPatients = async (req, res) => {
    try {
        if (req.userRole !== "super_admin") {
            return res.status(403).json({ message: "Operation forbidden" })
        }

        const patients = await prisma.patient.findMany()

        res.status(200).json({ patients });
    } catch (error) {
        return res.status(500).json({ message: "Internal server error" })
    }
}

const deletePatientById = async (req, res) => {
    try {
        const patientId = req.params;


        if (req.userRole !== "super_admin") {
            return res.status(403).json({ message: "Operation forbidden" })
        }
        // Find the patient by ID
        const patient = await prisma.patient.findUnique({
            where: {
                id: patientId
            }
        })

        if (!patient) {
            return res.status(404).json({ message: 'Patient not found' });
        }

        // Delete the patient from the database
        await prisma.patient.delete({
            where: {
                id: patient.id,
            }
        })

        // Send a success response
        res.status(200).json({ message: 'Patient deleted successfully' });
    } catch (error) {
        // Handle errors and send an error response
        console.error(error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

const addDoctor = async (req, res) => {
    try {
        const { firstName, lastName, phone, gender, email,
            specialization, licenseNumber,
            registrationNumber } = req.body;

        // if (req.userRole !== "super_admin") {
        //     return res.status(403).json({ message: "Operation forbidden" })
        // }


        const existingDoctor = await prisma.doctor.findUnique({
            where: {
                email: email
            }
        });
        if (existingDoctor) {
            return res.status(400).json({ message: 'Email already exists!', status: false });
        }

        // const existingLicencseNumber = await prisma.doctor.findUnique({
        //     where:{
        //         licenseNumber:licenseNumber
        //     }
        // })
        // if (existingLicencseNumber) {
        //     return  res.status(400).json({message:"License number already taken"})
        // }

        // const existingRegistrationNumber = await prisma.doctor.findUnique({
        //     where:{
        //         registrationNumber: registrationNumber
        //     }
        // })
        // if (existingRegistrationNumber) {
        //     return res.status(400).json({message:"user with the registrationnumber exists"})
        // }




        // const saltRounds = 10; // Number of salt rounds (adjust as needed)
        // const hashedPassword = await bcrypt.hash(req.body.password, saltRounds);


        const newDoctor = await prisma.doctor.create({
            data: {
                firstName,
                lastName,
                phone,
                gender,
                email,
                specialization,
                licenseNumber,
                registrationNumber,
                // password: hashedPassword
            }
        });

        res.status(200).json({ newDoctor, message: "doctor added", status: true });
    } catch (error) {
        // Handle errors and send an error response
        console.error(error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

const deleteDoctor = async (req, res) => {
    try {
        const { doctorId } = req.params;

        if (req.userRole !== "super_admin") {
            return res.status(403).json({ message: "Operation forbidden" })
        }

        const exist = await prisma.doctor.findUnique({
            where: {
                id: doctorId
            }
        })

        if (!exist) {
            return res.status(404).json({ message: "Doctor doesnot exist" })
        }

        // Check if the doctor with the given ID exists
        const doctor = await prisma.doctor.delete({
            where: {
                id: exist.id
            }
        })

        if (!doctor) {
            return res.status(404).json({ message: 'Doctor not found' });
        }

        res.status(200).json({ message: 'Doctor deleted successfully' });
    } catch (error) {
        // Handle errors and send an error response
        console.error(error);
        res.status(500).json({ message: 'Internal server error' });
    }
};


const updateDoctor = async (req, res) => {
    try {
        const doctorId = req.params.doctorId;

        const { firstName, lastName, phone, gender, email,
            specialization, licenseNumber,
            registrationNumber } = req.body;

        // if (req.userRole !== "super_admin") {
        //     return res.status(403).json({ message: "Operation forbidden" })
        // }

        const exist = await prisma.doctor.findUnique({
            where: {
                id: doctorId
            }
        })

        if (!exist) {
            return res.status(404).json({ message: "Doctor doesnot exist" })
        }


        const doctor = await prisma.doctor.update({
            where: {
                id: exist.id
            },
            data: {
                firstName,
                lastName,
                phone,
                gender,
                specialization,
                licenseNumber,
                email,
                registrationNumber,
            }
        })

        if (!doctor) {
            return res.status(404).json({ message: 'Doctor not found' });
        }

        res.status(200).json({ message: "doctor updated sucessfully", doctor });
    } catch (error) {
        // Handle errors and send an error response
        console.error(error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

const getAllDoctors = async (req, res) => {
    try {

        if (req.userRole !== "super_admin") {
            return res.status(403).json({ message: "Operation forbidden" })
        }

        const doctors = await prisma.doctor.findMany();
       
        res.status(200).json({doctors});
    } catch (error) {
        res.status(500).json({ message: 'Internal server error' });
    }
};

const allAdminData = async (req,res) => {
    if (req.userRole !== "super_admin") {
        return res.status(403).json({ message: "Operation forbidden" })
    }

    const patients = await prisma.patient.count()
    const doctors = await prisma.doctor.count()
    const appointments = await prisma.appointment.count()
    const requests = await prisma.ambulanceRequest.count()
    const ambulances = await prisma.ambulance.count()

    return res.status(200).json({
        patients:patients,
        doctors:doctors,
        appointments:appointments,
        requests:requests,
        ambulances:ambulances
    });
}

const pendingRequests = async (req,res) => {
    if (req.userRole !== "super_admin") {
        return res.status(403).json({ message: "Operation forbidden" })
    }

    const pendingrequest = await prisma.ambulanceRequest.findMany({
        where:{
            status:"pending"
        },
        select:{
            id:true,
            aidCarType:true,
            status:true,
            patient:{
                select:{
                    firstName:true,
                    lastName:true
                }
            },
            ambulance:{
                select:{
                    name:true,
                    owner:true
                }
            }
        }
    })

    
    return res.status(200).json(pendingrequest)
}

const completedRequests = async (req,res) => {
    if (req.userRole !== "super_admin") {
        return res.status(403).json({ message: "Operation forbidden" })
    }

    const completedrequest = await prisma.ambulanceRequest.findMany({
        where:{
            status:"completed"
        },
        select:{
            id:true,
            aidCarType:true,
            status:true,
            patient:{
                select:{
                    firstName:true,
                    lastName:true
                }
            },
            ambulance:{
                select:{
                    name:true,
                    owner:true
                }
            }
        }
    })

    return res.status(200).json(completedrequest)
}

const doctorsData = async (req,res) => {
    if (req.userRole !== "super_admin") {
        return res.status(403).json({ message: "Operation forbidden" })
    }

    const assingedDoctors = await prisma.doctor.count({
        where:{
            id:{
                in:(
                    await prisma.appointment.findMany({
                        where:{
                            status:{not:"completed"}
                        },
                        select:{doctorId:true},
                        distinct:["doctorId"]
                    })
                ).map((appointment) => appointment.doctorId),
            }
        }
    });
    const unassingedDoctors = await prisma.doctor.count({
        where:{
            id:{
                notIn:(
                    await prisma.appointment.findMany({
                        where:{
                            status:{not:"completed"},
                        },
                        select:{doctorId:true},
                        distinct:["doctorId"]
                    })
                ).map((app) => app.doctorId)
            }
        }
    })

    const allDoctors = await prisma.doctor.count()

    return res.status(200).json({
        assingedDoctors:assingedDoctors,
        unassingedDoctors:unassingedDoctors,
        allDoctors:allDoctors
    })
}

const patientData = async (req,res) => {
    if (req.userRole !== "super_admin") {
        return res.status(403).json({ message: "Operation forbidden" })
    }

    const assingedPatients = await prisma.patient.count({
        where:{
            id:{
                in:(
                    await prisma.appointment.findMany({
                        where:{
                            status:{not:"completed"},
                        },
                        select:{patientId:true},
                        distinct:["patientId"]
                    })
                ).map((app) => app.patientId)
            }
        }
    })
    const unAssingedPatients = await prisma.patient.count({
        where:{
            id:{
                notIn:(
                    await prisma.appointment.findMany({
                        where:{
                            status:{not:"completed"}
                        },
                        select:{patientId:true},
                        distinct:["patientId"]
                    })
                ).map((app) => app.patientId)
            }
        }
    })
    const allPatients = await prisma.patient.count()

    return res.status(200).json({
        assingedPatients:assingedPatients,
        unAssingedPatients:unAssingedPatients,
        allPatients:allPatients
    })
}

const appointmenstCount = async (req,res) =>{
    if (req.userRole !== "super_admin") {
        return res.status(403).json({ message: "Operation forbidden" })
    }

    const counts = await prisma.appointment.groupBy({
        by:['status'],
        _count:{
            id:true
        }
    })

    res.status(200).json(counts)
}

const ambulanceRequestCount = async (req,res) =>{
    if (req.userRole !== "super_admin") {
        return res.status(403).json({ message: "Operation forbidden" })
    }

    try {
        const counts = await prisma.ambulanceRequest.groupBy({
          by: ["createdAt"],
          _count: { id: true },
        });
    
        // Transform results to group by month
        const monthData = counts.reduce((acc, item) => {
          const month = new Date(item.createdAt).toLocaleString("default", { month: "short" });
    
          if (acc[month]) {
            acc[month] += item._count.id;
          } else {
            acc[month] = item._count.id;
          }
          return acc;
        }, {});
    
        const formattedData = Object.keys(monthData).map(month => ({
          month,
          requests: monthData[month],
        }));
    
        res.json(formattedData);
      } catch (error) {
        console.error("Error fetching ambulance requests:", error);
        res.status(500).json({ error: "Something went wrong" });
      }
}


const patientDataCount = async (req,res) =>{
    if (req.userRole !== "super_admin") {
        return res.status(403).json({ message: "Operation forbidden" })
    }

    try {
        const statusCounts = await prisma.patient.groupBy({
          by: ["status"],
          _count: { id: true },
        });
    
        const formattedData = statusCounts.map(status => ({
          status: status.status,
          count: status._count.id,
        }));
    
        res.json(formattedData);
      } catch (error) {
        console.error("Error fetching patient count by status:", error);
        res.status(500).json({ error: "Something went wrong" });
      }
}

const monthlyVisists = async (req,res) => {
    if (req.userRole !== "super_admin") {
        return res.status(403).json({ message: "Operation forbidden" })
    }

    try {
        const counts = await prisma.patient.groupBy({
          by: ["createdAt"],
          _count: { id: true },
        });
    
        // Transform results to group by month
        const monthData = counts.reduce((acc, item) => {
          const month = new Date(item.createdAt).toLocaleString("default", { month: "short" });
    
          if (acc[month]) {
            acc[month] += item._count.id;
          } else {
            acc[month] = item._count.id;
          }
          return acc;
        }, {});
    
        const formattedData = Object.keys(monthData).map(month => ({
          month,
          visits: monthData[month],
        }));
    
        res.json(formattedData);
      } catch (error) {
        console.error("Error fetching patient count by month:", error);
        res.status(500).json({ error: "Something went wrong" });
      }
}

module.exports = {
    adminLogin,
    adminRegister,
    updateAppointmentById,
    cancelAppointment,
    getAppointmentStatus,
    completeAppointment,
    approveAppointment,
    rescheduleAppointment,
    deleteAppointmentById,
    getAppointments,
    registerUser,
    updatePatient,
    getAllPatients,
    deletePatientById,
    addDoctor,
    deleteDoctor,
    updateDoctor,
    getAllDoctors,
    allAdminData,
    pendingRequests,
    completedRequests,
    doctorsData,
    patientData,
    appointmenstCount,
    ambulanceRequestCount,
    patientDataCount,
    monthlyVisists

}