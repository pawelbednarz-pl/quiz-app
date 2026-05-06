
let categoriesData = [];
let quizData = [];
let currentQuestionIndex = 0;
let userAnswers = {}; 
let currentCategoryName = "";
let currentQuizFile = "";

// Elementy DOM
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

const resultCard = document.getElementById('result-card');
const finalScoreText = document.getElementById('final-score');
const restartBtn = document.getElementById('restart-btn');
const homeBtn = document.getElementById('home-btn');

// --- Funkcja pomocnicza: Tasowanie tablicy (Fisher-Yates) ---
function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
}

// --- Inicjalizacja: Pobieranie kategorii ---
async function loadCategories() {
    try {
        const response = await fetch('categories.json');
        categoriesData = await response.json();
        renderCategories();
    } catch (error) {
        categoriesList.innerHTML = "<p>Błąd podczas ładowania kategorii.</p>";
        console.error(error);
    }
}

function renderCategories() {
    categoriesList.innerHTML = "";
    categoriesData.forEach(cat => {
        const catDiv = document.createElement('div');
        catDiv.classList.add('category-item');
        catDiv.innerHTML = `
            <h2>${cat.category}</h2>
            <p>${cat.description}</p>
        `;
        catDiv.addEventListener('click', () => selectCategory(cat));
        categoriesList.appendChild(catDiv);
    });
}

// --- Ładowanie konkretnego quizu z losowaniem pytań i odpowiedzi ---
async function selectCategory(cat) {
    try {
        currentCategoryName = cat.category;
        currentQuizFile = cat.contentFile;
        
        const response = await fetch(currentQuizFile);
        let allQuestions = await response.json();
        
        // 1. Tasujemy wszystkie pytania z pliku
        shuffleArray(allQuestions);
        
        // 2. Ograniczamy liczbę pytań zgodnie z wyborem z dropdownu
        const selectedCount = questionCountSelect.value;
        if (selectedCount !== "all") {
            const limit = parseInt(selectedCount, 10);
            allQuestions = allQuestions.slice(0, limit);
        }
        
        // 3. Tasujemy odpowiedzi dla każdego wybranego pytania
        allQuestions.forEach(question => {
            shuffleArray(question.options);
        });
        
        quizData = allQuestions;
        
        if(quizData.length === 0) {
            alert("Brak pytań w tej kategorii.");
            return;
        }

        // Zmiana widoku
        categoriesCard.classList.add('hidden');
        quizCard.classList.remove('hidden');
        quizTitle.innerText = currentCategoryName;
        
        startQuiz();
    } catch (error) {
        alert("Nie udało się załadować pytań z pliku: " + cat.contentFile);
        console.error(error);
    }
}

function startQuiz() { 
    currentQuestionIndex = 0; 
    userAnswers = {}; 
    showQuestion(); 
}

function showQuestion() {
    optionsList.innerHTML = ""; 
    const currentQuestion = quizData[currentQuestionIndex];
    progressText.innerText = `Pytanie ${currentQuestionIndex + 1} z ${quizData.length}`;
    questionText.innerText = currentQuestion.question;

    if (currentQuestion.image && currentQuestion.image.trim() !== "") {
        questionImage.src = currentQuestion.image;
        questionImage.classList.remove('hidden');
    } else {
        questionImage.classList.add('hidden');
    }

    if (!userAnswers[currentQuestionIndex]) {
        userAnswers[currentQuestionIndex] = [];
    }

    currentQuestion.options.forEach((option, index) => {
        const button = document.createElement('button');
        button.innerText = option.content;
        button.classList.add('option-btn');
        
        if (userAnswers[currentQuestionIndex].includes(index)) {
            button.classList.add('selected');
        }

        button.addEventListener('click', () => toggleOption(index, button));
        optionsList.appendChild(button);
    });

    prevBtn.disabled = currentQuestionIndex === 0;
    nextBtn.disabled = currentQuestionIndex === quizData.length - 1;
}

function toggleOption(index, button) {
    const answersForCurrent = userAnswers[currentQuestionIndex];
    const indexOfSelection = answersForCurrent.indexOf(index);

    if (indexOfSelection > -1) {
        answersForCurrent.splice(indexOfSelection, 1);
        button.classList.remove('selected');
    } else {
        answersForCurrent.push(index);
        button.classList.add('selected');
    }
}

prevBtn.addEventListener('click', () => {
    if (currentQuestionIndex > 0) { currentQuestionIndex--; showQuestion(); }
});

nextBtn.addEventListener('click', () => {
    if (currentQuestionIndex < quizData.length - 1) { currentQuestionIndex++; showQuestion(); }
});

// --- Obliczanie wyniku ---
submitBtn.addEventListener('click', () => {
    let score = 0;

    quizData.forEach((question, qIndex) => {
        const correctIndices = [];
        question.options.forEach((opt, idx) => { if (opt.isCorrect) correctIndices.push(idx); });

        const selectedIndices = userAnswers[qIndex] || [];
        const isExactlyCorrect = 
            correctIndices.length === selectedIndices.length &&
            correctIndices.every(val => selectedIndices.includes(val));

        if (isExactlyCorrect) score++;
    });

    showResult(score);
});

function showResult(score) {
    quizCard.classList.add('hidden');
    resultCard.classList.remove('hidden');
    finalScoreText.innerText = `${score} / ${quizData.length}`;
}

// --- Nawigacja końcowa ---
restartBtn.addEventListener('click', () => {
    resultCard.classList.add('hidden');
    // Ponownie tasujemy pytania dla tej samej kategorii!
    selectCategory({ category: currentCategoryName, contentFile: currentQuizFile });
});

homeBtn.addEventListener('click', () => {
    resultCard.classList.add('hidden');
    categoriesCard.classList.remove('hidden');
});

// Start
loadCategories();
