const bcrypt = require('bcrypt');
const { generateToken,generateRefreshToken } = require('../Middlewares/JWT.authentication')
const prisma = require('../prisma/prismaClient')

const registerUser = async (req, res) => {
    try {
        const { firstName, lastName, email, phoneNumber, birthDate,
                gender,idNumber,permanentLocation,password
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

        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(password, saltRounds)

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
                password: hashedPassword,
            },
        });

        // console.log(newUser);
        
        // const token = generateToken(newUser)
        res.status(200).json({newUser,message:"User registered"});
        // console.log(newUser);
        
    } catch (error) {
        console.error(error)
        res.status(500).json({ message: "Internal server error" })
    }
}

const currentUser = async (req,res) => {
    const { patientId } = req.userId;

    const user = await  prisma.patient.findUnique({
        where:{
            id:patientId
        },
        select:{
            firstName:true,
            lastName:true
        }
    })
}

// Controller function for patient registration
const registerPatient = async (req, res) => {
    try {
        // Log the incoming request body and user ID for debugging
        // console.log('User ID from token:', req.userId); 
        // console.log("User name from token",req.name);
        console.log(req.userRole);


        // Destructure fields from the request body
        const {
            name,
            email,
            phone,
            birthDate,
            gender,
            address,
            occupation,
            emergencyContactName,
            emergencyContactNumber,
            primaryPhysician,
            insuranceProvider,
            insurancePolicyNumber,
            allergies,
            currentMedication,
            familyMedicalHistory,
            pastMedicalHistory,
            identificationType,
            identificationNumber,
            privacyConsent,
        } = req.body;

        if (req.userRole !== 'patient') {
            return res.status(403).json({ message: 'Access forbidden' });
        }

        // Ensure userId is defined before proceeding
        if (!req.userId) {
            return res.status(400).json({ message: 'User ID not found in token' });
        }

        // Use req.userId to find the user and create the patient
        const user = await prisma.user.findUnique({
            where: {
                id: req.userId
            }
        });
        console.log("Logged in user", user);


        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Create patient associated with the logged-in user
        const newPatient = await prisma.patient.create({
            data: {
                // userId: req.userId, // Link to user via userId from token
                name: user.name || name, // Use user name if available, otherwise use provided name
                email: user.email || email, // Use user email if available, otherwise use provided email
                phone: user.phone || phone, // Use user phone if available, otherwise use provided phone
                birthDate: new Date(birthDate),
                gender,
                address,
                occupation,
                emergencyContactName,
                emergencyContactNumber,
                primaryPhysician,
                insuranceProvider,
                insurancePolicyNumber,
                allergies,
                currentMedication,
                familyMedicalHistory,
                pastMedicalHistory,
                identificationType,
                identificationNumber,
                identificationDocument: req.file ? req.file.path : null, // Use the path from req.file if it exists
                privacyConsent: privacyConsent === 'true', // Ensure it's a boolean
                user: {
                    connect: {
                        id: req.userId // Connect the user based on the userId
                    }
                },
            },
        });

        res.status(200).json({ message: 'Patient registered successfully', newPatient });
    } catch (error) {
        console.error('Error registering patient:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

const loginPatient1 = async (req, res) => {
    const { email, password } = req.body;
    console.log("in patient");

    try {
        const start = Date.now();

        // Query patient by email
        const patient = await prisma.patient.findUnique({ where: { email } });
        console.log(`Database query took ${Date.now() - start}ms`);

        if (!patient) {
            return res.status(400).json({ message: 'User not found!' });
        }

        // Compare password
        const hashStart = Date.now();
        const isPasswordValid = await bcrypt.compare(password, patient.password);
        console.log(`Password comparison took ${Date.now() - hashStart}ms`);

        if (!isPasswordValid) {
            return res.status(400).json({ message: 'Invalid credentials!' });
        }

        // Generate tokens
        const tokenStart = Date.now();
        const accessToken = generateToken(patient.id, 'patient');
        const refreshToken = generateRefreshToken(patient.id, 'patient');
        console.log(`Token generation took ${Date.now() - tokenStart}ms`);

        res.status(200).json({
            message: "Login successful",
            accessToken,
            refreshToken,
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Internal server error" });
    }
};


// Controller function for patient login
const loginPatient = async (req, res) => {
    const { email, password } = req.body;

    try {

        // Find the user by email
        const user = await prisma.patient.findUnique({
            where: {
                email: email,
            },
        });
        
        // Check if the user exists
        if (!user) {
            console.log("user not found");
            
            return res.status(400).json({ message: 'User not found!' });
        }

        // Compare the provided password with the stored hashed password
        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            return res.status(400).json({ message: 'Invalid credentials!' });
        }
        

        const accessToken = generateToken(user.id, 'patient');
        const refreshToken = generateRefreshToken(user.id, 'patient')
        
        res.status(200).json({message: "Login succesfull",accessToken,refreshToken,});
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Login failed" })
    }
};

// Controller function to get a patient by ID
const getPatientById = async (req, res) => {
    try {
        console.log('User ID from token:', req.userId);

        const patientId = req.userId;


        // Find the patient by ID
        const patient = await prisma.patient.findUnique({
            where: {
                id: patientId,
            }
        })

        if (!patient) {
            return res.status(404).json({ message: 'Patient not found' });
        }

        // Send a success response with the patient data
        res.status(200).json(patient);
    } catch (error) {
        // Handle errors and send an error response
        console.error(error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

const searchDoctors = async (req, res) => {
    try {
        // if (req.userRole !== 'patient' || 'doctor') {
        //     return res.status(403).json({ message: 'Access forbidden: Only patients can search for doctors' });
        // }

        // const { specialization } = req.query;
        const { query } = req.query;

        if (!query) {
            return res.status(404).json({ message: "Please provide doctor specialization" })
        }

        const doctors = await prisma.doctor.findMany({
            where: {
                OR:[
                    {specialization:{contains: query}},
                    {firstName:{contains: query}},
                    {lastName:{contains:query}}
                ]
            },
            // select: {
            //     firstName: true,
            //     lastName: true,
            //     email: true,
            //     phone: true,
            //     specialization: true
            // },
        });

        if (doctors.length === 0) {
            return res.status(404).json({ message: "No doctors found" })
        }

        res.status(200).json(doctors);
    } catch (error) {
        res.status(500).json({ message: "Internal server error" })
    }
}


// Controller function to update a appointment
const updateAppointment = async (req, res) => {
    try {
        const { patientId } = req.params;

        // Check if the patient with the given ID exists
        const existingPatient = await prisma.patient.findUnique({
            where: {
                id: patientId
            }
        })

        if (!existingPatient) {
            return res.status(404).json({ message: 'Patient not found' });
        }

        // Extract updated patient data from req.body
        const {
            name, email, phone, birthDate, gender, address, occupation,
            emergencyContactName, emergencyContactNumber, primaryPhysician, insuranceProvider,
            insurancePolicyNumber, allergies, currentMedication, familyMedicalHistory,
            pastMedicalHistory, identificationType, identificationNumber, privacyConsent
        } = req.body;

        const identificationDocumentPath = req.file ? req.file.path : null;
        // Update the patient using findByIdAndUpdate
        const updatedPatient = await prisma.patient.update({
            where: {
                id: patientId
            },
            data: {
                name,
                email,
                phone,
                birthDate: new Date(birthDate),
                gender,
                address,
                occupation,
                emergencyContactName,
                emergencyContactNumber,
                primaryPhysician,
                insuranceProvider,
                insurancePolicyNumber,
                allergies,
                currentMedication,
                familyMedicalHistory,
                pastMedicalHistory,
                identificationType,
                identificationNumber,
                privacyConsent,
                identificationDocument: identificationDocumentPath, // Save file path
            }
        })

        // Send a success response with the updated patient data
        res.status(200).json(updatedPatient);
    } catch (error) {
        // Handle errors and send an error response
        console.error(error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

// Controller function to delete a patient by ID
const deletePatientById = async (req, res) => {
    try {
        const patientId = req.userId;

        // Find the patient by ID
        const patient = await prisma.patient.findUnique({
            where: {
                userId: patientId
            }
        })

        if (!patient) {
            return res.status(404).json({ message: 'Patient not found' });
        }

        // Delete the patient from the database
        await prisma.patient.delete({
            where: {
                userId: patientId,
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

//update patient appointments
const updatePatientById = async (req, res) => {
    try {
        const patientId = req.userId;
        const {
            name,
            email,
            phone,
            birthDate,
            gender,
            address,
            occupation,
            emergencyContactName,
            emergencyContactNumber,
            primaryPhysician,
            insuranceProvider,
            insurancePolicyNumber,
            allergies,
            currentMedication,
            familyMedicalHistory,
            pastMedicalHistory,
            identificationType,
            identificationNumber,
            privacyConsent,
        } = req.body;

        const identificationDocument = req.files?.identificationDocument?.[0]?.path;

        const updatePatient = await prisma.patient.update({
            where: {
                userId: patientId
            },
            data: {
                name,
                email,
                phone,
                birthDate: new Date(birthDate),
                gender,
                address,
                occupation,
                emergencyContactName,
                emergencyContactNumber,
                primaryPhysician,
                insuranceProvider,
                insurancePolicyNumber,
                allergies,
                currentMedication,
                familyMedicalHistory,
                pastMedicalHistory,
                identificationType,
                identificationNumber,
                identificationDocument: identificationDocument, // Use the path from req.file if it exists
                // identificationDocument: req.file ? req.file.path : null, // Use the path from req.file if it exists
                privacyConsent: privacyConsent === 'true '
            }
        })
        res.status(200).json({ message: 'patient updated successfully', updatePatient });
    } catch (error) {
        // Handle errors and send an error response
        console.error(error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

const cancelAppointment = async (req,res) => {
    const { appointmentId } = req.params;
    const {cancelationReason} = req.body

    const appoinment = await prisma.appointment.findUnique({
        where:{
            id:appointmentId
        }
    })

    if (!appoinment) {
        res.json(404).json({message: "AppointmentId not found"});
    }

    const updatedAppointment = await prisma.appointment.update({
        where:{
            id:appointmentId
        },
        data:{
            status:"canceled_by_user",
            cancelationReason,
        }
    })

    res.status(200).json(updatedAppointment);
}

const cancelRequest = async (req,res) => {
    const { ambulanceRequestId } = req.params;
    const { status } = req.body;

    const ambulanceRequest = await prisma.ambulanceRequest.findUnique({
        where:{
            id: ambulanceRequestId
        }
    })

    if (!ambulanceRequest) {
        return res.status(404).json({message: "RequestId not found"})
    }

    const updatedRequest = await prisma.ambulanceRequest.update({
        where:{
            id:ambulanceRequestId
        },
        data:{
            status:"canceled_by_user"
        }
    })
    res.status(200).json(updatedRequest)
}

const cancelRequestAdmin = async (req,res) => {
    const { ambulanceRequestId } = req.params;
    const { status } = req.body;

    const ambulanceRequest = await prisma.ambulanceRequest.findUnique({
        where:{
            id: ambulanceRequestId
        }
    })

    if (!ambulanceRequest) {
        return res.status(404).json({message: "RequestId not found"})
    }

    const updatedRequest = await prisma.ambulanceRequest.update({
        where:{
            id:ambulanceRequestId
        },
        data:{
            status:"canceled_by_admin"
        }
    })
    res.status(200).json(updatedRequest)
}

const acceptRequestAdmin = async (req,res) => {
    const { ambulanceRequestId } = req.params;
    const { status } = req.body;

    const ambulanceRequest = await prisma.ambulanceRequest.findUnique({
        where:{
            id: ambulanceRequestId
        }
    })

    if (!ambulanceRequest) {
        return res.status(404).json({message: "RequestId not found"})
    }

    const updatedRequest = await prisma.ambulanceRequest.update({
        where:{
            id:ambulanceRequestId
        },
        data:{
            status:'accepted'
        }
    })
    res.status(200).json(updatedRequest)
}


const completeRequestAdmin = async (req,res) => {
    const { ambulanceRequestId } = req.params;
    const { status } = req.body;

    const ambulanceRequest = await prisma.ambulanceRequest.findUnique({
        where:{
            id: ambulanceRequestId
        }
    })

    if (!ambulanceRequest) {
        return res.status(404).json({message: "RequestId not found"})
    }

    const updatedRequest = await prisma.ambulanceRequest.update({
        where:{
            id:ambulanceRequestId
        },
        data:{
            status:'completed'
        }
    })
    res.status(200).json(updatedRequest)
}


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
    return res.status(200).json(updatedAppointment)
}

const allPatients = async (req,res) => {
    const count = await prisma.patient.groupBy({
        by:['status'],
        _count:{status:true},
    })

    const total = await prisma.patient.count()

    const formattedPatients = count.reduce((acc,curr) => {
        acc[curr.status] = curr._count.status;
        return acc;
    },{})

    res.status(200).json({ 
        total:total,
        formattedPatients
    })
}


module.exports = {
    allPatients,
    searchDoctors,
    registerUser,
    currentUser,
    registerPatient,
    loginPatient,
    getPatientById,
    updatePatientById,
    deletePatientById,
    updateAppointment,
    loginPatient1,
    cancelAppointment,
    cancelRequest,
    rescheduleAppointment,
    cancelRequestAdmin,
    acceptRequestAdmin,
    completeRequestAdmin,
};
