// Success alert
function showSuccess(messageText) {
    Swal.fire({
        title: 'Success!',
        text: messageText,
        icon: 'success',
        confirmButtonColor: '#d63813',
        timer: 3000,
        timerProgressBar: true
    });
}

// Error alert
function showError(messageText) {
    Swal.fire({
        title: 'Oops!',
        text: messageText,
        icon: 'error',
        confirmButtonColor: '#d63813',
    });
}

// Warning Alert
function showWarning(messageText) {
    Swal.fire({
        title: 'Warning!',
        text: messageText,
        icon: 'warning',
        confirmButtonColor: '#d63813',
        showClass: {
            popup: 'animate__animated animate__fadeInDown'
        },
        hideClass: {
            popup: 'animate__animated animate__fadeOutUp'
        }
    });
}

// Info Alert
function showInfo(messageHtml) {
    Swal.fire({
        title: 'Information',
        html: messageHtml,
        icon: 'info',
        confirmButtonColor: '#d63813',
        allowOutsideClick: false
    });
}

// Question Alert
function showQuestion(messageTitle, messageText, onConfirm, confirmButtonText = 'Yes', cancelButtonText = 'No') {
    Swal.fire({
        title: messageTitle,
        text: messageText,
        icon: 'question',
        confirmButtonColor: '#d63813',
        showCancelButton: true,
        cancelButtonText: cancelButtonText,
        confirmButtonText: confirmButtonText
    }).then((result) => {
        if (result.isConfirmed) {
            onConfirm();
        }
    });
}

// Confirm Dialog
async function showConfirm(messageTitle, messageText, onConfirm, onDismiss, confirmButtonText = 'Ok', cancelButtonText = 'Cancel') {
    const result = await Swal.fire({
        title: messageTitle,
        text: messageText,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#d63813',
        cancelButtonColor: '#6c757d',
        confirmButtonText: confirmButtonText,
        cancelButtonText: cancelButtonText,
        reverseButtons: true
    });
    if (result.isConfirmed) {
        onConfirm();
    } else if (result.dismiss === Swal.DismissReason.cancel) {
        if (onDismiss) onDismiss();
    }
}

// Toast notification
function showToast(type, message, position = 'bottom') {
    const Toast = Swal.mixin({
        toast: true,
        position: position, // Possible positions: top-end, bottom-end and so on
        showConfirmButton: false,
        timer: 3000,
        timerProgressBar: true,
        didOpen: (toast) => {
            toast.addEventListener('mouseenter', Swal.stopTimer);
            toast.addEventListener('mouseleave', Swal.resumeTimer);
        }
    });

    Toast.fire({
        icon: type, // possible types: success, error, warning, info, question
        title: message
    });
}

function toastSuccess(message) {
    showToast('success', message);
}
function toastError(message) {
    showToast('error', message);
}

function toastInfo(message) {
    showToast('info', message, 'bottom-end');
}

// Bootstrap modal plugin
let modalPlugin = null;

// Opens a Bootstrap modal to display a dialog
function openNewsDialog(loadPageUrl, callbackFunc) {
    const modal = $('#newsModal');

    // Load the html content from the given URL into the modal's body
    loadHtmlPage(loadPageUrl, "newsModalBody", function () {
        modalPlugin = new bootstrap.Modal(modal[0]);
        modalPlugin.show();
        callbackFunc();
    });
}

// Closes the Bootstrap modal
function closeNewsDialog() {
    if (modalPlugin) 
        modalPlugin.hide();
}

function formatDate(date, locale = 'en-US') {
    return new Date(date).toLocaleDateString(locale);
}

// Returns the ISO string of the date that is a given number of days before today
function getDateBeforeDays(days) {
    if (days == 0) return '';
    const date = new Date();
    date.setDate(date.getDate() - days);
    return date.toISOString();
}

function isRefreshTimeExpired(lastRefreshTime, currentTime, refreshMinutes) {
    // Ensure lastRefreshTime and currentTime are Date objects
    const lastTime = new Date(lastRefreshTime);
    const now = new Date(currentTime);

    // Calculate the difference in milliseconds
    const diffMs = now - lastTime;

    // Convert milliseconds to minutes
    const diffMinutes = diffMs / (1000 * 60);

    // Return true if difference exceeds refreshMinutes
    return diffMinutes > refreshMinutes;
}

function timeAgo(targetDate) {
    const now = new Date();
    const date = new Date(targetDate);
    const diffMs = now - date; // Difference in milliseconds

    const seconds = Math.floor(diffMs / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (seconds < 60) {
        return `${seconds} seconds ago`;
    } else if (minutes < 60) {
        return `${minutes} minutes ago`;
    } else if (hours < 24) {
        return `${hours} hours ago`;
    } else {
        return `${days} days ago`;
    }
}

// Display day and month only
function shortDate(dateStr, locale = 'en-US') {
    const date = new Date(dateStr);
    const options = { month: 'short', day: 'numeric' };
    return date.toLocaleDateString(locale, options);
}

// Cut the text according to the length in characters and put 3 dots at the end
function cutText(text, lengthInChars) {
    if (typeof text !== 'string') return '';
    if (text.length <= lengthInChars) return text;
    return text.slice(0, lengthInChars).trimEnd() + '...';
}

// Fetch resources into a container and activate a callback function
let fetchVer = new Date(); // Ignore browser cache
function fetchUrl(url, containerId, callbackFunc) {
    fetch(url + "?ver=" + fetchVer++)
        .then((response) => response.text())
        .then((data) => {
            document.getElementById(containerId).innerHTML = data;
            if (callbackFunc) callbackFunc();
        })
        .catch((error) => console.error("Error loading:" + url, error));
}

// Load an html page from Pages folder into a container and activate a callback function
function loadHtmlPage(pageURL, containerId, callbackFunc) {
    fetchUrl("Pages/" + pageURL + ".html", containerId, callbackFunc);
}

function appendNewsSourceIcon(container, source) {
  container.append($('<i/>').addClass('bi bi-newspaper me-2 col_orange ms-3 font_12'), ` ${source.name} `);
}

// Add an article image to an element and add a default image on loading error
function appendNewsImage(image, urlToImage) {
    image.attr('src', urlToImage || 'image/news.png').on('error', function () { this.src = 'image/news.png'; })
}

function createIcon(cssClass, fontSize, color) {
    const icon = $('<i />').addClass('bi ' + cssClass);
    if (fontSize)
        icon.css('font-size', fontSize);
    if (color)
        icon.css('color', color);
    return icon;
}

function getLocalStorage(key) {
    const value = localStorage.getItem(key);
    try {
        return value ? JSON.parse(value) : null;
    }
    catch {
        return null;
    }
}

function setLocalStorage(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
}

function delLocalStorage(key) {
    localStorage.removeItem(key);
}

function getSessionStorage(key) {
    const value = sessionStorage.getItem(key);
    try {
        return value ? JSON.parse(value) : null;
    }
    catch {
        return null;
    }
}

function setSessionStorage(key, value) {
    sessionStorage.setItem(key, JSON.stringify(value));
}

function delSessionStorage(key) {
    sessionStorage.removeItem(key);
}

function cancelEvent(event) {
    event.preventDefault();
    event.stopPropagation();
}

function showLoadingBtn(btn) {
    btn.prepend($('<span/>').addClass('spinner-border spinner-border-sm me-1').attr('role', 'status')
        .css('width', '1rem').css('height', '1rem'));
    btn.prop('disabled', true);
}

function hideLoadingBtn(btn) {
    btn.find('.spinner-border').remove();
    btn.prop('disabled', false);
}

function generateObjectHash(obj, prefix) {
    // Convert the object to a JSON string with sorted keys
    // This ensures consistent ordering for identical objects
    const str = JSON.stringify(obj, Object.keys(obj).sort());

    // Initialize hash and loop variables
    let hash = 0, i, chr;

    // Loop through each character in the JSON string
    for (i = 0; i < str.length; i++) {
        // Get the UTF-16 character code at position i
        chr = str.charCodeAt(i);

        // Update hash using a variant of the djb2 algorithm
        // (hash * 31) + chr using bit manipulation
        hash = ((hash << 5) - hash) + chr;

        // Convert hash to a 32-bit signed integer
        hash |= 0;
    }

    // Return the result as a positive hash with the given prefix
    return prefix + '-' + Math.abs(hash);
}

function convertTextToHTML(text) {
    if (!text || typeof text !== 'string') {
        return '';
    }

    // Split text into lines for processing
    const lines = text.split('\n').map(line => line.trim());
    let html = '';
    let inList = false;
    let listType = null; // 'ul' or 'ol'

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];

        // Skip empty lines (but add spacing)
        if (line === '') {
            if (inList) {
                html += closeList();
                inList = false;
                listType = null;
            }
            html += '<br>';
            continue;
        }

        // Handle headers (markdown-style)
        if (line.startsWith('###')) {
            if (inList) {
                html += closeList();
                inList = false;
                listType = null;
            }
            html += `<h3>${formatInlineElements(line.substring(3).trim())}</h3>`;
            continue;
        } else if (line.startsWith('##')) {
            if (inList) {
                html += closeList();
                inList = false;
                listType = null;
            }
            html += `<h2>${formatInlineElements(line.substring(2).trim())}</h2>`;
            continue;
        } else if (line.startsWith('#')) {
            if (inList) {
                html += closeList();
                inList = false;
                listType = null;
            }
            html += `<h1>${formatInlineElements(line.substring(1).trim())}</h1>`;
            continue;
        }

        // Handle bullet points (*, -, •)
        if (line.match(/^[\*\-\•]\s+/)) {
            if (!inList || listType !== 'ul') {
                if (inList) html += closeList();
                html += '<ul>';
                inList = true;
                listType = 'ul';
            }
            const content = line.replace(/^[\*\-\•]\s+/, '');
            html += `<li>${formatInlineElements(content)}</li>`;
            continue;
        }

        // Handle numbered lists (1., 2., etc.)
        if (line.match(/^\d+\.\s+/)) {
            if (!inList || listType !== 'ol') {
                if (inList) html += closeList();
                html += '<ol>';
                inList = true;
                listType = 'ol';
            }
            const content = line.replace(/^\d+\.\s+/, '');
            html += `<li>${formatInlineElements(content)}</li>`;
            continue;
        }

        // Handle section dividers (---, ***, etc.)
        if (line.match(/^[\-\*]{3,}$/)) {
            if (inList) {
                html += closeList();
                inList = false;
                listType = null;
            }
            html += '<hr>';
            continue;
        }

        // Handle blockquotes (lines starting with >)
        if (line.startsWith('>')) {
            if (inList) {
                html += closeList();
                inList = false;
                listType = null;
            }
            const content = line.substring(1).trim();
            html += `<blockquote>${formatInlineElements(content)}</blockquote>`;
            continue;
        }

        // Regular paragraph
        if (inList) {
            html += closeList();
            inList = false;
            listType = null;
        }

        // Check if it's a standalone line that should be treated as a header
        if (isStandaloneHeader(line)) {
            html += `<h3>${formatInlineElements(line)}</h3>`;
        } else {
            html += `<p>${formatInlineElements(line)}</p>`;
        }
    }

    // Close any remaining list
    if (inList) {
        html += closeList();
    }

    return html;

    function closeList() {
        return listType === 'ul' ? '</ul>' : '</ol>';
    }

    function formatInlineElements(text) {
        // Handle links - both markdown [text](url) and plain URLs
        text = text.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>');

        // Handle plain URLs (http/https)
        text = text.replace(/(https?:\/\/[^\s<>"{}|\\^`[\]]+)/g, '<a href="$1" target="_blank" rel="noopener noreferrer">$1</a>');

        // Handle bold text (**text** or __text__)
        text = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
        text = text.replace(/__(.*?)__/g, '<strong>$1</strong>');

        // Handle italic text (*text* or _text_)
        text = text.replace(/(?<!\*)\*([^*]+)\*(?!\*)/g, '<em>$1</em>');
        text = text.replace(/(?<!_)_([^_]+)_(?!_)/g, '<em>$1</em>');

        // Handle inline code (`text`)
        text = text.replace(/`([^`]+)`/g, '<code>$1</code>');

        // Handle hashtags
        text = text.replace(/#(\w+)/g, '<span class="hashtag">#$1</span>');

        return text;
    }

    function isStandaloneHeader(line) {
        // Check if line looks like a header (all caps, ends with colon, etc.)
        return line.match(/^[A-Z\s&:]+:$/) ||
            line.match(/^\*\*[^*]+\*\*:?$/) ||
            line.match(/^[A-Z][^.!?]*:$/) ||
            (line.length < 50 && line.match(/^[A-Z]/));
    }
}

// Bootstrap 5 + jQuery enhanced version
function convertTextToHTMLBootstrap(text, options = {}) {
    const defaultOptions = {
        useBootstrap: true,
        addCustomClasses: false,
        wrapInContainer: true,
        containerClass: 'container-fluid',
        linkTarget: '_blank',
        sanitize: true,
        addFadeIn: false,
        responsiveLinks: true
    };

    const config = { ...defaultOptions, ...options };

    let html = convertTextToHTML(text);

    // Add Bootstrap 5 classes
    if (config.useBootstrap) {
        // Headers with Bootstrap typography
        html = html.replace(/<h1>/g, '<h1 class="display-4 mb-3">');
        html = html.replace(/<h2>/g, '<h2 class="display-5 mb-3">');
        html = html.replace(/<h3>/g, '<h3 class="h4 mb-2">');

        // Paragraphs with Bootstrap spacing
        html = html.replace(/<p>/g, '<p class="mb-3 text-dark">');

        // Lists with Bootstrap styling
        html = html.replace(/<ul>/g, '<ul class="list-group list-group-flush mb-3">');
        html = html.replace(/<ol>/g, '<ol class="list-group list-group-numbered mb-3">');
        html = html.replace(/<li>/g, '<li class="list-group-item border-0 px-4">');

        // Blockquotes with Bootstrap styling
        html = html.replace(/<blockquote>/g, '<blockquote class="blockquote border-start border-primary border-4 ps-3 mb-3">');

        // Links with Bootstrap button styling (optional)
        if (config.responsiveLinks) {
            // Style external links as badges
            html = html.replace(/<a href="http/g, '<a class="btn btn-outline-primary btn-sm me-2 mb-1" href="http');
        }

        // Horizontal rules with Bootstrap styling
        html = html.replace(/<hr>/g, '<hr class="my-4">');

        // Code with Bootstrap styling
        html = html.replace(/<code>/g, '<code class="bg-light p-1 rounded">');

        // Hashtags with Bootstrap badges
        html = html.replace(/<span class="hashtag">/g, '<span class="badge bg-secondary me-1">');
    }

    // Add custom classes if requested
    if (config.addCustomClasses) {
        html = html.replace(/class="([^"]*)">/g, (match, classes) => {
            return `class="${classes} custom-formatted">`;
        });
    }

    // Wrap in Bootstrap container
    if (config.wrapInContainer) {
        html = `<div class="${config.containerClass}"><div class="row"><div class="col-12">${html}</div></div></div>`;
    }

    // Add fade-in animation class
    if (config.addFadeIn) {
        html = html.replace(/class="([^"]*)">/g, (match, classes) => {
            return `class="${classes} fade-in">`;
        });
    }

    // Basic XSS protection
    if (config.sanitize) {
        html = html.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
        html = html.replace(/javascript:/gi, '');
        html = html.replace(/on\w+\s*=/gi, '');
    }

    return html;
}

function highlightTerm(text, term) {
    if (!text || !term) return text;
    const escapedTerm = term.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&'); // escape regex chars
    const regex = new RegExp(`(${escapedTerm})`, 'gi'); // case-insensitive
    return text.replace(regex, '<span class="highlight">$1</span>');
}
function easeOutCubic(t) {
    return 1 - Math.pow(1 - t, 3);
}

function animateStatisticNumbers(stats) {
    Object.keys(stats).forEach(key => {
        const element = $(`#${key}`);
        if (element.length > 0) {
            const finalValue = stats[key];
            const startValue = 0;
            const duration = 2000;
            const startTime = performance.now();

            const animate = (currentTime) => {
                const elapsed = currentTime - startTime;
                const progress = Math.min(elapsed / duration, 1);
                const currentValue = Math.floor(startValue + (finalValue - startValue) * easeOutCubic(progress));

                element.text(currentValue.toLocaleString());

                if (progress < 1) {
                    requestAnimationFrame(animate);
                }
            };
            requestAnimationFrame(animate);
        }
    });
}

let aiAnimation = null;
function loadAILottieAnimation(container) {
    aiAnimation = lottie.loadAnimation({
        container: container[0], // Target container
        renderer: 'svg', // Changed from 'json' to 'svg'
        loop: true, // Loop animation
        autoplay: true, // Autoplay animation
        path: '/image/animation/mapLoader.json' // Path to JSON file
    });
    return aiAnimation;
}
