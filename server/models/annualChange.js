var mongoose = require('mongoose');
var Schema = mongoose.Schema;

// for income and expense event series
var AnnualChangeSchema=new Schema({
    amount: {
        type: String, 
        enum: ['fixed', 'percentage'], 
        required: true
    },
    distribution: {
        type: String, 
        enum: ['none', 'normal, uniform'], 
        required: true
    },
    value: {
        type: Number,
        required: function(){
            return this.distribution=='none' && (this.amount==='fixed' || this.amount==='percentage');
        }
    },
    mean: {
        type: Number,
        required: function(){
            return this.distribution==='normal';
        }
    },
    stdDev: {
        type: Number,
        required: function(){
            return this.distribution==='normal';
        }
    },
    min: {
        type: Number,
        required: function(){
            return this.distribution==='uniform';
        }
    },
    max: {
        type: Number,
        required: function(){
            return this.distribution==='uniform';
        }
    },
})

module.exports = mongoose.model('AnnualChange', AnnualChangeSchema);