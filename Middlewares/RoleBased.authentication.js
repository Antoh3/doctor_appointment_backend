//role based authorization

// const DoctorAuth=(req,res,next)=>{
//     let {role}=req.body
//     if(role=="doctor" || role=="admin"){
//         next()
//     }else{
//         res.status(403).json({ message: 'Admin or Doctor can acsess',status:true });
//     }
// }

const DoctorAuth=(req,res,next)=>{
    let role = req.userRole
    if(role == "doctor"){
        next()
    }else{
        res.status(403).json({ message: 'Admin or Doctor can acsess',status:true });
    }
}


const PatientAuth=(req,res,next)=>{
    const role = req.userRole

    if(role=="patient" || role=="doctor"){
        console.log(role)
        next()
    }else{
        res.status(403).json({ message: 'Admin or Doctor can acsess',status:true });
    }
}

module.exports={DoctorAuth,PatientAuth}