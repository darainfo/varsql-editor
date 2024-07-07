export function merge() {
    var dst = {},
        src,
        p,
        args = [].splice.call(arguments, 0);
    while (args.length > 0) {
        src = args.splice(0, 1)[0];
        if (toString.call(src) == "[object Object]") {
            for (p in src) {
                if (src.hasOwnProperty(p)) {
                    if (toString.call(src[p]) == "[object Object]") {
                        dst[p] = merge(dst[p] || {}, src[p]);
                    } else {
                        dst[p] = src[p];
                    }
                }
            }
        }
    }

    return dst;
}

export function getTableNameAndTableAlias(sql) {
    //sql = sql.toLowerCase();
    sql = sql.replace(/,/gm, " , ");
    sql = sql.replace(/\s+/gm, " ");

    const sqlArr = sql.split(/[\s]/);

    const sqlArrLength = sqlArr.length;

    const tableList = [];
    for (let i = 0; i < sqlArrLength; i++) {
        let item = sqlArr[i].toLowerCase();
        if (["from", "join", ",", "update"].includes(item)) {
            if (i + 1 < sqlArrLength) {
                let tbl = getTableInfo(sqlArr[i + 1]);

                if (i + 2 < sqlArrLength) {
                    let alias = sqlArr[i + 2].toLowerCase();
                    i = i + 2;
                    if ("on" == alias) {
                        tableList.push(tbl);
                        continue;
                    }

                    if ("where" == alias) {
                        break;
                    }

                    if ("as" == alias) {
                        if (i + 3 < sqlArrLength) {
                            i = i + 3;
                            tbl.alias = sqlArr[i + 3].toLowerCase();
                        }
                    } else {
                        tbl.alias = alias;
                    }
                }
                tableList.push(tbl);
            }
        }
    }

    return tableList;
}

export function getTableInfo(tableName) {
    const tableNameArr = tableName.split(".");

    const addItem = {};
    if (tableNameArr.length == 3) {
        addItem["db"] = tableNameArr[0];
        addItem["schema"] = tableNameArr[1];
    } else if (tableNameArr.length == 2) {
        addItem["schema"] = tableNameArr[0];
    }
    addItem["tableName"] = tableNameArr[tableNameArr.length - 1];

    return addItem;
}

/**
 * under score -> Abbreviation
 *
 * @param {String} input "BASE_TABLE"
 * @returns {String} "BT"
 */
export function convertUnderscoreToAbbreviation(input) {
    const words = input.split("_");

    // Initialize an empty string to store the abbreviation
    let abbreviation = "";

    // Iterate through each word and extract the first character
    words.forEach((word) => {
        if (word.length > 0) {
            abbreviation += word.charAt(0); // Append the first character of the word
        }
    });

    return abbreviation.toLowerCase(); // Convert to lowercase if needed
}
