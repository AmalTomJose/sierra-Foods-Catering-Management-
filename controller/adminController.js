const loadHomepage = async(req,res)=>{
    try{
        return res.render('home',{title:'Home Page'})

    }
    catch(error){
        console.log("Home page not found");
        res.status(500).send("Server Error");
    }
}


module.exports = {
    loadHomepage,
}