import { useRouter } from "next/router";
import Lottie from "react-lottie";
import successAnimation from "../public/success.json"; // Adjust the path if your public directory is structured differently

export default function SuccessPage() {
  const router = useRouter();
  const { order_id } = router.query;

  const defaultOptions = {
    loop: true,
    autoplay: true,
    animationData: successAnimation,
    rendererSettings: {
      preserveAspectRatio: "xMidYMid slice",
    },
  };

  return (
    <div className="bg-gray-100 h-screen text-black">
      <div className="bg-white p-6 shadow-md fixed top-0 left-0 right-0 z-10 rounded">
        <div className="max-w-7xl mx-auto flex justify-center">
          <img
            src="https://cdn.strawberrylabs.net/strawberrylabs/ecoventure-main-logo.webp"
            alt="Ecoventure Logo"
            className="h-10"
          />
        </div>
      </div>
      <div className="flex flex-col items-center justify-center h-full pt-16">
        <div className="bg-white p-8 shadow-lg rounded-md w-3/4 max-w-xl text-center">
          <div className="mb-4">
            <Lottie options={defaultOptions} height={200} width={200} />
          </div>
          <h1 className="text-2xl font-bold mb-2">Payment Successful!</h1>
          <p>
            You have successfully paid for your order. A confirmation will be
            sent to your email as well.
          </p>
          <p className="font-bold mt-4">Order ID: {order_id}</p>
          <button
            onClick={() => router.push("/")}
            className="mt-8 bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-8 rounded"
          >
            Finish
          </button>
        </div>
      </div>
    </div>
  );
}
