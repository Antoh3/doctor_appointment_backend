const prisma = require("../prisma/prismaClient");
const haversine = require("../Utils/calculateDistance");
const { axios } = require("axios");
const { reverseGeocode } = require('@esri/arcgis-rest-geocoding');
const { solveRoute } = require('@esri/arcgis-rest-routing');

// Helper function to parse location
function parseLocation(location) {
    if (typeof location === 'string') {
        const [latitude, longitude] = location.split(',').map(Number);
        return { latitude, longitude };
    } else if (typeof location === 'object' && location.latitude && location.longitude) {
        return location;
    } else {
        throw new Error("Invalid location format");
    }
}

// Helper function to validate coordinates
function isValidCoordinate(latitude, longitude) {
    return (
        typeof latitude === 'number' &&
        typeof longitude === 'number' &&
        latitude >= -90 && latitude <= 90 &&
        longitude >= -180 && longitude <= 180
    );
}

// Helper function to fetch location name using Esri Reverse Geocoding
async function fetchLocationName(latitude, longitude, apiKey) {
    try {
        const response = await fetch(
            `https://geocode.arcgis.com/arcgis/rest/services/World/GeocodeServer/reverseGeocode?location=${longitude},${latitude}&f=json&token=${apiKey}`
        );
        const data = await response.json();
        return data.address?.Match_addr || "Unknown location";
    } catch (error) {
        console.error("Error fetching location name:", error.message);
        return "Unknown location";
    }
}

const ambulanceRequest = async (req, res) => {
    const { aidCarType, selectedItems } = req.body;

    const patientId = req.userId

    console.log("User id is", patientId);


    try {
        // Fetch the patient's location
        const patient = await prisma.patient.findUnique({
            where: { id: patientId },
        });
        console.log("Patient location is", patient.permanentLocation);

        if (!patient) {
            return res.status(404).json({ message: 'Patient not found' });
        }

        //   const { lat: patientLat, lng: patientLng } = patient.permanentLocation;
        //   const [patientLat,patientLng] = patient.permanentLocation
        //   console.log("Patient location is",patientLat,patientLng);
        const { permanentLocation } = patient;

        // Validate permanentLocation as an array
        if (!Array.isArray(permanentLocation) || permanentLocation.length !== 2) {
            return res
                .status(400)
                .json({ message: 'Patient location is invalid or not properly formatted' });
        }

        const [patientLat, patientLng] = permanentLocation;

        // console.log(`Patient location is ${patientLat}, ${patientLng}`);

        // Fetch available ambulances of the specified type
        const ambulances = await prisma.ambulance.findMany({
            where: {
                type: aidCarType,
                status: 'available',
            },
        });
        // console.log("Available ambulances",ambulances);


        if (!ambulances.length) {
            return res.status(404).json({ message: 'No ambulances available' });
        }



        // Find the nearest ambulance
        let nearestAmbulance = null;
        let minDistance = Infinity;

        ambulances.forEach((ambulance) => {
            // const { location } = ambulance;

            // // Validate permanentLocation as an array
            // if (!Array.isArray(location) || location.length !== 2) {
            //     return res
            //         .status(400)
            //         .json({ message: 'ambulance location is invalid or not properly formatted' });
            // }

            // const [ambulanceLat, ambulanceLng] = location;

            // console.log(`ambulance location is ${ambulanceLat}, ${ambulanceLng}`);

            // const { lat: ambulanceLat, lng: ambulanceLng } = ambulance.location;
            // console.log("Ambulance location is",ambulance.location);

            // const [ambulanceLat, ambulanceLng] = ambulance.location;
            const { latitude: ambulanceLat, longitude: ambulanceLng } = ambulance.location;

            if (ambulanceLat === undefined || ambulanceLng === undefined) {
                console.error(`Ambulance location is missing: ${JSON.stringify(ambulance)}`);
                return;
            }
            console.log("Ambulance location",ambulance);
            
            const distance = haversine.calculateDistance(
                patientLat,
                patientLng,
                ambulanceLat,
                ambulanceLng
            );

            // console.log(
            //     `Ambulance: ${ambulance.name}, Location: ${ambulanceLat}, ${ambulanceLng}, Distance: ${distance}`
            // );

            // console.log("Ambulance", ambulance);
            if (distance < minDistance) {
                minDistance = distance;
                nearestAmbulance = ambulance;
            }
            // console.log("distance is", distance);

        });

        // If no nearest ambulance is found, return an error
        if (!nearestAmbulance) {
            return res.status(404).json({ message: 'No suitable ambulances found' });
        }

        // Create an ambulance request
        const request = await prisma.ambulanceRequest.create({
            data: {
                patientId: patient.id,
                aidCarType,
                selectedItems,
                ambulanceId: nearestAmbulance.id,
                status: 'pending',
            },
            select:{
                ambulance:true
            }
        });
        console.log("Nearest ambuulance",request);
        

        // console.log("Nearest ambilance",);
        
        // Update the ambulance's status
        await prisma.ambulance.update({
            where: { id: nearestAmbulance.id },
            data: { status: 'on_route' },
        });

        res.status(201).json({
            message: 'Ambulance request created successfully',
            request,
            ambulance: nearestAmbulance,
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal Server Error', error });
    }
}


const createAmbulance = async (req, res) => {
    const { name, licenseNumber, location, type, owner, status } = req.body;

    try {
        const newAmbulance = await prisma.ambulance.create({
            data: {
                name,
                licenseNumber,
                location,
                type,
                owner,
                status: "available"
            }
        })

        res.status(201).json({
            message: "Ambulance created",
            newAmbulance,
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}

const trackAmbulance1 = async (req, res) => {
    const { requestId } = req.params;
    const patientId = req.userId;

    // Using the API key from the HTML code
    const API_KEY = process.env.ESRI_KEY;

    try {
        // Fetch ambulance request and patient data
        const request = await prisma.ambulanceRequest.findUnique({
            where: { id: requestId },
            include: { ambulance: true, patient: true }
        });

        const patient = await prisma.patient.findUnique({
            where: { id: patientId }
        });

        // Check if request or ambulance is found
        if (!request || !request.ambulance) {
            return res.status(404).json({ message: "Ambulance not found" });
        }

        const { permanentLocation } = patient;
        const { location: ambulanceLocation } = request.ambulance;

        // Check if locations are provided
        if (!ambulanceLocation || !permanentLocation) {
            return res.status(404).json({ message: "Ambulance or patient location not found" });
        }

        let ambulanceLat, ambulanceLng;
        // Parse ambulance location based on type
        if (typeof ambulanceLocation === 'string') {
            [ambulanceLat, ambulanceLng] = ambulanceLocation.split(',').map(Number);
        } else if (typeof ambulanceLocation === 'object') {
            ({ latitude: ambulanceLat, longitude: ambulanceLng } = ambulanceLocation);
        } else {
            return res.status(500).json({ message: 'Invalid ambulance location format' });
        }

        console.log("ambulance location", ambulanceLocation);

        const [patientLat, patientLng] = permanentLocation;
        console.log("patient location", patientLat, patientLng);

        // Function to get location name using Esri Reverse Geocoding
        const getLocationName = async (latitude, longitude) => {
            try {
                const response = await fetch(`https://geocode.arcgis.com/arcgis/rest/services/World/GeocodeServer/reverseGeocode?location=${longitude},${latitude}&f=json&token=${API_KEY}`);
                const data = await response.json();
                return data.address.Match_addr || "Unknown location";
            } catch (error) {
                console.error("Error fetching location name:", error.message);
                return "Unknown location";
            }
        };

        // Function to get distance using Esri Routing API
        // const getDistance = async (startLat, startLng, endLat, endLng) => {
        //     try {
        //         const response = await fetch(`https://route.arcgis.com/arcgis/rest/services/World/Route/NAServer/Route_World/solve?stops=${startLng},${startLat};${endLng},${endLat}&f=json&token=${API_KEY}`);
        //         const data = await response.json();
        //         console.log("Response", data);
        //         const distanceInMiles = data.routes.features[0].attributes.Total_Miles;
        //         const distanceInKm = distanceInMiles * 1.60934; // Convert miles to km
        //         return `${distanceInKm.toFixed(2)} Km`;
        //     } catch (error) {
        //         console.error("Error fetching route distance:", error.message);
        //         return "Unknown distance";
        //     }
        // };

        // Get location names
        const ambulanceLocationName = await getLocationName(ambulanceLat, ambulanceLng);
        const patientLocationName = await getLocationName(patientLat, patientLng);

        // Get distance
        // const distance = await getDistance(ambulanceLat, ambulanceLng, patientLat, patientLng);
        const distance = haversine.calculateDistance(
            patientLat,
            patientLng,
            ambulanceLat,
            ambulanceLng,
        )

        // Respond with location data and distance
        res.status(200).json({
            ambulanceLocation: { address: ambulanceLocationName },
            patientLocation: { address: patientLocationName },
            location: { latitude: ambulanceLat, longitude: ambulanceLng },
            distance: `${distance.toFixed(2)} Km`,
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Internal server error" });
    }

}

const trackAmbulance2 = async (req, res) => {
    const { requestId } = req.params;
    const patientId = req.userId;
    const API_KEY = process.env.ESRI_KEY;

    try {
        // Fetch ambulance request and patient data
        const request = await prisma.ambulanceRequest.findUnique({
            where: { id: requestId },
            include: { ambulance: true, patient: true },
        });

        const patient = await prisma.patient.findUnique({
            where: { id: patientId },
        });

        // Validate request and ambulance
        if (!request || !request.ambulance) {
            return res.status(404).json({ message: "Ambulance not found" });
        }

        const { permanentLocation } = patient;
        const { location: ambulanceLocation } = request.ambulance;

        // Validate locations
        if (!ambulanceLocation || !permanentLocation) {
            return res.status(404).json({ message: "Ambulance or patient location not found" });
        }

        // Parse ambulance location
        const { latitude: ambulanceLat, longitude: ambulanceLng } = parseLocation(ambulanceLocation);
        const [patientLat, patientLng] = permanentLocation;

        // Validate latitude and longitude values
        if (!isValidCoordinate(ambulanceLat, ambulanceLng) || !isValidCoordinate(patientLat, patientLng)) {
            return res.status(400).json({ message: "Invalid location coordinates" });
        }

        // Get location names
        const [ambulanceLocationName, patientLocationName] = await Promise.all([
            fetchLocationName(ambulanceLat, ambulanceLng, API_KEY),
            fetchLocationName(patientLat, patientLng, API_KEY),
        ]);

        // Calculate distance
        const distance = haversine.calculateDistance(patientLat, patientLng, ambulanceLat, ambulanceLng);

        // Respond with location data and distance
        res.status(200).json({
            ambulanceLocation: { address: ambulanceLocationName, latitude: ambulanceLat, longitude: ambulanceLng },
            patientLocation: { address: patientLocationName, latitude: patientLat, longitude: patientLng },
            distance: `${distance.toFixed(2)} Km`,
        });
    } catch (error) {
        console.error("Error in trackAmbulance1:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};


const trackAmbulance = async (req, res) => {
    const { requestId } = req.params;
    const patientId = req.userId;

    try {
        const request = await prisma.ambulanceRequest.findUnique({
            where: {
                id: requestId
            },
            include: {
                ambulance: true,
                patient: true,
            }
        })

        const patient = await prisma.patient.findUnique({
            where: {
                id: patientId
            }
        })


        if (!request || !request.ambulance) {
            res.status(404).json({ message: "Ambulance not found" });
        }

        const { permanentLocation } = patient;

        const { location: ambulanceLocation } = request.ambulance;
        console.log("ambulance location", ambulanceLocation);

        const [patientLat, patientLng] = permanentLocation;
        console.log("Patient location", patientLat, patientLng);


        if (!ambulanceLocation || !patientLat || !patientLng) {
            res.status(404).json({ message: "Ambulance or patient location not found" });
        }

        // const [ambulanceLat, ambulanceLng] = ambulanceLocation.split(',').map(Number);
        let ambulanceLat, ambulanceLng;

        // Handle location format
        if (typeof ambulanceLocation === 'string') {
            [ambulanceLat, ambulanceLng] = ambulanceLocation.split(',').map(Number);
        } else if (typeof ambulanceLocation === 'object') {
            ({ latitude: ambulanceLat, longitude: ambulanceLng } = ambulanceLocation);
        } else {
            return res.status(500).json({ message: 'Invalid ambulance location format' });
        }

        const distance = haversine.calculateDistance(
            patientLat,
            patientLng,
            ambulanceLat,
            ambulanceLng,
        )

        const getLocationName = async (latitude, longitude) => {
            console.log("in geo location");

            const API_KEY = process.env.ESRI_KEY;// Replace with your actual API key
            const url = `https://maps.gomaps.pro/maps/api/js?key=${API_KEY}&libraries=geometry,places&callback=initMap`;

            try {
                const response = await axios.get(url);
                console.log('Google Maps API response:', response.data); // Log the response for debugging

                const results = response.data.results;

                if (results && results.length > 0) {
                    return results[0].formatted_address; // Return the first result's formatted address
                }

                return 'Unknown location'; // Return default message if no results found
            } catch (error) {
                console.error('Error fetching location name:', error.message);
                return 'Unknown location'; // Return default message in case of an error
            }
        };


        const ambulanceLocationName = await getLocationName(ambulanceLat, ambulanceLng);
        const patientLoctionName = await getLocationName(patientLat, patientLng);

        res.status(200).json({
            ambulanceLocation: {
                address: ambulanceLocationName
            },
            patientLocation: {
                address: patientLoctionName
            },
            location: { latitude: ambulanceLat, longitude: ambulanceLng },
            distance: `${distance.toFixed(2)} Km`,
        })
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Internal server error" });
    }
}

const getAllAmbulances = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;

        const ambulances = await prisma.ambulance.findMany({
            select: {
                id: true,
                name: true,
                owner: true,
                location: true,
                type: true,
                status: true
            },
            skip,
            take: limit
        });

        const totalRecords = await prisma.ambulance.count();
        const totalPages = Math.ceil(totalRecords / limit);

        res.status(200).json({
            totalPages,
            ambulances: ambulances,
            currentPage: page,
            totalRecords
        });
    } catch (error) {
        console.error("Error in fetching ambulances");
        res.status(400).json({ message: "error in fetching ambulances" })
    }
}

const getAllAmbulanceRequests = async (req, res) => {
    const patientId = req.userId;

    const user = await prisma.patient.findUnique({
        where: {
            id: patientId
        }
    })
    if (!user) {
        return res.status(404).json({ message: "Login first" })
    }
    // const patientName = `${user.firstName}-${user.lastName}`
    const requests = await prisma.ambulanceRequest.findMany({
        where: {
            patientId: patientId
        },
        select: {
            id: true,
            aidCarType: true,
            status: true,

            ambulance: {
                select: {
                    owner: true,
                    name: true
                }
            },

            patient: {
                select: {
                    firstName: true,
                    lastName: true
                }
            },
        },
        orderBy:{
            createdAt: 'desc'
        }
    })


    return res.status(200).json(requests)
}

const getAllAmbulanceRequestsAdmin = async (req, res) => {
    // const patientName = `${user.firstName}-${user.lastName}`
    const requests = await prisma.ambulanceRequest.findMany({
        select: {
            id: true,
            aidCarType: true,
            status: true,

            ambulance: {
                select: {
                    owner: true,
                    name: true
                }
            },
            patient: {
                select: {
                    firstName: true,
                    lastName: true
                }
            }
        }
    })


    return res.status(200).json(requests)
}

const getAmbulanceById = async (req, res) => {
    const { ambulanceId } = req.params;
    console.log("in ambulance id");


    const ambulance = await prisma.ambulance.findUnique({
        where: {
            id: ambulanceId
        }
    })

    res.status(200).json(ambulance);
}

const updateAmbulance = async (req, res) => {
    const { name, licenseNumber, type, owner, status } = req.body;
    const { ambulanceId } = req.params;

    const ambulance = await prisma.ambulance.findUnique({
        where: {
            id: ambulanceId
        }
    });

    if (!ambulance) {
        res.status(404).json({ message: "Ambulance not available" })
    }

    const updatedAmbulance = await prisma.ambulance.update({
        where: {
            id: ambulanceId
        },
        data: {
            name: name,
            // licenseNumber: licenseNumber,
            // location: location,
            type: type,
            owner: owner,
            status: status,
        }
    });

    res.status(201).json(updatedAmbulance)
}

const approveAmbulance = async (req, res) => {
    const { ambulanceId } = req.params;
    const { status } = req.body;
    console.log("In ambulance approve");


    const ambulance = await prisma.ambulance.findUnique({
        where: {
            id: ambulanceId
        }
    })

    if (!ambulance) {
        return res.status(404).json({ message: "ambulance id not found" })
    }

    const updatedStatus = await prisma.ambulance.update({
        where: {
            id: ambulanceId
        },
        data: {
            status
        }
    })
    res.status(200).json(updatedStatus)
}

const approveAmbulanceRequest = async (req, res) => {
    const { ambulanceRequestId } = req.params;
    const { status } = req.body;

    const ambulanceRequest = await prisma.ambulanceRequest.findUnique({
        where: {
            id: ambulanceRequestId
        }
    })

    if (!ambulanceRequest) {
        res.status(404).json({ message: "ambulanceRequestId not found" });
    }

    const updatedAmbulanceRequest = await prisma.ambulanceRequest.update({
        where: {
            id: ambulanceRequestId
        },
        data: {
            status
        }
    })
    res.status(200).json(updatedAmbulanceRequest);
}

const getAmbulancetStatus = async (req, res) => {
    // const userId = req.userId;
    // const userRole = req.userRole;

    // let filter = {}

    // if(userRole === 'doctor'){
    //     filter.doctorId = userId
    // }else if (userRole === 'patient') {
    //     filter.patientId = userId
    // }else{
    //     return res.status(403).json({message:"Unauthorized"});
    // }

    const count = await prisma.ambulance.groupBy({
        by: ['status'],
        _count: { status: true },
    })

    const total = await prisma.ambulance.count()

    const formattesStatus = count.reduce((acc, curr) => {
        acc[curr.status] = curr._count.status;
        return acc;
    }, {})

    res.status(200).json({
        total: total,
        formattesStatus
    })
}

const getAmbulancetRequestStatus = async (req, res) => {
    // const userId = req.userId;
    // const userRole = req.userRole;

    // let filter = {}

    // if(userRole === 'doctor'){
    //     filter.doctorId = userId
    // }else if (userRole === 'patient') {
    //     filter.patientId = userId
    // }else{
    //     return res.status(403).json({message:"Unauthorized"});
    // }

    const count = await prisma.ambulanceRequest.groupBy({
        by: ['status'],
        _count: { status: true },
    })

    const total = await prisma.ambulanceRequest.count()

    const formattesStatus = count.reduce((acc, curr) => {
        acc[curr.status] = curr._count.status;
        return acc;
    }, {})

    res.status(200).json({
        total: total,
        formattesStatus
    })
}

const cancelRequestAdmin = async (req, res) => {
    const { ambulanceRequestId } = req.params;
    const { status } = req.body;

    const ambulanceRequest = await prisma.ambulanceRequest.findUnique({
        where: {
            id: ambulanceRequestId
        }
    })

    if (!ambulanceRequest) {
        return res.status(404).json({ message: "RequestId not found" })
    }

    const updatedRequest = await prisma.ambulanceRequest.update({
        where: {
            id: ambulanceRequestId
        },
        data: {
            status: "canceled_by_admin"
        }
    })
    res.status(200).json(updatedRequest)
}

const acceptRequestAdmin = async (req, res) => {
    const { ambulanceRequestId } = req.params;
    const { status } = req.body;

    const ambulanceRequest = await prisma.ambulanceRequest.findUnique({
        where: {
            id: ambulanceRequestId
        }
    })

    if (!ambulanceRequest) {
        return res.status(404).json({ message: "RequestId not found" })
    }

    const updatedRequest = await prisma.ambulanceRequest.update({
        where: {
            id: ambulanceRequestId
        },
        data: {
            status: 'accepted'
        }
    })
    res.status(200).json(updatedRequest)
}


const completeRequestAdmin = async (req, res) => {
    const { ambulanceRequestId } = req.params;
    const { status } = req.body;

    const ambulanceRequest = await prisma.ambulanceRequest.findUnique({
        where: {
            id: ambulanceRequestId
        }
    })

    if (!ambulanceRequest) {
        return res.status(404).json({ message: "RequestId not found" })
    }

    const updatedRequest = await prisma.$transaction([
        prisma.ambulanceRequest.update({
            where: {
                id: ambulanceRequestId
            },
            data: {
                status: 'completed'
            }
        }),
        prisma.ambulance.update({
            where:{
                id: ambulanceRequest.ambulanceId
            },
            data: {
                status:'available'
            }
        })
    ])
    
    res.status(200).json(updatedRequest)
}

const changeAmbulanceStatus = async (req,res) => {
    const { ambulanceId}  = req.params
    const { status } = req.body

    const ambulance = await prisma.ambulance.findUnique({
        where:{
            id:ambulanceId
        }
    })

    if (!ambulance) {
        return res.status(404).json({message:"ambulance not found"})
    }

    const updatedAmbulance = await prisma.ambulance.update({
        where:{
            id:ambulance.id
        },
        data:{
            status
        }
    })

    return res.status(200).json({message:"Ambulance updated",updatedAmbulance})
}

const deleteAmbulance = async (req,res) => {
    const { ambulanceId } = req.params

    const ambulance = await prisma.ambulance.findUnique({
        where:{
            id:ambulanceId
        }
    })

    if (!ambulance) {
        return res.status(404).json({message:"Ambulance not found"})
    }

    const deletedAmbulance = await prisma.ambulance.delete({
        where:{
            id:ambulance.id
        }
    })

    return res.status(200).json({message:"Ambulance deleted",deletedAmbulance})
}
module.exports = {
    ambulanceRequest,
    createAmbulance,
    trackAmbulance,
    getAllAmbulances,
    getAmbulanceById,
    updateAmbulance,
    trackAmbulance1,
    trackAmbulance2,
    getAllAmbulanceRequests,
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
}