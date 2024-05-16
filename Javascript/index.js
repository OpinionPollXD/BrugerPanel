const baseURL = "https://restopinionpoll.azurewebsites.net/api/Questions";

new Vue({
  el: "#app",
  data: {
    selectedLanguage: null,
    languageOptions: ["Dansk", "English", "Français"],
    questions: [],
    currentQuestion: null,
    selectedQuestion: null,
    answered: false,
    stats: [],
  },
  methods: {
    setLanguage(languageIndex) {
      // Simulere valg af sprog, men gem kun indeks
      this.selectedLanguage = languageIndex;
      this.fetchQuestions();
    },

    fetchQuestions() {
      axios
        .get(baseURL)
        .then((response) => {
          this.questions = response.data;
          this.getRandomQuestion();
        })
        .catch((error) => {
          console.error("Error fetching questions:", error);
        });
    },

    getRandomQuestion() {
      if (this.questions.length > 0) {
        const randomIndex = Math.floor(Math.random() * this.questions.length);
        this.currentQuestion = this.questions[randomIndex];
      } else {
        console.error("ingen spørgsmål fundet");
      }
    },

    submitAnswer(option) {
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
          this.getRandomQuestion();
        })
        .catch((error) => {
          console.error("Error submitting the answer:", error);
        });
    },

    /*     fetchStatistics() {
      axios
        .get(
          `https://restopinionpoll.azurewebsites.net/api/Statistics?questionId=${questionId}`
        )
        .then((response) => {
          this.stats = response.data;
        })
        .catch((error) => {
          console.error("Error fetching the statistics:", error);
        });
    }, */
  },
  watch: {
    selectedLanguage: function () {
      this.getRandomQuestion();
    },
  },
});
