$("document").ready(function () {
  var currentQuestionId = "q1";
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
        all_questions = {};
        data.questions.forEach((q) => (all_questions[q.id] = q));
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
    }
  }

  function loadQuestion(questionId, noError) {
    $("#nextQuestion").show();
    if (questionId !== "q1") $("#backButton").show();

    var question = all_questions[questionId];
    var questionElement = document.createElement("div");

    if (!question) return;

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

    // Εμφάνιση μόνο των σχετικών στοιχείων που απάντησε ο χρήστης
    Object.keys(userAnswers).forEach((qId) => {
      var question = all_questions[qId];
      var answer = question.possible_answers.find((a) => a.id === userAnswers[qId]);
      if (answer && answer.related_evidence) {
        answer.related_evidence.forEach((ev) => getEvidencesById(ev.evidence_id));
      }
    });

    hideFormBtns();
  }

  $("#nextQuestion").click(function () {
    if ($(".govgr-radios__input").is(":checked")) {
      var selectedOptionId = $('input[name="question-option"]:checked').val();
      userAnswers[currentQuestionId] = selectedOptionId;

      var currentQuestion = all_questions[currentQuestionId];
      var selectedOption = currentQuestion.possible_answers.find(
        (o) => o.id === selectedOptionId
      );

      if (!selectedOption.next_step || all_questions[selectedOption.next_step].type === "end") {
        submitForm();
      } else {
        currentQuestionId = selectedOption.next_step;
        loadQuestion(currentQuestionId, true);
      }
    } else {
      loadQuestion(currentQuestionId, false);
    }
  });

  $("#backButton").click(function () {
    // Απλή λογική για back button: επαναφορά στην προηγούμενη ερώτηση
    // Απαιτεί tracking ιστορικού
    // Αν θέλεις μπορώ να το προσθέσω
  });

  $("#startBtn").click(function () {
    $("#intro").html("");
    $("#languageBtn").hide();
    $("#questions-btns").show();
  });

  $("#languageBtn").click(function () {
    currentLanguage = currentLanguage === "greek" ? "english" : "greek";
    loadQuestion(currentQuestionId, true);
  });

  $("#questions-btns").hide();

  getQuestions().then(() => {
    getEvidences().then(() => {
      loadQuestion(currentQuestionId, true);
    });
  });
});


