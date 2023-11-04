const app = new Vue({
    el: "#app",
    data: {
        transactions: [],
        user: '65074b8001949f78beafca9c',
    },
    async mounted() {
        // Fetch data for the specified user by including the userId in the query parameter
        const url = this.userId ? `/api/transactions?userId=${ this.user }` : '/api/transactions';

        fetch(url)
            .then(response => response.json())
            .then(data => {
                this.transactions = data;
            })
            .catch(error => console.error('Error fetching data:', error));
    },
    methods: {

    },
});
