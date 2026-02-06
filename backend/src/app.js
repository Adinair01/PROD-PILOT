const express = require("express");
const cookieParser = require("cookie-parser");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");

const authRoutes = require("./routes/auth.routes");
const { errorMiddleware } = require("./middlewares/error.middleware");

const app = express();

app.use(helmet()); // security headers

app.use(express.json({ limit: "1mb" })); // parse JSON body
app.use(cookieParser()); // read cookies


app.use(    //it basically allows the frontend to talk to my backendd
  cors({      // cors - cross origin resourse sharing
    origin: process.env.CORS_ORIGIN?.split(",") || ["http://localhost:5173"],     //Allows your frontend (on port 5173) to talk to your backend (on port 4000)
    credentials: true,   // it basically allows cookies to be sent
  })
);

app.use(
  rateLimit({      //Prevents spam/abuse by limiting requests
    windowMs: 60 * 1000,
    max: 120,         // max limit i have given is 120 req/min
  })
);

app.get("/health", (req, res) => res.json({ ok: true }));   //Simple endpoint to check if server is running

app.use("/v1/auth", authRoutes);

app.use(errorMiddleware);

module.exports = { app };   //it makes the app available to use in your main server file


// so Request → Helmet → JSON Parser → Cookie Parser → CORS → Rate Limit → Routes → Error Handler → Response
//This setup ensures every request is secure, parsed, and properly handled!