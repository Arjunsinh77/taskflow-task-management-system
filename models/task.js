const mongoose = require('mongoose');

const taskSchema = mongoose.Schema({
    title:String,
    description:String,
    userId:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"user"
    }
});

module.exports = mongoose.model("task",taskSchema);