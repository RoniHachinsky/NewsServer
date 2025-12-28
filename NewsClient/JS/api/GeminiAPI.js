const GEMINI_API_KEYS = [
    'AIzaSyByswFJIBRxruOVAWLF2KThYZAQlq45sho',
    'AIzaSyALyVU9oSzaaKQnnBEOaI67ZM1jnm6wXs8',
    'AIzaSyApMpykt61baAs7hxMIi5H2BIuqMEWBJdw',
    'AIzaSyCjSEbe04DBag13yCrXnTHqDmAAUKo3ii4'
];

// AI question codes
const AI_QUESTION_STATISTICS = 1;
const AI_QUESTION_RELATED = 2
const AI_QUESTION_LOCATION = 3;
const AI_QUESTION_SUMMARY = 4;
const AI_QUESTION_POSITION_ANALYSIS = 5;
const AI_QUESTION_CREDIBILITY = 6;

// AI question list including prompts
// Use title for loading and use header for showing results
const AI_QUESTIONS = [
    { id: AI_QUESTION_STATISTICS, title: 'Calculate statistics...', q: 'Assess the words count and reading time of this article content and credibility ratio according to the sources of this article and return JUST words with a "|" seperator like 1000|7|7.3: "{content}"', header: 'Calculate statistics' },
    { id: AI_QUESTION_RELATED, title: 'Find related articles...', q: 'Identify the 3 most significant keywords from this article that best represents its main topic and is most suitable for searching related articles and return just words with a | seperator: "{content}"', header: 'Related articles' },
    { id: AI_QUESTION_LOCATION, title: 'Find locations mentioned...', q: 'Identify all location names (cities, countries, landmarks, etc.) mentioned in the following article and return just words with a | seperator. If you didn\'t find it, just return a |: "{content}"', header: 'Locations Mentioned' },
    { id: AI_QUESTION_SUMMARY, title: 'summarizing the article content...', q: 'summarize this article contenet: "{content}"', header: 'Summary of the article' },
    { id: AI_QUESTION_POSITION_ANALYSIS, title: 'Perform a position analysis...', q: 'Perform a position analysis(positive / negative) for the article and phrase the answer for news readers: "{content}"', header: 'A positive or third opinion on the article' },
    { id: AI_QUESTION_CREDIBILITY, title: 'Assess the credibility/bias...', q: 'Is this article credible and unbiased? Provide a brief analysis and phrase the answer for news readers: "{content}"', header: 'Credibility & Bias Analysis' },
];

class GeminiAPI {
    constructor() {
        // Endpoint for the gemini AI api
        this.baseUrl = 'https://generativelanguage.googleapis.com/v1beta/models';
        // Gemini AI model
        this.model = 'gemini-2.5-flash';
    }

    // Equivalent to getGenerativeModel + generateContent
    async generateContent(prompt) {

        const requestBody = {
            contents: [{
                parts: [{
                    text: prompt
                }]
            }]
        };

        try {

            let keyTries = 0;
            let currentUseAPIKeyIndex = localStorage.getItem('ai_currentUseAPIKeyIndex') || 0
            while (keyTries < GEMINI_API_KEYS.length) {

                const url = `${this.baseUrl}/${this.model}:generateContent?key=${GEMINI_API_KEYS[currentUseAPIKeyIndex]}`;
                // Send request to gemini AI
                const response = await fetch(url, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(requestBody)
                });
                if (response.ok) {
                    // Response success
                    localStorage.setItem('ai_currentUseAPIKeyIndex', currentUseAPIKeyIndex);
                    const data = await response.json();

                    // Return in Firebase AI Logic format
                    return {
                        response: {
                            text: () => data.candidates[0].content.parts[0].text,
                            candidates: data.candidates,
                            usageMetadata: data.usageMetadata
                        }
                    };
                }
                else {
                    // Response error                    
                    if (response.status == 429) { // You exceeded your current quota
                        if (currentUseAPIKeyIndex == GEMINI_API_KEYS.length - 1)
                            currentUseAPIKeyIndex = 0;
                        else
                            currentUseAPIKeyIndex++;
                        keyTries++;
                    }
                    else {
                        const errorData = await response.json();
                        console.error(`API Error: ${response.status} - ${errorData.error?.message || 'Unknown error'}`);
                        return null;
                    }
                }
            }
        } catch (error) {
            console.error('Gemini API Error:', error);
            throw error;
        }
    }
}

const AI_API = new GeminiAPI();
const AI_API_ENABLED = true;

async function runAI(prompt) {
    if (!AI_API_ENABLED) return '';
    try {
        const result = await AI_API.generateContent(prompt);
        return result.response.text();
    } catch (error) {
        console.error('Generation error:', error);
    }
}

async function proccessArticleAI(article) {
    const articleAIContainer = $('#articleAIContainer');
    const articleAIHeader = $('#articleAIHeader');
    const articleAIHeaderSpinner = $('#articleAIHeaderSpinner').show();
    articleAIContainer.empty();
    articleAIHeader.empty();

    for (let i = 0; i < AI_QUESTIONS.length; i++) {
        // Checks whether the user has navigated to another page.
        if (getActivePage() != ARTICLE_DETAILS_PAGE)
            break;
        const question = AI_QUESTIONS[i];
        articleAIHeader.text(`AI - ${question.title}`);
        const li = $('<li>').addClass('flex-column').appendTo(articleAIContainer);
        const spinner1 = $('<div/>').addClass('spinner-border').appendTo(li);
        const result = await runAI(question.q.replace('{content}', JSON.stringify(article)));

        spinner1.remove();
        const header = $('<span />').addClass('d-flex align-items-center p-1 px-3 text-white bg_orange mb-2')
            .append(createIcon('bi-stars me-2'), $('<h6/>').addClass('mt-2').text(question.header));
        if (question.id == AI_QUESTION_STATISTICS) {
            li.remove();
            $('#wordsLoader').hide();
            $('#readTimeLoader').hide();
            $('#reliabilityLoader').hide();
            if (result) {
                const resultSplited = result.split('|');
                if (resultSplited.length > 0) {
                    $('#wordsCounter').text(parseFloat(resultSplited[0]).toLocaleString()).show();
                }
                if (resultSplited.length > 1) {
                    $('#readTimeCounter').text(resultSplited[1]).show();
                }
                if (resultSplited.length > 2) {
                    const reliabilityRatio = parseFloat(resultSplited[2]);

                    if (reliabilityRatio < 6)
                        $('#reliabilityIcon').toggleClass('bi-hand-thumbs-up bi-hand-thumbs-down');
                    $('#reliabilityRatio').text(reliabilityRatio).show();
                }
            }
        }
        else if (question.id == AI_QUESTION_RELATED) {
            li.remove();
            if (result) {
                const keyWords = result.split('|').map(keyword => `(${keyword.trim()})`).join(' AND ');
                fillRelatedArticles(keyWords);
            }
        }
        else if (question.id == AI_QUESTION_LOCATION) {// Add location with map
            li.remove();
            if (result && result != '|') {
                $('#articleMapLoader').hide();
                $('#articleMap').show();
                // Encode the location keywords
                const query = encodeURIComponent(result);
                // Set the src attribute
                $('#articleMap').attr('src', `https://www.google.com/maps?q=${query}&output=embed`);
            }
            else {
                $('#articleMapHeader').text('No locations mentioned');
                aiAnimation.stop();
            }
        }
        else {
            li.append(header)
            li.append($('<p/>').html(convertTextToHTMLBootstrap(result)));
        }
    }
    articleAIHeader.text('AI Results');
    articleAIHeaderSpinner.hide();
}