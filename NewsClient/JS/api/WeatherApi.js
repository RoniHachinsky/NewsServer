class WeatherApi {
    constructor() {
        this.apiKey = 'e0a3fadd5db68e8ec86d27c17fec5be1';
        this.baseUrl = 'https://api.openweathermap.org/data/2.5';
        this.init();
    }

    async init() {
        try {
            // Load weather by tel aviv's coordinates (32.0853° N, 34.7818° E)
            await this.loadWeather(32.0853, 34.7818);
        } catch (error) {
            console.error('Weather widget error:', error);
        }
    }

    async loadWeather(lat, lon) {
        try {
            // Load current weather 
            const currentWeather = await this.fetchCurrentWeather(lat, lon);
            this.displayCurrentWeather(currentWeather);
        } catch (error) {
            console.error('Weather data unavailable:', error);
        }
    }

    async fetchCurrentWeather(lat, lon) {
        const response = await fetch(
            `${this.baseUrl}/weather?lat=${lat}&lon=${lon}&appid=${this.apiKey}&units=metric`
        );
        if (!response.ok) throw new Error('Weather API error');
        return response.json();
    }

    displayCurrentWeather(data) {
        const temp = Math.round(data.main.temp);
        const location = `${data.name}, ${data.sys.country}`;
        const icon = this.getWeatherIcon(data.weather[0].icon);

        document.getElementById('weatherTemp').textContent = `${temp}°C`;
        document.getElementById('weatherLocation').textContent = location;
        document.getElementById('weatherIcon').textContent = icon;
    }

    getWeatherIcon(iconCode) {
        const iconMap = {
            '01d': '☀️', '01n': '🌙',
            '02d': '⛅', '02n': '☁️',
            '03d': '☁️', '03n': '☁️',
            '04d': '☁️', '04n': '☁️',
            '09d': '🌦️', '09n': '🌧️',
            '10d': '🌦️', '10n': '🌧️',
            '11d': '⛈️', '11n': '⛈️',
            '13d': '❄️', '13n': '❄️',
            '50d': '🌫️', '50n': '🌫️'
        };
        return iconMap[iconCode] || '🌤️';
    }
}

// Initialize weather widget when page loads
function loadWeather() {
    const weatherApi = new WeatherApi();
}