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

    getRandomQuestion() {
      // Hvis der er spørgsmål, så vælg et tilfældigt spørgsmål
      if (this.questions.length > 0) {
        // Vælg et tilfældigt spørgsmål
        const randomIndex = Math.floor(Math.random() * this.questions.length);
        // Returner hele spørgsmålsobjektet
        this.currentQuestion = this.questions[randomIndex];
      }
    },

    submitAnswer(option) {
        const question = this.currentQuestion;
        axios
          .post(`${baseURL}/SubmitAnswer`, {
            QuestionId: question.QuestionId,
            Option: option,
          })
          .then((response) => {
            this.getRandomQuestion();
          })
          .catch((error) => {
            console.error("Error submitting the answer:", error);
          });
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

    fetchStatistics() {
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
    },

  },
  watch: {
    selectedLanguage: function() {
      this.getRandomQuestion();
    },
  },
});
