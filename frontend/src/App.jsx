import React, { useState } from "react";
import { useForm } from "react-hook-form";

const App = () => {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm();
  const [result, setResult] = useState(null);
  const [currency, setCurrency] = useState("USD"); // toggle state

  const USD_TO_INR = 83; // fixed conversion rate

  const onSubmit = async (data) => {
    // Convert smoker to boolean
    data.smoker = data.smoker === "true" || data.smoker === true;

    // Convert numeric fields
    data.age = Number(data.age);
    data.weight = Number(data.weight);
    data.height = Number(data.height);
    data.children = Number(data.children);

    // Calculate BMI (height in meters)
    if (data.height > 0) {
      data.bmi = data.weight / (data.height * data.height);
    } else {
      data.bmi = 0;
    }

    try {
      const res = await fetch("https://insurance-price-predict-backend.onrender.com/predict", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const json = await res.json();
       let predicted = Number(json.predictedPrice);

       // ✅ Ensure no negative values
       if (predicted < 0) predicted = 0;
      setResult(Number(predicted)); // keep raw yearly price in USD
    } catch (err) {
      setResult("Error: " + err.message);
    }
  };

  // Function to format the result
  const formatResult = () => {
    if (result === null || typeof result !== "number") return result;

    let yearly = result;
    let monthly = yearly / 12;

    if (currency === "INR") {
      yearly = yearly * USD_TO_INR;
      monthly = monthly * USD_TO_INR;
      return (
        <>
          <strong>Yearly Cost:</strong> ₹{yearly.toFixed(2)} <br />
          <strong>Monthly Cost:</strong> ₹{monthly.toFixed(2)}
        </>
      );
    }

    return (
      <>
        <strong>Yearly Cost:</strong> ${yearly.toFixed(2)} <br />
        <strong>Monthly Cost:</strong> ${monthly.toFixed(2)}
      </>
    );
  };

  return (
    <div className="insurance-container">
      <h2>Insurance Cost Prediction</h2>
      <form className="insurance-form" onSubmit={handleSubmit(onSubmit)}>
        <div className="form-group">
          <label htmlFor="age">Age:</label>
          <input
            id="age"
            type="number"
            {...register("age", { required: true, min: 0 })}
            className={errors.age ? "input-error" : ""}
          />
          {errors.age && <span className="error">Age is required</span>}
        </div>

        <div className="form-group">
          <label htmlFor="weight">Weight (kg):</label>
          <input
            id="weight"
            type="number"
            step="any"
            {...register("weight", { required: true, min: 0 })}
            className={errors.weight ? "input-error" : ""}
          />
          {errors.weight && <span className="error">Weight is required</span>}
        </div>

        <div className="form-group">
          <label htmlFor="height">Height (m):</label>
          <input
            id="height"
            type="number"
            step="any"
            {...register("height", { required: true, min: 0 })}
            className={errors.height ? "input-error" : ""}
          />
          {errors.height && <span className="error">Height is required</span>}
        </div>

        <div className="form-group">
          <label htmlFor="children">Children:</label>
          <input
            id="children"
            type="number"
            {...register("children", { required: true, min: 0 })}
            className={errors.children ? "input-error" : ""}
          />
          {errors.children && (
            <span className="error">Children is required</span>
          )}
        </div>
        <div className="form-group">
          <label>Smoker:</label>
          <div className="radio-group">
            <label>
              <input
                type="radio"
                value="true"
                {...register("smoker", { required: true })}
              />
              Yes
            </label>
            <label>
              <input
                type="radio"
                value="false"
                {...register("smoker", { required: true })}
              />
              No
            </label>
          </div>
        </div>

        <button className="submit-btn" type="submit">
          Predict
        </button>
      </form>

      {/* Currency toggle */}
      {result !== null && typeof result === "number" && (
        <div className="toggle-container">
          <label className="switch">
            <input
              type="checkbox"
              checked={currency === "INR"}
              onChange={() =>
                setCurrency((prev) => (prev === "USD" ? "INR" : "USD"))
              }
            />
            <span className="slider"></span>
          </label>
          <span className="currency-label">
            {currency === "USD" ? "USD ($)" : "INR (₹)"}
          </span>
        </div>
      )}

      {result !== null && <div className="result-box">{formatResult()}</div>}
    </div>
  );
};

export default App;
