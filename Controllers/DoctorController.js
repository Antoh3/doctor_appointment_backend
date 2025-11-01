const { request } = require("express");
const prisma = require('../prisma/prismaClient')
const bcrypt = require('bcrypt')
const { generateToken,generateRefreshToken } = require('../Middlewares/JWT.authentication'); 
const multer = require("multer");

const storage = multer.diskStorage({
    destination:(req,file,cb) =>{
        cb(null,'uploads/')
    },
    filename:(req,file,cb) =>{
        const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
        cb(null,`${uniqueSuffix}-${file.originalname}`)
    }
})

const upload = multer({ storage });


// Controller function for doctor registration
const registerDoctor = async (req, res) => {
    try {
        const {firstName,lastName,phone,gender,email,
            specialization,licenseNumber,
            registrationNumber} = req.body;

        // Check if the email already exists in the database
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

        

        // If the email is not found, proceed with registration logic   

        // Hash the password before saving it
        const saltRounds = 10; // Number of salt rounds (adjust as needed)
        const hashedPassword = await bcrypt.hash(req.body.password, saltRounds);

        // Proceed with registration logic
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
                password: hashedPassword
            }
        });

        res.status(201).json({ newDoctor, message: "registration successfully", status: true });
    } catch (error) {
        // Handle errors and send an error response
        console.error(error);
        res.status(500).json({ message: 'Internal server error' });
    }
};
// Controller function for doctor login
const login = async (req, res) => {
    try {
        const { email,password } = req.body;
        // Find the doctor by email
        const doctor = await prisma.doctor.findUnique({
            where: {
                email: email
            }
        });

        // Check if the doctor exists
        if (!doctor) {
            return res.status(400).json({ message: 'Email not found!', status: false });
        }

        // Compare the provided password with the stored hashed password
        const passwordMatch = await bcrypt.compare(password, doctor.password);

        // Check if the password is correct
        if (!passwordMatch) {
            return res.status(400).json({ message: 'Incorrect password!', status: false });
        }

        const accessToken = generateToken(doctor.id, 'doctor');
        const refreshToken = generateRefreshToken(doctor.id, 'doctor')
        

        //Set tokens in response headers
        res.setHeader('Authorization', `Bearer ${accessToken}`);
        res.setHeader('x-refresh-token', refreshToken);
        // res.header('x-access-token', accessToken);
        // res.header('x-refresh-token', refreshToken);

        res.json({message: "Login succesfull",accessToken,refreshToken});
    } catch (error) {
        // Handle errors and send an error response
        console.error(error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

const currentUser = async (req,res) => {
    const { doctorId } = req.userId;

    const user = await  prisma.doctor.findUnique({
        where:{
            id:doctorId
        },
        select:{
            firstName:true,
            lastName:true
        }
    })
}

const doctorDetails = async (req,res) => {
    try {
        const {firstName,lastName,phone,gender,email,
            specialization,licenseNumber,
            registrationNumber} = req.body;

        if (req.userRole !== 'doctor') {
            return res.status(403).json({ message: 'Access forbidden' });
        }
    
        // Ensure userId is defined before proceeding
        if (!req.userId) {
            return res.status(400).json({ message: 'Please login first' });
        }
    
        // Use req.userId to find the user and create the doctor
        const user = await prisma.user.findUnique({
            where: { id: req.userId },
        });
    
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        const newDoctor = await prisma.doctor.create({
            // data:{
            //     userId: req.userId,
            //     firstName,
            //     lastName,
            //     email,
            //     phone,
            //     gender,
            //     specialization,
            //     licenseNumber,
            //     registrationNumber,
            // },
            data:{
                userId: req.userId,
                ...req.body,
            }
        })
        console.log("request body",req.body);
        console.log(newDoctor);
        res.status(200).json({message:"Doctor details  submitted",newDoctor});
    } catch (error) {
        console.error(error);
        res.status(500).json({message:"Internal server error"});
    }
}

// Controller function for deleting a doctor
const deleteDoctor = async (req, res) => {
    try {
        const doctorId = req.userId;

        // Check if the doctor with the given ID exists
        const doctor = await prisma.doctor.delete({
            where:{
                userId: doctorId
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

// Controller function for updating a doctor
const updateDoctor = async (req, res) => {
    try {
        const doctorId = req.params.doctorId;
        console.log("Doctor id", doctorId);
        
        const {firstName,lastName,phone,gender,email,
            specialization,licenseNumber,
            registrationNumber} = req.body;

        // Check if the doctor with the given ID exists
        const doctor = await prisma.doctor.update({
            where:{
                id: doctorId
            },
            data:{
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

        res.status(200).json({message:"doctor updated sucessfully", doctor});
    } catch (error) {
        // Handle errors and send an error response
        console.error(error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

const findDoctor = async (req, res) => {
    try {
        const doctorId = req.params.doctorId;

        // Find the patient by ID
        const doctor = await prisma.doctor.findUnique({
            where:{
                id: doctorId
            },
            include:{
                appointments: true
            }
        });

        if (!doctor) {
            return res.status(404).json({ message: 'Doctor not found' });
        }

        // Send a success response with the patient data
        res.status(200).json({ doctor:doctor });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal server error' });
    }
}
// Controller function for getting all doctors
const getAllDoctors = async (req, res) => {
    try {
        const doctors = await prisma.doctor.findMany();
        // console.log(doctors.firstName);
        
        
        res.status(200).json(doctors);
    } catch (error) {
        // Handle errors and send an error response
        console.error(error);
        res.status(500).json({ message: 'Internal server error' });
    }
};


const uploadDocuments = async (req,res) => {
    const  doctorId  = req.userId

    try {
        const doctor = await prisma.doctor.update({
           where:{id : doctorId},
           data:{
            idFront: req.files?.idFront ? req.files.idFront[0].path : null,
            idBack: req.files?.idBack ? req.files.idBack[0].path : null,
            certificate: req.files?.certificate ? req.files.certificate[0].path : null,
           },
        });
        res.status(200).json({success: true, doctor})
    } catch (error) {
        res.status(500).json({error:"Failed to upload documents"})
    }
};

const validateregistrationNumber = async (req,res) => {
    const {registrationNumber} = req.body

    try {
        const validRegNo = prisma.doctor.findUnique({
            where:{
                registrationNumber: registrationNumber
            },
        })
    
        if (!validRegNo) {
            return res.status(404).json("Provide valid reg no");
        }else{
            return res.status(200).json(validRegNo);
        }
    } catch (error) {
        res.status(500).json({error:"Something went wrong"})
    }
}

const searchDoctors = async (req,res) => {

    const { query} = req.query;

    try {
        const doctors = await prisma.doctor.findMany({
            where:{
                OR:[
                    {firstName:{contains:query}},
                    {lastName:{contains:query}},
                    {specialization:{contains:query}}
                ]
            },
            // select: {
            //     firstName: true,
            //     lastName: true,
            //     email: true,
            //     phone: true,
            //     specialization: true
            // },
        })

        res.status(200).json(doctors);
    } catch (error) {
        console.error(error);
        res.status(500).json({error: "Failed to search doctors"});
    }
}

const givePrescription = async (req,res) => {
    const doctorId = req.userId;
    const { content,type,patientId } = req.body;

    console.log(req.body);
    

    // Get the most recent appointment of this doctor
    // const recentAppointment = await prisma.appointment.findFirst({
    //     where: { doctorId },
    //     orderBy: { schedule: "desc" },
    //     select: { patientId: true },
    //   });

    //   if(!recentAppointment){
    //     return res.status(404).json({message:"No Recent appintment found"});
    //   }

    const doctor = await prisma.doctor.findUnique({
        where:{
            id: doctorId
        }
    })

    if (!doctor) {
        return res.status(404).json({message:"DoctorId not found"})
    }


    const prescription = await prisma.prescription.create({
        data:{
            content:content,
            type:type,
            patientId,
            doctorId:doctor.id
        }
    })

    res.status(200).json(prescription);
}

const allPatients = async (req,res) => {
    const { doctorId } = req.userId;

    const patients = await prisma.patient.findMany({
        where:{
            doctorId:doctorId
        }
    })

    res.status(200).json(patients);
}

const writeRecomendation = async (req,res) => {
    const doctorId = req.userId;
    const { patientId,recommendation} = req.body

    // Get the most recent appointment of this doctor
    const recentAppointment = await prisma.appointment.findFirst({
        where: { doctorId },
        orderBy: { createdAt: "desc" },
        select: { patientId: true },
      });

      if(!recentAppointment){
        return res.status(404).json({message:"No Recent appintment found"});
      }

    const doctor = await prisma.doctor.findUnique({
        where:{
            id:doctorId
        }
    })

    if (!doctor) {
        return res.status(404).json({message:"DoctotId not found"});
    }

    const doctorRecommendation = await prisma.recommendation.create({
        data:{
            recommendation,
            patientId:recentAppointment.patientId,
            doctorId:doctor.id,
        }
    })

    res.status(200).json(doctorRecommendation)
}

const getPatientPrescription = async (req,res) => {
    const userId = req.userId;
    const userRole = req.userRole;

    const filter = {
        type:"prescription"
    }

    if (userRole == 'doctor') {
        filter.doctorId = userId
    }else if (userRole == 'patient') {
        filter.patientId = userId
    }else{
        return res.status(401).json({message:"Unauthorized"});
    }

    const prescription = await prisma.prescription.findMany({
        where:filter,
        select:{
            prescribedAt:true,
            type:true,
            content:true,
            patient:true,
            doctor:true
        }
    })

    res.status(200).json(prescription)
}

const getPatientRecommendation = async (req,res) => {
    const userId = req.userId;
    const userRole = req.userRole;

    const filter = {
        type:"recommendation"
    }

    if (userRole == 'doctor') {
        filter.doctorId = userId
    }else if (userRole == 'patient') {
        filter.patientId = userId
    }else{
        return res.status(401).json({message:"Unauthorized"});
    }

    const prescription = await prisma.prescription.findMany({
        where:filter,
        select:{
            prescribedAt:true,
            type:true,
            content:true,
            patient:true,
            doctor:true
        }
    })

    res.status(200).json(prescription)
}


const getPatientRecomendation = async (req,res) => {
    const { patientId } = req.body;

    const recommendations = await prisma.recommendation.findMany({
        where:{
            patientId: patientId
        }
    })

    res.status(200).json(recommendations);
}

const totalPatient = async (req,res) => {
    const doctorId = req.userId
    const patients = await prisma.patient.count({
        // where:{
        //     doctorId:doctorId
        // }
    })
    return res.status(200).json({patients:patients})
}


const followupPatient = async (req,res) => {
    const { patientId } = req.params;

    const patient = await prisma.patient.update({
        where:{
            id: patientId
        },
        data:{
            status:"followeup"
        }
    })

    return res.status(200).json({patient:patient})
}



module.exports = {
    findDoctor,
    registerDoctor,
    currentUser,
    allPatients,
    login,
    deleteDoctor,
    updateDoctor,
    getAllDoctors,
    // updateAppointment,
    uploadDocuments,
    // getAppointmentStatus,
    doctorDetails,
    getPatientPrescription,
    getPatientRecommendation,
    validateregistrationNumber,
    searchDoctors,
    givePrescription,
    totalPatient,
    followupPatient

};
