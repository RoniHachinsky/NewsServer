const HOME_PAGE = 1;
const SEARCH_PAGE = 2;
const CATEGORY_PAGE = 3;
const ARTICLE_DETAILS_PAGE = 4;
const SAVED_ARTICLES_PAGE = 5;
const SHARED_ARTICLES_PAGE = 6; // Page for articles other users has shared with the logged in user
const SHARER_ARTICLES_PAGE = 7; // Page for articles the user has shared with other users
const USERS_MANAGEMENT_PAGE = 8;
const ADMIN_DASHBOARD_PAGE = 9;

function getActivePage() {
    return getSessionStorage('activePage')
}

function getLastActivePage() {
    return getSessionStorage('lastActivePage')
}
function loadActivePage() {
    const activePage = getSessionStorage('activePage') || HOME_PAGE;
    // For using navigate back
    const lastActivePage = getSessionStorage('lastActivePage') || HOME_PAGE;
    setSessionStorage('activePage', lastActivePage);
    loadCenterPage(activePage);
}

function loadCenterPage(page) {
    $(window).off('scroll');
    
    setSessionStorage('lastActivePage', getSessionStorage('activePage') || page);
    setSessionStorage('activePage', page);
    
    switch (page) {
        case HOME_PAGE:
            changeMainMenu($('#homeMenuItem'));
            loadHtmlPage("Home/Home", "centerPagePlaceHolder", fillHomePage);
            break;
        case SEARCH_PAGE:
            changeMainMenu($('#homeMenuItem'));
            loadHtmlPage("Search/Search", "centerPagePlaceHolder", fillSearchPage);
            break;
        case CATEGORY_PAGE:
            changeMainMenu($('#categoryMenuItem'));
            loadHtmlPage("Category/Category", "centerPagePlaceHolder", fillCategoryPage);
            break;
        case ARTICLE_DETAILS_PAGE:
            loadHtmlPage("ArticleDetails/ArticleDetails", "centerPagePlaceHolder", fillArticleDetailsPage);
            break;
        case SAVED_ARTICLES_PAGE:
            changeMainMenu($('#articlesMenuItem'));
            checkLoginNeeded(function () { loadHtmlPage("SavedArticles/SavedArticles", "centerPagePlaceHolder", fillSavedArticlesPage); });
            break;
        case SHARED_ARTICLES_PAGE:
        case SHARER_ARTICLES_PAGE:
            changeMainMenu($('#articlesMenuItem'));
            checkLoginNeeded(function () { loadHtmlPage("SharedArticles/SharedArticles", "centerPagePlaceHolder", fillSharedArticlesPage); });
            break;
        case USERS_MANAGEMENT_PAGE:
            changeMainMenu($('#adminMenuItem'));
            loadHtmlPage("UsersManagement/UsersManagement", "centerPagePlaceHolder", fillUsersManagementPage);
            break;
        case ADMIN_DASHBOARD_PAGE:
            changeMainMenu($('#adminMenuItem'));
            loadHtmlPage("AdminDashboard/AdminDashboard", "centerPagePlaceHolder", fillAdminDashboardPage);
            break;
    }
}

function changeMainMenu(menuItem) {
    if (menuItem) {
        if (menuItem.find('a').first().hasClass("active")) return false;
        const mainMenu = $('#mainMenu');
        mainMenu.find('li').find('a').removeClass('active');
        menuItem.find('a').first().addClass("active");
    }
    return true;
}

function navigateBack() {
    const activePage = getActivePage();
    const lastActivePage = getLastActivePage()
    const navigateToPage = activePage == lastActivePage ? HOME_PAGE : (lastActivePage || HOME_PAGE);
    loadCenterPage(navigateToPage);
}