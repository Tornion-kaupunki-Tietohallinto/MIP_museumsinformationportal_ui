var fs = require('fs')

var helpString = '--------------------\n| ADD TRANSLATIONS |\n--------------------\n  USAGE: npm run at <filename> <tag> <fi> <sv> <en>\n  EXAMPLE: npm run at ark "New_translation_for_mip" "Uusi käännös" "Nya translation" "New translation"';

//Check that args are given
if(process.argv[2] === undefined) {
  console.error("No filename given");
  console.log(helpString);
  process.exit(2);
}
if(process.argv[2] === 'help' || process.argv[2] === '*') {
  console.log(helpString);
  process.exit(0);
}
if(process.argv[3] === undefined) {
  console.error("No tag given");
  console.log(helpString);
  process.exit(3);
}
if(process.argv[4] === undefined) {
  console.error("No translation given");
  console.log(helpString);
  process.exit(4);
}

//Initialize variables etc.
var langs = ["en-US", "fi-FI", "sv-FI"]; //Folders that we go into under app/languages/
var filepath = "./app/languages/"; //path to localizations
var filename = process.argv[2]; //Filename, same under each lang folder
filename += ".lang.json"; //File ending
var addTag = process.argv[3]; //Tag to add to the files

//Translations. If swe and eng translations are missing, default to Finnish one
var addStringFi = process.argv[4];
var addStringSv = process.argv[5] !== undefined ? process.argv[5] : addStringFi;
var addStringEn = process.argv[6] !== undefined ? process.argv[6] : addStringFi;

//Open file, modify contents and write it
function addToFile(lang) {
  let fn = lang + "/" + filename;
  //Read the file
  fs.readFile(String(filepath+fn), 'utf8', function (err,data) {
    if (err) {
      return console.log(err);
    }

    //String to add
    var addString = "";
    if(lang === 'fi-FI') {
      addString = addStringFi;
    }
    if(lang === 'sv-FI') {
      addString = addStringSv;
    }
    if(lang === 'en-US') {
      addString = addStringEn;
    }
  
    //Replace last " char with ", 
    var result = data.replace(/\"$/gm, '",');
    //Replace } with intendation and the actual translation, add \n and } to end the file properly
    result = result.replace(/\}/g, '    "' + addTag + '": "' + addString + '"\n}')
  
    //Write it back to disk
    fs.writeFile(String(filepath+fn), result, 'utf8', function (err) {
       if (err) return console.log(err);
    });
  });
}

//Just do it!
langs.forEach(lang => {
  addToFile(lang);
});
