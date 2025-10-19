const Category = require('../models/categoryModels');



const deleteCategory =async(req,res)=>{
  try{
    console.log('hi deletecategory')
    const  categoryId = req.query.id;
    console.log(categoryId)
    await Category.deleteOne({_id:categoryId});
    req.flash('success','category deleted')
    res.redirect('/admin/category')


  }
  catch(error){
    console.log(error)
  }
}

const loadCategory = async (req,res)=>{
    try{
      const {status} = req.query;
      console.log(status)
      let categorydata=''
      

    if(status=='block'){
categorydata = await Category.find({cat_status:false});



    }
    else{
       categorydata=await Category.find({});}

        res.render('admin/category/category',{
            categorydata
        })
     

    }
    catch(error){
        console.log(error.message);
    }
}

const unlistCategory = async(req,res)=>{
    try{
      const id = req.query.id;
      const categoryvalue = await Category.findById(id);
      if(categoryvalue.cat_status)
      {
        const categoryData = await Category.updateOne({
          _id:id
  
          },
          {
            $set:{
              cat_status:false
            }
          }
        )
      }
      else{
        const categoryData = await Category.updateOne({
          _id:id
        },{
          $set:{
            cat_status : true,
          }
        })
      }
       
      res.redirect('/admin/category')
      
    }
  
  
    catch(error)
    {
      console.log(error.message);
    }
  }
  
  
  const loadeditCategory = async(req,res)=>{
    try{
        const id = req.query.id;
        const categoryData = await Category.findById(id)
   res.render('admin/category/editCategory',{category:categoryData})
      
  
  
  
    }
    catch(error)
    {
      console.log(error.message);
    }
    
  }

  const editCategory = async(req,res)=>{
    try{ 
    
      let id = req.body.category_id;
      let categoryname =req.body.categoryname;
  
      const existingCategory = await Category.findOne({
          cat_name: { $regex: new RegExp(`^${categoryname}$`, 'i') }
       
        });

        if(existingCategory){
          return res.render("admin/category/editCategory",{
              error: "Category name already exists",
              category: existingCategory
          })
        }
        else{
          const newCategory = await Category.updateOne({
            _id:id
          },
        {
          $set:
          {
            cat_name:categoryname
          }
        })
        res.redirect('/admin/category')

          
        }

     

        res.redirect('/admin/category')
      }
    catch(error)
    {
        console.log(error.message)
    }
  }


  const loadaddCategory = async (req,res)=>{
    try{
      res.render('admin/category/addCategory')


    }
    catch(error)
    {
      console.log(error.message)
    }
  }
  const addCategory = async (req, res) => {
    try {
      let category_name = req.body.categoryname.trim().toLowerCase(); // Normalize
      console.log('the console is :',category_name)
  
      // Check if a category with the same trimmed name exists (case-insensitive)
      const existingCategory = await Category.findOne({
        cat_name: { $regex: new RegExp(`^${category_name}$`, 'i') },
      });
  
      if (existingCategory) {
        return res.render("admin/category/addCategory", {
          error: "Category with this name already exists",
        });
      }
  
      // Save with trimmed & normalized name
      const category = new Category({
        cat_name: category_name,
        cat_status: true,
      });
  
      await category.save();
      return res.redirect("/admin/category");
  
    } catch (error) {
      console.log(error.message);
      res.status(500).send("Server Error");
    }
  };
  
  
const loadcategory = async (req,res)=>{
  try{
    
    const loadedCategory = await Category.find({cat_status:true});
  
    res.json(loadedCategory)
  }
  catch(error)
  {
    console.log(error.message);
  }
}


module.exports ={
    loadCategory,
    unlistCategory,
    loadeditCategory,
    editCategory,
    loadaddCategory,
    addCategory,
    loadcategory,
    deleteCategory
}