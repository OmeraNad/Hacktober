(() => {
    const topics = {
        cybercrime: { title: "Cybercrime & Digital Privacy", badge: "Cybercrime Defender" },
        consumer: { title: "Consumer Rights", badge: "Consumer Champion" },
        road: { title: "Road Safety", badge: "Road Safety Guardian" },
        fundamental: { title: "Fundamental & Student Rights", badge: "Rights Advocate" }
    };
    const storageKey = "lawlinkQuizProgress";
    const fileName = window.location.pathname.split("/").pop().toLowerCase();
    const quizMatch = fileName.match(/^(page|cspage|frpage|rspage)([1-5])\.html$/);
    const topicFromFile = {
        page: "cybercrime",
        cspage: "consumer",
        frpage: "fundamental",
        rspage: "road"
    };
    const landingTopic = {
        "cybercrime.html": "cybercrime",
        "consumerrights.html": "consumer",
        "roadsafety.html": "road",
        "fundamentalrights.html": "fundamental"
    }[fileName];

    function readProgress() {
        try {
            return JSON.parse(localStorage.getItem(storageKey)) || {};
        } catch {
            return {};
        }
    }

    function writeProgress(progress) {
        localStorage.setItem(storageKey, JSON.stringify(progress));
    }

    function startTopic(topic) {
        const progress = readProgress();
        const wasCompleted = Boolean(progress[topic]?.completed);
        progress[topic] = { score: 0, answers: {}, completed: wasCompleted };
        writeProgress(progress);
    }

    if (landingTopic) {
        document.addEventListener("click", (event) => {
            if (event.target instanceof Element && event.target.closest(".b1")) {
                startTopic(landingTopic);
            }
        }, true);
    }

    if (!quizMatch) return;

    const topic = topicFromFile[quizMatch[1]];
    const questionNumber = Number(quizMatch[2]);
    const answerButtons = Array.from(document.querySelectorAll(".options .A"));
    const options = document.querySelector(".options");
    if (!topic || !options || !answerButtons.length) return;

    let nextButton = document.querySelector(".next");
    if (questionNumber === 5 && !nextButton) {
        nextButton = document.createElement("button");
        nextButton.type = "button";
        nextButton.className = "next";
        nextButton.textContent = "View Results";
        document.body.append(nextButton);
    } else if (nextButton && questionNumber === 5) {
        nextButton.textContent = "View Results";
    }

    let feedback = document.getElementById("quiz-feedback");
    if (!feedback) {
        feedback = document.createElement("p");
        feedback.id = "quiz-feedback";
        feedback.setAttribute("role", "status");
        feedback.setAttribute("aria-live", "polite");
        feedback.style.cssText = "margin: 16px auto; max-width: 760px; font: 600 1rem/1.5 Arial, sans-serif; color: #123; text-align: center;";
        options.insertAdjacentElement("afterend", feedback);
    }

    function currentTopicProgress() {
        const progress = readProgress();
        if (!progress[topic]) progress[topic] = { score: 0, answers: {}, completed: false };
        if (!progress[topic].answers) progress[topic].answers = {};
        return { progress, state: progress[topic] };
    }

    function showRecordedAnswer() {
        const { state } = currentTopicProgress();
        const answer = state.answers[questionNumber];
        if (!answer) return;
        answerButtons.forEach((button) => { button.disabled = true; });
        feedback.textContent = answer.correct
            ? `Correct! +100 points. Topic score: ${state.score}.`
            : `Incorrect. -25 points. Topic score: ${state.score}.`;
    }

    showRecordedAnswer();

    document.addEventListener("click", (event) => {
        if (!(event.target instanceof Element)) return;

        const answerButton = event.target.closest(".options .A");
        if (answerButton) {
            event.preventDefault();
            event.stopImmediatePropagation();
            const { progress, state } = currentTopicProgress();
            if (state.answers[questionNumber]) return;

            const correct = /alert\s*\(\s*['"]YAY/i.test(answerButton.getAttribute("onclick") || "");
            const points = correct ? 100 : -25;
            state.score += points;
            state.answers[questionNumber] = { correct, points };
            writeProgress(progress);

            answerButtons.forEach((button) => { button.disabled = true; });
            feedback.textContent = correct
                ? `Correct! +100 points. Topic score: ${state.score}.`
                : `Incorrect. -25 points. Topic score: ${state.score}.`;
            return;
        }

        const clickedNext = event.target.closest(".next");
        if (!clickedNext) return;

        const { progress, state } = currentTopicProgress();
        if (!state.answers[questionNumber]) {
            event.preventDefault();
            event.stopImmediatePropagation();
            feedback.textContent = "Choose an answer before moving on.";
            return;
        }

        if (questionNumber === 5) {
            event.preventDefault();
            event.stopImmediatePropagation();
            state.completed = true;
            writeProgress(progress);
            window.location.href = `results.html?topic=${encodeURIComponent(topic)}`;
        }
    }, true);
})();
