var mongoose = require('mongoose');

var productSchema = mongoose.Schema({
    name: {
        type: String,
        required: true,
    },
    description: {
        type: String,
        required: true
    },
    richDescription: {
        type: String,
        default: ''
    },
    color: [{
        type: String,
        validate: [colorValidator, 'not a valid color'] 
    }],
    image: {
        type: String,
        default: ''
    },
    images: [{
        type: String,

    }],
    price : {
        type: Number,
        default: 0
    },
    category: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Category',
        required: true 
    },
    countInStock: {
        type: Number,
        required: true,
        min: 0,
        max: 1000000
    },
    rating: {
        type: Number,
        default: 0
    },
    numReviews: {
        type: Number,
        default: 0,
    },
    isFeatured: {
        type: Boolean,
        default: false
    },
    dateCreated: {
        type: Date,
        default: Date.now
    }
});
productSchema.set('toJSON', {
    virtuals: true,
});

productSchema.virtual('id').get(() => {
    return this._id;
});

function colorValidator (v) {
    if (v.indexOf('#') == 0) {
        if (v.length == 7) {  // #f0f0f0
            return true;
        } else if (v.length == 4) {  // #fff
            return true;
        }
    }
    return COLORS.indexOf(v) > -1;
};

exports.Product = mongoose.model('Product', productSchema);