const fs = require("fs");
const { parse } = require("csv-parse/sync");
const { Matrix } = require("ml-matrix");
const MLR = require("ml-regression-multivariate-linear");
const { CLIENT_RENEG_WINDOW } = require("tls");

// Manual standardization functions
function standardize(X) {
  const means = [];
  const stds = [];

  for (let col = 0; col < X[0].length; col++) {
    const colValues = X.map((row) => row[col]);
    const mean = colValues.reduce((a, b) => a + b, 0) / colValues.length;
    const std = Math.sqrt(
      colValues.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) /
        colValues.length
    );
    means.push(mean);
    stds.push(std || 1);
  }

  const X_scaled = X.map((row) =>
    row.map((val, colIndex) => (val - means[colIndex]) / stds[colIndex])
  );

  return { X_scaled, means, stds };
}

function transformRow(row, means, stds) {
  return row.map((val, i) => (val - means[i]) / stds[i]);
}

// Train model
function trainInsuranceModelSync(filePath) {
  if (!fs.existsSync(filePath)) {
    throw new Error(`CSV file not found at path: ${filePath}`);
  }

  const fileContent = fs.readFileSync(filePath, "utf-8");
  const rows = parse(fileContent, { columns: true, skip_empty_lines: true });

  if (!rows || rows.length === 0) {
    throw new Error("CSV is empty or could not be parsed!");
  }

  const X = [];
  const y = [];

  rows.forEach((r, i) => {
    const age = parseFloat(r.age) || NaN;
    const bmi = parseFloat(r.bmi) || NaN;
    const children = parseInt(r.children) || NaN;
    const smoker = r.smoker === "yes" ? 1 : 0;

    X.push([age, bmi, children, smoker]);
    y.push([parseFloat(r.expenses)]);
  });
  // Replace missing values with mean
  for (let col = 0; col < X[0].length; col++) {
    const validVals = X.map((row) => row[col]).filter((v) => !isNaN(v));
    const mean = validVals.reduce((a, b) => a + b, 0) / validVals.length;
    X.forEach((row, i) => {
      if (isNaN(row[col])) X[i][col] = mean;
    });
  }
  const { X_scaled, means, stds } = standardize(X);

  if (!X_scaled || X_scaled.length === 0) {
    throw new Error("Feature matrix X_scaled is empty!");
  }
  const mlr = new MLR(new Matrix(X_scaled).to2DArray(), y);

  return { mlr, means, stds };
}

// Predict function
function predictInsurance(model, age, bmi, children, smoker) {
  if (!model || !model.mlr) {
    throw new Error("Model is not trained properly");
  }

  const row = transformRow(
    [age, bmi, children, smoker],
    model.means,
    model.stds
  );
  const prediction = model.mlr.predict(new Matrix([row]).to2DArray());
  return prediction[0];
}

module.exports = {
  trainInsuranceModelSync,
  predictInsurance,
};
