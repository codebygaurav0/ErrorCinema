const mongoose = require("mongoose");

const videoSourceSchema = new mongoose.Schema(
  {
    quality: {
      type: String,
      enum: ["360p", "480p", "720p", "1080p", "4K"],
      required: true,
    },
    url: {
      type: String,
      required: true,
      trim: true,
    },
    format: {
      type: String,
      enum: ["mp4", "hls"],
      default: "mp4",
    },
  },
  { _id: false }
);

const subtitleSchema = new mongoose.Schema(
  {
    language: {
      type: String,
      required: true,
      trim: true,
    },
    url: {
      type: String,
      required: true,
      trim: true,
    },
    label: {
      type: String,
      trim: true,
    },
  },
  { _id: false }
);

const episodeSchema = new mongoose.Schema(
  {
    episodeNumber: {
      type: Number,
      required: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
      default: "",
    },
    duration: {
      type: String,
      trim: true,
      default: "",
    },
    thumbnail: {
      type: String,
      trim: true,
      default: "",
    },
    videoSources: {
      type: [videoSourceSchema],
      default: [],
    },
    subtitles: {
      type: [subtitleSchema],
      default: [],
    },
    published: {
      type: Boolean,
      default: false,
    },
  },
  { _id: true }
);

const seasonSchema = new mongoose.Schema(
  {
    seasonNumber: {
      type: Number,
      required: true,
    },
    title: {
      type: String,
      trim: true,
      default: "",
    },
    episodes: {
      type: [episodeSchema],
      default: [],
    },
  },
  { _id: true }
);

const movieSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ["movie", "series"],
      default: "movie",
      index: true,
    },

    title: {
      type: String,
      required: true,
      trim: true,
    },

    description: {
      type: String,
      required: true,
      trim: true,
    },

    year: {
      type: Number,
      required: true,
    },

    rating: {
      type: Number,
      min: 0,
      max: 10,
      default: 0,
    },

    duration: {
      type: String,
      trim: true,
    },

    genres: {
      type: [String],
      default: [],
    },

    language: {
      type: String,
      required: true,
      trim: true,
    },

    country: {
      type: String,
      trim: true,
    },

    certification: {
      type: String,
      trim: true,
    },

    poster: {
      type: String,
      required: true,
      trim: true,
    },

    backdrop: {
      type: String,
      trim: true,
    },

    trailer: {
      type: String,
      trim: true,
    },

    cast: {
      type: [String],
      default: [],
    },

    director: {
      type: String,
      trim: true,
    },

    videoSources: {
      type: [videoSourceSchema],
      default: [],
    },

    subtitles: {
      type: [subtitleSchema],
      default: [],
    },

    seasons: {
      type: [seasonSchema],
      default: [],
    },

    featured: {
      type: Boolean,
      default: false,
    },

    published: {
      type: Boolean,
      default: false,
    },

    views: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Movie", movieSchema);
