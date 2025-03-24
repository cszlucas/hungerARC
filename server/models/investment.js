var mongoose=require('mongoose');
var Schema=mongoose.Schema;

var InvestmentSchema=new Schema({
    investmentType: { type: Schema.Types.ObjectId, ref: 'InvestmentType'},
    value: {type: Number, required: true},
    accountTaxStatus: {type: String, required: true},
});

module.exports=mongoose.model('Investment', InvestmentSchema);