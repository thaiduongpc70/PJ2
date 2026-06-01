const express = require("express");
const path = require("path");
const routes = require("./src/routes");

const app = express();
app.use(express.static(path.join(__dirname, 'src', 'public')));
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "src/views"));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/api", routes);

app.get("/", (req, res) => {
    res.render("index");
});

app.get("/auth", (req, res) => {
    res.render("auth");
});

app.get("/admin", (req, res) => {
    res.render("admin/admin");
});

app.get("/basic", (req, res) => {
    res.render("client/basic");
});

app.get("/advanced", (req, res) => {
    res.render("client/advanced");
});

app.get("/select-method", (req, res) => {
    res.render("client/select_method");
});

app.use((req, res) => {
    res.status(404).render("index");
});

app.use((err, req, res, next) => {
    console.error("Lỗi hệ thống:", err);

    res.status(500).json({
        message: "Đã có lỗi xảy ra trên server!"
    });
});

module.exports = app;