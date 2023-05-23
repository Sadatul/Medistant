async function ready() {
    const response = await fetch("/text/data");
    const data = await response.text();
    console.log(data);
    document.querySelector("#textArea").value = data;
}
ready();