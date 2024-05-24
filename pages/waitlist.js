import { useRouter } from "next/router";
import Lottie from "react-lottie";
import cancelAnimation from "../public/waiting.json"; // Adjust the path if your public directory is structured differently
import Link from "next/link";

export default function WaitlistPage() {
  const router = useRouter();

  const defaultOptions = {
    loop: true,
    autoplay: true,
    animationData: cancelAnimation,
    rendererSettings: {
      preserveAspectRatio: "xMidYMid slice",
    },
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
          <div className="mb-4">
            <Lottie options={defaultOptions} height={200} width={200} />
          </div>
          <h1 className="text-2xl font-bold mb-2">Order in Waitlist!</h1>
          <p>
            Your order has been put on Wait List. You will be contacted by our
            team for the payment.
          </p>
          <button
            onClick={() => router.push("/")}
            className="mt-8 bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
          >
            Go Back
          </button>
        </div>
      </div>
    </div>
  );
}
