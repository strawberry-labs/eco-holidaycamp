import NextCors from "nextjs-cors";

const cors = async (req, res) => {
  await NextCors(req, res, {
    origin: "*", // Allow all origins
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
    optionsSuccessStatus: 200,
  });
};

export default cors;
