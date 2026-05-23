from flask import Flask, request, jsonify
from flask_cors import CORS

from model_handler import make_prediction, preload_models

app = Flask(__name__)
CORS(app)

print("Đang preload 2 model...")
preload_models()
print("Đã preload xong basic và advanced.")


@app.route("/health", methods=["GET"])
def health_check():
    return jsonify({
        "status": "success",
        "message": "Python model API is running"
    })


@app.route("/predict", methods=["POST"])
def predict():
    try:
        data = request.get_json(silent=True) or {}
        result = make_prediction(data)

        return jsonify({
            "status": "success",
            "result": result
        }), 200

    except Exception as error:
        return jsonify({
            "status": "error",
            "message": str(error)
        }), 500


if __name__ == "__main__":
    app.run(
        host="127.0.0.1",
        port=8000,
        debug=False,
        use_reloader=False
    )