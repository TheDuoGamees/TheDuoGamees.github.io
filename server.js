const express = require("express");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

/* =========================
   🔐 КРИПТО
========================= */

function secureRandom(max) {
    const crypto = require("crypto");
    return crypto.randomBytes(4).readUInt32BE(0) % max;
}

/* =========================
   🔤 СИМВОЛЫ
========================= */

function getCharset(options) {
    let letters = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";
    let digits = "0123456789";

    let charset = "";

    if (options.letters) charset += letters;
    if (options.digits) charset += digits;

    if (!charset) charset = letters + digits;

    if (options.exclude) {
        charset = charset.replace(/[0Ool1I]/g, "");
    }

    return charset;
}

/* =========================
   🔑 ГЕНЕРАЦИЯ
========================= */

function generateKey(length, charset) {
    let res = "";
    for (let i = 0; i < length; i++) {
        res += charset[secureRandom(charset.length)];
    }
    return res;
}

/* =========================
   🧠 PREFIX
========================= */

function buildPrefix(type, env, custom) {
    if (custom) return custom;

    let parts = [];
    if (type) parts.push(type);
    if (env) parts.push(env);

    return parts.length ? parts.join("_") + "_" : "";
}

/* =========================
   ⚡ RATE LIMIT (простая версия)
========================= */

const limits = {};

function checkLimit(ip) {
    const now = Date.now();

    if (!limits[ip]) {
        limits[ip] = { count: 1, time: now };
        return true;
    }

    let data = limits[ip];

    if (now - data.time > 60000) {
        limits[ip] = { count: 1, time: now };
        return true;
    }

    if (data.count > 20) return false;

    data.count++;
    return true;
}

/* =========================
   🌐 API ENDPOINT
========================= */

app.post("/generate", (req, res) => {

    const ip = req.ip;

    if (!checkLimit(ip)) {
        return res.status(429).json({ error: "Too many requests" });
    }

    const {
        count = 10,
        length = 24,
        type = "",
        env = "",
        prefix = "",
        letters = true,
        digits = true,
        exclude = false
    } = req.body;

    if (count > 50000) {
    console.log("⚠️ Large request:", count);
}

    const charset = getCharset({ letters, digits, exclude });
    const pref = buildPrefix(type, env, prefix);

    let keys = [];

    for (let i = 0; i < count; i++) {
        keys.push(pref + generateKey(length, charset));
    }

    res.json({
        success: true,
        count: keys.length,
        keys
    });
});

/* =========================
   🚀 START
========================= */

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log("Server running on port " + PORT);
});
