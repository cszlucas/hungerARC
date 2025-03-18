var mongoose=require('mongoose');
var Schema=mongoose.Schema;


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