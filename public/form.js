async function prepareForm() {
    const response = await fetch('/data.json');
    const data = await response.json();
    var namesOfMedicines = data.medicines;
    var namseOfOrgans = data.organs;

    let currentDate = new Date();
    const currentDateString = currentDate.getMonth() + 1 + "-" + currentDate.getDate() + "-" + currentDate.getFullYear();
    $("#date-input").val(currentDateString);
    console.log(currentDate);

    $(".button-holder").slideUp(100);
    function createButtonHtml(id, inner) {
        return `<button type="button" id= "${id}" class="suggest-btn btn btn-outline-success">${inner}</button>`;
    }

    // var buttonHolder = document.querySelector(".button-holder-date");
    // console.log(buttonHolder);
    // buttonHolder.innerHTML = buttonHolder.innerHTML + "\n" + createButtonHtml("date-" + currentDateString, currentDateString);
    // console.log('ok1');

    var buttonHolder = document.querySelector(".button-holder-medicine");
    for (var i in namesOfMedicines) {
        buttonHolder.innerHTML = buttonHolder.innerHTML + "\n" + createButtonHtml("medicine-" + namesOfMedicines[i], namesOfMedicines[i])
    }

    var buttonHolder = document.querySelector(".button-holder-organ");
    for (var i in namseOfOrgans) {
        buttonHolder.innerHTML = buttonHolder.innerHTML + "\n" + createButtonHtml("organs-" + namseOfOrgans[i], namseOfOrgans[i])
    }
    $(".suggest-btn").click(function (e) {
        var list = e.target.id.split("-");
        clickBtn(list[0], e.target.id);
    })

    $(".form-control").click(function (e) {
        $(".button-holder").slideUp(100);
        if (e.target.id == "first-box")
            $(".button-holder-medicine").slideDown(100);
        else if (e.target.id == "second-box")
            $(".button-holder-organ").slideDown(100);
    });
}

// var namesOfMedicines = ["Paracetamol", "MaxPro", "DeadPool"];
// var namseOfOrgans = ["head", "leg", "hand", "heart"];

prepareForm();

function clickBtn(type, id) {
    console.log('clickBtn caled');
    console.log(type);
    var v = $("#" + id).text();
    $("#" + id).fadeOut(100);
    var s;
    if (type == "medicine") s = "first-box";
    else if (type == "organs") {
        s = "second-box";
    }
    $("#" + s).val($("#" + s).val() + v + ";");
}


