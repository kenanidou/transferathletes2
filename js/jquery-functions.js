$("document").ready(function () {
  var currentQuestion = 0;
  var totalQuestions = 0;
  var userAnswers = {};
  var all_questions;
  var all_evidences;
  var faq;
  var currentLanguage = "greek"; // Αρχική γλώσσα

  function hideFormBtns() {
    $("#nextQuestion").hide();
    $("#backButton").hide();
  }

  function getQuestions() {
    return fetch("question-utils/all-questions.json")
      .then((response) => response.json())
      .then((data) => {
        all_questions = data.questions; // notice .questions
        totalQuestions = all_questions.length;
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

  function getEvidencesByIds(evidenceIds) {
    const evidenceListElement = document.getElementById("evidences");
    evidenceIds.forEach((id) => {
      var selectedEvidence = all_evidences.PublicService.evidence.find(
        (evidence) => evidence.id === id
      );
      if (selectedEvidence) {
        selectedEvidence.evs.forEach((evsItem) => {
          const listItem = document.createElement("li");
          listItem.textContent = evsItem.name;
          evidenceListElement.appendChild(listItem);
        });
      } else {
        console.log(`Evidence with ID '${id}' not found.`);
      }
    });
  }

  function loadQuestion(questionId, noError) {
    $("#nextQuestion").show();
    if (currentQuestion > 0) $("#backButton").show();

    var question = all_questions[questionId];
    var questionElement = document.createElement("div");

    if (noError) {
      questionElement.innerHTML = `
        <div class='govgr-field'>
          <fieldset class='govgr-fieldset'>
            <legend class='govgr-fieldset__legend govgr-heading-l'>
              ${question.text}
            </legend>
            <div class='govgr-radios' id='radios-${questionId}'>
              ${question.possible_answers
                .map(
                  (option) => `
                    <div class='govgr-radios__item'>
                      <label class='govgr-label govgr-radios__label'>
                        ${option.text}
                        <input class='govgr-radios__input' type='radio' name='question-option' value='${option.id}' />
                      </label>
                    </div>
                  `
                )
                .join("")}
            </div>
          </fieldset>
        </div>`;
    } else {
      questionElement.innerHTML = `
        <div class='govgr-field govgr-field__error'>
          <legend class='govgr-fieldset__legend govgr-heading-l'>${question.text}</legend>
          <p class='govgr-error-message'>Πρέπει να επιλέξετε μια απάντηση</p>
          <div class='govgr-radios' id='radios-${questionId}'>
            ${question.possible_answers
              .map(
                (option) => `
                <div class='govgr-radios__item'>
                  <label class='govgr-label govgr-radios__label'>
                    ${option.text}
                    <input class='govgr-radios__input' type='radio' name='question-option' value='${option.id}' />
                  </label>
                </div>
              `
              )
              .join("")}
          </div>
        </div>`;
    }

    $(".question-container").html(questionElement);

    // Προφόρτωση απάντησης αν υπάρχει
    var answer = userAnswers[currentQuestion];
    if (answer) $('input[name="question-option"][value="' + answer + '"]').prop("checked", true);
  }

  function submitForm() {
    const resultWrapper = document.createElement("div");
    resultWrapper.setAttribute("id", "resultWrapper");
    resultWrapper.innerHTML = `<h1 class='answer'>Η διαδικασία ολοκληρώθηκε!</h1>`;
    $(".question-container").html(resultWrapper);

    const evidenceListElement = document.createElement("ol");
    evidenceListElement.setAttribute("id", "evidences");
    $(".question-container").append(
      "<br /><h5 class='answer'>Τα δικαιολογητικά που πρέπει να προσκομίσετε είναι:</h5><br />"
    );
    $(".question-container").append(evidenceListElement);

    // Συλλογή evidence από τις επιλεγμένες απαντήσεις
    let allEvidenceIds = [];
    for (let i = 0; i < totalQuestions; i++) {
      const question = all_questions[i];
      const answerId = userAnswers[i];
      if (!answerId) continue;

      const answerObj = question.possible_answers.find((a) => a.id === answerId);
      if (answerObj && answerObj.related_evidence) {
        answerObj.related_evidence.forEach((ev) => {
          allEvidenceIds.push(ev.evidence_id);
        });
      }
    }

    getEvidencesByIds(allEvidenceIds);
    hideFormBtns();
  }

  $("#nextQuestion").click(function () {
    if ($(".govgr-radios__input").is(":checked")) {
      var selectedOption = $('input[name="question-option"]:checked').val();
      userAnswers[currentQuestion] = selectedOption;
      sessionStorage.setItem("answer_" + currentQuestion, selectedOption);

      const currentQ = all_questions[currentQuestion];
      const selectedAns = currentQ.possible_answers.find(a => a.id === selectedOption);

      if (selectedAns.next_step === "end_reject") {
        $(".question-container").html("<h1 class='answer'>Η αίτησή σας απορρίφθηκε.</h1>");
        hideFormBtns();
        return;
      }

      if (selectedAns.next_step === null || currentQuestion + 1 === totalQuestions) {
        submitForm();
      } else {
        currentQuestion++;
        loadQuestion(currentQuestion, true);
        if (currentQuestion + 1 === totalQuestions) $("#nextQuestion").text("Υποβολή");
      }
    } else {
      loadQuestion(currentQuestion, false);
    }
  });

  $("#backButton").click(function () {
    if (currentQuestion > 0) {
      currentQuestion--;
      loadQuestion(currentQuestion, true);
    }
  });

  $("#startBtn").click(function () {
    $("#intro").html("");
    $("#languageBtn").hide();
    $("#questions-btns").show();
  });

  $("#languageBtn").click(function () {
    currentLanguage = currentLanguage === "greek" ? "english" : "greek";
    if (currentQuestion >= 0 && currentQuestion < totalQuestions) loadQuestion(currentQuestion, true);
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
