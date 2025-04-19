document.addEventListener('DOMContentLoaded', function() {
  // DOM Elements
  const sourceText = document.getElementById('sourceText');
  const sourceSection = document.querySelector('.input-group.source');
  const languageSelector = document.querySelector('.language-selector');
  const translationSection = document.querySelector('.input-group:not(.source)');
  const controls = document.querySelector('.controls');
  const targetLanguage = document.getElementById('targetLanguage');
  const translatedText = document.getElementById('translatedText');
  const micButton = document.getElementById('micButton');
  const translateBtn = document.getElementById('translateBtn');
  const speakBtn = document.getElementById('speakBtn');
  const copyBtn = document.getElementById('copyBtn');
  const resetBtn = document.getElementById('resetBtn');
  const feedback = document.getElementById('feedback');
  const feedbackText = document.getElementById('feedbackText');
  const loader = document.getElementById('loader');
  
  // Initially hide all elements except the mic button
  sourceText.style.display = 'none';
  document.querySelector('.input-label').style.display = 'none';
  languageSelector.style.display = 'none';
  translationSection.style.display = 'none';
  
  // Hide all buttons initially except translate button
  translateBtn.style.display = 'none';
  speakBtn.style.display = 'none';
  copyBtn.style.display = 'none';
  resetBtn.style.display = 'none';
  
  // API Key - In a real application, this would be secured on the server side
  // SECURITY ISSUE: This should be moved to server-side code
  const API_Key = 'AIzaSyBg3xzEFkeAMff0I6JglKe9Sk6xAnBUjMo';
  
  // URL for Google Translate API
  const translateUrl = `https://translation.googleapis.com/language/translate/v2?key=${API_Key}`;
  const languagesUrl = `https://translation.googleapis.com/language/translate/v2/languages?key=${API_Key}`;
  
  // For TTS via Google Cloud TTS API (in a real app, this would be a server endpoint)
  const ttsUrl = `https://texttospeech.googleapis.com/v1/text:synthesize?key=${API_Key}`;

  // Store available voices
  let availableVoices = [];
  let voicesLoaded = false;

  // Extended map to normalize language codes for speech synthesis
  const languageCodeMap = {
    // Common language code mappings that might need normalization
    'zh': 'zh-CN',    // Chinese (simplified by default)
    'zh-TW': 'zh-TW', // Chinese Traditional
    'yue': 'zh-HK',   // Cantonese
    'hmn': 'hmn',     // Hmong (might not be supported)
    'iw': 'he',       // Hebrew
    'jw': 'jv',       // Javanese
    'fil': 'tl',      // Filipino/Tagalog
    'ko': 'ko-KR',    // Korean
    'ar': 'ar-SA',    // Arabic
    'cs': 'cs-CZ',    // Czech
    'da': 'da-DK',    // Danish
    'nl': 'nl-NL',    // Dutch
    'fi': 'fi-FI',    // Finnish
    'el': 'el-GR',    // Greek
    'hi': 'hi-IN',    // Hindi
    'hu': 'hu-HU',    // Hungarian
    'id': 'id-ID',    // Indonesian
    'ja': 'ja-JP',    // Japanese
    'no': 'nb-NO',    // Norwegian
    'pl': 'pl-PL',    // Polish
    'fa': 'fa-IR',    // Persian
    'pt': 'pt-PT',    // Portuguese
    'ro': 'ro-RO',    // Romanian
    'ru': 'ru-RU',    // Russian
    'sk': 'sk-SK',    // Slovak
    'es': 'es-ES',    // Spanish
    'sv': 'sv-SE',    // Swedish
    'th': 'th-TH',    // Thai
    'tr': 'tr-TR',    // Turkish
    'vi': 'vi-VN',    // Vietnamese
  };

  // Map for fallback options when a language isn't available
  const fallbackVoiceMap = {
    // Base language -> array of fallback options
    'ar': ['en-US'],  // Arabic -> English
    'he': ['en-US'],  // Hebrew -> English
    'hi': ['en-IN', 'en-US'], // Hindi -> Indian English, then US English
    'fa': ['ar', 'en-US'], // Persian -> Arabic, then English
    'ur': ['hi-IN', 'en-US'], // Urdu -> Hindi, then English
    // Add more fallbacks as needed
  };

  // This tracks if a language is supported for TTS
  let supportedTtsLanguages = new Set();

  // List of fallback languages if API call fails
  const fallbackLanguages = [
    { code: 'en', name: 'English' },
    { code: 'es', name: 'Spanish' },
    { code: 'fr', name: 'French' },
    { code: 'de', name: 'German' },
    { code: 'it', name: 'Italian' },
    { code: 'pt', name: 'Portuguese' },
    { code: 'ru', name: 'Russian' },
    { code: 'ja', name: 'Japanese' },
    { code: 'ko', name: 'Korean' },
    { code: 'zh', name: 'Chinese (Simplified)' },
    { code: 'ar', name: 'Arabic' },
    { code: 'hi', name: 'Hindi' },
    { code: 'bn', name: 'Bengali' },
    { code: 'nl', name: 'Dutch' },
    { code: 'tr', name: 'Turkish' },
    { code: 'vi', name: 'Vietnamese' },
    { code: 'th', name: 'Thai' },
    { code: 'sv', name: 'Swedish' },
    { code: 'pl', name: 'Polish' },
    { code: 'fi', name: 'Finnish' },
    { code: 'el', name: 'Greek' },
    { code: 'cs', name: 'Czech' },
    { code: 'da', name: 'Danish' },
    { code: 'no', name: 'Norwegian' },
    { code: 'hu', name: 'Hungarian' },
    { code: 'id', name: 'Indonesian' },
    { code: 'ro', name: 'Romanian' },
    { code: 'sk', name: 'Slovak' },
    { code: 'uk', name: 'Ukrainian' },
    { code: 'he', name: 'Hebrew' }
  ];

  // Speech recognition setup
  let recognition;
  if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = "en-US"; // Default language

      recognition.onstart = function () {
        micButton.classList.add('active');
        // Show the text area when recording starts
        sourceText.style.display = 'block';
        document.querySelector('.input-label').style.display = 'block';
        sourceText.placeholder = "Listening...";
        
        // Change background to black when recording starts
        document.getElementById('app').style.cssText = `
  background: 
    radial-gradient(circle at top right, #4036f833, transparent 60%),
    radial-gradient(circle at bottom left, #ed3a662a, transparent 60%) !important;
`;

    };

      recognition.onresult = function (event) {
          const transcript = event.results[0][0].transcript;
          sourceText.value = transcript; // Assign without duplicate text
          
          // Show language selector after recording is done
          showLanguageSelector();
      };

      recognition.onend = function () {
          micButton.classList.remove('active');
          sourceText.placeholder = "Click the microphone icon to start speaking or type here...";
      };

      recognition.onerror = function (event) {
          console.error('Speech recognition error:', event.error);
          micButton.classList.remove('active');
          showFeedback("Speech recognition error: " + event.error);
      };
  } else {
      micButton.style.display = 'none';
      showFeedback("Speech recognition not supported in this browser");
  }
  
  // Function to show language selector
  function showLanguageSelector() {
      if (sourceText.value.trim() !== "" && languageSelector.style.display === 'none') {
          fadeIn(languageSelector);
          
          // Now show translate button
          setTimeout(() => {
              translateBtn.style.display = 'block';
          }, 500);
      }
  }
  
  // Function to show remaining buttons after translation
  function showRemainingButtons() {
      if (translatedText.value.trim() !== "") {
          speakBtn.style.display = 'block';
          copyBtn.style.display = 'block';
          resetBtn.style.display = 'block';
      }
  }
  
  // Function to fade in an element
  function fadeIn(element) {
      element.style.display = 'block';
      element.style.opacity = 0;
      
      setTimeout(() => {
          element.style.transition = 'opacity 0.5s ease';
          element.style.opacity = 1;
      }, 50);
  }

  // Load and cache available voices
  function loadAndCacheVoices() {
    if ('speechSynthesis' in window) {
      // Get available voices
      const voices = window.speechSynthesis.getVoices();
      if (voices && voices.length > 0) {
        availableVoices = voices;
        voicesLoaded = true;
        
        // Map of language codes to supported status
        voices.forEach(voice => {
          const langCode = voice.lang.split('-')[0];
          supportedTtsLanguages.add(langCode);
          supportedTtsLanguages.add(voice.lang); // Also add the full code
        });
        
        console.log(`Loaded ${voices.length} voices covering ${supportedTtsLanguages.size} languages`);
      }
      return voices.length > 0;
    }
    return false;
  }

  // Load languages from Google Translate API
  async function loadLanguages() {
    try {
      const url = `${languagesUrl}&target=en`;
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`API returned status: ${response.status}`);
      }
      
      const data = await response.json();
      
      targetLanguage.innerHTML = '';
      
      if (data && data.data && data.data.languages) {
        let languages = data.data.languages;
        
        // Sort languages alphabetically by name
        const sortedLanguages = languages.sort((a, b) => 
          a.name.localeCompare(b.name)
        );
        
        sortedLanguages.forEach(lang => {
          const option = document.createElement('option');
          option.value = lang.language;
          option.textContent = lang.name;
          
          // Mark languages that have TTS support
          const normalizedLang = languageCodeMap[lang.language] || lang.language;
          const baseLang = normalizedLang.split('-')[0];
          
          if (supportedTtsLanguages.has(normalizedLang) || supportedTtsLanguages.has(baseLang)) {
            option.textContent += ' 🔊'; // Add speaker icon to indicate TTS support
          }
          
          targetLanguage.appendChild(option);
        });
        
        console.log(`Successfully loaded ${sortedLanguages.length} languages`);
      } else {
        throw new Error("Invalid response format");
      }
    } catch (error) {
      console.error('Error loading languages:', error);
      showFeedback("Error loading languages. Using fallback list.");
      
      // Use fallback languages
      loadFallbackLanguages();
    }
  }
  
  // Load fallback languages
  function loadFallbackLanguages() {
    targetLanguage.innerHTML = '';
    
    fallbackLanguages.forEach(lang => {
      const option = document.createElement('option');
      option.value = lang.code;
      option.textContent = lang.name;
      
      // Mark languages that have TTS support
      const normalizedLang = languageCodeMap[lang.code] || lang.code;
      const baseLang = normalizedLang.split('-')[0];
      
      if (supportedTtsLanguages.has(normalizedLang) || supportedTtsLanguages.has(baseLang)) {
        option.textContent += ' 🔊'; // Add speaker icon to indicate TTS support
      }
      
      targetLanguage.appendChild(option);
    });
    
    console.log("Loaded fallback language list");
  }
  
  // Translate text using Google Translate API
  async function translateText(text, targetLang) {
    // Show loading state
    loader.style.display = 'block';
    translateBtn.disabled = true;
    
    try {
      // Validate inputs
      if (!text || !targetLang) {
        throw new Error("Invalid input for translation");
      }
      
      const response = await fetch(translateUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          q: text,
          target: targetLang,
          format: 'text'
        })
      });
      
      if (!response.ok) {
        throw new Error(`Translation API returned status: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data && data.data && data.data.translations && data.data.translations.length > 0) {
        return data.data.translations[0].translatedText;
      } else {
        throw new Error("Translation response missing expected data");
      }
    } catch (error) {
      console.error('Translation error:', error);
      showFeedback(`Translation error: ${error.message || "Please check your connection"}`);
      return "";
    } finally {
      // Always hide loading state
      loader.style.display = 'none';
      translateBtn.disabled = false;
    }
  }

  // Find the best voice for a language
  function findVoiceForLanguage(langCode) {
    if (!voicesLoaded || availableVoices.length === 0) {
      availableVoices = window.speechSynthesis.getVoices();
    }
    
    // Normalize language code
    const normalizedLang = languageCodeMap[langCode] || langCode;
    
    // Try exact match
    let voice = availableVoices.find(v => v.lang === normalizedLang);
    if (voice) {
      console.log(`Found exact voice match: ${voice.name} (${voice.lang})`);
      return voice;
    }
    
    // Try language family match (e.g., 'en-US' when looking for 'en')
    const baseLang = normalizedLang.split('-')[0];
    voice = availableVoices.find(v => v.lang.startsWith(baseLang + '-'));
    if (voice) {
      console.log(`Found language family match: ${voice.name} (${voice.lang})`);
      return voice;
    }
    
    // Try fallbacks if defined
    if (fallbackVoiceMap[baseLang]) {
      for (const fallbackLang of fallbackVoiceMap[baseLang]) {
        const fbNormalized = languageCodeMap[fallbackLang] || fallbackLang;
        voice = availableVoices.find(v => v.lang === fbNormalized || v.lang.startsWith(fbNormalized.split('-')[0] + '-'));
        if (voice) {
          console.log(`Found fallback voice: ${voice.name} (${voice.lang})`);
          return voice;
        }
      }
    }
    
    // Last resort - just pick the default voice
    console.warn(`No matching voice found for ${langCode}, using default voice`);
    return null;
  }
  
  // Function for text-to-speech with fallback to external TTS if needed
  function speakTranslatedText(text, languageCode) {
    if (!text.trim()) {
      showFeedback("No text to speak");
      return;
    }
    
    if (!('speechSynthesis' in window)) {
      showFeedback("Text-to-speech not supported in this browser");
      return;
    }
    
    // Cancel any ongoing speech
    window.speechSynthesis.cancel();
    
    // Normalize language code
    const normalizedLang = languageCodeMap[languageCode] || languageCode;
    
    // Create utterance
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = normalizedLang;
    
    // Try to find an appropriate voice
    const voice = findVoiceForLanguage(languageCode);
    if (voice) {
      utterance.voice = voice;
    }
    
    // Add event listeners to track speech status
    utterance.onstart = () => {
      console.log("Speech started");
      speakBtn.disabled = true;
    };
    
    utterance.onend = () => {
      console.log("Speech ended");
      speakBtn.disabled = false;
    };
    
    utterance.onerror = (event) => {
      console.error("Speech error:", event);
      
      // Try fallback TTS method if browser TTS fails
      fallbackTextToSpeech(text, languageCode);
      
      speakBtn.disabled = false;
    };
  
    // Speak the text
    try {
      window.speechSynthesis.speak(utterance);
    } catch (error) {
      console.error("Speech synthesis error:", error);
      showFeedback("Speech synthesis failed. Trying alternative method...");
      
      // Try fallback TTS
      fallbackTextToSpeech(text, languageCode);
    }
  }

  function speakText(text, lang = 'fa-IR') {
    const synth = window.speechSynthesis;
  
    // Ensure voices are loaded
    let voices = synth.getVoices();
    if (!voices.length) {
      // Chrome needs this trick sometimes
      speechSynthesis.onvoiceschanged = () => speakText(text, lang);
      return;
    }
  
    const voice = voices.find(v => v.lang === lang);
  
    if (voice) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.voice = voice;
      synth.speak(utterance);
    } else {
      fallbackTextToSpeech(text, lang);
    }
  }
  
  
  
  function fallbackTextToSpeech(text, languageCode) {
    showFeedback("Using external TTS service...");
  
    const ttsServiceUrl = `/api/text-to-speech?text=${encodeURIComponent(text)}&lang=${languageCode}`;
    const audio = new Audio(ttsServiceUrl);
  
    audio.oncanplaythrough = () => {
      audio.play();
    };
  
    audio.onerror = () => {
      showFeedback("Could not play audio from external service.");
    };
  }
  
  
  // Show feedback message
  function showFeedback(message) {
    feedbackText.textContent = message;
    feedback.style.display = 'flex';
    
    setTimeout(() => {
      feedback.style.display = 'none';
    }, 5000); // Show for 5 seconds for better visibility
  }
  
  // Event Listeners
  
  // Listen for input in source text to show language selector
  sourceText.addEventListener('input', function() {
    showLanguageSelector();
  });
  
  micButton.addEventListener('click', function() {
    if (recognition) {
      if (micButton.classList.contains('active')) {
        recognition.stop();
      } else {
        // Clear any previous input and start recording
        sourceText.value = '';
        recognition.start();
      }
    }
  });
  
  translateBtn.addEventListener('click', async function() {
    const text = sourceText.value.trim();
    const lang = targetLanguage.value;
    
    if (!text) {
      showFeedback("Please enter some text to translate");
      return;
    }
    
    if (!lang) {
      showFeedback("Please select a target language");
      return;
    }
    
    // Show translation section if not already visible
    if (translationSection.style.display === 'none') {
      fadeIn(translationSection);
    }
    
    const result = await translateText(text, lang);
    if (result) {
      translatedText.value = result;
      // Show remaining buttons after translation is complete
      showRemainingButtons();
    }
  });
  
  speakBtn.addEventListener('click', function() {
    const text = translatedText.value.trim();
    const lang = targetLanguage.value;
    
    if (!text) {
      showFeedback("No text to speak");
      return;
    }
    
    speakTranslatedText(text, lang);
  });
  
  copyBtn.addEventListener('click', function() {
    const text = translatedText.value.trim();
    
    if (!text) {
      showFeedback("No text to copy");
      return;
    }
    
    navigator.clipboard.writeText(text)
      .then(() => {
        showFeedback("Text copied to clipboard!");
      })
      .catch(err => {
        showFeedback("Failed to copy text: " + err);
      });
  });
  
  resetBtn.addEventListener('click', function() {
    sourceText.value = '';
    translatedText.value = '';
    
    // Reset UI to initial state
    sourceText.style.display = 'none';
    document.querySelector('.input-label').style.display = 'none';
    languageSelector.style.display = 'none';
    translationSection.style.display = 'none';
    
    // Hide all buttons except translate
    translateBtn.style.display = 'none';
    speakBtn.style.display = 'none';
    copyBtn.style.display = 'none';
    resetBtn.style.display = 'none';

    // Restore original background - be explicit with all properties
    const appElement = document.getElementById('app');
    appElement.style.cssText = ""; // Clear all inline styles first
    
    // Then reapply the original background styles
    appElement.style.background = "radial-gradient(circle at top right, #4036f833, transparent 60%), radial-gradient(circle at bottom left, #ed3a662a, transparent 60%),url('folder/Commune3.png') no-repeat center center/cover";
  });

  
  
  // Handle voices loaded for speech synthesis
  if ('speechSynthesis' in window) {
    // First attempt to load voices
    if (window.speechSynthesis.getVoices().length > 0) {
      loadAndCacheVoices();
    }
    
    // Some browsers need this event to properly load voices
    window.speechSynthesis.onvoiceschanged = function() {
      if (!voicesLoaded) {
        loadAndCacheVoices();
      }
    };
    
    // Fallback for browsers that might need a timeout
    setTimeout(() => {
      if (!voicesLoaded) {
        loadAndCacheVoices();
      }
    }, 1000);
  }
  
  // Initialize the app
  loadLanguages();
  
  // Add scroll animations for initial app container
  const appContainer = document.querySelector('.app-container');
  
  appContainer.style.opacity = 0;
  appContainer.style.transform = 'translateY(20px)';
  appContainer.style.transition = 'opacity 0.6s ease-out, transform 0.6s ease-out';
  
  setTimeout(() => {
    appContainer.style.opacity = 1;
    appContainer.style.transform = 'translateY(0)';
  }, 200);
});


document.querySelector(".mic-button").addEventListener("click", function (e) {
  const button = this;
  const ripple = document.createElement("span");
  
  const rect = button.getBoundingClientRect();
  const size = Math.max(rect.width, rect.height);
  
  ripple.style.width = ripple.style.height = `${size}px`;
  ripple.style.left = `${e.clientX - rect.left - size / 2}px`;
  ripple.style.top = `${e.clientY - rect.top - size / 2}px`;
  ripple.classList.add("ripple");

  button.appendChild(ripple);

  setTimeout(() => {
      ripple.remove();
  }, 600); // Remove ripple after animation
});

