var mongoose=require('mongoose');
var Schema=mongoose.Schema;

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


var investmentSchema=new Schema({
    _scenario: { type: Schema.Types.ObjectId, ref: 'Scenario', required: true},
    investmentType: { type: investmentTypeSchema, required: true},
    value: {type: Number, required: true},
    accountTaxStatus: {type: String, required: true},
});

module.exports=mongoose.model('Investment', investmentSchema);