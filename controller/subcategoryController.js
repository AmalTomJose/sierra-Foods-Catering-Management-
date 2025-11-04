const Category = require('../models/categoryModels');
const Subcategory = require('../models/subcategoryModel');
// Controller: loadSubcategory
const loadSubcategory = async (req, res) => {
  try {
    const categoryid = req.query.id;
    const { status, search, ajax } = req.query;

    let filter = { category: categoryid };

    if (status === 'block') filter.subcat_status = false;
    if (status === 'active') filter.subcat_status = true;
    if (search?.trim()) filter.subcat_name = { $regex: new RegExp(search.trim(), "i") };

    const subcategoryData = await Subcategory.find(filter).lean();

    // ✅ If AJAX request, return JSON instead of rendering page
    if (ajax) {
      return res.json({ subcategories: subcategoryData });
    }

    res.render("admin/subcategory/subcategory", {
      subcategories: subcategoryData,
      categoryid,
      currentStatus: status || "",
      currentSearch: search || "",
    });
  } catch (error) {
    console.log("Error in loadSubcategory:", error.message);
    res.status(500).send("Internal Server Error");
  }
};



const unlistsubCategory = async (req, res) => {
  try {
    const id = req.query.id;
    console.log(id, ' <- Subcategory ID');

    const subcategory = await Subcategory.findById(id);

    if (!subcategory) {
      return res.json({ success: false, message: "Subcategory not found" });
    }

    // ✅ Toggle status
    subcategory.subcat_status = !subcategory.subcat_status;
    await subcategory.save();

    console.log("Status Updated:", subcategory.subcat_status);

    // ✅ ✅ IMPORTANT: Return JSON instead of redirect
    return res.json({
      success: true,
      newStatus: subcategory.subcat_status,
      message: "Subcategory status updated successfully"
    });

  } catch (error) {
    console.log(error.message);
    return res.json({ success: false, message: "Server error" });
  }
};

// Load Edit Subcategory Page
const loadeditsubCategory = async (req, res) => {
  try {
    const id = req.query.id;
    const subcategoryData = await Subcategory.findById(id).populate('category');

    if (!subcategoryData) {
      return res.redirect('/admin/subcategory');
    }

    res.render('admin/subcategory/editSubcategory', {
      subcategory: subcategoryData,
      error: null,
      message: null,
    });
  } catch (error) {
    console.log(error.message);
    res.redirect('/admin/subcategory');
  }
};

// Handle Edit Subcategory (Update Only Name)
const editsubCategory = async (req, res) => {
  try {
    const id = req.body.subcategory_id;
    const subcategoryname = req.body.subcategoryname.trim();

    // === VALIDATION ===
    if (!subcategoryname || !/^[A-Za-z ]+$/.test(subcategoryname) || / {2,}/.test(subcategoryname)) {
      const subcategoryData = await Subcategory.findById(id).populate('category');
      return res.render('admin/subcategory/editSubcategory', {
        subcategory: subcategoryData,
        error: 'Invalid subcategory name. Only letters and single spaces allowed.',
        message: null,
      });
    }

    // === DUPLICATE CHECK (Case-insensitive) ===
    const existingSubcategory = await Subcategory.findOne({
      subcat_name: { $regex: new RegExp(`^${subcategoryname}$`, 'i') },
      _id: { $ne: id }, // exclude current
    });

    if (existingSubcategory) {
      const subcategoryData = await Subcategory.findById(id).populate('category');
      return res.render('admin/subcategory/editSubcategory', {
        subcategory: subcategoryData,
        error: 'A subcategory with this name already exists.',
        message: null,
      });
    }

    // === UPDATE SUBCATEGORY NAME ===
    await Subcategory.updateOne(
      { _id: id },
      { $set: { subcat_name: subcategoryname } }
    );

    // ✅ Redirect back to subcategory list page after successful update
    return res.redirect('/admin/category');
  } catch (error) {
    console.log(error.message);
    res.redirect('/admin/subcategory');
  }
};



const loadaddSubcategory = async(req,res)=>{
  try{
    let category_id = req.query.id;
    res.render('admin/subcategory/addsubcategory',{category:category_id,error:''});

  }
  catch(error)
  {
    console.log(error.message)
  }
}
const addSubcategory = async (req, res) => {
  try {
    const category_id = req.body.categoryid?.trim();
    let subcategoryname = req.body.subcategoryname?.trim();

    // 1️⃣ Normalize name (remove extra spaces between words)
    subcategoryname = subcategoryname.replace(/\s+/g, ' ');

    // 2️⃣ Validation rules
    const errors = [];

    // Empty check
    if (!subcategoryname) {
      errors.push('Subcategory name cannot be empty.');
    }

    // Only alphabets and single spaces allowed (no numbers/symbols)
    if (!/^[A-Za-z ]+$/.test(subcategoryname)) {
      errors.push('Subcategory name should contain only letters and spaces (no numbers or special characters).');
    }

    // Multiple consecutive spaces (already normalized, but double-check)
    if (/\s{2,}/.test(subcategoryname)) {
      errors.push('Subcategory name cannot contain multiple spaces.');
    }

    // If validation fails, re-render with error
    if (errors.length > 0) {
      return res.render('admin/subcategory/addsubcategory', {
        error: errors.join(' '),
        category: category_id,
      });
    }

    // 3️⃣ Check for existing subcategory (case-insensitive, ignoring extra spaces)
    const existingSubcategory = await Subcategory.findOne({
      subcat_name: { $regex: new RegExp(`^${subcategoryname}$`, 'i') },
    });

    if (existingSubcategory) {
      return res.render('admin/subcategory/addsubcategory', {
        error: 'Subcategory with the same name already exists.',
        category: category_id,
      });
    }

    // 4️⃣ Save new subcategory
    const newSubcategory = new Subcategory({
      subcat_name: subcategoryname,
      category: category_id,
    });

    await newSubcategory.save();
    console.log('Subcategory added:', newSubcategory);

    return res.redirect('/admin/category');
  } catch (error) {
    console.error('Error adding subcategory:', error.message);
    res.status(500).render('admin/subcategory/addsubcategory', {
      error: 'Something went wrong while adding the subcategory. Please try again.',
      category: req.body.categoryid,
    });
  }
};

 
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