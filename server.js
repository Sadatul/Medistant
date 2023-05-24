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

// const multer = require("multer");
// const { resolve } = require("path");
// var storage = multer.diskStorage({
//     destination: function (req, file, cb) {
//         cb(null, __dirname + "/public/uploads/audios")
//     },
//     filename: function (req, file, cb) {
//         cb(null, Date.now() + '.m4a') //Appending .jpg
//     }
// })
// const upload = multer({ storage: storage });

var multer = require('multer');
var path = require('path')

var storage = multer.diskStorage({
    destination: function (req, file, cb) {
        var a;
        if (file.mimetype == "audio/mp3") {
            a = "audios";
        }
        else {
            a = "images";
        }
        cb(null, __dirname + "/public/uploads/" + a);
    },
    filename: function (req, file, cb) {
        // console.log(file.mimetype);
        var a;
        if (file.mimetype == "audio/mp3") {
            a = ".m4a";
        }
        else {
            a = ".jpg";
        }
        cb(null, Date.now() + a); //Appending extension
    }
})

var upload = multer({ storage: storage });


/* MongoDB setUp */
const { default: mongoose } = require("mongoose");
const moongose = require("mongoose");
moongose.connect("mongodb://0.0.0.0:27017/Medistant");

var audioFileName, imageFileName;
const prescriptionSchema = new moongose.Schema({
    date: String,
    duration: Number,
    doctorName: String,
    hospitalName: String,
    organs: [String],
    medicines: [String],
    audioUrl: String,
    imageUrl: String
});

const prescriptionModel = moongose.model("prescription", prescriptionSchema);
// var p = new prescriptionModel(new dataConstructor("28-08-2000", "Swastika", "Pandit", ["Liver", "Kidney"], ["Paracetamol", "Maxpro"], "111.m4a", "111.jpg"));
// p.save();

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

app.get("/image", (req, res) => {
    res.sendFile(__dirname + "/pages/upload-image.html");
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

app.get("/form", function (req, res) {
    res.sendFile(__dirname + "/pages/form.html");
});

app.get("/data.json", (req, res) => {
    res.sendFile(__dirname + "/data.json");
});
/* ALL GET request -----> END */


/* ALL POST request -----> START */
app.post("/audioUpload", upload.array("audio-file"), uploadFiles);
async function uploadFiles(req, res) {
    // console.log(req.body);
    // console.log(req.files);
    // res.send("FILE UPLOADED");
    audioFileName = req.files[0].filename;
    convertedText = await speechToText(req.files[0].filename);
    convertionFlag = 1;
    console.log("Inside Converted data: " + convertedText);
    // res.redirect("/text");
    // res.send("done");
}
app.post("/text", textToJson);

async function textToJson(req, res) {
    var text = req.body.text;
    console.log(generatePrompt(text, "medicine"));
    try {
        var completion = await openai.createCompletion({
            model: "text-davinci-003",
            prompt: generatePrompt(text, "medicine"),
            temperature: 0.6,
        });
        var sampleMedicine = completion.data.choices[0].text;
        console.log(sampleMedicine);
        var completion2 = await openai.createCompletion({
            model: "text-davinci-003",
            prompt: generatePrompt(text, "organ"),
            temperature: 0.6,
        });
        var sampleOrgan = completion2.data.choices[0].text;
        console.log(sampleOrgan);
        // res.status(200).json({ result: completion.data.choices[0].text });
        var dataForForm = {
            organs: splitter(sampleOrgan),
            medicines: splitter(sampleMedicine)
        };

        fs.writeFile("data.json", JSON.stringify(dataForForm), (error) => {
            if (error) {
                console.log(error);
                return;
            }
            console.log("JSON file was written correctly");

        });
        res.redirect("/image");
    } catch (error) {
        // Consider adjusting the error handling logic for your use case
        if (error.response) {
            console.error(error.response.status, error.response.data);
            res.status(error.response.status).json(error.response.data);
        } else {
            console.error(`Error with OpenAI API request: ${error.message}`);
            res.status(500).json({
                error: {
                    message: 'An error occurred during your request.',
                }
            });
        }
    }
}

app.post("/form", function (req, res) {
    var medicines = req.body.medicineNames.split(";");
    var organs = req.body.organNames.split(";");
    medicines.pop();
    organs.pop();
    var duration = Number(req.body.duration);
    var date = req.body.date;
    var doctorName = req.body.doctorName;
    var hospitalName = req.body.hospitalName;
    var p = new prescriptionModel(new dataConstructor(date, duration, doctorName, hospitalName, organs, medicines, audioFileName, imageFileName));
    p.save();
    console.log("Data Saved");
    res.send("Thank you for your kind co-operation");
});

app.post("/imageUpload", upload.array("files"), uploadFilesImg);

function uploadFilesImg(req, res) {
    imageFileName = req.files[0].filename
    res.json({ message: "Successfully uploaded files" });
}
/* ALL POST request -----> END */

/*Helper Functions*/
function dataConstructor(date, duration, dName, hName, organs, medicines, audioFile, imageFile) {
    this.date = date,
        this.duration = duration,
        this.doctorName = dName,
        this.hospitalName = hName,
        this.organs = organs,
        this.medicines = medicines,
        this.audioUrl = audioFile,
        this.imageUrl = imageFile
}

function generatePrompt(text, key) {
    var query = `"${text} Which are names of ${key}s in the text? Return results separated by comma and without whitespace characters."`;
    return query;
}

function splitter(text) {
    var x = text.split(",");
    for (var i = 0; i < x.length; i++) {
        x[i] = x[i].trim();
    }
    return x;
}
// var a = new dataConstructor("2000", "Atik", "M-Hospital", ["head", "neck"], ["Paracetamol", "MaxPro"]);
// console.log(a.date);
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
    const path = __dirname + "/public/uploads/audios/" + filename;
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
