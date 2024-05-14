const baseURL = 'https://restopinionpoll.azurewebsites.net/api/Questions';

new Vue({
  el: '#app',
  data: {
    selectedLanguage: null,
    languageOptions: ['Dansk', 'English', 'Français'],
    questions: [],
    selectedQuestion: null,
    answered: false,
    stats: []
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
          return this.questions[randomIndex];
        }
        return null;
      },
    
    fetchQuestions() {
      // Hent spørgsmål uden hensyntagen til valgt sprog for øjeblikket
      axios.get(baseURL)
        .then(response => {
          this.questions = response.data;
          console.log(this.questions);
        })
        .catch(error => {
          console.error("Error fetching questions:", error);
        });
    },
    selectQuestion(question) {
      this.selectedQuestion = question;
    },
    submitAnswer(option) {
        const question = this.getRandomQuestion();
        axios.post('https://restopinionpoll.azurewebsites.net/api/SubmitAnswer', {
          questionId: question.questionId,
          option: option
        })
        .then(response => {
          this.fetchStatistics();
          this.answered = true;
        })
        .catch(error => {
          console.error("Error submitting the answer:", error);
        });
      },
    fetchStatistics() {
      axios.get(`https://restopinionpoll.azurewebsites.net/api/Statistics?questionId=${this.selectedQuestion.id}`)
        .then(response => {
          this.stats = response.data;
        })
        .catch(error => {
          console.error("Error fetching the statistics:", error);
        });
    }
  }
});
