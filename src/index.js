// Создай фронтенд часть приложения поиска данных о стране по её частичному или полному имени.

import { fetchCountries } from './js/fetchCountries';
import './css/styles.css';
import debounce from 'lodash.debounce';
import Notiflix from 'notiflix';
import axios from 'axios';
const DEBOUNCE_DELAY = 700;
let translatedText;
let word = '';
let data=[];
const URL = 'https://64298cb1ebb1476fcc4bb610.mockapi.io';

// Пошук поля вводу та місця для додавання списку в DOM
const refs = {
  engWord: document.querySelector('#search-box'),
  ruWord: document.querySelector('#ru-box'),
  countriesList: document.querySelector('.country-list'),
  countriesInfo: document.querySelector('.country-info'),
  translateText: document.querySelector('.translate-text'),
  buttonPlay: document.querySelector('.button-play'),
  buttonAdd: document.querySelector('.button-add'),
  buttonNext: document.querySelector('.button-next'),
};
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
  data = res[0];
  // console.log(data);
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
refs.buttonAdd.addEventListener('click', addToBase);
 //додає слова в базу 
function addToBase() {
  let translatePair = [
    refs.engWord.value.toLowerCase(),
    refs.ruWord.value.toLowerCase()
  ];
  if (data !== '' && refs.engWord.value !== '' && refs.ruWord.value !== "") {
   // console.log(data);
    data.array.push(translatePair);
    console.log(data);
    updateData(1, data);
  }
  console.log(translatePair);
}

function playSound() {
  word = refs.engWord.value.trim().toLowerCase();
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
  // очистка списку країн та інформації про країну
  refs.countriesInfo.innerHTML = '';
  refs.countriesList.innerHTML = '';

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

        console.log(translatedText);
        refs.ruWord.value = translatedText;

        playSound();

        // do something with the translated text
      })
      .catch(function (error) {
        console.log(error);
      });
  }

  // якщо користувач ввів не иснуючу назву країни, то відображає повідомлення
  if (1 === 0) {
    Notiflix.Notify.failure(`Oops, there is no country with that name`);
  }
}
// Розмітка для однієї країни
const createListCountries =
  item => `<li class="list list__info"><img src="${item.flags.png}" alt="${item.flags.alt}" width="30" height="20"/>
  <p class = "text">  ${item.name.official}</p></li>`;

// Перебір масива
const generateContent = array =>
  array.reduce((acc, item) => {
    return acc + createListCountries(item);
  }, '');

// Додавання в DOM
const insertContent = array => {
  const result = generateContent(array);
  refs.countriesList.insertAdjacentHTML('beforeend', result);
};

// Розмітка з інформацією для однієї країни (прапор, назва, столиця, населення, мови)
const createInfoCountries = item =>
  `<li class="list"><img src="${item.flags.png}" alt="${
    item.flags.alt
  }" width="60" hight="40"/>
  <p class="name"><b>${item.name.official}</b></p>
  <p><b>Capital</b>: ${item.capital}</p>
   <p><b>Population</b>: ${item.population}</p>
   <p><b>Languages</b>: ${Object.values(item.languages).join(', ')}</p></li>
  `;

// Перебір масива
const generateContentInfo = array =>
  array.reduce((acc, item) => {
    return acc + createInfoCountries(item);
  }, '');

// Додавання в DOM
const insertContentInfo = array => {
  const result = generateContentInfo(array);
  refs.countriesInfo.insertAdjacentHTML('beforeend', result);
};
