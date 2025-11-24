$("document").ready(function () {
  var currentQuestion = 0;
  var all_questions;
  var all_evidences;
  var faq;
  var userAnswers = {};
  var currentLanguage = "greek";

  function hideFormBtns() {
    $("#nextQuestion").hide();
    $("#backButton").hide();
  }

  function getQuestions() {
    return fetch("question-utils/all-questions.json")
      .then((response) => response.json())
      .then((data) => {
        all_questions = data.questions;
      })
      .catch((error) => {
        console.error("Failed to fetch all-questions:", error);
        $(".question-container").html("Error: Failed to fetch all-questions.json.");
        hideFormBtns();
      });
  }

  function getEvidences() {
    return fetch("question-utils/cpsv.json")
      .then((response) => response.json())
      .then((data) => {
        all_evidences = data;
      })
      .catch((error) => {
        console.error("Failed to fetch cpsv:", error);
        $(".question-container").html("Error: Failed to fetch cpsv.json.");
        hideFormBtns();
      });
  }

  function getFaq() {
    return fetch("question-utils/faq.json")
      .then((response) => response.json())
      .then((data) => {
        faq = data;
      })
      .catch((error) => {
        console.error("Failed to fetch faq:", error);
        $(".question-container").html("Error: Failed to fetch faq.json.");
      });
  }

  function getEvidencesById(id) {
    var selectedEvidence = all_evidences.PublicService.evidence.find(
      (evidence) => evidence.id === id
    );

    if (selectedEvidence) {
      const evidenceListElement = document.getElementById("evidences");
      selectedEvidence.evs.forEach((evsItem) => {
        const listItem = document.createElement("li");
        listItem.textContent = evsItem.name;
        evidenceListElement.appendChild(listItem);
      });
    } else {
      console.log(`Evidence with ID '${id}' not found.`);
    }
  }

  function loadQuestion(questionIndex, noError = true) {
    $("#nextQuestion").show();
    if (questionIndex > 0) $("#backButton").show();

    var question = all_questions[questionIndex];
    var questionElement = document.createElement("div");

    const optionsHtml = question.possible_answers
      .map(
        (option) => `
        <div class='govgr-radios__item'>
          <label class='govgr-label govgr-radios__label'>
            ${option.text}
            <input class='govgr-radios__input' type='radio' name='question-option' value='${option.text}' />
          </label>
        </div>`
      )
      .join("");

    if (noError) {
      questionElement.innerHTML = `
        <div class='govgr-field'>
          <fieldset class='govgr-fieldset'>
            <legend class='govgr-fieldset__legend govgr-heading-l'>${question.text}</legend>
            <div class='govgr-radios' id='radios-${questionIndex}'>${optionsHtml}</div>
          </fieldset>
        </div>`;
    } else {
      questionElement.innerHTML = `
        <div class='govgr-field govgr-field__error'>
          <legend class='govgr-fieldset__legend govgr-heading-l'>${question.text}</legend>
          <p class='govgr-error-message'>Πρέπει να επιλέξετε μια απάντηση</p>
          <div class='govgr-radios' id='radios-${questionIndex}'>${optionsHtml}</div>
        </div>`;
    }

    $(".question-container").html(questionElement);
  }

  function submitForm() {
    const resultWrapper = document.createElement("div");
    resultWrapper.setAttribute("id", "resultWrapper");

    const allYes =
      userAnswers["q1"] === "Ναι" &&
      userAnswers["q2"] === "Ναι" &&
      userAnswers["q3"] === "Ναι" &&
      userAnswers["q4"] === "Ναι";

    if (allYes) {
      resultWrapper.innerHTML = `<h1 class='answer'>Η αίτησή σας πληροί όλα τα κριτήρια!</h1>`;
      $(".question-container").html(resultWrapper);

      $(".question-container").append(
        "<br /><h5 class='answer'>Τα δικαιολογητικά που πρέπει να προσκομίσετε είναι:</h5><br />"
      );
      const evidenceListElement = document.createElement("ol");
      evidenceListElement.setAttribute("id", "evidences");
      $(".question-container").append(evidenceListElement);
      retrieveAnswers();
    } else {
      resultWrapper.innerHTML = `<h1 class='answer'>Η αίτησή σας δεν πληροί όλα τα κριτήρια.</h1>`;
      $(".question-container").html(resultWrapper);
    }

    hideFormBtns();
  }

  function retrieveAnswers() {
    getEvidencesById(1);
    getEvidencesById(2);
    getEvidencesById(3);
    getEvidencesById(4);
  }

  $("#nextQuestion").click(function () {
    if ($(".govgr-radios__input").is(":checked")) {
      var selectedOption = $('input[name="question-option"]:checked').val();
      var question = all_questions[currentQuestion];
      userAnswers[question.id] = selectedOption;
      sessionStorage.setItem("answer_" + question.id, selectedOption);

      var nextStep = question.possible_answers.find(
        (option) => option.text === selectedOption
      ).next_step;

      if (nextStep === "end_reject" || nextStep === "q6") {
        submitForm();
      } else {
        currentQuestion = all_questions.findIndex((q) => q.id === nextStep);
        loadQuestion(currentQuestion, true);
      }
    } else {
      loadQuestion(currentQuestion, false);
    }
  });

  $("#backButton").click(function () {
    if (currentQuestion > 0) {
      currentQuestion--;
      loadQuestion(currentQuestion, true);
      var answer = userAnswers[all_questions[currentQuestion].id];
      if (answer)
        $('input[name="question-option"][value="' + answer + '"]').prop(
          "checked",
          true
        );
    }
  });

  $("#startBtn").click(function () {
    $("#intro").html("");
    $("#languageBtn").hide();
    $("#questions-btns").show();
  });

  $("#languageBtn").click(function () {
    currentLanguage = currentLanguage === "greek" ? "english" : "greek";
    if (currentQuestion >= 0 && currentQuestion < all_questions.length)
      loadQuestion(currentQuestion, true);
  });

  $("#questions-btns").hide();

  getQuestions().then(() => {
    getEvidences().then(() => {
      getFaq().then(() => {
        loadQuestion(currentQuestion, true);
      });
    });
  });
});
