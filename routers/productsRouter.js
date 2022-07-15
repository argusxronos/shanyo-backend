const express = require('express');
const { Category } = require('../models/category');
const router = express.Router();
const { Product } = require('../models/product');
const mongoose = require('mongoose');
const multer = require('multer');

const FILE_TYPE_MAP = {
    'image/png': 'png',
    'image/jpg': 'jpg',
    'image/jpeg': 'jpeg',
}

// PARAMETERS
var storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const isValid = FILE_TYPE_MAP[file.mimetype];
        let uploadError = new Error('Invalid image type.')
        if(isValid) uploadError = null;
        cb(uploadError, 'public/uploads');
    },
    filename: function (req, file, cb) {
        const filename = file.originalname.split(' ').join('-');
        const extension = FILE_TYPE_MAP[file.mimetype];

        cb(null, `${file.fieldname}-${Date.now()}.${extension}`);
    }
})

const uploadOptions = multer({ storage: storage })

// GET ALL PRODUCTS
// FILTER THE PRODUCTS BY CATEGORIES
router.get(`/`, async (req, res) => {
    // creating the filter as array
    let filter = {};
    if (req.query.categories) {
        filter = {category: req.query.categories.split(',')};
    }

    const productList = await Product.find(filter)
    .populate('category');

    if(!productList) {
        return res.status(500).json({success: false})
    }
    res.send(productList);
})

// GET PRODUCT BY ID
router.get('/:id', async (req, res) => {
    if (!mongoose.isValidObjectId(req.params.id)) {
        return res.status(400).json({success: false, message: 'Invalid product ID!'})
    } 

    const product = await Product.findById(req.params.id)
    .populate('category');

    if (!product) {
        return res.status(500).json({success: false, message: 'Product not found!'});
    }
    res.send(product);
})

// COUNT PRODUCTS
router.get('/get/count', async (req, res) => {
    const productsCount = await Product.countDocuments();

    if (!productsCount) {
        return res.status(500).json({success: false, message: 'Cannot proccess the count!'})
    }
    res.send({
        productCount: productsCount
    });
})

// GET ONLY LIMITED FEATURED PRODUCTS
router.get('/get/featured/:count', async(req, res) => {
    const count = req.params.count ? req.params.count : 0;
    const featuredProducts = await Product.find({ isFeatured: true }).limit(+count);

    if (!featuredProducts) {
        return res.status(500).json({success: false, message: 'Cannot proccess the featured products!'})
    }
    res.send(featuredProducts);
})

// INSERT NEW PRODUCT
router.post(`/`, uploadOptions.single('image'), async (req, res) => {
    // validations
    const category = await Category.findById(req.body.category);
    if (!category) {
        return res.status(400).json({success: false, message: 'Invalid Category'})
    }
    const file = req.file;
    if(!file){
        return res.status(400).json({ success: false, message: 'No image in the request.'});
    }

    const fileName = req.file.filename;
    const basePath = `${req.protocol}://${req.get('host')}/public/upload/`;

    // saving new product
    let product = new Product({
        name: req.body.name,
        description: req.body.description,
        richDescription: req.body.richDescription,
        image: `${basePath}${fileName}`,
        brand: req.body.brand,
        price: req.body.price,
        category: req.body.category,
        countInStock: req.body.countInStock,
        rating: req.body.rating,
        numReviews: req.body.numReviews,
        isFeatured: req.body.isFeatured
    })

    product = await product.save();
    
    if (!product) {
        return res.status(500).json({success: false, message: 'The product cannot be created!'});
    }
    res.send(product);
})

// PUT SECTION
// UPDATE A PRODUCT BY ID
router.put('/:id', uploadOptions.single('image'), async(req, res) => {
    if (!mongoose.isValidObjectId(req.params.id)) {
        return res.status(400).json({success: false, message: 'Invalid product ID!'})
    } 

    const category = await Category.findById(req.body.category);
    if (!category) {
        return res.status(400).json({success: false, message: 'Invalid Category!'})
    }

    const validProduct = await Product.findById(req.params.id);
    if (!validProduct) {
        return res.status(400).json({success: false, message: 'Invalid Product!'});
    }

    const file = req.file;
    let imagePath;
    if (file) {
        const fileName = file.filename;
        const basePath = `${req.protocol}://${req.get('host')}/public/uploads/`;
        imagePath = `${basePath}${fileName}`;
    } else {
        imagePath = validProduct.filename;
    }

    const product = await Product.findByIdAndUpdate(
        req.params.id,
        {
            name: req.body.name,
            description: req.body.description,
            richDescription: req.body.richDescription,
            image: imagePath,
            brand: req.body.brand,
            price: req.body.price,
            category: req.body.category,
            countInStock: req.body.countInStock,
            rating: req.body.rating,
            numReviews: req.body.numReviews,
            isFeatured: req.body.isFeatured
        },
        { new: true }
    )

    if (!product) {
        return res.status(400).json({success: false, message: 'Product cannot be updated!'})
    }

    res.send(product);
})

// UPLOAD MORA THAN ONE IMAGE FILE
router.put(
    '/gallery-images/:id', 
    uploadOptions.array('images', 10), 
    async (req, res) => {
        if(!mongoose.isValidObjectId(req.params.id)){
            return res.status(400).json({success: false, message: 'Invalid Product id.'});
        }
        const files = req.files;
        
        let imagesPaths = [];
        const basePath = `${req.protocol}://${req.get('host')}/public/uploads/`;
        if (files) {
            files.map(file => {
                imagesPaths.push(`${basePath}${file.filename}`)
            })
        }


        const product = await Product.findByIdAndUpdate(
            req.params.id,
            {
                images: imagesPaths
            },
            { new: true }
        )

        if (!product) {
            return res.status(500).json({success: false, message: 'The product cannot be updated!'});
        }

        res.send(product);
})

// DELETE SECTION
// DELETE A ELEMENT BY ID
router.delete('/:id', (req, res) => {
    if (!mongoose.isValidObjectId(req.params.id)) {
        return res.status(400).json({success: false, message: 'Invalid product ID!'})
    } 

    Product.findByIdAndRemove(req.params.id).then(product => {
        if (product) {
            return res.status(200).json({success: true, message: 'Product was deleted!'})
        } else {
            return res.status(404).json({success: false, message: 'Product not found!'})
        }
    }).catch(err => {
        return res.status(500).json({success: false, message: err})
    })
})

module.exports = router;