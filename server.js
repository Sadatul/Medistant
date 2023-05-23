/* ALL Kinds of imports and preparation for using the 
packages and APIs ----> START */

const express = require("express");
const app = express()

const bodyParser = require("body-parser");
app.use(bodyParser.urlencoded({ extended: true }));

const fs = require("fs");

const { Configuration, OpenAIApi } = require("openai");
require('dotenv').config();
const configuration = new Configuration({
    apiKey: process.env.OPENAI_API_KEY,
});
const openai = new OpenAIApi(configuration);

const multer = require("multer");
const { resolve } = require("path");
var storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, __dirname + "/uploads")
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + '.m4a') //Appending .jpg
    }
})
const upload = multer({ storage: storage });

app.use(express.static('public'));
app.listen(3000, function () {
    console.log("A server started at port 3000");
})

var convertedText = "";
var convertionFlag = 0;
/* ALL Kinds of imports and preparation for using the 
packages and APIs ----> END */

/* ALL GET request -----> START */
app.get("/audio", (req, res) => {
    res.sendFile(__dirname + "/pages/record-audio.html");
});
app.get("/text", sendText);
function sendText(req, res) {
    if (convertionFlag == 0) {
        setTimeout(() => {
            sendText(req, res);
        }, 1000);
    }
    else {
        res.sendFile(__dirname + "/pages/converted-text.html");
    }
}
app.get("/text/data", function (req, res) {
    res.send(convertedText);
    convertedText = "";
    convertionFlag = 0;
});
/* ALL GET request -----> END */


/* ALL POST request -----> START */
app.post("/audioUpload", upload.array("audio-file"), uploadFiles);
async function uploadFiles(req, res) {
    // console.log(req.body);
    // console.log(req.files);
    // res.send("FILE UPLOADED");
    convertedText = await speechToText(req.files[0].filename);
    convertionFlag = 1;
    console.log("Inside Converted data: " + convertedText);
    // res.redirect("/text");
    // res.send("done");
}
/* ALL POST request -----> END */


/*Helper Functions*/
async function upload_file(api_token, path) {
    console.log(`Uploading file: ${path}`);

    // Read the file data
    const data = fs.readFileSync(path);
    const url = "https://api.assemblyai.com/v2/upload";

    try {
        // Send a POST request to the API to upload the file, passing in the headers and the file data
        const response = await fetch(url, {
            method: "POST",
            body: data,
            headers: {
                "Content-Type": "application/octet-stream",
                Authorization: api_token,
            },
        });

        // If the response is successful, return the upload URL
        if (response.status === 200) {
            const responseData = await response.json();
            return responseData["upload_url"];
        } else {
            console.error(`Error: ${response.status} - ${response.statusText}`);
            return null;
        }
    } catch (error) {
        console.error(`Error: ${error}`);
        return null;
    }
}

// Async function that sends a request to the AssemblyAI transcription API and retrieves the transcript
async function transcribeAudio(api_token, audio_url) {
    console.log("Transcribing audio... This might take a moment.");

    // Set the headers for the request, including the API token and content type
    const headers = {
        authorization: api_token,
        "content-type": "application/json",
    };

    // Send a POST request to the transcription API with the audio URL in the request body
    const response = await fetch("https://api.assemblyai.com/v2/transcript", {
        method: "POST",
        body: JSON.stringify({ audio_url }),
        headers,
    });

    // Retrieve the ID of the transcript from the response data
    const responseData = await response.json();
    const transcriptId = responseData.id;

    // Construct the polling endpoint URL using the transcript ID
    const pollingEndpoint = `https://api.assemblyai.com/v2/transcript/${transcriptId}`;

    // Poll the transcription API until the transcript is ready
    while (true) {
        // Send a GET request to the polling endpoint to retrieve the status of the transcript
        const pollingResponse = await fetch(pollingEndpoint, { headers });
        const transcriptionResult = await pollingResponse.json();

        // If the transcription is complete, return the transcript object
        if (transcriptionResult.status === "completed") {
            return transcriptionResult;
        }
        // If the transcription has failed, throw an error with the error message
        else if (transcriptionResult.status === "error") {
            throw new Error(`Transcription failed: ${transcriptionResult.error}`);
        }
        // If the transcription is still in progress, wait for a few seconds before polling again
        else {
            await new Promise((resolve) => setTimeout(resolve, 3000));
        }
    }
}

// Upload a file and create a transcript using the AssemblyAI API
async function speechToText(filename) {
    console.log("Welcome to AssemblyAI!");

    // -----------------------------------------------------------------------------
    // Update the file path here, pointing to a local audio or video file.
    // If you don't have one, download a sample file: https://storage.googleapis.com/aai-web-samples/espn-bears.m4a
    // You may also remove the upload step and update the 'audio_url' parameter in the
    // 'transcribeAudio' function to point to a remote audio or video file.
    // -----------------------------------------------------------------------------
    const path = __dirname + "/uploads/" + filename;
    const uploadUrl = await upload_file(process.env.SPEECH_API_KEY, path);

    // If the upload fails, log an error and return
    if (!uploadUrl) {
        console.error(new Error("Upload failed. Please try again."));
        return;
    }

    // Transcribe the audio file using the upload URL
    const transcript = await transcribeAudio(process.env.SPEECH_API_KEY, uploadUrl);
    // console.log(transcript.text);
    // Print the completed transcript object
    return transcript.text;
}
