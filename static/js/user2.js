const app = new Vue({
    el: '#user2',
    data: {
        user: null,
        isAuthenticated: false,
    },
    methods: {
        async getBudgetingDetails(credentialId) {
            try {
                const response = await fetch('/api/budgeting', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        credentialId,
                    }),
                });
                if (response.ok) {
                    const res = await response.json();
                    console.log(res);
                    this.user = { res };
                    this.isAuthenticated = true;
                } else {
                    console.error(response.statusText);
                }
            } catch (error) {
                console.error('Failed to fetch user info:', error);
            }
        },
        async logout() {
            try {
                this.user = null;
                this.isAuthenticated = false;
                const response = await fetch('/api/logout', { method: 'POST' });
                if (response.status === 200) {
                    window.localStorage.setItem("isAuth", false);
                    window.localStorage.removeItem('username');
                    window.location.replace('/');
                } else {
                    console.error('Logout failed:', response.statusText);
                }
            } catch (error) {
                console.error('Failed to logout:', error);
            }
        },
    },
    async mounted() {
        try {
            const credentialId = window.localStorage.getItem('username');
            if (credentialId) {
                await this.getBudgetingDetails(credentialId);
            } else {
                console.log('User not authenticated');
            }
        } catch (error) {
            console.error('Failed to fetch user info on mount:', error);
        }

    },
});

