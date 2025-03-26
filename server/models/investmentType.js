var mongoose=require('mongoose');
var Schema=mongoose.Schema;

var expectedAnnual=new Schema({
    type: {type: String, enum: ['fixedAmt', 'fixedPercent', 'normalAmt', 'normalPercent'], required: false},
    fixed: {type: Number},
    mean: {type: Number,},
    stdDev: {type: Number},
})

var investmentTypeSchema=new Schema({
    name: {type: String},
    description: {type: String},
    annualReturn: {type: expectedAnnual},
    expenseRatio: {type: Number}, //fixed percentage
    annualIncome: {type: expectedAnnual},
    taxability: {type: String}, // tax-exempt or taxable
});

module.exports=mongoose.model('InvestmentType', investmentTypeSchema);
