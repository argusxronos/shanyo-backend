const mongoose = require('mongoose');

const categorySchema = mongoose.Schema({
    name: {
        type:  String,
        required: true
    },
    icon: {
        type: String,
    },
    color: {
        type: String
    }
})

categorySchema.virtual('id').get(() => {
    return this._id;
});

categorySchema.set('toJSON', {
    virtuals: true,
});

exports.Category = mongoose.model('Category', categorySchema);