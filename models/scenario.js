var mongoose=require('mongoose');
var Schema=mongoose.Schema;

var scenarioSchema=new Schema({
    name: {type: String, required: true},
    filingStatus: {type: String, required: true},
    birthYearUser: {type: Number, required: true},
    lifeExpectancy: {
        type: {
            type: String,
            enum: ['fixed', 'normal'],
            required: true
        },
        fixedAge: { type: Number, min: 0 },
        mean: { type: Number, min: 0 },
        stdDev: { type: Number, min: 0 }
    },
    setOfInvestments: [{ type: Schema.Types.ObjectId, ref: 'Investment' }],
    setOfInvestmentTypes: [{ type: Schema.Types.ObjectId, ref: 'InvestmentType' }],
    eventSeries: [{ type: Schema.Types.ObjectId, ref: 'Event' }],
});

module.exports=mongoose.model('Scenario', scenarioSchema);