/******************************************
 * Dom element difinition
******************************************/
const form = document.querySelector('form');
const inputCity = document.getElementById('city');
const inputTime = document.getElementById('time');
const containerShow = document.querySelector('.container-show');
const grade = document.querySelector('.grade');

/******************************************
 * global variable difinition
******************************************/
// open weather map APIkey
const API_KEY = 'b5dd5c23ded7c226b825f0ac9d8b6a75';
// message & error message
const M_NO_INPUT = 'Please input city name.';
const ERR_001 = 'The city name you input dose not exist, please try again.';
const ERR_002 = 'The weather forecast data dose not exist.';
const ERR_003 = 'Something is wrong by using Country API to get country infomation.';
// colors
const COLOR_WHITE_SMOKE = 'whitesmoke';
const COLOR_DARK_GRAY = 'darkgray';
// weekday name
const weekDayFullNameArr = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const weekDayArr = ["Sun", "Mon", "Tue", "Wed", "Thur", "Friday", "Sat"];
// to save data from tempColors.json file
let canvasJsonData = [];
// Celsius/Fahrenheit temprature 
let celTemp = 0;
let fahTemp = 0;

/******************************************
 * initialize html
******************************************/
displayWeatherBlock(false);

/******************************************
 * Celsius tempurature hyperlink click event
******************************************/
const celLink = document.querySelector('#cel-unit');
celLink.addEventListener('click', switchTemp);

/******************************************
 * Fahrenheit tempurature hyperlink click event
******************************************/
const fahLink = document.querySelector('#fah-unit');
fahLink.addEventListener('click', switchTemp);

/******************************************
 * Form submit event
******************************************/
form.addEventListener('submit', showWeather);
function showWeather(event) {
    event.preventDefault();
    
    // input element [City] check
    if(String(inputCity.value).length == 0) {
        inputCity.focus();
        alert(M_NO_INPUT);
        return;
    }

    // clear html element
    removeAllElements();
    
    // get json data from tempColors.json
    // save these datas into gloable variable [canvasJsonData]
    getCanvasJsonData();

    // GEO API url
    const geoUrl = `https://api.openweathermap.org/geo/1.0/direct?q=${inputCity.value}&limit=1&appid=${API_KEY}`;

    // fetch Geographical coordinates data
    // if success -> fetch weather data
    fetch(geoUrl)
        .then(getJsonData)        //promise then callback(param:geo response)
        .then(getMultipleAPIData) //promise then callback(param:geo value) -> fetch weather
        .catch(handleErrors);
}

/******************************************
 * Clear all elements from div
 * daily-weather(to show daily weather info),
 * list-weather(to show 5 days forecast)
******************************************/
function removeAllElements() {
    const remove = (element) => document.querySelectorAll(element).forEach(el => el.remove());
    remove('.hourly-box');  // remove 24h data
    remove('.list-line');   // remove 4-day-forecast data

    const listTitle = document.querySelector('.list-line-title');
    listTitle.style.display = 'none';

    displayWeatherBlock(false);
}
/******************************************
 * param1: promise's result
 * return: 
 *      -> promise is success  : json data
 *      -> promise is rejected : exception throw
 * Get weather json data
******************************************/
function getJsonData(response) {
    // normal: response.ok 
    // if(response.ok) {
    if(response.status >= 200 && response.status < 300) {
        return response.json();
    } else {
        // throw Promise.reject(new Error(response.statusText));
        throw response.statusText;
    }
}

/******************************************
 * param1: Geographical json data
 * 
 * Get&Set the Weather data
******************************************/
function getMultipleAPIData(value) {
    // check if GEO fetch data exists
    if(value.length == 0){
        inputCity.focus();
        inputCity.select();
        throw ERR_001;
    }

    const lat = value[0].lat;
    const lon = value[0].lon;
    const country = value[0].country;
    
    // Get weather list
    getWeatherList(lat, lon);

    // get temperature in Fahrenheit
    getCurrentWeatherFah(lat, lon);

    // get & set country data
    getCountry(country);

    // weather div visable
    displayWeatherBlock(true);

    // set Cel link avilable
    setLinkProperty('cel-unit');
}

/******************************************
 * param1: Geographical coordinates
 *    - lat: latitude
 *    - lon: longitude
 * 
 * Get forecast data by using 
 * API - [5 day weather forecast]
 * temperature in Celsius
******************************************/
function getWeatherList(lat, lon) {
    const url= `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&units=metric&appid=${API_KEY}`;
    console.log(`[Weather List url]`, url);

    fetch(url)
    .then(getJsonData)
    .then(getWeatherData)
    .catch(handleErrors);
}

/******************************************
 * param1: Geographical coordinates
 *    - lat: latitude
 *    - lon: longitude
 * 
 * Get temperature in Fahrenheit
******************************************/
function getCurrentWeatherFah(lat, lon) {
    const url = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=imperial`;
    console.log('[Weather(Fahrenheit) ur]', url);

    fetch(url)
        .then(getJsonData)
        .then(value => fahTemp = value.main.temp.toFixed())
        .catch(handleErrors);
}

/******************************************
 * Get & Set country data & flag
******************************************/
function getCountry(country) {
    const url = `https://restcountries.com/v3.1/alpha/${country}`;
    console.log('[countryUrl ]', url);
    fetch(url)
        .then(getJsonData)
        .then(setCountryValue)
        .catch(handleErrors);
}

/******************************************
 * param1: 
 *    -value: current weather data
 * 
 * Set current Weather data in HTML
******************************************/
function showCurrentWeather(value) {
    const icon = document.querySelector('.icon');
    icon.src = `https://openweathermap.org/img/wn/${value.weather[0].icon}@2x.png`;
    
    celTemp = value.main.temp.toFixed();
    grade.innerText = celTemp + '°';
    celLink.style.color = COLOR_WHITE_SMOKE;
    celLink.style.textDecoration = 'underline';

    const humidity = document.querySelector('.humidity');
    humidity.innerText = value.main.humidity + '%';
    const wind = document.querySelector('.wind');
    wind.innerText = value.wind.speed + 'm/s';

    const weather = document.querySelector('.weather');
    weather.innerText = 'Weather';
    const weekday = document.querySelector('.weekday');
    weekday.innerText = weekDayFullNameArr[getFutureDate(0).getDay()];
    const description = document.querySelector('.description');
    description.innerText = value.weather[0].description;
}

/******************************************
 * param1: 
 *    - value: [5 day weather forecast] json data
 *             totally 40 records
 * 
 * Get forecast data by using 
 * API - [5 day weather forecast]
 * temperature in Celsius
******************************************/
function getWeatherData(value) {
    // check if Weather forecast fetch data exists
    if(value.length == 0){
        throw ERR_002;
    }

    // set current weather data
    showCurrentWeather(value.list[0]);
    
    // set 24h weather data
    showWeatherIn24hours(value);
    
    // set 5 days weather forecast(not includes today's data)
    const myForecast = createForecastArr(value);
    showFourDaysForecast(myForecast);
}

/******************************************
 * param1: json data(40 records from API)
 * 
 * Create an array includes 
 *  - Weekday
 *  - icon(at 12 o'clock) 
 *  - temprature in one day(8 datas)
 *  - color for every temprature(8 datas) 
 *    according to tempColors.json
******************************************/
function createForecastArr(value) {
    let retArr = [];
    // weather forecast data with 3-hour step  
    // caculate how many records will be avilable according to user's time input 
    const totalRecordNumber = parseInt(inputTime.value/3);
    let loopNumber = 0;
    if(totalRecordNumber > 8) {
        if(totalRecordNumber >= value.list.length) {
            loopNumber = value.list.length;
        } else {
            loopNumber = totalRecordNumber;
        }
    } else {
        return retArr;
    }
    
    let tempInfo = {
        weekday: '',
        allIconArr: [],
        allTempArr: [],
        canvasColorArr: []
    }

    let iconArr = [];
    let tempArr = [];
    let colorArr = [];
    let counter = 0;
    let dayNumber = 1;
    let isWholeDay = true;

    for(let i=0; i<loopNumber; i++) {
        let dateYMD = value.list[i].dt_txt.substring(0, 10);

        // the weather of current day will not be shown in the 4-days-forecast list
        if( dateYMD === getFutureDateString(0)) {
            continue;
        }
        
        if(isWholeDay) {
            isWholeDay = parseInt((loopNumber-i)/8)==0?false:true;
        }
        
        // 0-7 for one day's data
        if(counter >= 8 || !isWholeDay && i==loopNumber-1) {
            tempInfo.allIconArr = iconArr;
            tempInfo.allTempArr = tempArr;
            tempInfo.canvasColorArr = colorArr;

            // add one day temprature into a array
            retArr.push(tempInfo);

            // array data reset
            tempInfo = {
                weekday: '',
                allIconArr: [],
                allTempArr: [],
                canvasColorArr: []
            };
            iconArr = [];
            tempArr = [];
            colorArr = [];
            // counter reset
            counter = 0;
            // day after current day
            dayNumber++;
        } else {
            // get the next day return string. yyyy-mm-dd
            const strCurrentDay = getFutureDateString(dayNumber);
            // get the next day return date
            const dateCurrentDay = getFutureDate(dayNumber);
            
            //eg. "2023-05-26 21:00:00"
            const dtTxt = value.list[i].dt_txt;
            //eg. "21"
            // const time = parseInt(dtTxt.substring(11, 13));
            const time = dtTxt.substring(11, 13);
            
            // eg. "2023-05-26"
            if(dtTxt.substring(0, 10) == strCurrentDay) {
                // set all temprature in one day into temp array
                iconArr.push(value.list[i].weather[0].icon);
                tempArr.push(value.list[i].main.temp.toFixed());
                colorArr.push(getCanvasColor(value.list[i].main.temp));
                // day of the week
                tempInfo.weekday = weekDayArr[dateCurrentDay.getDay()];
            }
        }
        counter++;
    }
    return retArr;
}

/******************************************
 * param: 
 *    - element: forecast data array
 * 
 * Create new div element for each forecast data
 * includes Weekday, temprature(minmun, maximun)
 * icon and gradient color line
******************************************/
function showFourDaysForecast(arr) {
    const div = document.querySelector('.list-weather');
    
    if(arr.length <=0) return;
    
    // 5-day-forecast data exists, the title will be shown
    const listTitle = document.querySelector('.list-line-title');
    listTitle.style.display = 'flex';

    arr.forEach(element => {

        if(element.weekday == '') return;

        // create new elements to show weather list for coming days
        const subDiv = createDivElement('list-line');
        div.append(subDiv);
    
        // p elements(weekday)
        const weekDay = createPElement(element.weekday, 'list-element');
    
        // img element(icon)
        const imgDiv = createDivElement('list-element');
        const img = createImgElement(`https://openweathermap.org/img/wn/${element.allIconArr[parseInt(element.allIconArr.length/2)]}@2x.png`,
        '50px', 'auto', 'icon', 'Weather icon');
        imgDiv.append(img);

        // p elements(minimum/maximum temprature)
        const startTemp = createPElement(Math.min(...element.allTempArr) + '°', 'list-element')
        const endTemp = createPElement(Math.max(...element.allTempArr) + '°', 'list-element')
        
        // div element(canvas gredient color line)
        const canvasDiv = makeCanvasColorDiv(element.canvasColorArr);

        // append into list-line div
        subDiv.append(weekDay, imgDiv, startTemp, canvasDiv, endTemp);
    });
}

/******************************************
 * param 
 *    - arr: array
 *      eg. ['a1', 'a1', 'a2', 'a3', 'a4', 'a2' ]
 * return
 *    - object : 
 *      eg. {
 *            'a1': 2,
 *            'a2': 2,
 *            'a3': 1,
 *            'a4': 1
 *          }
 * Get item and item number from array
******************************************/
function getItemNumInArray(arr){
    if(arr == undefined || arr == null || arr.length == 0) return {};

    let retObj = {};
    arr.forEach(element =>{
        if(retObj[element]) {
            retObj[element]++;
        } else {
            retObj[element] = 1;
        }
    });
    return retObj;
}

/******************************************
 * param 
 *    - strSrc: img.src
 * param options
 *    - strWidth:     img.width
 *    - strHeight:    img.height
 *    - strClassName: img.className
 *    - strAlt:       img.alt
 * 
 * return
 *    - img element
 * 
 * Create HTML img element 
******************************************/
function createImgElement(strSrc, strWidth, strHeight, strClassName, strAlt) {
    const img = document.createElement('img');
    img.src = strSrc;

    if(arguments.length == 1) {
        img.style.width = '50px';
        img.style.height = 'auto';
        img.className = '';
        img.alt = '';
    }
    if(arguments.length == 2) {
        img.style.width = strWidth;
        img.style.height = 'auto';
        img.className = '';
        img.alt = '';
    }
    if(arguments.length == 3) {
        img.style.width = strWidth;
        img.style.height = strHeight;
        img.className = '';
        img.alt = '';
    }
    if(arguments.length == 4) {
        img.style.width = strWidth;
        img.style.height = strHeight;
        img.className = strClassName;
        img.alt = '';
    }
    if(arguments.length == 5) {
        img.style.width = strWidth;
        img.style.height = strHeight;
        img.className = strClassName;
        img.alt = strAlt;
    }

    return img;
}

/******************************************
 * param 
 *    - className : class name
 * return
 *    - div element
 * 
 * Create HTML div element 
******************************************/
function createDivElement(className) {
    const div = document.createElement('div');
    div.className = className;

    return div
}
/******************************************
 * param 
 *    - value     : p.innerText
 *    - className : class name
 * return
 *    - p element
 * 
 * Create HTML P element 
******************************************/
function createPElement(value, className) {
    const p = document.createElement('p');
    p.innerText = value;

    if(arguments.length == 2) {
        p.className = className;
    }
    return p
}
        
/******************************************
 * param: 
 *    - value: forecast data
 *      (total 40 records)
 * 
 * Set 24 hours Weather data in HTML
******************************************/
function showWeatherIn24hours(value) {
    const div = document.querySelector('.daily-weather');
    // weather forecast data with 3-hour step  
    // caculate how many records will be avilable according to user's time input 
    const totalRecordNumber = parseInt(inputTime.value/3);

    // 8 records for 24h : index is from 0 to 7
    for(let i=0; i<value.list.length; i++) {
        // only show the weather forecast for the next 24h
        if(i>=8 || i>= totalRecordNumber) break;

        // add [hourly-box] div into [daily-weather] div
        const subDiv = document.createElement('div');
        subDiv.className = 'hourly-box';
        div.append(subDiv);
        
        // time
        const textP = (i==0)?'now':value.list[i].dt_txt.substring(11, 13);
        const p1 = createPElement(textP);

        const img = createImgElement(`https://openweathermap.org/img/wn/${value.list[i].weather[0].icon}@2x.png`,
        '50px', 'auto', 'icon', 'Weather icon');

        // temprature
        const p2 = createPElement(value.list[i].main.temp.toFixed() + '°');
        subDiv.append(p1, img, p2);
    }
}

/******************************************
 * param1: json data
 * 
 * Set Weather data detail
******************************************/
function setCountryValue(value) {
    if(value.length == 0){
        throw ERR_003;
    }
    // city, country, flag
    const cityName = document.getElementById('city-name');
    cityName.innerText = inputCity.value.toUpperCase();
    const countryName = document.getElementById('country-name');
    countryName.innerText = value[0].name.common.toUpperCase();
    const flag = document.getElementById('flag');
    flag.src = value[0].flags.png;
}

/******************************************
 * param1: error 
 * 
 * Handle when exception occures
******************************************/
function handleErrors(err) {
    alert(err);
    console.log(err);
}

/******************************************
 * param1: show 
 *      true:  [container-show] visible
 *      false: [container-show] invisible
 * 
 * Set Weather info zon[container-show]
 *  visible/invisible
******************************************/
function displayWeatherBlock(show) {
    if(show === true) {
        containerShow.style.display = 'flex';
    } else {
        containerShow.style.display = "none";
    }
}

/******************************************
 * Param: temp type
 *      'cel': show Celsius temprature 
 *      'fah': show Fahrenheit temprature
 * 
 * Switch temprature between 
 *  Fahrenheit and Celsius
******************************************/
function switchTemp(event) {
    event.preventDefault();

    setLinkProperty(event.target.id);
}

/******************************************
 * Param: type
 *      'cel-unit': link Celsius avialble
 *      'fah-unit': link Fahrenheit avialble
 * 
 * According to parameter 'type' 
 * set the properties of link cel and fah 
******************************************/
function setLinkProperty(type) {
    if(type === 'cel-unit') {
        grade.innerText = celTemp + '°';
        // cel link change style
        celLink.style.color = COLOR_WHITE_SMOKE;
        celLink.style.textDecoration = 'underline';
        // fah link clear
        fahLink.style.color = COLOR_DARK_GRAY;
        fahLink.style.textDecoration = 'none';
        
    } else if(type ===  'fah-unit') {
        grade.innerText = fahTemp + '°';
        // cel link clear style
        celLink.style.color = COLOR_DARK_GRAY;
        celLink.style.textDecoration = 'none';
        // fah link change style
        fahLink.style.color = COLOR_WHITE_SMOKE;
        fahLink.style.textDecoration = 'underline';
    }
}

/******************************************
 * param1: 
 *   num : 0 - today
 *         1 - tomorrow
 *         2 - 2 days later
 * return: 
 *   date by string
 *   eg. 2027-05-30
 * 
 * Get future date, return string type
******************************************/
function getFutureDateString(num) {
    const d = new Date();
    d.setDate(d.getDate() + num);

    return d.toLocaleDateString();
}

/******************************************
 * param1: 
 *  num : 0 - today
 *        1 - tomorrow
          2 - 2 days later
          etc.
 * return: 
 *  date by date
 * 
 * Get future date, return string type
******************************************/
function getFutureDate(num) {
    const d = new Date();
    d.setDate(d.getDate() + num);
    return d;
}

/******************************************
 * param1: 
 *     colorArr  : gradient color array
 * 
 * return: 
 *     div
 * 
 * Make gradient color line and return div
******************************************/
function makeCanvasColorDiv(colorArr) {
    // create div elememt with class-name is 'canvas-div'
    const div = createDivElement('canvas-div');
    
    const canvas = document.createElement('canvas');
    canvas.className = 'canvas';
    div.append(canvas);

    const context = canvas.getContext('2d');

    // Set the start and end coordinates of the line
    const startX = 0;
    const startY = 0;
    const endX = 100;
    const endY = 0;

    // create gradient color line
    const gradient = context.createLinearGradient(startX, startY, endX, endY);
    const colorNumber = colorArr.length;
    let position = 1/(colorNumber-1);
    if(colorNumber == 1) {
        gradient.addColorStop(0, colorArr[0]);
        gradient.addColorStop(1, colorArr[0]);
    } else if(colorNumber == 2) {
        gradient.addColorStop(0, colorArr[0]);
        gradient.addColorStop(1, colorArr[1]);
    } else if(colorNumber > 2) {
        gradient.addColorStop(0, colorArr[0]);
        gradient.addColorStop(1, colorArr[colorNumber-1]);
        for(let i=1; i<colorNumber-2; i++) {
            gradient.addColorStop(position*i, colorArr[i]); 
        }
    } 

    // set the style of line to be gradient
    context.lineWidth = 10;
    context.strokeStyle = gradient;

    // start to draw
    context.beginPath();
    context.moveTo(startX, startY);  // start position
    context.lineTo(endX, endY);      // end position
    context.stroke();                // draw

    return div;
}

/******************************************
 * Get json data from tempColors.json
 * and save data into gloable variable 
 * [canvasJsonData]
******************************************/
function getCanvasJsonData() {
    fetch('./tempColors.json')
    .then((response) => response.json())
    .then(value => {
        canvasJsonData = value;
    })
    .catch(handleErrors);
}

/******************************************
 * param:
 *    - temp : temprature
 * return:
 *    - color from [canvasJsonData]
 * 
 * According to the temperature data ,
 * get the corespongding color from
 * canvas JSON data
 * To be used to set canvas gredient colors
 * in 5 days forcast list
******************************************/
function getCanvasColor(temp) {
    let ret = '';
    for(let i=0; i<canvasJsonData.length; i++) {
        if(temp >= canvasJsonData[i].minTemp &&
           temp <= canvasJsonData[i].maxTemp) {
            ret = canvasJsonData[i].color;
            // exit for loop
            break;
        }
    }
    return ret;
}