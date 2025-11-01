const prisma = require('./prismaClient');

function generateRandomId(length = 15) {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
        result += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    return result;
}

// Function to seed data
async function seedData() {
    try {

        console.log("Clearing existing data...");

        // Step 1: Delete records in the correct dependency order
        await prisma.appointment.deleteMany({}); // Dependent on patientId
        console.log("Deleted all appointments.");

        await prisma.ambulance.deleteMany({}); // Dependent on patientId
        console.log("Deleted all ambulances.");

        await prisma.patient.deleteMany({}); // Now safe to delete patients
        console.log("Deleted all patients.");

        await prisma.doctor.deleteMany({}); // Delete doctors last
        console.log("Deleted all doctors.");

        // Step 2: Seed new data
        console.log("Seeding new data..."); 


        // Check if any Patients are already seeded
        const patientsExist = await prisma.patient.count();
        if (patientsExist > 0) {
            console.log('Patients already seeded.');
            return;
        }

        // Seed Doctors with ids
        const doctors = [
            {
                id: generateRandomId(15),  // Explicit id
                firstName: 'John',
                lastName: 'Doe',
                email: 'johndoe@gmail.com',
                phone: '1234567890',
                gender: 'Male',
                specialization: 'Cardiology',
                licenseNumber: 'D123456',
                registrationNumber: 'R123456',
                password: 'password123',
                role:"doctor"
            },
            {
                id: generateRandomId(15),  // Explicit id
                firstName: 'Jane',
                lastName: 'Smith',
                email: 'janesmith@gmail.com',
                phone: '0987654321',
                gender: 'Female',
                specialization: 'Neurology',
                licenseNumber: 'D654321',
                registrationNumber: 'R654321',
                password: 'password123',
                role:"doctor"
            },
            {
                id: generateRandomId(15),  // Explicit id
                firstName: 'Jane',
                lastName: 'doe',
                email: 'janedoe@gmail.com',
                phone: '0987654321',
                gender: 'Female',
                specialization: 'Neurology',
                licenseNumber: 'D654321',
                registrationNumber: 'R654321',
                password: 'password123',
                role:"doctor"
            },
            {
                id: generateRandomId(15),  // Explicit id
                firstName: 'kevin',
                lastName: 'doe',
                email: 'kevindoe@gmail.com',
                phone: '0987654321',
                gender: 'Female',
                specialization: 'Neurology',
                licenseNumber: 'D654321',
                registrationNumber: 'R654321',
                password: 'password123',
                role:"doctor"
            },
            {
                id: generateRandomId(15),  // Explicit id
                firstName: 'alice',
                lastName: 'doe',
                email: 'alicedoe@gmail.com',
                phone: '0987654321',
                gender: 'Female',
                specialization: 'Neurology',
                licenseNumber: 'D654321',
                registrationNumber: 'R654321',
                password: 'password123',
                role:"doctor"
            },
        ];

        const doctorData = await prisma.doctor.createMany({
            data: doctors,
        });
        console.log('Doctors seeded:', doctorData);

        // Seed Ambulances with ids
        const ambulances = [
            { id: generateRandomId(15), name: 'Ambulance A', licenseNumber: 'AMB123', location: { lat: 40.7128, lng: -74.0060 }, type: 'Advanced', owner: 'ABC Corp' },
            { id: generateRandomId(15), name: 'Ambulance B', licenseNumber: 'AMB124', location: { lat: 40.7128, lng: -74.0050 }, type: 'Basic', owner: 'XYZ Corp' },
            { id: generateRandomId(15), name: 'Ambulance C', licenseNumber: 'AMB123', location: { lat: 40.7128, lng: -74.0060 }, type: 'Advanced', owner: 'ABC Corp' },
            { id: generateRandomId(15), name: 'Ambulance D', licenseNumber: 'AMB124', location: { lat: 40.7128, lng: -74.0050 }, type: 'Basic', owner: 'XYZ Corp' },
            { id: generateRandomId(15), name: 'Ambulance E', licenseNumber: 'AMB123', location: { lat: 40.7128, lng: -74.0060 }, type: 'Patient', owner: 'ABC Corp' },
            { id: generateRandomId(15), name: 'Ambulance F', licenseNumber: 'AMB124', location: { lat: 40.7128, lng: -74.0050 }, type: 'Basic', owner: 'XYZ Corp' },
            { id: generateRandomId(15), name: 'Ambulance G', licenseNumber: 'AMB123', location: { lat: 40.7128, lng: -74.0060 }, type: 'Advanced', owner: 'ABC Corp' },
            { id: generateRandomId(15), name: 'Ambulance H', licenseNumber: 'AMB124', location: { lat: 40.7128, lng: -74.0050 }, type: 'Basic', owner: 'XYZ Corp' },
            { id: generateRandomId(15), name: 'Ambulance I', licenseNumber: 'AMB123', location: { lat: 40.7128, lng: -74.0060 }, type: 'Patient', owner: 'ABC Corp' },
            { id: generateRandomId(15), name: 'Ambulance J', licenseNumber: 'AMB124', location: { lat: 40.7128, lng: -74.0050 }, type: 'Basic', owner: 'XYZ Corp' },
            { id: generateRandomId(15), name: 'Ambulance K', licenseNumber: 'AMB123', location: { lat: 40.7128, lng: -74.0060 }, type: 'Advanced', owner: 'ABC Corp' },
            { id: generateRandomId(15), name: 'Ambulance L', licenseNumber: 'AMB124', location: { lat: 40.7128, lng: -74.0050 }, type: 'Basic', owner: 'XYZ Corp' },
            { id: generateRandomId(15), name: 'Ambulance L', licenseNumber: 'AMB124', location: { lat: 40.7128, lng: -74.0050 }, type: 'Motuary', owner: 'XYZ Corp' },
            { id: generateRandomId(15), name: 'Ambulance L', licenseNumber: 'AMB124', location: { lat: 40.7128, lng: -74.0050 }, type: 'Basic', owner: 'XYZ Corp' },
            { id: generateRandomId(15), name: 'Ambulance L', licenseNumber: 'AMB124', location: { lat: 40.7128, lng: -74.0050 }, type: '4X4', owner: 'XYZ Corp' },
        ];

        const ambulanceData = await prisma.ambulance.createMany({
            data: ambulances,
        });
        console.log('Ambulances seeded:', ambulanceData);

        // Seed Patients with Doctor relations and ids
        const patients = [
            {
                id: generateRandomId(15),  // Explicit id
                firstName: 'Alice',
                lastName: 'Johnson',
                email: 'alicejohnson@gmail.com',
                phoneNumber: '1112223333',
                birthDate: '1985-06-15',
                gender: 'Female',
                idNumber: 'P123456',
                permanentLocation: { lat: 40.7128, lng: -74.1050 },
                password: 'password123',
                role:"patient"
            },
            {
                id: generateRandomId(15),  // Explicit id
                firstName: 'Alice',
                lastName: 'Johnson',
                email: 'emamnuelmuuo755@gmail.com',
                phoneNumber: '1112223333',
                birthDate: '1985-06-15',
                gender: 'Female',
                idNumber: 'P123456',
                permanentLocation: { lat: 40.7128, lng: -74.1050 },
                password: '123456789',
                role:"patient"
            },
            {
                id: generateRandomId(15),  // Explicit id
                firstName: 'Alice',
                lastName: 'Johnson',
                email: 'emmanuelmuuo75@gmail.com',
                phoneNumber: '1112223333',
                birthDate: '1985-06-15',
                gender: 'Female',
                idNumber: 'P123456',
                permanentLocation: { lat: 40.7128, lng: -74.1050 },
                password: '123456789',
                role:"patient"
            },
            {
                id: generateRandomId(15),  // Explicit id
                firstName: 'Bob',
                lastName: 'Williams',
                email: 'bobwilliams@gmail.com',
                phoneNumber: '4445556666',
                birthDate: '1990-12-05',
                gender: 'Male',
                idNumber: 'P654321',
                permanentLocation: { lat: 40.7128, lng: -74.1050 },
                password: 'password123',
                role:"patient"
            },
            {
                id: generateRandomId(15),  // Explicit id
                firstName: 'Alice',
                lastName: 'Williams',
                email: 'alicewilliams@gmail.com',
                phoneNumber: '4445556666',
                birthDate: '1990-12-05',
                gender: 'Male',
                idNumber: 'P654321',
                permanentLocation: { lat: 40.7128, lng: -74.1050 },
                password: 'password123',
                role:"patient"
            },
            {
                id: generateRandomId(15),  // Explicit id
                firstName: 'kevin',
                lastName: 'Williams',
                email: 'kevinwilliams@gmail.com',
                phoneNumber: '4445556666',
                birthDate: '1990-12-05',
                gender: 'Male',
                idNumber: 'P654321',
                permanentLocation: { lat: 40.7128, lng: -74.1050 },
                password: 'password123',
                role:"patient"
            },
            {
                id: generateRandomId(15),  // Explicit id
                firstName: 'steve',
                lastName: 'Williams',
                email: 'stevewilliams@example.com',
                phoneNumber: '4445556666',
                birthDate: '1990-12-05',
                gender: 'Male',
                idNumber: 'P654321',
                permanentLocation: { lat: 40.7128, lng: -74.1050 },
                password: 'password123',
                role:"patient"
            },
        ];

        const patientData = await prisma.patient.createMany({
            data: patients,
        });
        console.log('Patients seeded:', patientData);

        // Seed Appointments with Patient and Doctor relations and ids
        // const appointments = [
        //   {
        //     id: 'appt1',  // Explicit id
        //     schedule: new Date('2025-02-01T10:00:00'),
        //     status: 'scheduled',
        //     patientName: 'Alice Johnson',
        //     reason: 'Routine check-up',
        //     doctorId: 'd1',  // Assign Doctor 1
        //     patientId: 'p1',  // Assign Patient 1
        //   },
        //   {
        //     id: 'appt2',  // Explicit id
        //     schedule: new Date('2025-02-05T14:00:00'),
        //     status: 'scheduled',
        //     patientName: 'Bob Williams',
        //     reason: 'Neurological examination',
        //     doctorId: 'd2',  // Assign Doctor 2
        //     patientId: 'p2',  // Assign Patient 2
        //   },
        // ];

        // const appointmentData = await prisma.appointment.createMany({
        //   data: appointments,
        // });
        // console.log('Appointments seeded:', appointmentData);

        // Seed AmbulanceRequests with Patient and Ambulance relations and ids
        // const ambulanceRequests = [
        //   {
        //     id: 'req1',  // Explicit id
        //     aidCarType: 'Advanced',
        //     selectedItems: { items: ['Oxygen', 'Defibrillator'] },
        //     patientId: 'p1',
        //     ambulanceId: 'a1',  // Assign Ambulance 1
        //     status: 'pending',
        //   },
        //   {
        //     id: 'req2',  // Explicit id
        //     aidCarType: 'Basic',
        //     selectedItems: { items: ['Basic medical kit'] },
        //     patientId: 'p2',
        //     ambulanceId: 'a2',  // Assign Ambulance 2
        //     status: 'accepted',
        //   },
        // ];

        // const ambulanceRequestData = await prisma.ambulanceRequest.createMany({
        //   data: ambulanceRequests,
        // });
        // console.log('Ambulance requests seeded:', ambulanceRequestData);

        // Seed Feedback for Patients with ids
        // const feedbacks = [
        //   { id: 'f1', content: 'Great experience!', userId: 'p1' },  // Explicit id
        //   { id: 'f2', content: 'Very satisfied with the service.', userId: 'p2' },  // Explicit id
        // ];

        // const feedbackData = await prisma.feedback.createMany({
        //   data: feedbacks,
        // });
        // console.log('Feedbacks seeded:', feedbackData);
        console.log("database seeded");
        
    } catch (error) {
        console.error('Error seeding data:', error);
    } finally {
        await prisma.$disconnect();
    }
}

// Run the seeding function
seedData();
