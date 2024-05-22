import mongoose from "mongoose";

const attendeeSchema = new mongoose.Schema({
  firstName: String,
  lastName: String,
  dateOfBirth: Date,
  ageGroup: String,
  toiletTrained: Boolean,
  attendedOneTerm: Boolean,
  gender: String,
  program: String,
  medicalConditions: String,
  swimmingAbility: String,
  schoolName: String,
  friendsOrSiblingsNames: String,
  activitySelection: String,
  createdTime: { type: Date, default: Date.now },
  lastModifiedTime: { type: Date, default: Date.now },
  // Week groups as empty text initially
  week1Group: { type: String, default: "" },
  week2Group: { type: String, default: "" },
  week3Group: { type: String, default: "" },
  week4Group: { type: String, default: "" },
  week5Group: { type: String, default: "" },
  week6Group: { type: String, default: "" },
  weeks: {
    allWeeks: Boolean,
    selectedWeeks: [Boolean],
    daysOfWeek: [[String]],
  },
  priceDetails: {
    price: Number,
    details: [
      {
        description: String,
        cost: Number,
      },
    ],
  },
});

export default mongoose.models.Attendee ||
  mongoose.model("Attendee", attendeeSchema);
