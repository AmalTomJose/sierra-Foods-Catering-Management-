const Category = require('../models/categoryModels');
const Subcategory = require('../models/subcategoryModel');





const loadSubcategory = async (req,res)=>{
    try{
        const categoryid = req.query.id;
        console.log('testing inside loadSubcategory')
        console.log(categoryid)
        const subcategoryData = await Subcategory.find({category:categoryid})
        console.log(subcategoryData);
        res.render('admin/subcategory/subcategory',{subcategories:subcategoryData,categoryid})

    }
    catch(error)
    {
        console.log(error.message)
    }
}

const unlistsubCategory = async(req,res)=>{
    try{

        const id = req.query.id;
        console.log(id)
        console.log('test inside')
        const subcategoryvalue = await Subcategory.findById(id);
        console.log(subcategoryvalue)
        if(subcategoryvalue.subcat_status)
        {
          const subcategoryData = await Subcategory.updateOne({
            _id:id
    
            },
            {
              $set:{
                subcat_status:false
              }
            }
          )
        }
        else{
          const subcategoryData = await Subcategory.updateOne({
            _id:id
          },{
            $set:{
              subcat_status : true,
            }
          })
          
        }
        console.log('inportant')
         
        res.redirect('/admin/category')
        


    }
    catch(error)
    {
        console.log(error.message)
    }
}

const  loadeditsubCategory = async(req,res)=>{
    try{

 const id = req.query.id;
        const subcategoryData = await Subcategory.findById(id)
   res.render('admin/subcategory/editSubcategory',{subcategory:subcategoryData})
      
    }
    catch(error){
        console.log(error.message)
    }
}

const editsubCategory = async(req,res)=>{
    try{
        let id = req.body.category_id;
      let subcategoryname =req.body.subcategoryname.trim().toLowerCase(); ;
  
      const existingCategory = await Subcategory.findOne({
          subcat_name: { $regex: new RegExp(`^${subcategoryname}$`, 'i') }
       
        });
        

        if(existingCategory){
          return res.render("admin/subcategory/editsubCategory",{
              error: "sub Category name already exists",
              category: existingCategory
          })
        }
        else{
          const newsubCategory = await Subcategory.updateOne({
            _id:id
          },
        {
          $set:
          {
            subcat_name:subcategoryname
          }
        })
        res.redirect('/admin/category')

          
        }

     

        res.redirect('/admin/category')


    }
    catch(error){
        console.log(error.message)
    }
}

const loadaddSubcategory = async(req,res)=>{
  try{
    let category_id = req.query.id;
    res.render('admin/subcategory/addsubcategory',{category:category_id});

  }
  catch(error)
  {
    console.log(error.message)
  }
}
const addSubcategory = async(req,res)=>{
  try{
    
     console.log(req.body);
     const category_id = req.body.categoryid;
     const subcategoryname= req.body.subcategoryname;
    console.log(category_id);
    console.log(subcategoryname);
    console.log('nfknsda')
      const existingSubcategory = await Subcategory.findOne({
      subcat_name: { $regex: new RegExp(`^${subcategoryname}$`, 'i') }, // Case-insensitive match


    });
    if(existingSubcategory){
      return res.render('admin/subcategory/addsubcategory',{
        error:'Subcategory with same name exists',
        category:category_id
      })
    }
    else{
      const addsub =  new Subcategory({
        subcat_name:subcategoryname,
        category:category_id
      }) 
      const subdata = await addsub.save();
      console.log(subdata)
      return res.redirect('/admin/category')
    } 
  }
  catch(error)
  {
    console.log(error.message)
  }
}
 
const loadsubcategory = async (req,res)=>{
  try{
    let cat_id = req.params.id;
    const subcat_details = await Subcategory.find({category : cat_id,subcat_status : true});
    res.json(subcat_details);

  }
  catch(error)
  {
    console.log(error.message);
  }
}






module.exports = {
    loadSubcategory,
    unlistsubCategory,
    loadeditsubCategory,
    editsubCategory,
    loadaddSubcategory,
    addSubcategory,
    loadsubcategory

}