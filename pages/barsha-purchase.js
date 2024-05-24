import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import FullScreenLoader from "../components/FullScreenLoader";

export default function Register() {
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { quantity, type } = router.query;
  const [forms, setForms] = useState([]);
  const [orderDetails, setOrderDetails] = useState({
    location: "Kings Al Barsha",
    email: "",
    emergencyContact1Name: "",
    emergencyContact1Phone: "",
    emergencyContact2Name: "",
    emergencyContact2Phone: "",
    termsAndConditions: false,
    orderConfirmation: false,
    bookingConfirmation: false,
  });

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
  const phoneRegex = /^\d{8}$/;

  const handleChange = (index, event) => {
    const { name, value, type, checked } = event.target;
    const updatedForms = [...forms];

    // Update the value
    updatedForms[index][name] = type === "checkbox" ? checked : value;

    // Additional logic for ageGroup change
    if (name === "ageGroup" && value !== "3" && value !== "4") {
      updatedForms[index].toiletTrained = true;
      updatedForms[index].attendedOneTerm = true;
    }

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

  const validateForm = () => {
    const isValidEmail = emailRegex.test(orderDetails.email);
    // const isValidPhone1 = phoneRegex.test(orderDetails.emergencyContact1Phone);
    // const isValidPhone2 = phoneRegex.test(orderDetails.emergencyContact2Phone);
    const hasAllRequiredFields = forms.every((form) => {
      return (
        form.firstName &&
        form.lastName &&
        form.dateOfBirth &&
        form.ageGroup &&
        form.gender &&
        form.medicalConditions &&
        form.schoolName &&
        form.activitySelection &&
        form.weeks.selectedWeeks.some(Boolean)
      );
    });

    console.log("isValidEmail:", isValidEmail);
    console.log(
      "Emergency Contact 1 Name:",
      orderDetails.emergencyContact1Name,
      "Length:",
      orderDetails.emergencyContact1Name.length
    );
    console.log(
      "Emergency Contact 1 Phone:",
      orderDetails.emergencyContact1Phone,
      "Length:",
      orderDetails.emergencyContact1Phone.length
    );
    console.log(
      "Emergency Contact 2 Name:",
      orderDetails.emergencyContact2Name,
      "Length:",
      orderDetails.emergencyContact2Name.length
    );
    console.log(
      "Emergency Contact 2 Phone:",
      orderDetails.emergencyContact2Phone,
      "Length:",
      orderDetails.emergencyContact2Phone.length
    );
    // console.log("isValidPhone1:", isValidPhone1);
    // console.log("isValidPhone2:", isValidPhone2);
    console.log("hasAllRequiredFields:", hasAllRequiredFields);
    console.log(
      "Terms And Conditions Accepted:",
      orderDetails.termsAndConditions
    );
    console.log("Order Confirmation Received:", orderDetails.orderConfirmation);
    console.log(
      "Booking Confirmation Received:",
      orderDetails.bookingConfirmation
    );

    return (
      isValidEmail &&
      orderDetails.emergencyContact1Name.length > 0 &&
      orderDetails.emergencyContact1Phone.length > 0 &&
      orderDetails.emergencyContact2Name.length > 0 &&
      orderDetails.emergencyContact2Phone.length > 0 &&
      // isValidPhone1 &&
      // isValidPhone2 &&
      hasAllRequiredFields &&
      orderDetails.termsAndConditions &&
      orderDetails.orderConfirmation &&
      orderDetails.bookingConfirmation
    );
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    console.log("Order Details:", orderDetails);
    console.log("Attendee Details:", forms);
    if (validateForm()) {
      setLoading(true); // Show loader
      try {
        const orderAmount = forms.reduce(
          (total, form) => total + form.priceDetails.price,
          0
        );
        console.log("Total Order Amount:", orderAmount);

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
        "Please check your entries and make sure all required fields are filled correctly."
      );
    }
  };

  return (
    <div className="flex flex-col lg:flex-row min-h-screen bg-white text-black">
      {loading && <FullScreenLoader />}
      <div className="bg-white p-6 shadow-md fixed top-0 left-0 right-0 z-10">
        <div className="max-w-7xl mx-auto flex justify-center">
          <a href="/">
            <img
              src="https://cdn.strawberrylabs.net/strawberrylabs/ecoventure-main-logo.webp"
              alt="Ecoventure Logo"
              className="h-6"
            />
          </a>
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
                  First Name <span className="text-red-500">*</span>
                  <input
                    type="text"
                    name="firstName"
                    value={form.firstName}
                    onChange={(e) => handleChange(index, e)}
                    placeholder="First Name"
                    className="mt-1 p-2 w-full border rounded"
                  />
                </label>
                <label>
                  Last Name <span className="text-red-500">*</span>
                  <input
                    type="text"
                    name="lastName"
                    value={form.lastName}
                    onChange={(e) => handleChange(index, e)}
                    placeholder="Last Name"
                    className="mt-1 p-2 w-full border rounded"
                  />
                </label>
                <label>
                  Date of Birth <span className="text-red-500">*</span>
                  <input
                    type="date"
                    name="dateOfBirth"
                    value={form.dateOfBirth}
                    onChange={(e) => handleChange(index, e)}
                    className="mt-1 p-2 w-full border rounded"
                  />
                </label>
                <label>
                  Age Group <span className="text-red-500">*</span>
                  <select
                    name="ageGroup"
                    value={form.ageGroup}
                    onChange={(e) => handleChange(index, e)}
                    className="mt-1 p-2 w-full border rounded"
                  >
                    <option value="">Select Age Group</option>
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
                    className="mt-1 p-2 w-full border rounded"
                  >
                    <option value="">Select Gender</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                  </select>
                </label>
                <label>
                  Program <span className="text-red-500">*</span>
                  <select
                    name="activitySelection"
                    value={form.activitySelection}
                    onChange={(e) => handleChange(index, e)}
                    className="mt-1 p-2 w-full border rounded"
                  >
                    <option value="">Select Program</option>
                    <option value="Multi Activity">Multi Activity</option>
                    <option value="ETB + Multi Activity">
                      ETB + Multi Activity
                    </option>
                  </select>
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
                        className="ml-2"
                      />
                    </label>
                    <label>
                      Attended One Term <span className="text-red-500">*</span>
                      <input
                        type="checkbox"
                        name="attendedOneTerm"
                        checked={form.attendedOneTerm}
                        onChange={(e) => handleChange(index, e)}
                        className="ml-2"
                      />
                    </label>
                  </>
                )}
                <label>
                  Does the participant have any pre-existing medical conditions?{" "}
                  <span className="text-red-500">*</span>
                  <textarea
                    name="medicalConditions"
                    value={form.medicalConditions}
                    onChange={(e) => handleChange(index, e)}
                    placeholder="Medical Conditions"
                    className="mt-1 p-2 w-full border rounded"
                  />
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
                    className="mt-1 p-2 w-full border rounded"
                  />
                </label>
                <label>
                  Please provide the names of friends or siblings who you would
                  like to be grouped together.{" "}
                  <span className="text-red-500">*</span>
                  <input
                    type="text"
                    name="friendsOrSiblingsNames"
                    value={form.friendsOrSiblingsNames}
                    onChange={(e) => handleChange(index, e)}
                    placeholder="Friends or Siblings Names"
                    className="mt-1 p-2 w-full border rounded"
                  />
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
                        name={`week${i}`}
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
                            name={`day${i}${day}`}
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
                className="mt-1 mb-3 p-2 w-full border rounded"
              />
            </label>
            <label>
              Emergency Contact 1 Name <span className="text-red-500">*</span>
              <input
                type="text"
                name="emergencyContact1Name"
                value={orderDetails.emergencyContact1Name}
                onChange={handleOrderDetailsChange}
                placeholder="Enter Name of first Parent / Guardian"
                className="mb-3 p-2 w-full border rounded"
              />
            </label>
            <label>
              Emergency Contact 1 Phone <span className="text-red-500">*</span>
              <input
                type="text"
                name="emergencyContact1Phone"
                value={orderDetails.emergencyContact1Phone}
                onChange={handleOrderDetailsChange}
                placeholder="Enter Contact of first Parent / Guardian (with country code)"
                className="mb-3 p-2 w-full border rounded"
              />
            </label>
            <label>
              Emergency Contact 2 Name <span className="text-red-500">*</span>
              <input
                type="text"
                name="emergencyContact2Name"
                value={orderDetails.emergencyContact2Name}
                onChange={handleOrderDetailsChange}
                placeholder="Enter Name of second Parent / Guardian"
                className="mb-3 p-2 w-full border rounded"
              />
            </label>
            <label>
              Emergency Contact 2 Phone <span className="text-red-500">*</span>
              <input
                type="text"
                name="emergencyContact2Phone"
                value={orderDetails.emergencyContact2Phone}
                onChange={handleOrderDetailsChange}
                placeholder="Enter Contact of second Parent / Guardian (with country code)"
                className="mb-1 p-2 w-full border rounded"
              />
            </label>
            <label className="block font-medium my-4">
              <input
                type="checkbox"
                name="termsAndConditions"
                checked={orderDetails.termsAndConditions}
                onChange={handleOrderDetailsChange}
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
            <label className="block font-medium">
              <input
                type="checkbox"
                name="orderConfirmation"
                checked={orderDetails.orderConfirmation}
                onChange={handleOrderDetailsChange}
              />
              {` I understand that payment must be made within 3 hours of submitting the registration, otherwise the booking will be automatically cancelled by the system. `}
              <span className="text-red-500">*</span>
            </label>
            <br></br>
            <label className="block font-medium">
              <input
                type="checkbox"
                name="bookingConfirmation"
                checked={orderDetails.bookingConfirmation}
                onChange={handleOrderDetailsChange}
              />
              {` You should receive a booking confirmation email automatically after completing registration and payment. If you haven't received this within 24hrs, please let us know. `}
              <span className="text-red-500">*</span>
            </label>
          </div>
        </form>
      </div>
      <div className="hidden lg:flex lg:w-1/4 sticky top-0 h-screen flex-col py-4 px-8 bg-gray-100 overflow-y-auto">
        <div className="mt-20">
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
            className="bg-yellow-500 hover:bg-yellow-700 text-black font-bold py-2 px-4 rounded w-full mt-4"
          >
            Proceed to Payment
          </button>
        </div>
      </div>
      <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-gray-100 p-4 border-t-2">
        <div className="flex justify-between items-center">
          <p className="text-lg font-bold">
            Total: AED{" "}
            {forms.reduce((total, form) => total + form.priceDetails.price, 0)}
          </p>
          <button
            onClick={() => setIsPriceExpanded(!isPriceExpanded)}
            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
          >
            {isPriceExpanded ? "Hide Details" : "View Details"}
          </button>
        </div>
        {isPriceExpanded && (
          <div className="mt-4">
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
        <button
          onClick={handleSubmit}
          className="bg-yellow-500 hover:bg-yellow-700 text-black font-bold py-2 px-4 rounded w-full mt-4"
        >
          Proceed to Payment
        </button>
      </div>
    </div>
  );
}
