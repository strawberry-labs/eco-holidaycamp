import Link from "next/link";
import { useRouter } from "next/router";
import { useState, ChangeEvent } from "react";

export default function HomePage() {
  const router = useRouter();
  const [location, setLocation] = useState<string>("");

  const handleLocationChange = (event: ChangeEvent<HTMLSelectElement>) => {
    setLocation(event.target.value);
  };

  const handleRegister = () => {
    if (location) {
      router.push(`/${location}`);
    }
  };

  return (
    <div className="bg-gray-100 h-screen text-black">
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
      <div className="flex flex-col items-center mt-16 md:mt-0 md:justify-center h-full pt-16">
        <div className="bg-white p-8 shadow-lg rounded-md w-3/4 max-w-xl text-center">
          <img
            src="https://cdn.strawberrylabs.net/strawberrylabs/holiday_program.webp"
            alt="Holiday Programs"
            className="w-full max-w-md mx-auto mb-4"
          />
          <p className="mb-4">
            {`We are proud to continue to provide our extremely popular holiday
            programs with Kings' Schools and Engineers to be. These programs run
            every school holiday and we offer discounts for early registration.`}
          </p>
          <img
            src="https://cdn.strawberrylabs.net/strawberrylabs/eco-banner-2.webp"
            alt="Climbing Activity"
            className="w-full max-w-md mx-auto mb-4 rounded drop-shadow"
          />
          <div className="mb-4">
            <select
              value={location}
              onChange={handleLocationChange}
              className="p-2 rounded-md border border-gray-300"
            >
              <option value="">Select a location</option>
              <option value="dubai">Kings' School Dubai</option>
              <option value="barsha">Kings' School Al Barsha</option>
              {/* <option value="nadalsheba">Kings School Nad Al Sheba</option> */}
            </select>
          </div>
          <button
            onClick={handleRegister}
            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
          >
            Register Here
          </button>
        </div>
      </div>
    </div>
  );
}
