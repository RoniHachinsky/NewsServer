const topHeadlinesArticles = [];
const sideHeadlinesArticles = []; // Side carousel articals (top headlines by categories)
const bottomHeadlinesByCategoryArticles = [];
const bottomHeadlinesArticles = [];
const allArticles = [];
const REFRESH_MINUTES = 5;
let lastRefreshNewsTime = null;

async function fillHomeNews() {
    const now = new Date();

    // If the refresh time has not elapsed (5 minutes) draw the article page from cache
    if (allArticles.length > 0 && !isRefreshTimeExpired(lastRefreshNewsTime, now, REFRESH_MINUTES)) {
        renderCarousel(topHeadlinesArticles, 'topHeadlineCarousel', false);
        renderCarousel(sideHeadlinesArticles, 'topHeadlineByCategoryCarousel', true);
        renderArticles('trendingByCategoryContainer', bottomHeadlinesByCategoryArticles, false)
        renderTopNewsList(bottomHeadlinesArticles);
        return;
    }
    // clear arrays
    topHeadlinesArticles.length = 0;
    sideHeadlinesArticles.length = 0;
    bottomHeadlinesByCategoryArticles.length = 0;
    bottomHeadlinesArticles.length = 0;
    allArticles.length = 0;

    // Use Object.keys to convert an object to an array of its keys
    const categories = Object.keys(NEWS_API_CATEGORIES);
    const maxSideArticlesLength = Object.keys(TOP_CATEGORIES).length;
    const maxBottomArticlesByCategoryLength = 8;

    // Track used articles to avoid duplicates
    const usedArticleKeys = new Set();

    // Get an article that hasn't been showed yet
    function getUnusedArticle(articles, category) {
        return articles.find(article => !usedArticleKeys.has(article.articleReference) && (!category || category != article.category));
    }
    lastRefreshNewsTime = now;

    for (let idx = 0; idx < categories.length; idx++) {
        const category = categories[idx];
        const data = await getNews({ category });
        if (data) {
            // take articles with images only and add category
            const articles = data.articles
                .filter(article => article.urlToImage)
                .map(article => expandArticle(article, category));

            articles.forEach(article => allArticles.push(article));
            
            if (category == 'general') {
                // If we're in general category just fill the topHeadlinesArticles carousel
                articles.forEach(article => {
                    topHeadlinesArticles.push({ ...article, category: 'Trending' });
                    // Add to used articles set
                    usedArticleKeys.add(article.articleReference);
                });

                // Render all articles to top headline carousel
                renderCarousel(topHeadlinesArticles, 'topHeadlineCarousel', false);
            }
            else {
                // If the side carousel is not filled yet
                if (sideHeadlinesArticles.length < maxSideArticlesLength) {
                    // If we're in one of the top categories then try to fill the sideHeadlinesArticles carousel
                    if (category in TOP_CATEGORIES) {
                        // Find the first unused article for each cateogry
                        const unusedArticle = getUnusedArticle(articles);
                        
                        if (unusedArticle) {
                            sideHeadlinesArticles.push(unusedArticle);
                            usedArticleKeys.add(unusedArticle.articleReference);
                        }
                    }
                    // Fill side carousel when we have enough articles
                    if (sideHeadlinesArticles.length === maxSideArticlesLength) {
                        renderCarousel(sideHeadlinesArticles, 'topHeadlineByCategoryCarousel', true);
                    }
                }

                // Handle bottom headlines by category
                if (bottomHeadlinesByCategoryArticles.length < maxBottomArticlesByCategoryLength) {
                    const unusedArticle = getUnusedArticle(articles);

                    if (unusedArticle) {
                        bottomHeadlinesByCategoryArticles.push(unusedArticle);
                        usedArticleKeys.add(unusedArticle.articleReference);
                    }

                    // Fill trending by category when we have enough articles
                    if (bottomHeadlinesByCategoryArticles.length === maxBottomArticlesByCategoryLength) {
                        renderArticles('trendingByCategoryContainer', bottomHeadlinesByCategoryArticles, false);
                    }
                }

                // For articles below
                if (bottomHeadlinesArticles.length < categories.length) {
                    const unusedArticle = getUnusedArticle(articles);

                    if (unusedArticle) {
                        bottomHeadlinesArticles.push(unusedArticle);
                        usedArticleKeys.add(unusedArticle.articleReference);
                    }

                    // Fill top news list when we have enough articles
                    if (bottomHeadlinesArticles.length === categories.length) {
                        renderTopNewsList(bottomHeadlinesArticles);
                    }
                }
            }
        }
    }


    if (allArticles.length > 0) {
        let loopTimes = 0;
        let lastCategory = null;
        if (bottomHeadlinesByCategoryArticles.length < maxBottomArticlesByCategoryLength)
        {
            while (bottomHeadlinesByCategoryArticles.length < maxBottomArticlesByCategoryLength && loopTimes < maxBottomArticlesByCategoryLength) {
                const unusedArticle = getUnusedArticle(allArticles, lastCategory);
                if (unusedArticle) {
                    bottomHeadlinesByCategoryArticles.push(unusedArticle);
                    lastCategory = unusedArticle.category;
                }
                loopTimes++;
            }
            renderArticles('trendingByCategoryContainer', bottomHeadlinesByCategoryArticles, false);
        }
        if (bottomHeadlinesArticles.length < categories.length) {
            loopTimes = 0;
            lastCategory = null;
            while (bottomHeadlinesArticles.length < categories.length && loopTimes < categories.length) {
                const unusedArticle = getUnusedArticle(allArticles, lastCategory);
                if (unusedArticle) {
                    bottomHeadlinesArticles.push(unusedArticle);
                    lastCategory = unusedArticle.category;
                }
                loopTimes++;
            }
            renderTopNewsList(bottomHeadlinesArticles);
        }
    }
    firebaseApi.trackDownloads();
}

function fillMoreNews() {
    const moreNewsContainer = $('#moreNewsContainer');
    const moreNewsTitle = $('#moreNewsTitle');
    moreNewsContainer.empty();

    async function loadByTags(queryString) {
        moreNewsTitle.text('News by your tags');
        setupSearchInfiniteScroll($('#footer').height(), loadMoreNewsByTagsResults);
        // Sort the results by relevancy and filter the results for the last week
        initSearchPaginationObj(queryString, NEWS_SORT_BY_RELEVANCY, false, 7);
        showLoadingSpinner();
        hideNoMoreResults();
        searchPaginationObj.isLoading = true;
        const data = await getNews({
            isEverything: true,
            q: queryString,
            from: getDateBeforeDays(searchPaginationObj.period),
            sortBy: searchPaginationObj.sortBy });
        hideLoadingSpinner();
        if (data && data.articles && data.articles.length) {
            const articles = data.articles.map(article => expandArticle(article, null));
            searchPaginationObj.totalResults = data.totalResults;
            searchPaginationObj.hasMoreResults = data.totalResults > searchPaginationObj.resultsPerPage;
            renderArticles('moreNewsContainer', articles, false);
        }
        searchPaginationObj.isLoading = false;
    }

    async function loadByTopHeadlines() {
        moreNewsTitle.text('More trending news');
        setupSearchInfiniteScroll($('#footer').height(), loadMoreNewsResults);
        initSearchPaginationObj(null, null);
        // Increment topHeadlinePage starting from page 2 becuase page 1 is already rendered above
        searchPaginationObj.currentPage++;
        showLoadingSpinner();
        hideNoMoreResults();
        searchPaginationObj.isLoading = true;
        const data = await getNews({ isTopHeadlines: true, page: 2 });
        hideLoadingSpinner();

        if (data && data.articles && data.articles.length) {
            const articles = data.articles.map(article => expandArticle(article, null));
            searchPaginationObj.totalResults = data.totalResults;
            searchPaginationObj.hasMoreResults = data.totalResults > searchPaginationObj.resultsPerPage;
            renderArticles('moreNewsContainer', articles, false);
        }
        searchPaginationObj.isLoading = false;
    }

    if (isUserLoggedIn()) {
        // Read the user's interests from storage
        const userInterests = getLoggedInUserInterestsFromStorage();
       
        // Searching news by keywords with an OR operator for fetching news by user's interests
        const queryString = userInterests.map(interest => interest.tagName).join(' OR ');
        // Only if the user has any tags
        if (queryString)
            loadByTags(queryString);
        else
            loadByTopHeadlines();
    }
    else {
        loadByTopHeadlines();
    }
}

async function loadMoreNewsByTagsResults() {
    loadMoreNewsArticlesResults({
        isEverything: true,
        q: searchPaginationObj.globalSearchQuery,
        from: getDateBeforeDays(searchPaginationObj.period),
        sortBy: searchPaginationObj.sortBy
    }, function (data) {
        renderArticles('moreNewsContainer', data.articles, true);
    });
}

async function loadMoreNewsResults() {
    loadMoreNewsArticlesResults({ isTopHeadlines: true }, function (data) {
        renderArticles('moreNewsContainer', data.articles, true);
    });
}

// Fill articles into the related articles section
async function fillRelatedArticles(keyWords) {
    $('#relatedArticlesContainer').empty();;

    setupSearchInfiniteScroll($('#footer').height(), loadMoreRelatedArticlesResults);
    initSearchPaginationObj(keyWords, NEWS_SORT_BY_RELEVANCY, false, 7);
    showLoadingSpinner();
    hideNoMoreResults();
    searchPaginationObj.isLoading = true;
    const data = await getNews({
        isEverything: true,
        q: keyWords,
        from: getDateBeforeDays(searchPaginationObj.period),
        sortBy: searchPaginationObj.sortBy
    });
    hideLoadingSpinner();
    if (data && data.articles && data.articles.length) {
        const articles = data.articles.map(article => expandArticle(article, null));
        searchPaginationObj.totalResults = data.totalResults;
        searchPaginationObj.hasMoreResults = data.totalResults > searchPaginationObj.resultsPerPage;
        $('#relatedCounter').text(parseFloat(data.totalResults).toLocaleString()).show();
        $('#relatedLoader').hide();
        renderArticles('relatedArticlesContainer', articles, false);
    }
    searchPaginationObj.isLoading = false;
}

function loadMoreRelatedArticlesResults() {
    loadMoreNewsArticlesResults({
        isEverything: true,
        q: searchPaginationObj.globalSearchQuery,
        from: getDateBeforeDays(searchPaginationObj.period),
        sortBy: searchPaginationObj.sortBy
    }, function (data) {
        renderArticles('relatedArticlesContainer', data.articles, true);
    });
}

// Generate article global unique id depending on title and author fields (most reliable fields)
function generateArticleReference(article) {
    if (!article) return null;
    return generateObjectHash({ title: article.title, author: article.author }, 'article');
}

// In use everytime we fetch articles from the news api for creating a global ID
function expandArticle(article, category) {
    // Spread the article object and add the category if needed
    // Generate article reference (global unique id for article)
    return {
        ...article,
        ...(category && { category: NEWS_API_CATEGORIES[category] }),
        articleReference: generateArticleReference(article)
    };
}

// Render articles into a carousel
function renderCarousel(articles, carouselId, isSmall) {
    const newsCarousel = $('#' + carouselId);
    const indicators = newsCarousel.find('.carousel-indicators');
    const innerItems = newsCarousel.find('.carousel-inner');    
    indicators.empty();
    innerItems.empty();
    let isFirst = true;
    articles.forEach((article, idx) => {
        if (!article.urlToImage)
            return true; // Continue
        // Indicator button
        const button = $('<button type="button"/>')
            .attr('data-bs-target', '#' + carouselId)
            .attr('data-bs-slide-to', idx)
            .addClass(isFirst ? 'active' : '')
            .attr('aria-label', `Slide ${idx + 1}`)
            .attr('aria-current', isFirst ? 'true' : '')
            .appendTo(indicators);
        const carouselItem = $('<div/>')
            .addClass('carousel-item')
            .addClass(isFirst ? 'active' : '')
            .appendTo(innerItems);
        const inner = $('<div/>')
            .addClass('news_1_left2_inner position-relative')
            .appendTo(carouselItem);
        const inner1 = $('<div/>')
            .addClass('news_1_left2_inner1').addClass(isSmall ? 'image_container_sm' : 'image_container_lg')
            .appendTo(inner);
        const image = $('<img/>')
            .addClass('img_cover')
            .appendTo(inner1);
        appendNewsImage(image, article.urlToImage);
        const inner2 = $('<div/>')
            .addClass('news_1_left2_inner2 position-absolute bottom-0 px-4 bg_back w-100 p-3')
            .appendTo(inner);
        const list = $('<ul/>').addClass('mb-0').appendTo(inner2);
        const li = $('<li/>').addClass('d-flex').appendTo(list);
        const span = $('<span/>').addClass('flex-column').appendTo(li);
        const bold1 = $('<b/>')
            .addClass('d-inline-block bg_orange text-white p-1 px-3 font_11 text-uppercase rounded-1')
            .appendTo(span).text(article.category);
        const bold2 = $('<b/>')
            .addClass('d-block mt-2 mb-2').addClass(isSmall ? 'fs-6' : 'fs-5')
            .appendTo(span);
        const link = $('<div/>')
            .addClass('text-white')
            .appendTo(bold2).text(article.title); 
        addArticleDetailsLink(span, article);
        const innerSpan = $('<span/>').addClass('text-light font_11 fw-bold  d-flex text-uppercase').appendTo(span);
        innerSpan.append($('<i/>').addClass('bi bi-calendar me-1 col_orange'), ` ${formatDate(article.publishedAt)} `);
        appendNewsSourceIcon(innerSpan, article.source);
        isFirst = false;
    })
    // Initialize the bootstrap carousel plugin dynamically
    const carousel = new bootstrap.Carousel(newsCarousel[0]);
    carousel.cycle();
}

function renderTopNewsList(articles) {
    const topNewsList = $('#topNewsList');
    topNewsList.empty();
    topNewsList.append($('<b/>')
        .addClass('d-inline-block p-1 px-3 text-uppercase font_14 text-white bg_orange mb-4')
        .text('Top News'));
    let isFirst = true;
    articles.forEach(article => {
        const row = $('<div/>')
            .addClass('news_1_left1_inner row mx-0')
            .addClass(isFirst ? '' : 'border-top mt-3 pt-3')
            .appendTo(topNewsList);
        const col1 = $('<div/>').addClass('col-md-4 col-sm-4').appendTo(row);
        const innerDiv = $('<div/>').addClass('trend_2_in position-relative').appendTo(col1);
        const div1 = $('<div/>').addClass('trend_2_in1 top_news_image_container').appendTo(innerDiv);
        const image = $('<img/>').addClass('img-fluid img_cover').appendTo(div1);
        appendNewsImage(image, article.urlToImage);
        const div2 = $('<div/>').addClass('trend_2_in2 position-absolute top-0 p-1').appendTo(innerDiv);
        const bold = $('<b/>')
            .addClass('d-inline-block bg-success text-white p-1 px-2 font_9 text-uppercase rounded-1')
            .text(article.category)
            .appendTo(div2);
        const col2 = $('<div/>').addClass('col-md-8 col-sm-8 ps-0').appendTo(row);
        const innerRightDiv = $('<div/>').addClass('news_1_left1_inner_right').appendTo(col2);
        const boldDesc = $('<b/>')
            .addClass('d-block  mb-1 font_14')
            .appendTo(innerRightDiv);
        boldDesc.text(cutText(article.description, 100));
        const span = $('<span/>').addClass('text-muted font_10 fw-bold  d-flex text-uppercase').appendTo(innerRightDiv);
        span.append($('<i/>').addClass('bi bi-calendar me-1 col_orange'), ` ${formatDate(article.publishedAt)} `);
        appendNewsSourceIcon(span, article.source);
        addArticleDetailsLink(row, article);
        isFirst = false;
    })
}

function renderArticles(containerId, articles, isAppend, withBtns) {
    const loggedInUser = getLoggedInUser();
    const canShare = loggedInUser && !loggedInUser.isShareBlocked;
    const container = $('#' + containerId);
    if (!isAppend)
        container.empty();
    articles.forEach(article => {
        const item = $('<div/>').addClass('col mb-4').appendTo(container);
        const innerItem = $('<div/>').addClass('trend_2_inner').appendTo(item);
        const inner1 = $('<div/>').addClass('trend_2_in position-relative').appendTo(innerItem);
        const inner1Div1 = $('<div/>').addClass('trend_2_in1 category_image_container').appendTo(inner1);
        const image = $('<img/>').addClass('img-fluid img_cover').appendTo(inner1Div1);
        appendNewsImage(image, article.urlToImage);
        if (article.category) {
            const inner1Div2 = $('<div/>').addClass('trend_2_in2 position-absolute top-0 p-2').appendTo(inner1);
            $('<b/>')
                .addClass('d-inline-block bg_orange text-white p-1 px-3 font_11 text-uppercase rounded-1')
                .text(article.category).appendTo(inner1Div2);
        }        

        if (withBtns) {
            const inner1BackLayer = $('<div/>').addClass('trend_2_in_back bg_back w-100 h-100 position-absolute bottom-0 p-4').appendTo(inner1);
            const ul = $('<ul/>').addClass('mb-0').appendTo(inner1BackLayer);
            const li1 = $('<li/>').addClass('text-white d-inline-block').appendTo(ul);
            const li2 = $('<li/>').addClass('text-white d-inline-block').appendTo(ul);
            // Add a share article button
            if (canShare) {
                const shareArticleBtn = $('<a/>').addClass('bg-white rounded-circle text-center col_orange p-2 me-1')
                    .on('click', function (event) {
                        // Cancel the container's onclick event (goToArticleDetails)
                        cancelEvent(event);
                        handleShareArticle(article, $(this));
                    })
                    .appendTo(li1);
                createIcon('bi-share', '20px').appendTo(shareArticleBtn);
            }
            // Add a remove article button
            const removeArticleBtn = $('<a/>').addClass('bg-white rounded-circle text-center col_orange p-2')
                .on('click', function (event) {
                    // Cancel the container's onclick event (goToArticleDetails)
                    cancelEvent(event);
                    handleRemoveSavedArticle(article, item);
                })
                .appendTo(li2);            
            createIcon('bi-trash3', '20px').appendTo(removeArticleBtn);
        }

        const inner2 = $('<div/>').addClass('trend_2_inner_last mt-3').appendTo(innerItem);
        const bold2 = $('<b/>').addClass('d-block  mb-1').text(article.title).appendTo(inner2);
        const span2 = $('<span/>').addClass('text-muted font_11 fw-bold  d-flex text-uppercase mt-2').appendTo(inner2);
        span2.append($('<i/>').addClass('bi bi-calendar me-1 col_orange font_12'), ` ${formatDate(article.publishedAt)} `);
        addArticleDetailsLink(item, article);
        appendNewsSourceIcon(span2, article.source);

        if (article.sharesCount > 0)
            span2.append($('<i/>').addClass('bi bi-share me-2 ms-3 col_orange font_12'), ` ${article.sharesCount} `);
    })
}

function renderArticlesWithComments(containerId, articles, isAppend, isSharerPage) {
    const loggedInUser = getLoggedInUser();
    const canShare = loggedInUser && !loggedInUser.isShareBlocked;
    const container = $('#' + containerId);
    if (!isAppend)
        container.empty();
    
    articles.forEach(sharedArticle => {
        const article = sharedArticle.article;
        const li = $('<li/>').addClass('d-flex border-bottom  pb-3 mb-3');
        const row = $('<div/>').addClass('row mb-4').appendTo(li).attr('id', `sharedArticleId_${sharedArticle.id}`);
        const col1 = $('<div/>').addClass('col-md-4 col-sm-4').appendTo(row);
        const col2 = $('<div/>').addClass('col-md-8 col-sm-8').appendTo(row);
        const span1 = $('<span/>').addClass('category_image_container').appendTo(col1);

        // Check if user is in "given" page or in "shared" page and render data properly
        const userId = isSharerPage ? sharedArticle.sharedUserId : sharedArticle.userId;
        const userName = isSharerPage ? sharedArticle.sharedUserName : sharedArticle.sharerUserName;
        const userImageUrl = isSharerPage ? sharedArticle.sharedUserImageUrl : sharedArticle.sharerUserImageUrl;
        const userGender = isSharerPage ? sharedArticle.sharedUserGender : sharedArticle.sharerUserGender;

        const image = $('<img/>').addClass('img-fluid img_cover').appendTo(span1);
        appendNewsImage(image, article.urlToImage);
        const span2 = $('<span/>').addClass('flex-column ms-3').appendTo(col2);
        $('<b/>').addClass('d-block font_14').text(article.title).appendTo(span2);
        $('<span/>').addClass('mt-2 font_14 family_1 d-block').text(article.description).appendTo(span2);

        $('<span/>').addClass('mt-2 font_14 family_1 d-block').text(article.content).appendTo(span2);

        const span4 = $('<span/>').addClass('text-muted font_10 fw-bold  d-flex mt-2').appendTo(span2);
        span4.append($('<i/>').addClass('bi bi-calendar me-1 col_orange'), ` ${formatDate(article.publishedAt)} `);
        appendNewsSourceIcon(span4, article.source);
        
        const div = $('<div/>').addClass('d-flex mt-3').appendTo(span2);
        const avatarContainer = $('<div/>').appendTo(div);
        const imageContainer = $('<div/>').addClass('profile-container').appendTo(avatarContainer);
        imageContainer.append($('<img/>').addClass('profile_image_sm')
            .attr('src', userImageUrl || getDefaultProfileImage(userGender))
            .on('error', function () { this.src = getDefaultProfileImage(userGender); }));

        addArticleDetailsLink(span1, article);
        const starsContainer = $('<div/>').addClass('stars-container').appendTo(imageContainer);
        setUserAvatar(userId, starsContainer);
        

        const span = $('<span/>').addClass('ms-4').appendTo(div);
        const innerSpan = $('<span/>').addClass('d-flex align-items-center').appendTo(span);
        const offensiveBtnCssClass = sharedArticle.isOffensive ? 'btn-warning' : 'btn-outline-secondary';
        const offensiveIcon = sharedArticle.isOffensive ? 'bi-emoji-frown' : 'bi-emoji-smile';
        const likeIcon = sharedArticle.isLike ? 'bi-heart-fill' : 'bi-heart';
        const likeIconColor = sharedArticle.isLike ? '#d63813' : '';  
        const shareIcon = 'bi-share';

        const sharesBadge = $('<span/>').addClass('position-absolute top-0 start-100 translate-middle badge rounded-pill bg-info')
            .text(article.sharesCount);
        
        if (article.sharesCount > 0)
            sharesBadge.show();
        else
            sharesBadge.hide();

        if (isSharerPage) {
            innerSpan.append(
                $('<i/>').addClass('bi bi-chat-right-text col_orange mx-2 fs-5 align-middle'),
                $('<b/>').addClass('d-block').text(userName)
                    .append($('<span/>').addClass('text-muted font_12 fw-normal px-2').text(`/ ${formatDate(sharedArticle.updatedAt)}`))
            );

            if (sharedArticle.isLike)
                innerSpan.append(createIcon(likeIcon, '18px', likeIconColor));
            
            if (sharedArticle.isOffensive) {
                innerSpan.append(
                    $('<span/>').addClass('mx-1'),
                    createIcon(offensiveIcon, '18px'));
            }

        }
        else {
            const shareBtn = canShare ? $('<div/>').addClass(`mx-2 btn btn-outline-secondary btn-sm position-relative`).append(createIcon(shareIcon, '18px'), sharesBadge)
                .on('click', function () { handleSharedArticleShare(sharedArticle, $(this)); }) : null;

            innerSpan.append(
                $('<i/>').addClass('bi bi-chat-right-text col_orange mx-2 fs-5 align-middle'),
                $('<b/>').addClass('d-block').text(userName)
                    .append($('<span/>').addClass('text-muted font_12 fw-normal px-2').text(`/ ${formatDate(sharedArticle.updatedAt)}`)),
                $('<div/>').addClass(`ms-3 me-1 btn btn-outline-secondary btn-sm position-relative`)
                    .append(createIcon(likeIcon, '18px', likeIconColor))
                    .on('click', function () { handleSharedArticleLike(sharedArticle, $(this)); }),
                shareBtn
                ,
                $('<div/>').addClass(`mx-2 btn ${offensiveBtnCssClass} btn-sm`).append(createIcon(offensiveIcon, '18px'))
                    .on('click', function () { handleSharedArticleIsOffensive(sharedArticle, $(this)); }),
                $('<div/>').addClass('mx-2 btn btn-outline-secondary btn-sm').append(createIcon('bi-person-lock', '18px'))
                    .on('click', function () { handleSharedArticleBlockUser(sharedArticle); })
            );
        }
        span.append($('<span/>').addClass('text-muted family_1 d-block font_14 mt-3').text(sharedArticle.comment));
        container.append(li);
    })
}

function renderSearchResultsList(data, isAppend) {
    if (!data) return;
    const articles = data.articles;
    const searchResultsList = $('#searchResultsList');
    if (!isAppend) {
        const searchResultsTitle = $('#searchResultsTitle');
        searchResultsList.empty();
        if (data.totalResults == 0)
            searchResultsTitle.text('No results');
        else
            searchResultsTitle.text(`${data.totalResults.toLocaleString()} results were found`);
    }
    // Search text
    const term = searchPaginationObj.globalSearchQuery;
    articles.forEach((article, idx) => {
        const li = $('<li/>').addClass('d-flex border-bottom  pb-3 mb-3');
        const span1 = $('<span/>').appendTo(li);
        const image = $('<img/>').width(100).appendTo(span1);
        appendNewsImage(image, article.urlToImage);
        const span2 = $('<span/>').addClass('flex-column ms-3').appendTo(li);
        const bold = $('<b/>').addClass('d-block font_14')
            .html(highlightTerm(article.title, term))
            .appendTo(span2);
        const span3 = $('<span/>').addClass('mt-2 font_14 family_1 d-block')
            .html(highlightTerm(article.description, term))
            .appendTo(span2);

        const span4 = $('<span/>').addClass('text-muted font_10 fw-bold  d-flex text-uppercase').appendTo(span2);
        span4.append($('<i/>').addClass('bi bi-calendar me-1 col_orange'), ` ${formatDate(article.publishedAt)} `);
        appendNewsSourceIcon(span4, article.source);


        addArticleDetailsLink(li, article);

        // Add smooth animation
        li.css({ opacity: 0, transform: 'translateY(20px)' });
        searchResultsList.append(li);

        // Animate in
        setTimeout(() => {
            li.animate({ opacity: 1, transform: 'translateY(0)' }, 300);
        }, idx * 150);

    })
}

function initSearch(searchString) {
    // Go to the top of the page
    $('html, body').animate({ scrollTop: 0 }, 'fast');
    initSearchPaginationObj(searchString, NEWS_API_DEFAULT_SORT_BY);
    loadCenterPage(SEARCH_PAGE);
}
function homePageKeyDown(event) {
    if (event.which === 13) // Enter key
        goToSearch();
}
function goToSearch() {
    initSearch($('#homePage_searchInput').val().trim());
}

async function runSearch() {
    const selectedSortBy = $('input[name="searchPage_sortByRadio"]:checked').val();
    const searchQuery = $('#searchPage_searchInput').val().trim();
    if (!searchQuery)
        return;
    
    initSearchPaginationObj(searchQuery, selectedSortBy);
    showLoadingSpinner();
    hideNoMoreResults();
    searchPaginationObj.isLoading = true;
    const data = await getNews({
        isEverything: true,
        page: searchPaginationObj.currentPage,
        q: searchPaginationObj.globalSearchQuery,
        sortBy: searchPaginationObj.sortBy,
        pageSize: searchPaginationObj.resultsPerPage
    }); 
    hideLoadingSpinner();
    if (data) {
        searchPaginationObj.totalResults = data.totalResults;
        searchPaginationObj.hasMoreResults = data.totalResults > searchPaginationObj.resultsPerPage;
        // For initial rendering
        renderSearchResultsList(data, false);
    }
    searchPaginationObj.isLoading = false;
}

async function loadMoreSearchResults() {
    loadMoreNewsArticlesResults({
        isEverything: true,
        q: searchPaginationObj.globalSearchQuery,
        sortBy: searchPaginationObj.sortBy
    }, function (data) {
        renderSearchResultsList(data, true); // true = append to existing results
    });
}

function fillHomePage() {
    fillHomeNews();
    fillMoreNews();
    fillUserTags();
    fillHomeCounters();
    fillMostArticles();
}

function fillSearchPage() {
    $('#searchPage_searchInput').on('keypress', function (e) {
        if (e.which === 13) { // Enter key
            runSearch();
        }
    }).val(searchPaginationObj.globalSearchQuery);
    $('input[name="searchPage_sortByRadio"]').prop('checked', false); // Uncheck all first if needed
    // Set the value for the sort-by radio from the selected sort-by option
    $(`input[name="searchPage_sortByRadio"][value="${searchPaginationObj.sortBy}"]`).prop('checked', true);

    setupSearchInfiniteScroll($('#footer').height(), loadMoreSearchResults);
    $('#searchResultsList').empty();
    runSearch();
    fillUserTags();
}

function selectCategory(category, item) {
    // Save the selected category in session storage
    setSessionStorage('selectedCategory', category);
    loadCenterPage(CATEGORY_PAGE);
    // Remove 'active' class from any previously selected category item
    $(item).closest('ul').find('.active').removeClass('active');
    // Add 'active' class to the clicked category item
    $(item).addClass('active');
}

async function fillCategoryPage() {
    const selectedCategory = getSessionStorage('selectedCategory');
    $('#categoryTitle').text(NEWS_API_CATEGORIES[selectedCategory]);
    const topCategoryArticle = $('#topCategoryArticle');
    topCategoryArticle.empty();

    setupSearchInfiniteScroll($('#footer').height(), loadMoreCategoryResults);

    initSearchPaginationObj(selectedCategory, null);
    showLoadingSpinner();
    hideNoMoreResults();
    searchPaginationObj.isLoading = true;
    const data = await getNews({ category: selectedCategory, page: searchPaginationObj.currentPage, pageSize: searchPaginationObj.resultsPerPage });
    hideLoadingSpinner();
    if (data && data.articles && data.articles.length) {
        const articles = data.articles.map(article => expandArticle(article, selectedCategory));
        // Fill the top article with the first article fetched
        fillTopArticle(topCategoryArticle, articles[0]);
        // Removes the first element
        data.articles.shift();
        searchPaginationObj.totalResults = data.totalResults;
        searchPaginationObj.hasMoreResults = data.totalResults > searchPaginationObj.resultsPerPage;
        renderArticles('trendingByCategoryContainer', articles, false);
    }
    searchPaginationObj.isLoading = false;
}

async function loadMoreCategoryResults() {
    const selectedCategory = getSessionStorage('selectedCategory');
    loadMoreNewsArticlesResults({ category: selectedCategory, q: searchPaginationObj.globalSearchQuery }, function (data) {
        renderArticles('trendingByCategoryContainer', data.articles, true);
    });
}

function fillTopArticle(container, article) {
    const col1 = $('<div />').addClass('col').appendTo(container);
    const leftDiv = $('<div />').addClass('business_pg1_left').appendTo(col1);
    const leftContainer = $('<div />').addClass('center_home1_left position-relative').appendTo(leftDiv);
    const leftImageContainer = $('<div />').addClass('center_home1_left1').appendTo(leftContainer);
    const image = $('<img/>').addClass('img-fluid img_cover').appendTo(leftImageContainer);
    appendNewsImage(image, article.urlToImage);
    addArticleDetailsLink(leftContainer, article);

    const leftTitleContainer = $('<div />').addClass('center_home1_left3 position-absolute bottom-0 p-3 bg_back').appendTo(leftContainer);
    $('<b/>').addClass('d-block fs-3').append($('<span/>').addClass('text-white').text(article.title)).appendTo(leftTitleContainer);
    const col2 = $('<div />').addClass('col').appendTo(container);
    const rightDiv = $('<div />').addClass('business_pg1_right').appendTo(col2);
    const span1 = $('<span />').addClass('font_14 d-flex').appendTo(rightDiv);
    span1.append($('<i/>').addClass('bi bi-clock me-2 col_orange'), ` ${timeAgo(article.publishedAt)} `);
    appendNewsSourceIcon(span1, article.source);

    $('<b/>').addClass('fs-2 d-block mt-3').text(article.description || article.title).appendTo(rightDiv);
    $('<p/>').addClass('mt-3').html(article.content).appendTo(rightDiv);
    const span2 = $('<span />').addClass('font_14').appendTo(rightDiv);
    $('<a/>')
        .attr('href', article.url)
        .attr('target', '_blank') // opens in a new window or tab
        .addClass('col_orange')
        .append($('<i/>').addClass('bi bi-arrow-up-right-square me-2 col_orange'))
        .append($('<i/>').text(' Read more... '))
        .appendTo(span2);
}

// Add go to article details event to element with the rendered article
function addArticleDetailsLink(element, article) {
    element.on('click', function () { goToArticleDetails(article); }).addClass('pointer');
}

function goToArticleDetails(article) {
    // Set the current active article
    setSessionStorage('activeArticle', article);
    // Load the article details page
    loadCenterPage(ARTICLE_DETAILS_PAGE);
}

// Fill the article details page by the active article
function fillArticleDetailsPage() {
    // Get the active article
    const article = getSessionStorage('activeArticle');
    if (!article) return;
    if (article.id) loadPage();
    else {
        // Check if the user already saved the article
        if (isUserLoggedIn()) {
            getSavedArticleByReference(article.articleReference, function (result) {
                if (result.id) article.id = result.id;
                loadPage();
            });
        }
        else {
            loadPage();
        }
    }
    function loadPage() {
        const loggedInUser = getLoggedInUser();
        const canShare = loggedInUser == null || !loggedInUser.isShareBlocked;
        firebaseApi.trackRead(article);
        // Animate scrolling to top
        $('html, body').animate({ scrollTop: 0 }, 'fast');
        const articleContainer = $('#articleContainer');
        articleContainer.empty();
        const imageContainer = $('<div/>')
            .addClass('image_container_lg')
            .appendTo(articleContainer);
        const image = $('<img/>').addClass('img-fluid img_cover').appendTo(imageContainer);
        appendNewsImage(image, article.urlToImage);
        const ul = $('<ul/>').addClass('mb-0 mt-3').appendTo(articleContainer);
        const li1 = $('<li/>').addClass('d-flex').appendTo(ul);
        const span1 = $('<span/>').addClass('flex-column').appendTo(li1);
        if (article.category)
            $('<span/>')
                .addClass('d-inline-block text-white font_13 p-1 px-3 bg_orange')
                .text(article.category).appendTo(span1);
        $('<b/>')
            .addClass('d-block fs-2 mt-3 mb-2')
            .text(article.title).appendTo(span1);
        const li2 = $('<li/>').addClass('justify-content-between d-flex border-top mt-2 pt-2').appendTo(ul);
        const span2 = $('<span/>').addClass('font_12').appendTo(li2);
        span2.append($('<i/>').addClass('bi bi-clock me-2 col_orange'), ` ${timeAgo(article.publishedAt)} `);
        appendNewsSourceIcon(span2, article.source);
        const saveBtnCssClass = article.id > 0 ? 'btn-success' : 'btn-outline-secondary';
        const span3 = $('<span/>').addClass('d-flex font_13 mt-1').appendTo(li2);
        if (canShare) {
            // Button for sharing an article
            $('<div/>').addClass('me-3 btn btn-outline-secondary btn-sm').attr('id', 'shareArticleBtn')
                .on('click', function () {
                    handleShareArticle(article, $(this));
                })
                .append(createIcon('bi-share', '14px')).appendTo(span3);
        }
        // Button for saving an article
        $('<div/>').addClass(`me-3 btn ${saveBtnCssClass} btn-sm`).attr('id', 'saveArticleBtn')
            .on('click', function () {
                handleSaveArticle(article, $(this));
            })
            .append(createIcon('bi-save', '14px')).appendTo(span3);

        const p1 = $('<p/>').addClass('mt-4').text(article.description).appendTo(articleContainer);
        const p2 = $('<p/>').addClass('mt-4').html(article.content).appendTo(articleContainer);
        const span = $('<span />').addClass('font_14').appendTo(articleContainer);
        $('<a/>')
            .attr('href', article.url)
            .attr('target', '_blank') // opens in a new window or tab
            .addClass('col_orange')
            .append($('<i/>').addClass('bi bi-arrow-up-right-square me-2 col_orange'))
            .append($('<i/>').text(' Read more... '))
            .appendTo(span);

        loadAILottieAnimation($('#articleMapLoader'));

        // Use gemini for getting AI information about the article and show it
        proccessArticleAI(article);
    }
}

function checkLoginNeeded(continueFunc) {
    if (!isUserLoggedIn()) {
        // Ask user to log in
        handleUserLogin(continueFunc);
    }
    else {
        // User is already logged in
        continueFunc();
    }
}

function handleUserLogin(onLoginSuccess) {
    openNewsDialog('Login/Login', function () {
        initLoginPanel(onLoginSuccess);
    });
}

function handleUserProfile() {
    openNewsDialog('Profile/Profile', function () {
        initProfilePanel();
    });
}

function handleUserTags() {
    openNewsDialog('Tags/Tags', function () {
        initTagsPanel();
    });
}

function handleBlockedUsers() {
    openNewsDialog('BlockedUsers/BlockedUsers', function () {
        initBlockedUsersPanel();
    });
}

function handleShareArticle(article, shareBtn) {
    checkLoginNeeded(function () {
        const loggedInUser = getLoggedInUser();
        if (loggedInUser.isShareBlocked) {
            shareBtn.hide();
            setTimeout(function () {
                showWarning('You are not allowed to share articles');
            }, 1000);
        }
        else {
            openNewsDialog('ShareArticle/ShareArticle', function () {
                if (article.id > 0)
                    initShareArticlePanel(article);
                else {
                    getSavedArticleByReference(article.articleReference, function (result) {
                        if (result.id)
                            article.id = result.id;                        
                        initShareArticlePanel(article);
                    })
                }
            });
        }
    });
}

function handleRemoveSavedArticle(article, itemContainer) {
    showConfirm('Remove saved article', 'Are you sure?', function () {
        deleteSavedArticle(article.id, function () {
            toastSuccess('Article removes successfully');
            itemContainer.remove();
        })
    })
}

function initLoginPanel(onLoginSuccess) {
    $('#loginForm input').on('keypress', function () {
        $(this).removeClass('is-invalid');
    });

    $('#loginForm').on('submit', function (event) {
        // Remove previous validation classes
        $(this).find('input').removeClass('is-invalid');
        $('#errorMessage').addClass('hide');

        let formIsValid = true;

        // Validate email
        const emailInput = $('#loginUserEmail');
        if (!emailInput[0].checkValidity()) {
            emailInput.addClass('is-invalid');
            formIsValid = false;
        }

        // Validate password
        const passwordInput = $('#loginUserPassword');
        if (!passwordInput[0].checkValidity()) {
            passwordInput.addClass('is-invalid');
            formIsValid = false;
        }

        const submitBtn = $('button[type="submit"]');
        if (formIsValid) {
            // Submit form if valid, call server login function
            const user = {
                email: emailInput.val().trim(),
                password: passwordInput.val().trim()
            }
            showLoadingBtn(submitBtn);
            loginUser(user, function (result) {
                // login success
                // 1. save token to local storage
                // 2. update logged in user visible elements
                // 3. continue last unauthorized funciton
                // 4. close login dialog
                // 5. track login to firebase
                const keepLoggedIn = $('#keepLoggedInInput').prop('checked');

                setLoggedInUser(result, keepLoggedIn);
                hideLoadingBtn(submitBtn);
                closeNewsDialog();

                // Track login to firebase
                firebaseApi.trackLogin(result.user);

                updateLoggedInUserElements(result.user, true);

                if (onLoginSuccess)
                    onLoginSuccess();

            }, function (result) {
                $('#errorMessage').removeClass('hide');
                hideLoadingBtn(submitBtn);
            })
        } else {
            // Mark the form as validated to show feedback
            $(this).addClass('was-validated');
            cancelEvent(event);
        }
        return false; // Prevent page refresh
    });
}

function initRegisterPanel()
{
    $('#registerForm input').on('keypress', function () {
        $(this).removeClass('is-invalid');
    });

    $('#registerForm input').on('change', function () {
        $(this).removeClass('is-invalid');
    });

    $('#uploadProfileBtn').click(function () {
        $('#registerProfileImageInput').click();
    });

    $('#registerProfileImageInput').change(function () {
        const file = this.files[0];
        if (file) {
            uploadImageToImgBB(file,
                function (imageUrl) {
                    $('#profileImagePreview').attr('src', imageUrl);
                    $('#profileImagePreviewContainer').show();
                },
                function () {
                    showError('Image upload failed')
                });
        }
        // Clear the input value to allow selecting the same file again
        $(this).val('');
    });

    $('#registerForm').on('submit', function (event) {
        // Remove previous validation classes
        $(this).find('input').removeClass('is-invalid');
        $('#errorMessage').addClass('hide');

        let formIsValid = true;

        // Validate email
        const emailInput = $('#registerEmail');
        if (!emailInput[0].checkValidity()) {
            emailInput.addClass('is-invalid');
            formIsValid = false;
        }

        // Validate password
        const passwordInput = $('#registerPassword');
        if (!passwordInput[0].checkValidity()) {
            passwordInput.addClass('is-invalid');
            formIsValid = false;
        }

        // Validate name
        const nameInput = $('#registerName');
        if (!nameInput[0].checkValidity()) {
            nameInput.addClass('is-invalid');
            formIsValid = false;
        }

        // Validate gender
        const genderInput = $('input[name="genderRadio"]')
        if (!genderInput[0].checkValidity()) {
            genderInput.addClass('is-invalid');
            formIsValid = false;
        }

        const profileImage = $('#profileImagePreview');

        if (formIsValid) {
            // Submit form if valid, call server register function
            const newUser =
            {
                email: emailInput.val().trim(),
                password: passwordInput.val().trim(),
                name: nameInput.val().trim(),
                gender: genderInput[0].checked ? GENDER_MALE : GENDER_FEMALE, // 1 = Male , 2 = Female
                imageUrl: profileImage.attr('src') || ''
            }

            registerUser(newUser, function (result) {
                // register success, go back to login page
                showSuccess('User registered successfully');
                loadLoginPanel();

            }, function (result) {
                $('#errorMessage h6').text(result.errorMessage)
                $('#errorMessage').removeClass('hide');
            })
        } else {
            // Mark the form as validated to show feedback
            $(this).addClass('was-validated');
            cancelEvent(event);
        }
        return false; // Prevent page refresh
    });
}

function initProfilePanel() {
    const loggedInUser = getLoggedInUser();

    $('#profileForm input').on('keypress', function () {
        $(this).removeClass('is-invalid');
    });

    $('#uploadProfileBtn').click(function () {
        $('#profileImage').click();
    });

    $('#profileEmail').val(loggedInUser.email);
    $('#profilePassword').val(loggedInUser.password);
    $('#profileName').val(loggedInUser.name);
    if (loggedInUser.gender == GENDER_MALE)
        $('#maleCheck').prop('checked', true);
    else
        $('#femaleCheck').prop('checked', true);

    if (loggedInUser.imageUrl) {
        $('#profileImagePreview').attr('src', loggedInUser.imageUrl);
        $('#profileImagePreviewContainer').show();
    }
    
    $('#profileImage').change(function () {
        const file = this.files[0];
        if (file) {
            uploadImageToImgBB(file,
                function (imageUrl) {
                    $('#profileImagePreview').attr('src', imageUrl);
                    $('#profileImagePreviewContainer').show();
                },
                function () {
                    showError('Image upload failed')
                });
        }
        // Clear the input value to allow selecting the same file again
        $(this).val('');
    });

    $('#profileForm').on('submit', function (event) {
        // Remove previous validation classes
        $(this).find('input').removeClass('is-invalid');
        $('#errorMessage').addClass('hide');

        let formIsValid = true;

        // Validate name
        const nameInput = $('#profileName');
        if (!nameInput[0].checkValidity()) {
            nameInput.addClass('is-invalid');
            formIsValid = false;
        }

        const profileImage = $('#profileImagePreview');

        if (formIsValid) {
            // Submit form if valid, call server update User Profile function
            const gender = $('#maleCheck').is(':checked') ? GENDER_MALE : GENDER_FEMALE;

            const userProfile = {
                ...loggedInUser,
                name: nameInput.val().trim(),
                gender,
                imageUrl: profileImage.attr('src')
            }
            updateUserProfile(userProfile, function (result) {
                // Register success, go back to login page
                showSuccess('User updated successfully');
                // Update the logged in user in storage
                updateLoggedInUser(userProfile);
                updateLoggedInUserElements(userProfile, false);
                // Close the dialog
                closeNewsDialog();
            }, function (result) {
                $('#errorMessage h6').text(result.errorMessage)
                $('#errorMessage').removeClass('hide');
            })
        } else {
            // Mark the form as validated to show feedback
            $(this).addClass('was-validated');
            cancelEvent(event);
        }
        return false; // Prevent page refresh
    });
}

function clearProfileImage() {
    $('#profileImagePreview').attr('src', '');
    $('#profileImagePreviewContainer').hide();
}

function initTagsPanel() {
    fillUserTags(true);

    $('#tagsForm input').on('keypress', function () {
        $(this).removeClass('is-invalid');

    });

    $('#tagsForm').on('submit', function (event) {
        // Remove previous validation classes
        $(this).find('input').removeClass('is-invalid');
        $('#errorMessage').addClass('hide');

        let formIsValid = true;

        // Validate name
        const tagNameInput = $('#tagName');
        if (!tagNameInput[0].checkValidity()) {
            tagNameInput.addClass('is-invalid');
            formIsValid = false;
        }

        const newTagName = tagNameInput.val().trim();
        
        if (formIsValid) {
            // Submit form if valid, call server's addInterest function
            addInterest(newTagName, function (result) {
                toastSuccess('Tag added successfully');

                // Get interests from the server
                getInterests(result => {
                    // Save updated interests list in local storage
                    setLoggedInUserInterestsToStorage(result)
                    
                    // Update edit tags dialog list
                    fillUserTags(true);

                    // Update home page tags list
                    fillUserTags();

                    // Fill more news by updated tags when user is in home page
                    if (getActivePage() == HOME_PAGE)
                        fillMoreNews();
                });

                // Clear input
                tagNameInput.val('');

            }, function (result) {
                $('#errorMessage h6').text(result.errorMessage)
                $('#errorMessage').removeClass('hide');
            })
        } else {
            // Mark the form as validated to show feedback
            $(this).addClass('was-validated');
            cancelEvent(event);
        }
        return false; // Prevent page refresh
    });
}

function initBlockedUsersPanel() {
    fillBlockedUsersList();

    $('#blockedUsersForm input').on('keypress', function () {
        $(this).removeClass('is-invalid');
    });

    $('#blockedUsersForm').on('submit', function (event) {
        // Remove previous validation classes
        $(this).find('input').removeClass('is-invalid');
        $('#errorMessage').addClass('hide');

        let formIsValid = true;

        const unblockIds = [];
        const usersList = $('#usersList');
        usersList.find('input[type="checkbox"]:checked').each(function () {
            const idStr = $(this).attr('id');
            const blockedId = parseInt(idStr.replace('blocked_', ''), 10);
            unblockIds.push(blockedId);
        });

        if (unblockIds.length == 0) {
            formIsValid = false
            $('#errorMessage h6').text('Please select user to unblocked!')
            $('#errorMessage').removeClass('hide');
        }

        if (formIsValid) {
            // Submit form if valid, call server delete blocked users function
            deleteBlockedUsersAsync(unblockIds, function () {
                toastSuccess('Users unblocked  successfully!');
                closeNewsDialog();
                if (getActivePage() == SHARED_ARTICLES_PAGE)
                    fillSharedArticlesPage();
            });

        } else {
            // Mark the form as validated to show feedback
            $(this).addClass('was-validated');
            cancelEvent(event);
        }
        return false; // Prevent page refresh
    });
}

function initShareArticlePanel(article, onSuccess) {
    // Check if article already saved, if not then save the article first
    if (!article.id) {
        saveArticle(article, loadPanel);
    }
    else {
        loadPanel(article);
    }

    function loadPanel(savedArticle) {
        fillUsersList();

        $('#shareArticleForm input,textArea').on('keypress', function () {
            $(this).removeClass('is-invalid');
        });
        $('#comment').on('input', function () {
            const length = $(this).val().length;
            const maxLength = 500;
            const commentCharCount = $('#commentCharCount');
            commentCharCount.text(length + '/' + maxLength);

            // Change text color when reaching limit
            if (length >= maxLength) {
                commentCharCount.addClass('text-danger').removeClass('text-muted');
            } else {
                commentCharCount.removeClass('text-danger').addClass('text-muted');
            }
        });      

        $('#shareArticleForm').on('submit', function (event) {
            // Remove previous validation classes
            $(this).find('input').removeClass('is-invalid');
            $('#errorMessage').addClass('hide');

            let formIsValid = true;

            // Validate comment
            const commentInput = $('#comment');
            if (!commentInput[0].checkValidity()) {
                commentInput.addClass('is-invalid');
                formIsValid = false;
            }

            const loggedInUser = getLoggedInUser();
            // Build shared array including ID's of shared users
            const sharedArticles = [];
            const usersList = $('#usersList');
            usersList.find('input[type="checkbox"]:checked').each(function () {
                const idStr = $(this).attr('id');
                const sharedUserId = parseInt(idStr.replace('user_', ''), 10);
                sharedArticles.push(
                    {
                        id: 0,
                        userId: loggedInUser.id,
                        articleId: savedArticle.id,
                        articleReference: savedArticle.articleReference,
                        comment: commentInput.val().trim(),
                        sharedUserId: sharedUserId,
                        isOffensive: false,
                    }
                );
            });

            if (sharedArticles.length == 0) {
                formIsValid = false
                $('#errorMessage h6').text('Please select users to share with!')
                $('#errorMessage').removeClass('hide');
            }
            
            if (formIsValid) {
                // Submit form if valid, call server addSharedArticles function
                addSharedArticles(sharedArticles, function (newSharedArticles) {
                    $('#shareArticleBtn').removeClass('btn-outline-secondary').addClass('btn-success');
                    toastSuccess('Article shared successfully!');
                    closeNewsDialog();

                    for (const newSharedArticle of newSharedArticles) {
                        firebaseApi.trackShare(newSharedArticle, savedArticle);
                    }
                    if (onSuccess)
                        onSuccess(newSharedArticles.length);
                });

            } else {
                // Mark the form as validated to show feedback
                $(this).addClass('was-validated');
                cancelEvent(event);
            }
            return false; // Prevent page refresh
        });
    }
}

function loadRegisterPanel() {
    loadHtmlPage('Register/Register', "newsModalBody", function () {
        initRegisterPanel();
    });
}

function loadLoginPanel() {
    loadHtmlPage('Login/Login', "newsModalBody", function () {
        initLoginPanel(null);
    });
}

function handleLogout(goToHome = true) {
    logoutUser();
    clearLoggedInUserElements();
    firebaseApi.logout();
    if (goToHome)
        loadCenterPage(HOME_PAGE);
}


function clearUserTags() {
    const userTags = $('#userTags');
    if (userTags.length == 0)
        return;
    userTags.empty();
}


function fillUserTags(isEditMode = false) {
    const userTags = isEditMode ? $('#userEditTags') : $('#userTags');
    if (userTags.length == 0)
        return;
    userTags.empty();
    if (isUserLoggedIn()) {

        const userInterests = getLoggedInUserInterestsFromStorage();

        if (userInterests.length == 0)
            $('#usersTagsHeader').text('No tags').show();
        else {
            $('#usersTagsHeader').hide();
            renderUserInterests(userTags, userInterests, isEditMode);
        }
    }
}

function renderUserInterests(container, interests, isEditMode) {
    interests.forEach(interest => {
        const li = $('<li/>').addClass('mx-1 mt-1 mb-1').appendTo(container);
        if (isEditMode) {
            const div = $('<a/>')
                .addClass('d-flex align-items-center pointer border p-2 px-3')
                .attr('data-id', interest.id)
                // Add event listener to go to delete the user's interest tag
                .on('click', function () { confirmRemoveTag(interest); })
                .appendTo(li);
            div.append($('<span/>').addClass('tagNameMarker').text(interest.tagName), $('<div/>').addClass('btn-close px-2'));
        }
        else {
            $('<a/>')
                .addClass('d-block border p-2 px-3 pointer tagNameMarker')
                .attr('data-id', interest.id)
                .text(interest.tagName)
                // Add event listener to go to search
                .on('click', function () { initSearch(interest.tagName); })
                .appendTo(li);
        }
    })
}

function fillUsersList() {
    const loggedInUser = getLoggedInUser();

    const usersList = $('#usersList');
    const usersListHeaderBadge = $('#usersListHeaderBadge');
    const usersList_searchInput = $('#usersList_searchInput');  

    // Add event listener for searching while typing
    usersList_searchInput.on('keyup', function (e) {
        const filter = usersList_searchInput.val().trim().toLowerCase();
        usersList.find('li').each(function () {
            const li = $(this);
            const userName = li.find('.userNameMarker').text();

            if (userName.toLowerCase().includes(filter)) {
                li.removeClass('hide');
            }
            else {
                li.addClass('hide');
            }

        })
    })
    
    if (usersList.length == 0)
        return;
    usersList.empty();
    usersListHeaderBadge.empty();

    function updateSelectedCount() {
        const selectedCount = usersList.find('input[type="checkbox"]:checked').length;
        usersListHeaderBadge.text(selectedCount);        
    }

    if (isUserLoggedIn()) {
        // Get all users from server
        getUsers(result => {
            const users = result;
            // Sort the users array by 'name' in ascending order
            users.sort((a, b) => {
                if (a.name.toLowerCase() < b.name.toLowerCase()) return -1;
                if (a.name.toLowerCase() > b.name.toLowerCase()) return 1;
                return 0;
            });
            
            users.forEach(user => {
                if (loggedInUser.id == user.id)
                    return true;// Skip my user
                const li = $('<li/>').addClass('d-flex align-items-center border-bottom pb-3 mb-3').appendTo(usersList);
                const span = $('<span/>').appendTo(li);
                span.append(
                    $('<input/>').attr('type', 'checkbox').addClass('form-check-input m-2 pointer').attr('id', 'user_' + user.id)
                        .on('change', updateSelectedCount), // Add event listener to update selected users count
                    $('<img/>').addClass('profile_image_sm').attr('src', user.imageUrl || getDefaultProfileImage(user.gender))
                        .on('error', function () { this.src = getDefaultProfileImage(user.gender); })
                )
                $('<span/>').addClass('m-2 userNameMarker').text(user.name).appendTo(li);
            })
        });
    }
}

function fillBlockedUsersList() {
    const usersList = $('#usersList');
    const usersListHeaderBadge = $('#usersListHeaderBadge');
    const usersBlockedUsersHeader = $('#usersBlockedUsersHeader');
    usersList.empty();
    usersListHeaderBadge.empty();
    usersBlockedUsersHeader.empty();

    function updateSelectedCount() {
        const selectedCount = usersList.find('input[type="checkbox"]:checked').length;
        usersListHeaderBadge.text(selectedCount);
    }

    if (isUserLoggedIn()) {
        getBlockedUsers(result => {

            if (result.length == 0)
                usersBlockedUsersHeader.text('No blocked users');
            else {
                usersBlockedUsersHeader.text('');
                result.forEach(blockedUser => {
                    const user = blockedUser.user;
                    const li = $('<li/>').addClass('d-flex align-items-center border-bottom pb-3 mb-3').appendTo(usersList);
                    const span = $('<span/>').appendTo(li);
                    span.append(
                        $('<input/>').attr('type', 'checkbox').addClass('form-check-input m-2').attr('id', 'blocked_' + blockedUser.id) // Add an id attribute
                            .on('change', updateSelectedCount) // Add event listener
                        ,
                        $('<img/>').addClass('profile_image_sm').attr('src', user.imageUrl || getDefaultProfileImage(user.gender))
                            .on('error', function () { this.src = getDefaultProfileImage(user.gender); })
                    )
                    $('<span/>').addClass('m-2').text(user.name).appendTo(li);
                })
            }
        });
    }
}
function confirmRemoveTag(interest) {
    showConfirm('Remove tag', `Are you sure to remove "${interest.tagName}" tag?`, function () {
        deleteInterest(interest.id, function () {
            $('#errorMessage h6').text('');

            getInterests(result => {
                // Save updated interests list in local storage
                setLoggedInUserInterestsToStorage(result)

                // Update edit tags dialog list
                fillUserTags(true);

                // Update home page tags list
                fillUserTags();

                // Fill more news by updated tags when user is in home page
                if (getActivePage() == HOME_PAGE)
                    fillMoreNews();
            });

            toastSuccess('Tag removed successfully');
        })
    })
}

function handleSaveArticle(article, saveBtn) {
    if (article.id > 0)
        showInfo('This article is already saved!')
    else
        checkLoginNeeded(function () {
            getSavedArticleByReference(article.articleReference, function (result) {
                if (result.id) {
                    article.id = result.id;
                    saveBtn.removeClass('btn-outline-secondary').addClass('btn-success');
                    setTimeout(function () {
                        showInfo('This article is already saved!')
                    }, 1000);
                }
                else
                    confirmSaveArticle(article)
            })
        })
}

function confirmSaveArticle(article) {
    showQuestion('Save article', 'Are you sure you want to save this article?', function () {
        saveArticle(article);
    })
}

function saveArticle(article, onSuccess) {
    const savedArticle =
    {
        id: 0,
        articleReference: article.articleReference,
        userId: 0,
        source: {
            id: article.source.id || '',
            name: article.source.name || ''
        },
        author: article.author || '',
        title: article.title || '',
        description: article.description || '',
        url: article.url || '',
        urlToImage: article.urlToImage || '',
        publishedAt: article.publishedAt || '',
        content: article.content || '',
    };
    addSavedArticle(savedArticle, function (newArticle) {
        $('#saveArticleBtn').removeClass('btn-outline-secondary').addClass('btn-success');
        firebaseApi.trackSave(newArticle);
        // Set the new article id from the server
        article.id = newArticle.id;
        if (onSuccess)
            onSuccess(newArticle)
        else
            toastSuccess('The article saved successfully')
    })
}

function fillSavedArticlesPage() {
    // Add event listener
    $('#savedArticles_searchInput').on('keypress', function (e) {
        if (e.which === 13) { // Enter key
            runSavedArticlesSearch();
        }
    }).val(searchPaginationObj.savedArticleSearchQuery);

    $('input[name="savedArticles_periodRadio"]').prop('checked', false); // Uncheck all first if needed
    // Set the value for the period radio from the selected period option
    $(`input[name="savedArticles_periodRadio"][value="${searchPaginationObj.period}"]`).prop('checked', true);

    runSavedArticlesSearch();
}

// Fetch saved articles from server
function runSavedArticlesSearch() {
    const selectedPeriod = parseInt($('input[name="savedArticles_periodRadio"]:checked').val());
    initSearchPaginationObj($('#savedArticles_searchInput').val().trim(), null, true, selectedPeriod);
    searchPaginationObj.isLoading = true;
    showLoadingSpinner();
    hideNoMoreResults();
    setupSearchInfiniteScroll($('#footer').height(), loadSavedArticlesResults);

    getSavedArticles(
        function (result) {
            const savedArticlesTitle = $('#savedArticlesTitle');
            savedArticlesTitle.empty();
            if (result.totalRows == 0) savedArticlesTitle.text('No articles');
            else savedArticlesTitle.text(`${result.totalRows.toLocaleString()} articles were found`);

            renderArticles('savedArticlesContainer', result.list, false, true);
            searchPaginationObj.totalResults = result.totalRows;
            searchPaginationObj.hasMoreResults = result.hasMore;
            searchPaginationObj.isLoading = false;
            hideLoadingSpinner();
        },
        $('#savedArticles_searchInput').val().trim(),
        getDateBeforeDays(selectedPeriod),
        '',
        searchPaginationObj.currentPage,
        searchPaginationObj.resultsPerPage
    );
}

// For fetching more saved articles from server
function loadSavedArticlesResults() {
    if (searchPaginationObj.isLoading || !searchPaginationObj.hasMoreResults) return;
    searchPaginationObj.isLoading = true;
    searchPaginationObj.currentPage++;
    showLoadingSpinner();

    getSavedArticles(
        function (result) {
            renderArticles('savedArticlesContainer', result.list, true, true);
            searchPaginationObj.totalResults = result.totalRows;
            searchPaginationObj.hasMoreResults = result.hasMore;
            searchPaginationObj.isLoading = false;
            hideLoadingSpinner();
            if (!searchPaginationObj.hasMoreResults)
                showNoMoreResults();
        },
        searchPaginationObj.savedArticleSearchQuery,
        getDateBeforeDays(searchPaginationObj.period),
        '',
        searchPaginationObj.currentPage,
        searchPaginationObj.resultsPerPage,
    );
}

function fillSharedArticlesPage() {
    const sharedArticlesHeader = $('#sharedArticlesHeader');
    sharedArticlesHeader.empty();
    const isSharerPage = getActivePage() == SHARER_ARTICLES_PAGE;
    initSearchPaginationObj(null, null, true);
    searchPaginationObj.isLoading = true;
    showLoadingSpinner();
    hideNoMoreResults();
    setupSearchInfiniteScroll($('#footer').height(), loadMoreSharedArticlesResults);

    // Check if it's the sharer page or not
    if (isSharerPage)
        $('#sharedArticlesTitle').text('Given Articles');

    getSharedArticles(result => {

        if (result.list.length == 0)
            sharedArticlesHeader.text(isSharerPage ? 'No given articles' : 'No shared articles').show();
        else
            sharedArticlesHeader.text('').hide();

        renderArticlesWithComments('sharedArticlesContainer', result.list, false, isSharerPage);
        searchPaginationObj.totalResults = result.totalRows;
        searchPaginationObj.hasMoreResults = result.hasMore;
        searchPaginationObj.isLoading = false;
        hideLoadingSpinner();

        // Focus on notification article if exists
        const notificationSharedId = getSessionStorage('notificationSharedId');
        if (notificationSharedId) {
            focusAndBlinkArticleRow(notificationSharedId);
            delSessionStorage('notificationSharedId');
        }
    },
        searchPaginationObj.currentPage,
        searchPaginationObj.resultsPerPage,
        isSharerPage
    );
}

function focusAndBlinkArticleRow(sharedArticleId) {
    const targetRow = $(`#sharedArticleId_${sharedArticleId}`);

    if (targetRow.length) {
        // Scroll to the row
        targetRow[0].scrollIntoView({
            behavior: 'smooth',
            block: 'center'
        });

        // Blink 3 times
        let blinkCount = 0;
        const maxBlinks = 3;

        function blink() {
            if (blinkCount < maxBlinks) {
                targetRow.fadeOut(200).fadeIn(200, function () {
                    blinkCount++;
                    blink();
                });
            }
        }

        // Start blinking after a short delay
        setTimeout(blink, 300);
    }
}

function loadMoreSharedArticlesResults() {
    if (searchPaginationObj.isLoading || !searchPaginationObj.hasMoreResults) return;
    const isSharerPage = getActivePage() == SHARER_ARTICLES_PAGE;
    searchPaginationObj.isLoading = true;
    searchPaginationObj.currentPage++;
    showLoadingSpinner();

    getSharedArticles(
        function (result) {
            renderArticlesWithComments('sharedArticlesContainer', result.list, true, isSharerPage);
            searchPaginationObj.totalResults = result.totalRows;
            searchPaginationObj.hasMoreResults = result.hasMore;
            searchPaginationObj.isLoading = false;
            hideLoadingSpinner();
            if (!searchPaginationObj.hasMoreResults)
                showNoMoreResults();
        },
        searchPaginationObj.currentPage,
        searchPaginationObj.resultsPerPage,
        isSharerPage
    );
}

// Fill users management page for admin user
function fillUsersManagementPage() {
    const loggedInUser = getLoggedInUser();

    const usersManagementList = $('#usersManagementList');
    const usersManagementListHeader = $('#usersManagementListHeader');
    const usersManagement_searchInput = $('#usersManagement_searchInput');  
    usersManagementList.empty();
    usersManagementListHeader.empty();

    function updateListHeader(count) {
        if (count == 0)
            usersManagementListHeader.text('No users');
        else
            usersManagementListHeader.text(`${count.toLocaleString()} users were found`);
    }

    usersManagement_searchInput.on('keyup', function (e) {
        const filter = usersManagement_searchInput.val().trim().toLowerCase();
        let count = 0;
        usersManagementList.find('li').each(function () {
            const li = $(this);
            const userName = li.find('.userNameMarker').text();

            if (userName.toLowerCase().includes(filter)) {
                li.removeClass('hide');
                count++;
            }
            else {
                li.addClass('hide');
            }

        })
        updateListHeader(count);
    })

    getUsersMaintenance(result => {
        const users = result;
        // Sort the users array by 'name' in ascending order
        users.sort((a, b) => {
            if (a.name.toLowerCase() < b.name.toLowerCase()) return -1;
            if (a.name.toLowerCase() > b.name.toLowerCase()) return 1;
            return 0;
        });

        const li = $('<li/>').addClass('d-flex align-items-center justify-content-between border-bottom pb-3 mb-3').appendTo(usersManagementList);
        const headerSpan1 = $('<span/>').appendTo(li);
        const headerSpan2 = $('<span/>').appendTo(li);
        $('<b />').addClass('mt-0').text('User').appendTo(headerSpan1);
        $('<b />').addClass('mt-0 me-2').text('Login / Share').appendTo(headerSpan2);        

        users.forEach(user => {
            if (loggedInUser.id == user.id)
                return true;// skip my user
            const li = $('<li/>').addClass('d-flex align-items-center justify-content-between border-bottom pb-3 mb-3').appendTo(usersManagementList);
            const span = $('<span/>').appendTo(li);
            span.append(
                $('<img/>').addClass('profile_image_sm').attr('src', user.imageUrl || getDefaultProfileImage(user.gender))
                    .on('error', function () { this.src = getDefaultProfileImage(user.gender); })
            )
            $('<span/>').addClass('m-2 userNameMarker').text(user.name).appendTo(span);
            if (user.offensivesCount > 0)
                $('<span/>').addClass('m-2 text-danger font_13').text(`${user.offensivesCount} offensive reported`).appendTo(span);
            const blockLoginCssClass = user.isLoginBlocked ? 'btn-primary' : 'btn-outline-secondary';
            const blockShareCssClass = user.isShareBlocked ? 'btn-primary' : 'btn-outline-secondary';

            const btnsSpan = $('<span/>').addClass('d-flex font_13 mt-1').appendTo(li);
            // Block login button
            $('<div/>').addClass(`me-3 btn ${blockLoginCssClass} btn-sm`).attr('id', 'shareArticleBtn')
                .on('click', function () {
                    const btn = $(this);
                    const isLoginBlocked = !user.isLoginBlocked;
                    showConfirm(isLoginBlocked ? 'Block login' : 'Unblock login',
                        isLoginBlocked ? `are you sure you want to block ${user.name} from logging in?` :
                            `Are you sure you want to unblock ${user.name} from logging in?`,
                        function () {
                            blockUser(user.id, isLoginBlocked, user.isShareBlocked, function () {
                                user.isLoginBlocked = isLoginBlocked;
                                btn.toggleClass('btn-primary btn-outline-secondary')
                                toastSuccess(isLoginBlocked ? 'Blocked login successfully' : 'UnBlocked login successfully')
                            })
                        })
                })
                .append(createIcon('bi-lock', '16px')).appendTo(btnsSpan);
            // Block share button
            $('<div/>').addClass(`me-3 btn ${blockShareCssClass} btn-sm`).attr('id', 'saveArticleBtn')
                .on('click', function () {
                    const btn = $(this);
                    const isShareBlocked = !user.isShareBlocked;

                    showConfirm(isShareBlocked ? 'Block share' : 'Unblock share',
                        isShareBlocked ? `are you sure you want to block ${user.name} from sharing?` :
                            `Are you sure you want to unblock ${user.name} from sharing?`,
                        function () {
                            blockUser(user.id, user.isLoginBlocked, isShareBlocked, function () {
                                user.isShareBlocked = isShareBlocked;
                                btn.toggleClass('btn-primary btn-outline-secondary');
                                toastSuccess(isShareBlocked ? 'Blocked share successfully' : 'UnBlocked share successfully');
                            })
                        })
                })
                .append(createIcon('bi-lock', '16px')).appendTo(btnsSpan);
        })
        updateListHeader(result.length); 
    });
}

function handleSharedArticleIsOffensive(sharedArticle, btn) {
    const isOffensive = !sharedArticle.isOffensive;
    const question = isOffensive ? 'Mark this comment as offensive?' : 'Unmark this comment as offensive?'
    showQuestion('Offensive comments', question, function () {
        updateSharedArticleOffensive(sharedArticle.id, isOffensive, function () {
            sharedArticle.isOffensive = isOffensive;
            btn.toggleClass('btn-outline-secondary btn-warning');
            btn.find('i').toggleClass('bi-emoji-smile bi-emoji-frown');
            firebaseApi.trackOffensive(isOffensive, sharedArticle.article);
        });
    })
}

// Block user from sharing articles with the logged in user
function handleSharedArticleBlockUser(sharedArticle) {
    showQuestion('Block user', `Are you sure you want to block ${sharedArticle.sharerUserName} from posting articles with you?`, function () {
        addBlockedUser(sharedArticle.userId, function () {
            toastSuccess(`${sharedArticle.sharerUserName} blocked successfully`);
            // refresh shared articles with out the current blocked user articles
            fillSharedArticlesPage();
        })
    })
}

function handleSharedArticleLike(sharedArticle, btn) {
    // Check if the current action is like or unlike (toggle button)
    const isLike = !sharedArticle.isLike;
    updateSharedArticleLike(sharedArticle.id, isLike, function () {
        // Set the updated isLike field for future use
        sharedArticle.isLike = isLike;
        // Replace the current icon on the button and change the color properly
        btn.find('i').toggleClass('bi-heart bi-heart-fill').css('color', isLike ? '#d63813' : '');
        firebaseApi.trackLike(isLike, sharedArticle);
    });
}

// For sharing 
function handleSharedArticleShare(sharedArticle, btn) {
    openNewsDialog('ShareArticle/ShareArticle', function () {
        // Reset the article id and the user id because the article belongs to the sharer
        getSavedArticleByReference(sharedArticle.article.articleReference, function (result) {
            let article = null; 
            if (result.id) {
                // Use the logged in user saved article's details
                article = { ...sharedArticle.article, id: result.id, userId: result.userId };
            }
            else {
                // Use with new article details
                article = { ...sharedArticle.article, id: 0, userId: 0 };
            }
            initShareArticlePanel(article, function (sharedUsersCount) {
                // Update the shares count manually for not accessing the server again
                const sharesCount = (sharedArticle.article.sharesCount || 0) + sharedUsersCount;
                sharedArticle.article.sharesCount = sharesCount;
                btn.find('.badge').text(sharesCount).show();
            });
        });
    });
}

function fillAdminDashboardPage() {
    const dashboard = new NewsDashboard();
}

// Load most article data from firebase and render to the page
async function fillMostArticles() {
    const mostArticles = await firebaseApi.loadTopArticles();
    if (mostArticles) {
        renderArticles('mostViewedContainer', mostArticles.reads, false, false);
        renderArticles('mostCommentedContainer', mostArticles.shares, false, false);
        renderArticles('recentsContainer', mostArticles.recents, false, false);
    }
}

// Save the search input as a user tag
function saveSearchToUserTags() {
    const newTagName = $('#searchPage_searchInput').val().trim();
    if (newTagName.length < 2) {
        toastError('Tag name must be at least 2 letters long!');
        return;
    }

    // Check if the tag name is already saved
    let formIsValid = true;
    $('.tagNameMarker').each(function () {
        if ($(this).text().toLowerCase() == newTagName.toLowerCase()) {
            toastError('Tag name already exists!');
            formIsValid = false;
        }
    })
    if (!formIsValid)
        return;

    showConfirm('Save as tag', `Add "${newTagName}" to your tags?`, function () {
        addInterest(newTagName, function (result) {
            // register success, go back to login page
            toastSuccess('Tag added successfully');

            getInterests(result => {
                // Save updated interests list in local storage
                setLoggedInUserInterestsToStorage(result)

                // Update home page tags list
                fillUserTags();
            });

        }, function (result) {
            toastError('Tag name already exists!');
        })
    });
}

// Read statistic counters from firebase and display it in the page
async function fillHomeCounters() {
    const stats = await firebaseApi.loadCounters();
    animateStatisticNumbers(stats);
}