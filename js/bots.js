// ============ IA (BOTS) ============
function botPlay() {
    if (!gameState || gameState.gameOver) return;
    const current = getCurrentPlayer();
    if (!current || !current.isBot) return;
    if (rollInProgress || questionInProgress) return;

    performRoll();
}

function botAnswerQuestion() {
    if (!currentQuestionData) return;
    // botDifficulty (config.js) — configurável em Configurações; padrão 0.75.
    const isCorrect = Math.random() < botDifficulty;
    const correctIndex = currentQuestionData.respostaCorreta;
    let chosenIndex;
    if (isCorrect) {
        chosenIndex = correctIndex;
    } else {
        const options = [];
        for (let i = 0; i < currentQuestionData.opcoes.length; i++) {
            if (i !== correctIndex) options.push(i);
        }
        chosenIndex = options[Math.floor(Math.random() * options.length)];
    }
    setTimeout(
        () => {
            handleQuestionAnswer(chosenIndex, true);
        },
        900 + Math.random() * 1300
    );
}
