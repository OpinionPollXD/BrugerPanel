const baseURL = "https://restopinionpoll.azurewebsites.net/api/Questions";
const translateURL = "https://api.cognitive.microsofttranslator.com/translate";
const apiKey = "f324a4c180e34f6b9aa306b7b8755d1c";
const region = "GLOBAL";

new Vue({
  el: "#app",
  data: {
    selectedLanguage: null,
    languageOptions: ["Dansk", "English", "Français"],
    questions: [],
    currentQuestion: null,
    viewState: "question", // Kan være 'question' eller 'statistics'
    answered: false,
    stats: [],
    timer: null,
    remainingTime: 20, //20 sekunders timer
    translatedTexts: {
      questionTitle: "Spørgsmål",
      statsTitle: "Statistik",
      nextButton: "Næste",
    },
    questionCount: 0,
  },
  methods: {
    setLanguage(languageIndex) {
      this.selectedLanguage = languageIndex;
      this.fetchQuestions();
      if (languageIndex !== 0) {
        // Tjek om det valgte sprog ikke er Dansk
        this.translateStaticTexts();
      } else {
        this.translatedTexts = {
          questionTitle: "Spørgsmål",
          statsTitle: "Statistik",
          nextButton: "Næste",
        };
      }
    },

    startTimer() {
      this.remainingTime = 20; // Reset timer til 20 sekunder
      this.timerWidth = 100; // Reset loadbaren til fuld bredde

      // Clear timer hvis den allerede kører
      if (this.timer) {
        clearTimeout(this.timer);
      }
      // Update timer hvert sekund
      this.timer = setInterval(() => {
        if (this.remainingTime > 0) {
          this.remainingTime -= 1;
          this.timerWidth = (this.remainingTime / 20) * 100; // Opdaterer loadbar baseret på den tilbageværende tid
        } else {
          this.timeIsUp();
        }
      }, 1000);
    },

    timeIsUp() {
      console.log("Time is up! Moving to next question.");
      clearInterval(this.timer); // Stop the timer
      this.getRandomQuestion(); // Henter nyt spørgsmål
    },

    loadNextQuestion() {
      // Tjek om der er flere spørgsmål tilgængelige
      if (this.questions.length > 0) {
        // Hent og vis det næste spørgsmål
        this.getRandomQuestion();
        this.viewState = "question"; // Skift tilbage til spørgsmålsvisningen
        this.startTimer(); // Genstart timeren for det nye spørgsmål
      } else {
        console.log("Ingen flere spørgsmål tilgængelige.");
        // Her kan du implementere logik for hvad der sker, når der ikke er flere spørgsmål
      }
    },

    fetchQuestions() {
      axios
        .get(`${baseURL}/GetActiveQuestions`)
        .then((response) => {
          this.questions = response.data;
          if (this.selectedLanguage !== 0) {
            this.translateQuestions();
          } else {
            this.getRandomQuestion();
          }
        })
        .catch((error) => {
          console.error("Error fetching questions:", error);
        });
    },

    translateQuestions() {
      const targetLanguage = this.selectedLanguage === 1 ? "en" : "fr";
      const translationPromises = this.questions.map((question) => {
        return Promise.all([
          this.translateText(question.questionText, targetLanguage),
          this.translateText(question.option1, targetLanguage),
          this.translateText(question.option2, targetLanguage),
          this.translateText(question.option3, targetLanguage),
        ]).then((translations) => {
          question.questionText = translations[0];
          question.option1 = translations[1];
          question.option2 = translations[2];
          question.option3 = translations[3];
        });
      });

      Promise.all(translationPromises).then(() => {
        this.getRandomQuestion();
      });
    },

    translateStaticTexts() {
      const targetLanguage = this.selectedLanguage === 1 ? "en" : "fr"; // Bestem målsproget baseret på brugerens valg
      const staticTextKeys = Object.keys(this.translatedTexts); // Hent alle nøglerne fra translatedTexts
      const translationPromises = staticTextKeys.map((key) => {
        return this.translateText(
          this.translatedTexts[key],
          targetLanguage
        ).then((translatedText) => {
          this.translatedTexts[key] = translatedText;
        });
      });

      Promise.all(translationPromises); // Vent på at alle oversættelser er færdige
    },

    translateText(text, targetLanguage) {
      return axios({
        method: "post",
        url: translateURL,
        headers: {
          "Ocp-Apim-Subscription-Key": apiKey,
          "Ocp-Apim-Subscription-Region": region,
          "Content-type": "application/json",
        },
        params: {
          "api-version": "3.0", // Sikrer at API-versionen er specificeret korrekt
          to: targetLanguage, // Målsprog
        },
        data: JSON.stringify([{ Text: text }]), // Teksten der skal oversættes
      })
        .then((response) => {
          return response.data[0].translations[0].text; // Return oversat tekst
        })
        .catch((error) => {
          if (error.response) {
            console.error("Error status", error.response.status);
            console.error("Error data", error.response.data);
          } else {
            console.error("Error message", error.message);
          }
          return text; // Return original text if translation fails
        });
    },

    getRandomQuestion() {
      if (this.questions.length > 0) {
        const randomIndex = Math.floor(Math.random() * this.questions.length);
        this.currentQuestion = this.questions[randomIndex];
        this.startTimer();
      } else {
        console.error("ingen spørgsmål fundet");
        this.currentQuestion = null;
      }
    },

    getPercentage(optionNumber) {
      const total =
        this.currentQuestion.option1Count +
        this.currentQuestion.option2Count +
        this.currentQuestion.option3Count;
      if (total === 0) return 0; // Undgå division med nul
      if (optionNumber === 1)
        return ((this.currentQuestion.option1Count / total) * 100).toFixed(2);
      if (optionNumber === 2)
        return ((this.currentQuestion.option2Count / total) * 100).toFixed(2);
      if (optionNumber === 3)
        return ((this.currentQuestion.option3Count / total) * 100).toFixed(2);
    },

    getBarColor(index) {
      const colors = ["#4CAF50", "#2196F3", "#FFC107"]; // Eksempel på farver: Grøn, Blå, Gul
      return colors[index % colors.length];
    },

    submitAnswer(option) {
      clearInterval(this.timer);
      const question = this.currentQuestion;
      console.log("Submitting answer for question:", this.currentQuestion);
      axios
        .post(
          `${baseURL}/SubmitAnswer`,
          {
            QuestionId: this.currentQuestion.questionId,
            Option: option,
          },
          {
            headers: {
              "Content-Type": "application/json",
            },
          }
        )
        .then((response) => {
          console.log("Answer submitted successfully:", response.data);
          this.currentQuestion.option1Count = response.data.option1Count;
          this.currentQuestion.option2Count = response.data.option2Count;
          this.currentQuestion.option3Count = response.data.option3Count;
          this.viewState = "statistics"; // Skift visning til statistik
          console.log("ViewState changed to:", this.viewState);
          this.questionCount += 1; // Øg spørgsmålstælleren
          if (this.questionCount >= 10) {
            this.resetToLanguageSelection();
          }
        })
        .catch((error) => {
          console.error("Error submitting the answer:", error);
        });
    },

    resetToLanguageSelection() {
      this.selectedLanguage = null; // Nulstil valgte sprog til starttilstand
      this.questionCount = 0; // Nulstil tælleren for spørgsmål
      this.resetInactivityTimer(); // Genstart inaktivitetstimer
    },
    resetInactivityTimer() {
      clearTimeout(this.inactivityTimer);
      this.inactivityTimer = setTimeout(() => {
        this.resetToLanguageSelection(); // flyt brugeren til sprogvalg
      }, 60000); // 1 minut uden aktivitet
    },
  },
  watch: {
    selectedLanguage: function () {
      this.getRandomQuestion();
    },
  },

  mounted() {
    this.resetInactivityTimer();
    ["click", "touchstart", "keydown"].forEach((event) => {
      window.addEventListener(event, this.resetInactivityTimer);
    });
  },
  beforeDestroy() {
    clearTimeout(this.inactivityTimer);
    ["click", "touchstart", "keydown"].forEach((event) => {
      window.removeEventListener(event, this.resetInactivityTimer);
    });
  },
});
