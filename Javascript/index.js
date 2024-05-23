const baseURL = "https://restopinionpoll.azurewebsites.net/api/Questions";
const translateURL = "https://api.cognitive.microsofttranslator.com/translate";
const apiKey = "f324a4c180e34f6b9aa306b7b8755d1c";
const region = "GLOBAL";

new Vue({
  el: "#app",
  data: {
    selectedLanguage: null,
    languageOptions: [
      { name: "Dansk", flag: "../images/denmark.png" },
      { name: "English", flag: "../images/uk.png" },
      { name: "Français", flag: "../images/france.png" },
    ],
    questions: [],
    currentQuestion: null,
    viewState: "start",
    answered: false,
    stats: [],
    timer: null,
    remainingTime: 30, //30 sekunders timer
    translatedTexts: {
      questionTitle: "Spørgsmål",
      statsTitle: "Statistik",
      nextButton: "Næste",
      thankYouTitle: "Tak for din besvarelse!",
      restartButton: "Start forfra",
    },
    questionCount: 0,
  },
  methods: {
    startSurvey() {
      this.viewState = "languageSelection"; // Skifter til sprogvalgsvisning
    },

    setLanguage(languageIndex) {
      this.selectedLanguage = languageIndex; // Opdater valgte sprog
      this.fetchQuestions(); // Hent spørgsmål fra API
      this.viewState = "question"; // Skift visning til spørgsmål
      if (languageIndex !== 0) {
        // Hvis brugeren ikke har valgt Dansk
        this.translateStaticTexts(); // Oversæt statiske tekster
      } else {
        this.translatedTexts = {
          // Hvis brugeren har valgt Dansk, brug de danske tekster
          questionTitle: "Spørgsmål",
          statsTitle: "Statistik",
          nextButton: "Næste",
          thankYouTitle: "Tak for din besvarelse!",
          restartButton: "Start forfra",
        };
      }
    },

    startTimer() {
      this.remainingTime = 30; // Reset timer til 20 sekunder
      this.timerWidth = 100; // Reset loadbaren til fuld bredde
      if (this.timer) {
        // Hvis der allerede er en timer, stop den
        clearTimeout(this.timer);
      }
      this.timer = setInterval(() => {
        // Start en ny timer
        if (this.remainingTime > 0) {
          this.remainingTime -= 1; // Tæl ned
          this.timerWidth = (this.remainingTime / 30) * 100; // Opdaterer loadbar baseret på den tilbageværende tid
        } else {
          this.timeIsUp(); // Hvis tiden er gået, kald funktionen timeIsUp
        }
      }, 1000);
    },

    timeIsUp() {
      console.log("Time is up! Moving to next question.");
      clearInterval(this.timer); // Stop the timer
      this.getRandomQuestion(); // Henter nyt spørgsmål
    },

    loadNextQuestion() {
      // Funktion til at skifte til næste spørgsmål
      if (this.questions.length > 0) {
        // Hvis der er flere spørgsmål tilbage
        this.getRandomQuestion();
        this.viewState = "question"; // Skift tilbage til spørgsmålsvisningen
        this.startTimer(); // Genstart timeren for det nye spørgsmål
      } else {
        console.log("Ingen flere spørgsmål tilgængelige.");
      }
    },

    fetchQuestions() {
      axios
        .get(`${baseURL}/GetActiveQuestions`) // Hent aktive spørgsmål fra API
        .then((response) => {
          // Håndter svar fra API
          this.questions = response.data; // Gem spørgsmålene i data
          if (this.selectedLanguage !== 0) {
            // Hvis brugeren ikke har valgt Dansk
            this.translateQuestions(); // Oversæt spørgsmålene
          } else {
            this.getRandomQuestion(); // Hvis brugeren har valgt Dansk, hent et tilfældigt spørgsmål
          }
        })
        .catch((error) => {
          console.error("Error fetching questions:", error);
        });
    },

    translateQuestions() {
      const targetLanguage = this.selectedLanguage === 1 ? "en" : "fr"; // Bestem målsproget baseret på brugerens valg
      const translationPromises = this.questions.map((question) => {
        // Oversæt hver tekst i hvert spørgsmål
        return Promise.all([
          // Vent på at alle oversættelser er færdige
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
          // Oversæt teksten for hver nøgle
          this.translatedTexts[key] = translatedText; // Opdater den oversatte tekst
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
          return text; // Returner original tekst hvis der opstår en fejl
        });
    },

    getRandomQuestion() {
      if (this.questions.length > 0) {
        const randomIndex = Math.floor(Math.random() * this.questions.length); // Vælg et tilfældigt spørgsmål
        this.currentQuestion = this.questions[randomIndex]; // Gem det valgte spørgsmål
        this.startTimer(); // Start timeren for spørgsmålet
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
        return ((this.currentQuestion.option1Count / total) * 100).toFixed(2); // Afrund til to decimaler
      if (optionNumber === 2)
        return ((this.currentQuestion.option2Count / total) * 100).toFixed(2);
      if (optionNumber === 3)
        return ((this.currentQuestion.option3Count / total) * 100).toFixed(2);
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
            this.viewState = "thankYou";
            // this.resetToLanguageSelection();
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
        window.location.reload(); // Genindlæser siden for at starte forfra
      }, 120000); // 2 minut uden aktivitet
    },

    restart() {
      window.location.reload(); // Genindlæser siden for at starte forfra
    },
  },
  watch: {
    selectedLanguage: function () {
      // Lyt efter ændringer i valgt sprog
      this.getRandomQuestion(); // Hent et tilfældigt spørgsmål
    },
  },

  mounted() {
    this.resetInactivityTimer(); // Start inaktivitetstimer
    ["click", "touchstart", "keydown"].forEach((event) => {
      // Lyt efter klik, touchstart og keydown
      window.addEventListener(event, this.resetInactivityTimer); // Genstart inaktivitetstimer
    });
  },
  beforeDestroy() {
    clearTimeout(this.inactivityTimer); // Ryd op i inaktivitetstimer
    this.viewState = "null"; // Nulstil visningstilstand
    ["click", "touchstart", "keydown"].forEach((event) => {
      // Fjern lytteren for klik, touchstart og keydown
      window.removeEventListener(event, this.resetInactivityTimer); // Fjern inaktivitetstimer
    });
  },
});
