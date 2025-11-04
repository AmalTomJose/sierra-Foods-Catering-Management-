const Category = require('../models/categoryModels');


const deleteCategory = async (req, res) => {
  try {
    const categoryId = req.query.id;
    await Category.deleteOne({ _id: categoryId });
    res.json({ success: true, message: 'Category deleted' });
  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false, message: 'Error deleting category' });
  }
}



const loadCategory = async (req, res) => {
  try {
    const { search, status } = req.query;
    let query = {};

    if (status === "block") query.cat_status = false;
    if (status === "active") query.cat_status = true;

    if (search && search.trim() !== "") {
      query.cat_name = { $regex: search.trim(), $options: "i" };
    }

    const categorydata = await Category.find(query);

    // ✅ If AJAX request → send JSON (don't render full page)
    if (req.xhr || req.headers.accept.indexOf("json") > -1) {
      return res.json({ categorydata });
    }

    // ✅ Normal page load
    res.render("admin/category/category", { categorydata });
  } catch (error) {
    console.log(error.message);
  }
};


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
      function toTitleCase(str) {
        return str.toLowerCase().replace(/\b\w/g, (char) => char.toUpperCase());
      }
      
      let category_name = toTitleCase(req.body.categoryname.trim());
        
      // ✅ Validation: Allow only alphabets and spaces
      const validNameRegex = /^[A-Za-z\s]+$/;
  
      if (!validNameRegex.test(category_name)) {
        return res.render("admin/category/addCategory", {
          error: "Category name can only contain letters and spaces.",
        });
      }
  
      // ✅ Check if a category with same name already exists (case-insensitive)
      const existingCategory = await Category.findOne({
        cat_name: { $regex: new RegExp(`^${category_name}$`, "i") },
      });
  
      if (existingCategory) {
        return res.render("admin/category/addCategory", {
          error: "Category with this name already exists.",
        });
      }
  
      // ✅ Save normalized name
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