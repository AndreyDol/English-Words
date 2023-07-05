//Reader for txt and  game
import './css/styles.css';
import debounce from 'lodash.debounce';
import Notiflix from 'notiflix';
import axios from 'axios';
const DEBOUNCE_DELAY = 700;
let translatedText;
let txt = '';
let randomWord = '';
let currentWord = '';
let idCurrentWord = 0;
let speakMore = false;
let utterance = new SpeechSynthesisUtterance('hi');
let idEndWord = 0;
let lastRead = -1;
let timeOut;
let data = {
  array: [],
  id: '1',
};
let voiceIndex = 1;
let voices = window.speechSynthesis.getVoices();
window.speechSynthesis.onvoiceschanged = () => {
  voices = window.speechSynthesis.getVoices();
  voiceChenger();
};

let fontSize = 16;
//Url for Database
const URL = 'https://64298cb1ebb1476fcc4bb610.mockapi.io';

const refs = {
  engWord: document.querySelector('#search-box'),
  ruWord: document.querySelector('#ru-box'),
  countriesList: document.querySelector('.country-list'),
  countriesInfo: document.querySelector('.country-info'),
  engText: document.querySelector('.eng-text'),
  ruText: document.querySelector('.ru-text'),
  buttonPlay: document.querySelector('.button-play'),
  buttonPlayEng: document.querySelector('.button-play-eng'),
  buttonAdd: document.querySelector('.button-add'),
  buttonNext: document.querySelector('.button-next'),
  buttonDel: document.querySelector('.button-del'),
  buttonFile: document.getElementById('file'),
  divText: document.querySelector('.div-text'),
  inputWrap: document.querySelector('.text-size-wrap'),
  textspan: document.querySelector('.text-span'),
  buttonMinus: document.querySelector('.button-minus'),
  buttonPlus: document.querySelector('.button-plus'),
  popupButton: document.querySelector('.popup-button'),
  buttonVoice: document.querySelector('.voice-button'),
  buttonOnVoice: document.querySelector('.switch-btn'),
  buttonPause: document.querySelector('.button-pause'),
};
let currentWordTarget = refs.divText;
//Генерація рамдомного числа
const random = namber => Math.floor(Math.random() * namber);
//Генерациярандомного слова з бази
const randomGenWord = () => random(data.array.length);

//Приймає данні з сайту
const readData = () => {

  return fetch(`${URL}/data`).then(res => {
    if (res.ok) {
      return res.json();
    }
    //console.log(res);
    throw new Error(res.statusText);
  });
};

let dataLocal = localStorage.getItem('engword');
if (dataLocal) dataLocal = JSON.parse(dataLocal);
//  console.log(dataLocal);
readData().then(res => {
  if (res[0].array.length === 0 && !dataLocal) {
    Notiflix.Notify.info(`Base empty(База пуста, добавьте слова)`);
    return;
  }

  data = dataLocal || res[0];
 //  console.log(res[0]);
  randomWord = randomGenWord();
  refs.engText.textContent = data.array[randomWord][0];
  //
  // console.log(data.array);
});
//Add data to base
const updateData = (id, dataPut) => {
  if (dataPut)  localStorage.setItem('engword', JSON.stringify(dataPut));
  if (dataPut&&dataPut.array.length<100){
    return fetch(`${URL}/data/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(dataPut),
    });}
};

refs.buttonPlay.addEventListener('click', function () {
  playVoice(refs.engWord.value.trim().toLowerCase());
});
refs.buttonPlayEng.addEventListener('click', function () {
  playVoice(refs.engText.textContent.trim().toLowerCase());
});
refs.buttonAdd.addEventListener('click', addToBase);
refs.popupButton.addEventListener('click', addToBase);
refs.buttonNext.addEventListener('click', next);
refs.buttonDel.addEventListener('click', delInBase);
refs.divText.addEventListener('mousedown', wordToBase);
refs.buttonVoice.addEventListener('click', voiceChenger);
refs.buttonOnVoice.addEventListener('click', onVoice);
refs.buttonPause.addEventListener('click', onPause);

function onPause(e) {
  if (utterance && e.target.textContent === 'Pause') {
    e.target.textContent = 'Play';
    speakMore=false;
    speechSynthesis.cancel();
    return;
  }
  if (utterance && e.target.textContent === 'Play') {
    e.target.textContent = 'Pause';
    playVoiceRead(lastRead || 0);
    return;
  }
}

function onVoice() {
  if (refs.buttonOnVoice.classList.contains('switch-on')) {
    refs.buttonOnVoice.classList.remove('switch-on');
     refs.buttonPause.disabled = true;
    speakMore=false;
    if (utterance) speechSynthesis.cancel();
   
  } else {
    refs.buttonPause.textContent = 'Play';
    refs.buttonPause.disabled = false;
    refs.buttonOnVoice.classList.add('switch-on');
  }
}

function voiceChenger() {
  voices = window.speechSynthesis.getVoices();
  for (var i = voiceIndex+1; i < voices.length; i++) {
    if (voices[i].lang.includes('en')) {
      voiceIndex = i;
      refs.buttonVoice.textContent = voiceIndex + 'Voice';
      return;
    }
  }
  voiceIndex = 0;
  refs.buttonVoice.textContent = 0 + 'Voice';
}

function wordToBase(e) {
  speakMore = false;
  if (utterance) speechSynthesis.cancel();
  if (lastRead !== -1)
    document.querySelector(`[data-js="${lastRead}"]`).style.fontWeight = 400;
  currentWordTarget.style.fontWeight = 400;
  clearTimeout(timeOut);
  let input = e.target.textContent.toLowerCase().trim();

  if (input.indexOf(' ') !== -1) return;
  if (input.startsWith("'")) input = input.slice(1);
  if (input.endsWith("'")) input = input.slice(0, -1);
  if (input.endsWith('.') || input.endsWith(',')) {
    input = input.slice(0, -1);
  }
  currentWord = input;
  if (input !== '') {
    const sl = 'en';
    const tl = 'ru';

    let translateUrl = `https://translate.googleapis.com/translate_a/single?format=text&client=gtx&sl=${sl}&tl=${tl}&dt=t&q=${input}`;
    // sl – язык оригинала, tl – язык для перевода, originalText – текст запроса (можно использовать результат string.match(/.{1,2000}(?=\.)/gi))
    axios
      .get(translateUrl)
      .then(function (response) {
        translatedText = response.data[0][0][0];
        currentWordTarget = e.target;
        e.target.style.fontWeight = 700;
        setTimeout(function () {
          e.target.style.fontWeight = 400;
        }, 5000);
        refs.popupButton.style.fontSize = fontSize + 'px';
        refs.popupButton.textContent = currentWord + ' - ' + translatedText;
        refs.engWord.value = currentWord;
        refs.ruWord.value = translatedText;
        const widthWindow = refs.divText.offsetWidth;
        let x = e.clientX;
        if (x < 20) x = 20;
        if (x > widthWindow - 200) x = widthWindow - 200;
        refs.popupButton.style.left = x + 'px';
        // console.log(widthWindow);
        // console.log(widthMes);
        refs.popupButton.style.top = e.clientY - 65 + 'px';

        refs.popupButton.style.display = 'block';
        timeOut = setTimeout(popupButtonOff, 5000);

        idCurrentWord = parseInt(e.target.getAttribute('data-js'), 10);

        if (refs.buttonOnVoice.classList.contains('switch-on'))
          playVoiceRead(idCurrentWord);
        // do something with the translated text
      })
      .catch(function (error) {
        console.log(error);
      });

    playVoice(input);
  }
}

function popupButtonOff() {
  refs.popupButton.style.display = 'none';
}

refs.buttonMinus.addEventListener('click', function (e) {
  fontSize--;
  refs.divText.style.fontSize = fontSize + 'px';
  // refs.inputWrap.style.fontSize = fontSize + 'px';
  refs.textspan.textContent = fontSize;
  markup(txt);
});

refs.buttonPlus.addEventListener('click', function (e) {
  fontSize++;
  refs.divText.style.fontSize = fontSize + 'px';
  //refs.inputWrap.style.fontSize = fontSize + 'px';
  refs.textspan.textContent = fontSize;
  markup(txt);
});

refs.buttonFile.addEventListener('change', function (e) {
  if (e.target.files[0]) {
    // document.body.append('You selected ' + e.target.files[0].name);
    let file = e.target.files[0];
    let reader = new FileReader();
    reader.readAsText(file);
    reader.onload = function () {
      txt = reader.result;
      //txtArray = txt.split('\n');
      markup(txt);
    };
    reader.onerror = function () {
      console.log(reader.error);
    };
  }
});

function markup(txt) {
  const txtStringArray = txt.split('\n');
  let text = '';
  let idWord = 0;
  for (let i = 0; i < txtStringArray.length; i++) {
    const txtWordArray = txtStringArray[i].split(' ');
    text += `<div class="div-word">`;
    for (let i2 = 0; i2 < txtWordArray.length; i2++) {
      text += `<p class="word" data-js="${idWord}" style="padding-left: ${
        fontSize / 2.6
      }px;">${txtWordArray[i2]} </p>`;
      idWord++;
    }
    text += '</div>';
    idEndWord = idWord;
  }

  refs.divText.innerHTML = '';
  refs.divText.insertAdjacentHTML('beforeend', text);
}

function delInBase() {
  data.array.splice(randomWord, 1);
  console.log(randomWord);
  Notiflix.Notify.info(`Word ${refs.engText.textContent} deleted`);
  updateData(1, data);
  randomWord = randomGenWord();
  refs.engText.textContent = data.array[randomWord][0];
  playVoice(refs.engText.textContent.trim().toLowerCase());
  refs.ruText.textContent = '?';
}

function next() {
  if (refs.ruText.textContent === '?')
    refs.ruText.textContent = data.array[randomWord][1];
  else {
    randomWord = randomGenWord();
    refs.engText.textContent = data.array[randomWord][0];

    playVoice(refs.engText.textContent.trim().toLowerCase());

    refs.ruText.textContent = '?';
  }
}
function checkWordInBase() {
  if (data.array[0] === undefined) return true;
  for (var i = 0; i < data.array.length; i++) {
    if (data.array[i][0] === refs.engWord.value.toLowerCase()) return false;
  }
  return true;
}

//Add a word to base
function addToBase() {
  let translatePair = [
    refs.engWord.value.toLowerCase(),
    refs.ruWord.value.toLowerCase(),
  ];

  if (
    refs.engWord.value !== '' &&
    refs.ruWord.value !== '' &&
    checkWordInBase()
  ) {
    //  console.log(data);
    data.array.push(translatePair);
    // console.log(data);
    updateData(1, data);
    refs.engWord.value = "";
     refs.ruWord.value= "";
    Notiflix.Notify.success(`Words added to base. Now - ${data.array.length} `);
  } else if (!checkWordInBase()) Notiflix.Notify.info(`Word already in base.`);
  else Notiflix.Notify.warning(`Input eng word`);
}

function playVoice(words) {
  speakMore = false;
  if (utterance) speechSynthesis.cancel();
  if (words !== '') {
    try {
      const utterance = new SpeechSynthesisUtterance(words);
      utterance.voice = voices[voiceIndex];
      utterance.rate = 0.7;
      //  utterance.pitch = 1;
      //utterance.pause = 500;
      speechSynthesis.speak(utterance);
    } catch (error) {
      console.error('Error speechSynthesis:', error);
    }
  }
}
function getParagraph(idWord) {
  let paragraph = '';
  for (let i = idWord; i < idEndWord; i++) {
    paragraph += document.querySelector(`[data-js="${i}"]`).textContent;
    if (
      paragraph.length > 1000 &&
      document.querySelector(`[data-js="${i}"]`).textContent.includes('.')
    ) {
      return paragraph;
    }
  }
  return paragraph;
}
function playVoiceRead(idCurrentWord) {
  speakMore = true;
   
  const words = getParagraph(idCurrentWord + 1);
  // console.log(words);
  if (words !== '') {
    try {
      utterance = new SpeechSynthesisUtterance(words);
      utterance.voice = voices[voiceIndex];
      utterance.rate = 0.7;
      //  utterance.pitch = 1;
      //utterance.pause = 500;
      utterance.addEventListener('boundary', event => {
        const element = document.querySelector(
          `[data-js="${lastRead || idCurrentWord}"]`
        );
        //console.log(element);
        if (element && element.textContent && !isElementInViewport(element)) {
          element.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
        const wordIndex = event.charIndex;
        const words = utterance.text.trim().split(' ');
        //  let currentWord;

        for (let i = 0; i < words.length; i++) {
          const word = words[i];
          const start = i === 0 ? 0 : words.slice(0, i).join(' ').length + 1;
          const end = start + word.length;

          if (wordIndex >= start && wordIndex <= end) {
            currentWord = word;

            if (lastRead !== -1)
              document.querySelector(
                `[data-js="${lastRead}"]`
              ).style.fontWeight = 400;

            document.querySelector(
              `[data-js="${idCurrentWord + i + 1}"]`
            ).style.fontWeight = 700;
            lastRead = idCurrentWord + i + 1;
            document.querySelector(
              `[data-js="${idCurrentWord + i}"]`
            ).style.fontWeight = 400;

            utterance.onend = () => {
              console.log(lastRead);
              // Вызываем функцию с новым ID
              if (speakMore &&
                lastRead+1 < idEndWord &&
                refs.buttonOnVoice.classList.contains('switch-on') &&
                refs.buttonPause.textContent === 'Pause'
              )
                playVoiceRead(lastRead +1);
            };
            break;
          }
        }
        //    console.log(currentWord);
      });

      utterance.onstart = () => {
        refs.buttonPause.textContent = 'Pause';
      };

       utterance.onend = () => {
        refs.buttonPause.textContent = 'Play';
      };

      speechSynthesis.speak(utterance);
    } catch (error) {
      console.error('Error speechSynthesis:', error);
    }
  }
}

function isElementInViewport(element) {
  const rect = element.getBoundingClientRect();
  return (
    rect.top >= 0 &&
    rect.left >= 0 &&
    rect.bottom <=
      (window.innerHeight || document.documentElement.clientHeight) &&
    rect.right <= (window.innerWidth || document.documentElement.clientWidth)
  );
}
refs.engWord.addEventListener('input', debounce(onSearch, DEBOUNCE_DELAY));

function onSearch(event) {
  let input = refs.engWord.value.trim();

  if (input !== '') {
    const sl = 'en';
    const tl = 'ru';

    let translateUrl = `https://translate.googleapis.com/translate_a/single?format=text&client=gtx&sl=${sl}&tl=${tl}&dt=t&q=${input}`;
    // sl – язык оригинала, tl – язык для перевода, originalText – текст запроса (можно использовать результат string.match(/.{1,2000}(?=\.)/gi))
    axios
      .get(translateUrl)
      .then(function (response) {
        translatedText = response.data[0][0][0];

        // console.log(translatedText);
        refs.ruWord.value = translatedText;

        playVoice(refs.engWord.value.trim().toLowerCase());

        // do something with the translated text
      })
      .catch(function (error) {
        console.log(error);
      });
  }
}
