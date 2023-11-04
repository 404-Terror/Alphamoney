
new Vue({
    el: '#app',
    data() {
        return {
            question: '',
            answers: []
        };
    },
    methods: {
        async askQuestion() {
            const res = await fetch("/api/chat", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ action: this.question, username: window.localStorage.getItem('username') }),
            });
            const { answer } = await res.json();
            // console.log(answer)
            this.answers.push(answer);
            this.question = '';
        }
    }
});

