document.getElementById('startRecording').addEventListener('click', startRecording);

async function startRecording() {
    if (!('webkitSpeechRecognition' in window)) {
        alert("Speech recognition is not supported in this browser. Please use Google Chrome.");
        return;
    }

    const recognition = new webkitSpeechRecognition();
    recognition.lang = 'en-US';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    document.getElementById("result").innerText = "Listening...";

    setTimeout(() => {
        recognition.start();
    }, 100);

    recognition.onresult = async (event) => {
        const transcript = event.results[0][0].transcript;
        document.getElementById("inputText").value = transcript;
        await detectAndTranslate(transcript);
    };

    recognition.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        document.getElementById("result").innerText = "Error: Speech recognition failed.";
    };

    recognition.onend = () => {
        console.log("Speech recognition ended.");
    };
}

async function detectAndTranslate(text) {
    try {
        const API_Key = "AIzaSyBg3xzEFkeAMff0I6JglKe9Sk6xAnBUjMo"; // Replace with your actual API Key

        // Detect language
        const detectUrl = `https://translation.googleapis.com/language/translate/v2/detect?key=${API_Key}`;
        const detectResponse = await fetch(detectUrl, {
            method: "POST",
            body: JSON.stringify({ q: text }),
            headers: { "Content-Type": "application/json" }
        });

        const detectData = await detectResponse.json();
        const detectedLang = detectData.data.detections[0][0].language;

        document.getElementById("result").innerText = `Detected Language: ${detectedLang}`;

        // Translate text
        const targetLang = document.getElementById("targetLang").value;
        const translateUrl = `https://translation.googleapis.com/language/translate/v2?key=${API_Key}`;

        const translateResponse = await fetch(translateUrl, {
            method: "POST",
            body: JSON.stringify({
                q: text,
                source: detectedLang,
                target: targetLang,
                format: "text"
            }),
            headers: { "Content-Type": "application/json" }
        });

        const translateData = await translateResponse.json();
        const translatedText = translateData.data.translations[0].translatedText;

        document.getElementById("result").innerText += `\n\nTranslated Text: ${translatedText}`;
    } catch (error) {
        console.error("Translation Error:", error);
        document.getElementById("result").innerText = "Error: Please Choose Different Language.";
    }
}

function speakTranslatedText(text, language) {
    const utterance = new SpeechSynthesisUtterance(text);

    // Set the language based on the selected target language
    utterance.lang = language;

    // Set other properties for TTS (optional)
    utterance.rate = 1;  // Normal speed
    utterance.pitch = 1;  // Normal pitch
    utterance.volume = 1; // Max volume

    // Speak the translated text
    window.speechSynthesis.speak(utterance);
}

document.getElementById('translateBtn').addEventListener('click', async () => {
    const text = document.getElementById('inputText').value.trim();
    if (!text) {
        alert('Please enter or speak some text to translate.');
        return;
    }
    await detectAndTranslate(text);
});

async function loadLanguages() {
    const API_Key = "AIzaSyBg3xzEFkeAMff0I6JglKe9Sk6xAnBUjMo"; // Replace with your actual API Key
    const url = `https://translation.googleapis.com/language/translate/v2/languages?key=${API_Key}&target=en`;

    try {
        const response = await fetch(url);
        const data = await response.json();
        const languages = data.data.languages;

        const select = document.getElementById("targetLang");
        select.innerHTML = ""; // Clear existing options

        languages.forEach(lang => {
            const option = document.createElement("option");
            option.value = lang.language;
            option.textContent = lang.name; // Display full language name
            select.appendChild(option);
        });

    } catch (error) {
        console.error("Error fetching languages:", error);
    }
}

// Load languages when the page loads
window.onload = loadLanguages;

// Event listener for the 'copy' button to copy the translated text to clipboard

document.getElementById('copyBtn').addEventListener('click', () => {
    const btn = document.getElementById('copyBtn');
    const resultText = document.getElementById('result').innerText;

    // Extract the translated text (text after "Translated Text: ")
    const translatedTextMatch = resultText.match(/Translated Text: (.*)/);
    const translatedText = translatedTextMatch ? translatedTextMatch[1] : "";

    if (translatedText.trim() === "") {
        alert("No translated text to copy!");
        return;
    }

    // Copy only the translated text to clipboard
    navigator.clipboard.writeText(translatedText).then(() => {
        btn.classList.add("copied");
        setTimeout(() => btn.classList.remove("copied"), 1500);
    }).catch(err => console.error("Failed to copy:", err));
});



document.getElementById('speakBtn').addEventListener('click', () => {
    const resultText = document.getElementById('result').innerText;

    // Extract only the translated text using split
    const translatedText = resultText.split("\n\nTranslated Text: ")[1];

    if (!translatedText) {
        alert("No translated text to speak!");
        return;
    }

    const utterance = new SpeechSynthesisUtterance(translatedText);
    
    // Detect the selected language from the dropdown
    const selectedLang = document.getElementById('targetLang').value;
    
    // Set the correct language voice if available
    utterance.lang = selectedLang;

    // Speak the translated text
    window.speechSynthesis.speak(utterance);
});


