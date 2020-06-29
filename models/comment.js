var mongoose = require("mongoose");

var commentSchema = new mongoose.Schema({
  text: String,
  createdAt: {
    type: Date,
    default: Date.now
  },
  author: {
    id: {
      type: mongoose.Schema.Types.ObjectId,
      // ref refers to the Model we are going to refer to mongoose.Schema.Types.ObjectId which is User
      ref: "User"
    },
    username: String
  }
});


module.exports = mongoose.model("Comment", commentSchema);