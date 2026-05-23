function safeFloat(value, defaultValue = 0) {
    const number = Number(value);
    return Number.isFinite(number) ? number : defaultValue;
}

function calculateBmi(heightCm, weightKg) {
    const height = safeFloat(heightCm);
    const weight = safeFloat(weightKg);

    if (height <= 0 || weight <= 0) return 0;

    return Math.round((weight / ((height / 100) ** 2)) * 100) / 100;
}

async function makePrediction(data) {
    const modelApiUrl = process.env.MODEL_API_URL || "http://127.0.0.1:8000/predict";

    const response = await fetch(modelApiUrl, {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify(data)
    });

    const json = await response.json();

    if (!response.ok || json.status !== "success") {
        throw new Error(json.message || "Python model API error");
    }

    return json.result;
}

module.exports = {
    makePrediction,
    calculateBmi,
    safeFloat
};