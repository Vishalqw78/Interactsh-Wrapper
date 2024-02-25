const { spawn } = require("child_process");
const express = require("express");
const bodyParser = require("body-parser");

const interactshclient = "interactsh-client";

const app = express();
app.use(bodyParser.json());

let url = "";
const interactionArr = [];

function processStdoutData(data) {
  let x = data.toString();
  const logLines = x.split("\n");

  logLines.forEach((line) => {
    const match = line.match(
      /\[.*\] Received (.*) from (.*?) at (\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2})/
    );
    if (match) {
      const interactionType = match[1];
      const callerIP = match[2];
      const timestamp = match[3];
      interactionArr.push({ interactionType, callerIP, timestamp, url });
    }
  });
}

function processStderrData(data) {
  const chunk = data.toString();
  let x = chunk.split(" ");

  url = x[x.length - 1];
  url = url.slice(0, -1);
}

function filterInteractions(start, end) {
  let filteredInteractions = [...interactionArr];

  if (start && end) {
    filteredInteractions = filteredInteractions.filter((interaction) => {
      return interaction.timestamp >= start && interaction.timestamp <= end;
    });
  } else if (start) {
    filteredInteractions = filteredInteractions.filter((interaction) => {
      return interaction.timestamp >= start;
    });
  } else if (end) {
    filteredInteractions = filteredInteractions.filter((interaction) => {
      return interaction.timestamp <= end;
    });
  }

  return filteredInteractions;
}

const subpro = spawn(interactshclient);

subpro.stdout.on("data", processStdoutData);

subpro.stderr.on("data", processStderrData);

subpro.on("error", (error) => {
  console.error(`error: ${error.message}`);
});

subpro.on("close", (code) => {
  console.log(`child process salida ${code}`);
});

app.get("/api/getURL", (req, res) => {
  res.json({ url });
});

app.get("/api/getInteractions", (req, res) => {
  const { start, end } = req.body;
  const filteredInteractions = filterInteractions(start, end);
  res.json(filteredInteractions);
});

const port = 3000;
app.listen(port, () => {
  console.log(`running on ${port}`);
});
