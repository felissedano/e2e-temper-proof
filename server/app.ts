import express from "express";
import cors from "cors";
import * as crypto from "crypto";
import e from "express";

const PORT = 8080;
const app = express();

//The database schema
type Schema = {
  value: string;
  saltedHash: string;
};

//Create databse with default value
const database: { data: Schema } = { data: {
  value: "Hello World",
  saltedHash: "NA",
}
};

// the log will record every single operation executaed in the database
type Log = {
  oldValue: Schema;
  newValue: Schema;
}

//append only logger
 class Logger {
  logs: Log[] = [];
  append(oldValue: Schema, newValue: Schema) {
    console.log("appending", oldValue, newValue);
    this.logs.push({ oldValue: oldValue, newValue: newValue });
  }

  retrieve() {
    return this.logs;
  }

}

const logger = new Logger();

// create the hash base on the updated value and user provided salt
const generateHash = (value: string, salt: string): string => {
  return crypto.createHash("sha256").update(value).update(salt).digest("hex");
}

// take user provided salt and stored value to verify if matches the stored hash
const isSameHash = (storedValue: string, salt: string, storedHash: string): boolean => {
  console.log(generateHash(storedValue, salt));
  console.log(storedHash);
  return generateHash(storedValue, salt) === storedHash;
}

// record the activity and update the database
const updateDatabase = (value: string, saltedHash: string) => {
  logger.append({
    value: database.data.value, saltedHash: database.data.saltedHash
  }, 
  {
    value,
    saltedHash
  });

  database.data.value = value;
  database.data.saltedHash = saltedHash;
}



app.use(cors());
app.use(express.json());

// Routes

app.get("/", (req, res) => {
  res.json(database);
});

// update the database using the user provided value and salt
app.post("/", (req, res) => {
  const value = req.body.data;
  const salt = req.body.salt;
  const saltedHash = generateHash(value, salt);

  updateDatabase(value, saltedHash);

  console.log("Logs:\n", logger.retrieve());
  console.log("Database:\n", database);

  return res.json(database);
});

// user inputs the salt they used and check if hash matches, if not, then user data has been tampered
app.post("/verify", (req, res) => {
  const salt = req.body.salt;
  const storedValue = database.data.value;
  const storedHash = database.data.saltedHash;

  if (!isSameHash(storedValue, salt, storedHash)) {
    console.log("Data has been tampered");
    return res.json({ isTampered: true });
  } else {
    console.log("Data has not been tampered");
    return res.json({ isTampered: false });
  }
  
});

// find the latest data that matches the user provided salt, if found, update the databse
app.post("/recover-data", (req, res) => {
  const salt = req.body.salt;
  const logs = logger.retrieve();

  for (let i = logs.length - 1; i >= 0; i--) {
    const log = logs[i];
    const isLastKnownGoodValue = isSameHash(log.oldValue.value, salt, log.oldValue.saltedHash);
    if (isLastKnownGoodValue) {
      console.log("Recovered data:");
      console.log(log.oldValue.value, log.oldValue.saltedHash);
      console.log("Updating databse")
      updateDatabase(log.oldValue.value, log.oldValue.saltedHash);
      return res.json({
        success: true,
        value: log.newValue.value,
      });
    }
  }

  return res.json({
    success: false
  })

});

//The route that mock hacker's data tampering attempts.
app.post("/malicious/tamper-data", (req, res) => {
  console.log("Hacker tampering the data");
  const value = req.body.data;
  const salt = req.body.salt;
  const saltedHash = salt ? generateHash(database.data.value, salt) : database.data.saltedHash;
  console.log(value,saltedHash);
  updateDatabase(value, saltedHash);

  return res.json({
    success: true
  });
});

app.listen(PORT, () => {
  console.log("Server running on port " + PORT);
});
