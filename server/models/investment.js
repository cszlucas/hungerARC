var mongoose=require('mongoose');
var Schema=mongoose.Schema;

var InvestmentSchema=new Schema({
    investmentType: { type: Schema.Types.ObjectId, ref: 'InvestmentType'},
    value: {type: Number},
    accountTaxStatus: {type: String},
});

module.exports=mongoose.model('Investment', InvestmentSchema);