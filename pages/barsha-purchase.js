import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import FullScreenLoader from "../components/FullScreenLoader";
import Link from "next/link";
import Head from "next/head";

export default function Register() {
  const [loading, setLoading] = useState(false);
  const [invalidFields, setInvalidFields] = useState({});
  const router = useRouter();
  const { quantity, type } = router.query;
  const [forms, setForms] = useState([]);
  const [orderDetails, setOrderDetails] = useState({
    location: "Kings' School Al Barsha",
    email: "",
    emergencyContact1Name: "",
    emergencyContact1Phone: "",
    emergencyContact2Name: "",
    emergencyContact2Phone: "",
    termsAndConditions: false,
    orderConfirmation: false,
    bookingConfirmation: false,
  });

  const datesText = [
    "8th Jul - 12th Jul",
    "15th Jul - 19th Jul",
    "22nd Jul - 26th Jul",
    "29th Jul - 2nd Aug",
    "5th Aug - 9th Aug",
    "12th Aug - 16th Aug",
  ];

  const [isPriceExpanded, setIsPriceExpanded] = useState(false);

  useEffect(() => {
    const img = new Image();
    img.src = "/eco-loader.png"; // Path to your loader image
  }, []);

  useEffect(() => {
    setForms(
      Array.from({ length: parseInt(quantity || "1") }, () => ({
        firstName: "",
        lastName: "",
        dateOfBirth: "",
        ageGroup: "",
        toiletTrained: true,
        attendedOneTerm: true,
        gender: "",
        program: type || "",
        medicalConditions: "",
        swimmingAbility: "",
        schoolName: "",
        friendsOrSiblingsNames: "",
        activitySelection: "",
        weeks: {
          allWeeks: false,
          selectedWeeks: Array(6).fill(false),
          daysOfWeek: Array(6).fill([]),
        },
        priceDetails: { price: 0, details: [] },
      }))
    );
  }, [quantity, type]);

  const emailRegex =
    /[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*@(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?/g;

  const phoneRegex = /\+?\d+/;
  const fullNameRegex = /^[\p{L}\s'-]+$/u;

  const handleChange = (index, event) => {
    const { name, value, type, checked } = event.target;
    const updatedForms = [...forms];

    // Update the value
    updatedForms[index][name] = type === "checkbox" ? checked : value;

    // Additional logic for ageGroup change
    if (name === "ageGroup" && value !== "3" && value !== "4") {
      updatedForms[index].toiletTrained = true;
      updatedForms[index].attendedOneTerm = true;
    } else if (name === "ageGroup" && (value == "3" || value == "4")) {
      updatedForms[index].toiletTrained = false;
      updatedForms[index].attendedOneTerm = false;
    }
    console.log(updatedForms);

    setForms(updatedForms);
  };

  const handleOrderDetailsChange = (event) => {
    const { name, value, type, checked } = event.target;
    setOrderDetails((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleWeeksChange = (index, weekIndex, event) => {
    const updatedForms = [...forms];
    const currentForm = updatedForms[index].weeks;
    const { name, checked, value } = event.target;

    if (name === "allWeeks") {
      currentForm.allWeeks = checked;
      currentForm.selectedWeeks.fill(checked);
      currentForm.daysOfWeek.forEach((_, i) => {
        currentForm.daysOfWeek[i] = checked
          ? ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"]
          : [];
      });
    } else if (name.startsWith("week")) {
      currentForm.selectedWeeks[weekIndex] = checked;
      if (checked) {
        currentForm.daysOfWeek[weekIndex] = [
          "Monday",
          "Tuesday",
          "Wednesday",
          "Thursday",
          "Friday",
        ];
      } else {
        currentForm.daysOfWeek[weekIndex] = [];
      }
    } else if (name.startsWith("day")) {
      const dayArray = currentForm.daysOfWeek[weekIndex];
      const dayIndex = dayArray.indexOf(value);
      if (dayIndex > -1) {
        dayArray.splice(dayIndex, 1);
      } else {
        dayArray.push(value);
      }
    }
    updatedForms[index].priceDetails = calculatePrice(updatedForms[index]);
    setForms(updatedForms);
    console.log(forms);
  };

  const calculatePrice = (form) => {
    let price = 0;
    let details = [];

    if (form.weeks.allWeeks) {
      price = 4100;
      details.push({ description: "All weeks", cost: 4100 });
    } else {
      form.weeks.selectedWeeks.forEach((selected, weekIndex) => {
        if (selected) {
          let weekCost = 0;
          let weekDetails = [];
          if (form.weeks.daysOfWeek[weekIndex].length === 5) {
            weekCost = 750; // Full week price
            weekDetails.push({ description: "Full week", cost: 750 });
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

  const validateForm = () => {
    let invalids = {};
    const isValidEmail = emailRegex.test(orderDetails.email);

    if (!isValidEmail) invalids.email = true;

    const hasAllRequiredFields = forms.every((form, idx) => {
      let isValid = true;
      [
        "firstName",
        "lastName",
        "dateOfBirth",
        "ageGroup",
        "gender",
        "medicalConditions",
        "schoolName",
        "activitySelection",
      ].forEach((field) => {
        if (!form[field]) {
          invalids[`form${idx}_${field}`] = true;
          isValid = false;
        }
      });
      if (!form.weeks.selectedWeeks.some(Boolean)) {
        invalids[`form${idx}_weeks`] = true;
        isValid = false;
      }
      return isValid;
    });

    ["emergencyContact1Name", "emergencyContact2Name"].forEach((field) => {
      if (!orderDetails[field]) invalids[field] = true;
    });

    if (!orderDetails.termsAndConditions) invalids.termsAndConditions = true;
    if (!orderDetails.orderConfirmation) invalids.orderConfirmation = true;
    if (!orderDetails.bookingConfirmation) invalids.bookingConfirmation = true;

    setInvalidFields(invalids);
    return Object.keys(invalids).length === 0;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (validateForm()) {
      setLoading(true); // Show loader
      try {
        const orderAmount = forms.reduce(
          (total, form) => total + form.priceDetails.price,
          0
        );

        const response = await fetch("/api/submitOrder", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            orderAmount,
            orderDetails,
            forms,
          }),
        });

        if (response.ok) {
          const { redirect_url } = await response.json();
          window.location.href = redirect_url;
        } else {
          const { error } = await response.json();
          if (error) {
            alert("Error: " + error);
          } else {
            alert(`Error ${response.status}: ${response.statusText}`);
          }
        }
      } catch (error) {
        console.log(error);
      } finally {
        setLoading(false); // Hide loader
      }
    } else {
      alert(
        `Please check your entries and make sure all required fields are filled correctly.`
      );
    }
  };

  const getBorderClass = (field) =>
    invalidFields[field] ? "border-red-500" : "";

  return (
    <>
      <Head>
        <title>Barsha Ticket Form</title>
        <meta name="description" content="Learn more about us." />
      </Head>
      <div className="flex flex-col lg:flex-row min-h-screen bg-white text-black">
        {loading && <FullScreenLoader />}
        <div className="bg-white p-6 shadow-md fixed top-0 left-0 right-0 z-10">
          <div className="max-w-7xl mx-auto flex justify-center">
            <Link href="/">
              <img
                src="https://cdn.strawberrylabs.net/strawberrylabs/ecoventure-main-logo.webp"
                alt="Ecoventure Logo"
                className="h-6"
              />
            </Link>
          </div>
        </div>
        <div className="mt-16 flex-grow lg:w-3/4 p-8 overflow-auto">
          <h1 className="text-2xl md:text-3xl font-bold mb-6">
            Register/Purchase Tickets
          </h1>
          <form onSubmit={handleSubmit}>
            {forms.map((form, index) => (
              <div key={index} className="mb-6 p-4 border rounded">
                <h3 className="text-lg font-semibold mb-2">
                  Attendee {index + 1} Details:
                </h3>
                <div className="grid grid-cols-1 gap-4">
                  <label>
                    {`Participant's First Name `}
                    <span className="text-red-500">*</span>
                    <input
                      type="text"
                      name="firstName"
                      value={form.firstName}
                      onChange={(e) => handleChange(index, e)}
                      placeholder="Participant's First Name"
                      className={`mt-1 p-2 w-full border rounded ${getBorderClass(
                        `form${index}_firstName`
                      )}`}
                    />
                    <p className="text-xs mt-2">
                      Participant is the person who will attend the Summer Camp.
                    </p>
                  </label>
                  <label>
                    {`Participant's Family Name `}
                    <span className="text-red-500">*</span>
                    <input
                      type="text"
                      name="lastName"
                      value={form.lastName}
                      onChange={(e) => handleChange(index, e)}
                      placeholder="Participant's Family Name"
                      className={`mt-1 p-2 w-full border rounded ${getBorderClass(
                        `form${index}_lastName`
                      )}`}
                    />
                  </label>
                  <label>
                    Date of Birth <span className="text-red-500">*</span>
                    <input
                      type="date"
                      name="dateOfBirth"
                      value={form.dateOfBirth}
                      onChange={(e) => handleChange(index, e)}
                      className={`mt-1 p-2 w-full border rounded ${getBorderClass(
                        `form${index}_dateOfBirth`
                      )}`}
                    />
                  </label>
                  <label>
                    How old is your child?{" "}
                    <span className="text-red-500">*</span>
                    <select
                      name="ageGroup"
                      value={form.ageGroup}
                      onChange={(e) => handleChange(index, e)}
                      className={`mt-1 p-2 w-full border rounded ${getBorderClass(
                        `form${index}_ageGroup`
                      )}`}
                    >
                      <option value="">Select Age</option>
                      {Array.from({ length: 9 }, (_, i) => i + 3).map((n) => (
                        <option key={n} value={n}>
                          {n}
                        </option>
                      ))}
                      <option value="11+">11+</option>
                    </select>
                  </label>
                  <label>
                    Gender <span className="text-red-500">*</span>
                    <select
                      name="gender"
                      value={form.gender}
                      onChange={(e) => handleChange(index, e)}
                      className={`mt-1 p-2 w-full border rounded ${getBorderClass(
                        `form${index}_gender`
                      )}`}
                    >
                      <option value="">Select Gender</option>
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                    </select>
                  </label>
                  <label>
                    Select your Program <span className="text-red-500">*</span>
                    <select
                      name="activitySelection"
                      value={form.activitySelection}
                      onChange={(e) => handleChange(index, e)}
                      className={`mt-1 p-2 w-full border rounded ${getBorderClass(
                        `form${index}_activitySelection`
                      )}`}
                    >
                      <option value="">Select Program</option>
                      <option value="Multi Activity">Multi Activity</option>
                      <option value="ETB + Multi Activity">
                        ETB + Multi Activity
                      </option>
                    </select>
                    <p className="text-xs mt-2">
                      {`ETB + Multi Activities includes a main project session, a coding or STEM challenge session, and two multi-activity sessions each day.`}
                    </p>
                  </label>
                  {(form.ageGroup === "3" || form.ageGroup === "4") && (
                    <>
                      <label>
                        Toilet Trained <span className="text-red-500">*</span>
                        <input
                          type="checkbox"
                          name="toiletTrained"
                          checked={form.toiletTrained}
                          onChange={(e) => handleChange(index, e)}
                          className={`mx-1 rounded ${getBorderClass(
                            `form${index}_toiletTrained`
                          )}`}
                        />
                      </label>
                      <label>
                        Attended One Term{" "}
                        <span className="text-red-500">*</span>
                        <input
                          type="checkbox"
                          name="attendedOneTerm"
                          checked={form.attendedOneTerm}
                          onChange={(e) => handleChange(index, e)}
                          className={`mx-1 rounded ${getBorderClass(
                            `form${index}_attendedOneTerm`
                          )}`}
                        />
                      </label>
                    </>
                  )}
                  <label>
                    Does the participant have any pre-existing medical
                    conditions? <span className="text-red-500">*</span>
                    <textarea
                      name="medicalConditions"
                      value={form.medicalConditions}
                      onChange={(e) => handleChange(index, e)}
                      placeholder="Medical Conditions"
                      className={`mt-1 p-2 w-full border rounded ${getBorderClass(
                        `form${index}_medicalConditions`
                      )}`}
                    />
                    <p className="text-xs mt-2">
                      {`Please tell us about any medical information that might impact your adventure. (E.g. physical injuries, allergies, illnesses, SEN requirements, etc.)`}
                    </p>
                  </label>
                  <label>
                    What school does your child attend?{" "}
                    <span className="text-red-500">*</span>
                    <input
                      type="text"
                      name="schoolName"
                      value={form.schoolName}
                      onChange={(e) => handleChange(index, e)}
                      placeholder="School Name"
                      className={`mt-1 p-2 w-full border rounded ${getBorderClass(
                        `form${index}_schoolName`
                      )}`}
                    />
                    <p className="text-xs mt-2">
                      {`Please note that this does not have to be a Kings' School. All children are welcome.`}
                    </p>
                  </label>
                  <label>
                    Please provide the names of friends or siblings who you
                    would like to be grouped together.{" "}
                    <input
                      type="text"
                      name="friendsOrSiblingsNames"
                      value={form.friendsOrSiblingsNames}
                      onChange={(e) => handleChange(index, e)}
                      placeholder="Friends or Siblings Names"
                      className="mt-1 p-2 w-full border rounded"
                    />
                    <p className="text-xs mt-2">
                      {`IMPORTANT - We will do our best to group friends / siblings together. However, in the interest of safety we aim to not have more than a two year age difference within a group.`}
                    </p>
                  </label>
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
                        className={`mx-1 rounded ${getBorderClass(
                          `form${index}_weeks`
                        )}`}
                      />{" "}
                      Attend All Weeks
                    </label>
                    <p
                      className={`text-xs ${
                        form.weeks.allWeeks ? "" : "hidden"
                      }`}
                    >{`No refunds or credit notes are provided for any missed days when booking for the whole summer as this price is always significantly discounted`}</p>
                  </div>
                  {Array.from({ length: 6 }, (_, i) => (
                    <div
                      key={i}
                      className={`mt-2 ${form.weeks.allWeeks ? "hidden" : ""}`}
                    >
                      <label className="block font-bold mb-1">
                        <input
                          type="checkbox"
                          name={`week${i}`}
                          checked={form.weeks.selectedWeeks[i]}
                          onChange={(e) => handleWeeksChange(index, i, e)}
                          className={`mx-1 rounded ${getBorderClass(
                            `form${index}_weeks`
                          )}`}
                        />{" "}
                        {`Week ${i + 1} (${datesText[i]})`}
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
                          <label
                            key={day}
                            className="inline-block text-[0.65rem] md:text-base md:font-bold"
                          >
                            <input
                              type="checkbox"
                              name={`day${i}${day}`}
                              value={day}
                              className="rounded"
                              checked={form.weeks.daysOfWeek[i].includes(day)}
                              onChange={(e) =>
                                handleWeeksChange(index, i, {
                                  ...e,
                                  name: "day",
                                })
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

            <div className="mt-4 mb-32 p-4 border rounded">
              <h2 className="text-lg font-semibold mb-2">Order Details</h2>
              <label>
                Email <span className="text-red-500">*</span>
                <input
                  type="email"
                  name="email"
                  value={orderDetails.email}
                  onChange={handleOrderDetailsChange}
                  placeholder="Enter your email"
                  className={`mt-1 mb-3 p-2 w-full border rounded ${getBorderClass(
                    "email"
                  )}`}
                />
              </label>
              <label>
                Emergency Contact 1 - <i>Full Name</i>{" "}
                <span className="text-red-500">*</span>
                <input
                  type="text"
                  name="emergencyContact1Name"
                  value={orderDetails.emergencyContact1Name}
                  onChange={handleOrderDetailsChange}
                  placeholder="Enter Name of first Parent / Guardian"
                  className={`mb-3 p-2 w-full border rounded ${getBorderClass(
                    "emergencyContact1Name"
                  )}`}
                />
              </label>
              <label>
                Emergency Contact 1 - Phone Number{" "}
                <span className="text-red-500">*</span>
                <input
                  type="text"
                  name="emergencyContact1Phone"
                  value={orderDetails.emergencyContact1Phone}
                  onChange={handleOrderDetailsChange}
                  placeholder="Enter Contact of first Parent / Guardian (with country code)"
                  className={`mb-3 p-2 w-full border rounded ${getBorderClass(
                    "emergencyContact1Phone"
                  )}`}
                />
              </label>
              <label>
                Emergency Contact 2 - Full Name{" "}
                <span className="text-red-500">*</span>
                <input
                  type="text"
                  name="emergencyContact2Name"
                  value={orderDetails.emergencyContact2Name}
                  onChange={handleOrderDetailsChange}
                  placeholder="Enter Name of second Parent / Guardian"
                  className={`mb-3 p-2 w-full border rounded ${getBorderClass(
                    "emergencyContact2Name"
                  )}`}
                />
              </label>
              <label>
                Emergency Contact 2 - Phone Number{" "}
                <span className="text-red-500">*</span>
                <input
                  type="text"
                  name="emergencyContact2Phone"
                  value={orderDetails.emergencyContact2Phone}
                  onChange={handleOrderDetailsChange}
                  placeholder="Enter Contact of second Parent / Guardian (with country code)"
                  className={`mb-1 p-2 w-full border rounded ${getBorderClass(
                    "emergencyContact2Phone"
                  )}`}
                />
              </label>
              <label
                className={`block font-medium my-4 ${getBorderClass(
                  "termsAndConditions"
                )}`}
              >
                <input
                  type="checkbox"
                  name="termsAndConditions"
                  checked={orderDetails.termsAndConditions}
                  onChange={handleOrderDetailsChange}
                  className={`mx-1 rounded ${getBorderClass(
                    "termsAndConditions"
                  )}`}
                />{" "}
                I have read, understood and agree to the{" "}
                <a
                  href="https://ecov.co/holidaycamp/tandc"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline"
                >
                  terms and conditions
                </a>{" "}
                <span className="text-red-500">*</span>
              </label>
              <label
                className={`block font-medium ${getBorderClass(
                  "orderConfirmation"
                )}`}
              >
                <input
                  type="checkbox"
                  name="orderConfirmation"
                  checked={orderDetails.orderConfirmation}
                  onChange={handleOrderDetailsChange}
                  className={`mx-1 rounded ${getBorderClass(
                    "orderConfirmation"
                  )}`}
                />
                {` I understand that payment must be made within 3 hours of submitting the registration, otherwise the booking will be automatically cancelled by the system. `}
                <span className="text-red-500">*</span>
              </label>
              <br></br>
              <label
                className={`block font-medium ${getBorderClass(
                  "bookingConfirmation"
                )}`}
              >
                <input
                  type="checkbox"
                  name="bookingConfirmation"
                  checked={orderDetails.bookingConfirmation}
                  onChange={handleOrderDetailsChange}
                  className={`mx-1 rounded ${getBorderClass(
                    "bookingConfirmation"
                  )}`}
                />
                {` You should receive a booking confirmation email automatically after completing registration and payment. If you haven't received this within 24hrs, please let us know. `}
                <span className="text-red-500">*</span>
              </label>
            </div>
          </form>
        </div>
        <div className="hidden lg:flex lg:w-1/4 sticky top-0 h-screen flex-col py-4 px-8 bg-gray-100">
          <div className="flex flex-col h-full">
            {/* Scrollable Container for Price Breakdown */}
            <div className="overflow-y-auto flex-grow mt-20">
              <h3 className="text-lg font-bold mb-2">Price Breakdown</h3>
              <h3 className="font-bold my-2">{`Location: Kings' School Al Barsha`}</h3>
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
            </div>

            {/* Fixed Button at the Bottom */}
            <div className="mt-auto">
              <p className="text-lg font-bold mt-6 mb-2">
                Total Price: AED{" "}
                {forms.reduce(
                  (total, form) => total + form.priceDetails.price,
                  0
                )}
              </p>
              <button
                onClick={handleSubmit}
                className="bg-yellow-500 hover:bg-yellow-700 text-black font-bold py-2 px-4 rounded w-full"
              >
                Proceed to Payment
              </button>
            </div>
          </div>
        </div>

        <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-gray-100 p-4 border-t-2">
          <div className="flex justify-between items-center">
            <p className="text-lg font-bold">
              Total: AED{" "}
              {forms.reduce(
                (total, form) => total + form.priceDetails.price,
                0
              )}
            </p>
            <button
              onClick={() => setIsPriceExpanded(!isPriceExpanded)}
              className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
            >
              {isPriceExpanded ? "Hide Details" : "View Details"}
            </button>
          </div>
          {isPriceExpanded && (
            <div
              className="fixed inset-0 bg-white p-4 overflow-y-auto z-20"
              style={{ top: "4rem", bottom: "8rem" }}
            >
              <div className="flex justify-between items-center mb-2">
                <h3 className="text-lg font-bold mt-2">Price Breakdown</h3>
                <button
                  onClick={() => setIsPriceExpanded(false)}
                  className="text-red-500 font-bold text-lg"
                >
                  &times;
                </button>
              </div>
              <h3 className="font-bold my-2">{`Location: Kings' School Al Barsha`}</h3>
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
            </div>
          )}
          {/* Keep the Proceed to Payment button in the sticky bottom panel */}
          <button
            onClick={handleSubmit}
            className="bg-yellow-500 hover:bg-yellow-700 text-black font-bold py-2 px-4 rounded w-full mt-4"
          >
            Proceed to Payment
          </button>
        </div>
      </div>
    </>
  );
}
