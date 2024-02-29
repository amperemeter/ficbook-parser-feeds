const needle = require('needle'),
  cheerio = require('cheerio'),
  fs = require('file-system'),
  fanficsArr = require('./fanfics'),
  { CookieJar } = require('tough-cookie'),
  newFanficsArr = [];


//  Создать задержку
function timeout(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Вывести в консоль кол-во фанфиков в fanfics.json
console.log(`Всего фэндомов: ${fanficsArr.length}\n`);

// Начать подсчет времени выполнения парсинга 
console.time("Конец работы");


(async () => {
  // получить данные с сайта
  async function scrape(fanficContext, link) {
    // проверить, к какому типу относится ссылка
    const linkFilter = link.includes('fandom_filter');

    // дополнить ссылку со страницы фильтра необходимыми параметрами
    const urlOuter = linkFilter ? `${link}&find=%D0%9D%D0%B0%D0%B9%D1%82%D0%B8!#result` : "";

    // добавить куки
    const cookieJar = new CookieJar();

    let options = {
      open_timeout: 60000,
      user_agent: 'MyApp/1.2.3',
      parse_response: false,
    }

    await needle('get', urlOuter || `${link}?p=1`, options)
      .then(async function (res, err) {
        if (err) throw err;

        // вычислить количество страниц на странице фэндома
        let $ = cheerio.load(res.body);
        // console.log(res.body);

        if (!$(".content-section").length) {
          throw new Error('Не найдена страница!');
        }

        const page = $(".pagenav .paging-description b:last-of-type").html() || '1';

        // дополнить ссылку со страницы фильтра необходимыми параметрами
        const urlInner = linkFilter ? `${link}&find=%D0%9D%D0%B0%D0%B9%D1%82%D0%B8!&p=${page}#result` : "";

        await needle('get', urlInner || `${link}?p=${page}`, options)
          .then(async function (res, err) {
            if (err) throw err;
            $ = cheerio.load(res.body);

            // вычислить количество фанфиков на последней странице
            let articles = $(".fanfic-inline").length - $(".fanfic-inline-hot").length;

            // вычислить количество фанфиков на всех страницах
            articles = (page - 1) * 20 + articles;
            await fanficContext.setArticleCount(articles); // установить значение в свойство articleCount
            await fanficContext.checkIsNew(); // проверить разницу между oldArticleCount и articleCount 
            await fanficContext.putData(); // добавить новые данные в массив newFanficsArr
          })
          .catch(function (err) {
            console.log(`Needle inner error!\n${err.message}\n`);
          });
      })
      .catch(function (err) {
        console.log(`Needle outer error!\n${err.message}\n`);
      });
  } // end function scrape


  // Рабочий объект  
  const fanficProto = {
    name: '',
    url: '',
    oldArticleCount: 0,
    articleCount: 0,
    async loadArticleCount() {
      await scrape(this, this.url);
    },
    setArticleCount(count) {
      // добавить в объект новое количество фанфиков
      this.articleCount = count;
    },
    hasNew() {
      // сравнить новое и старое количество фанфиков
      return this.articleCount - this.oldArticleCount;
    },
    checkIsNew() {
      const difference = this.hasNew();
      // проверить, к какому типу относится ссылка
      const linkFilter = this.url.includes('fandom_filter');
      // вывести после сравнения количество добавленных фанфиков  
      if (difference > 0 && linkFilter) {
        console.log(`${this.name}\nновых ${difference}\n${this.url}&find=%D0%9D%D0%B0%D0%B9%D1%82%D0%B8!#result\n`);
      } else if (difference > 0) {
        console.log(`${this.name}\nновых ${difference}\n${this.url}\n`);
      } else if (difference < 0) {
        console.log(`${this.name}\nудалено ${difference}\n`);
      }
    },
    async putData() {
      // cоздать объект с новыми данными и добавить их в массив newFanficsArr
      const newFanficsObject = {
        "name": this.name,
        "url": this.url,
        "count": this.articleCount
      };
      newFanficsArr.push(newFanficsObject);
    }
  } // end fanficProto 


  //Создать массив с данными из fanfics.json 
  async function readCollection() {
    // создать пустой массив
    const fanficsArrCopy = [];

    // создать объекты с использованием данных из fanfics.json и добавить их в массив fanficsArrCopy
    for (let i = 0; i < fanficsArr.length; i++) {
      const fanficObj = Object.assign({}, fanficProto);
      fanficObj.name = fanficsArr[i].name;
      fanficObj.url = fanficsArr[i].url;
      fanficObj.oldArticleCount = fanficsArr[i].count;
      fanficsArrCopy.push(fanficObj);
    }

    // вызвать функцию loadArticleCount для каждого объекта из созданного массива      
    for (const fanficsItem of fanficsArrCopy) {
      await fanficsItem.loadArticleCount();
      await timeout(500); // задержка
    }
  } // end function readCollection  


  await readCollection(); // вызвать функцию readCollection 

  if (fanficsArr.length == newFanficsArr.length) {
    await fs.writeFileSync('./fanfics.json', JSON.stringify(newFanficsArr, null, 2)); // записать новые данные в fanfics.json
  } else {
    console.log("Ошибка. Данные не могут быть сохранены");
  }

  console.timeEnd("Конец работы"); // завершить подсчет времени выполнения парсинга 
})();