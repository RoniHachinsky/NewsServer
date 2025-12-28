class NewsDashboard {
    constructor() {
        this.stats = {
            dailyVisits: 0,
            newsDownloads: 0,
            newsRead: 0,
            newsSaved: 0,
            newsLiked: 0,
            newsShared: 0,
            newsOffensived: 0,
            onlineUsers: 0,
            totalLogins: 0,
            // activities
            downloadsData: [],
            readData: [],
            savedData: [],
            likedData: [],
            sharedData: [],
            offensivedData: [],
        };
        this.charts = {};
        this.activityDates = []; 
        this.activityFromDateIndex = 0; 
        this.activityToDateIndex = 10; // last 10 days
        this.init();
    }

    async init() {
        this.bindEvents();
        await this.loadStatistics();
        this.initCharts();
        this.startAutoRefresh();
    }


    bindEvents() {
        $('#refreshBtn').on('click', () => {
            this.refreshData();
        });
        $('#newsActivityPrev').on('click', () => {
            this.activityPrevDay();
        });
        $('#newsActivityNext').on('click', () => {
            this.activityNextDay();
        });
        $('#usersActivityPrev').on('click', () => {
            this.activityPrevDay();
        });
        $('#usersActivityNext').on('click', () => {
            this.activityNextDay();
        });
    }

    updateDisplay() {
        this.animateNumbers();
        if (Object.keys(this.charts).length > 0) {
            this.updateCharts();
        }
        this.updateProgressRings();
    }

    animateNumbers() {
        animateStatisticNumbers(this.stats);
    }

    initCharts() {
        const labels = Array(10).fill('');
        // Activity Overview Chart with REAL DATA
        const newsActivityCtx = document.getElementById('newsActivityChart').getContext('2d');
        this.charts.newsActivity = new Chart(newsActivityCtx, {
            type: 'line',
            data: {
                labels: labels, // Dynamic labels
                datasets: [
                    {
                        label: 'Downloads',
                        data: this.stats.downloadsData.map(item => item.count),
                        borderColor: '#28a745',
                        backgroundColor: 'rgba(40, 167, 69, 0.1)',
                        tension: 0.4,
                        fill: true
                    },
                    {
                        label: 'Reads',
                        data: this.stats.readData.map(item => item.count),
                        borderColor: '#17a2b8',
                        backgroundColor: 'rgba(23, 162, 184, 0.1)',
                        tension: 0.4,
                        fill: true
                    },
                    {
                        label: 'Saves',
                        data: this.stats.savedData.map(item => item.count),
                        borderColor: '#ffc107',
                        backgroundColor: 'rgba(255, 193, 7, 0.1)',
                        tension: 0.4,
                        fill: true
                    },
                ]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: {
                        position: 'top',
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true
                    }
                }
            }
        });

        const usersActivityCtx = document.getElementById('usersActivityChart').getContext('2d');
        this.charts.usersActivity = new Chart(usersActivityCtx, {
            type: 'line',
            data: {
                labels: labels, // Dynamic labels
                datasets: [
                    {
                        label: 'Likes',
                        data: this.stats.likedData.map(item => item.count),
                        borderColor: '#d63813',
                        backgroundColor: 'rgba(220, 53, 69, 0.1)',
                        tension: 0.4,
                        fill: true
                    },
                    {
                        label: 'Shares',
                        data: this.stats.sharedData.map(item => item.count),
                        borderColor: '#6f42c1',
                        backgroundColor: 'rgba(111, 66, 193, 0.1)',
                        tension: 0.4,
                        fill: true
                    },
                    {
                        label: 'Offensive Reports',
                        data: this.stats.offensivedData.map(item => item.count),
                        borderColor: '#fd7e14',
                        backgroundColor: 'rgba(253, 126, 20, 0.1)',
                        tension: 0.4,
                        fill: true
                    }
                ]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: {
                        position: 'top',
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true
                    }
                }
            }
        });

        // Engagement Pie Chart - ALL ACTIVITIES
        const engagementCtx = document.getElementById('engagementChart').getContext('2d');
        this.charts.engagement = new Chart(engagementCtx, {
            type: 'doughnut',
            data: {
                labels: ['Downloads', 'Reads', 'Saves', 'Likes', 'Shares', 'Offensive Reports'],
                datasets: [{
                    data: [0, 0, 0, 0, 0, 0], // Will be updated in updateCharts()
                    backgroundColor: [
                        '#28a745', // Downloads - Green
                        '#17a2b8', // Reads - Blue
                        '#ffc107', // Saves - Yellow
                        '#d63813', // Likes - Red
                        '#6f42c1', // Shares - Purple
                        '#fd7e14'  // Offensive - Orange
                    ],
                    borderWidth: 0
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: {
                        position: 'bottom',
                    }
                }
            }
        });
        // Initialize charts with real data
        this.updateCharts();
    }

    updateCharts() {
        // Calculate totals from daily data arrays
        const totalDownloads = this.stats.newsDownloads || 0;
        const totalReads = this.stats.newsRead || 0;
        const totalSaves = this.stats.newsSaved || 0;
        const totalLikes = this.stats.newsLiked || 0;
        const totalShares = this.stats.newsShared || 0;
        const totalOffensive = this.stats.newsOffensived || 0;

        // Update engagement pie chart with ALL activities
        if (this.charts.engagement?.data) {
            this.charts.engagement.data.datasets[0].data = [
                totalDownloads,
                totalReads,
                totalSaves,
                totalLikes,
                totalShares,
                totalOffensive
            ];
            this.charts.engagement.update();
        }

        // Update activity line chart if data changes
        if (this.charts.newsActivity?.data) {
            // Step 1: Find the longest data array to determine full date range
            const allDataArrays = [
                this.stats.downloadsData,
                this.stats.readData,
                this.stats.savedData,
                this.stats.likedData,
                this.stats.sharedData,
                this.stats.offensivedData
            ];

            // Filter out any undefined or null datasets
            const filteredDataArrays = allDataArrays.filter(arr => arr && arr.length);

            if (filteredDataArrays.length === 0) return; // no data to process

            // Find the min and max dates across all datasets
            const allDates = filteredDataArrays.flatMap(arr => arr.map(item => new Date(item.day)));
            const minDate = new Date(Math.min(...allDates));
            const maxDate = new Date(Math.max(...allDates));

            // Generate all dates in the range as "YYYY-MM-DD"
            this.activityDates.length = 0;
            const dateMap = {};
            const currentDate = new Date(minDate);
            while (currentDate <= maxDate) {
                const isoDate = currentDate.toISOString().slice(0, 10); // 'YYYY-MM-DD'
                dateMap[isoDate] = true; // to check existence
                currentDate.setDate(currentDate.getDate() + 1);
                this.activityDates.push(isoDate);
            }

            const currentActivityDates = this.activityDates.reverse().slice(this.activityFromDateIndex, this.activityToDateIndex);
            currentActivityDates.reverse();

            $('#newsActivityPrev').prop('disabled', this.activityToDateIndex >= this.activityDates.length);
            $('#newsActivityNext').prop('disabled', this.activityFromDateIndex <= 0);
            $('#usersActivityPrev').prop('disabled', this.activityToDateIndex >= this.activityDates.length);
            $('#usersActivityNext').prop('disabled', this.activityFromDateIndex <= 0);

            // Helper to create a date-to-count map for each dataset
            const createDataMap = (dataset) => {
                const map = {};
                if (dataset) {
                    dataset.forEach(item => {
                        map[item.day] = item.count;
                    });
                }
                return map;
            };

            // Create maps for all datasets
            const downloadMap = createDataMap(this.stats.downloadsData);
            const readMap = createDataMap(this.stats.readData);
            const savedMap = createDataMap(this.stats.savedData);
            const likedMap = createDataMap(this.stats.likedData);
            const sharedMap = createDataMap(this.stats.sharedData);
            const offensivedMap = createDataMap(this.stats.offensivedData);

            // Fill labels and dataset data
            this.charts.newsActivity.data.labels = currentActivityDates.map(date => shortDate(date));
            this.charts.newsActivity.data.datasets[0].data = currentActivityDates.map(date => downloadMap[date] || 0);
            this.charts.newsActivity.data.datasets[1].data = currentActivityDates.map(date => readMap[date] || 0);
            this.charts.newsActivity.data.datasets[2].data = currentActivityDates.map(date => savedMap[date] || 0);

            this.charts.usersActivity.data.labels = currentActivityDates.map(date => shortDate(date));
            this.charts.usersActivity.data.datasets[0].data = currentActivityDates.map(date => likedMap[date] || 0);
            this.charts.usersActivity.data.datasets[1].data = currentActivityDates.map(date => sharedMap[date] || 0);
            this.charts.usersActivity.data.datasets[2].data = currentActivityDates.map(date => offensivedMap[date] || 0);

            this.charts.newsActivity.update();
            this.charts.usersActivity.update();
        }
    }

    activityPrevDay() {
        if (this.activityToDateIndex < this.activityDates.length) {
            this.activityFromDateIndex++;
            this.activityToDateIndex++;
            this.updateCharts();
        }        
    }
    activityNextDay() {
        if (this.activityFromDateIndex > 0) {
            this.activityFromDateIndex--;
            this.activityToDateIndex--;
            this.updateCharts();
        }
    }

    updateProgressRings() {
        const maxUsers = Math.max(this.stats.totalUsers, 1);
        const maxOnline = Math.max(this.stats.totalLogins, 1);
        const onlinePercentage = (this.stats.onlineUsers / maxUsers) * 100;
        const dailyVisitsPercentage = (this.stats.dailyVisits / maxOnline) * 100

        this.setProgress('#onlineProgress', onlinePercentage);
        this.setProgress('#dailyVisitsProgress', dailyVisitsPercentage);
    }

    setProgress(selector, percentage) {
        const circle = document.querySelector(selector);
        const circumference = 283;
        const offset = circumference - (percentage / 100) * circumference;
        circle.style.strokeDashoffset = offset;
    }

    refreshData() {
        const btn = $('#refreshBtn');
        const icon = btn.find('i');

        btn.addClass('loading');
        icon.addClass('pulse');
        // Data refresh
        this.loadStatistics();

        btn.removeClass('loading');
        icon.removeClass('pulse');
    }

    startAutoRefresh() {
        // Auto refresh every 5 minutes
        setInterval(() => {
            this.refreshData();
        }, 300000);
    }

    // Method to integrate with your actual data loading function
    async loadStatistics() {
        try {
            const stats = await firebaseApi.loadStatistics();
            if (stats) {
                this.stats = stats;
                this.updateDisplay();
            }
        } catch (error) {
            console.error('Error loading statistics:', error);
        }
    }
}
