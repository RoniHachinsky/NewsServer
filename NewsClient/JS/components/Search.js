const SEARCH_RESULTS_DEFAULT_PAGE_SIZE = 50;

const searchPaginationObj = {
    currentPage: 1,
    isLoading: false,
    hasMoreResults: true,
    globalSearchQuery: '',
    savedArticleSearchQuery: '',
    sortBy: '',
    period: 30, // 30 days
    totalResults: 0,
    resultsPerPage: NEWS_API_DEFAULT_PAGE_SIZE,
}

function initSearchPaginationObj(searchQuery, sortBy, isSavedArticleSearch = false, period = 30) {
    searchPaginationObj.currentPage = 1;
    searchPaginationObj.resultsPerPage = isSavedArticleSearch ? SEARCH_RESULTS_DEFAULT_PAGE_SIZE : NEWS_API_DEFAULT_PAGE_SIZE;
    searchPaginationObj.isLoading = false;
    searchPaginationObj.hasMoreResults = true;
    searchPaginationObj.globalSearchQuery = searchQuery;
    searchPaginationObj.sortBy = sortBy;
    searchPaginationObj.period = period;
    if (isSavedArticleSearch)
        searchPaginationObj.savedArticleSearchQuery = searchQuery;
    else
        searchPaginationObj.globalSearchQuery = searchQuery;
    searchPaginationObj.totalResults = 0;
}

// Show loading spinner
function showLoadingSpinner() {
    $('#loadingSpinner').show();
}

// Hide loading spinner
function hideLoadingSpinner() {
    $('#loadingSpinner').hide();
}

function showNoMoreResults() {
    $('#noMoreResults').show();
}

function hideNoMoreResults() {
    $('#noMoreResults').hide();
}

// Infinite scroll implementation for search page
function setupSearchInfiniteScroll(offsetTop, onLoadMoreResult) {
    // Cancel the previous scroll event before adding it
    $(window).off('scroll').on('scroll', function () {
        if (searchPaginationObj.isLoading || !searchPaginationObj.hasMoreResults) return;

        const scrollTop = $(window).scrollTop();
        // windowHeight - visible view
        const windowHeight = $(window).height();
        // documentHeight - all of the view (visible or unvisible)
        const documentHeight = $(document).height();

        // Trigger load more when the user gets to the footer's height (offsetTop from bottom)
        if (scrollTop + windowHeight >= documentHeight - offsetTop) {
            onLoadMoreResult();
        }
    });
}

async function loadMoreNewsArticlesResults(filter, onRenderArticles) {
    if (searchPaginationObj.isLoading || !searchPaginationObj.hasMoreResults) return;
    searchPaginationObj.isLoading = true;
    searchPaginationObj.currentPage++;
    showLoadingSpinner();
    
    const data = await getNews({ ...filter, page: searchPaginationObj.currentPage, pageSize: searchPaginationObj.resultsPerPage });
    if (data && data.articles && data.articles.length) {
        searchPaginationObj.hasMoreResults = searchPaginationObj.currentPage * searchPaginationObj.resultsPerPage < searchPaginationObj.totalResults;
        const articles = data.articles.map(article => expandArticle(article, null));
        onRenderArticles({ totalResults: data.totalResults, articles });
    }
    else {
        searchPaginationObj.hasMoreResults = false;
    }
    searchPaginationObj.isLoading = false;
    hideLoadingSpinner();
    if (!searchPaginationObj.hasMoreResults)
        showNoMoreResults();
}
