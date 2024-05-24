import { useRouter } from "next/router";
import { useState } from "react";

export default function Home() {
  const router = useRouter();
  const [selectedQuantity, setSelectedQuantity] = useState(1); // Default to 1 ticket

  const handleBuyClick = () => {
    router.push({
      pathname: "/barsha-purchase",
      query: { type: "Standard Ticket", quantity: selectedQuantity },
    });
  };

  return (
    <div className="flex flex-col md:flex-row h-screen bg-white text-black">
      <div className="hidden md:block md:w-2/5 sticky top-0 h-screen relative">
        <img
          src="https://cdn.strawberrylabs.net/strawberrylabs/eco-camp.jpeg"
          alt="Event Banner"
          className="w-full h-full object-cover"
        />
        <div className="absolute top-8 left-8">
          <img
            src="https://cdn.strawberrylabs.net/strawberrylabs/Ecoventure_logo_symb.jpeg" // Place your logo path here
            alt="Event Logo"
            className="w-42" // This sets the logo as a square
          />
          <div className="bg-black text-white p-2 w-42">
            <a
              href="https://www.ecoventureme.com/holiday-programs" // Put your event website URL here
              target="_blank"
              rel="noopener noreferrer"
              className="text-white"
            >
              Event Website
            </a>
          </div>
        </div>
      </div>
      <div className="w-full md:w-3/5 overflow-auto p-8 md:p-8">
        <div className="lg:hidden bg-white p-6 shadow-md fixed top-0 left-0 right-0 z-10">
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
        <section>
          <h1
            className="mt-20 md:mt-2 text-3xl md:text-4xl font-bold mt-2"
            style={{ color: "#F5B028" }}
          >
            SUMMER HOLIDAY CAMP AL BARSHA TEST
          </h1>
          <br />
          <p>11 Jun - 11 Jul, 2024</p>
          <p>📍 Kings Al Barsha</p>
          <button
            className="w-36 md:w-36 mt-2 bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
            style={{ backgroundColor: "#F5B028" }}
          >
            <a
              href="https://maps.app.goo.gl/Gux3TMPbAGpHoVKVA"
              target="_blank"
              rel="noopener noreferrer"
              className="w-full h-full flex justify-center items-center text-gray-700"
            >
              View on Map
            </a>
          </button>
        </section>

        <section className="mt-8">
          <h2 className="text-xl font-semibold">Ticket Types</h2>
          <div className="flex flex-col gap-4">
            <div className="flex mt-4 justify-between items-center">
              <p>
                <strong>Summer Camp Registration</strong>
              </p>
              <select
                value={selectedQuantity}
                onChange={(e) => setSelectedQuantity(e.target.value)}
                className="border border-black rounded p-2 w-20 md:w-36"
              >
                {Array.from({ length: 10 }, (_, i) => i + 1).map((number) => (
                  <option key={number} value={number}>
                    {number}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex justify-end">
              <button
                onClick={handleBuyClick}
                className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded w-full md:w-36"
                style={{ backgroundColor: "#F5B028", color: "black" }}
              >
                Buy Tickets
              </button>
            </div>
          </div>
        </section>

        <section
          className="mt-8"
          dangerouslySetInnerHTML={{ __html: yourDangerousHTMLContent() }}
        />
      </div>
    </div>
  );
}

function yourDangerousHTMLContent() {
  return `
    <p><span style="font-size:24px"><strong>READ ME BEFORE BOOKING</strong></span></p><br>
    <p><strong><u><a href="https://drive.google.com/file/d/1sDrQS53zSJ_-iGn4Z7W4mBtkZIHNbIWR/view?usp=sharing" rel="noreferrer noopener" target="_blank">Click here for Program information and FAQs</a></u></strong></p><br>
    <p>All students must be <strong>at least 3yrs old, toilet trained</strong> and have attended school for at least 1 term.</p><br>
    <p>Students will be assigned to activity groups based on age. In order to provide the most appropriate program for all students we are only able to group friends / siblings together if they are similar ages (within 2yrs).</p><br>
    <p>There will be <strong>no swimming on Monday</strong>. Please <strong>check the displayed timetable</strong> on Monday to know which day your child will be swimming.</p><br>
    <p>If you are registering on the <strong>WAITLIST</strong> for more than 1 child please complete 1 form per child.</p><br>
    <p>Sibling Discount is applied automatically to regular week pass rates.</p><br>
    <p>Dates - July 10th - August 18th</p><br>
    <p><strong>We do not provide transport to and from camp.</strong></p><br>
    <p>ETB = Engineers To Be - please see program information in the FAQs for more details.</p><br>
    <p><a href="https://ecov.co/refunds" rel="noreferrer noopener" target="_blank"><strong><u>Click here to request a full or partial refund</u></strong></a></p><br>
    <p><strong>Please use the 'contact the organiser' button at the bottom of the page if you require more information or would like us to call you back. We aim to reply or make call backs within 1 business day.</strong></p><br>
    <p><a href="https://drive.google.com/file/d/1UzOugB0CSYaAFIf-kTk6wEphEIygpTMu/view?usp=sharing" rel="noreferrer noopener" target="_blank"><u>Click here for terms and conditions including informed consent and refund policy - by purchasing a ticket you are agreeing to the informed consent and all terms and conditions</u></a></p>
  `;
}
