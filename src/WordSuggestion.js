import * as monaco from "monaco-editor";

import { getTableNameAndTableAlias, convertUnderscoreToAbbreviation } from "./utils/util";

const DEFAULT_SCHEMA = "$default$";
/**
 *
 */
export class WordSuggestion {
    constructor(defineInfo, options) {
        this.defineInfo = defineInfo;
        this.baseSchema = options.schema || DEFAULT_SCHEMA;

        this.allDbObjects = {};
        this.initSuggestion();
        this.dbObjectSuggestion();

        this.addDbObject(this.baseSchema, options.type || "table", options.objectInfos || []);
        this.baseSchema = this.baseSchema.toLowerCase();
    }

    addDbObject(schema, type, objectInfos) {
        if (!type) {
            throw new Error(`object type empty [${type}]`);
        }

        if (!Array.isArray(objectInfos)) {
            throw new Error(`object type not array type : [${typeof objectInfos}]`);
        }

        type = type.toLowerCase() + "s";

        if (schema == "" || schema == null || typeof schema === "undefined") {
            schema = this.baseSchema;
        }

        const schemaLower = schema.toLowerCase();
        if (typeof this.allDbObjects[schemaLower] === "undefined") {
            this.allDbObjects[schemaLower] = { $orginName: schema };
        }

        if (this.allDbObjects[schemaLower][type]) {
            const beforeArr = this.allDbObjects[schemaLower][type].filter((obj1) => !objectInfos.some((obj2) => obj1.name === obj2.name));
            this.allDbObjects[schemaLower][type] = beforeArr.concat(objectInfos);
        } else {
            this.allDbObjects[schemaLower][type] = objectInfos;
        }
    }

    initSuggestion() {
        const defineInfo = this.defineInfo;
        // SQL 자동완성 항목 정의
        monaco.languages.registerCompletionItemProvider("sql", {
            provideCompletionItems: (model, position) => {
                const { lineNumber, column } = position;

                const beforeText = model.getValueInRange({
                    startLineNumber: lineNumber,
                    startColumn: 0,
                    endLineNumber: lineNumber,
                    endColumn: column,
                });

                const tokens = beforeText.trim().split(/\s+/);
                let lastToken = tokens[tokens.length - 1].toLowerCase();

                const suggestions = [];
                if ([".", "from", "join"].includes(lastToken)) {
                    return { suggestions };
                }

                // 찾고자 하는 키워드
                // const keyword = "alter|update|select|join|from|where|set";

                // const prevMatch = model.findPreviousMatch(keyword, position, true, false, null, true);

                // let prevMatchKeyword = "";
                // if (prevMatch && prevMatch.range.startLineNumber <= lineNumber) {
                //     prevMatchKeyword = prevMatch.matches[0].toLowerCase();

                //     if (["update", "from", "join"].includes(prevMatchKeyword)) {
                //         return { suggestions };
                //     }
                // }

                // 자동완성 제안 배열 생성

                let suggestionKind = monaco.languages.CompletionItemKind.Keyword;
                let insertTextRules = "";
                for (const [key, value] of Object.entries(defineInfo)) {
                    insertTextRules = "";
                    if (key == "keywords") {
                        suggestionKind = monaco.languages.CompletionItemKind.Keyword;
                    } else if (key == "functions") {
                        suggestionKind = monaco.languages.CompletionItemKind.Function;
                        insertTextRules = monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet;
                    } else if (key == "dataTypes") {
                        suggestionKind = monaco.languages.CompletionItemKind.Field;
                    } else if (key == "defaultValues") {
                        suggestionKind = monaco.languages.CompletionItemKind.Value;
                    } else {
                        suggestionKind = monaco.languages.CompletionItemKind.TypeParameter;
                    }

                    value.forEach((item) => {
                        let addItem = {
                            label: item,
                            kind: suggestionKind,
                            insertText: item,
                            sortText: "3",
                        };
                        if (insertTextRules) {
                            addItem.insertText = item + "(${0})";
                            addItem.insertTextRules = monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet;
                        } else {
                            addItem.insertText = item;
                        }

                        suggestions.push(addItem);
                    });
                }
                return { suggestions: suggestions };
            },
        });
    }

    dbObjectSuggestion() {
        // SQL 자동완성 항목 정의
        monaco.languages.registerCompletionItemProvider("sql", {
            triggerCharacters: ["."],
            provideCompletionItems: (model, position, context, token) => {
                const { lineNumber, column } = position;

                const beforeText = model.getValueInRange({
                    startLineNumber: lineNumber,
                    startColumn: 0,
                    endLineNumber: lineNumber,
                    endColumn: column,
                });

                const tokens = beforeText.trim().split(/\s+/);
                let lastToken = tokens[tokens.length - 1].toLowerCase();

                // 테이블 또는 스키마가 나와야 되는 키워드
                if (!lastToken.endsWith(".") && ["update", "from", "join"].includes(lastToken)) {
                    return {
                        suggestions: [...this.getDataBaseSuggest(), ...this.getSchemaTableSuggest("", lastToken)],
                    };
                }

                // 찾고자 하는 키워드
                const keyword = "alter|update|select|join|from|where|set|;";

                const prevMatch = model.findPreviousMatch(keyword, position, true, false, null, true);

                let prevMatchKeyword = "";
                if (prevMatch && prevMatch.range.startLineNumber <= lineNumber) {
                    prevMatchKeyword = prevMatch.matches[0].toLowerCase();
                } else {
                    return {
                        suggestions: [],
                    };
                }

                let checkSql = "";
                if (prevMatchKeyword) {
                    const prevMatchRange = prevMatch.range;

                    if (prevMatchKeyword == "select") {
                        let fromMatch = model.findNextMatch("from", position, true, false, null, true);

                        let startLineNumber = prevMatchRange.startLineNumber,
                            startColumn = prevMatchRange.startColumn;

                        if (fromMatch) {
                            (startLineNumber = fromMatch.range.startLineNumber), (startColumn = fromMatch.range.startColumn);
                        }

                        const nextMatch = model.findNextMatch("where|insert|;", position, true, false, null, true);

                        let endLineNumber = model.getLineCount(),
                            endColumn = 10000;
                        if (nextMatch) {
                            endLineNumber = nextMatch.range.startLineNumber;
                            endColumn = nextMatch.range.startColumn;
                        }

                        checkSql = model.getValueInRange({
                            startLineNumber: startLineNumber,
                            startColumn: startColumn,
                            endLineNumber: endLineNumber,
                            endColumn: endColumn,
                        });
                    } else {
                        checkSql = model.getValueInRange({
                            startLineNumber: prevMatchRange.startLineNumber,
                            startColumn: prevMatchRange.startColumn,
                            endLineNumber: lineNumber,
                            endColumn: column,
                        });
                    }
                } else {
                    checkSql = model.getValueInRange({
                        startLineNumber: 1,
                        startColumn: 0,
                        endLineNumber: lineNumber,
                        endColumn: column,
                    });
                }
                let hintArr = [];
                if ("from" == prevMatchKeyword || "update" == prevMatchKeyword) {
                    hintArr.push("SCHEMA");
                    hintArr.push("TABLE");
                } else if ("set" == prevMatchKeyword) {
                    const secondPrevMatch = model.findPreviousMatch(
                        "update",
                        {
                            lineNumber: prevMatch.range.startLineNumber,
                            column: prevMatch.range.startColumn,
                        },
                        true,
                        false,
                        null,
                        true
                    );

                    checkSql = model.getValueInRange({
                        startLineNumber: secondPrevMatch.range.startLineNumber,
                        startColumn: secondPrevMatch.range.startColumn,
                        endLineNumber: prevMatch.range.startLineNumber,
                        endColumn: prevMatch.range.startColumn,
                    });
                    hintArr.push("COLUMN");
                } else if ("select" == prevMatchKeyword) {
                    hintArr.push("COLUMN");
                } else if ("where" == prevMatchKeyword) {
                    hintArr.push("COLUMN");

                    const secondPrevMatch = model.findPreviousMatch(
                        "from|update",
                        {
                            lineNumber: prevMatch.range.startLineNumber,
                            column: prevMatch.range.startColumn,
                        },
                        true,
                        false,
                        null,
                        true
                    );

                    if (secondPrevMatch) {
                        checkSql = model.getValueInRange({
                            startLineNumber: secondPrevMatch.range.startLineNumber,
                            startColumn: secondPrevMatch.range.startColumn,
                            endLineNumber: prevMatch.range.startLineNumber,
                            endColumn: prevMatch.range.startColumn,
                        });
                    }
                }

                if (lastToken.endsWith(".")) {
                    // "." 앞에 글자 추출
                    let dbNameOrAlias = lastToken
                        .slice(0, lastToken.length - 1)
                        .replace(/^.*,/g, "")
                        .toLowerCase();

                    // "." 앞에 특수 문자 가 있으면 특수 문자 제거,
                    dbNameOrAlias = dbNameOrAlias.replace(/[([{\\<\?]+/g, ";;").replace(/.*;;/, "");
                    // 스키마나 데이터베이스명에 뭍은 ",[] 제거
                    dbNameOrAlias = dbNameOrAlias.replace(/["\[\]]+/g, "");

                    const schema = this.getSchema(dbNameOrAlias);

                    // 스키마 체크
                    if (schema) {
                        // 스키마에 해당하는 테이블e
                        return {
                            suggestions: [...this.getSchemaTableSuggest(schema, prevMatchKeyword)],
                        };
                    } else {
                        const tableInfoList = getTableNameAndTableAlias(checkSql);

                        if (tableInfoList) {
                            const currentTable = tableInfoList.find((item) => item.alias === dbNameOrAlias);

                            if (currentTable && currentTable.tableName) {
                                return {
                                    suggestions: this.getTableColumnSuggest(currentTable.tableName),
                                };
                            }
                        }
                    }
                    return {
                        suggestions: [],
                    };
                }

                if ("from" == prevMatchKeyword || "update" == prevMatchKeyword) {
                    lastToken = prevMatchKeyword;
                }

                if (hintArr.length > 0) {
                    let suggestionsArr = [];
                    for (let i = 0; i < hintArr.length; i++) {
                        const hintType = hintArr[i];

                        if ("SCHEMA" == hintType) {
                            suggestionsArr = suggestionsArr.concat(this.getDataBaseSuggest());
                            continue;
                        }

                        if ("TABLE" == hintType) {
                            suggestionsArr = suggestionsArr.concat(this.getSchemaTableSuggest("", lastToken));
                            continue;
                        }

                        if ("COLUMN" == hintType) {
                            const tableInfoList = getTableNameAndTableAlias(checkSql);

                            tableInfoList.forEach((item) => {
                                suggestionsArr = suggestionsArr.concat(this.getTableColumnSuggest(item.tableName));
                            });
                            continue;
                        }
                    }

                    if (suggestionsArr.length > 0) {
                        return {
                            suggestions: suggestionsArr,
                        };
                    }
                }

                return {
                    suggestions: [],
                };
            },
        });
    }

    getSchema(schema) {
        return this.allDbObjects.hasOwnProperty(schema) ? schema : false;
    }

    // schema 테이블
    getSchemaTableSuggest(schema, lastToken) {
        const currentSchema = this.getSchema(schema);

        const returnArr = [];
        if (currentSchema) {
            (this.allDbObjects[currentSchema].tables || []).forEach((table) => {
                returnArr.push(getTableSuggest(currentSchema, table, lastToken));
            });
        } else {
            (this.allDbObjects[this.baseSchema].tables || []).forEach((table) => {
                returnArr.push(getTableSuggest(this.baseSchema, table, lastToken));
            });
        }
        return returnArr;
    }

    /**
     * schema 자동완성
     *
     * @returns {Array} suggestion array
     */
    getDataBaseSuggest() {
        const returnArr = [];

        for (const [key, value] of Object.entries(this.allDbObjects)) {
            if (key != this.baseSchema) {
                returnArr.push({
                    label: value.$orginName,
                    kind: monaco.languages.CompletionItemKind.Class,
                    detail: `<schema>`,
                    sortText: "0",
                    insertText: value.$orginName,
                });
            }
        }

        return returnArr;
    }

    /**
     * 테이블 컬럼
     *
     * @param {String} tableName 테이블명
     * @returns {Array} suggestion array
     */
    getTableColumnSuggest(tableName) {
        const returnArr = [];

        Object.keys(this.allDbObjects).forEach((schema) => {
            (this.allDbObjects[schema].tables || []).forEach((table) => {
                if (tableName === table.name) {
                    let colIdx = 0;
                    table.colList &&
                        table.colList.forEach((column) => {
                            returnArr.push(getColumnSuggestObject(column, tableName, 1000 + ++colIdx));
                        });
                }
            });
        });

        return returnArr;
    }
}

/**
 * 테이블 자동완성 정보
 *
 * @param {String} schema schema
 * @param {Object} table 테이블 정보
 * @param {String} lastToken
 * @returns {Object} 테이블 정보
 */
function getTableSuggest(schema, table, lastToken) {
    const tableName = table.name || "";
    const tableRemarks = table.remarks || "";
    return {
        label: tableName,
        kind: monaco.languages.CompletionItemKind.Struct,
        detail: tableRemarks,
        sortText: "1" + schema,
        insertText: ["from", "join"].includes(lastToken) ? `${tableName} ${convertUnderscoreToAbbreviation(tableName)}` : tableName,
    };
}

/**
 * 컬럼 자동완성 정보
 *
 * @param {Object} column 컬럼 정보
 * @param {String} tableName  테이블명
 * @returns {Object} 컬럼 정보
 */
function getColumnSuggestObject(column, tableName, colIdx) {
    const columnName = column.name ? column.name : "";
    return {
        label: columnName,
        kind: monaco.languages.CompletionItemKind.Field,
        detail: `${column.comment || ""} <${column.typeName}>`,
        sortText: `2_${tableName}${colIdx}`,
        insertText: columnName,
        documentation: `Table : ${tableName}\nType : ${column.typeAndLength}`,
    };
}
