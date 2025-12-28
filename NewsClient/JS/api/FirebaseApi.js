const TOP_ARTICLES_LIMIT = 9;

// FirebaseApi.js Module
class FirebaseApi {
    constructor() {
        this.app = null;
        this.database = null;
        this.isInitialized = false;
        this.currentUser = null;
        this.chart = null;
        this.onDisplayNotification = null;
        this.onLoggedInUserAvatarUpdated = null;
    }

    // Initialize Firebase
    init({ onDisplayNotification, onLoggedInUserAvatarUpdated }) {
        // Confguration copied from firebase
        const firebaseConfig = {
            apiKey: "AIzaSyAbkjlul2cTSOKX94UJ_3ipct_Dy6NFc6A",
            authDomain: "newspapertracking-6af2c.firebaseapp.com",
            databaseURL: "https://newspapertracking-6af2c-default-rtdb.europe-west1.firebasedatabase.app",
            projectId: "newspapertracking-6af2c",
            storageBucket: "newspapertracking-6af2c.firebasestorage.app",
            messagingSenderId: "569083290214",
            appId: "1:569083290214:web:fe01d63c7903d2bc2ec3a7",
            measurementId: "G-C4YYTMRK59"
        };

        try {
            this.app = firebase.initializeApp(firebaseConfig);
            this.database = firebase.database();
            this.isInitialized = true;
            this.onDisplayNotification = onDisplayNotification;
            this.onLoggedInUserAvatarUpdated = onLoggedInUserAvatarUpdated;
            //Firebase initialized successfully
            return true;
        } catch (error) {
            console.error('Firebase initialization error:', error);
            return false;
        }
    }

    // Track user login
    async trackLogin(user) {
        if (!this.isInitialized) return false;

        this.currentUser = user;

        const loginData = {
            userId: user.id,
            userEmail: user.email,
            userName: user.name,
            userImageUrl: user.imageUrl,
            timestamp: firebase.database.ServerValue.TIMESTAMP, // The time now
        };

        try {
            await this.database.ref('tracking/logins').push(loginData);
            
            // Set user's status to online
            await this.database.ref(`users/${loginData.userId}/status`).set('online');

            // Assign a notification listener for recieving notifications
            this.setUserNotifications();
            return true;
        } catch (error) {
            console.error('Error tracking login:', error);
            return false;
        }
    }

    // Add tracking for article by the given path (reads, shares or likes)
    async addTracking(article, path) {
        if (!this.isInitialized)  return false;

        const data = {
            userId: this.currentUser ? this.currentUser.id : '',
            article: article
        };

        try {
            // Add tracking for data in statistic counters
            await this.database.ref(`tracking/${article.articleReference}/${path}`).transaction(current => (current || 0) + 1);
            // Add tracking for with timestamps for data in activity graph
            await this.database.ref(`tracking/${article.articleReference}/timestamps/${path}`).transaction(timestamps => {
                if (!timestamps)
                    timestamps = [];
                // Accumulate all timestamps for the specific activity
                timestamps.push(firebase.database.ServerValue.TIMESTAMP);
                return timestamps;
            });

            const ref = this.database.ref(`tracking/${article.articleReference}/data`);
            const snapshot = await ref.once('value');
            // Add the article to firebase only once (if it does not exist)
            if (!snapshot.exists()) {
                await ref.set(data);
            }

            return true;
        } catch (error) {
            console.error(`Error tracking ${path}:`, error);
            return false;
        }
    }

    // Track fetching news records
    async trackDownloads() {
        if (!this.isInitialized) return false;

        const readData = {
            timestamp: firebase.database.ServerValue.TIMESTAMP,
        };

        try {
            // Tracking for downloads of news with the time they were downloaded
            await this.database.ref('tracking/downloads').push(readData);
            // Read tracked successfully
            return true;
        } catch (error) {
            console.error('Error tracking read:', error);
            return false;
        }
    }

    // Track read record
    async trackRead(article) {
        await this.addTracking(article, 'reads');
        // Update user's avatar details
        if (this.currentUser) this.updateUserAvatarAction(this.currentUser.id, FirebaseApi.Avatar.READ_ACTION);
    }

    // Track save records
    async trackSave(article) {
        await this.addTracking(article, 'saves');
        this.updateUserAvatarAction(this.currentUser.id, FirebaseApi.Avatar.SAVE_ACTION);
    }

    // Track likes
    async trackLike(isLike, sharedArticle) {
        if (!this.isInitialized) return false;
        const article = sharedArticle.article;
        try {
            if (isLike) {
                this.addTracking(article, 'likes');
                // Add avatar xp to the user who sends the like and to the user who receives the like
                this.updateUserAvatarAction(this.currentUser.id, FirebaseApi.Avatar.SEND_LIKE_ACTION);
                this.updateUserAvatarAction(article.userId, FirebaseApi.Avatar.RECEIVE_LIKE_ACTION);
                // Trigger real-time notification
                await this.sendNotification(article.userId, sharedArticle.id, 'like');
            }
            else {
                // Only for statistics
                await this.database.ref(`tracking/${article.articleReference}/likes`).transaction(current => (current || 0) - 1);
            }
            return true;
        } catch (error) {
            console.error('Error tracking like:', error);
            return false;
        }
    }

    // Track offensive
    async trackOffensive(isOffensive, sharedArticle) {
        if (!this.isInitialized) return false;

        try {
            if (isOffensive) {
                this.addTracking(sharedArticle, 'offensives');
                // Add avatar xp to the user who sends the offensive and decrease avatar xp to the user who receives the offensive
                this.updateUserAvatarAction(this.currentUser.id, FirebaseApi.Avatar.SEND_OFFENSIVE_ACTION);
                this.updateUserAvatarAction(sharedArticle.userId, FirebaseApi.Avatar.RECEIVE_OFFENSIVE_ACTION);
            }
            else {
                // Only for statistics
                await this.database.ref(`tracking/${sharedArticle.articleReference}/offensives`).transaction(current => (current || 0) - 1);
            }

            return true;
        } catch (error) {
            console.error('Error tracking offensive:', error);
            return false;
        }
    }

    // Track share
    async trackShare(sharedArticle, article) {
        if (!this.isInitialized) return false;

        try {
            this.addTracking(article, 'shares');
            // Add avatar xp to the user who sends the share and to the user who receives the share
            this.updateUserAvatarAction(this.currentUser.id, FirebaseApi.Avatar.SEND_SHARE_ACTION);
            this.updateUserAvatarAction(sharedArticle.sharedUserId, FirebaseApi.Avatar.RECEIVE_SHARE_ACTION);

            // Trigger real-time notification
            await this.sendNotification(sharedArticle.sharedUserId, sharedArticle.id, 'share');
            return true;
        } catch (error) {
            console.error('Error tracking share:', error);
            return false;
        }
    }

    // Load statistics for all tracking logs
    async loadStatistics() {
        if (!this.isInitialized) return null;

        try {
            const stats = {
                // Users
                dailyVisits: 0,
                onlineUsers: 0,
                totalLogins: 0,
                totalUsers: 0,
                // Tracking
                newsDownloads: 0,
                newsRead: 0,
                newsSaved: 0,
                newsLiked: 0,
                newsShared: 0,
                newsOffensived: 0,
                // Activities
                downloadsData: [],
                readData: [],
                savedData: [],
                likedData: [],
                sharedData: [],
                offensivedData: [],
            };

            const today = new Date().toDateString();

            // Fetch logins
            const loginsSnapshot = await this.database.ref('tracking/logins').once('value');
            if (loginsSnapshot.exists()) {
                const logins = loginsSnapshot.val();
                // Count of daily logins
                stats.dailyVisits = Object.values(logins).filter(login => {
                    const loginDate = new Date(login.timestamp).toDateString();
                    return loginDate == today;
                }).length;
                // Count of logins in total
                stats.totalLogins = Object.keys(logins).length;
            }

            // Fetch all statistics and users in one go
            const [usersSnapshot, trackingSnapshot] = await Promise.all([
                this.database.ref('users').once('value'),
                this.database.ref('tracking').once('value')
            ]);

            if (usersSnapshot.exists()) {
                const users = usersSnapshot.val();
                const usersArray = Object.values(users);

                // Count of total users
                stats.totalUsers = usersArray.length;

                // Count online users
                stats.onlineUsers = usersArray.filter(user => {
                    return user.status === 'online';
                }).length;
            }

            // Function to get statistic data
            const getStatisticData = (dataArray, path) => {
                let count = 0;
                const all = [];
                dataArray.forEach(data => {
                    if (data[path]) {
                        count += data[path];
                    }
                    if (data.timestamps && data.timestamps[path]) {
                        data.timestamps[path].forEach(timestamp => {
                            all.push(timestamp);
                        })
                    }
                })
                return { count, all };
            }

            if (trackingSnapshot.exists()) {
                const trackingData = trackingSnapshot.val();
                const trackingArray = Object.values(trackingData);                

                // Get all downloads timestamps to calculate the count and to show the activity according to the timestamps
                const downloadsArray = Object.values(trackingData.downloads).map(item => item.timestamp);
                stats.newsDownloads = downloadsArray.length;
                stats.downloadsData = this.convertToGroupByDaysArray(downloadsArray);

                // Get all reads timestamps to calculate the count and to show the activity according to the timestamps
                const readStat = getStatisticData(trackingArray, 'reads');
                stats.newsRead = readStat.count;
                stats.readData = this.convertToGroupByDaysArray(readStat.all);

                // Get all saves timestamps to calculate the count and to show the activity according to the timestamps
                const savedStat = getStatisticData(trackingArray, 'saves');
                stats.newsSaved = savedStat.count;
                stats.savedData = this.convertToGroupByDaysArray(savedStat.all);

                // Get all likes timestamps to calculate the count and to show the activity according to the timestamps
                const likedStat = getStatisticData(trackingArray, 'likes');
                stats.newsLiked = likedStat.count;
                stats.likedData = this.convertToGroupByDaysArray(likedStat.all);

                // Get all shares timestamps to calculate the count and to show the activity according to the timestamps
                const sharedStat = getStatisticData(trackingArray, 'shares');
                stats.newsShared = sharedStat.count;
                stats.sharedData = this.convertToGroupByDaysArray(sharedStat.all);

                // Get all offensives timestamps to calculate the count and to show the activity according to the timestamps
                const offensivedStat = getStatisticData(trackingArray, 'offensives');
                stats.newsOffensived = offensivedStat.count;
                stats.offensivedData = this.convertToGroupByDaysArray(offensivedStat.all);
            }

            return stats;
        } catch (error) {
            console.error('Error loading statistics:', error);
            return null;
        }
    }

    // Load statistics for counters in home page
    async loadCounters() {
        if (!this.isInitialized) return null;

        try {
            const stats = {
                // Counters
                savesCounter: 0,
                likesCounter: 0,
                sharesCounter: 0,
                offensivesCounter: 0
            };

            // Fetch all statistics and users in one go
            const trackingSnapshot = await this.database.ref('tracking').once('value');

            const getStatisticCount = (dataArray, path) => {
                let count = 0;
                dataArray.forEach(data => {
                    if (data[path]) {
                        count += data[path];
                    }
                })
                return count;
            }

            if (trackingSnapshot.exists()) {
                const trackingData = trackingSnapshot.val();
                const trackingArray = Object.values(trackingData);

                stats.savesCounter = getStatisticCount(trackingArray, 'saves'); 
                stats.likesCounter = getStatisticCount(trackingArray, 'likes');
                stats.sharesCounter = getStatisticCount(trackingArray, 'shares');
                stats.offensivesCounter = getStatisticCount(trackingArray, 'offensives');
            }
            return stats;
        } catch (error) {
            console.error('Error loading statistic counters:', error);
            return null;
        }
    }

    // For summing up activities per day
    convertToGroupByDaysArray(data) {
        if (data) {
            // Sort array by timestamps in a descending order
            const dataArray = data.sort((a, b) => b.timestamp - a.timestamp);
            if (dataArray.length > 0) {

                // Group by day
                const groupedByDay = {};

                dataArray.forEach(timestamp => {
                    const date = new Date(timestamp);
                    const dayStr = date.toISOString().slice(0, 10); // e.g., "2025-07-21"

                    if (!groupedByDay[dayStr]) {
                        groupedByDay[dayStr] = 0;
                    }
                    groupedByDay[dayStr] += 1;
                });

                // Convert grouped data to an object array
                const result = Object.entries(groupedByDay).map(([day, count]) => ({
                    day,
                    count
                }));

                return result;
            }
        }
        return [];
    }

    // Load most read, shared and recents articles
    async loadTopArticles() {        
        if (!this.isInitialized) return null;

        try {
            const articles = {
                // For most viewed
                reads: [],
                // For most commented
                shares: [],
                // For recently read
                recents: [],
            };

            // Fetch top 9 articles for each metric from the same tracking data
            const trackingSnapshot = await this.database.ref('tracking').once('value');
            if (trackingSnapshot.exists()) {
                const trackingData = trackingSnapshot.val();

                // Top 9 most read articles 
                const readsArray = Object.values(trackingData)
                    .filter((data) => data.reads)
                    .map((data) => ({                        
                        reads: data.reads,
                        article: data.data.article
                    }))
                    // Sort by reads count
                    .sort((a, b) => b.reads - a.reads)
                    // Slice only the top 9
                    .slice(0, TOP_ARTICLES_LIMIT);
                
                readsArray.forEach(({ reads, article }) => {
                    articles.reads.push({ ...article, readsCount: reads, id: 0, userId: 0 });
                });

                const sharesArray = Object.values(trackingData)
                    .filter((data) => data.shares)
                    .map((data) => ({
                        shares: data.shares,
                        article: data.data.article
                    }))
                    .sort((a, b) => b.shares - a.shares)
                    .slice(0, TOP_ARTICLES_LIMIT);

                sharesArray.forEach(({ shares, article }) => {
                    articles.shares.push({ ...article, sharesCount: shares, id: 0, userId: 0 });
                });

                const trackingArray = Object.values(trackingData);
                const allReadsTimestamps = [];
                trackingArray.forEach(data => {                    
                    if (data.timestamps && data.timestamps.reads) {
                        data.timestamps.reads.forEach(timestamp => {
                            allReadsTimestamps.push({ timestamp, article: data.data.article });
                        })
                    }
                })
                const allReadsTimestampsSorted = allReadsTimestamps.sort((a, b) => b.timestamp - a.timestamp);

                // Top 9 most recent read articles
                const seenReferences = new Set();
                const uniqueArticles = [];
                for (const data of allReadsTimestampsSorted) {
                    // Bring only unique articles
                    if (!seenReferences.has(data.article.articleReference)) {
                        seenReferences.add(data.article.articleReference);
                        uniqueArticles.push(data.article);
                        if (uniqueArticles.length === TOP_ARTICLES_LIMIT) break;
                    }
                }
                uniqueArticles.forEach(article => articles.recents.push({ ...article, id: 0, userId: 0 }));
            }
            return articles;

        } catch (error) {
            console.error('Error loading top articles:', error);
            return null;
        }
    }

    async setUserNotifications() {
        if (!this.isInitialized) return null;

        try {
            this.notificationsRef = this.database.ref('notifications');
            // Listen for notifications
            this.notificationsRef.on('child_added', (snapshot) => {
                const notification = snapshot.val();
                // Check if the notification is assigned to the logged in user
                if (this.currentUser && this.currentUser.id == notification.notifyToUserId) {
                    // Save notification for display
                    // Add key for dismissing the notification
                    const userNotification = { ...notification, key: snapshot.key };
                    // display Notification to user
                    this.onDisplayNotification(userNotification);
                }
            });

        } catch (error) {
            console.error('Error loading statistics:', error);
            return null;
        }
    }

    async handleNotificationDismiss(notificationKey) {
        if (notificationKey) {
            const notificationRef = this.database.ref('notifications/' + notificationKey);
            try {
                // Clear the displayed notification
                await notificationRef.remove();
            } catch (error) {
                console.error('Error removing notification:', error);
            }
        }
    }
    
    // Send notification
    // Possible types: like, share 
    async sendNotification(notifyToUserId, sharedId, type) {
        if (!this.isInitialized) return;

        const notification = {
            sharedId,
            userName: this.currentUser.name,
            notifyToUserId ,
            type,
            timestamp: firebase.database.ServerValue.TIMESTAMP
        };

        try {
            await this.database.ref('notifications').push(notification);
        } catch (error) {
            console.error('Error sending notification:', error);
        }
    }

    // Set user offline manually
    async setUserOffline(userId) {
        if (!this.isInitialized) return;

        try {
            await this.database.ref(`users/${userId}/status`).set('offline');
        } catch (error) {
            console.error('Error setting user offline:', error);
        }
    }

    // user logout 
    logout() {
        if (!this.isInitialized) return false;

        // Set current user offline if exists
        if (this.currentUser && this.currentUser.id) {
            this.setUserOffline(this.currentUser.id);
        }
        // Turn off child added event on logout
        if (this.notificationsRef && this.notificationsRef.off) {
            this.notificationsRef.off();
        }
        this.currentUser = null;
    }

    async updateUserAvatarAction(userId, action) {
        if (!this.isInitialized) return;
        try {
            await this.database.ref(`users/${userId}/avatar`).transaction(prevAvatar => {
                const avatar = (prevAvatar || { xp: 0, level: 1 })
                // Add action's xp
                avatar.xp += FirebaseApi.Avatar.getActionXp(action);
                // Update avatar level
                avatar.level = FirebaseApi.Avatar.getAvatarLevel(avatar.xp);
                // Sets new avatar value
                return avatar;
            });
            // Refresh avatar icon if the user is logged in
            if (this.currentUser && this.currentUser.id == userId)
                this.onLoggedInUserAvatarUpdated();
        } catch (error) {
            console.error('Error setting user avatar:', error);
        }
    }

    // For getting any user's avatar
    async getUserAvatar(userId) {
        if (!this.isInitialized) return;
        try {
            const userAvatarSnapshot = await this.database.ref(`users/${userId}/avatar`).once('value');
            if (userAvatarSnapshot.exists()) {
                const avatar = userAvatarSnapshot.val();
                return avatar;
            }
            return null;
        } catch (error) {
            console.error('Error setting user avatar:', error);
        }

    }

    static Avatar = {
        // Constants for actions
        READ_ACTION: 1,
        SAVE_ACTION: 2,
        SEND_LIKE_ACTION: 3,
        RECEIVE_LIKE_ACTION: 4,
        SEND_SHARE_ACTION: 5,
        RECEIVE_SHARE_ACTION: 6,
        SEND_OFFENSIVE_ACTION: 7,
        RECEIVE_OFFENSIVE_ACTION: 8,
        DEFAULT_LEVEL: 1,

        // Avatar levels
        Levels: [
            { level: 1, xpRequired: 500, title: "Beginner" },
            { level: 2, xpRequired: 1000, title: "Active reader" },
            { level: 3, xpRequired: 2000, title: "Expert" },
            { level: 4, xpRequired: 4000, title: "Influencer" },
            { level: 5, xpRequired: 8000, title: "Legend" }
        ],

        MAX_AVATAR_LEVEL: 5,

        // Get XP for user actions
        getActionXp: function (action) {
            switch (action) {
                case this.READ_ACTION: return 5;
                case this.SAVE_ACTION: return 10;
                case this.SEND_LIKE_ACTION: return 15;
                case this.RECEIVE_LIKE_ACTION: return 25;
                case this.SEND_SHARE_ACTION: return 15;
                case this.RECEIVE_SHARE_ACTION: return 25;
                case this.SEND_OFFENSIVE_ACTION: return 15;
                case this.RECEIVE_OFFENSIVE_ACTION: return -15;
                default: return 0;
            }
        },

        // Determine user's avatar level based on XP
        getAvatarLevel: function (userAvatarXp) {
            for (let avatarLevel of this.Levels) {
                if (userAvatarXp < avatarLevel.xpRequired)
                    return avatarLevel.level;
            }
            // In case the user accumulated more than 8000 xp
            if (userAvatarXp > this.Levels[this.MAX_AVATAR_LEVEL - 1].xpRequired)
                return this.Levels[this.MAX_AVATAR_LEVEL - 1].level;
            // Return default level
            return this.DEFAULT_LEVEL;
        }
    }
}

// Initialize Firebase API
const firebaseApi = new FirebaseApi();

// Initialize on page load
$(document).ready(function () {
    if (firebaseApi.init({
        onDisplayNotification: displayNotification,
        onLoggedInUserAvatarUpdated: updateLoggedInUserAvatar
    })) {
        // Firebase API initialized successfully

        // This event occurs when the user closes the broswer
        $(window).on('beforeunload', function () {
            firebaseApi.logout();
        });
    } else {
        console.error('Failed to initialize Firebase');
    }
});