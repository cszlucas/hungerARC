var mongoose=require('mongoose');
var Schema=mongoose.Schema;

<<<<<<< HEAD
var expectedAnnual=new Schema({
    type: {type: String, enum: ['fixedAmt', 'fixedPercent', 'normalAmt', 'normalPercent'], required: true},
    fixed: {type: Number},
    mean: {type: Number,},
    stdDev: {type: Number},
})

var investmentTypeSchema=new Schema({
    name: {type: String, required: true},
    description: {type: String},
    annualReturn: {type: expectedAnnual},
    // percentage
    expenseRatio: {type: Number, required: true},
    annualIncome: {type: expectedAnnual},
    taxability: {type: String, required: true},
});

module.exports=mongoose.model('InvestmentType', investmentTypeSchema);
=======

var ExpectedAnnual=new Schema({
    amount: {
        type: String, 
        enum: ['fixed', 'percentage'], 
        required: true
    },
    distribution: {
        type: String, 
        enum: ['none', 'normal'], 
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
})


var InvestmentTypeSchema=new Schema({
    name: {type: String, required: true},
    description: {type: String},
    annualReturn: {type: ExpectedAnnual},
    // percentage
    expenseRatio: {type: Number, required: true},
    annualIncome: {type: ExpectedAnnual},
    taxability: {type: String, required: true},
});

module.exports=mongoose.model('InvestmentType', InvestmentTypeSchema);
>>>>>>> 157a149a9b8f6cf5b1a4026de30b03e64bf7c91b
