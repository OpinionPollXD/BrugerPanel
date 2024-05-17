const baseURL = "https://restopinionpoll.azurewebsites.net/api/Questions";

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
  },
  methods: {
    setLanguage(languageIndex) {
      // Simulere valg af sprog, men gem kun indeks
      this.selectedLanguage = languageIndex;
      this.fetchQuestions();
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
          this.getRandomQuestion();
        })
        .catch((error) => {
          console.error("Error fetching questions:", error);
        });
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
          //<this.getRandomQuestion();
          this.currentQuestion.option1Count = response.data.option1Count;
          this.currentQuestion.option2Count = response.data.option2Count;
          this.currentQuestion.option3Count = response.data.option3Count;
          this.viewState = "statistics"; // Skift visning til statistik
          console.log("ViewState changed to:", this.viewState);
        })
        .catch((error) => {
          console.error("Error submitting the answer:", error);
        });
    },
  },
  watch: {
    selectedLanguage: function () {
      this.getRandomQuestion();
    },
  },
});
