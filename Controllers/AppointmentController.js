const prisma = require("../prisma/prismaClient");

// book a new appointment
const createAppointment = async (req, res) => {

    if (req.userRole !== 'patient') {
        return res.status(403).json({ message: 'Access forbidden' });
    }

    const { doctorId, schedule, reason } = req.body
    console.log("doctor id",doctorId);
    

    const patientId = req.userId;
    console.log("user id is ", patientId);


    try {
        const doctor = await prisma.doctor.findUnique({
            where: {
                id: doctorId
            }
        })
        if (!doctor) {
            return res.status(404).json({ message: "Doctor not found" })
        }


        const patient = await prisma.patient.findUnique({
            where: {
                id: patientId
            }
        })
        // console.log(`Patient name ${patient.firstName} ${patient.lastName}`);
        if (!patient) {
            return res.status(404).json({ message: "Please login" })
        }

        const name = `${patient.firstName}-${patient.lastName}`
        // console.log("Patient name",name);
        

        const appoinment = await prisma.$transaction([
            prisma.patient.update({
                where:{
                    id:patient.id
                },
                data:{
                    doctorId:doctor.id
                }
            }),
            prisma.appointment.create({
                data: {
                    schedule: new Date(schedule),
                    reason,
                    status: "scheduled",
                    // primaryPhysician,
                    patientName: name,
                    patientId: patient.id,
                    doctorId: doctor.id
                }
            })
        ])

        res.status(200).json({ message: "Appointment booked", appoinment })
    } catch (error) {
        // Handle errors and send an error response
        console.error(error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

// Read a single appointment by ID
const getDoctorAppointmentById = async (req, res) => {
    try {
        if (req.userRole !== "doctor") {
            return res.status(403).json({ message: "Access forbidden only doctors can access" })
        }
        console.log(req.userId);

        const doctor = await prisma.doctor.findUnique({
            where: {
                id: req.userId
            }
        })
        console.log(doctor.id);

        if (!doctor) {
            return res.status(404).json({ message: "Please login" })
        }
        const appointments = await prisma.appointment.findMany({
            where: {
                doctorId: doctor.id
            },
            select: {
                id: true,
                schedule: true,
                status: true,
                // primaryPhysician: true,
                patientName: true,
                reason: true,
                // cancelationReason: true
            },
            orderBy:{
                createdAt: 'asc'
            }
        })
        res.status(200).json(appointments)
    } catch (error) {
        // Handle errors and send an error response
        console.error(error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

const getPatientAppointmentById = async (req, res) => {
    try {
        if (req.userRole !== "patient") {
            return res.status(403).json({ message: "Acess forbidden" })
        }

        const patientId = req.userId;

        const user = await prisma.patient.findUnique({
            where: {
                id: patientId
            }
        })
        if (!user) {
            return res.status(404).json({ message: "Please login" })
        }

        const appointments = await prisma.appointment.findMany({
            where: {
                patientId: user.id
            },
            select: {
                id:true,
                schedule: true,
                reason: true,
                patientName: true,
                status: true,
                doctor:{
                    select:{
                        firstName:true,
                        lastName:true
                    }
                }
            },
            orderBy:{
                createdAt: 'asc'
            }
        })

        // Send a success response with the appointment data
        res.status(200).json(appointments);
    } catch (error) {
        // Handle errors and send an error response
        console.error(error);
        res.status(500).json({ message: 'Internal server error' });
    }
};
// Controller function for updating an appointment by ID
const updateAppointmentById = async (req, res) => {

    try {
        const appointmentId = req.params.appointmentId;
        const { schedule, status, reason, cancelationReason,primaryPhysician } = req.body;

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

        if (
            (req.userRole === 'patient' && existingAppointment.patient?.userId !== req.userId) ||
            (req.userRole === 'doctor' && existingAppointment.doctor?.userId !== req.userId)
        ) {
            return res.status(403).json({ message: 'Access forbidden: You cannot update this appointment' });
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

// Delete an appointment by ID
const deleteAppointmentById = async (req, res) => {
    try {
        const appointmentId = req.params.appointmentId;
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

        if (
            (req.userRole === 'patient' && existingAppointment.patient?.userId !== req.userId) ||
            (req.userRole === 'doctor' && existingAppointment.doctor?.userId !== req.userId)
        ) {
            return res.status(403).json({ message: 'Access forbidden: You cannot delete this appointment' });
        }

        await prisma.appointment.delete({
            where:{
                id: appointmentId
            }
        })


        res.status(200).json({ message: 'Appointment deleted successfully' });
    } catch (error) {
        // Handle errors and send an error response
        console.error(error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

const rescheduleAppointment = async (req,res) => {
    const { appointmentId } = req.params;
    const { schedule } = req.body;


    const findAppintment = await prisma.appointment.findUnique({
        where:{
            id:appointmentId
        }
    })

    if (!findAppintment) {
        return res.status(404).json({message:"appintmentId not found"});
    }

    const updatedAppointment = await prisma.appointment.update({
        where:{
            id:appointmentId
        },
        data:{
            schedule: new Date(schedule),
            status:'rescheduled'
        }
    })
    console.log(updatedAppointment)
    return res.status(200).json(updatedAppointment)
}

const approveAppointment = async (req,res) => {
    const { appointmentId } = req.params;
    const { status } = req.body;


    const findAppintment = await prisma.appointment.findUnique({
        where:{
            id:appointmentId
        }
    })

    if (!findAppintment) {
        return res.status(404).json({message:"appintmentId not found"});
    }

    const updatedAppointment = await prisma.appointment.update({
        where:{
            id:appointmentId
        },
        data:{
            status
        }
    })
    return res.status(200).json(updatedAppointment)
}

const cancelAppointment = async (req,res) => {
    const { appointmentId } = req.params;
    const { status,cancelationReason } = req.body;


    const findAppintment = await prisma.appointment.findUnique({
        where:{
            id:appointmentId
        }
    })

    if (!findAppintment) {
        return res.status(404).json({message:"appintmentId not found"});
    }

    const updatedAppointment = await prisma.appointment.update({
        where:{
            id:appointmentId
        },
        data:{
            status:"canceled",
            cancelationReason
        }
    })
    return res.status(200).json(updatedAppointment)
}

const completeAppointment = async (req,res) => {
    const { appointmentId } = req.params;
    // const { status } = req.body;


    const findAppintment = await prisma.appointment.findUnique({
        where:{
            id:appointmentId
        }
    })

    if (!findAppintment) {
        return res.status(404).json({message:"appintmentId not found"});
    }

    const updatedAppointment = await prisma.appointment.update({
        where:{
            id:appointmentId
        },
        data:{
            status:"completed"
        }
    })
    return res.status(200).json(updatedAppointment)
}

const getAppointmentStatus = async (req,res) => {
    const userId = req.userId;
    const userRole = req.userRole;

    let filter = {}

    if(userRole === 'doctor'){
        filter.doctorId = userId
    }else if (userRole === 'patient') {
        filter.patientId = userId
    }else{
        return res.status(403).json({message:"Unauthorized"});
    }

    const count = await prisma.appointment.groupBy({
        by:['status'],
        _count:{status:true},
        where: filter
    })

    const total = await prisma.appointment.count({where:filter})

    const formattesStatus = count.reduce((acc,curr) => {
        acc[curr.status] = curr._count.status;
        return acc;
    },{})

    res.status(200).json({ 
        total:total,
        formattesStatus
    })
}

module.exports = {
    createAppointment,
    getDoctorAppointmentById,
    updateAppointmentById,
    deleteAppointmentById,
    getPatientAppointmentById,
    rescheduleAppointment,
    approveAppointment,
    cancelAppointment,
    getAppointmentStatus,
    completeAppointment,
};
