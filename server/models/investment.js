var mongoose=require('mongoose');
var Schema=mongoose.Schema;

var InvestmentSchema=new Schema({
    _scenario: { type: Schema.Types.ObjectId, ref: 'Scenario', required: true},
    investmentType: { type: Schema.Types.ObjectId, ref: 'InvestmentType', required: true},
    value: {type: Number, required: true},
    accountTaxStatus: {type: String, required: true},
});

module.exports=mongoose.model('Investment', InvestmentSchema);