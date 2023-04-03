// Создай фронтенд часть приложения поиска данных о стране по её частичному или полному имени.

import { fetchCountries } from './js/fetchCountries';
import './css/styles.css';
import debounce from 'lodash.debounce';
import Notiflix from 'notiflix';
import axios from 'axios';
const DEBOUNCE_DELAY = 700;
let translatedText;
let word = '';
let data = {
  array: [],
  id: '1',
};
let randomWord = '';

const URL = 'https://64298cb1ebb1476fcc4bb610.mockapi.io';

// Пошук поля вводу та місця для додавання списку в DOM
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
};
//Герерация рамдомного числа
const random = namber => Math.floor(Math.random() * namber);
//Генерациярандомного слова з бази
const randomGenWord = () => random(data.array.length);

//Приймає данні зсайту
const readData = () => {
  return fetch(`${URL}/data`).then(res => {
    if (res.ok) {
      return res.json();
    }
    //console.log(res);
    throw new Error(res.statusText);
  });
};

readData().then(res => {
  if (res[0].array.length === 0) {
    Notiflix.Notify.info(`Base empty(База пуста, додайте слова)`);
    return;
  }
  data = res[0];
  randomWord = randomGenWord();
  refs.engText.textContent = data.array[randomWord][0];
  //
  // console.log(data.array);
});
//Записує данні на сайт
const updateData = (id, dataPut) => {
  return fetch(`${URL}/data/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(dataPut),
  });
};

refs.buttonPlay.addEventListener('click', playSound);
refs.buttonPlayEng.addEventListener('click', playSoundEng);
refs.buttonAdd.addEventListener('click', addToBase);
refs.buttonNext.addEventListener('click', next);
refs.buttonDel.addEventListener('click', delInBase);

function delInBase() {
  data.array.splice(randomWord, 1);
  console.log(randomWord);
  Notiflix.Notify.info(`Word ${refs.engText.textContent} deleted`);
  updateData(1, data);
   randomWord = randomGenWord();
   refs.engText.textContent = data.array[randomWord][0];
   playSoundEng();
   refs.ruText.textContent = '?';
}

function next() {
  // console.log(data.array[random(data.array.length)][0]);
  if (refs.ruText.textContent === '?')
    refs.ruText.textContent = data.array[randomWord][1];
  else {
    randomWord = randomGenWord();
    refs.engText.textContent = data.array[randomWord][0];
    playSoundEng();
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

//додає слова в базу
function addToBase() {
  let translatePair = [
    refs.engWord.value.toLowerCase(),
    refs.ruWord.value.toLowerCase(),
  ];

  if (
    refs.engWord.value !== '' &&
    refs.ruWord.value !== '' &&
    checkWordInBase()  ) {
    console.log(data);
    data.array.push(translatePair);
    console.log(data);
    updateData(1, data);
    Notiflix.Notify.success(`Words added to base. Now - ${data.array.length} `);
  } else if (!checkWordInBase()) Notiflix.Notify.info(`Word already in base.`);
  else Notiflix.Notify.warning(`Input eng word`);
  // console.log(translatePair);
}

function playSound() {
  word = refs.engWord.value.trim().toLowerCase();
  if (word !== '') {
    try {
      const audio = new Audio(
        `https://api.dictionaryapi.dev/media/pronunciations/en/${word}-us.mp3`
      );
      audio.play();
    } catch (e) {
      console.log(e);
    }
  }
}
function playSoundEng() {
  word = refs.engText.textContent.toLowerCase();
  if (word !== '') {
    try {
      console.log('Play sound');
      const audio = new Audio(
        `https://api.dictionaryapi.dev/media/pronunciations/en/${word}-us.mp3`
      );
      audio.play();
    } catch (e) {
      console.log(e);
    }
  }
}
// Додає слухача та використовує функцію debounce, яка робить HTTP-запит через 300мс після того, як користувач перестав вводити текст
refs.engWord.addEventListener('input', debounce(onSearch, DEBOUNCE_DELAY));

function onSearch(event) {
  // записуємо в змінну введене значення користувачем (trim прибирає пробіли)
  let input = refs.engWord.value.trim();

  // перевірка, якщо значення не пустий рядок

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

        playSound();

        // do something with the translated text
      })
      .catch(function (error) {
        console.log(error);
      });
  }
}

// Додавання в DOM
// const insertContentInfo = array => {
//   const result = generateContentInfo(array);
//   refs.countriesInfo.insertAdjacentHTML('beforeend', result);
// };
