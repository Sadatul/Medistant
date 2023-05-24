const submitBtn = document.getElementById("submitButton");
submitBtn.addEventListener("click", submitForm);

function submitForm(e) {
    const files = document.getElementById("formFileMultiple");
    if (files.length == 0) {
        console.log("Failed Upload");
        return;
    }
    const formData = new FormData();
    for (let i = 0; i < files.files.length; i++) {
        formData.append("files", files.files[i]);
    }
    fetch("http://localhost:3000/imageUpload", {
        method: 'POST',
        body: formData,
        // headers: {
        //     "Content-Type": "multipart/form-data"
        // }
    })
        .then((res) => {
            window.location.href = "http://localhost:3000/form";
        })
        .catch((err) => ("Error occured", err));
}