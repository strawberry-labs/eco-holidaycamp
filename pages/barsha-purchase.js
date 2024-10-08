import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import FullScreenLoader from "../components/FullScreenLoader";
import Link from "next/link";
import Head from "next/head";

export default function Register() {
  const [loading, setLoading] = useState(false);
  const [invalidFields, setInvalidFields] = useState({});
  const [promoCode, setPromoCode] = useState("");
  const [promoCodeError, setPromoCodeError] = useState("");
  const [totalPrice, setTotalPrice] = useState(0);
  const [discount, setDiscount] = useState(0);
  const [discountType, setDiscountType] = useState("");
  const [promoApplied, setPromoApplied] = useState(false);

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
    "14th Oct - 18th Oct",
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

  useEffect(() => {
    setTotalPrice(
      forms.reduce((total, form) => total + form.priceDetails.price, 0)
    );
  }, [forms]);

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

    updatedForms[index].priceDetails = calculatePrice(updatedForms[index]);
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

    if (name.startsWith("week")) {
      currentForm.selectedWeeks[0] = checked; // Only Week 1
      if (checked) {
        currentForm.daysOfWeek[0] = [
          "Monday",
          "Tuesday",
          "Wednesday",
          "Thursday",
          "Friday",
        ];
      } else {
        currentForm.daysOfWeek[0] = [];
      }
    } else if (name.startsWith("day")) {
      const dayArray = currentForm.daysOfWeek[0]; // Only Week 1 days
      const dayIndex = dayArray.indexOf(value);
      if (dayIndex > -1) {
        dayArray.splice(dayIndex, 1); // Remove day if already selected
      } else {
        dayArray.push(value); // Add day if not selected
      }
    }

    updatedForms[index].priceDetails = calculatePrice(updatedForms[index]);
    setForms(updatedForms);
  };

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
            weekCost = parseInt(quantity || 1) > 1 ? 850 : 945; // Full week price
            weekDetails.push({ description: "Full week", cost: weekCost });
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

        // Apply discount if any
        const finalAmount =
          discountType === "percentage"
            ? orderAmount - (orderAmount * discount) / 100
            : orderAmount - discount;

        const response = await fetch("/api/submitOrder", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            orderAmount: finalAmount,
            orderDetails,
            forms,
            promoCode,
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

  const handleApplyPromoCode = async () => {
    if (!promoCode) {
      setPromoCodeError("Please enter a promo code.");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("/api/checkPromoCode", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ code: promoCode }),
      });

      if (response.ok) {
        const data = await response.json();
        setDiscount(data.discount);
        setDiscountType(data.discountType);
        setPromoApplied(true);
        setPromoCodeError("");
      } else {
        const { message } = await response.json();
        setPromoCodeError(message);
        setPromoApplied(false);
      }
    } catch (error) {
      console.log(error);
      setPromoCodeError("Server error. Please try again later.");
      setPromoApplied(false);
    } finally {
      setLoading(false);
    }
  };

  const handleRemovePromoCode = () => {
    setPromoCode("");
    setDiscount(0);
    setDiscountType("");
    setPromoApplied(false);
    setPromoCodeError("");
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
                    <div key={0} className="mt-2">
                      <input
                        type="checkbox"
                        name={`week1`}
                        checked={form.weeks.selectedWeeks[0]}
                        onChange={(e) => handleWeeksChange(index, 0, e)}
                        className={`mx-1 rounded ${getBorderClass(
                          `form${index}_weeks`
                        )}`}
                      />
                      <label className="inline-block font-bold">
                        {`Week 1 (${datesText[0]})`}
                      </label>

                      <div
                        className={`pl-4 grid grid-cols-5 gap-2 ${
                          form.weeks.selectedWeeks[0] ? "" : "hidden"
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
                              name={`day1${day}`}
                              value={day}
                              className="rounded"
                              checked={form.weeks.daysOfWeek[0].includes(day)}
                              onChange={(e) =>
                                handleWeeksChange(index, 0, {
                                  ...e,
                                  name: "day",
                                })
                              }
                            />{" "}
                            {day}
                          </label>
                        ))}
                      </div>
                    </div>
                  </div>
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
              <br></br>
              <br></br>
              <br></br>
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

            {/* Fixed Promo Code and Pay Button at the Bottom */}
            <div className="mt-auto">
              <div className="mt-2 mb-2">
                <div className="flex items-center">
                  <input
                    type="text"
                    value={promoCode}
                    onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
                    placeholder="Enter promo code"
                    className="mt-1 p-2 w-full border rounded"
                    disabled={promoApplied}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        handleApplyPromoCode();
                      }
                    }}
                  />
                  <button
                    type="button"
                    onClick={
                      promoApplied
                        ? handleRemovePromoCode
                        : handleApplyPromoCode
                    }
                    className={`ml-2 font-bold py-2 px-4 rounded ${
                      promoApplied
                        ? "bg-red-500 hover:bg-red-700 text-white"
                        : "bg-blue-500 hover:bg-blue-700 text-white"
                    }`}
                  >
                    {promoApplied ? "Remove" : "Apply"}
                  </button>
                </div>
                {
                  <p
                    className={`mt-1 ${
                      promoApplied ? "text-black" : "text-red-500"
                    }`}
                  >
                    {promoApplied
                      ? discountType === "percentage"
                        ? `AED ${
                            (totalPrice * discount) / 100
                          } OFF! (${discount}% discount)`
                        : `AED ${discount} OFF!`
                      : promoCodeError}
                  </p>
                }
              </div>
              <p className="text-lg font-bold mt-2 mb-2">
                Total Price: AED{" "}
                {discountType === "percentage"
                  ? totalPrice - (totalPrice * discount) / 100
                  : totalPrice - discount}
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
              {discountType === "percentage"
                ? totalPrice - (totalPrice * discount) / 100
                : totalPrice - discount}
            </p>
            <button
              onClick={() => setIsPriceExpanded(!isPriceExpanded)}
              className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
            >
              {isPriceExpanded ? "Hide Details" : "Summary"}
            </button>
          </div>
          {isPriceExpanded && (
            <div
              className="fixed inset-0 bg-white p-4 overflow-y-auto z-20"
              style={{ top: "4rem", bottom: "4rem" }}
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

          <div className="mt-2 mb-2">
            <div className="flex items-center">
              <input
                type="text"
                value={promoCode}
                onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
                placeholder="Enter promo code"
                className="mt-1 p-2 w-full border rounded"
                disabled={promoApplied}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    handleApplyPromoCode();
                  }
                }}
              />
              <button
                type="button"
                onClick={
                  promoApplied ? handleRemovePromoCode : handleApplyPromoCode
                }
                className={`ml-4 font-bold py-2 px-[1.9em] rounded ${
                  promoApplied
                    ? "bg-red-500 hover:bg-red-700 text-white"
                    : "bg-blue-500 hover:bg-blue-700 text-white"
                }`}
              >
                {promoApplied ? "Remove" : "Apply"}
              </button>
            </div>
            {
              <p
                className={`mt-1 ${
                  promoApplied ? "text-black" : "text-red-500"
                }`}
              >
                {promoApplied
                  ? discountType === "percentage"
                    ? `AED ${
                        (totalPrice * discount) / 100
                      } OFF! (${discount}% discount)`
                    : `AED ${discount} OFF!`
                  : promoCodeError}
              </p>
            }
          </div>

          <button
            onClick={handleSubmit}
            className="bg-yellow-500 hover:bg-yellow-700 text-black font-bold py-2 px-4 rounded w-full mt-2"
          >
            Proceed to Payment
          </button>
        </div>
      </div>
    </>
  );
}
