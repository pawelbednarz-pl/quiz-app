let categoriesData = [];
let quizData = [];
let currentQuestionIndex = 0;
let userAnswers = {};
let confirmedQuestions = {};
let currentCategoryName = "";
let currentQuizFile = "";

const categoriesCard = document.getElementById('categories-card');
const categoriesList = document.getElementById('categories-list');
const questionCountSelect = document.getElementById('question-count');
const quizCard = document.getElementById('quiz-card');
const quizTitle = document.getElementById('quiz-title');
const questionText = document.getElementById('question-text');
const questionImage = document.getElementById('question-image');
const optionsList = document.getElementById('options-list');
const progressText = document.getElementById('progress');
const prevBtn = document.getElementById('prev-btn');
const nextBtn = document.getElementById('next-btn');
const submitBtn = document.getElementById('submit-btn');
const confirmBtn = document.getElementById('confirm-btn');
const resultCard = document.getElementById('result-card');
const finalScoreText = document.getElementById('final-score');
const restartBtn = document.getElementById('restart-btn');
const homeBtn = document.getElementById('home-btn');
const reviewBtn = document.getElementById('review-btn');

function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
}

async function loadCategories() {
    try {
        const response = await fetch('categories.json');
        categoriesData = await response.json();
        renderCategories();
    } catch (error) {
        categoriesList.innerHTML = "<p>Błąd podczas ładowania kategorii.</p>";
    }
}

function renderCategories() {
    categoriesList.innerHTML = "";
    categoriesData.forEach(cat => {
        const catDiv = document.createElement('div');
        catDiv.classList.add('category-item');
        catDiv.innerHTML = `<h2>${cat.category}</h2><p>${cat.description}</p>`;
        catDiv.addEventListener('click', () => selectCategory(cat));
        categoriesList.appendChild(catDiv);
    });
}

async function selectCategory(cat) {
    try {
        currentCategoryName = cat.category;
        currentQuizFile = cat.contentFile;
        const response = await fetch(currentQuizFile);
        let allQuestions = await response.json();
        shuffleArray(allQuestions);
        const selectedCount = questionCountSelect.value;
        if (selectedCount !== "all") {
            allQuestions = allQuestions.slice(0, parseInt(selectedCount, 10));
        }
        allQuestions.forEach(q => shuffleArray(q.options));
        quizData = allQuestions;
        if (quizData.length === 0) { alert("Brak pytań."); return; }
        categoriesCard.classList.add('hidden');
        quizCard.classList.remove('hidden');
        quizTitle.innerText = currentCategoryName;
        startQuiz();
    } catch (error) {
        alert("Nie udało się załadować pytań.");
    }
}

function startQuiz() {
    currentQuestionIndex = 0;
    userAnswers = {};
    confirmedQuestions = {};
    showQuestion();
}

function showQuestion() {
    optionsList.innerHTML = "";
    const q = quizData[currentQuestionIndex];
    const confirmed = confirmedQuestions[currentQuestionIndex];
    progressText.innerText = `Pytanie ${currentQuestionIndex + 1} z ${quizData.length}`;
    questionText.innerText = q.question;

    if (q.image && q.image.trim() !== "") {
        questionImage.src = q.image;
        questionImage.classList.remove('hidden');
    } else {
        questionImage.classList.add('hidden');
    }

    // Show result indicator for confirmed questions
    let resultIndicator = document.getElementById('result-indicator');
    if (!resultIndicator) {
        resultIndicator = document.createElement('p');
        resultIndicator.id = 'result-indicator';
        questionText.after(resultIndicator);
    }
    if (confirmed) {
        const correctIndices = q.options.map((opt, idx) => opt.isCorrect ? idx : -1).filter(i => i !== -1);
        const selected = userAnswers[currentQuestionIndex] || [];
        const isCorrect = correctIndices.length === selected.length && correctIndices.every(v => selected.includes(v));
        resultIndicator.textContent = isCorrect ? '✓ Poprawna odpowiedź' : '✗ Błędna odpowiedź';
        resultIndicator.className = 'result-indicator ' + (isCorrect ? 'indicator-correct' : 'indicator-incorrect');
    } else {
        resultIndicator.textContent = '';
        resultIndicator.className = '';
    }

    if (!userAnswers[currentQuestionIndex]) {
        userAnswers[currentQuestionIndex] = [];
    }

    q.options.forEach((option, index) => {
        const button = document.createElement('button');
        button.innerText = option.content;
        button.classList.add('option-btn');

        if (userAnswers[currentQuestionIndex].includes(index)) {
            button.classList.add('selected');
        }

        if (confirmed) {
            button.disabled = true;
            if (option.isCorrect) {
                button.classList.add('correct');
            }
            if (userAnswers[currentQuestionIndex].includes(index) && !option.isCorrect) {
                button.classList.add('incorrect');
            }
        } else {
            button.addEventListener('click', () => toggleOption(index, button));
        }

        optionsList.appendChild(button);
    });

    confirmBtn.classList.toggle('hidden', !!confirmed);
    updateNavButtons();
}

function toggleOption(index, button) {
    const answers = userAnswers[currentQuestionIndex];
    const idx = answers.indexOf(index);
    if (idx > -1) {
        answers.splice(idx, 1);
        button.classList.remove('selected');
    } else {
        answers.push(index);
        button.classList.add('selected');
    }
}

function confirmAnswer() {
    confirmedQuestions[currentQuestionIndex] = true;
    showQuestion();
}

const skipConfirmedCheckbox = document.getElementById('skip-confirmed');

function findNext(direction) {
    if (!skipConfirmedCheckbox.checked) {
        const next = currentQuestionIndex + direction;
        return (next >= 0 && next < quizData.length) ? next : -1;
    }
    const len = quizData.length;
    for (let i = 1; i < len; i++) {
        const idx = currentQuestionIndex + i * direction;
        if (idx < 0 || idx >= len) break;
        if (!confirmedQuestions[idx]) return idx;
    }
    return -1;
}

function updateNavButtons() {
    const allConfirmed = quizData.every((_, i) => confirmedQuestions[i]);
    submitBtn.disabled = !allConfirmed;
    prevBtn.disabled = findNext(-1) === -1;
    nextBtn.disabled = findNext(1) === -1;
}

prevBtn.addEventListener('click', () => {
    const idx = findNext(-1);
    if (idx !== -1) { currentQuestionIndex = idx; showQuestion(); }
});

nextBtn.addEventListener('click', () => {
    const idx = findNext(1);
    if (idx !== -1) { currentQuestionIndex = idx; showQuestion(); }
});

skipConfirmedCheckbox.addEventListener('change', updateNavButtons);

confirmBtn.addEventListener('click', confirmAnswer);

submitBtn.addEventListener('click', () => {
    let score = 0;
    quizData.forEach((question, qIndex) => {
        const correctIndices = question.options
            .map((opt, idx) => opt.isCorrect ? idx : -1)
            .filter(idx => idx !== -1);
        const selected = userAnswers[qIndex] || [];
        if (correctIndices.length === selected.length &&
            correctIndices.every(val => selected.includes(val))) {
            score++;
        }
    });
    showResult(score);
});

function showResult(score) {
    quizCard.classList.add('hidden');
    resultCard.classList.remove('hidden');
    finalScoreText.innerText = `${score} / ${quizData.length}`;
}

reviewBtn.addEventListener('click', () => {
    resultCard.classList.add('hidden');
    quizCard.classList.remove('hidden');
    submitBtn.classList.add('hidden');
    confirmBtn.classList.add('hidden');
    skipConfirmedCheckbox.checked = false;
    document.querySelector('.skip-toggle').classList.add('hidden');
    document.getElementById('back-to-results').classList.remove('hidden');
    currentQuestionIndex = 0;
    showQuestion();
});

document.getElementById('back-to-results').addEventListener('click', () => {
    quizCard.classList.add('hidden');
    resultCard.classList.remove('hidden');
});

restartBtn.addEventListener('click', () => {
    resultCard.classList.add('hidden');
    selectCategory({ category: currentCategoryName, contentFile: currentQuizFile });
});

homeBtn.addEventListener('click', () => {
    resultCard.classList.add('hidden');
    categoriesCard.classList.remove('hidden');
});

loadCategories();
