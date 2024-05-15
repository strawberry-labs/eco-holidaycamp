import { useEffect, useState } from "react";
import { useRouter } from "next/router";

export default function Register() {
  const router = useRouter();
  const { quantity, type } = router.query;
  const [forms, setForms] = useState([]);

  useEffect(() => {
    // Initialize forms with default values
    setForms(
      Array.from({ length: parseInt(quantity || 1) }, () => ({
        firstName: "",
        lastName: "",
        email: "",
        dateOfBirth: "",
        ageGroup: "",
        toiletTrained: false,
        attendedOneTerm: false,
        gender: "",
        program: type,
        medicalConditions: "",
        swimmingAbility: "",
        schoolName: "",
        friendsOrSiblingsNames: "",
        emergencyContact1Name: "",
        emergencyContact1Phone: "",
        emergencyContact2Name: "",
        emergencyContact2Phone: "",
        weeks: {
          allWeeks: false,
          selectedWeeks: Array(6).fill(false),
          daysOfWeek: Array(6).fill([]),
        },
        priceDetails: { price: 0, details: [] },
      }))
    );
  }, [quantity, type]);

  const calculatePrice = (form) => {
    let price = 0;
    let details = [];

    if (form.weeks.allWeeks) {
      price = 5100;
      details.push({ description: "All weeks", cost: 5100 });
    } else {
      form.weeks.selectedWeeks.forEach((selected, weekIndex) => {
        if (selected) {
          let weekCost = 0;
          let weekDetails = [];

          if (form.weeks.daysOfWeek[weekIndex].length === 5) {
            weekCost = 945; // Full week price
            weekDetails.push({ description: "Full week", cost: 945 });
          } else {
            form.weeks.daysOfWeek[weekIndex].forEach((day) => {
              weekCost += 200;
              weekDetails.push({ description: day, cost: 200 });
            });
          }
          price += weekCost;
          details.push({ week: `Week ${weekIndex + 1}`, details: weekDetails });
        }
      });
    }
    return { price, details };
  };

  const handleWeeksChange = (index, weekIndex, event) => {
    const updatedForms = [...forms];
    const currentForm = updatedForms[index].weeks;
    const { name, checked, value } = event.target;

    if (name === "allWeeks") {
      // Handle selecting all weeks
      currentForm.allWeeks = checked;
      currentForm.selectedWeeks.fill(checked);
      currentForm.daysOfWeek.forEach((_, i) => {
        currentForm.daysOfWeek[i] = checked
          ? ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"]
          : [];
      });
    } else if (name.startsWith("week")) {
      // Toggle individual week
      currentForm.selectedWeeks[weekIndex] = checked;
      if (checked) {
        // Automatically select all days when a week is selected
        currentForm.daysOfWeek[weekIndex] = [
          "Monday",
          "Tuesday",
          "Wednesday",
          "Thursday",
          "Friday",
        ];
      } else {
        // Clear all days if the week is deselected
        currentForm.daysOfWeek[weekIndex] = [];
      }
    } else if (name.startsWith("day")) {
      // Handle day selection for specific week
      const dayArray = currentForm.daysOfWeek[weekIndex];
      const dayIndex = dayArray.indexOf(value);
      if (dayIndex > -1) {
        dayArray.splice(dayIndex, 1);
      } else {
        dayArray.push(value);
      }
    }
    updatedForms[index].priceDetails = calculatePrice(updatedForms[index]); // Recalculate price on change
    setForms(updatedForms);
  };

  const handleChange = (index, event) => {
    const { name, value, type, checked } = event.target;
    const updatedForms = [...forms];
    const currentForm = updatedForms[index];
    currentForm[name] = type === "checkbox" ? checked : value;
    currentForm.priceDetails = calculatePrice(currentForm); // Update price on change
    setForms(updatedForms);
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    console.log("All form data submitted:", forms);
    // Implement the server submission or further processing here
  };

  return (
    <div className="flex min-h-screen bg-white text-black">
      <div className="flex-grow p-8 overflow-auto">
        <h1 className="text-3xl font-bold mb-6">Register/Purchase Tickets</h1>
        <form onSubmit={handleSubmit}>
          {forms.map((form, index) => (
            <div key={index} className="mb-8 p-4 border rounded shadow-sm">
              <h2 className="font-bold text-lg mb-4">
                Attendee {index + 1} Information
              </h2>
              <div className="grid grid-cols-1 gap-4">
                <input
                  type="text"
                  name="firstName"
                  value={form.firstName}
                  onChange={(e) => handleChange(index, e)}
                  placeholder="First Name"
                  className="border p-2 w-full"
                />
                <input
                  type="text"
                  name="lastName"
                  value={form.lastName}
                  onChange={(e) => handleChange(index, e)}
                  placeholder="Last Name"
                  className="border p-2 w-full"
                />
                <input
                  type="email"
                  name="email"
                  value={form.email}
                  onChange={(e) => handleChange(index, e)}
                  placeholder="Email"
                  className="border p-2 w-full"
                />
                <input
                  type="date"
                  name="dateOfBirth"
                  value={form.dateOfBirth}
                  onChange={(e) => handleChange(index, e)}
                  className="border p-2 w-full"
                />
                <select
                  name="ageGroup"
                  value={form.ageGroup}
                  onChange={(e) => handleChange(index, e)}
                  className="border p-2 w-full"
                >
                  {Array.from({ length: 12 }, (_, i) => i + 1).map((n) => (
                    <option key={n} value={n === 12 ? "11+" : n.toString()}>
                      {n === 12 ? "11+" : n.toString()}
                    </option>
                  ))}
                </select>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={form.toiletTrained}
                    onChange={(e) => handleChange(index, e)}
                    name="toiletTrained"
                  />{" "}
                  Toilet Trained
                </label>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={form.attendedOneTerm}
                    onChange={(e) => handleChange(index, e)}
                    name="attendedOneTerm"
                  />{" "}
                  Attended One Term
                </label>
                <select
                  name="gender"
                  value={form.gender}
                  onChange={(e) => handleChange(index, e)}
                  className="border p-2 w-full"
                >
                  <option value="">Select Gender</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                </select>
                <input
                  type="text"
                  name="medicalConditions"
                  value={form.medicalConditions}
                  onChange={(e) => handleChange(index, e)}
                  placeholder="Medical Conditions"
                  className="border p-2 w-full"
                />
                <select
                  name="swimmingAbility"
                  value={form.swimmingAbility}
                  onChange={(e) => handleChange(index, e)}
                  className="border p-2 w-full"
                >
                  <option value="">Select Swimming Ability</option>
                  <option value="Non-swimmer">Non-swimmer</option>
                  <option value="Learning to swim - can swim a short distance unaided">
                    Learning to swim
                  </option>
                  <option value="Competent swimmer">Competent swimmer</option>
                </select>
                <input
                  type="text"
                  name="schoolName"
                  value={form.schoolName}
                  onChange={(e) => handleChange(index, e)}
                  placeholder="School Name"
                  className="border p-2 w-full"
                />
                <input
                  type="text"
                  name="friendsOrSiblingsNames"
                  value={form.friendsOrSiblingsNames}
                  onChange={(e) => handleChange(index, e)}
                  placeholder="Friends or Siblings Names"
                  className="border p-2 w-full"
                />
                <input
                  type="text"
                  name="emergencyContact1Name"
                  value={form.emergencyContact1Name}
                  onChange={(e) => handleChange(index, e)}
                  placeholder="Emergency Contact 1 Name"
                  className="border p-2 w-full"
                />
                <input
                  type="text"
                  name="emergencyContact1Phone"
                  value={form.emergencyContact1Phone}
                  onChange={(e) => handleChange(index, e)}
                  placeholder="Emergency Contact 1 Phone"
                  className="border p-2 w-full"
                />
                <input
                  type="text"
                  name="emergencyContact2Name"
                  value={form.emergencyContact2Name}
                  onChange={(e) => handleChange(index, e)}
                  placeholder="Emergency Contact 2 Name"
                  className="border p-2 w-full"
                />
                <input
                  type="text"
                  name="emergencyContact2Phone"
                  value={form.emergencyContact2Phone}
                  onChange={(e) => handleChange(index, e)}
                  placeholder="Emergency Contact 2 Phone"
                  className="border p-2 w-full"
                />

                {/* Week and Day selection UI */}
                <div className="mt-4">
                  <label className="block font-bold mb-1">
                    <input
                      type="checkbox"
                      checked={form.weeks.allWeeks}
                      onChange={(e) =>
                        handleWeeksChange(index, null, {
                          target: {
                            name: "allWeeks",
                            checked: e.target.checked,
                          },
                        })
                      }
                      name="allWeeks"
                    />{" "}
                    Attend All Weeks
                  </label>
                </div>
                {Array.from({ length: 6 }, (_, i) => (
                  <div
                    key={i}
                    className={`mt-2 ${form.weeks.allWeeks ? "hidden" : ""}`}
                  >
                    <label className="block font-bold mb-1">
                      <input
                        type="checkbox"
                        name={`week${i}`} // Unique name for week
                        checked={form.weeks.selectedWeeks[i]}
                        onChange={(e) => handleWeeksChange(index, i, e)}
                      />{" "}
                      Week {i + 1}
                    </label>
                    <div
                      className={`pl-4 grid grid-cols-5 gap-2 ${
                        form.weeks.selectedWeeks[i] ? "" : "hidden"
                      }`}
                    >
                      {[
                        "Monday",
                        "Tuesday",
                        "Wednesday",
                        "Thursday",
                        "Friday",
                      ].map((day) => (
                        <label key={day} className="inline-block font-bold">
                          <input
                            type="checkbox"
                            name={`day${i}${day}`} // Unique name for each day
                            value={day}
                            checked={form.weeks.daysOfWeek[i].includes(day)}
                            onChange={(e) =>
                              handleWeeksChange(index, i, { ...e, name: "day" })
                            }
                            disabled={!form.weeks.selectedWeeks[i]}
                          />{" "}
                          {day}
                        </label>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
          <button
            type="submit"
            className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded w-full mt-4"
          >
            Submit All Registrations
          </button>
        </form>
      </div>
      <div className="w-1/4 sticky top-0 h-screen flex flex-col py-4 px-8 bg-gray-100 overflow-y-auto">
        <img
          src="https://cdn.strawberrylabs.net/strawberrylabs/ecoventure-main-logo.webp"
          alt="Company Logo"
          className="w-3/4 mt-4 mb-4"
        />{" "}
        {/* Logo at the top of the sidebar */}
        <div className="mt-4">
          <h3 className="text-lg font-bold mb-2">Price Breakdown</h3>
          {forms.map((form, index) => (
            <div key={index} className="mb-4">
              <h4 className="font-bold">Attendee {index + 1}:</h4>
              {form.priceDetails.details.map((item, idx) => (
                <div key={idx}>
                  {item.week ? <h5 className="pl-2">{item.week}</h5> : null}
                  {item.details &&
                    item.details.map((detail, detailIndex) => (
                      <p className="pl-4" key={detailIndex}>
                        {detail.description} - {detail.cost}
                      </p>
                    ))}
                </div>
              ))}
              <p className="font-bold">Total: {form.priceDetails.price}</p>
            </div>
          ))}
          <p className="text-lg font-bold mt-6">
            Total Price: AED{" "}
            {forms.reduce((total, form) => total + form.priceDetails.price, 0)}
          </p>

          <button
            onClick={handleSubmit}
            className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded w-full mt-4"
          >
            Proceed to Payment
          </button>
        </div>
      </div>
    </div>
  );
}
