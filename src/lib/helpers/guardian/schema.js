import { timeParse, timeFormat } from 'd3-time-format';

/**
 * Analyzes data structure and returns schema information for each column
 * @param {Array} data - Array of data objects
 * @returns {Array} Array of column schema objects
 */
export function schema(data) {
  if (!data || !Array.isArray(data) || data.length === 0) {
    return [];
  }

  const firstRow = data[0];
  const columns = Object.keys(firstRow);
  
  return columns.map((column, index) => {
    const values = data.map(row => row[column]).filter(val => val != null && val !== '');
    
    if (values.length === 0) {
      return createEmptyColumnSchema(column, index);
    }

    // Determine data types
    const types = new Set();
    values.forEach(val => {
      if (typeof val === 'number' && !isNaN(val)) {
        types.add('number');
      } else if (typeof val === 'string') {
        types.add('string');
      } else if (typeof val === 'boolean') {
        types.add('boolean');
      }
    });

    const dataTypes = Array.from(types);
    const primaryType = dataTypes.includes('number') ? 'number' : 
                       dataTypes.includes('string') ? 'string' : 
                       dataTypes[0] || 'string';

    // Create format information based on primary type
    let format;
    if (primaryType === 'number') {
      const numericValues = values.filter(val => typeof val === 'number' && !isNaN(val));
      const min = Math.min(...numericValues);
      const max = Math.max(...numericValues);
      const hasEmptyValues = values.length < data.length;
      
      format = {
        min: min,
        max: max,
        scale: 'scaleLinear',
        hasEmptyValues: hasEmptyValues,
        sequential: isSequential(numericValues),
        strictly: true
      };
    } else {
      const uniqueValues = new Set(values);
      const longest = Math.max(...values.map(val => String(val).length));
      
      format = {
        hasRepeat: uniqueValues.size < values.length,
        longest: longest,
        scale: uniqueValues.size <= 10 ? 'scaleOrdinal' : 'scaleBand'
      };
    }

    return {
      column: column,
      index: index,
      label: column,
      dataTypes: dataTypes,
      formats: [{
        type: primaryType,
        format: format
      }]
    };
  });
}

export function getColumnSchema(data) {
  const schema = schema(data);
  return schema;
}

/**
 * Determines the appropriate D3 scale type based on the provided dataset.
 * @param {Array} data - The dataset to be analyzed.
 * @returns {string} - The determined scale type or an error message.
 */
export function determineD3ScaleType(data) {
  // Check if the data is a valid non-empty array
  if (!Array.isArray(data) || data.length === 0) {
    return 'Invalid data';
  }

  const sample = data[0];
  const allNumbers = data.every(d => typeof d === 'number');
  const allDates = data.every(d => d instanceof Date);
  const hasNegative = data.some(d => d < 0);
  const distinctValues = new Set(data).size;

  // Rule for Time Data
  if (allDates) {
    return "scaleTime";
  }

  // Rule for Numerical Data
  if (allNumbers) {
    // Log scale cannot handle negative values
    if (hasNegative) {
      return "scaleLinear";
    }
    
    const max = Math.max(...data);
    const min = Math.min(...data);

    // Use log scale for wide range values
    if (max / min > 1000) {
      return "scaleLog";
    }
    
    // Use linear scale as a default for numerical data
    return "scaleLinear";
  }

  // Rule for Categorical Data
  if (typeof sample === 'string' || !allNumbers) {
    // If the dataset is small and distinct, use ordinal scale
    if (distinctValues === data.length) {
      return "scaleOrdinal";
    }
    
    // Use band scale for ordinal data with repetition
    return "scaleBand";
  }

  // Fallback if data type is not recognized
  return "Unknown scale type";
}

function createEmptyColumnSchema(column, index) {
  return {
    column: column,
    index: index,
    label: column,
    dataTypes: ['string'],
    formats: [{
      type: 'string',
      format: {
        hasRepeat: false,
        longest: 0,
        scale: 'scaleOrdinal'
      }
    }]
  };
}

function isSequential(values) {
  if (values.length < 2) return false;
  
  const sorted = [...values].sort((a, b) => a - b);
  const differences = [];
  
  for (let i = 1; i < sorted.length; i++) {
    differences.push(sorted[i] - sorted[i-1]);
  }
  
  // Check if differences are roughly consistent (within 10% variance)
  const avgDiff = differences.reduce((sum, diff) => sum + diff, 0) / differences.length;
  const variance = differences.every(diff => Math.abs(diff - avgDiff) / avgDiff < 0.1);
  
  return variance;
} 

export function detectOrdinalPattern(values) {
  // Common ordinal patterns to look for
  const ordinalPatterns = [
    // Size patterns
    /^(small|medium|large)$/i,
    /^(low|medium|high)$/i,
    /^(xs|s|m|l|xl|xxl)$/i,
    
    // Quality/Rating patterns
    /^(poor|fair|good|excellent)$/i,
    /^(bad|ok|good|great)$/i,
    /^(terrible|poor|fair|good|excellent)$/i,
    
    // Educational levels
    /^(elementary|middle|high|college|university)$/i,
    /^(primary|secondary|tertiary)$/i,
    
    // Frequency patterns
    /^(never|rarely|sometimes|often|always)$/i,
    /^(none|few|some|many|all)$/i,
    
    // Agreement patterns
    /^(strongly disagree|disagree|neutral|agree|strongly agree)$/i,
    
    // Time periods
    /^(daily|weekly|monthly|yearly)$/i,
    /^(morning|afternoon|evening|night)$/i,
    
    // Numeric strings that imply order
    /^\d+$/,  // pure numbers as strings
    /^(first|second|third|fourth|fifth)$/i,
    /^(1st|2nd|3rd|4th|5th)$/i
  ];
  
  // Check if all values match any ordinal pattern
  const allValuesString = values.join('|').toLowerCase();
  
  for (const pattern of ordinalPatterns) {
    const matches = values.filter(value => pattern.test(value.toLowerCase()));
    if (matches.length === values.length) {
      return true;
    }
  }
  
  // Check for sequential numeric patterns
  const numericValues = values.filter(v => /^\d+$/.test(v)).map(Number);
  if (numericValues.length === values.length && numericValues.length > 1) {
    numericValues.sort((a, b) => a - b);
    // Check if they're sequential or have consistent gaps
    const gaps = numericValues.slice(1).map((val, i) => val - numericValues[i]);
    const uniqueGaps = [...new Set(gaps)];
    if (uniqueGaps.length === 1) {
      return true; // consistent gaps suggest ordinal data
    }
  }
  
  return false; // Default to nominal if no ordinal pattern detected
}

/**
 * Checks if the numbers in an array are equally spaced apart.
 * 
 * @param {number[]} arr - The array of numbers to check.
 * @returns {boolean} - Returns true if the numbers are equally spaced apart, false otherwise.
 */
function arithmeticSequenceCheck(arr) {
  if (arr.length < 2) return true;

  // Sort the array in ascending order
  arr.sort((a, b) => a - b);

  // Calculate the common difference
  const difference = arr[1] - arr[0];

  // Check if each subsequent number maintains the same difference
  for (let i = 2; i < arr.length; i++) {
    if (arr[i] - arr[i - 1] !== difference) {
      return false;
    }
  }

  return true;
}

/**
 * Checks if the numbers in an array are part of a strictly increasing or strictly decreasing sequence.
 * 
 * @param {number[]} arr - The array of numbers to check.
 * @returns {boolean} - Returns true if the numbers are equally spaced apart, false otherwise.
 */
export function checkSequence(arr) {
  if (arr.length < 2) {
    return 'Array must have at least two elements';
  }

  let isIncreasing = true;
  let isDecreasing = true;

  for (let i = 1; i < arr.length; i++) {
    if (arr[i] <= arr[i - 1]) {
      isIncreasing = false;
    }
    if (arr[i] >= arr[i - 1]) {
      isDecreasing = false;
    }
  }

  if (isIncreasing) {
    return true
  } else if (isDecreasing) {
    return true
  } else {
    return false
  }
}

const regexNumFormats = /,|%|[$\xA2-\xA5\u058F\u060B\u09F2\u09F3\u09FB\u0AF1\u0BF9\u0E3F\u17DB\u20A0-\u20BD\uA838\uFDFC\uFE69\uFF04\uFFE0\uFFE1\uFFE5\uFFE6]/g;
const regexCurrencies = /[$\xA2-\xA5\u058F\u060B\u09F2\u09F3\u09FB\u0AF1\u0BF9\u0E3F\u17DB\u20A0-\u20BD\uA838\uFDFC\uFE69\uFF04\uFFE0\uFFE1\uFFE5\uFFE6]/g;

const formatList = [
  "%d-%b-%y", "%d %b %Y", "%d %b", "%d-%B-%y", "%d %B %Y", "%d %B",
  "%Y-%m-%d", "%Y-%m-%dT%H:%M:%S%Z", "%m/%d/%y %H:%M", "%m/%d/%y %I:%M %p",
  "%H:%M:%S", "%b-%y", "%b %y", "%Y %b", "%b %Y", "%B-%y", "%B %y",
  "%Y %B", "%B %Y", "%Y-%y", "%Y/%y", "%b", "%B"
];

const formatSp1 = [
  "%m/%d/%y", "%m/%d/%Y"
];

/**
 * Analyzes the format of date data.
 *
 * @param {Array} data - The input data array.
 * @returns {Object} - The analysis of the date data.
 */
function getDateAnalysis(data) {
  const dateFormat =
    testDateFormatSp1(data) ||
    testDateFormatSp2(data) ||
    testDateFormats(data, formatList) ||
    testDateFormatSp3(data) ||
    testDateFormatSp4(data);

  return {
    valid: !!dateFormat
  };
}

export function getDateFormatting(data) {
  const dateFormat =
    testDateFormatSp1(data) ||
    testDateFormatSp2(data) ||
    testDateFormats(data, formatList) ||
    testDateFormatSp3(data) ||
    testDateFormatSp4(data);

  const dateHasDay = dateFormat.includes("%d") || dateFormat.includes("%H");

  return {
    dateFormat: dateFormat,
    hasDay: dateHasDay,
    scale : determineD3ScaleType(data)
  };
}


/**
 * Tests multiple date formats.
 *
 * @param {Array} data - The input data array.
 * @param {Array} formats - The list of formats to test.
 * @returns {string} - The matched date format.
 */
function testDateFormats(data, formats) {
  let dateParser;
  let dateFormat = formats.find(f => {
    dateParser = timeParse(f);
    return dateParser(String(data[0])); // Convert to string for parsing
  });

  return dateFormat && data.every(d => dateParser(String(d))) ? dateFormat : "";
}

/**
 * Tests specific date formats (sp1).
 *
 * @param {Array} data - The input data array.
 * @returns {string} - The matched date format.
 */
function testDateFormatSp1(data) {
  let format = testDateFormats(data, formatSp1);
  if (format) {
    const isMonthFirst = data.every(d => typeof d === 'string' && d.split("/")[0] <= 12);
    const isDaySecond = data.some(d => typeof d === 'string' && d.split("/")[1] > 12);
    format = isMonthFirst && isDaySecond ? format : "%d/%m/" + format.slice(-2);

    if (isMonthFirst && !isDaySecond) console.warn("Format unclear!!!");
  }
  return format ? format : "";
}

/**
 * Tests specific date formats (sp2).
 *
 * @param {Array} data - The input data array.
 * @returns {string} - The matched date format.
 */
function testDateFormatSp2(data) {
  const format = "%Y";
  const isYear = testDateFormats(data, [format]) === format;
  const is4Digits = data.every(d => typeof d === 'string' && d.length === 4);
  return isYear && is4Digits ? format : "";
}

/**
 * Tests specific date formats (sp3).
 *
 * @param {Array} data - The input data array.
 * @returns {string} - The matched date format.
 */
function testDateFormatSp3(data) {
  const isSp3 = data.every(d => typeof d === 'string' && (d[0] === "Q" || d[5] === "Q") && d.length === 7);
  const dataYear = data.map(d => typeof d === 'string' ? d.replace(/Q([1-4])/g, "").trim() : d);
  const isYear = testDateFormats(dataYear, ["%Y"]) === "%Y";
  return isSp3 && isYear ? "Q*" : "";
}

/**
 * Tests specific date formats (sp4).
 *
 * @param {Array} data - The input data array.
 * @returns {string} - The matched date format.
 */
function testDateFormatSp4(data) {
  const format = "%Y%m%d";
  const isYmd = testDateFormats(data, [format]) === format;
  const isMonth = data.every(ymd => typeof ymd === 'string' && parseInt(ymd.slice(4, 6), 10) >= 1 && parseInt(ymd.slice(4, 6), 10) <= 12);
  const isDay = data.every(ymd => typeof ymd === 'string' && parseInt(ymd.slice(6), 10) >= 1 && parseInt(ymd.slice(6), 10) <= 31);
  return isYmd && isMonth && isDay ? format : "";
}

/**
 * Converts dates to scale values.
 *
 * @param {Array} dates - The input dates array.
 * @param {string} format - The date format.
 * @param {boolean} hasDay - Indicates if the date has a day component.
 * @param {boolean} [isEditor=false] - Indicates if the function is used in an editor context.
 * @returns {Array} - The scale values of the dates.
 */
export function getDateScaleValues(dates, format, hasDay, isEditor = false) {
  let parser;
  const getDateParsed = parser => dates.map(d => parser(d));

  switch (true) {
    case ["%Y"].includes(format):
      return dates.map(d => +d);

    case ["Q*"].includes(format): {
      const indexQ = dates[0].indexOf("Q");
      return dates.map(d => +(d.replace(/Q([1-4])/g, "").trim()) + ((+d[indexQ + 1]) - 1) * 0.25);
    }

    case ["%Y-%y", "%Y/%y"].includes(format):
      return dates.map(d => +d.slice(0, 4));

    case ["%b", "%B"].includes(format):
      parser = timeParse(!isEditor ? format : "%b");
      return getDateParsed(parser).map(d => d.getMonth());

    case !hasDay:
      parser = timeParse(!isEditor ? format : "%b %Y");
      return getDateParsed(parser).map(d => d.getFullYear() + d.getMonth() / 12);

    default:
      parser = timeParse(format);
      return getDateParsed(parser);
  }
}

/**
 * Converts numeric date values to text.
 *
 * @param {number} value - The numeric date value.
 * @param {string} format - The date format.
 * @param {boolean} hasDay - Indicates if the date has a day component.
 * @returns {string|null} - The formatted date text.
 */
export function dateNumToTxt(value, format, hasDay) {
  const year = value.toString().split(".")[0];
  const deci = value % 1; // Get decimal portion
  let date, month, toText;

  switch (true) {
    case ["%Y"].includes(format):
      return value.toString();

    case ["Q*"].includes(format): {
      const quad = (value % 1) * 4 + 1;
      return "Q" + quad + " " + year;
    }

    case ["%Y-%y", "%Y/%y"].includes(format):
      return value + "-" + (value + 1).toString().slice(-2);

    case ["%b", "%B"].includes(format):
      date = new Date(2017, value);
      toText = timeFormat("%b");
      return toText(date);

    case !hasDay:
      month = Math.round(parseFloat(deci * 12));
      date = new Date(year, month || 0);
      toText = timeFormat("%b %Y");
      return toText(date);

    default:
      return null;
  }
}

/**
 * Determines the appropriate date format for a given domain.
 *
 * @param {Array} domain - The date domain.
 * @returns {string} - The appropriate date format.
 */
export function getDateTextFormat(domain) {
  const diffYear = domain[1].getFullYear() - domain[0].getFullYear();
  const diffMonth = domain[1].getMonth() - domain[0].getMonth();
  const diffDay = domain[1].getDate() - domain[0].getDate();
  const diffHour = domain[1].getHours() - domain[0].getHours();

  switch (true) {
    case diffYear > 4:
      return "%Y";
    case diffYear > 0:
      return "%b %Y";
    case diffMonth > 4:
      return "%b";
    case diffMonth > 0:
      return "%d %b";
    case diffDay > 0:
      return "%d %I%p";
    case diffHour > 0:
      return "%H:%M";
    default:
      console.error("A new time format is required!");
      return "";
  }
}




