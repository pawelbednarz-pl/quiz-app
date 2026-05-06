
let quizData = [];
let currentQuestionIndex = 0;
let userAnswers = {}; // Przechowuje odpowiedzi w formacie { index_pytania: [wybrane_indeksy] }

const quizCard = document.getElementById('quiz-card');
const resultCard = document.getElementById('result-card');
const questionText = document.getElementById('question-text');
const questionImage = document.getElementById('question-image');
const optionsList = document.getElementById('options-list');
const progressText = document.getElementById('progress');

const prevBtn = document.getElementById('prev-btn');
const nextBtn = document.getElementById('next-btn');
const submitBtn = document.getElementById('submit-btn');

const finalScoreText = document.getElementById('final-score');
const restartBtn = document.getElementById('restart-btn');

async function loadQuizData() {
    try {
        const response = await fetch('pytania.json');
        quizData = await response.json();
        startQuiz();
    } catch (error) {
        questionText.innerText = "Błąd podczas ładowania pytań. Upewnij się, że plik pytania.json istnieje.";
        console.error(error);
    }
}

function startQuiz() { 
    currentQuestionIndex = 0; 
    userAnswers = {}; // Zresetuj odpowiedzi
    showQuestion(); 
}

function showQuestion() {
    optionsList.innerHTML = ""; // Czyść poprzednie opcje
    const currentQuestion = quizData[currentQuestionIndex];
    progressText.innerText = `Pytanie ${currentQuestionIndex + 1} z ${quizData.length}`;
    questionText.innerText = currentQuestion.question;

    // Obsługa obrazka
    if (currentQuestion.image && currentQuestion.image.trim() !== "") {
        questionImage.src = currentQuestion.image;
        questionImage.classList.remove('hidden');
    } else {
        questionImage.classList.add('hidden');
    }

    // Jeśli dla tego pytania nie ma jeszcze zapisanych odpowiedzi, utwórz pustą tablicę
    if (!userAnswers[currentQuestionIndex]) {
        userAnswers[currentQuestionIndex] = [];
    }

    // Wyświetl odpowiedzi
    currentQuestion.options.forEach((option, index) => {
        const button = document.createElement('button');
        button.innerText = option.content;
        button.classList.add('option-btn');
        
        // Zaznacz, jeśli użytkownik wcześniej wybrał tę odpowiedź
        if (userAnswers[currentQuestionIndex].includes(index)) {
            button.classList.add('selected');
        }

        button.addEventListener('click', () => toggleOption(index, button));
        optionsList.appendChild(button);
    });

    // Kontrola przycisków nawigacji
    prevBtn.disabled = currentQuestionIndex === 0;
    nextBtn.disabled = currentQuestionIndex === quizData.length - 1;
}

function toggleOption(index, button) {
    const answersForCurrent = userAnswers[currentQuestionIndex];
    const indexOfSelection = answersForCurrent.indexOf(index);

    if (indexOfSelection > -1) {
        // Jeśli już wybrane - odznacz (usuń z tablicy)
        answersForCurrent.splice(indexOfSelection, 1);
        button.classList.remove('selected');
    } else {
        // Jeśli niewybrane - zaznacz (dodaj do tablicy)
        answersForCurrent.push(index);
        button.classList.add('selected');
    }
}

// Nawigacja
prevBtn.addEventListener('click', () => {
    if (currentQuestionIndex > 0) {
        currentQuestionIndex--;
        showQuestion();
    }
});

nextBtn.addEventListener('click', () => {
    if (currentQuestionIndex < quizData.length - 1) {
        currentQuestionIndex++;
        showQuestion();
    }
});

// Zatwierdzenie i liczenie wyniku
submitBtn.addEventListener('click', () => {
    let score = 0;

    quizData.forEach((question, qIndex) => {
        // Zbieramy indeksy wszystkich prawidłowych odpowiedzi z JSON
        const correctIndices = [];
        question.options.forEach((opt, idx) => {
            if (opt.isCorrect) correctIndices.push(idx);
        });

        // Pobieramy odpowiedzi użytkownika (lub pustą tablicę, jeśli pominął)
        const selectedIndices = userAnswers[qIndex] || [];

        // Porównujemy: liczba wybranych musi być równa liczbie poprawnych 
        // i wszystkie wybrane muszą być wśród poprawnych (ścisłe dopasowanie)
        const isExactlyCorrect = 
            correctIndices.length === selectedIndices.length &&
            correctIndices.every(val => selectedIndices.includes(val));

        if (isExactlyCorrect) {
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

restartBtn.addEventListener('click', () => {
    resultCard.classList.add('hidden');
    quizCard.classList.remove('hidden');
    startQuiz();
});

loadQuizData();
