import * as defaultDef from "./ansiSql";

import * as mysql from "./mysql";
import mssql from "./mssql";
import oracle from "./oracle";
import mariadb from "./mariadb";
import postgresql from "./postgresql";

const ALL_DEFINE = { oracle, mariadb, mysql, postgresql, mssql };

/**
 *
 * @param {String} mimeType dbType mysql, mariadb, mysql, postgresql
 * @returns
 */
export function getDefineInfo(mimeType) {
    const mimeTypeDefineInfo = ALL_DEFINE[mimeType];
    if (typeof mimeTypeDefineInfo === "undefined") {
        return {
            keywords: defaultDef.keywords,
            functions: defaultDef.builtinFunctions,
            dataTypes: defaultDef.dataTypes,
            defaultValues: defaultDef.dataTypeDefaultValue,
            etc: [],
        };
    } else {
        return {
            keywords: defaultDef.keywords.concat(mimeTypeDefineInfo.keywords),
            functions: defaultDef.builtinFunctions.concat(mimeTypeDefineInfo.functions),
            dataTypes: defaultDef.dataTypes.concat(mimeTypeDefineInfo.dataTypes),
            defaultValues: defaultDef.dataTypeDefaultValue.concat(mimeTypeDefineInfo.defaultValues),
            etc: mimeTypeDefineInfo.etc || [],
        };
    }
}
