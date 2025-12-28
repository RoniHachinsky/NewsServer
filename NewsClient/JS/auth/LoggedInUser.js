const LOGGED_IN_USER_STORAGE_KEY = 'loggedInUser';
const USER_TOKEN_STORAGE_KEY = 'userToken';
const USER_INTERESTS_STORAGE_KEY = 'userInterests';
const GENDER_MALE = 1;
const GENDER_FEMALE = 2;

// Set the logged in user email to the local storage
function setLoggedInUser(loggedInUserResult, keepLoggedIn) {
    setLoggedOutUser();

    if (keepLoggedIn) {
        setLocalStorage(LOGGED_IN_USER_STORAGE_KEY, loggedInUserResult.user);
        setLocalStorage(USER_TOKEN_STORAGE_KEY, loggedInUserResult.token);
        setLocalStorage(USER_INTERESTS_STORAGE_KEY, loggedInUserResult.interests);
    }
    else {
        setSessionStorage(LOGGED_IN_USER_STORAGE_KEY, loggedInUserResult.user);
        setSessionStorage(USER_TOKEN_STORAGE_KEY, loggedInUserResult.token);
        setSessionStorage(USER_INTERESTS_STORAGE_KEY, loggedInUserResult.interests);
    }
}

// update the logged in user in storage
function updateLoggedInUser(user) {
    if (getLocalStorage(LOGGED_IN_USER_STORAGE_KEY)) {
        setLocalStorage(LOGGED_IN_USER_STORAGE_KEY, user);
    } else if (getSessionStorage(LOGGED_IN_USER_STORAGE_KEY)) {
        setSessionStorage(LOGGED_IN_USER_STORAGE_KEY, user);
    }
}

// Clear the logged in user email from the local storage
function setLoggedOutUser() {
    delLocalStorage(LOGGED_IN_USER_STORAGE_KEY);
    delLocalStorage(USER_TOKEN_STORAGE_KEY);
    delLocalStorage(USER_INTERESTS_STORAGE_KEY);
    delSessionStorage(LOGGED_IN_USER_STORAGE_KEY);
    delSessionStorage(USER_TOKEN_STORAGE_KEY);
    delSessionStorage(USER_INTERESTS_STORAGE_KEY);
}

// Get the logged in user from the local storage 
function getLoggedInUser() {
    return getLocalStorage(LOGGED_IN_USER_STORAGE_KEY) ||
        getSessionStorage(LOGGED_IN_USER_STORAGE_KEY);
}

function getUserToken() {
    return getLocalStorage(USER_TOKEN_STORAGE_KEY) || getSessionStorage(USER_TOKEN_STORAGE_KEY);
}

// Check if the user is logged in, otherwise redirect to the login page
function isUserLoggedIn() {
    const userToken = getUserToken();
    if (!userToken) {
        // open login prompt
        false;
    }
    return userToken;
}

// Remove the logged in user from storage
function logoutUser() {
    setLoggedOutUser();
}

// If the token is saved in the local storage then keep login
function isKeepLoggedIn() {
    return getLocalStorage(USER_TOKEN_STORAGE_KEY) != null;
}

function checkUserLoggedIn() {
    const userToken = getUserToken();
    // If userToken saved in local or session storage, try to login with userToken 
    if (userToken) {
        loginUser({ email: '', password: '' },
            function (result) {
                setLoggedInUser(result, isKeepLoggedIn());
                firebaseApi.trackLogin(result.user);
                updateLoggedInUserElements(result.user, false);
            },
            function () {
                setLoggedOutUser();
                clearLoggedInUserElements();
            }
        )
    }
    else
        clearLoggedInUserElements();
}

function getDefaultProfileImage(gender) {
    return gender == GENDER_MALE ? 'image/male.png' : 'image/female.png';
}

function updateLoggedInUserElements(user, isAfterUserLoggedIn) {
    $("#userLoginMenuItem").hide();
    $("#userProfileMenuItem").show();
    $("#userTagsMenuItem").show();
    $("#blockedUsersMenuItem").show();
    $("#userLogoutMenuItem").show();

    if (user.isAdmin)
        $("#adminMenuItem").show();
    else
        $("#adminMenuItem").hide();

    $('.userNameMarker').text(user.name);
    if (user.imageUrl)
        $('.userProfileImageMarker').attr('src', user.imageUrl)
            .on('error', function () { this.src = getDefaultProfileImage(user.gender); });
    else
        $('.userProfileImageMarker').attr('src', getDefaultProfileImage(user.gender));

    $('.loginLinkMarker').addClass('hide');
    $('.loggedInUserLinkMarker').removeClass('hide');

    updateLoggedInUserAvatar();

    if (isAfterUserLoggedIn) {
        fillUserTags();
        if (getActivePage() == HOME_PAGE)
            fillMoreNews();
    }
}

// For the logged in user
async function updateLoggedInUserAvatar() {
    const starsContainer = $('.userProfileAvatarMarker');
    starsContainer.empty();
    const loggedInUser = getLoggedInUser();
    if (!loggedInUser) return;
    const userAvatar = await firebaseApi.getUserAvatar(loggedInUser.id) || { level: 1, xp: 0 };
    addAvatarStars(userAvatar.level, starsContainer);
}

// For all other users
async function setUserAvatar(userId, starsContainer) {
    starsContainer.empty();
    const userAvatar = await firebaseApi.getUserAvatar(userId) || { level: 1, xp: 0 };
    if (userAvatar) {
        addAvatarStars(userAvatar.level, starsContainer);
    }
    return userAvatar;
}

// For painting the stars
function addAvatarStars(level, starsContainer) {
    starsContainer.empty();
    for (let i = 1; i <= FirebaseApi.Avatar.MAX_AVATAR_LEVEL; i++) {
        const starClass = i <= level ? 'star filled' : 'star empty';
        starsContainer.append(`<span class="${starClass}"></span>`);
    }
}

function clearLoggedInUserElements() {
    $('.loginLinkMarker').removeClass('hide')
    $('.loggedInUserLinkMarker').addClass('hide')

    $("#userLoginMenuItem").show();
    $("#userProfileMenuItem").hide();
    $("#userTagsMenuItem").hide();
    $("#blockedUsersMenuItem").hide();
    $("#userLogoutMenuItem").hide();
    $("#adminMenuItem").hide();


    $('.userNameMarker').text();
    $('.userProfileImageMarker').attr('src', '');
    clearUserTags();
    $('.stars-container').empty();
    // Hide notification bell badge counter
    $('.userBadgeMarker').hide().html('');
}

function displayNotification(notification) {
    // Build the message according to the notification type
    const message = notification.type == 'like' ?
        `You received a new post from ${notification.userName}` :
        `You received a new like from ${notification.userName}`;
    // Build the message icon according to the notification type
    const messageIcon = notification.type == 'like' ? 'bi-heart-fill' : 'bi-share'
    const icon = `<i class="bi ${messageIcon} text_orange me-2"></i>`;
    // Build the toast message that'll be shown to the logged in user
    const toastMessage = `${new Date(notification.timestamp).toLocaleString()} <br/> ${icon} ${message}`;
    toastInfo(toastMessage);
    // Increase badge count by one
    updateUserBadge(1);

    // Build the notification text
    const liText = notification.type == 'like' ?
        `${notification.userName} liked your post` :
        `${notification.userName} shared a post with you`;

    const notificationsDropdowns = $('.notificationsDropdownMarker');

    // Relate to 2 notifications dropdowns in the index page. one for desktop screen and one for mobile screen
    notificationsDropdowns.each(function () {
        const dropdown = $(this);
        const message_li = $('<li/>').addClass('dropdown-item pointer').text(liText)
            .on('click', function () {
                setSessionStorage('notificationSharedId', notification.sharedId);

                firebaseApi.handleNotificationDismiss(notification.key);
                updateUserBadge(-1);
                message_li.remove();
                if (notification.type == 'share')
                    loadCenterPage(SHARED_ARTICLES_PAGE);
                else if (notification.type == 'like')
                    loadCenterPage(SHARER_ARTICLES_PAGE);
            });
        // Newest item first (in top)
        message_li.prepend(icon);
        dropdown.prepend(message_li);
    });
}

// For incoming notifications
function updateUserBadge(increaseBy) {
    const badge = $('.userBadgeMarker');
    const count = parseInt(badge.html().trim() || 0) + parseInt(increaseBy);
    if (count > 0)
        $('.userBadgeMarker').show().text(count);
    else
        $('.userBadgeMarker').hide().text(count);
}

function getLoggedInUserInterestsFromStorage() {
    return getLocalStorage(USER_INTERESTS_STORAGE_KEY) || getSessionStorage(USER_INTERESTS_STORAGE_KEY);
}

function setLoggedInUserInterestsToStorage(interests) {
    if (isKeepLoggedIn()) {
        setLocalStorage(USER_INTERESTS_STORAGE_KEY, interests);
    }
    else {
        setSessionStorage(USER_INTERESTS_STORAGE_KEY, interests);
    }
}