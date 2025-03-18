const pageNotFound = async(req,res)=>{
    try{
       res.render('user/pagenotfound',{title:'pageNotFound',layout:'layouts/user'})

    }
    catch(error)
    {
        res.redirect('/pageNotFound')
    }
}





const loadHomepage = async(req,res)=>{
    try{
        return res.render('user/home',{title:'Home Page',layout: 'layouts/user'})

    }
    catch(error){
        console.log("Home page not found");
        res.status(500).send("Server Error");
    }
}

//login page
const loadLogin = async(req,res)=>{
    try{
        res.render('user/login',{title:'Login',layout:'layouts/user'})

    }
    catch(error)
    {
        res.status(500).send("Server Error");
    }
}


module.exports = {
    loadHomepage,
    pageNotFound,
    loadLogin,
}