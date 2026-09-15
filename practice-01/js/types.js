"use strict"
const sumStringNumber = "8" + 2;
console.log('1) "8" + 2 =', sumStringNumber);
console.log("   Тип результата:", typeof sumStringNumber);
const diffStringNumber = "8" - 2;
console.log('2) "8" - 2 =', diffStringNumber);
console.log("   Тип результата:", typeof diffStringNumber);


const explicitSum = Number("8") + 2;
console.log('3) Number("8") + 2 =', explicitSum);
console.log("   Тип результата:", typeof explicitSum);


const stringComparison = "12" > "3";
console.log('4) "12" > "3" =', stringComparison);
console.log("   Тип результата:", typeof stringComparison);

const strictEquality = 12 === "12";
console.log('5) 12 === "12" =', strictEquality);
console.log("   Тип результата:", typeof strictEquality);

const emptyStringToNumber = Number("");
console.log('6) Number("") =', emptyStringToNumber);
console.log("   Тип результата:", typeof emptyStringToNumber);
const invalidTextToNumber = Number("text");

console.log('7) Number("text") =', invalidTextToNumber);
console.log("   Тип результата:", typeof invalidTextToNumber);

const nonEmptyStringToBoolean = Boolean("false");
console.log('8) Boolean("false") =', nonEmptyStringToBoolean);
console.log("   Тип результата:", typeof nonEmptyStringToBoolean);
const typeofNull = typeof null;
console.log("9) typeof null =", typeofNull);
console.log("   Тип результата выражения typeof null:", typeof typeofNull);
const typeofNaN = typeof NaN;
console.log("10) typeof NaN =", typeofNaN);
console.log("    Тип результата выражения typeof NaN:", typeof typeofNaN);
