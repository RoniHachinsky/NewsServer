
const NEWS_API_KEYS = [
    'cd670fe93822465eb1f5af96d53b71ae',
    '7f7fb2666a024c2bb627872a18ec0fdd',
    '03a3def851b24e508ea09e787969dda1',
    'afca63c19c614084abc9d28df81cc1e6',
    'd0be66e58f7a4eef80a34cd7cb58fb96',
    '25751bd9eed245eba820da1b2a4f1cc6',
    'aeccab6abda3489fb2831a803a4e3205',
    '87f758169e5f4af49203f9e16372f233',
    '15a3f0ddb68242ff8582319cdfb06d9f',
    '626902b8f5144aea81c52bc179dd7272',
]
const NEWS_API_URL = 'https://newsapi.org/v2/';
const NEWS_API_DEFAULT_COUNTRY = 'us';
const NEWS_API_DEFAULT_PAGE_SIZE = 20;
const NEWS_API_DEFAULT_SORT_BY = 'publishedAt';

// News search sort by options
const NEWS_SORT_BY_RELEVANCY = 'relevancy';//articles more closely related to q come first.
const NEWS_SORT_BY_POPULARITY = 'popularity';//articles from popular sources and publishers come first.
const NEWS_SORT_BY_PUBLISHEDAT = 'publishedAt';//publishedAt = newest articles come first.


// News API endpoints
const NEWS_EVERYTHING_PATH = `${NEWS_API_URL}everything?q={q}&apiKey={apiKey}&pageSize={pageSize}&page={page}&sortBy={sortBy}&from={from}&to={to}`;
const NEWS_TOP_HEADLINES_PATH = `${NEWS_API_URL}top-headlines?apiKey={apiKey}&pageSize={pageSize}&page={page}&country=${NEWS_API_DEFAULT_COUNTRY}`;
const NEWS_TOP_HEADLINES_BY_CATEGORY_PATH = `${NEWS_API_URL}top-headlines?category={category}&q={q}&apiKey={apiKey}&pageSize={pageSize}&page={page}&country=${NEWS_API_DEFAULT_COUNTRY}`;
const NEWS_SOURCES_PATH = `${NEWS_API_URL}top-headlines/sources?apiKey={apiKey}`;

// For all categories
const NEWS_API_CATEGORIES = {
    general: 'General',
    technology: 'Technology',
    sports: 'Sports',
    entertainment: 'Entertainment',
    business: 'Business',
    health: 'Health',
    science: 'Science', 
}

// For categories in the right side of the home page
const TOP_CATEGORIES = {
    sports: 'Sports',
    entertainment: 'Entertainment',
    technology: 'Technology'
}

async function getNews(filter) {
    try {
        let url;
        const pageSize = filter.pageSize || NEWS_API_DEFAULT_PAGE_SIZE;
        const q = filter.q ? encodeURIComponent(filter.q) : '';
        const page = filter.page || 1;
        const sortBy = filter.sortBy || NEWS_API_DEFAULT_SORT_BY;
        const from = filter.from || '';
        const to = filter.to || '';

        if (filter.isSources)
            // get sources list
            url = NEWS_SOURCES_PATH;
        else if (filter.isEverything) {
            // Search everything
            url = NEWS_EVERYTHING_PATH.replace('{q}', q)
                .replace('{page}', page).replace('{pageSize}', pageSize).replace('{sortBy}', sortBy)
                .replace('{from}', from).replace('{to}', to);
        } else if (filter.isTopHeadlines) {
            // Top headlines (all categories)
            url = NEWS_TOP_HEADLINES_PATH.replace('{page}', page).replace('{pageSize}', pageSize);
        } else {
            // Top headlines by specific category
            url = NEWS_TOP_HEADLINES_BY_CATEGORY_PATH.replace('{q}', q)
                .replace('{page}', page).replace('{category}', filter.category).replace('{pageSize}', pageSize);
        }
        let keyTries = 0;
        let currentUseAPIKeyIndex = localStorage.getItem('news_currentUseAPIKeyIndex') || 0
        while (keyTries < NEWS_API_KEYS.length) {
            const newsUrl = url.replace('{apiKey}', NEWS_API_KEYS[currentUseAPIKeyIndex]);

            // Use proxy url for pretending like the request is from localhost (because of the use of free news api account)
            const proxyUrl = `https://corsproxy.io/?${encodeURIComponent(newsUrl)}`;

            const response = await fetch(proxyUrl);
            // Convert the response to a JSON object
            const proxyData = await response.json();

            if (proxyData) {
                const data = proxyData;
                if (data.status === 'ok') {
                    localStorage.setItem('news_currentUseAPIKeyIndex', currentUseAPIKeyIndex);
                    return data;
                } else {
                    if (data.code == 'rateLimited') { // Free account allows only 100 requests per day
                        if (currentUseAPIKeyIndex == NEWS_API_KEYS.length - 1)
                            currentUseAPIKeyIndex = 0;
                        else
                            currentUseAPIKeyIndex++;
                        keyTries++;
                    }
                    else {
                        console.error('Failed to fetch news', data);
                        return null;
                    }
                }
            }
            else {
                return null;
            }
        }
        
    } catch (error) {
        console.error('News API Error:', error);
        return null;
    }
}

