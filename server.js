require("dotenv").config();

const path = require("path");
const http = require("http");
const { spawn } = require("child_process");

const app = require("./app");
const { testConnection } = require("./src/config/db");

const PORT = process.env.PORT || 5000;
const MODEL_API_PORT = process.env.MODEL_API_PORT || 8000;
const MODEL_API_HEALTH_URL = `http://127.0.0.1:${MODEL_API_PORT}/health`;

let pythonProcess = null;

function startPythonModelApi() {
    return new Promise((resolve, reject) => {
        const pythonScript = path.join(__dirname, "src", "python", "model_api.py");

        console.log("Đang khởi động Python Model API...");

        pythonProcess = spawn("python", [pythonScript], {
            cwd: path.join(__dirname, "src", "python"),
            env: {
                ...process.env,
                PYTHONIOENCODING: "utf-8"
            },
            stdio: ["ignore", "pipe", "pipe"]
        });

        pythonProcess.stdout.on("data", data => {
            console.log(`[PYTHON] ${data.toString().trim()}`);
        });

        pythonProcess.stderr.on("data", data => {
            console.error(`[PYTHON ERROR] ${data.toString().trim()}`);
        });

        pythonProcess.on("error", error => {
            reject(new Error(`Không khởi động được Python: ${error.message}`));
        });

        pythonProcess.on("exit", code => {
            if (code !== 0 && code !== null) {
                console.error(`Python Model API đã dừng với code: ${code}`);
            }
        });

        resolve();
    });
}

function waitForModelApi(maxRetries = 60, delayMs = 500) {
    return new Promise((resolve, reject) => {
        let attempts = 0;

        const check = () => {
            attempts += 1;

            const req = http.get(MODEL_API_HEALTH_URL, res => {
                if (res.statusCode === 200) {
                    res.resume();
                    console.log("Python Model API đã sẵn sàng.");
                    resolve();
                    return;
                }

                res.resume();
                retry();
            });

            req.on("error", retry);

            req.setTimeout(1000, () => {
                req.destroy();
                retry();
            });
        };

        const retry = () => {
            if (attempts >= maxRetries) {
                reject(new Error("Python Model API khởi động quá lâu hoặc bị lỗi."));
                return;
            }

            setTimeout(check, delayMs);
        };

        check();
    });
}

function shutdownPythonProcess() {
    if (pythonProcess) {
        console.log("Đang tắt Python Model API...");
        pythonProcess.kill();
    }
}

process.on("SIGINT", () => {
    shutdownPythonProcess();
    process.exit(0);
});

process.on("SIGTERM", () => {
    shutdownPythonProcess();
    process.exit(0);
});

async function startServer() {
    try {
        await testConnection();

        await startPythonModelApi();
        await waitForModelApi();

        app.listen(PORT, () => {
            console.log(`Server running at http://localhost:${PORT}`);
        });
    } catch (error) {
        console.error("Không thể khởi động server:");
        console.error(error.message);

        shutdownPythonProcess();
        process.exit(1);
    }
}

startServer();