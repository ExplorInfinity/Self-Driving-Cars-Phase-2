export class LoadingScreen {

    static elements() {
        const loadingScreen = document.getElementById('loadingScreen');
        const randomBar = document.getElementById('randomBar');
        const progressBar = document.getElementById('progressBar');
        const progressCount = document.getElementById('progressCount');
        const progressComment = document.getElementById('comment');

        return { loadingScreen, randomBar, progressBar, progressCount, progressComment }
    }

    static updateProgressBar(value, max) {
        const { progressCount, progressBar } = LoadingScreen.elements();
        progressCount.textContent = `[${value}/${max}]`;
        progressBar.value = value;
        progressBar.max = max;
    }

    static setProgressValue(value) {
        const { progressCount } = LoadingScreen.elements();
        progressCount.textContent = `[${value}]`;
    }

    static setComment(comment) {
        const { progressCount, progressComment } = LoadingScreen.elements();
        progressComment.textContent = comment;
        progressCount.textContent = '';
    }

    static showProgressBar(value, max) {
        const { randomBar, progressBar } = LoadingScreen.elements();
        progressBar.style.display = 'block';
        randomBar.style.display = 'none';
        if(value) progressBar.value = value;
        if(max) progressBar.max = max;
    }
    
    static showRandomBar() {
        const { randomBar, progressBar } = LoadingScreen.elements();
        randomBar.style.display = 'block';
        progressBar.style.display = 'none';
    }

    static hide() {
        const { loadingScreen } = LoadingScreen.elements();
        loadingScreen.style.display = 'none';
    }

    static show() {
        const { loadingScreen } = LoadingScreen.elements();
        loadingScreen.style.display = 'flex';
    }

    static hideBars() {
        const { progressBar, randomBar } = LoadingScreen.elements();
        randomBar.style.display = 'none';
        progressBar.style.display = 'none';
    }
}