const mongoose = require("mongoose");

const myListSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    movie: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Movie",
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

myListSchema.index(
  { user: 1, movie: 1 },
  { unique: true }
);

module.exports = mongoose.model(
  "MyList",
  myListSchema
);
