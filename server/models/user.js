var mongoose=require('mongoose');
var Schema=mongoose.Schema;

var userSchema=new Schema({
    googleId: {type: String, required: true, unique: true},
    email: {type: String, required: true, unique: true},
    guest: {type: Boolean, required: true},
    scenarios: [{ type: Schema.Types.ObjectId, ref: 'Scenario' }],
    lastLogin: {type: Date, default: Date.now},
    stateYaml: [{ type: Schema.Types.ObjectId, ref: 'StateTax' }],
});

const User =mongoose.model('User', userSchema);
module.exports = User;
