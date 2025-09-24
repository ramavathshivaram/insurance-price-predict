const express = require("express");
const cors = require("cors");
const { trainInsuranceModelSync, predictInsurance } = require("./insurance");

const app = express();
const port = 3000;

app.use(
  cors({
    origin: "https://insurance-price-predict-frontend.onrender.com",
  })
);
app.use(express.json());

// Train the model once at server start
let model;
try {
  model = trainInsuranceModelSync("./assets/insurance.csv");
  console.log("Insurance model trained successfully!");
} catch (err) {
  console.error("Error training model:", err.message);
  process.exit(1);
}

// API endpoint
app.post("/predict", (req, res) => {
  let { age, bmi, children, smoker } = req.body;

  if ([age, bmi, children, smoker].some((v) => v === undefined)) {
    return res.status(400).json({ error: "Missing input fields" });
  }
  smoker = smoker ? 1 : 0;
  try {
    const predictedPrice = predictInsurance(model, age, bmi, children, smoker);

    res.json({ predictedPrice });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Start server
app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}/`);
});
