import { get } from "http";
import React, { useEffect, useState } from "react";

const API_URL = "http://localhost:8080";

function App() {
  const [data, setData] = useState<string>();
  const [hash, setHash] = useState<string>();
  const [salt, setSalt] = useState<string>();
  const [hasError, setHasError] = useState<boolean>(false);
  const [showVerificationWindow, setShowVerificationWindow] = useState<boolean>(false);
  const [isTampered, setIsTampered] = useState<boolean>(false);
  const [showHackerWindow, setShowHackerWindow] = useState<boolean>(false);


  useEffect(() => {
    getData();
  }, []);

  useEffect(() => {
    let timeoutId: NodeJS.Timeout;
    if (hasError) {
      timeoutId = setTimeout(() => setHasError(false), 2000);
    }
    return () => clearTimeout(timeoutId);
  }, [hasError]);

  const getData = async () => {
    const response = await fetch(API_URL);
    const { data } = await response.json();
    console.log(data.value);
    setData(data.value);
    setHash(data.saltedHash);
  };

  const updateData = async () => {
    const isValidated = validateForm();
    if (!isValidated) {
      setHasError(true);
      return;
    }
    await fetch(API_URL, {
      method: "POST",
      body: JSON.stringify({ data, salt }),
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
    });

    await getData();
  };

  const verifyData = async () => {
    const response = await fetch(API_URL + "/verify", {
      method: "POST",
      body: JSON.stringify({ salt }),
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
    });

    const { isTampered } = await response.json();
    console.log(isTampered);

    if (isTampered) {
      setIsTampered(true);
      setShowVerificationWindow(true);
    } else {
      setIsTampered(false);
      setShowVerificationWindow(true);
    }
  };

  const recoverData = async () => {
    const response = await fetch(API_URL + "/recover-data", {
      method: "POST",
      body: JSON.stringify({ salt }),
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
    });

    await getData();

    setShowVerificationWindow(false);
  }

  const validateForm = () => {
    if (!data || !salt) {
      return false;
    } else {
      return true;
    }
  };

  return (
    <div
      style={{
        width: "100vw",
        height: "100vh",
        display: "flex",
        position: "absolute",
        padding: 0,
        justifyContent: "center",
        alignItems: "center",
        flexDirection: "column",
        gap: "20px",
        fontSize: "30px",
        borderColor: "black",
      }}
    >
      {showVerificationWindow && <VerificationWindow isTampered={isTampered} recoverData={recoverData} closeVerificationWindow={() => setShowVerificationWindow(false)} />}

      {showHackerWindow && <HackerWindow closeHackerWindow={() => setShowHackerWindow(false)} getData={getData} />}

      <div>Saved Data</div>
      <input
        style={{ fontSize: "30px" }}
        type="text"
        value={data}
        onChange={(e) => setData(e.target.value)}
      />

      <div>Saved Hash</div>
      <span>{hash}</span>

      <br />

      <div>Your Salt (Please use the same salt when updating and verifying the data)</div>
      <input
        style={{ fontSize: "30px" }}
        type="text"
        value={salt}
        onChange={(e) => setSalt(e.target.value)}
      />

      <div style={{ display: "flex", gap: "10px" }}>
        <button style={{ fontSize: "20px" }} onClick={updateData}>
          Update Data
        </button>
        <button style={{ fontSize: "20px" }} onClick={verifyData}>
          Verify Data
        </button>
      </div>

      <div>
        <button style={{ fontSize: "20px", color: "red", backgroundColor: "black" }} onClick={() => setShowHackerWindow(true)}>
          <b>Hacker Zone: Click to Tamper Data</b>
        </button>
      </div>

      {hasError && <div style={{ color: "red", fontSize: "20px" }}>One or more fields are missing</div>}
    </div>
  );
}

function VerificationWindow({ isTampered, recoverData, closeVerificationWindow }: { isTampered: boolean, recoverData: () => void, closeVerificationWindow: () => void }) {
  return (
    <div style={{
      position: "fixed",
      top: 0,
      left: 0,
      width: "100vw",
      height: "100vh",
      backgroundColor: "rgba(0,0,0,0.5)",
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
    }}>
      <div style={{
        backgroundColor: "white",
        padding: "20px",
        borderRadius: "10px",
        display: "flex",
        gap: "10px",
        flexDirection: "column",
      }}>
        <div style={{ fontSize: "30px" }}>{isTampered ? "Data has been tampered" : "Data has not been tampered"}</div>
        <br />
        {isTampered && <button style={{ fontSize: "20px" }} onClick={recoverData}>Reset Data</button>}
        <button style={{ fontSize: "20px" }} onClick={closeVerificationWindow}>Close</button>
      </div>
    </div>
  )
}

function HackerWindow({ closeHackerWindow, getData }: { closeHackerWindow: () => void, getData: () => void }) {
  const [data, setData] = useState("");
  const [salt, setSalt] = useState("");

  const tamperData = async () => {
    console.log(data, salt);
    const response = await fetch(API_URL + "/malicious/tamper-data", {
      method: "POST",
      body: JSON.stringify({ data, salt }),
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
    });

    const { success } = await response.json();

    if (success) {
      getData();
      closeHackerWindow();
    }
  }

  return (
    <div style={{
      position: "fixed",
      top: 0,
      left: 0,
      width: "100vw",
      height: "100vh",
      backgroundColor: "rgba(0,0,0,0.5)",
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
    }}>
      <div style={{
        backgroundColor: "white",
        padding: "20px",
        borderRadius: "10px",
        display: "flex",
        gap: "10px",
        flexDirection: "column",
      }}>
        <div style={{
          fontSize: "30px",
          backgroundColor: "black",
          color: "red",
          textAlign: "center",

        }}>Hacker Zone</div>
        <br />
        <div>Set the new data</div>
        <input
          style={{ fontSize: "30px" }}
          type="text"
          value={data}
          onChange={(e) => setData(e.target.value)}
        />
        <div>(optional) Add custom salt (if empty then hash will stay the same)</div>
        <input
          style={{ fontSize: "30px" }}
          type="text"
          value={salt}
          onChange={(e) => setSalt(e.target.value)}
        />

        <button style={{ fontSize: "20px" }} onClick={tamperData}>Tamper Data</button>
        <button style={{ fontSize: "20px" }} onClick={closeHackerWindow}>Close</button>
      </div>
    </div>
  )
}

export default App;
