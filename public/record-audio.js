const pauseRecordingElement = document.querySelector('.js-pause-audio-record');
const startRecordingElement = document.querySelector('.js-start-audio-record');
const finishRecordingElement = document.querySelector('.js-finish-audio-record');

let [seconds, minutes, hours] = [0, 0, 0];
const showRecordingTimeElement = document.querySelector('.js-show-recording-time');

const finishButton = document.getElementById('finish');
let mediaRecorder;

let intervalId = null;
let isPaused = false;

const sendAudioFile = file => {
    const formData = new FormData();
    formData.append('audio-file', file);
    return fetch('http://localhost:3000/audioUpload', {
        method: 'POST',
        body: formData
    });
};



function showStopWatch() {
    seconds++;
    if (seconds == 60) {
        seconds = 0;
        minutes++;

        if (minutes == 60) {
            minutes = 0;
            hours++;
        }


    }

    let h = (hours < 10) ? '0' + hours : hours;
    let m = (minutes < 10) ? '0' + minutes : minutes;
    let s = (seconds < 10) ? '0' + seconds : seconds;


    showRecordingTimeElement.innerHTML = h + ':' + m + ':' + s;
}

function startStopWatch() {
    if (intervalId != null) {
        clearInterval(intervalId);
    }

    intervalId = setInterval(showStopWatch, 1000);

}

function pauseStopWatch() {
    clearInterval(intervalId)
}

function resetStopWatch() {
    clearInterval(intervalId);
    [seconds, minutes, hours] = [0, 0, 0];
    showRecordingTimeElement.innerHTML = '00:00:00'
}


pauseRecordingElement.disabled = true;
finishRecordingElement.disabled = true;

if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
    console.log("getUserMedia supported.");

    const constraints = { audio: true };
    let chunks = [];

    let onSuccess = function (stream) {
        const mediaRecorder = new MediaRecorder(stream);

        // visualize(stream);

        startRecordingElement.onclick = function () {
            console.log(mediaRecorder);
            mediaRecorder.start();
            startStopWatch();

            console.log(mediaRecorder.state);
            console.log('recorder started');

            pauseRecordingElement.disabled = false;
            finishRecordingElement.disabled = false;
        }

        finishRecordingElement.onclick = function () {
            mediaRecorder.stop();
            resetStopWatch();
            console.log(mediaRecorder.state);

            finishRecordingElement.disabled = true;
            pauseRecordingElement.disabled = true;

            startRecordingElement.disabled = true;
            window.location.href = "http://localhost:3000/text";
        }

        pauseRecordingElement.onclick = () => {

            startRecordingElement.disabled = true;
            if (mediaRecorder.state === "recording") {
                mediaRecorder.pause();

                pauseRecordingElement.innerHTML = 'Resume';
                pauseStopWatch();
                // recording paused
            } else if (mediaRecorder.state === "paused") {
                mediaRecorder.resume();
                pauseRecordingElement.innerHTML = 'Pause';
                startStopWatch();
                // resume recording
            }
        };

        mediaRecorder.onpause = () => {
            // do something in response to
            // recording being paused
            console.log('media recorder paused');
        };

        mediaRecorder.onresume = () => {
            // do something in response to
            // recording being resumed
            console.log('media recorder resumed');
        };

        mediaRecorder.onstop = function (e) {
            console.log("data available");
            const blob = new Blob(chunks, {
                'type': 'audio/mp3'
            });

            var a = sendAudioFile(blob);
            console.log('audio file sent');
            startRecordingElement.disabled = true;
        }

        mediaRecorder.ondataavailable = function (e) {
            chunks.push(e.data);
        }
    }

    let onError = function (err) {
        console.log('Error occurred ' + err);
    }

    navigator.mediaDevices
        .getUserMedia(
            // constraints - only audio needed for this app
            constraints
        )

        // Success callback
        .then(onSuccess, onError)

        // Error callback
        .catch((err) => {
            console.error(`The following getUserMedia error occurred: ${err}`);
        });
} else {
    console.log("getUserMedia not supported on your browser!");
}